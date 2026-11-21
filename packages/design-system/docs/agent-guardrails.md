# Consumer agent guardrails

First implementation slice: an opt-in Tailwind entrypoint. The ESLint and
Playwright exports below are a follow-up plan, not shipped APIs. All proposed
checks run locally with free, open-source tools; no paid services are required.

## Strict Tailwind entrypoint

Replace the normal theme import with:

```css
@import "tailwindcss";
@import "@rtkelly-labs/design-system/theme.strict.css";
```

Use one theme entrypoint. Import the strict theme after Tailwind, and avoid
reintroducing default namespaces in later theme imports. `tokens:build` emits
both files with the same renderer, and `tokens:check` checks both. `styles.css`
bundles the regular `theme.css`, so a strict consumer composes
`theme.strict.css` with `prose.css` and the font imports rather than importing
`styles.css`. The existing entrypoint and Storybook keep their current output
during migration.

| Surface | Strict behaviour | Migration constraint |
| --- | --- | --- |
| Colours | Reset `--color-*`, restore system aliases | `bg-slate-*`, `text-indigo-*`, etc. emit no rules — and neither do Tailwind's raw `bg-black`, `bg-white` and `text-white`, which the reset removes with the rest of the palette. Use `bg-fixed-black`, `bg-fixed-white`, `bg-surface-base` or `text-content-inverse` instead. System `palette-*` remains available; role-only enforcement still needs lint. |
| Font families | Reset `--font-*`, restore four system families | `font-serif` emits no rule. `font-sans` is intentionally retained: it already means the system Inter stack and AppShell uses it. Removing that name requires migrating components first. |
| Radii | Reset `--radius-*`, restore generated zero-radius aliases | `rounded-lg` is already a system alias for zero. Static utilities such as `rounded-full` survive namespace resets. |
| Shadows | Reset `--shadow-*`, `--inset-shadow-*`, `--drop-shadow-*`, `--text-shadow-*`; restore system shadows | Default blurred shadows disappear, including the `text-shadow-*` family Tailwind added after this entrypoint's first draft. System hard and glow shadows remain; this does not enforce layout hierarchy. |
| Spacing | Retain defaults | Tailwind's scalar `--spacing` generates arbitrary numeric multiples, including fractional steps. Removing only `--spacing-*` does not disable that mechanism. Removing `--spacing` also removes the numeric padding, gap and size classes shipped components use. |
| Type sizes | Retain defaults plus named system steps | Resetting `--text-*` removes `text-xs`, `text-sm`, etc., used throughout components. Migrate those to `text-caption`, `text-body`, etc., before narrowing. |
| Weights / leading / tracking | Retain defaults | Components use weights and leading/tracking outside the named Medium tokens. Audit and migrate separately. |

This is a utility-generation boundary, not a security boundary. Raw CSS, inline
styles, arbitrary values/properties, static utilities (`rounded-full`), opacity
modifiers and later namespace declarations can still bypass it. Missing utilities
are silently omitted by Tailwind; compiler tests prove the omission, but lint is
needed for an actionable authoring error. Strict mode does not load font files:
consumers still need the documented font setup.

## Next slice: published authoring rules

Export `./eslint` as a separate ESM entrypoint with named `noColourLiterals`,
`noOffSystemFonts` and `noArbitraryValues` rules plus a flat-config plugin object.
Reuse `scripts/eslint-token-rule.mjs` and ship its `token-rules.mjs` dependency;
the current `files` allowlist excludes scripts, so an export alone would be broken.
Keep ESLint out of the runtime component entrypoint. Add declarations and test
imports from the packed package, not just relative source paths.

Scope font/arbitrary checks to class expressions (JSX `className`, `cn`, `recipe`,
conditional strings and template quasis) and style properties. Reject unapproved
font families, arbitrary family values, arbitrary CSS properties and arbitrary
utility values, including variant-prefixed forms. Preserve arbitrary variants
such as `data-[state=open]:` and documented token references such as
`bg-[var(--ds-surface-base)]`. Test negative cases, nested expressions and normal
prose/URLs so rule matching does not turn every string in an app into CSS.
Dynamic class construction needs a documented restriction or separate rule.

## Next slice: published rendered gates

Export `./playwright` with `measureEdges` and `EdgeCensus` from `tests/edges.ts`,
plus `measureTokens(page, options?)`. Move the canonical edge evaluator into the
published helper and have the existing tests/benchmark import it. Preserve the
current call contract `page.evaluate(measureEdges, selector)`. Neither helper
should import Playwright at runtime; use a structural page interface or optional
type-only peer so ordinary consumers do not install browsers.

