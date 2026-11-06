#!/usr/bin/env node
/**
 * Every dependency is declared in the right place, actually used, and has a
 * stated reason.
 *
 * `knip` already answers "is this package imported anywhere" for JS and TS, and
 * it is better at that than anything hand-rolled — so this does not duplicate
 * it. What it adds is the two things knip cannot:
 *
 *   1. **A reason.** Nothing off-the-shelf enforces that a dependency is
 *      justified. Every entry in `package.json` must appear in MANIFEST below
 *      with a `kind` and a `why`, and every MANIFEST entry must still be
 *      declared — so a package cannot arrive without an explanation, and the
 *      explanation cannot outlive the package.
 *   2. **The CSS surface.** `styles.css` does `@import "tailwindcss"` and
 *      `prose.css` does `@plugin "@tailwindcss/typography"`. Those resolve from
 *      the *consumer's* node_modules at their build time, which makes them real
 *      dependencies of this package's CSS contract — and knip does not parse
 *      Tailwind at-rules, so it reports the typography plugin as unused. It is
 *      not; it is invisible.
 *
 * It also checks the placement rule that actually bites: a package imported from
 * shipped source must be a runtime or peer dependency, never a devDependency,
 * or the published package breaks on install.
 *
 *   node scripts/check-deps.mjs           verify
 *   node scripts/check-deps.mjs --list    print the table for review
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

/**
 * Why every dependency exists, and where it belongs.
 *
 * `kind` is the section it must be declared in:
 *   runtime — `dependencies`; shipped and imported by the compiled bundle
 *   dev     — `devDependencies`; build, test or docs tooling only
 *   peer    — `peerDependencies`; the consumer supplies it. Set `alsoDev` when
 *             this package needs its own copy to build and test against.
 */
