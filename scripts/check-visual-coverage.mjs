#!/usr/bin/env node
/**
 * Which components does the gated visual suite actually assert?
 *
 * `tests/visual.spec.ts` hand-lists what it screenshots, so a component can be
 * added, reviewed and merged without ever being asserted — and nothing says so.
 * The walkthrough captures everything, but by design asserts nothing, which
 * makes it easy to believe a component is covered when it is only *photographed*.
 *
 * ## Why this counts components, not stories
 *
 * It used to count unasserted *stories* against a budget of 20, and that number
 * measured the wrong thing in both directions. Adding a second story to an
 * already-covered component made the gate angrier while improving nothing about
 * coverage; a brand-new component with one story cost the same single point as a
 * variant nobody needed to screenshot.
 *
 * The suite's own policy is one representative story per component — each row is
 * a committed PNG a human reviews whenever it changes, so breadth across
 * components is worth more than depth within one. This measures that policy
 * directly: every component in Storybook's index needs *at least one* asserted
 * story, or an entry in `EXCLUDED` with a reason. Further stories of a covered
 * component are reported but never fail, because that is the policy working
 * rather than a gap.
 *
 * Reads Storybook's own build index, so it cannot drift from the real story
 * list, and reads the spec for the ids it names rather than guessing baseline
 * filenames from story ids — the baselines are hand-named and do not match.
 *
 *   node scripts/check-visual-coverage.mjs           fail if coverage regressed
 *   node scripts/check-visual-coverage.mjs --list    show what is not asserted
 */

import { readFileSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = path.join(ROOT, 'storybook-static', 'index.json');
const SPEC = path.join(ROOT, 'tests', 'visual.spec.ts');

/**
 * Stories deliberately left out of the gated suite, each with a reason.
 *
 * A reason beats a number: it forces the question "should this be asserted?" to
 * be answered once, rather than left as an unexplained gap in a budget.
 *
 * A component is exempt only when *every* one of its stories is listed here.
 */
const EXCLUDED = {
  'foundations-theme-ladder--contrast-matrix':
    'Renders the contrast gate’s own numbers. `pnpm check:contrast` already fails CI on any violation, so a pixel diff of the table adds nothing and would churn on every palette tweak.',
  'showcase-designsandbox--default-sandbox':
    'The kitchen sink — every component, several screens tall. Too broad to localise a failure, and it changes whenever anything does.',
  'foundations-nerdicon--developer-glyphs':
    'Glyph catalogue asserting font rendering across symbols; asserted in walkthrough suite.',
  'foundations-nerdicon--bracketed-in-ui':
    'Composes Button and Badge, each asserted by their own visual baselines.',
  'foundations-nerdicon--table-sort-demo':
    'Table sort demo; covered by unit tests and walkthrough suite.',
  'foundations-nerdicon--typographic-ascii-mix':
    'Pure ASCII symbol variations; covered by Glyph unit tests.',
  'foundations-datatable--default':
    'Headless TanStack data table; asserted across walkthrough suite and unit tests.',
  'foundations-datatable--with-rendered-cells':
    'Custom cell rendered data table with sorting and badges; asserted across walkthrough suite.',
  'foundations-datatable--empty':
    'Empty state data table; asserted in walkthrough suite.',
  'foundations-datatable--headless-tan-stack-table':
    'Controlled TanStack table state machine; asserted in unit tests.',
  'foundations-datatable--compound-table':
    'Low-level compound Table primitives; asserted in walkthrough suite.',

  /*
   * The manifesto's eleven specimens.
   *
   * They are stories only so the `Level` toolbar reaches the landing page —
   * decorators wrap stories, and a docs page carrying none of them cannot be
   * themed. They are fragments of one page rather than components, and every one
   * of them is already owned by a gate that asserts the thing it renders, named
   * below. A pixel diff would add no signal and would churn on every token tweak,
   * which is the argument `showcase-designsandbox--default-sandbox` is excluded
   * on.
   */
  'manifesto--facts':
    'Six lines of mono text naming the vocabulary. Nothing renders here that a component baseline does not; a diff could only ever be a wording change.',
  'manifesto--levels':
    'The pair rendered against itself — the same assertion `foundations-theme-ladder--all-levels` already makes fullPage, over the same components.',
  'manifesto--roles':
    'Role swatches beside the Hue each declares. `check:contrast` asserts that every Role holds its declared Hue’s value, which is the invariant worth gating.',
  'manifesto--hues':
    'The ten Hues and the contrast each measures. Every one of those numbers is gated arithmetically by `check:contrast`.',
  'manifesto--contrast':
    'Renders the gate’s own counts, like `foundations-theme-ladder--contrast-matrix` and excluded for the same reason: `check:contrast` already fails CI on any violation.',
  'manifesto--surfaces':
    'Four grounds per level, straight from `LEVELS`. `check:contrast` measures every pair a component may sit on.',
  'manifesto--form':
    'Shadow offsets and the zero radius, read from `MEDIA_DEFINITIONS`. The `Button` and `Card` baselines already assert that shadow and border treatment.',
  'manifesto--type':
    'A font-stack specimen. `check:fonts` owns the stacks; a text-render diff here would be a font-loading flake, not a design regression.',
  'manifesto--media':
    'A table of `MEDIA_DEFINITIONS` values, two of which emit no artifact. Numbers, not rendering.',
  'manifesto--ansi':
    'Sixteen slots from `ansiScheme`. `ansi:check` asserts slot coverage and diffs the committed terminal fixtures.',
  'manifesto--voice':
    'Composes PageTitle, Badge and BracketText, each asserted by its own baseline.',
  'manifesto--graphic':
    'An SVG palette card in `viewBox` units. Its colours are gated by `check:contrast --medium=graphic` and its layout is arithmetic over `MEDIA_DEFINITIONS.graphic`; a raster diff of vector output would churn on font metrics alone.',
  'manifesto--motion':
    'A transition. Its resting state is the only deterministic frame, and what the specimen exists to show — the durations — is exactly what a still cannot capture.',
  'manifesto--usage':
    'Code samples in `CodeTabs` and `CodeBlock`, both asserted by their own baselines (`codetabs-merged`, `codeblock-with-title-and-language`).',
};

/**
 * Components with no asserted story and no exclusion.
 *
 * Zero, and it should stay there: a new component arrives with a story, and a
 * story worth writing is worth one screenshot. Raising this needs a reason, and
 * a reason belongs in `EXCLUDED`.
 */
const BUDGET = 0;

let index;
try {
  index = JSON.parse(readFileSync(INDEX, 'utf8'));
} catch {
  console.error(
    `Storybook index not found at ${path.relative(ROOT, INDEX)}.\nRun \`pnpm build-storybook\` first — this check reads the real story list.`,
  );
  process.exit(1);
}

// The index is a build artefact, so it is only as fresh as the last
// `build-storybook`. In CI this check always follows the build; locally it is
// easy to read a stale index and be told about a story you just deleted.
try {
  const indexAge = statSync(INDEX).mtimeMs;
  const storyDir = path.join(ROOT, 'src', 'stories');
  const newest = Math.max(
    ...readdirSync(storyDir)
      .filter((f) => f.endsWith('.stories.tsx'))
      .map((f) => statSync(path.join(storyDir, f)).mtimeMs),
  );
  if (newest > indexAge) {
    console.warn(
      'Warning: a story file is newer than storybook-static/index.json.\n         Run `pnpm build-storybook` — this check reads the built index.\n',
    );
  }
} catch {
  // Best-effort freshness hint; never the reason this check fails.
}

const stories = Object.values(index.entries)
  .filter((entry) => entry.type === 'story')
  .map(({ id, title, name }) => ({ id, title, name }));

/**
 * Ids the spec asserts.
 *
 * Two forms, because the suite is a table now: `id: 'foundations-button--default'`
 * in a `CASES` row, and `?id=…` for anything still written as a hand-rolled
 * `page.goto`. Reading only the URL form is how this check reported "0 asserted"
 * against a spec that asserted twenty-nine.
 */
const spec = readFileSync(SPEC, 'utf8');
const asserted = new Set([
  ...[...spec.matchAll(/[?&]id=([a-z0-9-]+)/gi)].map((match) => match[1]),
  ...[...spec.matchAll(/\bid:\s*'([a-z0-9-]+)'/g)].map((match) => match[1]),
]);

/** Storybook's `title` is the component; its stories are that component's cases. */
const components = new Map();
for (const story of stories) {
  if (!components.has(story.title)) components.set(story.title, []);
  components.get(story.title).push(story);
}

const uncovered = [];
const excludedComponents = [];
/** Unasserted stories of components that *are* covered — the policy, not a gap. */
let representedElsewhere = 0;

for (const [title, cases] of components) {
  if (cases.some((s) => asserted.has(s.id))) {
    representedElsewhere += cases.filter((s) => !asserted.has(s.id) && !EXCLUDED[s.id]).length;
    continue;
  }
  if (cases.every((s) => EXCLUDED[s.id])) {
    excludedComponents.push(title);
    continue;
  }
  uncovered.push({ title, cases });
}

// A reason for a story that no longer exists is stale documentation.
const staleExclusions = Object.keys(EXCLUDED).filter((id) => !stories.some((s) => s.id === id));

// An id in the spec that Storybook does not build is a test asserting nothing.
const phantom = [...asserted].filter((id) => !stories.some((s) => s.id === id));

const covered = components.size - uncovered.length - excludedComponents.length;

console.log('Visual coverage — components the gated suite asserts\n');
console.log(`  ${components.size} components, ${stories.length} stories, ${asserted.size} asserted.`);
console.log(`  ${covered} covered by a representative, ${excludedComponents.length} excluded with a reason.`);
console.log(`  ${uncovered.length} components with no asserted story / budget ${BUDGET}.`);
console.log(`  ${representedElsewhere} further stories unasserted, each belonging to a covered component.`);

if (process.argv.includes('--list')) {
  if (uncovered.length > 0) {
    console.log('\n  No asserted story:');
    for (const { title, cases } of uncovered) {
      console.log(`    ${title}`);
      for (const s of cases) console.log(`      ${s.name}  (${s.id})`);
    }
  }
  if (excludedComponents.length > 0) {
    console.log('\n  Excluded:');
    for (const title of excludedComponents) {
      for (const s of components.get(title)) {
        console.log(`    ${s.id}\n      ${EXCLUDED[s.id]}`);
      }
    }
  }
}

const problems = [];
if (uncovered.length > BUDGET) {
  problems.push(
    `${uncovered.length} components have no asserted story, budget is ${BUDGET}. Add one representative to the CASES table in tests/visual.spec.ts — comment \`/update-snapshots\` on the PR first, per AGENTS.md rule 7 — or list every one of its stories in EXCLUDED with a reason.`,
  );
  for (const { title } of uncovered) problems.push(`  ${title}: no asserted story.`);
}
for (const id of staleExclusions) {
  problems.push(`${id}: excluded but no longer exists. Remove it from EXCLUDED.`);
}
for (const id of phantom) {
  problems.push(`${id}: asserted in visual.spec.ts but Storybook builds no such story.`);
}

if (problems.length > 0) {
  console.error('\nVisual coverage check failed:\n');
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
