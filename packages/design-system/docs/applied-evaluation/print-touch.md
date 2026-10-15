## (A) Method
- Server: `node scripts/serve-deploy.mjs out --mount /site --port 3100` (port was free; I started it and have not stopped it. PID in scratchpad `serve.pid`). The existing `apps/site/out` was used with no rebuild. No source edits and no git.
- Level was set with an `addInitScript` that writes `localStorage['ds-theme-level']`, and I navigated from about:blank. `data-theme` was verified for every print cell. For touch, the census script printed `data-theme` after each load and it matched the requested level.
- Print: Playwright (playwright-core 1.62.1) `page.pdf({format:'A4', printBackground: false|true})` for 5 samples x 2 levels x 2 backgrounds = 20 PDFs. Portrait is the default. I also made landscape PDFs (inbox and calendar, 8 more) because the "58% of A4 landscape" claim needs them.
- **Rasteriser used: pdf.js 4.4.168 loaded from cdnjs inside headless Chromium.** It draws each PDF page onto a canvas at 1.0-1.2x scale and saves a PNG. No system packages. I also used pdf.js `getTextContent` to count rows. I looked at the PNGs directly, one 4-row montage per sample (rows are midnight-bg0, midnight-bg1, sketch-bg0, sketch-bg1; columns are pages).
- Touch: Playwright `devices['iPhone 13']` (390 wide) and `devices['iPad Mini']` (768), both with `hasTouch` and `isMobile`. Drags used CDP `Input.dispatchTouchEvent`. Taps used `page.touchscreen.tap`. Census elements were `a[href], button, input, select, textarea, summary, [role=button|tab|switch|checkbox|radio|menuitem|option|link|combobox], [data-handle], [tabindex]`, visible and larger than 2px.
- Scratchpad = `/private/tmp/claude-501/-Users-ryankelly-code-personal/bf919a17-fd46-452f-9827-41b743b650ae/scratchpad/gapfill-print-touch/`, called `$S` below.
- Skipped: Storybook Card/Table/ReportDocument (not cheap).
- Process note: my first touch scripts gave a false "drag fails on iPhone" because I measured the handle while `scrollIntoView` was still scrolling. I re-ran with a settle wait and report only the re-run results.

## (B) Print matrix
All files are in `$S`. Per-cell page PNGs are `png/<slug>-<level>-bg<0|1>-p<n>.png`. Montages are `montage-<slug>.png`. PDFs are in `pdf/`. Each montage has the four cells midnight-bg0, midnight-bg1, sketch-bg0, sketch-bg1 as rows.

| Sample (A4 portrait) | Pages | midnight, bg off | midnight, bg on | sketch, bg off | sketch, bg on |
|---|---|---|---|---|---|
| kanban | 2 | Legible but weak. Card titles are light grey on white. Tag fills, the progress bar and the theme button are gone. Priority and tag colour coding is lost, leaving black text. Columns split across p1/p2 (Backlog and In-progress on p1, Review and Done on p2). | Full dark ground, all colour present. Cards are not split mid-card. | Fully legible, ink on white. Tags are outlined. The "[LATE]" red text survives. | Legible on cream. Colour present. |
| inbox | 2 (p2 blank) | Legible, 22 of 60 rows. Status badge fills gone, row text black or grey. | Same 22 rows on a dark ground. | Same 22 rows, legible. | Same 22 rows. |
| settings | 3 | Text and borders legible. Filled CTA buttons print as outlines: COPY/ROLL/ARCHIVE labels survive, but the "[CREATE KEY]" fill and the accent-bar buttons vanish. Radio checked state lost (all three look empty). Heading rules are faint. | Dark, all present. | Legible. Radios and buttons present. | Legible. |
| calendar | 1 (portrait) | Day grid legible, but event fills are gone and event text is pale grey. All-day bars have no fill, so their spans are lost. | Dark, complete. | Legible. Event fills are pale and print fine. | Complete. |
| editor | 1 | Only the code pane prints. Explorer, outline, tabs and the problems panel are absent in print. Code is legible but plain text is pale grey and the neon-green string is very faint. | Dark ground. Code is complete, with only 25 lines. | Fully legible. | Fully legible. |

Chrome that printed in every cell: the "<- Examples / [ Name ] / Storybook" header. The theme-level button prints in bg1 and disappears in bg0, because the glyph is on a fill. The kanban card has `print:break-inside-avoid`, so these examples carry some example-level print rules. The design-system package has none, per the roll-up.

