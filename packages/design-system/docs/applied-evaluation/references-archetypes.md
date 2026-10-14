REFERENCES PASS: applied-evaluation, five archetype reports plus roll-up §2 (accessed 2026-10-14)

Conventions
- Tables cite sources by key, e.g. [W257]. Keys resolve to URLs in section D, so each URL appears once.
- Tag after a key: N = normative (WCAG, WAI-ARIA, ECMA/xterm); A = advisory (design-system or product docs); R = research or practitioner.
- "Fetched" means I read the page this session. "Search-only" means a WebSearch result confirmed it and I did not read the page. "Bank" means it was already sourced in site-integration.md or audit-gaps.md and I did not re-fetch it.
- A sub-claim marked CONTRADICTED sits inside a finding I otherwise rate SUPPORTED or PARTLY. I used verdict CONTRADICTED on its own only where a whole finding fails, and no finding does.
- ED-Fnn is editor.md F-nn. CAL-Fnn is calendar.md F-nn.

## A. Summary

| Report | IDs | SUPPORTED | PARTLY | CONTRADICTED (whole finding) | UNSOURCED | N/A |
|---|---|---|---|---|---|---|
| Kanban K-01..15 | 15 | 7 | 6 | 0 | 2 (K-12, K-14) | 0 |
| Inbox INB-01..16 | 16 | 6 | 9 | 0 | 1 (INB-14) | 0 |
| Settings SET-01..18 | 18 | 8 | 9 | 0 | 1 (SET-12) | 0 |
| Calendar CAL-F01..13 | 13 | 5 | 6 | 0 | 2 (F07, F12) | 0 |
| Editor ED-F01..19 | 19 | 5 | 11 | 0 | 2 (F14, F18) | 1 (F19, a "what held up" note) |
| Total | 81 | 31 | 41 | 0 | 8 | 1 |

Sub-claims where a source says something different. Each is flagged inline below.
1. **SET-08.** Carbon says the error replaces helper text. GOV.UK Character Count shows error and count together. The counter fix is supported, but the general "show both" rule is not.
2. **SET-05.** GOV.UK says prefixes and suffixes sit outside the input. The in-field copy and adornment proposal is only partly supported (Carbon puts a password toggle inside the field).
3. **INB-09.** GOV.UK says tags should not be interactive. Carbon allows dismissible tags for filters. `onRemove` is therefore contested.
4. **INB-12 and CAL-F04.** The APG tabs pattern requires `aria-controls` to a panel. Omitting it is a workaround. The APG-consistent fix is a different widget (segmented control or content switcher).
5. **SET-03 and SET-17.** Primer says never disable or hide the save button. This conflicts with the hand-rolled "disabled until dirty" SaveBar and with the disabled Save/Discard styling note.
6. **ED-F09.** The APG strongly recommends a visible close button. The "forced [ CLOSE ]" complaint is therefore weaker than the headerless-mode and `initialFocus` points.
7. **Roll-up row 6 and CAL-F02.** VS Code requires some editor colours to be non-opaque. A solid tint suits stacked calendar blocks. It does not suit editor selection, find or diff bands.
8. **INB-02.** WCAG 1.4.11 treats author hover effects as supplemental. Selected state must reach 3:1. Hover has no such requirement.
9. **SET-04.** WCAG 1.4.10 exempts data tables from reflow, so this is a usability finding, not a WCAG failure. A CSS "stack" mode also strips table semantics (Roselli).
10. **Contrast floor.** WCAG 1.4.3 exempts inactive components, so disabled Save/Discard contrast is not a failure. SET-17 is advisory only.
11. **Motion.** WCAG 2.3.3 (reduced motion) is AAA, not AA. It supports the finding but does not make it a conformance failure.
12. **Button size.** WCAG 2.5.8 requires 24px at AA and 2.5.5 requires 44px at AAA. "sm is 40px, not 44" fails the system's own JSDoc and the AAA bar, not AA.

## B. By element

