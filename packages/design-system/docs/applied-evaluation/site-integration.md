All five examples are integrated as full-page samples. Lint, check:tokens, typecheck and build all pass. I did not rebuild packages/design-system/dist. The real site found no console errors, no hydration warnings and no RSC boundary errors. It did find 6 a11y issues, one layout collision and a few small site gaps. Server stopped; I ran no git commands.

Process notes:
- The first gate run overlapped a stray build and `pnpm build` failed with "Another next build process is already running". I reran it clean and it passed.
- The post-calendar-wrapper rebuild passed. After it I re-checked only /examples/calendar (1 main) and /examples (cards present), not the full matrix. The matrix numbers below, including calendar's "mains=0", are from before that wrapper edit.
- The agent-browser `errors` and `console` commands printed nothing for any page. I read that as "no errors", not as a verified clean console.

## (A) Edits and placement

Edits, all in /Users/ryankelly/code/personal/design-system/temp/eval-applied-archetypes/apps/site/src:
1. `content/samples.ts`: added 5 `SampleDef` entries (kanban, inbox, settings, calendar, editor). Each `story` is the placeholder `storybookUrl('/')`, because none has a Storybook story.
2. `samples/index.tsx`: imported the 7 example files directly from `@/examples/...` and added 5 `SAMPLE_PAGES` keys.
   - `kanban` renders `<KanbanBoard />`; the board has its own `<main>`.
   - `inbox` and `calendar` are wrapped in `<main id="main-content">`, because axe flagged `landmark-one-main` on both (zero mains).
   - `settings` is a `<div>` stacking RepositorySettings, ApiKeys and DangerZone. My first wrapper was `<main>`, which collided with the `<main>` inside RepositorySettings and drew `landmark-no-duplicate-main` and `landmark-main-is-top-level`. I changed it to `<div>`.
   - `editor` renders `<EditorWorkbench />`, which has its own `<main aria-label="Editor">`.
3. `examples/index.ts`: not edited, and there are no example-folder edits.
   - A component-page registry entry only renders through a `ComponentPageDef`, which also needs a catalogue/story entry for its props tables.
   - Registering the examples would only add dead client code to the component-page route bundle.

Placement:
- All five are full-page samples, because they are whole applications (a board, a mail client, a calendar, a full-viewport editor). The component-page convention is for small snippets with a printed source.
- Settings is the borderline case. Its three pieces (api-keys, danger-zone, repository-settings) would work as component-page examples, but only if someone adds a `settings` page definition and catalogue entry.
- The cost of this choice is that the example source is not printed or highlighted anywhere on the site.

## (B) Gates, run in apps/site

| Command | Result | Key output |
|---|---|---|
| `pnpm lint` | PASS | `eslint --max-warnings 0 .`, LINT=0 |
| `pnpm check:tokens` | PASS | "Tokens OK: 87 files, 0 colour call sites outside the role vocabulary." |
| `pnpm typecheck` | PASS | TC=0 |
| `pnpm build` | PASS | 20 static pages; `/examples/[slug]` shows landing-page, admin-dashboard, content-studio and "+5 more paths". After the final wrapper edits it still exits 0. |

## (C) Per-page results

Method: set the level through `localStorage` key `ds-theme-level`, reload, then run axe-core 4.13 (wcag2a, 2aa, 21aa, 22aa and best-practice). I rechecked `data-theme` on every load.

My first matrix run had a level race: some "midnight" loads actually rendered sketch. I fixed it by loading about:blank between pages and reran. Calendar and editor numbers below come from that second run. The matrix is Level (midnight, sketch) × Width (1280, 375); the table has 5 pages × 4 cells. The last two sketch rows (editor sketch 1280 and 375) were read from the first run's results.txt. They are consistent with the second run, but I did not verify `data-theme` on them separately.

For every cell: console errors none, hydration none, horizontal scroll none (`scrollWidth` equals `clientWidth` in all 20 cells; there were no `scrollHeight` problems except the editor, covered below).