Landscape (`calendar-L-*`, `inbox-L-*`): both samples take 2 pages. The calendar grid is cut by the page break at about 16:00, in the middle of events, and the lower hours go to p2. See `png/calendar-L-sketch-bg1-p1.png`.

## (C) Verdicts on prior print claims
1. **"Midnight prints white-on-white with backgrounds off": PARTLY REFUTED.**
   - Text does not vanish entirely. In `png/kanban-midnight-bg0-p1.png`, titles are light grey, labels are dark and tags are black. In `png/editor-midnight-bg0-p1.png`, the code is visible.
   - Contrast of midnight syntax tokens against white (computed in screen media, so the figures are approximate) ranges from 1.0:1 (`#fff`) through 1.36 (neon green), 1.5 to 1.8 (cyan, yellow, light grey) to 3.3 (comment grey). That is far below the 4.5:1 minimum in WCAG 1.4.3. So it is mostly illegible rather than invisible.
   - What does vanish with backgrounds off is every fill: tag chips, progress bar, all-day bars, filled buttons, checked radios and event blocks.
   - With backgrounds on, midnight prints a full dark page: legible but ink-heavy.
   - Nothing sets `print-color-adjust`. MDN says the default `economy` lets the browser drop backgrounds and adjust text colour.
2. **"Inbox prints only ~17 of 60 rows": REFUTED on the number, CONFIRMED on the behaviour.** pdf.js text extraction shows 22 distinct DS-ids on A4 portrait and 13 on A4 landscape. The rest are clipped by the 518px scroll box (`scrollHeight` 2260, `clientHeight` 518). Page 2 is blank in every cell, and the toolbar says "60 of 60 issues" while 38 rows are missing. This is not a small difference: more than half the data is lost silently.
3. **"Calendar grid uses ~58% of A4 landscape width": CONFIRMED.** The grid ends at about x=488 on an 842px-wide raster, which is 58% (`png/calendar-L-sketch-bg1-p1.png`). The right 42% of the page is empty, and the grid is also split across pages.
4. **"Sketch syntax collapses in greyscale": PARTLY CONFIRMED.**
   - Measured: sketch token colours are keyword `#bd0010`, string `#006b2e`, function `#1450d7`, number `#974503`. Their rec.601 luma is about 66 (keyword), 68 (string), 77 (function), 86 (number) out of 255.
   - So hue distinction is lost: keyword, string, function and number sit within about 20 grey levels of each other.
   - Legibility holds: every token is at least 5.4:1 on the `#f5f3ec` paper (5.43 to 13.6), and types still differ by weight (bold types, italic comments).
   - Evidence: `editor-sketch-grey.png` (CSS `grayscale(1)` on a 1000px viewport) next to `editor-sketch-colour.png`. So the claim is true for colour coding and false for readability.

## (D) Touch results

| Test | iPhone 13 (390) | iPad Mini (768) |
|---|---|---|
| Kanban handle size | 22.4x16 CSS px. Computed `display:block`, `touch-action:none`. | Same |
| Kanban drag from handle (vertical, in column) | Works. A drag ghost appears and no `pointercancel` fires. | Works. |
| Kanban drag from card body (vertical) | Does not start a drag, by design (`if pointerType !== 'mouse' && !closest('[data-handle]') return`). The page scrolls instead. | Same |
| Kanban horizontal swipe on card body | The board scrolls (`scrollLeft` 0 to 348). | The board scrolls (0 to 131). |
| Kanban cross-column drag by touch | **FAILS.** Holding at the right edge for 3s never scrolls the board (`scrollLeft` stays 0). With `scroll-snap-type:none` injected it reaches 1364. | Works. The board auto-scrolls (0 to 784) during the hold. I did not complete a verified drop into another column. |
| Kanban non-drag alternative | Card "..." Menu has MOVE TO radios (`board.tsx` ~l.800). Its size is not in the worst-offender list (the census was in 6-row slices); see `census.json`. | Same |
| Kanban tap on card | Opens the edit dialog. | Same |
| Inbox tap a row | Opens the issue drawer. It does not select the row. | Same |
| Inbox long-press (900ms) | Nothing. | Nothing. |
| Inbox row selection | Only via the checkbox, which is exactly 24x24 | Same |
| Calendar tap event | A popover opens (320x226). The event button is only 80x17 and overlapping events make taps unreliable. | A dialog opens (512x561). The button is 95x17. |
| Settings radios | Tap works (24x24). | Tap works (24x24). |
| Settings switches | Tap works (48x24 control, "Features and merging" section). | Not re-run. The script crashed on iPad after printing the iPhone result. |
| Settings checkboxes | 24x24 control inside a label row 24 high. | Not re-run. |
| Editor explorer drawer | The "Open file explorer" button is 32x32. Tap opens the drawer (384x664). | No button; the sidebar is persistent. |

