# Inbox / issue-tracker list: applied-archetype findings

Note: FINDINGS.md could not be written. The Write call was rejected with "Subagents should return findings as text", so this message is the report. Screenshots and the harness are in `/private/tmp/claude-501/-Users-ryankelly-code-personal/bf919a17-fd46-452f-9827-41b743b650ae/scratchpad/inbox/`.

Archetype: dense inbox (Linear issue list + Gmail inbox). Worktree: `temp/eval-applied-archetypes`.

## (A) What was built

Files (the only repo writes):
- `/Users/ryankelly/code/personal/design-system/temp/eval-applied-archetypes/apps/site/src/examples/inbox/app.tsx`: default export `InboxApp`, a client component.
- `/Users/ryankelly/code/personal/design-system/temp/eval-applied-archetypes/apps/site/src/examples/inbox/data.ts`: 60 seeded issues via `@/data/fixtures` `seeded` + `EPOCH`. Dates are hand-formatted UTC. No `Math.random`, `Date.now` or `toLocaleString`.

Registry line for `apps/site/src/examples/index.ts` (I did not edit it):

```ts
import InboxApp from './inbox/app';
// in EXAMPLES:
'inbox/app.tsx': InboxApp,
```

`EXAMPLES` only feeds component pages. No `src/app/` route renders a standalone full-page example without a `src/content/samples.ts` entry. I couldn't view the example in the real site without editing registered files, so I tested it in a scratch harness:
- The harness is a minimal Next app at `scratchpad/inbox/harness`, with its own layout, `ThemeProvider` and `ToastProvider`.
- It symlinks `src/examples/inbox`, `src/data` and the built `dist/`.
- It ran on port 3102 at `/site/inbox/`.
- The dev server is stopped. Nothing outside `examples/inbox/` was touched in the repo.

Composition (all imports from `@rtkelly13/design-system`):
- **Views:** `Tabs` (underline) as saved views with counts: ALL / MINE / UNREAD.
- **Filters:** `Input`, two `Select`s, and a `Menu` with a `MenuRadioGroup` for density. A `MenuItem` in that menu triggers the skeleton demo.
- **List:** built from `Table`/`TableRow`/`TableCell` primitives with `appearance="quiet"` and compact/comfortable `density`.
  - Per-row `Checkbox`; header select-all with `indeterminate`.
  - Priority text, `Badge` status and labels, unread dot, tabular dates.
- **Bulk bar:** a `role=toolbar` that replaces the filter row when rows are selected.
  - STATUS and PRIORITY `Menu`s, and ARCHIVE with a `useToast` UNDO action.
  - CLEAR.
- **Detail:** a split pane at `lg` (sticky `aside`, `shadow-hard-md`, `Tabs`, `Menu`). Below `lg` it opens in a `Drawer`.
- **States:** `Skeleton` loading list, `EmptyState` for no-match and inbox-zero, and an `aria-live` region.
- **Keyboard:**
  - `j`/`k`/arrows move a cursor.
  - `x`/Space toggle selection; Shift+`j`/`k` range-selects; Ctrl/Cmd+A selects all.
  - Enter/`o` opens; `e` archives the selection or cursor row.
  - Esc clears the selection, then closes the detail.
  - `/` focuses the filter.

Why not `DataTable`: it has no row selection UI, no row-level props, no custom row and no sticky header. The example uses the `Table` primitives instead. This is finding INB-01.

Gates:
- `eslint --max-warnings 0` on `examples/inbox` is clean, with one disable (INB-06).
- `pnpm check:tokens` is 0 (88 files).
- `tsc --noEmit` reports 0 errors in `examples/inbox`.
- axe-core 4.10.2 on both themes (populated, with selection and detail open) reports only `page-has-heading-one`, which is a harness artefact because the harness page has no h1.

Site-local shims:
1. A key-handling wrapper div (INB-06).
2. The selected-row edge via arbitrary `shadow-[inset_4px_0_0_0_var(--ds-accent-primary)]`, and the cursor via `outline-accent-secondary` (INB-02).
3. A sticky header via `className` on `TableHeader`, plus `max-h` / `overflow-y-auto` on `containerClassName` (INB-07).
4. A label `Badge` shrunk by class override (INB-09).
5. `useSyncExternalStore` + `matchMedia` to choose split pane vs `Drawer` (INB-10).
6. Empty hidden `TabsPanel`s, because `Tabs` needs panels for its ARIA pairing (INB-12).

## (B) Per-format results

