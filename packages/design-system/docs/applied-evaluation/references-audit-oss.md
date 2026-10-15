REFERENCES PASS: component audit (F01-F42) and OSS survey. Access date for every URL: 2026-10-14. All URLs below resolved when fetched. Nothing in the repo was edited and git was not run. npm and GitHub facts were pulled live from the registry and GitHub APIs and bundlephobia.

Source types: N = normative, A = advisory (design-system guidance), R = research, P = package fact. Bank = already in audit-gaps.md "Source key".

## (A) Summary counts

Audit, 42 findings: SOURCED 7, PARTLY 15, CONTRADICTED 1, UNSOURCED 19.
- SOURCED: F01, F14, F27, F28, F37, F38, F42.
- PARTLY: F02, F03, F04, F05, F07, F08, F11, F13, F16, F18, F20, F29, F30, F35, F41.
- CONTRADICTED: F09.
- UNSOURCED: F06, F10, F12, F15, F17, F19, F21, F22, F23, F24, F25, F26, F31, F32, F33, F34, F36, F39, F40.
- Two source-vs-claim problems in the brief's pointers:
  - WCAG 2.4.11 is Focus Not Obscured, and 2.4.13 is Focus Appearance (AAA). Neither requires or mentions focus-ring offset, so F26 has no normative basis.
  - The audit's "WCAG 2.5.8 minimum is 24x24" is correct, but 2.5.8 has a spacing exception (see F27).
- Skipped for lack of a findable source: the remaining UNSOURCED items, which are mostly L-severity house-style or copy findings. Higher-severity ones I tried and failed on: F25 (menu double ring), F26, F36 (BulletChart/Sparkline), F31 (Divider), F23 (scrim; the Material 3 pages returned no body text), and F15 and F19, which are repo-internal.

OSS survey, about 75 claims checked: about 66 CONFIRMED, 5 CORRECTED, 4 still UNVERIFIED. Four of the nine section 6 items were resolved.
- Corrections: Calendar/DateField history, Monaco evidence source, @daypicker/react relationship, the `action` prop on Base UI Form, and a unit note on bundlephobia sizes.
- Still unverified: marginal dependency costs, `zod/mini` size, CodeMirror Tab-trap and screen-reader behaviour, and current-version Monaco and xterm `var()` behaviour.

## (B) Audit by element

### Print (F01, F02)

| ID | Claim | Verdict | References |
|---|---|---|---|
| F01 | Midnight prints white-on-white; no print palette | SOURCED | MDN print-color-adjust — https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust — default `economy` lets the browser drop background images and adjust text colours for white paper; `exact` keeps them — A (browser spec docs) |
| F02 | ReportDocument lacks print pagination (break-inside) | PARTLY | MDN break-inside — https://developer.mozilla.org/en-US/docs/Web/CSS/break-inside — `avoid` stops a break inside a box; example is figure+caption; tables not covered, so fragmentation support is uneven — A |

### Tokens, type, spacing (F03-F07)

| ID | Claim | Verdict | References |
|---|---|---|---|
| F03 | Offset shadow on some containers, none on others | PARTLY | Atlassian Elevation — https://atlassian.design/foundations/elevation — default is flat plus border; raised is for movable cards; do not raise "when a border or white space would suffice"; pair surface and shadow tokens consistently — A. This supports "pick a rule and pair tokens" but cuts against "every card needs a shadow". The 2/4/6 scale itself rests on DESIGN.md section 6. |
| F04 | 6 declared type tokens vs about 25 rendered sizes | PARTLY | Carbon Typography — https://carbondesignsystem.com/elements/typography/overview/ — the scale comes from "a single equation" and the smallest step is 12px — A |
| F05 | Text under 11px carries real information | PARTLY | Carbon Typography (same URL) — smallest scale step is 12px, not stated as a floor — A. Butterick Point Size — https://practicaltypography.com/point-size.html — web body optimum "15-25 pixels"; says nothing on a minimum — R. AccessibleWeb (Bank) — no official minimum. The 11px floor has no source. Do not present it as a standard. |
| F06 | Seven border styles | UNSOURCED | None found. Internal consistency claim. |
| F07 | Mixed transition durations and easings | PARTLY | MDN transition-timing-function — https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function — `ease` = cubic-bezier(0.25,0.1,0.25,1), so `ease` and cubic-bezier(0.4,0,0.2,1) are different curves — A. The token-routing rule is the repo's own. Material motion tokens page returned no body text. |

### Interaction states (F08-F13)

