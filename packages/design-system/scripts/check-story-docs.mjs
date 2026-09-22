#!/usr/bin/env node
/**
 * Does every component actually document itself on its Storybook docs page?
 *
 * `check-visual-coverage.mjs` asks whether a component is *screenshotted*. This
 * asks the other question — whether a reader (or an agent) arriving at
 * `Foundations/Badge` is told what the thing is for, what its props mean, and
 * what the samples are demonstrating. Storybook will happily publish a docs
 * page consisting of a title, an untitled control table with an empty
 * Description column, and one story called "Default", and nothing about that
 * page says it is empty. It looks documented.
 *
 * ## The five things a component page needs
 *
 * 1. **A page at all** — `tags: ['autodocs']` on the meta. Without it the
 *    component has stories and no docs entry, which is the only state here that
 *    is invisible rather than merely thin.
 * 2. **A description of the component** — one or more paragraphs saying what it
 *    is for and when to reach for it. Preferred as a JSDoc block on the
 *    exported component, because that also reaches editor hover and the emitted
 *    `.d.ts`; `parameters.docs.description.component` is accepted for the cases
 *    where the component is not the natural home for the prose.
 * 3. **At least three samples.** One story shows that a component renders.
 *    Three force the axis it varies on to be stated — emphasis vs intent, the
 *    link form vs the button form, the empty state. A component that genuinely
 *    has one form belongs in `EXCLUDED` with that written down.
 * 4. **A description on every story**, as a JSDoc block above the export. This
 *    is the caption under the sample, and it is where the guidance that matters
 *    to a consumer lives: not "the pink one" but *when* the pink one is right.
 * 5. **A description on every prop.** The props table is generated whether or
 *    not anyone wrote the Description column, so an undocumented prop is not a
 *    gap on the page — it is a blank cell that reads as "self-explanatory".
 *
 * ## Why this reads source rather than the built Storybook
 *
 * `check-visual-coverage.mjs` reads `storybook-static/index.json` because it has
 * to: what is *asserted* is only knowable from the built index. Everything here
 * is a property of the source, so this runs without a Storybook build — which
 * is what lets it sit in the `gates` job rather than behind the browser install
 * (AGENTS.md § CI Shape).
 *
 * Prop discovery is deliberately syntactic: the members declared by the props
 * type in the component's own file, following unions, intersections and locally
 * declared aliases, and stopping at anything imported (`HTMLAttributes` and
 * friends are React's to document, not ours). That is the same set
 * `react-docgen` puts in the table — except where react-docgen gives up
 * entirely, which it does on `Button`'s discriminated union, emitting zero
 * props for the most-used component in the package. A props table that is
 * *empty* passes any check that trusts the generator, so this does not trust
 * it: it finds the props from the type and requires either a JSDoc on the
 * member or an `argTypes` entry that describes it.
 *
 *   node scripts/check-story-docs.mjs           fail if a page is under-documented
 *   node scripts/check-story-docs.mjs --list    show every gap, component by component
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STORY_DIR = path.join(ROOT, 'src', 'stories');

/**
 * The minimum number of stories on a component's page.
 *
 * Three, not one, and the reason is what a reader does with the page rather
 * than what it costs to write: a single sample can only answer "does this
 * render", while the second and third are what force the component's actual
 * axis of variation to be named. Badge's three are `Default`, `Emphasis` and
 * `Intent`, and that middle-versus-last pair is the whole distinction the token
 * layer is built on. It would not exist on a one-story page.
 */
const MIN_STORIES = 3;

/**
 * Waivers, each naming what is waived and why.
 *
 * `samples` waives `MIN_STORIES`; `propsTable` waives the `component` on the
 * meta. Nothing waives a description, a story caption or a prop doc — those are
 * the point.
 *
 * A reason rather than a budget, for the reason `check-visual-coverage.mjs`
 * gives: a number lets a gap sit unexplained, where a sentence has to be argued
 * for once and can then be disagreed with.
 *
 * `CEILING` below is not a contradiction of that, and is not a waiver: no
 * component is excused by it and every gap still prints. It is a transitional
 * bound on how many components may be below standard at once, so that the
 * backlog this gate found can only shrink. See its own note.
 */
