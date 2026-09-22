# What the dependencies cost

**Parent:** [`dependencies.md`](./dependencies.md)

**Generated — do not edit.** `pnpm deps:cost:update` writes this file and
`docs/data/dependency-cost.json` beside it. `pnpm check:dep-cost` fails when the measured
cost moves away from that baseline, so a dependency bump restates its price in the diff.

Every figure is gzipped bytes, tree-shaken to the bindings this package actually imports,
bundled by esbuild with `react` and `react-dom` external. See the header of
[`scripts/analyse-dep-cost.mjs`](../scripts/analyse-dep-cost.mjs) for the method, and why
**marginal** — not standalone — is the number to argue from.

## The shape of it

| | gzip |
|---|---|
| Authored code — `dist/index.mjs` | 62.1 KB |
| Dependencies, all together | 139.6 KB |
| A consumer importing everything | 201.6 KB |

That last row is a ceiling, not a toll. `package.json` declares `sideEffects: ["**/*.css"]`,
so a consumer's bundler drops the specifiers their imports never reach — someone using only
`Button` pays none of the charting stack. The per-package figures below are what a given
component's neighbourhood actually costs, which is why they are worth arguing about
one at a time.

## Per package

| Package | Version | Marginal | Standalone | Used by | Why it is here |
|---|---|---|---|---|---|
| `@base-ui/react` | 1.8.0 | 67.2 KB | 67.0 KB | 13 files | The primitive layer — the one permitted focus-management implementation, per rule 4 in AGENTS.md. Chosen over Radix on maintenance rather than API; the measured comparison is docs/radix-vs-base-ui.md and the staged adoption is issue #105. Runtime rather than peer because a consumer should get working components without opting in, matching lucide-react. Brings 9 packages, all MIT (verified at 1.8.0, not just the 1.7.0 the evaluation measured). |
| `@tanstack/react-table` | 8.21.3 | 13.8 KB | 14.1 KB | 2 files | Headless data table state engine for DataTable (sorting, filtering, pagination, selection). Not a counter-example to the one-primitive-library rule: it has no DOM, no focus model and no ARIA, which is why DataTable writes its own semantics — and why neither primitive library replaces it. |
| `tailwind-variants` | 3.3.1 | 13.1 KB | 13.1 KB | 1 file | Builds the style recipes in src/lib/recipe.ts. Confined to that one file and deliberately absent from the published .d.ts, so it can be replaced without a breaking change. |
| `@visx/axis` | 4.0.0 | 7.3 KB | 16.9 KB | 1 file | Rendering-only SVG axis geometry for composed brutalist charts (AxisBottom, AxisLeft). It owns no focus, popup, keyboard, or application interaction; see ADR 0005. |
| `@tanstack/react-virtual` | 3.14.12 | 7.2 KB | 7.6 KB | 1 file | Row windowing for DataTable’s `virtualize` prop. Same exemption as react-table and for the same reason: it is a measurement and range-computation engine with no DOM of its own, no focus model and no ARIA. DataTable decides which `<tr>`s mount and how they are spaced; the virtualizer never renders or styles anything, so it does not become a second primitive library under rule 4. Adopted under issue #204. |
| `@tanstack/react-hotkeys` | 0.10.0 | 5.6 KB | 5.7 KB | 3 files | Keyboard bindings for SlideDeck and the DocsLayout drawer (#205). Same exemption as react-table and react-virtual: a binding engine with no DOM of its own, no focus model and no ARIA — it listens, matches and fires; the components keep every keystroke’s consequence. The binding tables it feeds are also the single source the docs cheatsheet renders from. |
| `@visx/scale` | 4.0.0 | 4.8 KB | 12.1 KB | 2 files | D3-backed coordinate projection (scaleBand, scaleLinear) mapping domains to SVG pixels; rendering math only. See ADR 0005. |
| `lucide-react` | 1.28.0 | 4.6 KB | 4.4 KB | 19 files | Icon set rendered by DocsHeader, AdminDashboardLayout and the sandbox. Runtime rather than peer so a consumer gets working icons without opting in — at the cost of a possible duplicate copy for consumers already using lucide. Worth revisiting if that bites. |
| `@visx/shape` | 4.0.0 | 2.2 KB | 4.1 KB | 2 files | Rendering-only SVG element geometry (Bar, LinePath, AreaClosed) for brutalist chart shapes; no focus, popup, or application interaction. See ADR 0005. |
| `@microcharts/react` | 0.19.1 | 2.0 KB | 2.2 KB | 1 file | Rendering-only SVG micro-chart geometry for fixed-size, word-sized KPI indicators such as BulletChart. It owns chart labels but no focus, popup, keyboard, or application interaction; see ADR 0005. |
| `@visx/tooltip` | 4.0.0 | 1.1 KB | 2.0 KB | 1 file | Coordinate-aware tooltip positioning (useTooltip, TooltipWithBounds) without focus or popup management; ChartTooltip supplies the Card presentation. See ADR 0005. |
| `@visx/responsive` | 4.0.0 | 0.8 KB | 1.0 KB | 1 file | Fluid responsive sizing (<ParentSize>) for composed chart layout adaptation; no focus or interaction model. See ADR 0005. |
| `@visx/grid` | 4.0.0 | 0.4 KB | 9.7 KB | 1 file | Rendering-only SVG grid geometry (GridRows, GridColumns) for composed brutalist charts; no interaction primitives. See ADR 0005. |
| `@visx/group` | 4.0.0 | 0.0 KB | 0.9 KB | 1 file | Rendering-only SVG transform grouping (<Group>) used across chart primitives; no interaction primitives. See ADR 0005. |

## By family

Packages in one scope share internals, so their standalone figures overlap and cannot be
added up. This is the subtraction done once for the whole scope — what dropping the family
would actually return.

| Scope | Marginal |
|---|---|
| `@base-ui/*` | 67.2 KB |
| `@tanstack/*` | 27.0 KB |
| `@visx/*` | 25.8 KB |

## Where each package is used

- `@base-ui/react` — `src/components/AlertDialog.tsx`, `src/components/Avatar.tsx`, `src/components/Checkbox.tsx`, `src/components/Drawer.tsx`, `src/components/Fieldset.tsx`, `src/components/Input.tsx`, `src/components/Modal.tsx`, `src/components/Progress.tsx`, `src/components/RadioGroup.tsx`, `src/components/Select.tsx`, `src/components/Switch.tsx`, `src/components/Toast.tsx`, `src/components/fieldFrame.tsx`
- `@tanstack/react-table` — `src/components/DataTable.tsx`, `src/stories/DataTable.stories.tsx`
- `tailwind-variants` — `src/lib/recipe.ts`
- `@visx/axis` — `src/components/BarChart.tsx`
- `@tanstack/react-virtual` — `src/components/DataTable.tsx`
- `@tanstack/react-hotkeys` — `src/components/docs/DocsLayout.tsx`, `src/components/slides/SlideDeck.tsx`, `src/stories/SlideDeck.stories.tsx`
- `@visx/scale` — `src/components/BarChart.tsx`, `src/components/Sparkline.tsx`
- `lucide-react` — `src/components/NoteBlock.tsx`, `src/components/Select.tsx`, `src/components/TLDR.tsx`, `src/components/Toast.tsx`, `src/components/admin/AdminDashboardLayout.tsx`, `src/components/blog/BlogPost.tsx`, `src/components/docs/AnchorHeading.tsx`, `src/components/docs/CodeBlock.tsx`, `src/components/docs/DocPager.tsx`, `src/components/docs/DocsHeader.tsx`, `src/components/docs/DocsSidebar.tsx`, `src/components/experiments/DesignSandbox.tsx`, `src/components/experiments/ExperimentsView.tsx`, `src/components/saas/SaasLandingPage.tsx`, `src/components/slides/SlideDeck.tsx`, `src/stories/DocsHeader.stories.tsx`, `src/stories/DocsPortal.stories.tsx`, `src/stories/PageHeader.stories.tsx`, `src/stories/StatCard.stories.tsx`
- `@visx/shape` — `src/components/BarChart.tsx`, `src/components/Sparkline.tsx`
- `@microcharts/react` — `src/components/BulletChart.tsx`
- `@visx/tooltip` — `src/components/ChartTooltip.tsx`
- `@visx/responsive` — `src/components/BarChart.tsx`
- `@visx/grid` — `src/components/BarChart.tsx`
- `@visx/group` — `src/components/BarChart.tsx`
