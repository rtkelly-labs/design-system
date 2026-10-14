# @rtkelly13/design-system v0.14.0: component-level visual quality audit

**Note:** the harness refused to write `FINDINGS.md` ("Subagents should return findings as text"). This message is the full document. Supporting artifacts are in `/private/tmp/claude-501/-Users-ryankelly-code-personal/bf919a17-fd46-452f-9827-41b743b650ae/scratchpad/audit/`: `shots/`, `sheets/`, `focus.json`, `audit-v375.json` / `audit-v768.json` / `audit-v1280.json`, `contrast-report.txt`, and the capture scripts.

Worktree: `temp/eval-applied-archetypes`, read-only. Baseline docs read: DESIGN.md, AGENTS.md, gap-analysis, surface-readiness, capability-readiness, evaluation, testing. `gap-analysis.md` and `evaluation.md` describe a 36-component system and are stale. `capability-readiness.md` is current (every row `ready`). Findings below are deltas against that state. Nothing repeats a recorded gap.

---

## A. Method and coverage

**Built and run.**
- I built Storybook to scratch (`storybook build -o scratchpad/audit/sb`, 359 stories) and served it on :6106.
- `pnpm walkthrough` produces one viewport at three themes in an HTML report, so I wrote my own Playwright driver instead (`capture.mjs`).
- Screenshots: every story x {midnight, sketch} x {375, 768, 1280}, 2,154 PNGs. Animations frozen, `reducedMotion: reduce`.
- A per-story DOM audit ran at every viewport:
  - page-level horizontal scroll;
  - any computed `border-radius` other than 0;
  - any blurred `box-shadow`;
  - font-size, font-family and text-transform census.
- Contact sheets (midnight | sketch side by side) for every family below, read by eye.
- Keyboard: programmatic Tab walk (up to 10 stops) on 1,022 focus stops across 335 stories, both themes. I recorded outline style, width and offset per stop, and looked at focus crops for Button, Input, Checkbox, Switch, Radio, Select, Tabs and Pagination.
- Hover/active: computed-style diff for 13 components.
- Print: `emulateMedia('print')` on 8 stories (Card, DataTable, ReportDocument, Prose, StatCard, BarChart, NoteBlock, CodeBlock), both themes.
- Shadow, border and transition census across all stories.
- `pnpm check:contrast` (read-only, plus `--report`) and `pnpm ansi:check`.

**Clean results from the DOM audit.**
- No non-zero border-radius anywhere except 2 `pre` elements at 6px in `docs-layout-portal--prose-only` and `--full-portal` (confirmed by the audit; I did not trace which style rule produces it).
- No blurred shadows anywhere.
- No horizontal overflow at 768 or 1280.
- Every one of the 1,022 focus stops has a 2px solid ring (the one exception is the `drawer--from-the-left` dialog container in sketch, acceptable).
- Hard edges and offset shadows are well enforced.