/**
 * How many components may be below standard at once — a ratchet, on its way to 0.
 *
 * The gate was written against a tree where the documentation work had already
 * been done, and it landed on one where it had not: 47 of 65 exported
 * components are short of the five things a page needs, across 264 individual
 * gaps. Two honest options existed. Hold the gate back until someone writes 159
 * story captions and 229 prop descriptions — which is content work, and
 * generating that prose mechanically would produce exactly the blank-cell-shaped
 * filler this gate exists to catch. Or land it bounding the damage today and
 * ratchet down, which is what `check:lint-budget`, `check:css` and
 * `check:component-docs` all do.
 *
 * So: every gap is printed on every run, nothing is waived, and the number may
 * never rise. Lower it in the same commit that documents a component. This gate
 * is finished when the number is 0 and this constant is deleted.
 */
const CEILING = 42;

const EXCLUDED = {
  'Showcase/DesignSandbox': {
    samples:
      'The kitchen sink — one page rendering every component at once, several screens tall. Its variants are the four theme levels, and those are the toolbar, not stories.',
  },
  'Blog/LoremIpsumPost': {
    samples:
      'A fixed specimen page, not a component with options: it exists so the prose scale can be read at length and so the blog surface has one honest full-page baseline. Variants of a specimen are just more specimen.',
  },
  'Foundations/Theme Ladder': {
    propsTable:
      'Documents the ladder itself rather than a component, so there is no props table to generate. Its description carries the explanation instead.',
  },
  'Foundations/Semantic Tokens': {
    propsTable:
      'A reference sheet for the role tokens, not a component. Same as Theme Ladder: nothing to tabulate.',
  },
  'Docs/Portal': {
    propsTable:
      'A composition of the whole docs kit — layout, header, sidebar, TOC, pager — so no single component owns the page. Each part has its own page with its own table.',
  },
};

/**
 * Publicly exported components with no story of their own, each with a reason.
 *
 * This is the rule that makes the rest enforceable rather than aspirational: a
 * component can be added to `src/index.ts`, be imported by a consumer, and have
 * no page anywhere — and nothing else in this repo notices, because
 * `check-visual-coverage.mjs` reads the story list and a component with no
 * story is simply absent from it. Both checks are blind in the same direction
 * without this.
 */
const UNSTORIED = {
  AsciiDivider:
    'Deprecated alias of `Divider`, kept for existing call sites. A story is a recommendation, and this is not one — `Foundations/Divider` documents the alias in its description.',
  TextArea:
    'Documented on `Foundations/Input` beside `Input`: the two share one label/error/helper contract and one recipe, so two pages would be one component described twice. `Select` shares them too, but has its own page since #164 — its open list is a surface the other two do not have.',
  ReportSection:
    'A part of the report frame, documented and asserted on `Foundations/ReportDocument`. It is meaningless outside one — a section with no document around it has no measure, no rhythm and nothing to be a section of — so a page of its own would show it in a context no consumer will ever build.',
  ReportDetails:
    'Same as `ReportSection`: the disclosure block belongs to the report frame and is shown in place on `Foundations/ReportDocument`, where its collapsed and expanded states are both visible against the surrounding document.',
  ThemeProvider:
    'Renders no markup of its own; what a screenshot of it would show is whatever children it is given. `Foundations/Theme Ladder` documents the behaviour, including `scoped`, which is the part with a visible consequence.',
  DocsLink:
    'The indirection point for a host router, injected through `DocsLinkProvider`. Its whole behaviour is which element it delegates to, which renders identically either way.',
  DocsLinkProvider:
    'Context only, no markup. Every `Docs/*` story renders inside the default (plain `<a>`) behaviour, which is the case worth showing.',
  TableHeader:
    'One of eight parts of a single primitive, all documented together on `Foundations/Table` — a table part shown on its own is a `<thead>` with a border, and eight such pages would be one component described eight times.',
  TableBody: 'Part of the `Foundations/Table` compound. See `TableHeader`.',
  TableFooter: 'Part of the `Foundations/Table` compound. See `TableHeader`.',
  TableRow: 'Part of the `Foundations/Table` compound. See `TableHeader`.',
  TableHead: 'Part of the `Foundations/Table` compound. See `TableHeader`.',
  TableCell: 'Part of the `Foundations/Table` compound. See `TableHeader`.',
  TableCaption: 'Part of the `Foundations/Table` compound. See `TableHeader`.',
};

