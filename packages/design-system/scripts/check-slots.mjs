#!/usr/bin/env node
/**
 * Source-level backstop for the `data-slot` contract (see scripts/slot-contract.mjs).
 *
 * Reads every `src/components/**\/*.tsx`, finds each exported component (a PascalCase function, or a
 * `forwardRef` / `memo` / arrow bound to one) and requires its source to spell out
 * `data-slot="<kebab-case of its name>"` on an element (or hand that `slot` to a shared frame), or the
 * component to have an ALIASES entry saying why not. Provider components are skipped: they render no
 * element. The element that carries it is the component's root or its documented element; the
 * runtime test checks the markup.
 *
 * No build and no render, so it is fast and cannot flake; what it cannot see is a slot that is
 * present in source but never reaches the DOM. That is `src/slots/slots.test.tsx`'s half.
 *
 *   node scripts/check-slots.mjs          fail on any breach or stale alias
 *   node scripts/check-slots.mjs --list   print every exported component and its root
 */
import ts from 'typescript';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALIASES, KEBAB, kebab } from './slot-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/components');
const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = path.join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.tsx$/.test(f) && !/\.(test|stories)\./.test(f)) files.push(p);
  }
})(root);

/**
 * What the package exports, read from `src/index.ts` and the barrels it star-exports: a set of files
 * whose every export is public, and a set of names exported by name from other files. Internal
 * frames (`FieldFrame`, `SectionGrid`) are in neither, and are not the contract's business.
 */
function publicSurface() {
  const srcRoot = path.resolve(root, '..');
  const wholeFiles = new Set();
  const names = new Set();
  const seen = new Set();
  const resolve = (from, rel) => {
    const base = path.resolve(path.dirname(from), rel);
    return [`${base}.tsx`, `${base}.ts`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')].find((f) => existsSync(f));
  };
  (function visit(file) {
    if (!file || seen.has(file)) return;
    seen.add(file);
    const sf = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    for (const st of sf.statements) {
      if (!ts.isExportDeclaration(st) || !st.moduleSpecifier) continue;
      const target = resolve(file, st.moduleSpecifier.text);
      if (!st.exportClause) {
        if (target) {
          wholeFiles.add(target);
          visit(target);
        }
      } else if (ts.isNamedExports(st.exportClause)) {
        for (const el of st.exportClause.elements) names.add((el.propertyName ?? el.name).text);
      }
    }
  })(path.join(srcRoot, 'index.ts'));
  return { wholeFiles, names, srcRoot };
}

const exported = (n) => n.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
const unwrap = (e) => {
  if (!e) return undefined;
  if (ts.isCallExpression(e)) {
    for (const a of e.arguments) {
      const r = unwrap(a);
      if (r) return r;
    }
    return undefined;
  }
  if (ts.isArrowFunction(e) || ts.isFunctionExpression(e)) return e;
  if (ts.isAsExpression(e) || ts.isParenthesizedExpression(e)) return unwrap(e.expression);
  return undefined;
};

/** Every exported component in a source file, with its returned JSX roots. */
export function scan(file) {
  const text = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const comps = [];
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name && exported(st) && /^[A-Z]/.test(st.name.text)) comps.push({ name: st.name.text, fn: st });
    if (ts.isVariableStatement(st) && exported(st)) {
      for (const d of st.declarationList.declarations) {
        if (ts.isIdentifier(d.name) && /^[A-Z][A-Za-z0-9]*$/.test(d.name.text) && /[a-z]/.test(d.name.text)) {
          const fn = unwrap(d.initializer);
          if (fn) comps.push({ name: d.name.text, fn });
        }
      }
    }
  }
  return comps
    .filter(({ name }) => !/Provider$/.test(name))
    .map(({ name, fn }) => {
      const body = fn.getText(sf);
      // Every slot literal the component names: `data-slot="x"` on an element, or `slot="x"` handed to
      // a shared frame (`SectionGrid`) that spreads it into `data-slot`, or the `'data-slot': 'x'` of a
      // props object spread onto an element.
      const slots = [...body.matchAll(/\bdata-slot['"]?\s*[:=]\s*["']([^"']+)["']|\bslot="([^"]+)"/g)].map((m) => m[1] ?? m[2]);
      return { name, file: path.relative(path.resolve(root, '..', '..'), file), slots, dynamic: /data-slot=\{/.test(body) };
    });
}

export function check() {
  const problems = [];
  const surface = publicSurface();
  const all = files.flatMap((f) => scan(f).filter((c) => surface.wholeFiles.has(f.replace(/\.tsx$/, '.tsx')) || surface.names.has(c.name)));
  for (const c of all) {
    const alias = ALIASES[c.name];
    const want = alias?.slot ?? kebab(c.name);
    for (const slot of c.slots) if (!KEBAB.test(slot)) problems.push(`${c.name} (${c.file}): slot "${slot}" is not kebab-case.`);
    const has = c.slots.includes(want);
    if (alias && (alias.kind === 'data-carrier' || alias.kind === 'no-dom-root' || alias.kind === 'delegate' || alias.kind === 'shared-frame' || alias.kind === 'legacy-name')) {
      // An alias that names a slot the component itself spells out is no longer needed.
      if (has && alias.slot === undefined && !alias.family) problems.push(`${c.name}: stale ALIASES entry, the component now carries data-slot="${want}" itself. Delete it from scripts/slot-contract.mjs.`);
      continue;
    }
    if (!has) problems.push(`${c.name} (${c.file}): no data-slot="${want}" in its source. Add it to the element the component renders (the root, or the documented element), or (only if it cannot carry one) an ALIASES entry in scripts/slot-contract.mjs with a kind and a reason.`);
  }
  for (const name of Object.keys(ALIASES)) {
    if (ALIASES[name].kind !== 'data-carrier' && !all.some((c) => c.name === name)) problems.push(`${name}: ALIASES entry names no exported component. Delete it.`);
  }
  return { problems, all };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { problems, all } = check();
  if (process.argv.includes('--list')) for (const c of all) console.log(`${c.name}\t${c.slots.join(' ') || '-'}`);
  else if (problems.length > 0) {
    console.error(`data-slot contract: ${problems.length} problem(s)\n\n${problems.map((p) => `  - ${p}`).join('\n')}\n\nSee scripts/slot-contract.mjs for the rule.`);
    process.exit(1);
  } else console.log(`data-slot contract: ${all.length} exported components, all rooted on a slot or a documented alias.`);
}