| Page | Axe, all 4 level/width cells unless noted | Chrome collision |
|---|---|---|
| kanban | 0 violations | none |
| inbox | `page-has-heading-one` only (after the main wrapper) | none |
| settings | `page-has-heading-one` only (after the main fix) | none |
| calendar | `aria-valid-attr-value` (critical) on `#…-tab-week`; `region` on `div[data-slot=tabs]`; `landmark-one-main` and `page-has-heading-one`; `target-size` (serious), 5 nodes at 1280 and 2 at 375, both levels | none |
| editor | `aria-required-children` (critical) on `div[aria-label="Open editors"]`; `color-contrast` (serious) x2 in midnight and x4 in sketch (diff and selection spans); `page-has-heading-one` | page `scrollHeight` is 862 against a viewport of 800 at 1280, and 902 against 812 at 375 |

Site chrome:
- The sample route deliberately has no `SiteChrome`. The only site furniture is `SampleBar`, which sits inside the shared `ThemeProvider`, `LinkProvider`, `ToastProvider` and `SearchProvider`.
- Providers compose fine: level switching works, and settings and kanban use toasts and modals without error.
- There is no site header, sidebar or search on these pages. That is the existing sample convention, not a regression.

## (D) Findings

**SITE-01: Editor's `h-dvh` collides with SampleBar and makes the page scroll**
- Category: visual (site-gap/example). Severity: medium.
- Evidence: the editor root is `h-dvh` and the sample route stacks `SampleBar` above it, so the document is about 62px taller than the viewport at both widths. The workbench's bottom status/panel edge is pushed off-screen. The kanban board's `min-h-screen` does not collide.
- Fix: size the editor to `h-[calc(100dvh-<bar>)]`, or let the sample shell be a flex column with the sample at `flex-1 min-h-0`.
- References: WCAG 1.4.10 Reflow (content usable without two-dimensional scrolling), https://www.w3.org/WAI/WCAG22/Understanding/reflow.html. Tying this to 1.4.10 is only partly supported, since it covers 320px reflow rather than the vertical overflow seen here; I did not find a source for that specific height collision, so treat the Reflow link as context only.

**SITE-02: Sample route has no `<h1>` for most samples**
- Category: a11y / site-gap. Severity: low (axe moderate).
- Evidence: `page-has-heading-one` fires on inbox, settings, calendar and editor. `SampleBar` is only a `<nav>` and the title is a `<span>`. Only the kanban board has an `<h1>`.
- Fix: render the sample title as a visually-labelled `<h1>` in `SampleBar`, or require each sample to provide one.
- References: WCAG 2.4.2 Page Titled, https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html. This is the nearest criterion, but a missing `<h1>` is a best-practice rule rather than a WCAG failure; I did not source that distinction.

**SITE-03: Samples without `<main>` need a wrapper, and the site has no shared one**
- Category: a11y / site-gap. Severity: medium (fixed in the sample file).
- Evidence: inbox and calendar rendered with `mains=0` (`landmark-one-main`). The wrapper I added is per-slug and inconsistent with the landing-page sample, which carries its own `<main id="main-content">`. Wrapping settings in `<main>` produced duplicate-main errors, because RepositorySettings contains an `AppShell` that already renders a `<main>`.
- Fix: have `app/examples/[slug]/page.tsx` own the `<main id="main-content">` for all samples. Note that `AppShell` always emits `<main>`, which makes the "one main" invariant hard for consumers (this is package-flavoured).
- References: WAI-ARIA APG landmarks, one main per page, https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/; Deque `landmark-no-duplicate-main`, https://dequeuniversity.com/rules/axe/4.10/landmark-no-duplicate-main.

**SITE-04: Calendar view switcher has a dangling `aria-controls` (axe critical)**
- Category: example-bug (possibly a package gap). Severity: high on the axe score, low in practice.
- Evidence: `aria-valid-attr-value` on the active week tab. `calendar/app.tsx` lines 780-787 render a `Tabs`/`TabsList`/`TabsTab` x4 with no `TabsPanel`, so the tab's `aria-controls` points to a panel id that does not exist.
- Fix: either render the view content inside `TabsPanel` per view, or use a non-tabs control for the view switch. Optionally the package could omit `aria-controls` when no panel is mounted.
- References: APG Tabs, tabs have `aria-controls` referencing their tabpanel, https://www.w3.org/WAI/ARIA/apg/patterns/tabs/. Base UI Tabs docs, https://base-ui.com/react/components/tabs: they do not mention `aria-controls`, so how Base UI wires it is unsourced.

