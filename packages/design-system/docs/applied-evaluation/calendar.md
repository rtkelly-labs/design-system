# Calendar / scheduling archetype: findings

Original compared against: Google Calendar week + month. Axis: capability gaps, not visual copying.

## (A) What was built

Files (only these were written in the repo):
- `apps/site/src/examples/calendar/model.ts`: seeded events (fixed epoch, UTC, hand-formatted, fixed "now" = Wed 14 Oct 2026 10:42), overlap-column packing (`layoutDay`), lane packing for all-day/month bars (`layoutLanes`).
- `apps/site/src/examples/calendar/app.tsx`: default export `CalendarApp`. Week, day, month and agenda views; mini-month navigator; all-day row with multi-day bars; now marker; overlap handling (side-by-side up to 2 columns, cascaded overlay at 3+); `+N MORE` Popover in month; event Popover with an ACTIONS Menu (duplicate/delete); create Modal with validation; OPTIONS Menu with density radio group; Checkbox calendar toggles coloured by role; single-letter calendar codes plus a dashed edge for the quiet role so colour is never the only cue; letter-key shortcuts (t/w/d/m/a/c).
- Imports only from `@rtkelly13/design-system`: Button, Checkbox, Input, Menu*, Modal, Popover, Select, Tabs*. No dependencies added. `pnpm check:tokens` = 0 (87 files OK); `eslint --max-warnings 0` on the folder is clean; `tsc` shows no errors in the folder.
- Calendar colours are roles only: primary, secondary, tertiary, success, quiet.

Registry line for `apps/site/src/examples/index.ts` (not edited by me):
```ts
import CalendarApp from './calendar/app';
  'calendar/app.tsx': CalendarApp,
```
The page-def side (`src/content/components/*.ts`) was not written. A page def for this is not obvious, because it is not a single component. Previewing needs a full-page host such as `/examples/<slug>` in `src/samples`.

Evidence harness (not in repo): scratchpad `harness/` (a throwaway Next app that symlinks the example), Playwright scripts `t2.mjs`, `t3.mjs`, `palette.mjs`, and screenshots/PDFs in this folder.

## (B) Per-format results

| Format | Result | Evidence |
|---|---|---|
| Midnight, 1440 | Strong. Reads as a CRT drafting table. 5 role colours distinguishable (min OKLab dE 0.199). 4-way overlap cluster is the weak spot. | `week-midnight-1440.png`, `month-midnight-1440.png` |
| Sketch, 1440 | Looks good and better than midnight for tinted blocks. But TEAM (accent.secondary) and HEALTH (intent.success) are the same green (dE 0.000). Only 4 distinct calendar colours. | `week-sketch-1440.png`; `palette.mjs` |
| 1280 | Fine, no horizontal scroll. Sidebar 240px; day columns about 135px. 3-col overlaps need the cascade fallback. | `week-*-1280.png` |
| 768 | Works: sidebar hidden below `lg`, mini-month dropped, calendars legend becomes a 170px block above the grid. Week columns are about 100px. Event titles wrap to 3 lines. | `week-sketch-768.png` |
| 375 | Week: grid stays 7 columns at 84px and scrolls horizontally inside its container (page scrollWidth 375, no page overflow). Titles truncate ("STAND-"). Toolbar wraps to 3 rows. Legend 160px tall before any grid. Month degrades to colour strips (glyph-only), legible as density, not as content. Agenda and day are the real mobile views. | `week-midnight-375.png`, `month-midnight-375.png` |
| Keyboard | Passes with caveats. Tabs arrows work (selection follows focus, so ArrowRight swaps the view immediately). Time grid (`role=grid` + `aria-activedescendant`): arrows move day/30 min slot, PageUp/Down moves 4 h, Enter opens the create modal prefilled, Esc returns focus to the grid. Month and mini-month roving arrows work. Menus and popovers behave. | `t3.log` |
| Tab cost | 27 Tab stops before reaching the time grid (7 day headers, every all-day bar, checkboxes). Each timed event is a further stop. No skip mechanism. | `t3.log` |
| Reduced motion | `Button` (`transition-all duration-200`) and `Tabs` tab (`transition-colors`) have no `motion-reduce` variant. They keep transitioning under `prefers-reduced-motion: reduce`. Page-level motion is otherwise nil. | `t4.mjs` |
| axe (week/month/agenda x 2 themes) | After fixes: only harness-level items remain (document-title, h1, nested landmark in the host) plus the Tabs finding F-04. Found and fixed in my code before the final run: `aria-required-children` on the month grid, and quiet-ink-on-quiet-tint contrast (4.38:1 < 4.5) on the agenda code. | `t2.log` |
| Print / PDF | Poor. See F-06. | `ql/print-week-*.pdf.png` |
| Terminal (ANSI) | Not applicable as a UI target. See F-12. | `src/theme/ansi.ts` |