Hover-only affordances: grep of `src/examples` for `group-hover`, `opacity-0`, `focus-within:opacity` and `hover:visible` found none. The only hover-reliant item is calendar event truncation. The event shows `STAND-` while the full text sits in a `title=` attribute (`calendar/app.tsx` l.165), which touch cannot read; however a tap opens the popover, which has the full text, so this is reachable on touch.

## (E) Target-size census
Counts are from `census.json` (same on midnight and sketch). Format is total interactive elements / under 24px / under 44px.

| Page | iPhone 13 | iPad Mini |
|---|---|---|
| kanban | 57 / 17 / 38 | 57 / 17 / 38 |
| inbox | 73 / 2 / 68 | 73 / 2 / 68 |
| settings | 30 / 2 / 17 | 30 / 2 / 17 |
| calendar | 59 / 15 / 41 | 59 / 15 / 40 |
| editor | 18 / 3 / 12 | 32 / 4 / 21 |

Note on "under 24": an element is counted if either dimension is under 24. Elements of exactly 24x24 pass 2.5.8 and are not counted. The counts are not corrected for the spacing exception.

Worst offenders:
- Every page: header link `← Examples` 78x16 and `Storybook ↗` 85.8x16, both anchors. Inline text links are partly exempt from 2.5.8.
- Kanban: `span[data-handle]` 22.4x16 (4 on screen at 390). 17 elements are under 24px.
- Calendar: week-grid event `button[aria-label^="STAND-UP..."]` 80x17 (iPhone) or 95.4x17 (iPad), and `SHIP NOTES` the same. About 15 elements are under 24px.
- Editor: `button "1 1"` 46.4x16, `Close find` 20x20 (iPad), `Close paginate.ts` and `Close math.ts` 24x24, the `[ midnight ]` or `[ sketch ]` level toggle 120.8x28 or 104x28, and `Open file explorer` 32x32.
- Inbox: select-all and row checkboxes 24x24, 68 of 73 under 44. The row itself is the main tap target and is fine.
- Settings: radios 24x24. Primary buttons are 40 high (DISCARD 95x40, SAVE 170x40, tabs 99x40, COPY/ROLL 70x40). Danger-zone buttons are 52 high.

## (F) Findings

**PT-01. Cross-column kanban drag is impossible by touch at phone width.** [touch + example-bug] High.
- Evidence: at 390px, dragging a handle to the board's right edge for 3s leaves `scrollLeft` at 0 (`k5.mjs`). Injecting `scroll-snap-type:none` fixes it (0 to 1364). The cause is that the auto-scroll adds 14px per frame to a `snap-x snap-mandatory` container, and the browser re-snaps. At iPad width, with columns narrower than the board, the same code scrolls.
- Fix: in the drag loop, switch the board's `scroll-snap-type` to `none` while a drag is live and restore it on drop. The MOVE TO menu is a single-pointer alternative, so WCAG 2.5.7 is arguably met via that menu. It is not a drag-by-touch fix.
- IN-LANGUAGE: no. This is example code, not a package gap. A package `Sortable` or board primitive could own it.
- References: https://www.w3.org/TR/css-scroll-snap-1/ ("the scroll container is required to be snapped ... when there are no active scrolling operations"; applies to programmatic scrolls); https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html

**PT-02. Midnight with backgrounds off prints illegible text and loses every fill.** [print + package-gap] High.
- Evidence: see (C)1 and `montage-*.png` row 1. Text contrast on white is 1.0 to 3.3:1. Fills, event blocks, tag chips and checked radios disappear. Colour coding is lost.
- Fix: one `@media print` block in the package that re-points text and surface roles to the sketch ink-on-paper values. Set `print-color-adjust: exact` on elements where a fill carries meaning (status, priority, selection).
- IN-LANGUAGE: yes. The sketch palette already exists.
- References: https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust (default `economy`: "might opt to leave out all background images and to adjust text colors"); https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