**SITE-05: Editor's open-files `TabsList` contains non-tab children (axe critical)**
- Category: example-bug. Severity: high.
- Evidence: `aria-required-children` on `div[aria-label="Open editors"]`. `editor/workbench.tsx` lines 640-652 wrap each `TabsTab` in a `<span>` alongside a separate close `<button>`.
- Fix: keep only `TabsTab`s directly inside `TabsList`, and move the close buttons outside the tablist (or inside the tab as a nested affordance with a separate keyboard path).
- References: APG Tabs, tabs are contained in the `tablist`, https://www.w3.org/WAI/ARIA/apg/patterns/tabs/. Base UI's rule for non-Tab children of `Tabs.List` is unsourced; its docs are silent.

**SITE-06: Editor colour contrast fails in the diff and selection highlights**
- Category: a11y / visual. Severity: medium.
- Evidence: `color-contrast` serious on `.italic.bg-intent-warning/25.outline-intent-warning` and `.bg-accent-primary/25.text-accent-tertiary` in midnight; in sketch, also `.bg-accent-primary/25.text-accent-primary`. Counts are 2 in midnight and 4 in sketch.
- Fix: a 25% accent wash behind accent-coloured text fails 4.5:1. Use the solid intent colour with `text-content-primary`, or raise the wash opacity until axe passes. This may point to a package token gap, which I did not investigate.
- References: WCAG 1.4.3 Contrast (Minimum), 4.5:1, https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html.

**SITE-07: Calendar has undersized pointer targets**
- Category: a11y / example-bug. Severity: medium.
- Evidence: `target-size` serious, 5 nodes at 1280 and 2 at 375, id pattern `#base-ui-_R_1sqicslubsnllb_`. I did not identify which controls these are.
- Fix: give the event or day controls at least 24x24 CSS px or sufficient spacing.
- References: WCAG 2.5.8 Target Size (Minimum), https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html.

**SITE-08: Calendar has a `region` violation on the Tabs root**
- Category: a11y. Severity: low (axe moderate).
- Evidence: `region` on `div[data-slot="tabs"]` before the `<main>` wrapper; I did not recheck after the fix.
- Fix: should clear with the `<main>` wrapper; reverify.
- References: APG landmarks, https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/.

**SITE-09: Storybook links on the five new sample cards are placeholders**
- Category: site-gap. Severity: low.
- Evidence: `storybookUrl('/')` points to the Storybook root, since none of these has a story. Per AGENTS rule 9, importing story fixtures would duplicate the library, so stories must be a separate package task. The `/examples` index shows all 8 cards.
- Fix: make `story` optional in `SampleDef` (hide the link), or add stories first.
- References: unsourced (site convention in apps/site/AGENTS.md).

**SITE-10: Samples are dead weight for the site's example-print convention**
- Category: site-gap. Severity: low.
- Evidence: because the examples are mounted from `samples/index.tsx` and not through `src/examples/index.ts`, the site never prints their source, which AGENTS rule 2 treats as the point of examples.
- Fix: either teach the sample route to print the file, or decide to register the three settings pieces as a real component page.
- References: unsourced (internal convention). For Next.js static-export behaviour of client components and `generateStaticParams`, see https://nextjs.org/docs/app/guides/static-exports; it does not bear on this finding.

## Comparison with harness findings
The real site differs from the scratch harness in these ways:
- Landmark conflicts arose only in the real site: the shared route, `AppShell`'s own `<main>` and the settings stack.
- The h1 gap and the editor overflow are site-shell effects.
- The calendar and editor critical axe items and the contrast and target-size items would reproduce in any host, so they likely match the harness.
- No hydration or RSC-boundary problems appeared, which suggests the harness and the site agree there.

Screenshots (20 combinations, plus examples-index.png) are in /private/tmp/claude-501/-Users-ryankelly-code-personal/bf919a17-fd46-452f-9827-41b743b650ae/scratchpad/gapfill-site/, named `<slug>-<level>-<width>.png`. Raw axe output is in `results.txt` there (second run).