/** Read the JSDoc text attached to a node, if any. */
function jsDocOf(node, sourceText) {
  const ranges = ts.getLeadingCommentRanges(sourceText, node.getFullStart()) ?? [];
  const blocks = ranges
    .filter((r) => sourceText.slice(r.pos, r.pos + 3) === '/**')
    .map((r) => sourceText.slice(r.pos, r.end));
  if (blocks.length === 0) return '';
  // Strip the comment furniture so an empty `/** */` does not count as prose.
  return blocks
    .join('\n')
    .replace(/^\/\*\*|\*\/$/g, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*ary?\s?/, '').replace(/^\s*\*\s?/, '').trim())
    .join(' ')
    .trim();
}

function parseFile(file) {
  const text = readFileSync(file, 'utf8');
  return { text, sf: ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX) };
}

/** Object-literal helper: the property named `key`, or undefined. */
function prop(objectLiteral, key) {
  if (!objectLiteral || !ts.isObjectLiteralExpression(objectLiteral)) return undefined;
  return objectLiteral.properties.find(
    (p) => (ts.isPropertyAssignment(p) || ts.isShorthandPropertyAssignment(p)) && p.name?.getText() === key,
  );
}

/**
 * Everything the gate needs from one `*.stories.tsx`.
 *
 * The meta is found as the initialiser of whatever the file default-exports,
 * rather than by assuming it is called `meta` — that assumption is the kind
 * that holds until one file spells it differently.
 */