### B1. Button
| ID | Claim | Verdict | References |
|---|---|---|---|
| K-01, INB-05, SET-14, CAL-F03 | Need a quiet/ghost button, icon-only form, and `xs` size | SUPPORTED | [C-btn] A: ghost is the least prominent kind, icon-only needs a tooltip, 7 sizes from xs. [P-btn] A: invisible variant, small size. [C-dt] A: xs row height 24px. |
| K-02, INB-05, SET-01 | Sketch tertiary = red reads as danger; emphasis is not meaning | PARTLY | [G-btn] A: "do not only rely on the red colour"; warning is for serious destructive use. [P-btn] A: danger only for destructive. [DESIGN §3] repo rule. [W141] N: colour is not the only cue. |
| K-03, SET-01 | Button needs `intent="danger"` | SUPPORTED | [P-btn] A: danger variant "used sparingly". [C-btn] A: danger kind (not icon-only). [C-modal] A: danger modal replaces primary with danger button. [G-btn] A: warning button used sparingly, with a confirmation step. |
| CAL-F03 | `sm` is 40px, not 44 | PARTLY | [W258] N: 24px minimum (AA). [W255] N: 44px (AAA). Fails the JSDoc and AAA, not AA. |
| CAL-F03 (original) | Google's toolbar is a flat icon-button row | UNSOURCED | Google Calendar help pages did not support it. |
| Roll-up 2 | Secondary louder than primary | SUPPORTED | [C-btn] A: one primary per screen; secondary only alongside a primary. [G-btn] A: avoid multiple default buttons per page. |

### B2. Table / DataTable
| ID | Claim | Verdict | References |
|---|---|---|---|
| INB-01 | Needs selection, row props, bulk slot | PARTLY | [C-dt] A: batch action bar on selection, header checkbox indeterminate, row hover always on. [LIN-sel] A: X, shift-click, shift+arrows, bulk actions. Gmail's selection-first behaviour not confirmed (help URL 404). |
| INB-07 | Sticky header and inner scroll are fragile | SUPPORTED | [M-sticky] N: sticks to nearest overflow ancestor; thead support varies, sticky `th` is the reliable form. [D-scroll] A: scrollable regions must be keyboard accessible. |
| INB-08 | 37px rows is too tall; need dense | PARTLY | [C-dt] A: 5 row sizes, 24px xs to 64px xl, 40px default. [P-dt] A: condensed/normal/spacious. [W258] N: 24px floor for the checkbox target. "Gmail 28-30px" unsourced (the Gmail pages found only name the density options). |
| INB-06 | Key handler on a non-interactive group trips lint; focusable container can't take `onKeyDown` | SUPPORTED | [J-nonint] A: non-interactive elements should not carry key handlers. [D-scroll] A: scroll region focusable. |
| SET-04 | No responsive mode; actions off-screen at 375 | PARTLY | [W1410] N (bank): data tables are exempt from reflow, so not a WCAG failure. [ROSELLI] R: `display:block/grid` on table parts strips table semantics; restore with ARIA and test. CONTRADICTION risk for a naive `responsive="stack"`. [D-scroll] A: supports the "make the scroll container keyboard-focusable" fix. |
| INB-11 | Scroll box clips rows when printed | SUPPORTED | See B15 Print. |
| SET-17 (sr-only actions header) | Header and per-row labels needed | PARTLY | [W131] N (bank): information and relationships programmatically determinable. |
| INB-16 | Sort, group, inline edit, virtualised selection missing | PARTLY | [LIN-disp] A: grouping and ordering exist in Linear. Inline editing and click-to-sort not sourced. |

### B3. Tabs, view switcher, segmented control
| ID | Claim | Verdict | References |
|---|---|---|---|
| CAL-F04 (SITE-04 dup) | Panel-less switcher emits dangling `aria-controls` | SUPPORTED | [A-tabs] N: each tab's `aria-controls` refers to its panel. [M-ariactl] N: value is an ID reference to a controlled element. [D-axe-valid] A: ARIA ID reference must be valid, Critical. |
| CAL-F04 fix | Use SegmentedControl / ViewSwitcher | SUPPORTED | [P-seg] A: pick one of a linear set of related choices (Preview/Raw/Blame). [C-switch] A: content switcher toggles views of the same content, tabs are for distinct areas. |
| INB-12 | Filter strip should be panel-less | PARTLY | [A-tabs] N: tabs always pair with panels, so omitting `aria-controls` deviates from the pattern. [P-uline] A: UnderlineNav (links) and UnderlinePanels (tabs) are separate. The fix is better as a different widget. |
| ED-F08 | Needs close, dirty, overflow, case preserved | PARTLY | [A-tabs] N: deletable tabs, Delete key, focus moves to next tab. [C-tabs] A: dismissible tabs, confirm if unsaved changes, scroll arrows on overflow. [VS-ui] A: VS Code preview tabs in italics (dirty dot not on that page). [M-tt] N: uppercase is visual only and hard to read in long text (support for case-preserving). |
| CAL-F11 | Tab strip needs overflow | SUPPORTED | [C-tabs] A: horizontal tabs scroll with arrows. [P-uline] A: scroll arrows on coarse pointers. |
| Roll-up 9 (SITE-05) | Non-tab children inside TabsList | SUPPORTED | [A-tabs] N (tablist contains tabs). Bank: SITE-05. |

