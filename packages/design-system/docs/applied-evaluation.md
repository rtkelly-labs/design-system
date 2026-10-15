# Applied evaluation: five apps rebuilt, whole-system audit, OSS survey

Date 2026-10-14 · package 0.14.0 · base `origin/main` 0d3b84d · uncommitted, analysis only.

Seven parallel passes: five apps rebuilt with the system (kanban, inbox, settings, calendar, code editor), a
component audit of all 359 stories, and an open-source survey. Each was tested on both levels, at 375/768/1280,
keyboard-only, reduced motion, print emulation, and the terminal medium.

Finding IDs are prefixed by source: `K-` kanban, `INB-` inbox, `SET-` settings, `CAL-` calendar (F-nn in its file),
`ED-` editor (F-nn), `AUD-` audit (F-nn).

Full reports are in `applied-evaluation/`. Each is the agent's own final report, copied from its transcript.

| File | Pass | IDs |
|---|---|---|
| `kanban.md`, `inbox.md`, `settings.md`, `calendar.md`, `editor.md` | First pass: apps rebuilt | K, INB, SET, CAL-F, ED-F |
| `audit.md` | First pass: 359-story component audit | AUD-F01–F42 |
| `oss.md` | First pass: open-source survey | — |
| `site-integration.md` | Gap fill: apps run inside the real `apps/site` | SITE-01–10 |
| `audit-gaps.md` | Gap fill: families the audit skipped, systematic 768 pass | G01–G18 |
| `print-touch.md` | Gap fill: real PDFs rasterised, emulated touch | PT-01–10 |
| `references-archetypes.md` | Evidence: 81 archetype findings and roll-up rows 1–27 | verdict per ID |
| `references-audit-oss.md` | Evidence: AUD-F01–F42, and the OSS facts checked against npm and GitHub | verdict per ID |
| `reference-themes.md` | Evidence: the pre-existing themes read, and the requirements they yield | — |

The five apps are mounted as full-page samples at `/site/examples/<slug>` (edits to `apps/site/src/content/samples.ts`
and `apps/site/src/samples/index.tsx`). They are not registered in `src/examples/index.ts`; see SITE-10.

## 1. Verdict

Hard edges, no blurred shadows, and 2px focus rings on all 1,022 audited stops. The language holds up under real apps,
and the real site showed no hydration or RSC-boundary errors. One rule is broken: docs code blocks render a 6px radius
(row 28). The weaknesses are **missing primitives and gaps in the role system**, not visual drift:

1. Nothing prints well. With backgrounds off, Midnight prints text at 1.0–3.3:1 on white and every fill vanishes;
   scroll boxes silently drop rows (inbox prints 22 of 60). (7 of 9 passes; confirmed on rasterised PDFs)
2. Button has one weight: loud. No quiet/ghost, icon-only, `xs`, or danger intent. (5 of 5 apps)
3. The role palette has fewer distinct colours than its names suggest. (calendar, editor, kanban, settings)
4. Selected / hover / cursor / skeleton all rely on surface steps of ~1.03–1.11:1. (inbox, audit, editor)
5. No keyboard-composite primitives (list, grid, tree, toolbar). Each app re-wrote arrow-key logic. (4 of 5 apps)
6. Table / DataTable has no selection, sticky header, or responsive mode. (inbox, settings, audit)

## 2. Cross-cutting findings, ranked