const MANIFEST = {
  '@fontsource-variable/inter': {
    kind: 'runtime',
    why: 'Self-hosted Inter (variable). `styles.css` imports it, so it resolves from the consumer\u2019s install \u2014 see the banner in that file for why these are not fetched from Google.',
  },
  '@fontsource-variable/space-grotesk': {
    kind: 'runtime',
    why: 'Self-hosted Space Grotesk (variable), the display face. Real axis is 300\u2013700.',
  },
  '@fontsource/ibm-plex-mono': {
    kind: 'runtime',
    why: 'Self-hosted IBM Plex Mono, the mono face. No variable build exists, so four static weights are imported individually.',
  },
  '@fontsource/vt323': {
    kind: 'runtime',
    why: 'Self-hosted VT323, the pixel face. Single weight.',
  },
  'lucide-react': {
    kind: 'runtime',
    why: 'Icon set rendered by DocsHeader, AdminDashboardLayout and the sandbox. Runtime rather than peer so a consumer gets working icons without opting in — at the cost of a possible duplicate copy for consumers already using lucide. Worth revisiting if that bites.',
  },
  'tailwind-variants': {
    kind: 'runtime',
    why: 'Builds the style recipes in src/lib/recipe.ts. Confined to that one file and deliberately absent from the published .d.ts, so it can be replaced without a breaking change.',
  },
  '@tanstack/react-hotkeys': {
    kind: 'runtime',
    why: 'Keyboard bindings for SlideDeck and the DocsLayout drawer (#205). Same exemption as react-table and react-virtual: a binding engine with no DOM of its own, no focus model and no ARIA — it listens, matches and fires; the components keep every keystroke\u2019s consequence. The binding tables it feeds are also the single source the docs cheatsheet renders from.',
  },
  '@tanstack/react-table': {
    kind: 'runtime',
    why: 'Headless data table state engine for DataTable (sorting, filtering, pagination, selection). Not a counter-example to the one-primitive-library rule: it has no DOM, no focus model and no ARIA, which is why DataTable writes its own semantics — and why neither primitive library replaces it.',
  },
  '@tanstack/react-virtual': {
    kind: 'runtime',
    why: 'Row windowing for DataTable\u2019s `virtualize` prop. Same exemption as react-table and for the same reason: it is a measurement and range-computation engine with no DOM of its own, no focus model and no ARIA. DataTable decides which `<tr>`s mount and how they are spaced; the virtualizer never renders or styles anything, so it does not become a second primitive library under rule 4. Adopted under issue #204.',
  },
  '@base-ui/react': {
    kind: 'runtime',
    why: 'The primitive layer — the one permitted focus-management implementation, per rule 4 in AGENTS.md. Chosen over Radix on maintenance rather than API; the measured comparison is docs/radix-vs-base-ui.md and the staged adoption is issue #105. Runtime rather than peer because a consumer should get working components without opting in, matching lucide-react. Brings 9 packages, all MIT (verified at 1.8.0, not just the 1.7.0 the evaluation measured).',
  },
  '@visx/axis': {
    kind: 'runtime',
    why: 'Rendering-only SVG axis geometry for composed brutalist charts (AxisBottom, AxisLeft). It owns no focus, popup, keyboard, or application interaction; see ADR 0005.',
  },
  '@visx/grid': {
    kind: 'runtime',
    why: 'Rendering-only SVG grid geometry (GridRows, GridColumns) for composed brutalist charts; no interaction primitives. See ADR 0005.',
  },
  '@visx/group': {
    kind: 'runtime',
    why: 'Rendering-only SVG transform grouping (<Group>) used across chart primitives; no interaction primitives. See ADR 0005.',
  },
  '@visx/responsive': {
    kind: 'runtime',
    why: 'Fluid responsive sizing (<ParentSize>) for composed chart layout adaptation; no focus or interaction model. See ADR 0005.',
  },
  '@visx/scale': {
    kind: 'runtime',
    why: 'D3-backed coordinate projection (scaleBand, scaleLinear) mapping domains to SVG pixels; rendering math only. See ADR 0005.',
  },
  '@visx/shape': {
    kind: 'runtime',
    why: 'Rendering-only SVG element geometry (Bar, LinePath, AreaClosed) for brutalist chart shapes; no focus, popup, or application interaction. See ADR 0005.',
  },
  '@visx/tooltip': {
    kind: 'runtime',
    why: 'Coordinate-aware tooltip positioning (useTooltip, TooltipWithBounds) without focus or popup management; ChartTooltip supplies the Card presentation. See ADR 0005.',
  },
  '@microcharts/react': {
    kind: 'runtime',
    why: 'Rendering-only SVG micro-chart geometry for fixed-size, word-sized KPI indicators such as BulletChart. It owns chart labels but no focus, popup, keyboard, or application interaction; see ADR 0005.',
  },

  react: {
    kind: 'peer',
    alsoDev: true,
    why: 'These are React components. Peer so the consumer owns the single copy; also dev so Storybook and the build have one.',
  },
  'react-dom': {
    kind: 'peer',
    alsoDev: true,
    why: 'Not imported by this package anywhere — declared because a consumer rendering these components needs it, and the Storybook react renderer does. Conventional rather than required by our own code, which is the honest reason to keep it.',
  },
  '@tailwindcss/typography': {
    kind: 'peer',
    alsoDev: true,
    why: 'prose.css does `@plugin "@tailwindcss/typography"`, and a Tailwind plugin resolves from the consumer build — it cannot be bundled. Optional, because theme.css-only consumers never load prose.css. Invisible to knip, which does not parse at-rules.',
  },
  tailwindcss: {
    kind: 'peer',
    alsoDev: true,
    why: 'styles.css does `@import "tailwindcss"`, and theme.css is a v4 `@theme` contract, so a consumer must be building with Tailwind v4. Declared so that requirement is stated rather than assumed. Also dev, for Storybook.',
  },

  '@playwright/test': { kind: 'dev', why: 'Visual regression suite and the screenshot walkthrough.' },
  '@storybook/addon-docs': { kind: 'dev', why: 'MDX docs pages in Storybook.' },
  '@storybook/react': { kind: 'dev', why: 'Story types (Meta, StoryObj).' },
  '@storybook/react-vite': { kind: 'dev', why: 'Storybook framework adapter for the Vite builder.' },
  '@tanstack/intent': {
    kind: 'dev',
    why: 'Validator and publisher for the skills/ tree (#206 spike). No runtime surface: it generates, validates and staleness-checks SKILL.md files at build time, and its edit-package-json wiring (files + keywords) is committed, not re-run. Its own dependencies (@clack, cac, yaml…) never ship.',
  },
  '@tailwindcss/vite': { kind: 'dev', why: 'Compiles Tailwind inside the Storybook build.' },
  '@types/react': { kind: 'dev', why: 'Types for the react peer.' },
  '@types/react-dom': { kind: 'dev', why: 'Types for the react-dom peer.' },
  eslint: {
    kind: 'dev',
    why: 'Reports a colour written as a literal at the line that wrote it. Replaced the check-tokens.mjs ratchet, whose text-regex counted matches inside comments and regexes and so could never reach zero.',
  },
  'typescript-eslint': { kind: 'dev', why: 'TSX parser for the lint rule above; the violations live in JSX attributes.' },
  'eslint-plugin-tailwindcss': {
    kind: 'dev',
    why: 'no-custom-classname, the only check that catches a class naming nothing — the failure Tailwind is silent about. Its whitelist is derived from the stylesheets by scripts/authored-classes.mjs, so it asks "does this class exist" rather than "is it a Tailwind class".',
  },
  'eslint-plugin-react-hooks': {
    kind: 'dev',
    why: 'The Rules of Hooks, reported as warnings and held by `check:lint-budget` rather than as errors \u2014 4 violations exist today and PR #58 proved that landing this set as errors alongside its own fixes does not merge. Registered as a plugin object because the recommended set is still eslintrc-shaped and flat config rejects its `plugins` array.',
  },
  'eslint-plugin-jsx-a11y': {
    kind: 'dev',
    why: 'Static accessibility rules \u2014 interactive handlers on non-interactive elements, ambiguous anchor text. Complements #52\u2019s runtime axe gate rather than replacing it: this reads source, that renders the component.',
  },
  '@axe-core/playwright': {
    kind: 'dev',
    why: 'Runs axe against a rendered story in `tests/a11y.spec.ts` \u2014 the runtime half of the accessibility surface, where `eslint-plugin-jsx-a11y` is the static half. Nine gates could measure colour to two decimal places and none could observe an accessibility regression until this landed.',
  },
  '@types/node': {
    kind: 'dev',
    why: 'Types for `node:fs`/`node:path` in the unit suite, which reads the generated theme.css from disk to assert its shape.',
  },
  knip: {
    kind: 'dev',
    why: 'Detects unused and unlisted dependencies, files and exports. The usage half of this check; the reason half is this script.',
  },
  storybook: { kind: 'dev', why: 'The docs and review surface, and what both visual suites screenshot.' },
  tsup: { kind: 'dev', why: 'Bundles ESM, CJS and types. Read the TypeScript 7 note in AGENTS.md before changing it.' },
  typescript: { kind: 'dev', why: 'Type checking and declaration output. Pinned — see AGENTS.md.' },
  vite: { kind: 'dev', why: 'Underlies the Storybook builder.' },
  vitest: {
    kind: 'dev',
    why: 'Unit suite over lib, hooks and the generated theme. Complements the Playwright suites, which assert rendering rather than logic.',
  },
  '@vitest/coverage-v8': { kind: 'dev', why: 'Coverage reporting for `pnpm test:coverage`.' },
  '@testing-library/react': {
    kind: 'dev',
    why: 'Renders hooks and components in the unit suite, asserting behaviour through the DOM rather than internals.',
  },
  jsdom: { kind: 'dev', why: 'DOM environment for the unit suite; the hooks under test read `document` and `navigator`.' },
};