| ID | Claim | Verdict | References |
|---|---|---|---|
| F08 | Checkbox/Switch/Radio/linked Card have no hover | PARTLY | Carbon Checkbox — https://carbondesignsystem.com/components/checkbox/usage/ — "The only hover effect ... is a pointer shape change" — A. This is contrary evidence: Carbon treats cursor-only hover as sufficient for checkboxes. The finding stands as "inconsistent with Button/Tab/Table hover", not as "defective". |
| F09 | Button cursor is `default`; links and labels are `pointer` | CONTRADICTED | Tailwind v4 upgrade guide — https://tailwindcss.com/docs/upgrade-guide — "Buttons now use `cursor: default` ... to match the default browser behavior" — A. MDN cursor — https://developer.mozilla.org/en-US/docs/Web/CSS/cursor — `pointer` "indicates a link"; `default` is the platform arrow — P. The audit's fix (pointer on buttons) is a preference, not a standard. Carbon (above) uses a pointer on checkbox hover. |
| F10 | Hover grammar differs across clickable elements | UNSOURCED | Primer pages fetched were stubs; Material States page returned no body. |
| F11 | Skeleton fill 1.03:1 on midnight | PARTLY | NN/g Skeleton Screens — https://www.nngroup.com/articles/skeleton-screens/ — skeletons are "light gray boxes" representing content; animation optional and can cause accessibility problems — R. WCAG 1.4.11 — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html — silent on skeletons; decorative graphics are exempt — N. No source sets a skeleton contrast figure. |
| F12 | Static Spinner resembles an empty checkbox | UNSOURCED | WCAG 2.2.2 — https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html — a loading animation can be "essential" (Note 4), which fits the audit's note that Spinner keeps spinning under reduced motion — N. NN/g Response Times — https://www.nngroup.com/articles/response-times-3-important-limits/ — show a busy indicator for waits over 1s — R. Neither addresses a still frame resembling a checkbox. |
| F13 | Disabled controls differ from muted text only by dimming | PARTLY | WCAG 1.4.3 — https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html — text of inactive components is exempt from contrast — N. WCAG 1.4.11 (URL above) — inactive components exempt. Dimming is therefore not a failure. The hatch suggestion is unsourced. |

### Buttons, labels, current-item, pagination (F14-F18, F20)

| ID | Claim | Verdict | References |
|---|---|---|---|
| F14 | Inverted ink secondary outweighs primary | SOURCED | Carbon Button usage — https://carbondesignsystem.com/components/button/usage/ — secondary "less saturated ... less visual prominence"; "Do not use two high-emphasis buttons in a button group" — A. GOV.UK Button — https://design-system.service.gov.uk/components/button/ — one default (primary) button per page; secondary for secondary actions — A |
| F15 | Bracketing inconsistent within one action group | UNSOURCED | Repo basis only (DESIGN.md section 8). Carbon covers button-group ordering, not label styling. |
| F16 | "Current item" has four idioms | PARTLY | MDN aria-current (Bank) — semantics only. APG Tabs — https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ — active tab "is styled to indicate that it is active", with no visual spec — N. GOV.UK Pagination — https://design-system.service.gov.uk/components/pagination/ — current page via `aria-current="page"` — A. No source prescribes one visual idiom. |
| F17 | Tabs use a different accent per variant | UNSOURCED | None. |
| F18 | Pagination has four accents and ASCII arrows | PARTLY | Carbon Pagination — https://carbondesignsystem.com/components/pagination/usage/ — previous/next are "ghost icon buttons"; collapses at small breakpoints — A. GOV.UK Pagination (above) — fewer page links on small screens, ellipses for skipped pages — A. Neither mentions accent colour. |
| F20 | Badge, Tag, BracketText have no stated division of labour | PARTLY | Atlassian Lozenge — https://atlassian.design/components/lozenge/usage — lozenge for status; tag for descriptive metadata; badge for tallies — A. This is a model for documenting the division. The Atlassian tag page itself returned empty. |

### Layout, copy, theme (F19, F21-F24)

| ID | Claim | Verdict | References |
|---|---|---|---|
| F19 | PageTitle and PageHeader solve the same job two ways | UNSOURCED | None. |
| F21 | Helper-text casing drifts | UNSOURCED | DESIGN.md section 8 only. |
| F22 | Slide copy says "three modes", but there are two levels | UNSOURCED | DESIGN.md section 2 (two levels) only. |
| F23 | Sketch scrim is mid-grey | UNSOURCED | #81 is tracked internally. Material scrim pages returned no body. |
| F24 | Sketch raised panels stark white on paper | UNSOURCED | None. It is a judgement call, as the audit says. |

### Overlays, focus, targets (F25-F27)