**PT-03. Inbox silently prints 22 of 60 rows (13 in landscape) and a blank page 2.** [print + example-bug] High.
- Evidence: see (C)2. The 518px scroll container clips rows. The header still says "60 of 60".
- Fix: in print, remove `overflow` and `max-height` from the table wrapper and let rows flow, with `break-inside: avoid` on rows.
- IN-LANGUAGE: partly. A package `DataTable` print rule is the right home, so the example does not need it.
- References: https://developer.mozilla.org/en-US/docs/Web/CSS/break-inside

**PT-04. Calendar uses 58% of A4 landscape width and breaks through events.** [print] Medium.
- Evidence: see (C)3. The grid has a fixed width. The page break lands at about 16:00 inside event boxes.
- Fix: in print, make the grid `width:100%`, add an `@page { size: A4 landscape }` hint for this route, and set `break-inside: avoid` on events.
- IN-LANGUAGE: no. This is a layout-specific rule.
- References: https://developer.mozilla.org/en-US/docs/Web/CSS/@page; https://developer.mozilla.org/en-US/docs/Web/CSS/break-inside

**PT-05. Sketch syntax colours collapse to one grey in greyscale.** [print + a11y] Low.
- Evidence: luma 66 to 86 of 255 for keyword, string, function and number. Legibility is preserved (at least 5.4:1) and weight or italic still distinguishes types.
- Fix: none needed for readability. If colour-coded meaning matters, keep a non-colour cue.
- IN-LANGUAGE: n/a.
- References: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html (1.4.1); https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

**PT-06. Kanban drag handle is 22x16 and `aria-hidden`.** [touch + a11y] Medium.
- Evidence: measured 22.4x16 on both devices. It is below 24x24 (2.5.8) and far below 44x44. On touch it is the only drag start, because card-body drags scroll the page. I know no sourced exception for it. The "equivalent" exception in 2.5.8 may apply through the MOVE TO menu if that menu's trigger is itself 24x24 or larger. I did not measure the "..." trigger separately.
- Fix: enlarge the hit area (padding or a pseudo-element) to 44x44 without changing the visual.
- IN-LANGUAGE: yes if the package ships a drag-handle primitive.
- References: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (exceptions: spacing, equivalent, inline, user agent, essential); https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html

**PT-07. Calendar event buttons are 17px high; 15 elements are under 24px.** [touch + a11y] Medium.
- Evidence: 80x17 on iPhone, 95x17 on iPad. Taps work, but overlapping events make the hit element uncertain (`elementFromPoint` returned a different element in the iPhone test). The popover has the full text.
- Fix: a minimum event height of 24 in the week view, or a collapsed list view at narrow width.
- IN-LANGUAGE: no.
- References: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

**PT-08. Tap vs select on inbox rows.** [touch] Low.
- Evidence: a row tap opens the drawer and does not select. Long-press does nothing. Selection works only through the 24x24 checkbox. 68 of 73 targets are under 44.
- Fix: acceptable. If wanted, a long-press-to-select is optional.
- IN-LANGUAGE: n/a.
- References: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html

**PT-09. `touch-action: none` is ineffective on inline elements.** [touch + package-gap watch item] Low.
- Evidence: the handle works only because it is `display:block` (from `flex`). The MDN "Applies to" excludes non-replaced inline elements. This is not a bug today, but it fails if the handle's display changes.
- Fix: a comment or a test in the example.
- IN-LANGUAGE: no.
- References: https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action

**PT-10. Editor, close-tab and level-toggle controls are small.** [touch + a11y] Low.
- Evidence: `Close find` 20x20, tab close buttons 24x24, level toggle 28 high.
- Fix: padding.
- IN-LANGUAGE: package Button `size` ladder.
- References: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

Unsourced claims: Apple HIG 44pt and Material 48dp could not be verified (both pages returned only their titles when fetched). The 44px figure is sourced only through WCAG 2.5.5. GOV.UK and Primer print guidance was not fetched. I did not run the Storybook components.

Not verified: PT-01 on a real device (Chromium CDP touch only, not iOS Safari). iPad-width switch and checkbox taps, because the script crashed. Kanban drop-into-column on iPad. Sizes for the "..." menu trigger, which are in `census.json` but I did not read them out.

Leftover process: the server on port 3100 is still running (PID in `$S/serve.pid`).