const SECTION = {
  runtime: 'dependencies',
  dev: 'devDependencies',
  peer: 'peerDependencies',
};

/** Reduce an import specifier to its package name. */
function packageOf(specifier) {
  if (specifier.startsWith('.') || specifier.startsWith('node:')) return null;
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

function walk(dir, test) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full, test));
    else if (test(full)) out.push(full);
  }
  return out;
}

/**
 * Packages imported from *shipped* source.
 *
 * `src/stories/**` is excluded: those files sit under `src/` but are not
 * reachable from `src/index.ts`, so nothing they import reaches the bundle.
 * That is why Storybook can be a devDependency while living inside `src/`.
 *
 * Unit tests are excluded for exactly the same reason. Co-locating
 * `slug.test.ts` next to `slug.ts` is what makes the pairing obvious, but it
 * puts a `vitest` import under `src/` — and without this the check would read
 * that as the bundle depending on the test runner and demand it be promoted to
 * a runtime dependency, which is the opposite of correct.
 *
 * The exclusion is safe only because it is *also* true that nothing reachable
 * from the entrypoint imports a test file. `tsup` bundles from `src/index.ts`,
 * so a stray `export` from a `.test.ts` could not pull the runner into `dist`
 * without also appearing in the published types — which rule 5 below would
 * catch.
 */
function shippedImports() {
  const files = walk(path.join(ROOT, 'src'), (f) => /\.tsx?$/.test(f)).filter(
    (f) =>
      !f.includes(`${path.sep}stories${path.sep}`) &&
      !/\.test\.tsx?$/.test(f) &&
      !/test-setup\.tsx?$/.test(f),
  );
  const found = new Set();
  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/from\s+'([^']+)'|require\(\s*'([^']+)'/g)) {
      const name = packageOf(match[1] ?? match[2]);
      if (name) found.add(name);
    }
  }
  return found;
}

/** Packages referenced from CSS via `@import` or `@plugin`. */
function cssImports() {
  const files = walk(path.join(ROOT, 'src'), (f) => f.endsWith('.css'));
  const found = new Set();
  for (const file of files) {
    for (const match of readFileSync(file, 'utf8').matchAll(/@(?:import|plugin)\s+"([^"]+)"/g)) {
      const spec = match[1];
      if (spec.startsWith('.') || spec.startsWith('url(')) continue;
      const name = packageOf(spec);
      // A self-reference in a doc comment is not a dependency.
      if (name && name !== pkg.name) found.add(name);
    }
  }
  return found;
}