### B4. Modal / Dialog / AlertDialog / Drawer
| ID | Claim | Verdict | References |
|---|---|---|---|
| ED-F09 | Modal needs `initialFocus`, headerless mode | PARTLY | [B-dialog] A: Base UI Dialog already has `initialFocus`/`finalFocus`, so the DS can pass them through. [A-dialog] N: initial focus choice depends on content. [B-auto] A: command palette example in a Dialog. CONTRADICTED sub-claim: [A-dialog] N says a visible close button is "strongly recommended". |
| SET-02 | AlertDialog cannot gate or pend confirm; type-to-confirm | PARTLY | [GH-del] A: GitHub makes you type the repo name. [C-modal] A: danger modal, primary replaced by danger button. [A-dialog] N: focus the least destructive action for irreversible steps. [B-alert] A: no pending/disabled-confirm example. |
| Roll-up 10 | Modal focus order | SUPPORTED | [A-dialog] N, [C-modal] A: first focus on the first input, or the primary button if there are no fields. |
| INB-10 | Drawer repeats title; no master/detail | PARTLY | See B13 Split pane. The duplicate-title claim has no external source. |
| ED-F14 | Mobile Drawer clumsy | UNSOURCED | [P-split] A (indirect): fullscreen overlay variant below 768px. |
| K-14 | Mobile header chrome | UNSOURCED | None. |

### B5. Drag-and-drop
| ID | Claim | Verdict | References |
|---|---|---|---|
| K-04, CAL-F13 | No drag primitive; need a non-drag path | SUPPORTED | [W257] N: all drag functionality must work by single pointer without dragging; keyboard alone does not satisfy it. A "Move to..." menu fits. [NN-dnd] R: handle reachable by Tab, grab by Space, announce state; menus can replace drag on mobile. |
| K-05 | Needs live-region announcer | SUPPORTED | [W413] N: status messages via role/properties without focus. [NN-dnd] R: give screen readers grabbed state and position. |
| K-08 | 22x16px handle, no grip glyph | SUPPORTED | [W258] N: 24x24 minimum (spacing exception possible). [NN-dnd] R: grabbed-state cues. |
| K-12 | Original has a Board/Lane primitive and sticky column headers | UNSOURCED | [LIN-disp] only confirms board toggle, grouping and display properties. |
| K-13 | Label picker needs multi-select/combobox | PARTLY | [A-combo] N, [A-listbox] N: multi-select models exist. Trello's original features not sourced. |
| K-15 | No roving focus for card lists | PARTLY | [A-toolbar] N, [A-grid] N: one tab stop plus arrows. Trello/Linear behaviour unsourced. Trello shortcuts (search-only): `<` and `>` move a card between lists. |
| K-06 | EmptyState too big for a column | PARTLY | [P-blank] A: Blankslate has `size` small/medium/large. |

### B6. Calendar / date grid
| ID | Claim | Verdict | References |
|---|---|---|---|
| CAL-F05 | No DatePicker/TimeField; native inputs unthemed | PARTLY | [M-date] N: picker appearance varies by browser and OS; display follows locale. [A-date] N: date picker dialog with grid role, arrows, PageUp/Down months, `aria-live` heading. [C-date] A: calendar popover with typed input. CONTRADICTED sub-claim: [G-date] A says plain text fields suit known dates; a calendar is for relative dates. |
| CAL-F08 | No roving-grid primitive, 27 tab stops | PARTLY | [A-grid] N: only one focusable element in the page tab sequence; Home/End/Ctrl+Home. [M-adesc] N: `aria-activedescendant` keeps focus on the container. Month-view `aria-required-children` claim unsourced. |
| CAL-F07 | 3+ overlapping events unreadable at 36px/h | UNSOURCED | None found. |
| CAL-F12 | Terminal medium n/a | UNSOURCED | Info-only; no claim to source. |
| CAL-F13 | Original has recurrence, time zones, drag-resize | PARTLY | [W257] N for the drag part. Google help URLs did not confirm. Android drag in 15-minute steps with undo toast is search-only (9to5google, unverified). |