| Format | Midnight | Sketch | Notes |
|---|---|---|---|
| Both themes | Pass. Neon on near-black reads well, and status/priority roles are legible. | Pass. Paper ground, ink text, pen accents. Stronger than midnight for a dense list. | Selected-row fill is indistinguishable in both themes (INB-02). Skeleton is nearly invisible in both (INB-04). ARCHIVE and CLEAR render red in sketch (INB-05). |
| 375 | Works, partly because I hid columns. Visible: select, PRI, TITLE, UPDATED (date only). Title truncates at about 12 characters. Bulk bar wraps to two rows. Detail opens in a Drawer. | Same. Drawer detail is clean. | The keyboard hint line is irrelevant on touch and wraps. The package has no touch selection pattern (INB-13). |
| 768 | Works. Shows all columns except CMT and labels. Detail uses a Drawer. | Same. | `lg` is the split-pane breakpoint, so a tablet gets no pane. That is my choice, not a defect. |
| 1280+ | Works. Split pane, sticky header, cursor outline plus selection edge. Titles truncate at about 28 characters with the pane open. | Same. | Compact row is 37 px, comfortable 49 px (INB-08). |
| Keyboard-only | Pass with caveats. Tab order: view tabs, filter, status, priority, density, table region, select-all, out. Row checkboxes are `tabIndex=-1`. Menu: Enter opens, arrows move, Enter selects, focus returns to the trigger. All j/k/x/Enter/e/Esc and `/` paths worked, and archive plus UNDO round-trips 60 to 56 to 60. | Same. | There is no roving focus or active-descendant. The cursor is visual plus `aria-current` on `tr` (INB-03). After archive the cursor is lost, which is my shim; Gmail advances to the next row. |
| prefers-reduced-motion | Pass. Skeleton `animation-name` is `none`. | Pass. | Menu and Drawer motion not timed. |
| Print / PDF | Fail, no print treatment. The print-emulated screenshot is identical to screen: dark ground, 2px frames, hard shadows, focus ring, filters and buttons all print. The PDF is 2 pages. The list sits in a `max-h` scroll box, so only about 17 of 60 rows print. | Prints acceptably by accident (paper ground), but the same clipping and chrome remain. | `dist/styles.css` and `dist/theme.css` have 0 `@media print` rules. Only `ReportDocument` mentions print (INB-11). |
| Terminal / ANSI | Not applicable as a render target; palette only. | Same. | See the assessment below. |

### Terminal medium assessment

`packages/design-system/terminal/*` and `src/theme/ansi.ts` emit colour schemes only: 16 slots plus foreground, background, cursor and selection. They come in iTerm2, Windows Terminal, Alacritty and Ghostty encodings. There is no text-mode renderer, table or list layout, or key model. The package cannot express a list view in a terminal. At most it supplies the palette a TUI would paint with.

If someone built a TUI list, the palette would carry it by role:
- P0/P1 map to the `red`/`yellow` slots.
- DONE/REVIEW/IN_PROGRESS map to `green`/`blue`/`yellow`.
- Muted columns map to `brightBlack`.
- The row cursor maps to the `cursor` colour.

Problem: row selection would use `colors.selection.background`. In `rtk-midnight.alacritty.toml` that is `#14142a` on `#0a0a1a`, the same sub-1.1:1 surface step that makes web row selection invisible (INB-02). `check:contrast` audits 24 selection devices, but terminal `selection` does not appear to be one of them. I did not check sketch's values.

## (C) Findings

Severity: high blocks the archetype, medium degrades it, low is polish.

### INB-01 DataTable cannot be an inbox
- Category: component-gap. Severity: high. Theme/viewport: all.
- Evidence:
  - `DataTable.tsx` has no `selection`, `onRowClick`, per-row `className`/`id`/`aria-*`, custom row renderer, sticky header or bulk-action slot.
  - `data-state` is emitted only through a caller-supplied TanStack `table`, and nothing renders a checkbox column.
  - Both Linear and Gmail are selection-first.
  - `virtualize` forces a fixed row height and cannot be combined with the primitives. A 10k-row inbox loses the virtualizer if you drop to `Table`.
- Fix: add controlled `rowSelection` with an opt-in leading checkbox column and header tri-state. Add `getRowProps` (or `rowClassName`/`onRowClick`) and `stickyHeader`, and let `virtualize` work with them. Document the primitive-composition recipe in the meantime.
- In-language: yes, if the selected treatment follows INB-02.

### INB-02 Selected row uses a surface step the DS itself forbids
- Category: token/spacing. Severity: high. Theme: both.
- Evidence:
  - The `Table` row recipe is `hover:bg-surface-raised data-[state=selected]:bg-surface-raised`.
  - Measured contrast, raised vs base: 1.086 (midnight) and 1.110 (sketch). Hover and selected use the same fill.
  - `docs/theming.md` "Selection State" says selection is an accent fill or a 4px accent edge, "never one surface against another".
  - In my first screenshot with two rows selected, the checkbox was the only visible selection signal.
- Fix:
  - `data-[state=selected]` should draw an inset 4px accent edge with `text-content-primary`.
  - Hover needs its own device, distinct from selected.
  - Add the table row to `auditSelectionDevices`.
  - Expose a cursor/current row state. I needed three states (hover, selected, cursor) and the recipe has one.
