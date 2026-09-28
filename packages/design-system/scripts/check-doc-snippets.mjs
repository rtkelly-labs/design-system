/**
 * Do the code snippets in the docs compile against the published API?
 *
 * `README.md` told consumers to write `<ThemeProvider defaultTheme="dark">` for
 * months. Two bugs in one line: the prop is `defaultLevel`, and `dark` stopped
 * being a level when #123 collapsed the ladder to `midnight` and `sketch`. It
 * was the first thing a new consumer would copy, and nothing could see it —
 * `check:docs` reads these same files but compares *figures*, and a prop name is
 * not a figure.
 *
 * This is the complementary check: every JSX attribute written on a component
 * this package exports must exist on that component's props, and every string
 * literal assigned to a closed string union must belong to that union.
 *
 * ## What this does not do
 *
 * It is not a typechecker. It does not evaluate the snippets, follow imports, or
 * understand spread props — a gate that claimed to compile prose would be
 * claiming more than it checks. It reads attribute names on a known component,
 * literal values for closed string unions, and level names in those attributes.
 *
 * Props on host elements (`<main style=…>`) and on components from other
 * packages (`<Link to=…>`) are skipped, because the API baseline says nothing
 * about them.
 *
 *   node scripts/check-doc-snippets.mjs           verify
 *   node scripts/check-doc-snippets.mjs --list    print what it found
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = ['README.md', 'DESIGN.md', 'AGENTS.md', 'CONTEXT.md'];
const API = readFileSync(path.join(ROOT, 'api/index.d.ts'), 'utf8');

/** Level names, read from the source rather than repeated here. */
const LEVELS = [
  ...readFileSync(path.join(ROOT, 'src/theme/levels.ts'), 'utf8')
    .match(/export const THEME_LEVELS = \[([^\]]*)\]/)[1]
    .matchAll(/'([a-z]+)'/g),
].map((m) => m[1]);

/**
 * Props declared for each exported component, from the API baseline.
 *
 * The baseline is the right source: it is what a consumer installs, it is
 * already gated by `check:api`, and reading it means this check cannot disagree
 * with that one.
 */
function declaredProps() {
  const sourceFile = ts.createSourceFile('api/index.d.ts', API, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  const interfaces = new Map();
  const typeAliases = new Map();

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isInterfaceDeclaration(node)) {
      interfaces.set(node.name.text, node);
    } else if (ts.isTypeAliasDeclaration(node)) {
      typeAliases.set(node.name.text, node);
    }
  });

  function getPropertyName(nameNode) {
    if (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode)) {
      return nameNode.text;
    }
    return nameNode.getText(sourceFile);
  }

  function resolveTypeName(name, seen = new Set()) {
    if (seen.has(name)) return [];
    seen.add(name);

    const props = [];
    if (interfaces.has(name)) {
      const iface = interfaces.get(name);
      for (const member of iface.members) {
        if (ts.isPropertySignature(member)) {
          props.push(getPropertyName(member.name));
        }
      }
      if (iface.heritageClauses) {
        for (const hc of iface.heritageClauses) {
          for (const t of hc.types) {
            props.push(...extractPropsFromTypeNode(t, seen));
          }
        }
      }
    }

    if (typeAliases.has(name)) {
      const alias = typeAliases.get(name);
      props.push(...extractPropsFromTypeNode(alias.type, seen));
    }

    return [...new Set(props)];
  }

  /**
   * Property-preserving utility types: `Omit`/`Partial`/`Required` keep the
   * base prop surface, and `Pick` narrows it to its literal key list. Left
   * unresolved, a component declared as `Pick<BaseProps, …>` would vanish from
   * the roster and its documented props would go unchecked — silently weaker
   * than the regex it replaced, which followed the base type.
   */
  function unwrapUtilityType(name, typeArguments, seen) {
    if (!typeArguments?.length) return null;
    switch (name) {
      case 'Omit':
      case 'Partial':
      case 'Required':
        return extractPropsFromTypeNode(typeArguments[0], seen);
      case 'Pick': {
        const base = extractPropsFromTypeNode(typeArguments[0], seen);
        const keys = new Set();
        const keyArg = typeArguments[1];
        const literals =
          keyArg && ts.isUnionTypeNode(keyArg)
            ? keyArg.types
            : keyArg
              ? [keyArg]
              : [];
        for (const t of literals) {
          if (ts.isLiteralTypeNode(t) && ts.isStringLiteralLike(t.literal)) {
            keys.add(t.literal.text);
          } else {
            return base;
          }
        }
        return base.filter((p) => keys.has(p));
      }
      default:
        return null;
    }
  }

  function extractPropsFromTypeNode(typeNode, seen = new Set()) {
    if (!typeNode) return [];

    if (ts.isTypeLiteralNode(typeNode)) {
      const props = [];
      for (const member of typeNode.members) {
        if (ts.isPropertySignature(member)) {
          props.push(getPropertyName(member.name));
        }
      }
      return props;
    }

    if (ts.isIntersectionTypeNode(typeNode) || ts.isUnionTypeNode(typeNode)) {
      return typeNode.types.flatMap((t) => extractPropsFromTypeNode(t, seen));
    }

    if (ts.isParenthesizedTypeNode(typeNode)) {
      return extractPropsFromTypeNode(typeNode.type, seen);
    }

    if (ts.isTypeReferenceNode(typeNode)) {
      const typeName = ts.isIdentifier(typeNode.typeName)
        ? typeNode.typeName.text
        : typeNode.typeName.right.text;

      const utility = unwrapUtilityType(typeName, typeNode.typeArguments, seen);
      if (utility) return utility;
      return resolveTypeName(typeName, seen);
    }

    if (ts.isExpressionWithTypeArguments(typeNode)) {
      const exprName = ts.isIdentifier(typeNode.expression)
        ? typeNode.expression.text
        : typeNode.expression.getText(sourceFile);
      const utility = unwrapUtilityType(exprName, typeNode.typeArguments, seen);
      if (utility) return utility;
      return resolveTypeName(exprName, seen);
    }

    return [];
  }

  function findPropsTypeReferences(node) {
    const refs = [];
    function visit(n) {
      if (ts.isTypeReferenceNode(n)) {
        const text = n.typeName.getText(sourceFile);
        if (text.endsWith('Props')) refs.push(text);
      }
      ts.forEachChild(n, visit);
    }
    visit(node);
    return [...new Set(refs)];
  }

  const byComponent = new Map();

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) {
      const comp = node.name.text;
      const propTypes = findPropsTypeReferences(node);
      const props = propTypes.flatMap((t) => resolveTypeName(t, new Set()));
      if (props.length) byComponent.set(comp, [...new Set(props)]);
    } else if (ts.isVariableStatement(node)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && /^[A-Z]/.test(decl.name.text)) {
          const comp = decl.name.text;
          const propTypes = findPropsTypeReferences(decl);
          const props = propTypes.flatMap((t) => resolveTypeName(t, new Set()));
          if (props.length) byComponent.set(comp, [...new Set(props)]);
        }
      }
    }
  });

  for (const name of [...interfaces.keys(), ...typeAliases.keys()]) {
    if (name.endsWith('Props')) {
      const comp = name.replace(/Props$/, '');
      if (!byComponent.has(comp)) {
        const props = resolveTypeName(name, new Set());
        if (props.length) byComponent.set(comp, props);
      }
    }
  }

  return byComponent;
}