### B7. Code view and syntax colour
| ID | Claim | Verdict | References |
|---|---|---|---|
| ED-F01 | No syntax Group; 4 hues | PARTLY | [VS-ct] A: syntax, workbench and semantic-token colour sets are separate parts of a theme. "8-12 token colours" unsourced. |
| ED-F07 | CodeBlock has no gutter or line decorations | PARTLY | [VS-tc] A: editor roles exist (`editorLineNumber.foreground`/`activeForeground`, `editor.lineHighlightBackground`, `editorIndentGuide.background`). No external source on line-addressed a11y. |
| ED-F16 | Breadcrumbs uppercases path segments | PARTLY | [M-tt] N: transform is visual only; screen readers read the source case; avoid long uppercase. No source says paths are case-significant. |
| ED-F17 | Syntax via `intent.*` breaks "emphasis not meaning" | PARTLY | [DESIGN §3] repo rule. [W141] N: colour not the only cue. |
| ED-F18 | `check:tokens` doesn't enforce "no Hues in components" | UNSOURCED | Repo governance only. |
| ED-F19 | What held up | N/A | Note, not a finding. |

### B8. Editor chrome, selection, find and diff (colour roles)
| ID | Claim | Verdict | References |
|---|---|---|---|
| ED-F02 | Needs editor-chrome roles; alpha faking fails AA | SUPPORTED | [VS-tc] A: confirms every key in the finding's list exists with these names (selection, find, line highlight, bracket match, indent guides, gutter added/modified/deleted, diff inserted/removed, line numbers, cursor). [W143] N: 4.5:1 measured against the background text renders on. CONTRADICTED sub-claim: VS Code says `editor.inactiveSelectionBackground`, `findMatchHighlightBackground` and `diffEditor.*TextBackground` "must not be opaque". Per-level literal `#rrggbbaa` (the finding's fix) matches that; an opaque tint here would not. |
| ED-F03 | Diff pair needs non-red/green | SUPPORTED | [GH-cb] A (search-only): GitHub ships Protanopia/Deuteranopia and Tritanopia themes. [W141] N. [JFLY] R: Okabe-Ito original; add shape/pattern, not only colour. [VS-tc] A: separate `diffEditor.inserted/removed` keys. |
| ED-F06 | Equal-luma hues die in greyscale | PARTLY | [W141] N: colour not the only means. [JFLY] R: use shapes, line types, hatching alongside colour. WCAG has no greyscale-distinctness rule. |
| K-... roll-up 5 | See B9. | | |

### B9. Colour, contrast, tints, role palette
| ID | Claim | Verdict | References |
|---|---|---|---|
| CAL-F01, ED-F01/F17 (roll-up 4) | 8 roles collapse to 5; CVD collapse; need `series` group | SUPPORTED | [W141] N. [JFLY] R: CVD-safe palette needs hue plus shape/hatching. [C-dv] A: Carbon ships an ordered 14-colour categorical sequence tuned for neighbour contrast (does not address CVD). [GH-cb] A. |
| CAL-F02 | `/15` alpha lets stacked blocks show through; need solid tint | PARTLY | [M-colormix] N: `color-mix()` of opaque inputs at 100% total is opaque, so a solid token is valid. [W143] N: contrast is measured against the specified background. CONTRADICTED for editor bands: see ED-F02 [VS-tc]. |
| CAL-F09 | Quiet ink on its own tint ~4.38:1 | SUPPORTED | [W143] N: 4.5:1, ratios are not rounded (4.499 fails). |
| ED-F04 (selection ghost) | Terminal selection barely visible | PARTLY | [VS-tc] A: `terminal.selectionBackground` exists. No external contrast rule for selection. |
| Roll-up 6 | Role-on-tint contrast gate | SUPPORTED | [W143] N. [M-colormix] N. |

### B10. Selection states, hover, skeleton
| ID | Claim | Verdict | References |
|---|---|---|---|
| INB-02, AUD-F11 (roll-up 5) | Selected row uses a forbidden surface step; hover = selected | SUPPORTED | [W1411] N: visual information identifying a selected state needs 3:1 against adjacent colours. [DESIGN theming.md "Selection State"] repo rule. CONTRADICTED sub-claim: WCAG treats hover as supplemental, so only selected must reach 3:1. [C-dt] A: row hover always enabled. |
| INB-04 | Skeleton nearly invisible; no table-row preset | PARTLY | [NN-skel] R: placeholder structure should mimic the final page; frame-only skeletons fail to convey it. [C-load] A: skeletons use motion to show the page is not stuck; reserve space. [P-load] A: avoid layout shift; one loading announcement per group; 1-3s waits. No WCAG contrast rule covers decorative placeholders. |