| ID | Claim | Verdict | References |
|---|---|---|---|
| F25 | Menu/SiteNav popup shows ring plus border (double line) | UNSOURCED | WCAG 2.4.7 — https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html — says nothing on clipped or double indicators — N. |
| F26 | Focus-ring offset inconsistent (1px vs 2px) | UNSOURCED | WCAG 2.4.13 — https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html — AAA; requires a 2px-perimeter-area indicator with 3:1 change; "Offset isn't required" — N. WCAG 2.4.11 — https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html — about author content hiding the component; says nothing on offset or crowding — N. The ring's 2px width is supported (2.4.13); the offset consistency is not. |
| F27 | Hit targets under 24x24 | SOURCED | WCAG 2.5.8 — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — 24x24 CSS px, except spacing, inline-in-sentence and similar — N. Caveat: sort buttons or links that do not overlap a 24px circle around neighbouring targets pass under the spacing exception. Inline links in running text are exempt. |

### Responsive and long content (F28-F34)

| ID | Claim | Verdict | References |
|---|---|---|---|
| F28 | Page-level horizontal overflow at 375 | SOURCED | WCAG 1.4.10 Reflow — https://www.w3.org/WAI/WCAG22/Understanding/reflow.html — vertical-scroll content must work at 320 CSS px without loss; data tables and grids excepted — N. The 375px overflows breach the spirit rather than the 320px letter. |
| F29 | DataTable clips headers at 375 with no scroll cue | PARTLY | WCAG 1.4.10 (same URL) — tables are exempt, but recommends placing a table in its own scrollable container so the rest of the page reflows — N. A scroll cue is not required. That part is unsourced. |
| F30 | PricingGrid stays 3-up at 768 and wraps bracketed labels | PARTLY | WCAG 1.4.10 (same URL) — general reflow; 768 is wider than the criterion's 320px — N. The fix is design preference. |
| F31 | Divider does not fill its container | UNSOURCED | None. |
| F32 | Toast shadows collide | UNSOURCED | None. |
| F33 | Controlled Tabs title truncates at 375 | UNSOURCED | Bank cites WCAG 1.4.4 F69 for clipped text, but that is about text resize, not 375px truncation. |
| F34 | Vertical Tabs panel shorter than list | UNSOURCED | APG Tabs (URL above) — only requires aria-orientation="vertical"; no layout guidance — N. |

### Icons, data, figures, docs (F35-F41)

| ID | Claim | Verdict | References |
|---|---|---|---|
| F35 | NerdIcon in filled Button faint or missing | PARTLY | MDN color value — https://developer.mozilla.org/en-US/docs/Web/CSS/color_value — `currentColor` takes the element's `color`, so icons inherit button text colour — P. A missing glyph is a font-coverage matter with no source. |
| F36 | BulletChart/Sparkline too small, no empty state | UNSOURCED | None. |
| F37 | BarChart colours by intent with no key | SOURCED | WCAG 1.4.1 — https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html — colour cannot be the only means of conveying data; techniques G111 (colour plus pattern) and G14 (text) — N |
| F38 | DataTable caption sits tight under the last row | SOURCED | WAI Tables caption — https://www.w3.org/WAI/tutorials/tables/caption-summary/ — caption "functions like a heading for a table", first child of `<table>` — A. MDN caption-side — https://developer.mozilla.org/en-US/docs/Web/CSS/caption-side — initial value `top` — P. Both support moving it above. |
| F39 | Virtualized DataTable ends mid-row | UNSOURCED | None. |
| F40 | ActivityGrid month labels misaligned | UNSOURCED | None. |
| F41 | Docs right-rail has no current-section marker | PARTLY | ONS Service Manual — https://service-manual.ons.gov.uk/design-system/components/table-of-contents — the table of contents highlights the subheading in view — A. Nordhealth Outline — https://nordhealth.design/components/outline — active entry exposed with aria-current="location" — A. Both came from a search summary, not a full page fetch. No usability research found. |

### Terminal (F42)

| ID | Claim | Verdict | References |
|---|---|---|---|
| F42 | Darker sketch bright slots darken bold in terminals that render bold as bright | SOURCED | Alacritty man page — https://github.com/alacritty/alacritty/blob/master/extra/man/alacritty.5.scd — `draw_bold_text_with_bright_colors`: "bold text is drawn using the bright color variants", default false — P. The risk is real but opt-in for that terminal. |

## (C) OSS verification

"OK" in the result column means the registry latest version, date, licence and size all matched oss.md. Bundlephobia gzip figures are consistently 2-3% below oss.md's because oss.md uses kB (1000) and bundlephobia reports KiB (1024). That is a unit difference, not an error; for example @dnd-kit/react 32.3 KiB equals 33.1 kB, and ag-grid 368.1 KiB equals 377 kB. All gz figures in oss.md reconcile on that basis.