## (C) Findings

### F-01 Role palette collapses: 8 roles, 5 distinct colours; sketch has only 4 usable calendar colours
- Category: token/spacing (palette), also component-gap (no "series" role set)
- Severity: high
- Theme: sketch (worst), midnight
- Evidence: `theme.css` aliases info=accent.primary, warning=accent.secondary (midnight) and danger=accent.tertiary. On sketch, success=accent.secondary (`#006b2e`), dE 0.000. Pairwise OKLab dE across the 5 usable roles (primary, secondary, tertiary, success, quiet): midnight min 0.199 (primary/quiet), sketch min 0.000 (secondary/success) then 0.125 (secondary/quiet, success/quiet). Under a deuteranopia simulation, midnight secondary/success (yellow vs neon green) = 0.010 and sketch = 0.000. The 0.04 ΔE gate in DESIGN.md covers the 10 hues, not the role aliases, so nothing flags this. Calendar apps routinely need 8 to 12 simultaneous colours; Google offers 24.
- Fix: expose a `series` (categorical) role group, 8 members, each with a declared hue, ΔE-gated per theme and with a CVD check. Or document that roles are not a categorical palette and ship the hue-backed categorical set as an explicit role group. The palette already holds 10 hues that components may not address.
- In-language: yes, as a role group. Using hue names in components is not.

### F-02 No opaque role tint; `/15` opacity modifier makes overlapping blocks illegible
- Category: token/spacing
- Severity: medium
- Theme: both
- Evidence: Tailwind `bg-accent-primary/15` composes alpha, so stacked event blocks show each other's text (first screenshot of the 4-way cluster). I worked around it with `bg-[color-mix(in_oklab,var(--ds-accent-*)_16%,var(--ds-surface-raised))]` in five places. This passes `check:tokens` but is hand-rolled colour maths. Tint-vs-raised ΔE is only 0.075 to 0.142, so the 4px edge does the identification.
- Fix: publish `--ds-tint-<role>` (solid, pre-mixed per theme and checked for text contrast; measured 11.1 to 14.7:1 for primary ink) and matching `bg-tint-*` utilities.
- In-language: yes (flat fills, no gradient).

### F-03 Button has no neutral/quiet variant; toolbar chrome shouts, and sm is 40px
- Category: component-gap / original-does-better
- Severity: medium
- Theme: both, all viewports
- Evidence: `ButtonVariant` is primary, secondary, tertiary, inverse and default. All are solid accent fills with hard shadows. In the screenshots TODAY / < > / OPTIONS / CANCEL are all pink or red and compete with the one primary action. On sketch the "tertiary" CANCEL reads as a destructive red. `size="sm"` measures 40px high (the JSDoc says 44). The toolbar is 3 rows at 375. Google's toolbar is a flat icon-button row with one filled action.
- Fix: a `quiet`/`outline` variant (border and ink only, shadow on hover) and an icon-only `Button` (`icon`/`square` size) for prev/next. A density axis (`xs`) for dense tools.
- In-language: yes (the shadow-on-hover outline button).

### F-04 Tabs cannot be a panel-less view switcher; emits dangling `aria-controls`
- Category: a11y / component-gap
- Severity: high (axe critical, `aria-valid-attr-value`)
- Theme: both
- Evidence: each `TabsTab` renders `aria-controls="…-panel-<value>"`. A view switcher (week/month) renders content outside any `TabsPanel`, so the id does not exist (`#…-tab-week`). View switchers are the dominant tab use in dashboards.
- Fix: `TabsTab` omits `aria-controls` unless a matching `TabsPanel` is registered, or add a documented `panelless` mode. Better: a `SegmentedControl` / `ViewSwitcher` primitive with radiogroup or toggle-button semantics.
- In-language: yes.

