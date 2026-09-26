#!/usr/bin/env node
/**
 * Why every dependency exists, and where it belongs — the single copy.
 *
 * Extracted from `check-deps.mjs` so that `analyse-dep-cost.mjs` can join a
 * measured byte cost to the stated reason without either script owning half of
 * the answer. A dependency's reason and its price belong in one row; keeping
 * the reason here is what lets the cost report print them together instead of
 * asking a reader to hold two files in their head.
 *
 * `kind` is the section the package must be declared in:
 *   runtime — `dependencies`; shipped and imported by the compiled bundle
 *   dev     — `devDependencies`; build, test or docs tooling only
 *   peer    — `peerDependencies`; the consumer supplies it. Set `alsoDev` when
 *             this package needs its own copy to build and test against.
 *
 * Nothing runs on import. This file is data.
 */

export const MANIFEST = {
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
    why: 'Icon set rendered by DocsHeader, AppShell and the sandbox. Runtime rather than peer so a consumer gets working icons without opting in — at the cost of a possible duplicate copy for consumers already using lucide. Worth revisiting if that bites.',
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
  esbuild: {
    kind: 'dev',
    why: 'Measures what each runtime dependency costs a consumer, for `check:dep-cost`. Pinned to the version `tsup` already resolves, so the measurement runs through the same bundler that produces `dist/` rather than a second one that would disagree with it.',
  },
  jsdom: { kind: 'dev', why: 'DOM environment for the unit suite; the hooks under test read `document` and `navigator`.' },
};