### B11. Forms, fields, errors
| ID | Claim | Verdict | References |
|---|---|---|---|
| SET-06 | Labels string-only, always uppercase; no optional/required marker | SUPPORTED | [C-form] A: sentence-case labels; mark the minority (optional) field. [G-txt] A: sentence case, no colons. [W332] N: labels or instructions, incl. format hints. [M-tt] N: uppercase hard to read in long text. DS uppercase is a deliberate brand choice. |
| SET-07 | Group error sits under last control | SUPPORTED | [G-chk] A: error sits below legend and hint, above the checkboxes. [W331] N: identify the item in error and describe in text. [G-fs] A: legend describes the group. |
| SET-08 | Error replaces helper; counter vanishes | PARTLY | [G-cc] A: error above field and count below, both visible. [B-field] A: Description and Error can co-exist. CONTRADICTED sub-claim: [C-form] and [C-txt] A say an error replaces helper text. |
| SET-05 | No copy, secret mask, or Input adornment | PARTLY | [C-txt] A: password visibility toggle inside the field, Enter/Space activates. [C-code] A: copy button feedback, focus stays on button. [STRIPE] A: "Reveal live key" and "Hide live key"; live secret shown once. [W413] N: announce COPIED. CONTRADICTED sub-claim: [G-txt] A says prefixes and suffixes sit outside the input. |
| SET-16 | Legend and label equal weight | PARTLY | [G-fs] A: legend describes the group; no weight rule. |
| SET-03, SET-18 | Dirty-state SaveBar, leave guard | PARTLY | [P-save] A: `beforeunload` guard, never auto-save mixed with explicit save, show feedback. CONTRADICTED sub-claim: Primer says never disable or hide Save. |
| SET-02 | Type-to-confirm | See B4. | |
| INB-14 | Select truncates; no multi-value | UNSOURCED | Only generic [A-listbox] N for multi-select. |

### B12. Tag / Badge / status components
| ID | Claim | Verdict | References |
|---|---|---|---|
| K-07, INB-09 (roll-up 16) | Too heavy; no `size="sm"` | PARTLY | [C-tag] A: tags in 3 sizes, small for condensed spaces. [G-tag] A: sentence case, regular weight. [M-tt] N. |
| INB-09 `onRemove` | Add remove affordance | PARTLY | [C-tag] A: dismissible tags exist for filters, not for persistent labels. CONTRADICTED sub-claim: [G-tag] A says do not make tags interactive. |
| SET-09 | NoteBlock `warning` rendered as danger | PARTLY | [P-banner] A: `warning` and `critical` are separate variants. Names are not defined on the fetched page. |
| SET-10 | Radio and Checkbox identical unchecked | SUPPORTED | [NN-chk] R (bank): checkbox = square, radio = circle with dot. [G-radios] A (bank): one-of-many uses radios. [W141] N. |

### B13. Split pane, toolbar, tree
| ID | Claim | Verdict | References |
|---|---|---|---|
| INB-10, ED-F13 | No SplitPane; master/detail | PARTLY | [A-split] N: separator role, `aria-valuenow`, arrows, Enter collapse, F6. [P-split] A: resizable pane, collapses below 768px. |
| INB-15, ED-F13 | No Toolbar with roving focus | PARTLY | [A-toolbar] N: one tab stop, arrows between controls; recommended for 3+ controls. [B-tool] A: Base UI has Toolbar with `loopFocus`. Bar height jump: UNSOURCED. |
| ED-F10 | TreeDiagram is a figure, not a tree | SUPPORTED | [A-tree] N: arrows, Home/End, type-ahead, `aria-expanded`. [P-tree] A: file-tree use with trailing status labels. |
| ED-F13 (`Kbd`, StatusBar) | Missing | PARTLY | [VS-ui] A: VS Code status bar and activity bar. No source for `Kbd`. |
| INB-03 | No keyboard-list primitive | SUPPORTED | [A-listbox] N: arrows, type-ahead, Shift/Ctrl multi-select, `aria-activedescendant`. [A-grid] N: one tab stop. [M-adesc] N. [LIN-sel] A: X, Shift+arrows. |

