/**
 * Does every component meet the contract?
 *
 * There was no stated contract for what a component in this package *is*, and
 * the result was measurable: **1 of 43 forwards a ref**, 29 compose classes with
 * `recipe()`, 18 spread unrecognised props. None of those is a bug in any one
 * component. Together they are why a consumer can render this package and cannot
 * compose with it.
 *
 * Clause 1 is the one that blocks work rather than merely being untidy. Base UI
 * composition is built on refs — `render` and `useRender` merge props **and a
 * ref** onto the element you supply — so `<Tooltip.Trigger render={<Button />} />`
 * cannot work until `Button` forwards one. #162 through #166 all wait on it.
 *
 * ## A ratchet, per clause
 *
 * Every budget is the count on the day this landed, and CI fails only if one
 * rises. Per clause rather than one total, so an improvement to `recipe` cannot
 * pay for a regression in `ref`.
 *
 * PR #58 is why this is not an assertion: it landed a rule set together with the
 * fixes it demanded, failed its own job, and never merged.
 *
 * ## What is deliberately not here
 *
 * - **`data-slot`.** Whether a component has parts worth targeting is a
 *   judgement — a single-element component's root already is the part, and
 *   adding a slot there is ceremony. `docs/styling.md` states the rule; #187
 *   applied it to the twelve components that needed it.
 * - **`id` on the control, not the wrapper.** Real, and cost a debugging session
 *   in #159, but not decidable by reading source. It is in the styling docs.
 *
 * A gate that claims more than it checks is worse than none.
 *
 *   node scripts/check-component-contract.mjs           verify
 *   node scripts/check-component-contract.mjs --list    print the census
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS = path.join(ROOT, 'src/components');

/**
 * Files that render no element of their own, so a ref has nothing to point at
 * and prop spreading has nowhere to go.
 */
const PROVIDERS = {
  'ThemeProvider.tsx': 'A context provider. Its children render, it does not.',
  'docs/DocsLinkProvider.tsx': 'A context provider for the link component.',
  'docs/mdxComponents.tsx': 'A mapping object handed to MDXProvider, not a component.',
};

/** Counts on the day this landed. Lower a line as it is paid down; delete at zero. */
const BUDGET = {
  untested: 26,
  inlineStyle: 170,
  ref: 35,
  displayName: 0,
  recipe: 11,
  spread: 24,
};

const CLAUSE = {
  untested: 'has a co-located unit test',
  inlineStyle: 'keeps inline style objects out of reach of a caller\u2019s className',
  ref: 'forwards its ref to the element it renders',
  displayName: 'declares a displayName alongside forwardRef',
  recipe: "composes classes with recipe()/cn() so a caller's className merges",
  spread: 'spreads unrecognised props onto the rendered element',
};

function files(dir = COMPONENTS) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return files(full);
    if (!entry.endsWith('.tsx') || entry.includes('.test.')) return [];
    return [full];
  });
}

const bare = { untested: [], inlineStyle: [], ref: [], displayName: [], recipe: [], spread: [] };
const counted = [];

for (const file of files().sort()) {
  const rel = path.relative(COMPONENTS, file);
  if (PROVIDERS[rel]) continue;
  const source = readFileSync(file, 'utf8');
  counted.push(rel);

  /*
   * Inline styles, counted rather than judged.
   *
   * `style={{ … }}` is unreachable by a consumer's `className` — #47's third
   * idiom, and the one it is right about. 170 of them exist, and about a third
   * are legitimate: a runtime value cannot be a utility, because Tailwind's
   * scanner reads source text and generates nothing for `bg-[${value}]`.
   * `Avatar`, `Badge` and `Swatch` are that case and say so where they do it.
   *
   * Telling the two apart needs judgement this script does not have, so it
   * counts all of them and holds the line. A ratchet on a number nobody can
   * argue with beats a classifier that is wrong a third of the time.
   */
  /*
   * A co-located unit test, which 29 of 43 components do not have.
   *
   * `vitest.config.mts` used to scope coverage to `src/lib` and `src/hooks`, so
   * the report was healthy and silent about every component. A measurement
   * scoped to exclude the gap reads as reassurance; components are in scope now,
   * and this holds the count.
   */
  if (!existsSync(file.replace(/\.tsx$/, '.test.tsx'))) bare.untested.push(rel);

  for (const _ of source.matchAll(/style=\{\{/g)) bare.inlineStyle.push(rel);

  if (!source.includes('forwardRef')) bare.ref.push(rel);
  /*
   * Only meaningful where a ref is forwarded, and a *named* function expression
   * already supplies it — `forwardRef(function Swatch(...))` gives React the
   * name, so requiring a separate `displayName` there would be ceremony. An
   * arrow function passed to `forwardRef` is the case that needs one.
   */
  if (
    source.includes('forwardRef') &&
    !source.includes('displayName') &&
    !/forwardRef<[^>]*>\(\s*function\s+\w/.test(source)
  ) {
    bare.displayName.push(rel);
  }
  if (!source.includes('lib/recipe')) bare.recipe.push(rel);
  if (!/\{\.\.\.(props|rest)\}/.test(source)) bare.spread.push(rel);
}

if (process.argv.includes('--list')) {
  for (const [clause, missing] of Object.entries(bare)) {
    console.log(`${clause} — ${CLAUSE[clause]}`);
    console.log(`  ${counted.length - missing.length} of ${counted.length}, budget ${BUDGET[clause]}`);
    const shown = clause === 'inlineStyle' ? [...new Set(missing)] : missing;
    for (const f of shown) console.log(`    ${f}${clause === 'inlineStyle' ? ` (${missing.filter((m) => m === f).length})` : ''}`);
    console.log('');
  }
  console.log(`Exempt (${Object.keys(PROVIDERS).length}):`);
  for (const [f, why] of Object.entries(PROVIDERS)) console.log(`  ${f} — ${why}`);
  console.log('');
}

const over = Object.entries(bare).filter(([clause, missing]) => missing.length > BUDGET[clause]);
const under = Object.entries(bare).filter(([clause, missing]) => missing.length < BUDGET[clause]);

console.log(
  `Component contract — ${counted.length} components, ${Object.keys(PROVIDERS).length} exempt.`,
);
for (const clause of Object.keys(BUDGET)) {
  console.log(`  ${clause.padEnd(12)} ${String(bare[clause].length).padStart(3)} / ${BUDGET[clause]}`);
}

if (over.length) {
  console.error(`\nComponent contract failed — ${over.length} clause(s) rose:\n`);
  for (const [clause, missing] of over) {
    console.error(`  - ${clause}: ${missing.length}, budget ${BUDGET[clause]} — ${CLAUSE[clause]}`);
    for (const f of missing.slice(0, 5)) console.error(`      ${f}`);
  }
  console.error('\nLower the budget when you pay one down; do not raise it to land a new component.');
  process.exit(1);
}

for (const [clause, missing] of under) {
  console.log(`  ${clause}: ${missing.length} of ${BUDGET[clause]} — lower the budget.`);
}