**Not viewed, or only partly.**
- `SaaS/*`, `Showcase/*`: generated, not reviewed (other agents' territory).
- `Manifesto/*` (14), `Blog/LoremIpsumPost`, `TrackCard`, `MetadataGrid`, `ColophonCard`, SlideDeck interior beyond the default deck, `Foundations/TickerTape`: generated, not reviewed.
- 768 was eyeballed on 6 stories only.
- Real print-to-PDF and `@page` were not tested; I used screenshot under print media.
- Terminal medium: `ansi:check` passes (8 scheme files, 16 distinct slots per level). The terminal medium is colour schemes only. I did not render them in a terminal emulator. The only text-glyph analogues (`AsciiGauge`, `TelemetryGauge`, `Divider`, docs figures) were checked on the web render only.

**Caveats that shaped the findings.**
- My contact sheets scale 1280 captures to 0.6. Anything called "small" below is a measured computed size, not a sheet impression.
- My capture freeze zeroes animation, so static Spinner and Skeleton frames are artefacts. `Spinner.tsx` keeps a slow spin under reduced motion by design.
- Fixed overlays were hidden in cropped sheets. I re-captured Modal, AlertDialog and Drawer at viewport size.

**Contrast gate (read-only).** `check:contrast` is OK: 260 pairs, 24 selection devices, 16 Role/Hue checks. Closest to the margin:

| Pair | Value | Min | Note |
|---|---|---|---|
| sketch `border.default` on `surface.sunken` | 3.01 | 3.0 | sketch inputs inside wells |
| sketch `palette.*` on `surface.sunken`, all 10 hues | 5.51 to 5.60 | 5.5 | narrowest class |
| midnight `border.subtle` on `surface.raised` | 1.48 | 1.4 | |
| sketch `border.subtle` on `surface.sunken` | 1.47 | 1.4 | |
| midnight `text.muted` on `surface.raised` | 5.43 | 4.5 | |
| sketch `text.muted` on `surface.sunken` | 5.03 | 4.5 | |

The report also prints non-gated surface-step contrasts (raised vs base 1.09 midnight / 1.11 sketch; sunken vs base 1.03 / 1.08). That is as designed (DESIGN.md section 5), but it has consequences for F03 and F11.

---

## B. Per-family scorecard (1 = poor, 5 = excellent)

| Family (stories) | Spacing | Type | State coverage | Theme parity | Print | Justification |
|---|---|---|---|---|---|---|
| Actions & forms (52) | 4 | 3 | 4 | 5 | 2 | Complete form set with all-states stories and solid focus. No hover on Checkbox, Switch, Radio. Secondary button is an ink-filled block that outshouts the primary. |
| Content (23) | 4 | 3 | 3 | 4 | 2 | Card has no offset shadow while NoteBlock does, and Card's own copy claims one. Badge, Tag and BracketText are three small-label idioms. |
| Feedback (29) | 4 | 4 | 3 | 4 | 2 | Error/status pages and EmptyState are consistent. Skeleton is 1.03:1 on midnight. Toast shadows collide. EmptyState mixes bracketed and plain action labels. |
| Overlays (22) | 4 | 4 | 4 | 5 | 2 | Modal, AlertDialog and Drawer are clean. Menu popup double-rings. Sketch scrim is mid-grey (known, #81). |
| Navigation (25) | 3 | 3 | 4 | 4 | 2 | Pagination: four accent colours in one control, ASCII arrows against icon chevrons elsewhere, a 375px overflow. Four active-item idioms. Footer headings 9.6px. |
| Layout (16) | 4 | 3 | 3 | 4 | 2 | AppShell is the best-composed surface. PageTitle (double frame) and PageHeader (raised panel) solve the same job differently. Divider is fixed-width. |
| Icons (7) | 3 | 3 | 3 | 4 | 3 | NerdIcon inside a filled Button is faint or missing. |
| Data (27) | 3 | 2 | 3 | 4 | 2 | Axes and gauges at 10px. BulletChart and Sparkline tiny and unlabelled. DataTable clips headers mid-word at 375 with no cue. |
| Marketing (12) | 3 | 4 | 3 | 5 | 2 | Hero, CTA, Feature read well. Feature/Pricing cards have no offset shadow while CTA has one. PricingGrid is 3-up at 768 and wraps bracketed buttons. |
| Reports (3) | 4 | 3 | 4 | 5 | 3 | Only family with `print:` utilities. Midnight still prints a dark ground. |
| Docs layout/content (39) | 4 | 3 | 4 | 4 | 2 | Polished. 1px dashed frames differ from 2px solid elsewhere. Sidebar toggle 18px, breadcrumb links 15px tall. |
| Docs figures (30) | 3 | 2 | 3 | 4 | 2 | In-language. Text 9.8 to 10.5px. ActivityGrid month labels misaligned. |
| Foundations / Blog / Presentation | 4 | 4 | 4 | 5 | 2 | Gauges at 10px. Slide copy still says "THREE MODES". Slide prev/next differ from Pagination. |

Print is 2 almost everywhere because only `ReportDocument` declares any print behaviour (F01).

---

## C. Findings

Severity: **H** visible defect or likely consumer-facing bug, **M** inconsistency or gap a careful user notices, **L** polish. "IN-LANG" = the fix stays inside the brutalist-neon language.

### Print

**F01. No print palette: midnight prints as white-on-white** (print, **H**, midnight, all components except ReportDocument)
- Evidence: under print emulation, body stays `rgb(10,10,26)` with `rgb(255,255,255)` text for Card, DataTable, Prose, StatCard, charts and NoteBlock. `grep print src` finds only `ReportDocument.tsx`, and its `print:` utilities drop margins, not colour. Browsers drop background graphics by default, so midnight prints as near-invisible white ink.
- Fix: a documented `@media print` block in `styles.css` that re-points `--ds-*` roles to sketch values (or `print-color-adjust: exact` on a boxed ground), plus a snapshot on Card and Table. IN-LANG.

**F02. ReportDocument has no print-specific pagination or palette** (print, **M**, midnight)
- Evidence: `components-reports-reportdocument--quality-gate`. The component is explicitly for paper. It drops margins in print but renders the dark ground, and I found no `break-inside: avoid` handling in the print utilities.
- Fix: the F01 swap, plus `break-inside: avoid` on stat-card rows, table rows and disclosure blocks. IN-LANG.

### Tokens, spacing and type

**F03. Elevation by offset shadow is applied in some containers and absent in others** (inconsistency, **M**, both)
- Evidence: shadow census over all stories: `4px 4px` on 161 elements, `2px 2px` on 20, `6px 6px` on 7, `8px 8px` on 3, `3px 3px` on 3. DESIGN.md section 6 names 2/4/6.
- `Card` (`components-content-card--default`) computes `box-shadow: none`, while its own story text says "Zero border-radius with 4px hard offset shadow".
- `StatCard`, `EmptyState`, FeatureGrid and PricingGrid cards, DataTable and docs frames have none. `NoteBlock`, `TLDR`, `CTASection`, `Toast` and `ChartTooltip` have a coloured offset.
- Surface steps are about 1.1:1 (section A), so flat containers rely only on a 2px border.
- Fix: define one "raised" recipe (border-2 plus a hard-offset shadow in an accent) and adopt it on Card, StatCard and Pricing/Feature, or state in DESIGN.md which containers are intentionally flat. Retire the off-scale 3px and 8px. IN-LANG.

**F04. The declared type scale has six tokens; the rendered scale is about 25 sizes** (token/spacing, **M**, both)
- Evidence: `theme.css` declares `--ds-type-{body,caption,display,hero,lead,title}`. The rendered census over 359 stories (computed `font-size`):
  - mono 9.0, 9.6, 9.8, 10.0, 10.4, 10.5, 11.0, 11.2, 11.5, 12.0, 12.3, 12.8, 13.6, 14.0, 14.4, 15.2, 16.0 and more;
  - display/sans 11.2 up to 96.
- Source: `text-[10px]` x11, `text-[0.85rem]` x3, `text-[0.75rem]` x3, `text-[11px]` x2, `text-[9px]`, `text-[0.7em]`, `text-[0.75em]`, `text-[0.6875rem]`. Rem multiples and px literals are mixed.
- Fix: promote three label steps (about 10, 11, 12px) to `--ds-type-*` and lint arbitrary `text-[<n>px|rem]`. IN-LANG.

**F05. Micro-text under 11px carries real information** (token/spacing, **M**, both)
- Evidence: about 800 characters render at 9.0 to 10.5px mono.
  - Footer column headings ("ELSEWHERE", "PRODUCT") at 9.6px.
  - Breadcrumbs 10 to 11.5px; `DocPager` "PREVIOUS" 10.4px; TrackCard 9px.
  - Chart tick labels 10px; gauge labels 10px; StatCard delta about 10px.
  - Docs figures 9.8 to 10.5px; `Card` panel kicker 10.4px.
- Contrast is fine (muted on midnight raised is 5.43:1). The size is the issue.
- Fix: floor at 11px for anything that is not purely decorative. IN-LANG.

**F06. Border vocabulary has drifted to seven styles** (inconsistency, **L**, both)
- Evidence, counted in the census: 2px solid (606), 1px solid (79), 2px dashed (39), 1px dashed (23), 4px double (17, the title frame on PageTitle, Hero and BlogPost), 4px solid (10), 3px solid (3).
- Dashed frames appear on EmptyState, status pages, docs figures, Steps and Terminal. Everything else is 2px solid.
- Fix: document the intentional ones (dashed = placeholder or figure, double = display title) and remove the stray 3px. IN-LANG.

**F07. Transition durations and easings are mixed** (inconsistency, **L**, both)
- Evidence: 0.12s ease (84 elements), 0.15s ease (74), 0.15s cubic-bezier(0.4,0,0.2,1) (366), 0.2s cubic-bezier (90), 0.5s (2). `--ds-duration-*` and `--ds-ease` exist.
- Fix: route every component through the tokens; the 0.12s ease group is the outlier. IN-LANG.

### State gaps and interaction

**F08. Checkbox, Switch, RadioGroup and linked Card have no hover state** (state-gap, **M**, both)
- Evidence: computed-style diff on hover is `NONE` for `checkbox--unchecked` label, `switch--off`, `radiogroup--default` label and `card--full-card` link, despite `cursor: pointer`. Input hover is also `NONE`; its active state is just the focus colour.
- By contrast Button grows its shadow 4px to 6px, Tab recolours text and border, Table rows fill, and Tag-as-link swaps accent.
- Fix: one rule: hover moves the control border to `accent.primary` and brightens the label. IN-LANG.

**F09. Button cursor is `default`; links, labels and switches are `pointer`** (inconsistency, **L**, both)
- Evidence: hover probe reports `cursor: default` on `button--default`, the `card--default` button and the menu trigger. Tag link, Checkbox and Switch report `pointer`. Disabled Button reports `not-allowed`.
- Fix: `cursor-pointer` on enabled buttons. IN-LANG.

**F10. Hover grammar differs across clickable elements** (inconsistency, **L**, both)
- Evidence: Button grows its shadow. Tag as link swaps fill to a different accent (yellow to pink on midnight, green to red on sketch) and adds a `2px 2px` shadow. Tabs recolour text and border.
- Fix: one grammar per element class and a fixed accent. IN-LANG.

**F11. Skeleton is nearly invisible on midnight** (state-gap, **M**, midnight; sketch slightly better)
- Evidence: `components-feedback-skeleton--shapes`, `--loading-card`, `--loading-table`. Fill is `rgb(5,5,16)` on `#0a0a1a`, 1.03:1, held only by a 1px `border-subtle` (1.66:1). Sketch is 1.08:1 with a 1.47 to 1.59 hairline.
- Fix: use the `border-default` hairline or a hatched `//` fill. No blur or gradient. IN-LANG.

**F12. Spinner at rest resembles an empty checkbox** (visual-refinement, **L**, both)
- Evidence: `components-feedback-spinner--default`: a hollow box with one highlighted edge, beside the Checkbox glyph. Moving it reads as motion. The risk is only where rotation is paused (print, screenshot, forced `animation: none`). Note: `Spinner.tsx` deliberately keeps a slow spin under reduced motion.
- Fix: add a notch or a corner glyph so a still frame reads as busy. IN-LANG.

**F13. Disabled controls separate from muted helper text only by dimming** (state-gap, **L**, midnight)
- Evidence: `checkbox--disabled` and `fieldset--disabled`: dim box and label on a dim ground.
- Fix: diagonal hatch or strike on the control box. IN-LANG.

### Inconsistency (two components, one problem)

**F14. The secondary button is an inverted ink block that outweighs the primary** (visual-refinement, **M**, both)
- Evidence: midnight "DISCARD CHANGES", "DOCS INDEX", "STATUS PAGE", "REQUEST ACCESS", "INSTALL", "TOUR" and "SEE THE DOCS" are solid `#ffffff` next to an accent primary. Sketch renders the same role as solid graphite. It is the highest-contrast fill in the viewport (see `notfoundpage--with-search`, `errorsummary--account-settings`, `ctasection--default`).
- Fix: make the secondary an outline or ghost with the offset shadow and reserve the ink fill for another role. IN-LANG.

**F15. Bracket usage within one action group is inconsistent** (inconsistency, **M**, both)
- Evidence:
  - `modal--with-footer`: `CANCEL` plain, `[ DELETE ]` bracketed.
  - `emptystate--empty-search-result`: `CLEAR FILTERS` plain, `[ EDIT QUERY ]` bracketed.
  - `emptystate--first-run`: `[ NEW RULE ]` and `IMPORT A SET`.
  - `notfoundpage--with-search`: `[ SEARCH THE DOCS ]` and `DOCS INDEX`.
- The implied rule is "primary bracketed, secondary plain", but it is not written down and not followed everywhere. DESIGN.md section 8 makes bracketed labels the voice.
- Fix: state and enforce the rule, or bracket both. IN-LANG.

**F16. "Current item" has four idioms** (inconsistency, **M**, both)
- Evidence:
  - `SiteNav` horizontal: 2px underline.
  - `SiteNav` vertical and `SiteFooter`: 3px left bar plus sunken fill.
  - `DocsSidebar`: tinted fill plus left bar.
  - `AppSidebar`: solid accent fill with shadow.
  - `Tabs`: filled, underline, and a short right-edge bar for the vertical variant, which floats detached from the list.
- Fix: bar plus tint for vertical lists, underline for horizontal, solid fill for segmented only. IN-LANG.

**F17. Tabs use a different accent per variant** (inconsistency, **L**, both)
- Evidence: `tabs--default` primary (cyan/blue), `tabs--underline` secondary (yellow/green), `tabs--vertical` tertiary (pink/red). Docs `CodeTabs` repeats the three.
- Fix: default all to `accent.primary` and take accent as a prop. IN-LANG.

**F18. Pagination uses four accents and ASCII arrows; Slide uses icon chevrons for the same affordance** (visual-refinement, **M**, both)
- Evidence: `components-navigation-pagination--middle-page`: PREV cyan, NEXT pink, current page yellow, other pages white-on-ink. `<< PREV` and `NEXT >>` are literal ASCII, while Slide controls, Select, Menu and Popover use real glyph icons (`Slide` shows `‹ ›`).
- Fix: same accent for PREV and NEXT, current page `accent.primary`, one shared arrow set. IN-LANG.

**F19. PageTitle and PageHeader solve the same job two ways** (inconsistency, **M**, both)
- Evidence: `layout-pagetitle--default` is a 4px double frame around 48px display type; `layout-pageheader--default` is a raised panel with large brackets and no border. `Hero` and `BlogPost` titles reuse the double frame. The PageTitle subtitle is about 10px accent and is dwarfed by the 48px title.
- Fix: one display-title frame; PageHeader inherits it. IN-LANG.

**F20. Badge, Tag, BracketText: three small-label idioms with no stated division of labour** (inconsistency, **L**, both)
- Evidence: Badge is an outlined chip, Tag a filled `#` chip, BracketText plain `[ X ]`. `ColophonCard` falls back to `ui-serif` at 128px in the font census, the one off-stack face.
- Fix: document "Badge = status, Tag = taxonomy, BracketText = inline label"; move the serif to the display stack.

**F21. Helper-text casing drifts** (inconsistency, **L**, both)
- Evidence: StatCard footers "> 42 Nodes Healthy" and "> 0 Critical Alerts" (Title Case) against `> NOTHING HAS RUN YET` and `> Four running, one waiting on review.` DESIGN.md section 8 asks for lowercase in code contexts and UPPERCASE_SNAKE for terminal-flavoured labels.
- Fix: normalise story copy.

**F22. Slide copy is stale** (inconsistency, **L**, both)
- Evidence: `presentation-slide--default` heading "ONE STACK, THREE MODES" with "Dark, dim and sketch resolve from the same semantic layer". There are two levels.
- Fix: edit the story text.

### Theme parity

**F23. Sketch scrim is mid-grey** (theme-parity, **M**, sketch)
- Evidence: modal, alert-dialog and drawer stories at viewport size render a `~#626262` scrim on sketch against near-black on midnight. This is the already-tracked #81 case; I confirm it is still present.
- Fix: none new; cite #81.

**F24. Sketch raised panels read as stark white on warm paper** (theme-parity, **L**, sketch)
- Evidence: `EmptyState`, `StatCard`, `NotFoundPage` and `PageHeader` panels render as `#ffffff` on `#f5f3ec`, the lightest value on the page. Midnight raised is a navy step. This is a judgement call, not a defect.
- Fix: consider a paper-tinted `surface.raised` (for example `#fbfaf5`), which would need to pass `check:contrast`. A palette decision. IN-LANG.

### Overlays, focus and a11y

**F25. Menu and SiteNav popups show a container focus ring plus the border** (a11y, **M**, both)
- Evidence: `overlays-menu--actions` and `navigation-sitenav--with-children` show a 2px accent outline outside the popup's own 2px border (double line). The ring belongs on the highlighted item.
- Fix: a scoped `:focus-visible` override on the popup (not `outline-none`, per `focus-ring.test.ts`). IN-LANG.

**F26. Focus-ring offset is inconsistent** (inconsistency, **L**, both)
- Evidence: all 1,022 stops have a 2px solid ring (good), but offsets split. 1px: Button (44 stories), Pagination, Tag-as-link, ColophonCard, link-styled buttons. 2px: everything else (about 790 stops). On a Button the 1px ring crowds the 4px shadow.
- Fix: one `--ds-focus-offset` token. IN-LANG.

**F27. Small hit targets** (a11y, **M**, both)
- Evidence: DataTable sort buttons 91x16, 77x16, 102x16; `DocsSidebar` toggles 18x18; Popover close 26x20; breadcrumb links 30x15; DocsHeader links 23px tall; "COPY LINK" 22px; ErrorSummary links 20px. WCAG 2.5.8 AA minimum is 24x24.
- Fix: extend the hit area (an invisible `::after`) to 24px. IN-LANG.

### Responsive and long content

**F28. Page-level horizontal overflow at 375** (visual-refinement, **M**, both, 375)
- Evidence (DOM audit; none at 768 or 1280):
  - `pagination--as-links-many-pages`: `scrollWidth` 382 against 375, NEXT clipped.
  - `tooltip--sides`: 436 against 375.
  - `presentation-slidedeck--autoplay` and `--with-speaker-notes`: 397 against 375, control bar.
  - `manifesto--levels`: 761 against 375.
- Fix: Pagination and SlideDeck controls wrap or collapse. Non-link Pagination already collapses to `[ 1 / 5 ]`, so extend it to the links variant. IN-LANG.

**F29. DataTable at 375 clips headers mid-word with no scroll cue** (visual-refinement, **M**, both, 375)
- Evidence: `datatable--default` and `--with-rendered-cells` show "DURATIC" and "COMMI"; no fade, shadow or hint. Sort hit target is 16px (F27).
- Fix: sticky first column plus a hard-edged overflow marker. IN-LANG.

**F30. PricingGrid stays 3-up at 768 and wraps bracketed button text** (visual-refinement, **M**, both, 768)
- Evidence: `marketing-pricinggrid--default` at 768: three about 230px columns, buttons wrap to "[ START / FREE ]" with brackets pinned at both ends. FeatureGrid four-columns correctly drops to 2x2 at the same width.
- Fix: 1-up under about 900px and `whitespace-nowrap` on bracketed buttons.

**F31. Divider does not fill its container, and the `patterns` story renders as single glyphs** (visual-refinement, **M**, both)
- Evidence: `layout-divider--default` is a 56-character string in a 1248px container with `overflow: hidden`, so the rule stops about a third of the way. `layout-divider--patterns` shows `=`, `-=` and `*` as one glyph each, not tiled. At 375 the same 56 characters would clip.
- Fix: repeat to container width (CSS repeat or measured), or use a background pattern. IN-LANG.

**F32. Toast stack shadows collide** (visual-refinement, **L**, both)
- Evidence: `feedback-toast--all-intents`: the toast-to-toast gap is about 6px, so each 4 to 6px shadow lands on the next toast's border.
- Fix: 12px gap. IN-LANG.

**F33. Controlled Tabs title truncates at 375** (visual-refinement, **L**, both, 375)
- Evidence: `tabs--controlled` shows "DEPLOYME…" with the toggle group taking the width.

**F34. Vertical Tabs panel is shorter than its tab list** (visual-refinement, **L**, both)
- Evidence: `tabs--vertical`: the panel box ends above the list bottom, so the two boxes do not share an edge.
- Fix: `align-items: stretch`.

### Icons, data and figures

**F35. NerdIcon inside a filled Button is faint or missing** (visual-refinement, **M**, both)
- Evidence: `icons-nerdicon--bracketed-in-ui`: "DEPLOY REPLICA" shows a barely visible glyph on the pink fill; "PURGE POD" shows only a blank gap where the glyph should be, in both themes. Either a coloured icon on an accent fill or a missing symbol glyph.
- Fix: icons in filled controls inherit `currentColor`; confirm the glyph with `check:fonts`.

**F36. BulletChart and Sparkline are too small and have no empty state** (visual-refinement, **M**, both)
- Evidence: `data-bulletchart--*` render about 120x8px with no value, scale or target label. `sparkline--empty` renders nothing, with no placeholder.
- Fix: minimum size, a value label, and a `---` placeholder for empty. IN-LANG.

**F37. BarChart colours each bar by intent with no key** (visual-refinement, **L**, both)
- Evidence: `barchart--vertical` shows green, cyan, yellow, yellow, pink bars; the mapping is not shown, and hue is the only channel. Tick labels are 10px.
- Fix: a pattern or glyph per intent, 11px ticks. IN-LANG.

**F38. DataTable caption sits tight under the last row** (visual-refinement, **L**, both)
- Evidence: `datatable--sorted-with-caption`: centred 9 to 10px caption about 4px under the last row inside the frame.
- Fix: caption above, left-aligned, `[ CAPTION ]` style.

**F39. Virtualized DataTable ends mid-row** (state-gap, **L**, both)
- Evidence: `datatable--virtualized` stops at a cut-off row with no bottom rule, scroll cue or row count.

**F40. ActivityGrid month labels do not align to columns** (visual-refinement, **L**, both)
- Evidence: `docs-figures-activitygrid--blog-posting-cadence`. The `commits` variant's glyph ramp (`. = - # @`) is hard to read at 10px.

**F41. Docs right-rail "ON THIS PAGE" has no current-section marker** (state-gap, **L**, both)
- Evidence: `docs-layout-docslayout--default`, while the left sidebar has a strong active bar.
- Fix: scroll-spy marker. IN-LANG.

### Terminal

**F42. Sketch ANSI bright slots are darker than base** (terminal, **L**, sketch)
- Evidence: the DESIGN.md hue table (for example red `#bd0010` to bright `#8f002a`). Deliberate, for contrast on paper. `ansi:check` passes (16 distinct slots per level, clean fixture diff).
- Risk: terminals that render bold as bright will darken bold text on sketch. Worth one line in the terminal docs; nothing to change.

---

## D. Top 10 highest-leverage refinements

1. **F01/F02 Print palette.** One `@media print` token swap fixes every component at once; midnight currently prints as near-invisible white ink.
2. **F03 One raised recipe, or a stated flat/raised rule.** Card, StatCard, Pricing, Feature and EmptyState carry no offset shadow while Button, NoteBlock and CTA do. This is the most visible departure from DESIGN.md section 6, and Card's own copy contradicts its rendering.
3. **F14 Demote the secondary button.** The inverted ink block outweighs the primary in at least 7 stories.
4. **F04/F05 Collapse the type scale.** Promote three label sizes to `--ds-type-*`, floor at 11px, and lint arbitrary `text-[Npx]`.
5. **F08 Hover for Checkbox, Switch, Radio and linked Card.** Cheap and visible on every form.
6. **F16/F17/F18 One "current item" grammar and one prev/next treatment.** Navigation has four idioms for current, and Pagination uses four accents with ASCII arrows.
7. **F28/F29/F30 375/768 repairs.** Pagination and SlideDeck overflow, DataTable header clipping and affordance, PricingGrid wrap.
8. **F25/F26/F27 Focus and target polish.** Menu double ring, one focus-offset token, 24px hit areas (sort buttons are 16px).
9. **F11/F36 Make low-contrast fills legible.** Skeleton (1.03:1 fill on midnight) and BulletChart/Sparkline.
10. **F15 Bracket rule for action groups.** Decide and enforce "primary bracketed, secondary plain" (or bracket both); it is the system's signature and is inconsistent inside single dialogs.

Runner-up: **F31 Divider**, which stops visibly short of the container at desktop width.