### B14. Command palette
| ID | Claim | Verdict | References |
|---|---|---|---|
| ED-F09, INB-16 (roll-up 10) | No command palette | SUPPORTED | [B-auto] A: documented Command palette example (inline `Autocomplete` in `Dialog`), groups, fuzzy via match-sorter. [A-combo] N: `role=combobox`, `aria-activedescendant`. [VS-ui] A: Ctrl+Shift+P. [LIN-sel] A: Cmd/Ctrl+K opens the command bar. |

### B15. Print
| ID | Claim | Verdict | References |
|---|---|---|---|
| K-09, INB-11, SET-13, CAL-F06, ED-F15 (roll-up 1) | No print layer; dark prints dark or vanishes; bands lose backgrounds | SUPPORTED | [M-pca] N: default `economy` may drop backgrounds and adjust text; `exact` is a request; user settings override. [M-break] N: `break-inside: avoid` keeps blocks together. Repeating `thead` per page: [M-display] N lists `table-header-group` but says nothing about print. CAL-F06's "fills carrying text must not depend on print-color-adjust" is supported by the MDN override note. |

### B16. Motion
| ID | Claim | Verdict | References |
|---|---|---|---|
| K-10, CAL-F10, SET-17 (roll-up 17) | Button, Tabs, toggle ignore reduced motion | SUPPORTED | [W233] N: interaction motion can be disabled; `prefers-reduced-motion` is a sufficient technique (AAA). [M-rm] N (bank): reduce means remove or replace motion. |

### B17. Touch targets
| ID | Claim | Verdict | References |
|---|---|---|---|
| K-08, INB-13, CAL-F03 (roll-up 18) | Under 44px / under 24px targets | SUPPORTED | [W258] N: 24x24 (AA) with spacing exception. [W255] N: 44x44 (AAA). |
| INB-13 | Gmail/Linear mobile long-press, bottom bar | UNSOURCED | No original-product doc confirmed. |

### B18. Terminal / ANSI
| ID | Claim | Verdict | References |
|---|---|---|---|
| ED-F04 (roll-up 14) | `brightBlack`, selection, sketch white are unreadable | SUPPORTED | [XT] N: SGR 90-97 are the bright foregrounds. [XTJS] A: `minimumContrastRatio`, 4.5 for WCAG AA. [VS-term] A: VS Code raises/lowers luminance until 4.5:1. [W143] N. Terminals compensate at runtime, but palette gating is still right. |
| ED-F05 | No CSS ANSI vars; no Kitty/VS Code emitters | PARTLY | [VS-tc] A: `terminal.ansi*`, `terminal.selectionBackground` keys exist. [XT] N: 38;5 and 38;2 forms. CSS var names and Kitty: UNSOURCED. |
| ED-F11 | Terminal has no ANSI or error/warn kinds | PARTLY | [XT] N: SGR spec for parsing. |
| ED-F12 | ChangeSummary is not a diff view | PARTLY | [VS-tc] A: `diffEditor.*` roles. Unified/split diff behaviour not confirmed (GitHub docs page lacked it). |

### B19. Skipped or repo-internal findings (no external source applies)
K-12, K-14, INB-14, SET-12, CAL-F07, CAL-F12, ED-F14, ED-F18, CAL-F13 originals (Google Calendar), INB-08 Gmail row height, INB-13 originals.

## C. Roll-up rows 1-27