`measureTokens` should await `document.fonts.ready`, inspect visible elements in
an explicit root, include requested portals, and return actionable violations
(element locator, property, actual value, expected values). Fail on a missing
root or missing theme tokens rather than returning a clean empty result.

Resolve permitted colour tokens on each element, respecting nested `data-theme`
scopes and overrides. Enumerate colour roles from `levels.ts` and fixed colours;
not every `--ds-*` property is a colour. Normalise actual and allowed values
through the same browser colour parser to RGBA, including overlay alpha. Check
text colour only on painted text, backgrounds when non-transparent, and each
visible border side independently. Decide explicitly how to handle opacity
modifiers and colour mixes; exact RGB membership alone rejects these valid
compositions. Document pseudo-elements, SVG fill/stroke, gradients, images and
canvas as additional coverage, not checks this compact gate already performs.

For fonts, validate the first requested family against the shipped allowlist
(Space Grotesk, Inter, IBM Plex Mono, VT323 and intentional symbol faces), with
explicit app overrides. `getComputedStyle().fontFamily` reports the requested
stack even when the actual face failed to load: stack membership alone **cannot
catch a system fallback**. Also require the corresponding loaded `FontFace`
with matching style/weight and meaningful text coverage; `document.fonts.check`
alone can return true for an unavailable family. Test a failed font request and
system-only stacks. Per-glyph actual-face proof would need Chromium font
inspection or the existing font coverage machinery and should be stated as a
separate, more expensive gate.

Use local browser fixtures for nested levels, token overrides, transparent
surfaces, four different border sides, missing fonts, hidden trees and portals.
Retain edge hierarchy thresholds in consumer tests: `measureEdges` measures;
it does not select a universal allowed number of panels or nesting depth.

## Storybook MCP assessment (2026-11-21)

Low configuration cost for local documentation access: add a compatible pinned
`@storybook/addon-mcp` dev dependency and add it to `.storybook/main.ts`'s addons.
The [MIT-licensed 0.7.0 package metadata](https://github.com/storybookjs/mcp/blob/main/packages/addon-mcp/package.json)
accepts Storybook 10.x, including the installed 10.5.5; its Vitest addon peer is
optional. The [addon documentation](https://storybook.js.org/addons/%40storybook/addon-mcp)
exposes `/mcp` on the dev server, so this repo's local endpoint would be
`http://localhost:8100/mcp`. The components manifest is already explicitly enabled.
No hosted MCP service or subscription is needed.

Pin and inspect the chosen release before installation: the old
[standalone repository](https://github.com/storybookjs/mcp) is archived and says
development moved into Storybook at 10.6.0. Do not assume the newest addon release
still supports 10.5.5. A follow-up should run the existing dependency/licence
gates, verify `tools/list` and component docs locally, and check that the static
Storybook build still passes. Story execution tools may need additional Vitest
setup; this repo currently uses independent Vitest and Playwright suites.
The addon supplies context, not enforcement, and a static Storybook deployment
does not itself provide the dev server's MCP endpoint. No addon dependency or
configuration change is included in this first slice.

## Verification of this slice

- `pnpm tokens:check` (in the package): both generated stylesheets current.
  `pnpm check:bundle-size` holds each to its own raw and gzip ceiling.
- `pnpm lint`: no errors, 22 warnings in unchanged code; `pnpm check:lint-budget`
  reports the same 22 across 7 rules.
- `pnpm typecheck`: all workspace packages passed.
- `NODE_OPTIONS=--no-experimental-webstorage pnpm -r test --maxWorkers=2`:
  1,794 design-system tests and 61 report tests passed; 14 report tests skipped.
  The Node 26 flag avoids its experimental global `localStorage` interfering
  with jsdom. The local HTTP server test needs loopback access.
- The static gates that read the tree — `check:docs`, `check:css`, `check:fonts`,
  `check:tokens`, `check:contrast`, `check:import-cost`, `check:api`,
  `check:dep-cost` and `check:governance` — all pass. `check:docs` counts
  `@keyframes` by name, because the strict mirror repeats the same six
  animations and a rule count would read twelve.
- Package build and static Storybook build passed. The built copy in `dist/` is
  byte-identical to `src/theme.strict.css`, normal `theme.css` is unchanged, and
  a packed tarball resolves `@rtkelly-labs/design-system/theme.strict.css`.
- `pnpm test:edges` (in the package), with `PLAYWRIGHT_BROWSERS_PATH` pointing
  to a local Chromium downloaded under ignored `temp/`: 206 tests passed.
  No snapshots or edge baselines were changed.