| Package | Claim | Checked against | Result | URL |
|---|---|---|---|---|
| @base-ui/react | 1.9.0, MIT, released 2026-10-09 | npm registry | CONFIRMED | https://registry.npmjs.org/@base-ui/react/latest |
| @base-ui/react | Exports map has 80 entries with no `./calendar`; has `./internals/temporal`, `-adapter-date-fns`, `-adapter-luxon` | registry `exports`; unpkg 1.9.0 file listing (0 calendar files, 28 temporal files) | CONFIRMED | https://unpkg.com/@base-ui/react@1.9.0/?meta |
| @base-ui/react | `date-fns`, `@date-fns/tz` optional peers | registry `peerDependenciesMeta` | CONFIRMED | same registry URL |
| Base UI Calendar | "Calendar and DateField were built (#1973, #3666), then moved to internals (#4505)" | GitHub PR API | CORRECTED: #1973 merged 2026-03-13 as a non-exported Calendar. #3666 DateField was closed unmerged on 2026-04-13. #4505 (merged 2026-04-13) moved the exported temporal utilities to `internals/*` and removed the private Calendar component. master `packages/react/src` has no calendar folder. | https://github.com/mui/base-ui/pull/1973 and /3666 and /4505 |
| Base UI #1709 | Open; users asking on 2026-07-08 | GitHub | CONFIRMED (updated 2026-07-08; also asks on May 4, May 20, Jun 2, Jun 8) | https://github.com/mui/base-ui/issues/1709 |
| Base UI #4786 | Scheduler "very low probability" | GitHub | CONFIRMED | https://github.com/mui/base-ui/issues/4786 |
| Base UI Autocomplete | Docs include a command-palette example: Dialog plus `inline` Autocomplete with `open`, `autoHighlight="always"`, `keepHighlight` | docs page | CONFIRMED | https://base-ui.com/react/components/autocomplete |
| Base UI Autocomplete | Fuzzy example uses `match-sorter`; `useFilter`; `virtualized` with TanStack Virtual at 10,000 items | docs page | CONFIRMED | same |
| Base UI Combobox | Nested `inline` in Dialog: bind `open`/`onOpenChange` so query, highlight and input reset on close | docs page | CONFIRMED | https://base-ui.com/react/components/combobox |
| Base UI 1.9.0 release | `Menu.FilterProvider`/`Menu.Input` preview; Autocomplete `autoHighlight` for async | release notes | CONFIRMED | https://github.com/mui/base-ui/releases/tag/v1.9.0 |
| Base UI Form | `errors` keyed by `Field.Root name`, `onFormSubmit`, `validationMode`, `actionsRef.validate()`, Zod `flattenError().fieldErrors` | docs page | CONFIRMED | https://base-ui.com/react/components/form |
| Base UI Form | `action` for `useActionState` | docs page | CORRECTED: shown only in an example (`action={formAction}`), absent from the API reference table | same |
| cmdk | 1.1.1, MIT, 2025-03-14; depends on `@radix-ui/react-dialog` (plus react-id, react-primitive, react-compose-refs) | registry | CONFIRMED | https://registry.npmjs.org/cmdk/latest |
| kbar | 1.0.0; deps `@radix-ui/react-portal`, `fuse.js`, `@tanstack/react-virtual` | registry | CONFIRMED (published 2026-08-10) | https://registry.npmjs.org/kbar/latest |
| match-sorter | 8.3.0, MIT; no `exports`; CJS main; deps `@babel/runtime`, `remove-accents`; 3.2 KiB | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/match-sorter/latest |
| @tanstack/match-sorter-utils | 9.2.6, MIT, module, exports map, one dep `remove-accents`, 2.6 KiB | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/@tanstack/match-sorter-utils/latest |
| fuse.js | 7.5.0, Apache-2.0, 9.2 KiB | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/fuse.js/latest |
| @dnd-kit/react | 0.5.0, MIT, 2026-06-11, peers `^18 \|\| ^19`; 32.3 KiB | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/@dnd-kit/react/latest |
| @dnd-kit/react | No `"use client"`; `defaultPreset` includes Accessibility, AutoScroller, Cursor, Feedback, PreventSelection | unpkg `index.js` head (imports `defaultPreset`; no directive) | CONFIRMED for the no-directive claim; the preset plugin list was not re-read | https://unpkg.com/@dnd-kit/react@0.5.0/index.js |
| dnd-kit repo | 17.7k stars, 143 open issues, pushed 2026-09-12 | GitHub API | CONFIRMED (17,711, 143, 2026-09-12) | https://github.com/clauderic/dnd-kit |
| @dnd-kit/core, sortable | 6.3.1 (2024-12-05), 10.0.0 (2024-12-04), legacy | registry | CONFIRMED | https://registry.npmjs.org/@dnd-kit/core/latest |
| pragmatic-drag-and-drop | 4.0.0, Apache-2.0, 2026-09-24; no `exports`, no `type`, `main` is cjs with a `module` field | registry, unpkg package.json | CONFIRMED | https://unpkg.com/@atlaskit/pragmatic-drag-and-drop@4.0.0/package.json |
| pragmatic-drag-and-drop | Root entry exports `{}`; subpaths are nested stub package.json files | unpkg | CONFIRMED (root says "Not exporting anything from the root entry point"; `element/adapter/package.json` is a stub with main/module only) | https://unpkg.com/@atlaskit/pragmatic-drag-and-drop@4.0.0/element/adapter/package.json |
| pragmatic-drag-and-drop | GitHub licence API reports NOASSERTION | GitHub API | CONFIRMED | https://github.com/atlassian/pragmatic-drag-and-drop |
| pragmatic-drag-and-drop | Fails plain-Node ESM (`ERR_UNSUPPORTED_DIR_IMPORT`) | not executed | UNVERIFIED (still a prediction from the manifest) | n/a |
| Atlassian DnD a11y guidance | Recommends a "More" menu of move outcomes; no arrow-key controls | Atlassian page | CONFIRMED at source (resolves section 6 item 1) | https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines/ |
| @hello-pangea/dnd | 18.0.1, Apache-2.0, 2025-02-09; no `exports`; deps redux, react-redux; 28.1 KiB | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/@hello-pangea/dnd/latest |
| sortablejs | 1.15.7, MIT, 2026-02-11, UMD main | registry | CONFIRMED | https://registry.npmjs.org/sortablejs/latest |
| dragula | 3.7.3, last published 2020-09-29 | registry | CONFIRMED | https://registry.npmjs.org/dragula/latest |
| @formkit/drag-and-drop | 0.6.1; peer `@marko/runtime-tags` | registry | CONFIRMED | https://registry.npmjs.org/@formkit/drag-and-drop/latest |
| @react-aria/dnd / react-aria-components | Apache-2.0; 32.6 KiB; RAC 272.6 KiB; RAC published 2026-10-09 | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/react-aria-components/latest |
| react-day-picker | 10.0.2, MIT, 2026-09-30, exports map, deps `date-fns`, `@date-fns/tz` | registry | CONFIRMED | https://registry.npmjs.org/react-day-picker/latest |
| @daypicker/react | "Thin re-export of react-day-picker 10.0.2" | registry | CORRECTED to CONFIRMED-with-detail: it is a 57 KB package whose only dependency is `react-day-picker`, so it is a wrapper. Canonical install name is still the project's call. Prefer `react-day-picker` as the dependency root. | https://registry.npmjs.org/@daypicker/react/latest |
| @internationalized/date | 3.12.4, Apache-2.0, 2026-09-01, 10.8 KiB | registry | CONFIRMED | https://registry.npmjs.org/@internationalized/date/latest |
| date-fns | 4.4.0, MIT, 2026-05-29, `type:module` | registry | CONFIRMED | https://registry.npmjs.org/date-fns/latest |
| temporal-polyfill | 1.0.6, MIT, 19.4 KiB | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/temporal-polyfill/latest |
| Temporal (native) | Firefox 139 and Chrome 144 ship it; MDN "not Baseline"; Safari stable unconfirmed | caniuse, MDN | CONFIRMED for Chrome 144 and Firefox 139. RESOLVED: Safari has no stable release through 27.2 (Technology Preview only). MDN labels it "Limited availability". | https://caniuse.com/mdn-javascript_builtins_temporal |
| @full-ui/headless-calendar | 7.1.2, MIT, 0 deps, 53.7 KB unpacked, peer temporal-polyfill, 2026-10-12 | registry | CONFIRMED | https://registry.npmjs.org/@full-ui/headless-calendar/latest |
| @full-ui/headless-calendar | README: used by `@fullcalendar/core`, "not yet thoroughly documented" | raw README | CONFIRMED | https://github.com/fullcalendar/fullcalendar/tree/main/packages/headless-calendar |
| FullCalendar | 7.1.2 MIT core/react/daygrid/interaction; timeline/resource `SEE LICENSE` | registry | CONFIRMED for 6.1.21. RESOLVED for v7: `@fullcalendar/timeline` and `resource-timeline` 7.0.0-beta.6 are still `SEE LICENSE IN LICENSE.md`; npm `latest` for them is still 6.1.21. | https://registry.npmjs.org/@fullcalendar/timeline |
| Schedule-X | 4.9.1, MIT, peers preact, @preact/signals, temporal-polyfill 0.3.2; 38.0 KiB | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/@schedule-x/calendar/latest |
| react-big-calendar | 1.20.0, 16 deps including moment, luxon, globalize, lodash | registry | CONFIRMED | https://registry.npmjs.org/react-big-calendar/latest |
| @codemirror/view, state, language, @lezer/highlight | 6.43.14, 6.7.6, 6.13.1, 1.2.5; all MIT, `type:module`; view 77.6, state 16.1, lezer 9.1 KiB | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/@codemirror/view/latest |
| CodeMirror HighlightStyle | Builds a style-mod StyleModule; supports `class:` | source | CONFIRMED | https://github.com/codemirror/language/blob/main/src/highlight.ts |
| style-mod | `render` writes values verbatim (`prop + ": " + value + ";"`), so `var(--x)` survives | style-mod 4.1.4 `src/style-mod.js` | CONFIRMED (resolves the "verified in source" claim) | https://unpkg.com/style-mod@4/src/style-mod.js |
| CodeMirror styling doc | Injected rules are placed before other stylesheets; doc silent on CSS variables | docs | CONFIRMED | https://codemirror.net/examples/styling/ |
| @uiw/react-codemirror | 4.25.12; adds theme-one-dark and basic-setup; 51.8 KiB | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/@uiw/react-codemirror/latest |
| Monaco | 0.57.0, MIT, 101.7 MB unpacked; `var()` rejected in themes | registry; GitHub issue | CORRECTED (evidence source): the primary evidence is microsoft/monaco-editor#2427 "Allow CSS variables in themes", closed as not planned on 2023-03-10, so the Lightrun mirror is not needed. Behaviour in 0.57.0 is not re-tested. | https://github.com/microsoft/monaco-editor/issues/2427 |
| Shiki | 4.5.0, MIT; `createCssVariablesTheme` "a lot less granular" | registry, docs | CONFIRMED (docs compare against "most of the other themes", not TextMate by name) | https://shiki.style/guide/theme-colors |
| Prism | 1.30.0, 2025-03-10 | registry | CONFIRMED | https://registry.npmjs.org/prismjs/latest |
| highlight.js | BSD-3-Clause, CJS | registry (11.12.0) | CONFIRMED | https://registry.npmjs.org/highlight.js/latest |
| react-simple-code-editor | 0.14.1, 2024-07-04 | registry | CONFIRMED | https://registry.npmjs.org/react-simple-code-editor/latest |
| Lexical / TipTap | Lexical 0.52.0 (pre-1.0); TipTap 3.32.0 | registry | CONFIRMED. Lexical's `@floating-ui/react` dependency not seen (deps show `@lexical/internal`); not chased. | https://registry.npmjs.org/lexical/latest |
| @tanstack/react-table | 9.3.1 current, 2026-10-12, peer React >=18; v8.21.3 published 2025-04-14; sizes 30.9 vs 13.8 KiB | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/@tanstack/react-table |
| @tanstack/react-virtual | 3.14.19 | registry | CONFIRMED | https://registry.npmjs.org/@tanstack/react-virtual/latest |
| @tanstack/react-hotkeys | latest 0.13.0 | registry | CONFIRMED | https://registry.npmjs.org/@tanstack/react-hotkeys/latest |
| AG Grid Community | 36.2.0, MIT, 21.6 MB unpacked, 368.1 KiB | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/ag-grid-community/latest |
| Glide Data Grid | 6.0.3, React 16-18 peers, 2024-02-03 | registry | CONFIRMED | https://registry.npmjs.org/@glideapps/glide-data-grid/latest |
| @headless-tree/core | 1.7.0, MIT, 2026-05-17, 12.3 KiB; last push 2026-10-14 | registry, GitHub | CONFIRMED. Owns tabindex/keys/ARIA only from bundle grep in the original; not redone. | https://registry.npmjs.org/@headless-tree/core/latest |
| react-arborist | 4.0.1; peers `react-dnd`, `react-dnd-html5-backend` | registry | CONFIRMED | https://registry.npmjs.org/react-arborist/latest |
| react-resizable-panels | 4.14.5, MIT, 2026-10-12; no `exports`; main `.cjs`; `"use client"`; 0 open issues | registry, unpkg, GitHub | CONFIRMED | https://github.com/bvaughn/react-resizable-panels |
| allotment | 1.20.6; 6 deps | registry | CONFIRMED | https://registry.npmjs.org/allotment/latest |
| diff (jsdiff) | 9.0.0, BSD-3-Clause, `type:module`, 0 deps, 2026-04-13, 7.8 KiB | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/diff/latest |
| @codemirror/merge | 6.12.2 | registry | CONFIRMED | https://registry.npmjs.org/@codemirror/merge/latest |
| react-diff-view | 3.3.3; deps lodash, gitdiff-parser | registry | CONFIRMED | https://registry.npmjs.org/react-diff-view/latest |
| @xterm/xterm | 6.0.0, MIT, 2025-12-22, no `exports`, `module` is `lib/xterm.mjs`, 79.8 KiB; 308 open issues | registry, unpkg, GitHub | CONFIRMED | https://unpkg.com/@xterm/xterm@6.0.0/package.json |
| xterm ITheme | JS object of strings; has `screenReaderMode` | typings | CONFIRMED (every field `?: string` except `extendedAnsi`). `var()` acceptance: typings never mention it, behaviour not tested. | https://unpkg.com/@xterm/xterm@6.0.0/typings/xterm.d.ts |
| TanStack Form | 1.33.5, MIT, 2026-08-11; "natively supports all libraries following the Standard Schema" | registry, docs | CONFIRMED | https://tanstack.com/form/latest/docs/framework/react/guides/validation |
| react-hook-form | 7.90.0 | registry | CONFIRMED | https://registry.npmjs.org/react-hook-form/latest |
| valibot / zod | valibot 1.5.0, 14.4 KiB; zod 4.6.7, 86.8 KiB | registry, bundlephobia | CONFIRMED | https://registry.npmjs.org/zod/latest |
| zod/mini | Size | not measured | UNVERIFIED | n/a |
| Marginal cost of every package; `check:dep-cost`, `check:licences` | n/a | not run | UNVERIFIED | n/a |
| CodeMirror | Escape-then-Tab behaviour; screen-reader quality | not tested | UNVERIFIED | n/a |
| Native HTML5 DnD on iOS Safari 15+ / Android Chrome | Touch behaviour | not checked | UNVERIFIED | n/a |
| Base UI combobox/autocomplete marginal cost; TanStack Table v9 tree-shaken size | n/a | not run | UNVERIFIED | n/a |