- In-language: yes.

### INB-03 No keyboard-list primitive (roving focus, active-descendant, typeahead)
- Category: component-gap / a11y. Severity: high. Theme: both.
- Evidence:
  - j/k/x/Enter/e/Esc and `/` took about 60 hand-written lines on a wrapper.
  - There is no list or grid primitive in the package, and Base UI has none.
  - A screen-reader user gets nothing on cursor move except my live region.
  - Row checkboxes are `tabIndex=-1` because 60 tab stops is unusable. That leaves them reachable only through `x`.
- Fix: a `Listbox`/`Grid` primitive with roving or active-descendant focus, a selection model (single, multi, range), typeahead and a documented hotkey layer. Build it on Base UI or hand-roll it under rule 4. A shared `useHotkeys` would also replace the one-off `SLIDE_DECK_HOTKEYS`.
- In-language: yes.

### INB-04 Skeleton is nearly invisible
- Category: visual-refinement. Severity: medium. Theme: both.
- Evidence:
  - `Skeleton` is `bg-surface-sunken` with `border-edge-subtle`.
  - Sunken vs base: 1.034 (midnight) and 1.081 (sketch). Subtle edge vs sunken: 1.66 and 1.47.
  - In the 12-row skeleton screenshot on midnight the bars read as faint outlines.
  - Under reduced motion the pulse stops (verified), leaving a static, near-invisible placeholder.
  - There is no table/row preset. I hand-assembled the rows, with no header, so layout shifts when real content arrives.
- Fix: use `bg-surface-raised` with `border-edge-default`, or a hatch fill (`░` in `text-content-muted`), which suits the language. Add a `Skeleton` table-row preset.
- In-language: yes (hatching).

### INB-05 Button has no quiet/neutral variant
- Category: component-gap. Severity: medium. Theme: both.
- Evidence:
  - Every `Button` variant (primary, secondary, tertiary, inverse) is a high-chroma fill with an offset shadow, and `size="sm"` is `px-4 py-2`.
  - The bulk bar shows four loud buttons side by side.
  - In sketch, tertiary resolves to red, so ARCHIVE and CLEAR both look destructive although CLEAR is not.
  - There is no `xs` or icon-only size, so Linear-style hover row actions cannot exist.
- Fix: add `variant="ghost"` (border only, no shadow, ink text), `size="xs"` and an icon-only form. Keep intent-danger as the only red.
- In-language: yes.

### INB-06 No lint-clean home for list key handling
- Category: a11y. Severity: medium. Theme: n/a.
- Evidence:
  - A key handler on a `div` with `role="group"` trips `jsx-a11y/no-noninteractive-element-interactions`. I added one `eslint-disable-next-line` with the reason.
  - `Table` puts `tabIndex=0 role="region"` on its container but forwards props only to `<table>`, so the focusable element cannot take `onKeyDown`.
- Fix: forward container props, or resolve through INB-03.
- In-language: n/a.

### INB-07 Table has no sticky header or inner-scroll mode
- Category: component-gap. Severity: medium. Theme: both.
- Evidence:
  - I set `sticky top-0 z-raised bg-surface-raised` on `TableHeader` and `max-h-[...] overflow-y-auto` on `containerClassName`.
  - It works in Chromium, but sticky `thead` is fragile.
  - The container's `overflow-x-auto` plus `tabIndex=0` makes it the scroll root for both axes, and no doc says so.
  - `DataTable` builds its own scroll box under `virtualize`, so the two modes differ.
- Fix: add a `stickyHeader` prop with a documented `maxHeight` on `Table` and `DataTable`.
- In-language: yes.

### INB-08 Density tops out at 37 px rows
- Category: token/spacing. Severity: medium. Theme: both.
- Evidence:
  - Measured compact row is 37 px and comfortable is 49 px. Gmail is about 28-30 px and Linear 36-44 px.
  - The floor comes from the `Checkbox` box (about 24 px) and the cell `py-1.5`.
- Fix: add `density="dense"` and a smaller `Checkbox` (`size` prop, 16 px box).
- In-language: yes.

### INB-09 Badge and Tag are too heavy for in-row use
- Category: component-gap. Severity: medium. Theme: both.
- Evidence:
  - `Badge` is `border-2 px-[0.6rem] py-[0.2rem] text-[0.75rem]`. I overrode it to `border px-1.5 py-0 text-[0.65rem]` on every instance.
  - `Tag` forces a `#` prefix, uppercases the text and uses a `border-2` fill.
  - The `Badge` doc says a removable thing is a `Tag`, but `Tag` has no remove affordance, so active-filter chips cannot be built.
- Fix: add `Badge size="sm"` and `Tag` with `onRemove` and no forced prefix.
- In-language: yes.