### F-05 No temporal primitives: every hard part is a hand-rolled div
- Category: component-gap
- Severity: high (this is the archetype's gap)
- Theme: all
- Evidence: missing: time-grid with positioned items; overlap packing; lane/span layout; current-time marker; DatePicker/TimePicker; mini-month navigator. I wrote about 420 lines of layout code. `GanttChart` is date-granular and character-cell based (and docs-only), so it cannot express time of day. `Modal` date/time fields fall back to native `<input type=date|time>`: locale-formatted (dd/mm/yyyy in the test browser) and the OS-drawn popup is unthemed on both levels.
- Fix, in priority order: (1) `DatePicker`/`TimeField` with an in-language mini-month; (2) a headless `useTimeGridLayout` plus a `ScheduleGrid` figure (event blocks and now-marker as tokens: `--ds-grid-hour`, `--ds-now`); (3) extend `ActivityGrid`/`Timeline` to take times. Layout maths can live in the package as pure functions (like `paginationRange`).
- In-language: yes.

### F-06 Print: no print Medium; dark theme prints near-illegibly; inverse-ink fills vanish on paper
- Category: token/spacing / visual-refinement
- Severity: high for this archetype (calendars are printed)
- Theme: midnight and sketch
- Evidence (emulated print + PDF, `printBackground` off, the Chrome default):
  - midnight: `text-content-primary` is `#fff`, so all event text prints pale grey on white (`print-week-midnight.pdf.png`).
  - sketch: today's header, all-day bars and any fill using `text-content-inverse` lose their background and print faint (`WED 14`, `SPRINT 41` barely visible). Colour-coding is lost with backgrounds off; only the 4px left borders survive (borders do print).
  - The only `@media print` in the package is `ReportDocument`.
  - The grid occupied only ~58% of the A4 landscape page width in my run, and split to 2 pages mid-day (00:00 to 17:00 on page 1) with no page-break control. I did not diagnose the width, so treat it as part-mine, part-package.
- Fix: a `print` level (or a `print:` token layer) that forces `sketch` ink-on-paper and flips `bg-*` fills to border+ink; guidance that fills carrying text must not depend on `-webkit-print-color-adjust`. I used `print:hidden` for chrome and `print:max-h-none` for the scroller.
- In-language: yes. Drafting-table sketch is the natural print medium.

### F-07 Overlap legibility at density: 3+ concurrent events cannot be read at 36 px/h
- Category: original-does-better / visual-refinement
- Severity: medium
- Theme: both
- Evidence: 12px / 16px mono (the `caption` floor; there is no smaller token) means a 30 min block at compact density (36 px/h) is 18px tall = one line. In the Wed 10:00 cluster (4 events, 3 columns) I used a cascaded overlay (20% offsets with offset shadows). Titles of "VENDOR CALL" are partly covered; the DESIGN REVIEW block is 62% pointer-reachable (its centre is covered; clicking its centre hit the neighbour). 15 min events are padded to 18px, so they visually overlap neighbours' time. Side-by-side columns at 135px/3 = 45px (about 5 mono chars) was worse. Google has the same inherent problem but shows the title first line and time-range hover cards, and the cozy density helps. The `title` attribute is the only tooltip I used; the package Tooltip could be hover-opened, but trigger cost is high for hundreds of blocks.
- Fix: a documented dense type step (`--ds-type-micro` 11px) and a `Tooltip`/hover card recipe for repeated triggers. The mono face wastes about 20% width versus a condensed face. Allow the display condensed face in blocks.
- In-language: yes (offset-shadow cascade is on-brand).

### F-08 Keyboard model: no roving-grid or composite-widget primitive; 27 tab stops to reach the grid
- Category: a11y / component-gap
- Severity: medium
- Theme: both
- Evidence: I implemented `role=grid` + `aria-activedescendant` + an `aria-live` status by hand for the time grid, month and mini-month (three copies of arrow-key logic). Events inside the grid remain individual tab stops. Letter shortcuts only fire when focus is inside the app (root `onKeyDown`), so `m` from `body` did nothing; a global hotkey layer has no home (Base UI only). Month view cannot satisfy ARIA grid structure with spanning events (axe `aria-required-children`), so I dropped the roles there and kept roving buttons.
- Fix: `useRovingGrid` / `Grid` primitive built on Base UI composite; skip-link or `Tab` landmarks pattern docs for dense schedules.
- In-language: n/a (behaviour).

### F-09 Quiet-role ink on its own tint fails AA
- Category: a11y / token
- Severity: low-medium
- Theme: midnight
- Evidence: axe `color-contrast`, 7 nodes: `text-accent-quiet` (`#8b8ba3`) on a 16% quiet tint = about 4.38:1. Fixed in the example by using primary ink for the code letter. Other roles on their tint clear 4.8 to 9.2:1.
- Fix: `check:contrast` could gate `accent.quiet` on role tints. Or make `quiet` darker/lighter per level.
- In-language: yes.

### F-10 Reduced motion: Button and Tabs ignore it
- Category: a11y
- Severity: low
- Theme: both
- Evidence: Button `transition-all duration-200`, Tabs `transition-colors`, no `motion-reduce:` variants (Checkbox has it). Measured: 14 elements transition under `reduce`, same as without.
- Fix: add `motion-reduce:transition-none` to both, ideally through `--ds-duration-*` collapsing to 0 under the media query.
- In-language: yes.

### F-11 Narrow viewports: header title and legend
- Category: visual-refinement
- Severity: low
- Theme: both, 375/768
- Evidence: with no `TabsList` scroll or collapse affordance the toolbar is 3 rows at 375; the title wrapped to 4 lines until I forced `order-last basis-full`. The Tabs strip has no overflow menu. The calendars Checkbox group is always expanded; there is no `Disclosure`/accordion in the catalogue to collapse it on mobile. There is also no `Sheet`/`Drawer` pattern wired to a mini-month (Drawer exists but is not a nav-sheet for filters; I did not try it).
- Fix: a collapsible `Disclosure`; `TabsList` overflow to Menu; icon-only Button (F-03).
- In-language: yes.

### F-12 Terminal medium: not applicable as a UI target; a text agenda is feasible but unsupported
- Category: component-gap
- Severity: info
- Theme: n/a
- Evidence: `src/theme/ansi.ts` and `terminal/*` emit 16-slot theme files (alacritty, ghostty, iTerm, Windows Terminal), a palette for a terminal emulator, not a renderer. A text agenda (`[W] 10:00-11:00 DESIGN REVIEW`) or a 7-column box-drawing week grid is expressible with the existing `Terminal`/`GanttChart` character-cell idea and DS Symbols box drawing (same 600/1000 advance). The terminal actually has more distinct colours than the web roles (ten hues over 16 slots, F-01), and the dashed edge of the quiet role maps to a dim style. Nothing in the package emits ANSI escapes for components, so this is data-to-text work outside scope.
- Fix: none required. If wanted, a `renderAgendaAnsi(events, level)` helper in shared tooling.
- In-language: yes.

### F-13 Things the original does that this build still lacks (capability, not look)
- Category: original-does-better
- Severity: info
- No drag-to-create or drag-to-move/resize. A drag primitive is not in the catalogue and Base UI has none (so it would be hand-rolled, which the single-library rule discourages).
- No recurring-event editor, time zones, attendees/availability, working hours shading, RSVP, search, keyboard shortcut overlay (`?`).
- No virtualised time grid or infinite scroll across weeks.
- Event hover cards (Tooltip is not rich enough to hold actions).
- Month spanning bars and `+N MORE` I did build, with a small cost: the date number is overdrawn by lanes and the row height is fixed (3 lanes).
- All of these are application logic, not design-system gaps, except drag and a rich hover card.

## What worked (so the gaps read in context)
- Popover, Menu (radio group, danger item), Modal (focus return, validation with `Input error`), Tabs keyboard and Checkbox with `accent` all worked first time with correct focus return and Esc stacking (Menu inside Popover closes alone).
- Hard edges, 2px borders, offset shadows and mono caps make a calendar look drafted, not SaaS. The all-day bars and now marker (square head, hard 2px rule) are strong. No emoji or rounded pills were needed.
- Sketch is the better theme for a dense calendar; midnight is more striking but darker tints leave less separation.