Section 6 items resolved: Atlassian guidelines, Safari Temporal, FullCalendar v7 licence status, `@daypicker/react` relationship, Monaco evidence source. Partly resolved: CodeMirror `var()` handling, now confirmed in style-mod source.

## (D) Verdicts that should change

1. **Base UI Calendar/DateField "PICK, wait" (section 3.2 and summary row 2).** Reword it. Base UI's Calendar component was merged on 2026-03-13 and then removed in #4505 on 2026-04-13. The DateField PR was closed unmerged. The 1.9.0 package ships only the temporal adapters, no component. Issue #1709 is still open with no schedule. The text "was built, then moved to internals" is wrong. The defensible pick is the hand-rolled month grid on date-fns (already Base UI's optional peer), not "wait for Base UI". Section 0 item 2 should drop "Calendar and DateField were built ... moved to internals". The "second date-grid library is churn" argument weakens, because the first-party Calendar was removed, so adopting react-day-picker as the interim is not duplication against something imminent.
2. **FullCalendar licensing (3.2).** Change "v7 equivalents were not verified" to "v7.0.0-beta timeline and resource packages are still non-MIT". That strengthens the REJECT.
3. **Monaco (3.3).** Cite microsoft/monaco-editor#2427 (closed as not planned) rather than the Lightrun mirror. The verdict is unchanged.
4. **Form `action`.** Note that it is documented only in an example, not in the API table. Verdict unchanged.
5. **Unchanged:** all other verdicts (DnD hand-roll plus Menu, Autocomplete palette, TanStack Table, jsdiff, pragmatic-dnd packaging reject, cmdk/kbar barred) stand on verified facts.
6. **Audit F09 and F26 (not OSS, but for the audit's own recommendations).** F09 is contradicted by Tailwind v4's deliberate default cursor on buttons, so downgrade it to a preference. F26 has no WCAG basis for offset consistency.

## (E) Bibliography (accessed 2026-10-14)

WCAG 2.2 Understanding docs (N)
- 1.4.1 Use of Color — https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html
- 1.4.3 Contrast (Minimum) — https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- 1.4.10 Reflow — https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- 1.4.11 Non-text Contrast — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
- 2.2.2 Pause, Stop, Hide — https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- 2.3.3 Animation from Interactions (AAA; checked, not used for any finding; says nothing on spinners) — https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- 2.4.7 Focus Visible — https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
- 2.4.11 Focus Not Obscured (Minimum) — https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- 2.4.13 Focus Appearance — https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html
- 2.5.8 Target Size (Minimum) — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

WAI and ARIA
- APG Tabs — https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ (N)
- WAI Tables, Caption and Summary — https://www.w3.org/WAI/tutorials/tables/caption-summary/ (A)

MDN (P)
- cursor — https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
- print-color-adjust — https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust
- break-inside — https://developer.mozilla.org/en-US/docs/Web/CSS/break-inside
- caption-side — https://developer.mozilla.org/en-US/docs/Web/CSS/caption-side
- color value (currentColor) — https://developer.mozilla.org/en-US/docs/Web/CSS/color_value
- transition-timing-function — https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function
- Temporal — https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal

Design systems (A)
- Atlassian Elevation — https://atlassian.design/foundations/elevation
- Atlassian Lozenge — https://atlassian.design/components/lozenge/usage
- Atlassian DnD accessibility — https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines/
- Carbon Button — https://carbondesignsystem.com/components/button/usage/
- Carbon Pagination — https://carbondesignsystem.com/components/pagination/usage/
- Carbon Checkbox — https://carbondesignsystem.com/components/checkbox/usage/
- Carbon Typography — https://carbondesignsystem.com/elements/typography/overview/
- GOV.UK Button — https://design-system.service.gov.uk/components/button/
- GOV.UK Pagination — https://design-system.service.gov.uk/components/pagination/
- ONS table of contents — https://service-manual.ons.gov.uk/design-system/components/table-of-contents
- Nordhealth Outline — https://nordhealth.design/components/outline
- Tailwind v4 upgrade guide — https://tailwindcss.com/docs/upgrade-guide

Research (R)
- NN/g Skeleton Screens — https://www.nngroup.com/articles/skeleton-screens/
- NN/g Response Times — https://www.nngroup.com/articles/response-times-3-important-limits/
- Butterick Point Size — https://practicaltypography.com/point-size.html

Package and tool facts (P)
- npm registry — https://registry.npmjs.org/<pkg>/latest (all packages in section C)
- bundlephobia API — https://bundlephobia.com/api/size
- GitHub API for mui/base-ui, clauderic/dnd-kit, bvaughn/react-resizable-panels, xtermjs/xterm.js, lukasbach/headless-tree, atlassian/pragmatic-drag-and-drop
- Base UI issues and PRs: https://github.com/mui/base-ui/issues/1709, /issues/4786, /pull/1973, /pull/3666, /pull/4505; release https://github.com/mui/base-ui/releases/tag/v1.9.0
- Base UI docs — https://base-ui.com/react/components/autocomplete ; /combobox ; /form
- unpkg — https://unpkg.com/@base-ui/react@1.9.0/?meta ; https://unpkg.com/@atlaskit/pragmatic-drag-and-drop@4.0.0/package.json ; https://unpkg.com/@atlaskit/pragmatic-drag-and-drop@4.0.0/element/adapter/package.json ; https://unpkg.com/@dnd-kit/react@0.5.0/index.js ; https://unpkg.com/style-mod@4/src/style-mod.js ; https://unpkg.com/@xterm/xterm@6.0.0/typings/xterm.d.ts
- CodeMirror — https://codemirror.net/examples/styling/ ; https://github.com/codemirror/language/blob/main/src/highlight.ts
- Monaco issue — https://github.com/microsoft/monaco-editor/issues/2427
- Shiki — https://shiki.style/guide/theme-colors
- TanStack Form validation — https://tanstack.com/form/latest/docs/framework/react/guides/validation
- Alacritty man page — https://github.com/alacritty/alacritty/blob/master/extra/man/alacritty.5.scd
- caniuse Temporal — https://caniuse.com/mdn-javascript_builtins_temporal
- FullCalendar headless-calendar README — https://github.com/fullcalendar/fullcalendar/tree/main/packages/headless-calendar

Dropped or unusable:
- 404s: GOV.UK font-size and typography pages, MDN @media/print, MDN currentcolor deep link, Primer shadow, Primer button and Primer nav-list pages (returned site shell only).
- Fetched but returned no body text: Material 3 elevation, typography, motion and states pages, Atlassian tag page.
- 403: npm page for @daypicker/react (the registry JSON was used instead).
- Carbon skeleton-states page returned 404 and was not used.
- The FullCalendar LICENSE.md root file is MIT and does not cover the premium packages; npm manifests were used instead.