const COMPONENTS = declaredProps();

/** Closed string unions, resolved through aliases and inherited props by TypeScript. */
function declaredStringValues() {
  const apiPath = path.join(ROOT, 'api/index.d.ts');
  const program = ts.createProgram([apiPath], { skipLibCheck: true });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(apiPath);
  const values = new Map();
  ts.forEachChild(source, (node) => {
    if ((!ts.isInterfaceDeclaration(node) && !ts.isTypeAliasDeclaration(node))
      || !node.name.text.endsWith('Props')) return;
    const component = node.name.text.replace(/Props$/, '');
    const props = new Map();
    for (const property of checker.getTypeAtLocation(node).getProperties()) {
      const type = checker.getTypeOfSymbolAtLocation(property, node);
      const members = type.isUnion() ? type.types : [type];
      const literals = members.filter((member) => member.flags & ts.TypeFlags.StringLiteral);
      if (literals.length && members.every((member) =>
        member.flags & (ts.TypeFlags.StringLiteral | ts.TypeFlags.Undefined))) {
        props.set(property.name, literals.map((member) => member.value));
      }
    }
    values.set(component, props);
  });
  return values;
}

const STRING_VALUES = declaredStringValues();
const problems = [];
const seen = [];

for (const file of DOCS) {
  const text = readFileSync(path.join(ROOT, file), 'utf8');
  for (const fence of text.matchAll(/```(?:tsx|jsx)\n([\s\S]*?)```/g)) {
    const snippet = fence[1];
    const line0 = text.slice(0, fence.index).split('\n').length;

    for (const tag of snippet.matchAll(/<([A-Z]\w+)((?:\s+[^<>]*?)?)\/?>/g)) {
      const [, name, attrs] = tag;
      const props = COMPONENTS.get(name);
      if (!props) continue; // not ours — nothing to check it against
      const at = line0 + snippet.slice(0, tag.index).split('\n').length - 1;

      for (const attr of attrs.matchAll(/(?:^|\s)([a-zA-Z][\w-]*)=/g)) {
        const prop = attr[1];
        if (prop.includes('-') || prop.startsWith('aria') || prop.startsWith('data')) continue;
        seen.push(`${file}:${at} <${name} ${prop}>`);
        if (!props.includes(prop)) {
          problems.push(
            `${file}:${at} — <${name}> has no prop \`${prop}\`. Declared: ${props.join(', ') || '(none)'}`
          );
        }
      }

      // A string literal assigned to a closed union must be one of its members.
      for (const literal of attrs.matchAll(/([a-zA-Z][\w-]*)="([^"]*)"/g)) {
        const allowed = STRING_VALUES.get(name)?.get(literal[1]);
        if (allowed && !allowed.includes(literal[2])) {
          problems.push(
            `${file}:${at} — <${name} ${literal[1]}="${literal[2]}"> must be one of: ${allowed.join(', ')}`
          );
        }
      }
      // Keep the level-name guard even where inherited props are unresolved.
      for (const lit of attrs.matchAll(/([a-zA-Z]*(?:[Ll]evel|[Tt]heme))="([a-z]+)"/g)) {
        if (!LEVELS.includes(lit[2])) {
          problems.push(
            `${file}:${at} — <${name} ${lit[1]}="${lit[2]}"> is not a level. Levels are: ${LEVELS.join(', ')}`
          );
        }
      }
    }
  }
}

if (process.argv.includes('--list')) {
  console.log(`Levels: ${LEVELS.join(', ')}`);
  console.log(`Components with declared props: ${COMPONENTS.size}`);
  for (const s of seen) console.log(`  ${s}`);
}

if (problems.length) {
  console.error(`Documentation snippets disagree with the published API — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nThe snippets are the first thing a consumer copies. Fix the doc, or the API.');
  process.exit(1);
}

console.log(`Doc snippets OK — ${seen.length} props checked across ${DOCS.length} documents.`);