| # | Finding | Seen in | Sev | Fix |
|---|---|---|---|---|
| 1 | **No print layer.** 0 `@media print` rules outside `ReportDocument`. With backgrounds off (the browser default), Midnight text prints at 1.0–3.3:1 on white, so it is illegible but still visible. Every fill vanishes: tags, event blocks, checked radios, filled buttons. Scroll boxes clip rows (inbox 22 of 60 while saying "60 of 60"). The calendar fills 58% of A4 landscape and breaks mid-event | K-9, INB-11, SET-13, CAL-F06, ED-F15, AUD-F01/02, PT-02/03/04 | H | One print block that re-points roles to Sketch ink-on-paper, `print-color-adjust: exact` for bands, `break-inside: avoid`, un-stick and un-clip. Consider a `print` Medium |
| 2 | **Button needs a weight ladder.** Only solid fills. Row actions outweigh data; secondary is an ink block louder than primary | K-1, INB-05, SET-14, CAL-F03, AUD-F14 | H | `quiet`/ghost variant, icon-only, `xs`; demote secondary to outline |
| 3 | **No danger/intent on Button; tertiary reads as danger in Sketch** (red) and decorative pink = error pink in Midnight | K-2/K-3, SET-01, INB-05, CAL-F03 | H | `intent="danger"` from intent roles; keep accents decorative |
| 4 | **Role palette collapses.** 8 roles → 5 distinct colours; Sketch accent.secondary = intent.success (ΔE 0.000); CVD collapse; calendars need 8–12 | CAL-F01, ED-F01/F17 | H | Gated, CVD-checked `series` role group; declare `syntax.*` and `editor.*` groups (#148, #80). Extend the separation gate from hues to role aliases |
| 5 | **Surface-step states are invisible.** Raised vs base 1.09/1.11, sunken 1.03/1.08. Selected rows, hover, skeleton, terminal selection all fail to read. Contradicts `docs/theming.md` "Selection State" | INB-02/04, AUD-F11, ED-F04 | H | Selected = inset accent edge; hover distinct; skeleton on `border-default` or hatch; add Table row to `auditSelectionDevices`; gate terminal selection |
| 6 | **No opaque role tint.** `/15` alpha lets stacked blocks show through; alpha bands fail AA, worst on Sketch (hues have ~0.02:1 headroom); `color-mix()` passes `check:tokens` but breaks levels.ts rule 4 | CAL-F02/F09, ED-F02 | M-H | Publish solid `--ds-tint-<role>` for stacked blocks (calendar events); gate role-on-tint contrast. **Not** for editor selection, find or diff bands: VS Code requires those to be translucent, so give them per-level `#rrggbbaa` literals with a composited-contrast gate |
| 7 | **DataTable can't be an inbox.** No selection, row props/click, sticky header, bulk slot; `virtualize` can't combine with primitives | INB-01/07, SET-04 | H | Controlled `rowSelection` + checkbox column, `getRowProps`, `stickyHeader`; `Table responsive="stack"` |
| 8 | **No keyboard composite primitives** (listbox/grid/tree/toolbar, roving focus, active-descendant, typeahead) | INB-03/15, CAL-F08, ED-F10/F13, K-15 | H | Build on Base UI or hand-roll (see §4). A shared `useHotkeys` |
| 9 | **Tabs can't express app tabs.** Panel-less switchers emit dangling `aria-controls` (axe critical); no close/dirty/overflow; forces uppercase on filenames | CAL-F04, INB-12, ED-F08, SITE-04/05, AUD-G08 | H | A panel-less view switch is not a tab pattern (APG requires `aria-controls` to a panel): ship a `SegmentedControl`/content switcher rather than strip `aria-controls`. Add `closable`/`dirty` and a case-preserving option to `Tabs` |
| 10 | **Modal/Drawer/AlertDialog shells.** No `initialFocus`; forced header/footer; Drawer repeats title; AlertDialog can't disable/pend confirm | ED-F09/F14, INB-10, SET-02 | H | `initialFocus`, headerless mode, `confirmDisabled/Pending/Intent` |
| 11 | **No drag primitive.** ~250 lines hand-rolled for kanban | K-4, CAL-F13 | H | See §4: native DnD + Menu "Move to…" |
| 12 | **No temporal primitives** (time grid, overlap packing, DatePicker/TimeField, mini-month); native date inputs unthemed | CAL-F05 | H | Base UI Calendar when public; interim hand-rolled |
| 13 | **No code surface / diff / tree / terminal depth.** `CodeBlock` has no gutter; `TreeDiagram` is a figure; `ChangeSummary` is metrics; `Terminal` has no error/warn kinds or ANSI | ED-F07/F10/F11/F12 | H | `CodeView`, interactive `Tree`, `DiffView` (on `diff`), SGR → `--ds-ansi-*` |
| 14 | **ANSI gaps the gate misses.** Midnight `brightBlack` 1.09:1, Sketch `white`/`brightWhite` ~1.1:1, terminal selection ghost; no `--ds-ansi-*` CSS vars; no Kitty/VS Code emitters | ED-F04/F05 | H | Gate those pairs; emit CSS vars |
| 15 | **Form-field limits.** Label/helper string-only and always uppercase (case-sensitive confirm shows caps); no optional/required marker; error replaces helper (counter lost); group error sits under last control; no Input adornment; no copy/secret primitive | SET-05/06/07/08, SET-03 | M | ReactNode labels, as-typed escape, legend description slot. Sources disagree on two fixes. Carbon replaces the helper with the error while GOV.UK shows the error and the character count together, so keep the counter and leave the helper. GOV.UK puts prefixes and suffixes outside the input, so put only the toggle or copy button inside. Don't disable Save until dirty: Primer says never disable or hide it |
| 16 | **Badge/Tag too heavy in rows**; Tag forces `#` + uppercase, no remove | K-7, INB-09, AUD-F20 | M | `size="sm"`, no forced prefix. `onRemove` is contested: GOV.UK says tags are not interactive, while Carbon allows dismissible filter tags only. If added, scope it to a filter-chip variant |
| 17 | **Reduced motion ignored** by Button, Tabs, Modal, sidebar toggle (`transition: .2s all`) | K-10, CAL-F10, SET-17, ED | M | `motion-reduce:transition-none` or zero the duration tokens |
| 18 | **Density floor.** 37px rows (Gmail ~28–30); `sm` Button 40px not 44; Checkbox ~24px | INB-08, CAL-F03 | M | `density="dense"`, small Checkbox |
| 19 | **Elevation inconsistency.** Card says "4px hard shadow" but computes `none`; StatCard/Pricing/Feature/EmptyState flat; shadows at 2/3/4/6/8px | AUD-F03 | M | One raised recipe or a stated flat/raised rule |
| 20 | **Type scale drift.** 6 declared tokens, ~25 rendered sizes; ~800 chars at 9–10.5px incl. footer headings, breadcrumbs, chart ticks | AUD-F04/F05 | M | Promote 3 label steps, floor 11px, lint `text-[Npx]` |
| 21 | **Hover/cursor grammar.** No hover on Checkbox/Switch/Radio/linked Card; Button `cursor: default` | AUD-F08/F09/F10 | L-M | One hover rule. Drop the `cursor-pointer` fix: Tailwind v4 sets buttons to `cursor: default` on purpose to match the browser, and Carbon treats a cursor change as enough hover for a checkbox. Treat this as a consistency issue, not a defect |
| 22 | **"Current item" has four idioms; Pagination uses four accents + ASCII arrows; Tabs accent differs per variant** | AUD-F16/F17/F18 | M | One grammar per orientation |
| 23 | **Focus polish.** Menu/SiteNav popups double-ring; offset 1px vs 2px; hit targets under 24px (sort buttons 16px, sidebar toggles 18px) | AUD-F25/F26/F27, PT-06/07/10, AUD-G17 | M | 24px hit areas (WCAG 2.5.8 AA; the spacing exception may clear some sort buttons). The kanban drag handle (22×16) and calendar events (17px high) also fail it. The scoped popup ring and `--ds-focus-offset` are polish only: no WCAG criterion asks for a consistent focus offset |
| 24 | **Narrow-viewport defects.** Overflow at 375: Pagination links, SlideDeck controls; DataTable clips headers mid-word, no cue; PricingGrid 3-up at 768; Table actions column unreachable at 375 | AUD-F28/F29/F30, SET-04, K-14, G04/G05/G06/G09/G11 | M | Collapse/wrap, scroll cue, 1-up under ~900px. Data tables are exempt from WCAG 1.4.10, so table clipping is usability, not conformance. A CSS "stack" mode strips table semantics (Roselli), so restore them with ARIA or use a row-card recipe |
| 25 | **NoteBlock `warning` renders as danger**; Radio vs Checkbox identical unchecked; AppShell rail not sticky | SET-09/10/12 | M | Align names to intents; glyph for radio `(•)`; sticky rail |
| 26 | **Possible bug:** `ThemeProvider` loses stored level under React StrictMode (dev; site enables StrictMode) | SET-11 | L-M | Read storage once before the first persist effect. Verify before filing |
| 27 | Bracket rule inconsistent inside action groups; stale Slide copy ("THREE MODES"); Divider stops short; Toast shadows collide; sketch scrim mid-grey (#81) | AUD-F15/F22/F31/F32/F23 | L-M | Polish |
| 28 | **6px radius on docs code blocks**, against DESIGN.md §6 ("Zero. Everywhere."). `@tailwindcss/typography` hard-codes `rem(6)` on `pre` (`styles.js:316`), loaded by `src/prose.css:145`; this bypasses the token scale. Ships in `dist/prose.css` | G-E (audit-gaps §E) | M | `border-radius: var(--ds-radius-none)` on `.docs-codeblock-body pre` (`src/prose.css:202`) and on `pre` inside `prose-ladder`; add a computed-style assertion |
| 29 | **SlideDeck unusable at 375.** The stage collapses to ~190px, slide content is lost, and the controls overflow by 22px | G12 | H | Fit the stage to the viewport width, stack the control bar, `clamp()` the title |
| 30 | **Single-level Manifesto stories show the other level on the wrong ground**, so their contrast claims are untrue where shown; `manifesto--levels` overflows to 761px at 375 | G01, G02 | H-M | Scope each half in a `data-theme` panel; stack below ~640px |
| 31 | **Stranded closing bracket** in display headings, even at 1280 (landing hero, LoremIpsumPost, admin header). The bracket is the signature device | G03, G06, G09 | M | Non-breaking space before `]` and `text-wrap: balance` on display headings |
| 32 | **Reduced motion removes content.** `TickerTape` stops and clips the sentence mid-word (2728px of content in a 289px box) | G16 | M | Under reduced motion, stack the items or offer pause/next |
| 33 | **One `<main>` is hard to guarantee.** `AppShell` always renders `<main>`, so hosts that also wrap get duplicate-main errors; samples had none or two | SITE-03 | M | Make `<main>` opt-out on `AppShell`, or document that the host owns it |
| 34 | **Touch drag across kanban columns fails at phone width.** Auto-scroll fights `snap-x snap-mandatory`, and the board re-snaps. Example code, but a `Sortable`/board primitive would own it | PT-01 | H (example) | Turn scroll-snap off while a drag is live |
| 35 | **Story pins Midnight.** `LoremIpsumPost.stories.tsx:17` forces `defaultLevel="midnight"`, so its Sketch rendering has never been reviewed | G10 | L | Drop the story's `ThemeProvider` |

## 3. What held up (keep)

The hard-edge and offset-shadow idiom reads as a drafting table in every archetype. There are no blurred shadows, and
the only non-zero radius is the docs `pre` (row 28). The real site has no hydration or RSC-boundary errors, and
lint, `check:tokens`, typecheck and the static build all pass with the five apps mounted. `ErrorSummary` with `key={attempt}` refocus is
best-in-class. `Switch`/`Checkbox` `helperText` makes complete feature rows. `AlertDialog` focus trap/return, `Menu` radio
group, `Toast` with UNDO, `Table appearance="quiet"`, `Checkbox indeterminate`, `Popover`+`Menu` Escape stacking,
bracketed tab counts, `NerdIcon` coverage, role tokens making level swap free. Sketch is the better surface for
long forms, dense calendars and printed code.

## 4. Open-source evaluation (rule 4 applied)

Rule 4: `@base-ui/react` is the only interaction library; headless engines with no DOM/focus/keyboard are allowed.

Base UI ships a documented command-palette example (`Autocomplete` `inline` in a Dialog). Its Calendar is **not** on
the way:
- A private Calendar merged in #1973 (2026-03-13) and was removed in #4505 (2026-04-13).
- DateField (#3666) closed unmerged.
- 1.9.0 ships only the temporal adapters under `internals/`, with no component.
- #1709 is still open with no schedule.

This corrects `oss.md`, which said they were "built, then moved to internals".

| Element | Pick | Fallback | ADR? |
|---|---|---|---|
| Kanban DnD | Native HTML5 pointer drag (~80–150 lines) + Base UI `Menu` "Move to…" as the keyboard/WCAG 2.5.7 path | `@dnd-kit/react` 0.5.0 (MIT, 33 KB, pre-1.0; strip `Accessibility`/`KeyboardSensor`) | only for fallback |
| Calendar | Hand-rolled month grid on `date-fns`, which is already Base UI's optional peer. Don't plan around Base UI Calendar | `react-day-picker` 10 (CSS vars and `classNames`; owns the grid keys). It's a stronger interim candidate now that the first-party component was removed | only for fallback |
| Event layout | Hand-roll (300–500 lines); spike `@full-ui/headless-calendar` (MIT, 0 deps, beta) | — | note only |
| Code editor | Display: Shiki CSS-variables (already in site). Editing: CodeMirror 6 core, themeable with `var(--ds-*)` | — | **yes** (text engine, no popups) |
| Command palette | Base UI `Autocomplete` inline in `Modal` (#158 option A); `@tanstack/match-sorter-utils` if fuzzy needed | — | no |
| Inbox grid | Keep TanStack Table + Virtual; add selection + row nav in `DataTable` (~150–200 lines) | — | no |
| Tree | Hand-roll APG tree (~150 lines) | `headless-tree` (owns keys/focus) | if adopted |
| Split panes | Hand-roll APG splitter (~100 lines) | `react-resizable-panels` | if adopted |
| Diff | **Adopt `diff` (jsdiff)**: BSD-3, ESM, 7.9 KB, pure | — | no |
| Terminal | Static `<pre>` + ANSI vars | `@xterm/xterm` only for a live terminal | yes |
| Forms | Base UI `Form`/`Field` + any Standard Schema validator | TanStack Form when #203 unblocks | no |

Rejected: `cmdk`/`kbar` (Radix), `react-aria` DnD/RAC, `@hello-pangea/dnd`, SortableJS, FullCalendar, Schedule-X,
react-big-calendar, Monaco, AG Grid, Glide, react-hook-form, react-diff-view, allotment, react-arborist.
`@atlaskit/pragmatic-drag-and-drop` has the ideal headless profile but its manifest has no ESM `exports` (predicted to
fail the repo's plain-Node import probe; not executed).

About 75 OSS facts were re-checked against the npm registry, GitHub and the vendor docs (`references-audit-oss.md` §C):
- **Confirmed:** about 66.
- **Corrected (5):** the Base UI Calendar history; Monaco's evidence, now microsoft/monaco-editor#2427 (closed, not
  planned); `@daypicker/react`, which is a wrapper, so depend on `react-day-picker`; Form's `action`, which appears in
  an example only; and size units (`oss.md` uses kB, bundlephobia KiB).
- **Newly resolved:**
  - Safari has no stable Temporal.
  - FullCalendar v7 timeline and resource packages are still non-MIT.
  - Atlassian's guidance recommends a "More" menu of move outcomes for keyboard DnD.
  - CodeMirror theme values pass `var()` through verbatim (style-mod source).
- **Still unverified:** marginal bundle costs (`check:dep-cost` not run), `zod/mini` size, CodeMirror's Tab trap and
  screen-reader behaviour, Monaco 0.57 and xterm `var()` handling at runtime, and pragmatic-dnd's plain-Node ESM
  failure (predicted, not executed).

## 5. Existing issues touched

#148 syntax Group (live; #77/#78/#80 premises stale, written for four levels), #80 editor chrome, #84 emitters,
#158 command palette (Base UI answer exists), #203 TanStack adoption, #344–#348 ReUI evaluations (#347 DataTable),
#309/#311 are adjacent. `FileChangeTree` and `separation.ts` are cited in docs/issues but do not exist.
`gap-analysis.md` and `evaluation.md` describe a 36-component system and are stale.

## 6. Evidence

Two references passes attached web sources to every finding (`references-archetypes.md`,
`references-audit-oss.md`). Every URL was fetched on 2026-10-14 unless marked search-only. The gap-fill reports
(SITE, G, PT) cite their own sources inline.

| Set | Findings | Supported | Partly | Contradicted | Unsourced |
|---|---|---|---|---|---|
| Archetypes (K, INB, SET, CAL, ED) | 81 | 31 | 41 | 0 (12 sub-claims) | 8 |
| Audit (AUD-F01–F42) | 42 | 7 | 15 | 1 (F09) | 19 |

The unsourced items are almost all repo-internal consistency (borders, bracket rule, copy, the PageTitle/PageHeader
split) or behaviour of Gmail, Google Calendar and Trello whose help pages could not be fetched. The repo's own
DESIGN.md is the basis for those, and they are cited by section.

### Best references per row

| Row | Primary references |
|---|---|
| 1 Print | MDN `print-color-adjust` (default `economy` drops backgrounds and adjusts text); MDN `break-inside`; WCAG 1.4.3 |
| 2 Button ladder | Carbon Button (one primary per screen; ghost is least prominent); Primer Button (invisible variant); GOV.UK Button (one default button per page) |
| 3 Danger intent | Primer Button (danger "used sparingly"); Carbon Modal (danger modal); WCAG 1.4.1 (colour not the only cue) |
| 4 Role palette | WCAG 1.4.1; Okabe & Ito, colour universal design (jfly.uni-koeln.de/color); Carbon data-vis palettes |
| 5 Surface-step states | WCAG 1.4.11 (selected state needs 3:1; hover is supplemental); repo `docs/theming.md` "Selection State" |
| 6 Tints | MDN `color-mix()`; WCAG 1.4.3; VS Code theme-color reference (editor bands must stay translucent) |
| 7 DataTable | Carbon Data table (batch bar, header tri-state, row sizes 24–64px); Linear "Select issues"; MDN `position: sticky` |
| 8 Keyboard composites | APG Grid, Listbox, Toolbar, Treeview; MDN `aria-activedescendant` |
| 9 Tabs | APG Tabs; Deque `aria-valid-attr-value`; Primer SegmentedControl; Carbon Content switcher |
| 10 Dialog shells | APG Dialog (Modal); Base UI Dialog (`initialFocus` already exists); Base UI Alert Dialog |
| 11 Drag | WCAG 2.5.7 Dragging Movements; NN/g drag-and-drop; Atlassian pragmatic-dnd accessibility guidelines (a "More" menu of moves) |
| 12 Temporal | APG Date Picker Dialog; MDN `<input type="date">`; GOV.UK Date input (text fields for known dates) |
| 13 Code, diff, tree, terminal | VS Code theme-color reference; APG Treeview; xterm control sequences (invisible-island.net) |
| 14 ANSI | xterm.js `minimumContrastRatio`; VS Code terminal appearance (auto contrast to 4.5:1) |
| 15 Forms | GOV.UK Checkboxes, Character count, Text input; Carbon Form, Text input; Primer Saving pattern; WCAG 3.3.1, 3.3.2 |
| 16 Badge/Tag | Carbon Tag; GOV.UK Tag; Atlassian Lozenge (status vs metadata vs count) |
| 17 Reduced motion | WCAG 2.3.3 (AAA); MDN `prefers-reduced-motion` |
| 18 Density | Carbon Data table row sizes; WCAG 2.5.8 |
| 19 Elevation | Atlassian Elevation (flat with a border by default; raise only movable cards); DESIGN.md §6 |
| 20 Type scale | Carbon Typography (smallest step 12px); Butterick, Point Size. No source sets a minimum, so 11px is a house rule, not a standard |
| 21 Hover/cursor | Tailwind v4 upgrade guide and MDN `cursor` (contradict the cursor fix); Carbon Checkbox |
| 22 Current item | APG Tabs; MDN `aria-current`; GOV.UK Pagination |
| 23 Focus and targets | WCAG 2.5.8 and 2.5.5; WCAG 2.4.13 (offset not required) |
| 24 Narrow viewports | WCAG 1.4.10 Reflow (data tables exempt); Adrian Roselli, tables and CSS display |
| 25 NoteBlock, Radio | Primer Banner (warning and critical are separate); NN/g checkboxes vs radios; GOV.UK Radios |
| 26 ThemeProvider | React StrictMode docs (an extra setup/cleanup cycle in development); the bug itself is unverified |
| 28 `pre` radius | DESIGN.md §6; Tailwind typography README; MDN `border-radius` |
| 29–32 | WCAG 1.4.10; MDN `text-wrap`; WCAG 2.2.2; MDN `prefers-reduced-motion` |
| 33 `<main>` | APG Landmark Regions; Deque `landmark-no-duplicate-main` |
| 34 Touch drag | CSS Scroll Snap Level 1 (containers re-snap after programmatic scrolls); WCAG 2.5.7 |

Full URLs are in each references file's bibliography.

### Conformance levels, so severity isn't overstated

- **AA failures:**
  - Contrast below 4.5:1 for text (rows 1, 6, and CAL-F09 at 4.38:1).
  - Selected state below 3:1 (row 5).
  - Targets under 24px without spacing (row 23).
  - The dangling `aria-controls` (row 9).
  - Colour as the only cue (row 4, and AUD-F37 for BarChart).
- **AAA only:** reduced motion (2.3.3), 44px targets (2.5.5) and focus appearance (2.4.13). These support the
  findings but are not conformance failures at AA.
- **Exempt:** data tables from reflow (1.4.10), inactive components from contrast (1.4.3 and 1.4.11), and decorative
  skeletons from non-text contrast. Those rows are usability findings.

## 7. Method limits

- **Tested:**
  - The apps ran in scratch harnesses and then inside the real site (`site-integration.md`).
  - Print was checked on rasterised PDFs (pdf.js) at A4 portrait and landscape, with backgrounds on and off
    (`print-touch.md`).
  - Touch was tested in Chromium with emulated iPhone 13 and iPad Mini profiles.
- **Not tested:**
  - Real iOS Safari or Android.
  - Real screen readers.
  - Windows High Contrast.
  - Hover and active states on the newer families.
- **Partly tested or tooling-limited:**
  - The terminal medium is colour schemes only. No renderer was tested in a terminal emulator.
  - Part of the iPad touch run crashed: settings switches and checkboxes are unverified there, and so is a completed
    kanban drop into another column.
  - Agent-browser printed nothing for console errors. "No errors" means nothing was reported, not that a clean
    console was verified.

## 8. Suggested order

1. **Cheap fixes that touch every surface:**
   - The print layer (#1). The inbox scroll-box clipping and the Midnight fills are the visible failures.
   - The Button ladder and danger intent (#2, #3).
   - Reduced motion (#17).
   - The `pre` radius (#28).
2. **Role and state contrast work** (#4, #5, #6), with gates. Re-baseline #148 and #80 on two levels.
3. **Primitives:**
   - Table selection, sticky header and responsive mode (#7).
   - A SegmentedControl and the dialog shells (#9, #10).
   - Keyboard composites (#8).
   - `<main>` ownership (#33).
4. **Responsive defects:** SlideDeck, Manifesto and AdminDashboard (#29, #30, #24). Then the consistency sweep from
   the audit (#19–#25, #31, #32).
5. **New components:** `CodeView`, `DiffView`, `Tree`, `SplitPane`, a command palette and a date grid (#11–#13).

## Registry lines (not applied)

The apps are mounted as samples instead (see the file index). These are the component-page registrations, if wanted
later:

```ts
import KanbanBoard from './kanban/board';              'kanban/board.tsx': KanbanBoard,
import InboxApp from './inbox/app';                    'inbox/app.tsx': InboxApp,
import SettingsApiKeys from './settings/api-keys';     'settings/api-keys.tsx': SettingsApiKeys,
import SettingsDangerZone from './settings/danger-zone';           'settings/danger-zone.tsx': SettingsDangerZone,
import SettingsRepositorySettings from './settings/repository-settings'; 'settings/repository-settings.tsx': SettingsRepositorySettings,
import CalendarApp from './calendar/app';              'calendar/app.tsx': CalendarApp,
import EditorWorkbench from './editor/workbench';      'editor/workbench.tsx': EditorWorkbench,
```