const declared = new Map();
for (const [kind, section] of Object.entries(SECTION)) {
  for (const [name, range] of Object.entries(pkg[section] ?? {})) {
    if (!declared.has(name)) declared.set(name, { ranges: {}, kinds: [] });
    declared.get(name).ranges[kind] = range;
    declared.get(name).kinds.push(kind);
  }
}

const problems = [];

// 1. Nothing undocumented, and no rationale left behind by a removed package.
for (const name of declared.keys()) {
  if (!MANIFEST[name]) {
    problems.push(`${name}: declared but has no MANIFEST entry. Add one saying why it exists.`);
  }
}
for (const name of Object.keys(MANIFEST)) {
  if (!declared.has(name)) {
    problems.push(`${name}: has a MANIFEST entry but is not declared. Remove the entry.`);
  }
}

// 2. Declared in the section its reason claims, with a real range.
for (const [name, entry] of Object.entries(MANIFEST)) {
  const record = declared.get(name);
  if (!record) continue;
  const expected = [entry.kind, ...(entry.alsoDev ? ['dev'] : [])].sort();
  const actual = [...new Set(record.kinds)].sort();
  if (expected.join() !== actual.join()) {
    problems.push(
      `${name}: MANIFEST says ${expected.map((k) => SECTION[k]).join(' + ')}, package.json has ${actual.map((k) => SECTION[k]).join(' + ')}.`,
    );
  }
  for (const range of Object.values(record.ranges)) {
    if (!/^[\^~>=]|^\d/.test(range)) {
      problems.push(`${name}: version range "${range}" is not a specified range.`);
    }
  }
}

// 3. Anything the shipped bundle imports must be runtime or peer. A
//    devDependency here means the published package breaks on install.
for (const name of shippedImports()) {
  const entry = MANIFEST[name];
  if (!entry) {
    problems.push(`${name}: imported by shipped source but not declared at all.`);
  } else if (entry.kind === 'dev') {
    problems.push(
      `${name}: imported by shipped source but declared as a devDependency. It must be runtime or peer.`,
    );
  }
}

// 4. The CSS contract. knip cannot see these.
for (const name of cssImports()) {
  if (!declared.has(name)) {
    problems.push(
      `${name}: referenced from CSS (@import/@plugin) but not declared. It resolves from the consumer's node_modules, so it must be a peer dependency.`,
    );
  }
}

// 4b. Every knip exemption must be earned. `ignoreDependencies` exists because
//     knip does not parse at-rules, so a package referenced only from CSS looks
//     unused to it. That is a narrow, checkable reason — and until now nothing
//     checked it, which made the list a place to silence any complaint. An entry
//     with no CSS reference behind it is exactly the abuse AGENTS.md warns about.
{
  let knip;
  try {
    knip = JSON.parse(readFileSync(path.join(ROOT, 'knip.json'), 'utf8'));
  } catch {
    problems.push('knip.json is missing or unparseable.');
    knip = {};
  }
  const referencedFromCss = cssImports();
  for (const name of knip.ignoreDependencies ?? []) {
    if (!referencedFromCss.has(name)) {
      problems.push(
        `${name}: in knip's ignoreDependencies but referenced from no CSS @import/@plugin. That exemption exists only for packages knip cannot see because they are used from an at-rule — remove it, or reference the package from CSS.`,
      );
    }
  }
}

// 5. Every CSS file shipped must be reachable through the exports map, or a
//    consumer following the docs gets a resolution error.
const exported = new Set(Object.keys(pkg.exports ?? {}));
for (const file of walk(path.join(ROOT, 'src'), (f) => f.endsWith('.css'))) {
  const base = path.basename(file);
  if (!exported.has(`./${base}`)) {
    problems.push(
      `${base}: shipped in dist but missing from the package "exports" map, so it cannot be imported.`,
    );
  }
}

if (process.argv.includes('--list')) {
  const rows = Object.entries(MANIFEST).sort(
    (a, b) => a[1].kind.localeCompare(b[1].kind) || a[0].localeCompare(b[0]),
  );
  console.log('| Package | Kind | Range | Why |');
  console.log('|---|---|---|---|');
  for (const [name, entry] of rows) {
    const record = declared.get(name);
    const range = record ? Object.values(record.ranges)[0] : '—';
    const kind = entry.kind + (entry.alsoDev ? ' + dev' : '');
    console.log(`| \`${name}\` | ${kind} | \`${range}\` | ${entry.why} |`);
  }
  console.log();
}

if (problems.length > 0) {
  console.error(`Dependency check failed — ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error('\nEvery dependency needs a section that matches its reason, and a reason.');
  process.exit(1);
}

console.log(`Dependencies OK — ${declared.size} packages, all documented, all in the right section.`);