### INB-10 No responsive master/detail or split-pane primitive
- Category: component-gap. Severity: medium. Theme: both; 375, 768, 1280.
- Evidence:
  - I wrote a `matchMedia` hook and two render paths (aside vs `Drawer`).
  - There is no resizable splitter.
  - `Drawer` renders a duplicate title: the header shows `[ DS-1144 ]` and the body repeats the id.
- Fix: add `SplitPane`/`MasterDetail` that collapses to `Drawer` under a breakpoint, with an optional drag handle that also resizes by arrow keys.
- In-language: yes.

### INB-11 No print treatment
- Category: visual-refinement. Severity: medium. Theme: both.
- Evidence:
  - The print-emulated screenshot is identical to screen, and the CSS has 0 `@media print` rules.
  - Midnight prints a dark ground.
  - The scroll box clips the list, so about 17 of 60 rows print.
  - Inputs, buttons, toast host and the focus ring all print.
- Fix: ship a print layer. Force ink-on-paper roles, set `print:max-h-none print:overflow-visible` on `Table` containers, add `print:hidden` for chrome, use `break-inside-avoid` on rows, and repeat the header via `thead { display: table-header-group }`.
- In-language: yes (drafting-table is native to print).

### INB-12 Tabs requires panels for a filter-style strip
- Category: component-gap. Severity: low. Theme: both.
- Evidence: saved views filter one shared list, so I rendered three hidden empty `TabsPanel`s to keep the ARIA pairing.
- Fix: allow a panel-less strip, with a `controls` prop naming the region it filters.
- In-language: yes.

### INB-13 No touch selection pattern
- Category: original-does-better. Severity: low. Theme: both; 375.
- Evidence:
  - Gmail and Linear mobile use long-press to enter selection mode, swipe actions and bottom action bars.
  - Here the checkbox is the only entry point, rows are 37 px (under 44 px touch targets), and the bulk bar sits at the top of the list, out of thumb reach.
- Fix: add guidance and a dockable `Toolbar` (`position="bottom"` on small screens). Confirm the full cell is the checkbox hit area.
- In-language: yes.

### INB-14 Select trigger truncates its label and cannot be sized or multi-valued
- Category: visual-refinement. Severity: low. Theme: both.
- Evidence:
  - At 9rem the trigger rendered `STATUS: ...` with an ellipsis, so I widened it to 12rem.
  - There is no `size` or inline mode.
  - There is no multi-select, so "status is any of A, B" is impossible.
- Fix: add `size="sm"` and a multi-value `Select`/combobox with chips.
- In-language: yes.

### INB-15 Filter bar and bulk bar change height, and the toolbar has no key model
- Category: visual-refinement. Severity: low. Theme: both.
- Evidence:
  - The bulk bar replaces the filter row, and the heights differed by about 16 px, so the list jumped when the first row was ticked. I fixed it with `min-h-14` on both.
  - The bar has `role=toolbar` but no roving focus, so arrow keys do nothing.
- Fix: add a `Toolbar` primitive with roving focus and a selection-mode swap slot.
- In-language: yes.

### INB-16 Capabilities of the originals that the package cannot express
- Category: original-does-better. Severity: medium.
- Missing:
  - Click-to-sort headers on a non-`DataTable` list.
  - Grouping with collapsible section headers (status groups).
  - Inline editing of status or priority from a row.
  - Saved-filter query syntax and a command palette. `cmdk` is barred by rule 4, and the package has no Base UI combobox wrapper.
  - Drag-reorder.
  - Multi-line rows (sender, subject, snippet).
  - Virtualized lists with selection.
- Strengths worth keeping:
  - `Checkbox` indeterminate.
  - `Menu` radio group and its keyboard model (focus returns to the trigger).
  - `Toast` with an UNDO action (round-trip verified).
  - `EmptyState` with its dashed frame.
  - `Table` `quiet` appearance, whose hairline rows read well dense.
  - Bracketed tab counts and tabular dates.
  - Both themes held contrast (axe clean).
- In-language: n/a.

## Method notes
- agent-browser (Chromium) handled screenshots and interaction. Playwright from `packages/design-system` handled print emulation and PDF.
- `pdftoppm` is not installed, so PDF pages were not rasterised. The page count of 2 comes from the PDF object count, and the visual is from the print-emulated screenshot.
- Theme switching in the harness sets `data-theme` after hydration. The provider overwrites it if it is set earlier.
- Screenshots are in `scratchpad/inbox/shots/` and none are in the repo. They cover midnight and sketch at 375/768/1280, selection, menu, skeleton, empty, toast, comfortable density and print.
- Not verified: Menu/Drawer motion timing, Drawer focus trap on mobile, real screen-reader output, Windows high-contrast, and sketch's terminal `selection` values.