| # | Best references |
|---|---|
| 1 Print | [M-pca] N, [M-break] N. SUPPORTED. |
| 2 Button ladder | [C-btn] A, [P-btn] A. SUPPORTED. |
| 3 Danger/intent | [G-btn] A, [C-modal] A. SUPPORTED. |
| 4 Role palette | [W141] N, [JFLY] R. SUPPORTED. |
| 5 Surface-step states | [W1411] N, [DESIGN theming.md "Selection State"]. SUPPORTED (hover is only supplemental). |
| 6 Opaque tint | [M-colormix] N supports solid; [VS-tc] A contradicts it for editor bands. PARTLY. |
| 7 DataTable as inbox | [C-dt] A, [M-sticky] N. PARTLY. |
| 8 Keyboard composites | [A-grid] N, [A-listbox] N, [A-toolbar] N, [A-tree] N. SUPPORTED. |
| 9 Tabs | [A-tabs] N, [D-axe-valid] A. SUPPORTED. |
| 10 Dialog shells | [B-dialog] A, [A-dialog] N. PARTLY. |
| 11 Drag | [W257] N, [NN-dnd] R. SUPPORTED. |
| 12 Temporal primitives | [A-date] N, [M-date] N. PARTLY ([G-date] contradicts "picker first"). |
| 13 Code, diff, tree, terminal | [VS-tc] A, [A-tree] N, [XT] N. PARTLY. |
| 14 ANSI gaps | [XTJS] A, [VS-term] A. SUPPORTED. |
| 15 Form limits | [C-form] A, [G-cc] A, [G-chk] A. PARTLY ([C-txt] says error replaces helper). |
| 16 Badge/Tag | [C-tag] A, [G-tag] A. PARTLY. |
| 17 Reduced motion | [W233] N, [M-rm] N (bank). SUPPORTED. |
| 18 Density floor | [C-dt] A, [W258] N. PARTLY. |
| 19 Elevation inconsistency | UNSOURCED (repo-internal). |
| 20 Type scale drift | UNSOURCED (bank notes: no official minimum font size). |
| 21 Hover/cursor grammar | UNSOURCED. [W1411] N: hover is supplemental. |
| 22 Current-item idioms | [A-tabs] N, aria-current MDN (bank). PARTLY. |
| 23 Focus polish | [W258] N, [W2411] N, 2.4.13 (bank). PARTLY. |
| 24 Narrow-viewport defects | [W1410] N (bank, tables exempt), [ROSELLI] R. PARTLY. |
| 25 NoteBlock/Radio/AppShell | [P-banner] A, [NN-chk] R (bank). PARTLY. |
| 26 ThemeProvider bug | [R-strict] A: StrictMode runs an extra setup/cleanup cycle in development. Plausible mechanism; the bug is unverified. PARTLY. |
| 27 Polish items | UNSOURCED. |

## D. Bibliography (accessed 2026-10-14)

Normative
- [W257] https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html (fetched)
- [W143] https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html (fetched)
- [W233] https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html (fetched)
- [W1411] https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html (fetched)
- [W141] https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html (fetched)
- [W258] https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (fetched)
- [W255] https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html (fetched)
- [W413] https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html (fetched)
- [W332] https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html (fetched)
- [W331] https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html (fetched)
- [W2411] https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html (fetched)
- [W1410] https://www.w3.org/WAI/WCAG22/Understanding/reflow.html (bank)
- [W131] https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html (bank)
- [A-grid] https://www.w3.org/WAI/ARIA/apg/patterns/grid/ (fetched)
- [A-listbox] https://www.w3.org/WAI/ARIA/apg/patterns/listbox/ (fetched)
- [A-tree] https://www.w3.org/WAI/ARIA/apg/patterns/treeview/ (fetched)
- [A-toolbar] https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/ (fetched)
- [A-split] https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/ (fetched)
- [A-dialog] https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ (fetched)
- [A-combo] https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/ (fetched)
- [A-tabs] https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ (fetched)
- [A-date] https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/ (fetched)
- [M-pca] https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust (fetched)
- [M-break] https://developer.mozilla.org/en-US/docs/Web/CSS/break-inside (fetched)
- [M-display] https://developer.mozilla.org/en-US/docs/Web/CSS/display (fetched)
- [M-ariactl] https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-controls (fetched)
- [M-adesc] https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-activedescendant (fetched)
- [M-date] https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/date (fetched)
- [M-sticky] https://developer.mozilla.org/en-US/docs/Web/CSS/position (fetched)
- [M-colormix] https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix (fetched)
- [M-tt] https://developer.mozilla.org/en-US/docs/Web/CSS/text-transform (fetched)
- [M-rm] https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion (bank)
- [XT] https://invisible-island.net/xterm/ctlseqs/ctlseqs.html (fetched; first 100k chars)
- Dropped: MDN `@media/print` returned 404.