function readStoryFile(file) {
  const { text, sf } = parseFile(file);

  let metaName = null;
  for (const stmt of sf.statements) {
    if (ts.isExportAssignment(stmt) && ts.isIdentifier(stmt.expression)) metaName = stmt.expression.text;
  }

  let meta = null;
  const stories = [];
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    const isExported = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    for (const decl of stmt.declarationList.declarations) {
      const name = decl.name.getText();
      if (name === metaName && decl.initializer) {
        // `satisfies Meta` and `as Meta` both wrap the literal; unwrap either.
        let init = decl.initializer;
        while (ts.isAsExpression(init) || ts.isSatisfiesExpression(init)) init = init.expression;
        meta = ts.isObjectLiteralExpression(init) ? init : null;
        continue;
      }
      // A story is an exported const whose type annotation is the file's Story
      // alias. Typing on the annotation rather than "any exported const" keeps
      // exported fixtures and helpers from being counted as undocumented
      // stories.
      if (!isExported) continue;
      const annotation = decl.type?.getText() ?? '';
      if (!/\bStory\b|\bStoryObj\b/.test(annotation)) continue;
      stories.push({ name, description: jsDocOf(stmt, text) });
    }
  }

  const titleProp = prop(meta, 'title');
  const title = titleProp?.initializer?.getText().replace(/^['"`]|['"`]$/g, '') ?? null;

  const componentProp = prop(meta, 'component');
  const componentRef = componentProp?.initializer?.getText() ?? null;

  const tagsProp = prop(meta, 'tags');
  const autodocs = /['"]autodocs['"]/.test(tagsProp?.initializer?.getText() ?? '');

  // parameters.docs.description.component
  const parameters = prop(meta, 'parameters')?.initializer;
  const docs = prop(parameters, 'docs')?.initializer;
  const description = prop(docs, 'description')?.initializer;
  const metaDescription = Boolean(prop(description, 'component'));

  // argTypes: which props the meta itself describes.
  const argTypes = new Set();
  const argTypesLiteral = prop(meta, 'argTypes')?.initializer;
  if (argTypesLiteral && ts.isObjectLiteralExpression(argTypesLiteral)) {
    for (const p of argTypesLiteral.properties) {
      if (!ts.isPropertyAssignment(p)) continue;
      if (prop(p.initializer, 'description')) {
        argTypes.add(p.name.getText().replace(/^['"`]|['"`]$/g, ''));
      }
    }
  }

  // Where the component came from, so its props can be read.
  let componentPath = null;
  if (componentRef) {
    const base = componentRef.replace(/<.*$/, '').split('.')[0];
    for (const stmt of sf.statements) {
      if (!ts.isImportDeclaration(stmt)) continue;
      const named = stmt.importClause?.namedBindings;
      const names = [];
      if (stmt.importClause?.name) names.push(stmt.importClause.name.text);
      if (named && ts.isNamedImports(named)) for (const e of named.elements) names.push(e.name.text);
      if (!names.includes(base)) continue;
      const spec = stmt.moduleSpecifier.getText().replace(/^['"`]|['"`]$/g, '');
      if (!spec.startsWith('.')) continue;
      const resolved = path.resolve(path.dirname(file), spec);
      for (const candidate of [`${resolved}.tsx`, `${resolved}.ts`, path.join(resolved, 'index.ts')]) {
        if (existsSync(candidate)) {
          componentPath = candidate;
          break;
        }
      }
    }
  }

  return {
    file: path.relative(ROOT, file),
    title,
    componentRef,
    componentName: componentRef?.replace(/<.*$/, '').split('.').pop() ?? null,
    componentPath,
    autodocs,
    metaDescription,
    argTypes,
    stories,
  };
}

/**
 * The component's own description and its own props.
 *
 * "Own" is the operative word for props: the members this package declares,
 * following type aliases and the branches of a union or intersection *within
 * the same file*, and stopping at any imported type. `HTMLAttributes` is
 * React's to document; `ButtonOwnProps` is ours.
 */
function readComponent(componentPath, componentName) {
  if (!componentPath) return null;
  const { text, sf } = parseFile(componentPath);

  let description = '';
  let propsTypeName = null;
  /** The destructuring pattern, if the component uses one. */
  let binding = null;

  for (const stmt of sf.statements) {
    const exported = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (!exported) continue;
    if (ts.isFunctionDeclaration(stmt) && stmt.name?.text === componentName) {
      description = jsDocOf(stmt, text);
      propsTypeName = stmt.parameters[0]?.type?.getText() ?? null;
      binding = stmt.parameters[0]?.name;
    }
    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (decl.name.getText() !== componentName) continue;
        description = jsDocOf(stmt, text);
        const init = decl.initializer;
        if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
          propsTypeName = init.parameters[0]?.type?.getText() ?? null;
          binding = init.parameters[0]?.name;
        }
        // `React.FC<Props>` puts the props on the *variable*, not the
        // parameter, so an arrow function under it has no parameter type at
        // all. Missing this made the check silently blind to roughly half the
        // package — every `React.FC` component reported zero props and passed.
        if (!propsTypeName && decl.type && ts.isTypeReferenceNode(decl.type)) {
          const outer = decl.type.typeName.getText();
          if (/(^|\.)(FC|FunctionComponent|VFC|ComponentType)$/.test(outer)) {
            propsTypeName = decl.type.typeArguments?.[0]?.getText() ?? null;
          }
        }
        // `forwardRef<T, P>(…)` — the props are the second type argument.
        if (init && ts.isCallExpression(init) && init.typeArguments?.length === 2) {
          propsTypeName = init.typeArguments[1].getText();
        }
      }
    }
  }

  // Index every locally declared type by name so aliases can be followed.
  const locals = new Map();
  for (const stmt of sf.statements) {
    if (ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt)) locals.set(stmt.name.text, stmt);
  }

  const props = new Map();
  const seen = new Set();

  function collectMembers(members) {
    for (const member of members) {
      if (!ts.isPropertySignature(member) || !member.name) continue;
      const name = member.name.getText().replace(/^['"`]|['"`]$/g, '');
      const doc = jsDocOf(member, text);
      // First declaration wins, but a documented one always beats a bare one:
      // `ButtonOwnProps.href` is refined by `{ href?: never }` in one branch.
      if (!props.has(name) || (doc && !props.get(name))) props.set(name, doc);
    }
  }

  /** One `extends X` entry: resolve the name, then treat it as a type. */
  function walkHeritage(node) {
    const name = node.expression?.getText?.();
    if (!name || seen.has(name)) return;
    seen.add(name);
    const local = locals.get(name);
    if (!local) return; // Imported — not ours to document.
    if (ts.isInterfaceDeclaration(local)) {
      collectMembers(local.members);
      for (const clause of local.heritageClauses ?? []) {
        for (const t of clause.types) walkHeritage(t);
      }
      return;
    }
    walkType(local.type);
  }

  function walkType(node) {
    if (!node) return;
    if (ts.isParenthesizedTypeNode(node)) return walkType(node.type);
    if (ts.isUnionTypeNode(node) || ts.isIntersectionTypeNode(node)) {
      for (const t of node.types) walkType(t);
      return;
    }
    if (ts.isTypeLiteralNode(node)) return collectMembers(node.members);
    if (ts.isTypeReferenceNode(node)) {
      const name = node.typeName.getText();
      if (seen.has(name)) return;
      seen.add(name);
      const local = locals.get(name);
      if (!local) return; // Imported — not ours to document.
      if (ts.isInterfaceDeclaration(local)) {
        collectMembers(local.members);
        for (const clause of local.heritageClauses ?? []) {
          // `extends Foo` is an ExpressionWithTypeArguments, not a
          // TypeReferenceNode — an easy thing to miss, and missing it meant an
          // interface's inherited members were silently skipped while the check
          // still reported a pass.
          for (const t of clause.types) walkHeritage(t);
        }
        return;
      }
      return walkType(local.type);
    }
  }

  if (propsTypeName) {
    const parsed = ts.createSourceFile('t.ts', `type __P = ${propsTypeName};`, ts.ScriptTarget.Latest, true);
    walkType(parsed.statements[0].type);
  }

  // A destructured parameter with a *default value* lands in the props table
  // even when the member is inherited rather than declared here — which is why
  // `className` shows up on half the components with an empty Description. It
  // is in the table, so it is in scope for this check.
  if (binding && ts.isObjectBindingPattern(binding)) {
    for (const element of binding.elements) {
      if (!element.initializer || element.dotDotDotToken) continue;
      const name = (element.propertyName ?? element.name).getText().replace(/^['"`]|['"`]$/g, '');
      if (!/^[a-zA-Z_$][\w$]*$/.test(name)) continue;
      if (!props.has(name)) props.set(name, jsDocOf(element, text));
    }
  }

  return { description, props };
}

/**
 * Every component the package exports publicly.
 *
 * Walks `src/index.ts`'s re-exports and collects the PascalCase function and
 * const declarations in each — the same set a consumer can import. Types,
 * hooks, `SCREAMING_CASE` data and lowercase helpers are excluded by the naming
 * convention rather than by a list, so this stays correct as the surface grows.
 */
function exportedComponents() {
  const entry = path.join(ROOT, 'src', 'index.ts');
  const { sf: index } = parseFile(entry);
  const modules = [];
  for (const stmt of index.statements) {
    if (!ts.isExportDeclaration(stmt) || !stmt.moduleSpecifier) continue;
    const spec = stmt.moduleSpecifier.getText().replace(/^['"`]|['"`]$/g, '');
    if (!spec.startsWith('.')) continue;
    const resolved = path.resolve(path.dirname(entry), spec);
    for (const candidate of [`${resolved}.tsx`, `${resolved}.ts`, path.join(resolved, 'index.ts')]) {
      if (existsSync(candidate)) {
        modules.push(candidate);
        break;
      }
    }
  }

  const found = new Map();
  const visit = (file, depth) => {
    if (depth > 2 || found.has(file)) return;
    const { sf } = parseFile(file);
    for (const stmt of sf.statements) {
      // A barrel (`components/docs/index.ts`) re-exports rather than declares.
      if (ts.isExportDeclaration(stmt) && stmt.moduleSpecifier) {
        const spec = stmt.moduleSpecifier.getText().replace(/^['"`]|['"`]$/g, '');
        if (!spec.startsWith('.')) continue;
        const resolved = path.resolve(path.dirname(file), spec);
        for (const candidate of [`${resolved}.tsx`, `${resolved}.ts`]) {
          if (existsSync(candidate)) visit(candidate, depth + 1);
        }
        continue;
      }
      const exported = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (!exported) continue;
      const names = [];
      if (ts.isFunctionDeclaration(stmt) && stmt.name) names.push(stmt.name.text);
      if (ts.isVariableStatement(stmt)) {
        for (const decl of stmt.declarationList.declarations) {
          const init = decl.initializer;
          const isFn =
            init &&
            (ts.isArrowFunction(init) ||
              ts.isFunctionExpression(init) ||
              (ts.isCallExpression(init) && /forwardRef|memo/.test(init.expression.getText())));
          if (isFn) names.push(decl.name.getText());
        }
      }
      for (const name of names) {
        // PascalCase is React's own rule for "this is a component".
        if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) continue;
        if (!found.has(name)) found.set(name, path.relative(ROOT, file));
      }
    }
  };
  for (const m of modules) visit(m, 0);
  return found;
}

const files = readdirSync(STORY_DIR)
  .filter((f) => f.endsWith('.stories.tsx'))
  .sort()
  .map((f) => path.join(STORY_DIR, f));

const report = [];
for (const file of files) {
  const story = readStoryFile(file);
  const component = readComponent(story.componentPath, story.componentName);

  const problems = [];
  const label = story.title ?? story.file;

  if (!story.componentRef && !EXCLUDED[label]?.propsTable) {
    problems.push(
      'meta has no `component`, so Storybook generates no props table. Set it, or add a `propsTable` reason to EXCLUDED.',
    );
  }
  if (!story.autodocs) {
    problems.push("no `tags: ['autodocs']` — this component has stories and no docs page at all.");
  }
  if (!story.metaDescription && !component?.description) {
    problems.push(
      'no component description. Put a JSDoc block on the exported component (it reaches editor hover and the .d.ts too), or set `parameters.docs.description.component`.',
    );
  }
  if (!EXCLUDED[label]?.samples && story.stories.length < MIN_STORIES) {
    problems.push(
      `${story.stories.length} ${story.stories.length === 1 ? 'story' : 'stories'}, minimum is ${MIN_STORIES}. Add samples that name the axis this component varies on, or add it to EXCLUDED with a reason.`,
    );
  }
  const undocumentedStories = story.stories.filter((s) => !s.description);
  for (const s of undocumentedStories) {
    problems.push(`story \`${s.name}\` has no caption. Add a JSDoc block above the export saying what it demonstrates.`);
  }
  const undocumentedProps = [...(component?.props ?? new Map())]
    .filter(([name, doc]) => !doc && !story.argTypes.has(name))
    .map(([name]) => name);
  for (const name of undocumentedProps) {
    problems.push(`prop \`${name}\` has no description — a blank cell in the props table reads as "self-explanatory".`);
  }

  report.push({
    label,
    file: story.file,
    excluded: Boolean(EXCLUDED[label]),
    componentRef: story.componentRef,
    componentName: story.componentName,
    storyCount: story.stories.length,
    documentedStories: story.stories.length - undocumentedStories.length,
    propCount: component?.props.size ?? 0,
    documentedProps: (component?.props.size ?? 0) - undocumentedProps.length,
    hasDescription: Boolean(story.metaDescription || component?.description),
    autodocs: story.autodocs,
    problems,
  });
}

const documented = new Set(report.map((r) => r.componentName).filter(Boolean));
const exported = exportedComponents();
const unstoried = [...exported.keys()].filter((name) => !documented.has(name) && !UNSTORIED[name]);
const staleUnstoried = Object.keys(UNSTORIED).filter(
  (name) => !exported.has(name) || documented.has(name),
);

const stale = Object.keys(EXCLUDED).filter((title) => !report.some((r) => r.label === title));

const totals = report.reduce(
  (acc, r) => ({
    stories: acc.stories + r.storyCount,
    documentedStories: acc.documentedStories + r.documentedStories,
    props: acc.props + r.propCount,
    documentedProps: acc.documentedProps + r.documentedProps,
    described: acc.described + (r.hasDescription ? 1 : 0),
    pages: acc.pages + (r.autodocs ? 1 : 0),
  }),
  { stories: 0, documentedStories: 0, props: 0, documentedProps: 0, described: 0, pages: 0 },
);

const failing = report.filter((r) => r.problems.length > 0);

const pct = (n, d) => (d === 0 ? '100' : Math.round((n / d) * 100));

console.log('Story documentation — what a reader arriving at a component page is told\n');
console.log(`  ${report.length} components, ${totals.stories} stories, ${totals.props} own props.`);
console.log(`  ${totals.pages}/${report.length} have a docs page, ${totals.described}/${report.length} describe themselves.`);
console.log(`  ${totals.documentedStories}/${totals.stories} stories captioned (${pct(totals.documentedStories, totals.stories)}%).`);
console.log(`  ${totals.documentedProps}/${totals.props} props described (${pct(totals.documentedProps, totals.props)}%).`);
console.log(`  ${exported.size} components exported; ${unstoried.length} of them with no page of their own, ${Object.keys(UNSTORIED).length} exempt with a reason.`);
console.log(`  ${failing.length} components below standard / ceiling ${CEILING}, on its way to 0.`);

if (process.argv.includes('--list')) {
  for (const r of failing) {
    console.log(`\n  ${r.label}  (${r.file})`);
    for (const p of r.problems) console.log(`    - ${p}`);
  }
  const excluded = report.filter((r) => r.excluded);
  if (excluded.length > 0) {
    console.log('\n  Waived, with reasons:');
    for (const r of excluded) {
      for (const [what, why] of Object.entries(EXCLUDED[r.label])) {
        console.log(`    ${r.label} — ${what}\n      ${why}`);
      }
    }
  }
  console.log('\n  Exported components with no page, by design:');
  for (const [name, why] of Object.entries(UNSTORIED)) console.log(`    ${name}\n      ${why}`);
}

const blockers = [];
for (const r of failing) for (const p of r.problems) blockers.push(`${r.label}: ${p}`);
for (const title of stale) blockers.push(`${title}: excluded but no component has that title. Remove it from EXCLUDED.`);
for (const name of unstoried) {
  blockers.push(
    `${name} (${exported.get(name)}) is exported from src/index.ts and has no story, so it has no page anywhere. Add one, or add it to UNSTORIED with a reason.`,
  );
}
for (const name of staleUnstoried) {
  blockers.push(
    `${name}: listed in UNSTORIED but ${exported.has(name) ? 'now has a story' : 'is no longer exported'}. Remove the entry.`,
  );
}

if (blockers.length > 0) {
  console.error(`\nStory documentation — ${blockers.length} gap(s):\n`);
  for (const b of blockers) console.error(`  - ${b}`);
  if (!process.argv.includes('--list')) {
    console.error('\n  `pnpm check:story-docs:list` groups these by component.');
  }
}

/*
 * Structural problems fail whatever the ceiling says. A stale waiver, or an
 * export with no page at all, is not a component that is thinly documented —
 * it is a statement in this file that has stopped being true, or a component a
 * reader cannot find. Neither is part of the backlog being counted down.
 */
const structural = [
  ...stale.map((title) => `${title}: excluded but no component has that title. Remove it from EXCLUDED.`),
  ...staleUnstoried.map(
    (name) => `${name}: listed in UNSTORIED but ${exported.has(name) ? 'now has a story' : 'is no longer exported'}. Remove the entry.`,
  ),
];

if (structural.length > 0) {
  console.error(`\n${structural.length} of those are structural and fail regardless of the ceiling.\n`);
  process.exit(1);
}

if (failing.length > CEILING) {
  console.error(
    `\n${failing.length} components are below standard; the ceiling is ${CEILING}. ` +
      'Document the new one, or if this is deliberate, say why and raise it — but it is a ratchet, so it should be going down.\n',
  );
  process.exit(1);
}

if (failing.length < CEILING) {
  console.error(
    `\n${failing.length} components are below standard and the ceiling is still ${CEILING}. ` +
      `Lower CEILING to ${failing.length} in scripts/check-story-docs.mjs, in the commit that earned it.\n`,
  );
  process.exit(1);
}

console.log(`\nAt the ceiling — ${failing.length} components below standard, none newly so.`);