Advisory (design systems and product docs)
- [G-btn] https://design-system.service.gov.uk/components/button/
- [G-txt] https://design-system.service.gov.uk/components/text-input/
- [G-cc] https://design-system.service.gov.uk/components/character-count/
- [G-fs] https://design-system.service.gov.uk/components/fieldset/
- [G-chk] https://design-system.service.gov.uk/components/checkboxes/
- [G-tag] https://design-system.service.gov.uk/components/tag/
- [G-date] https://design-system.service.gov.uk/components/date-input/
- [G-radios] https://design-system.service.gov.uk/components/radios/ (bank)
- [P-btn] https://primer.style/components/button/
- [P-tree] https://primer.style/components/tree-view/
- [P-dt] https://primer.style/product/components/data-table/
- [P-uline] https://primer.style/components/underline-nav/
- [P-split] https://primer.style/components/split-page-layout/
- [P-load] https://primer.style/product/ui-patterns/loading/
- [P-save] https://primer.style/product/ui-patterns/saving/
- [P-banner] https://primer.style/components/banner/
- [P-seg] https://primer.style/components/segmented-control/
- [P-blank] https://primer.style/components/blankslate/
- [C-tag] https://carbondesignsystem.com/components/tag/usage/
- [C-dt] https://carbondesignsystem.com/components/data-table/usage/
- [C-btn] https://carbondesignsystem.com/components/button/usage/
- [C-load] https://carbondesignsystem.com/patterns/loading-pattern/
- [C-modal] https://carbondesignsystem.com/components/modal/usage/
- [C-tabs] https://carbondesignsystem.com/components/tabs/usage/
- [C-form] https://carbondesignsystem.com/components/form/usage/
- [C-notif] https://carbondesignsystem.com/components/notification/usage/
- [C-date] https://carbondesignsystem.com/components/date-picker/usage/
- [C-dv] https://carbondesignsystem.com/data-visualization/color-palettes/
- [C-switch] https://carbondesignsystem.com/components/content-switcher/usage/
- [C-code] https://carbondesignsystem.com/components/code-snippet/usage/
- [C-txt] https://carbondesignsystem.com/components/text-input/usage/
- [B-tool] https://base-ui.com/react/components/toolbar
- [B-dialog] https://base-ui.com/react/components/dialog
- [B-auto] https://base-ui.com/react/components/autocomplete
- [B-alert] https://base-ui.com/react/components/alert-dialog
- [B-field] https://base-ui.com/react/components/field
- [VS-tc] https://code.visualstudio.com/api/references/theme-color
- [VS-ui] https://code.visualstudio.com/docs/getstarted/userinterface
- [VS-term] https://code.visualstudio.com/docs/terminal/appearance
- [VS-ct] https://code.visualstudio.com/api/extension-guides/color-theme
- [XTJS] https://xtermjs.org/docs/api/terminal/interfaces/iterminaloptions/
- [GH-del] https://docs.github.com/en/repositories/creating-and-managing-repositories/deleting-a-repository
- [STRIPE] https://docs.stripe.com/keys
- [LIN-disp] https://linear.app/docs/display-options
- [LIN-sel] https://linear.app/docs/select-issues
- [D-scroll] https://dequeuniversity.com/rules/axe/4.10/scrollable-region-focusable
- [D-axe-valid] https://dequeuniversity.com/rules/axe/4.10/aria-valid-attr-value
- [J-nonint] https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/no-noninteractive-element-interactions.md
- [R-strict] https://react.dev/reference/react/StrictMode
- Search-only: [GH-cb] https://github.blog/changelog/2022-04-19-protanopia-deuteranopia-colorblind-themes-beta/

Research and practitioner
- [NN-skel] https://www.nngroup.com/articles/skeleton-screens/
- [NN-dnd] https://www.nngroup.com/articles/drag-drop/
- [NN-chk] https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/ (bank)
- [JFLY] https://jfly.uni-koeln.de/color/ (Okabe and Ito, colour universal design)
- [ROSELLI] https://adrianroselli.com/2018/02/tables-css-display-properties-and-aria.html
- Repo: [DESIGN §3] (colour by job, emphasis not meaning), [DESIGN theming.md "Selection State"]. DESIGN.md §1-§9 headings confirmed by grep.

Not citable (tried and dropped)
- Trello `/shortcuts` rendered an error page (search results confirm `<` and `>` move a card between lists).
- Google Calendar help (support.google.com/calendar/answer/6110849) does not mention drag or colours. Gmail help URL 404.
- Atlassian design pages returned 404 or were blocked.
- Material 3 snackbar is JS-rendered, and the Polaris page redirects.
- GitHub "comparing commits" did not mention unified or split diff views.
- Primer forms overview had no required/optional guidance.
- Okabe-Ito hex values and Wong 2011 attribution come from third-party blogs only. I cited the original jfly page for the principle instead.

## Skipped
- Roll-up rows 19-21 and 27: repo-internal styling or polish with no external claim.
- AUD-F ids: not in scope.
- Original-product claims from Gmail, Google Calendar and Trello that could not be fetched: INB-13, CAL-F03, CAL-F13, K-12, K-15.
- Not verified at runtime: any claim that rests on measured behaviour in the DS itself (computed durations, contrast numbers, StrictMode bug).
