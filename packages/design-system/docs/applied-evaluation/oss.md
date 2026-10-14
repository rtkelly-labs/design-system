NOTE: I could not write /private/tmp/claude-501/-Users-ryankelly-code-personal/bf919a17-fd46-452f-9827-41b743b650ae/scratchpad/oss-eval/FINDINGS.md. The Write tool refused ("Subagents should return findings as text, not write report files"), and I did not work around it. The full findings follow. Scratch data (npm metadata scripts, downloaded sources) is in that same oss-eval/ directory.

# OSS evaluation for @rtkelly13/design-system app-level elements

Research date 2026-10-14. Repo state read: `@base-ui/react` 1.8.0 installed (1.9.0 is current), `@tanstack/react-table` ^8.21.3, `@tanstack/react-virtual` ^3.14.12, `@tanstack/react-hotkeys` ^0.10.0. `apps/site` is Next 16 / React 19 with `shiki` ^4.4.3.

## 0. Read this first

1. **Rule 4 is the dominant filter.** It allows one interaction library (`@base-ui/react`) plus headless engines with no DOM, no focus model, no ARIA and no keyboard handling (react-table, react-virtual, react-hotkeys, visx). Most "full" candidates own focus or keys, so they are out or need an ADR.
2. **Base UI already covers more than `docs/radix-vs-base-ui.md` §5 says.** That doc says "Calendar / DatePicker: neither". Base UI 1.9.0 now ships `internals/temporal` plus date-fns and Luxon adapters, and `date-fns` / `@date-fns/tz` are optional peers.
   - Calendar and DateField were built (PRs #1973, #3666), then moved out of the public API into `internals` (PR #4505, 2026-04-13).
   - Issue #1709 "Calendar and Date Fields primitives" is open. Users were still asking for a release on 2026-07-08.
   - The 1.9.0 exports map has no `calendar`.
   - A second date-grid library now is churn against rule 4's own rationale.
3. **Base UI's own Autocomplete docs contain a command-palette example.** It is a Dialog with an `inline` Autocomplete (`open`, `autoHighlight="always"`, `keepHighlight`), plus a fuzzy example built on `match-sorter`. That settles #158 Option A with primary-source evidence.
4. **Highlighting is already solved in the site.** `apps/site/src/lib/highlight.ts` uses Shiki `createCssVariablesTheme` with the JS regex engine in a Server Component. `globals.css` maps `--shiki-token-*` to `--ds-*` roles (#209). Anything editor-shaped should reuse that mapping.
5. **Packaging gate.** `docs/dependencies.md` requires a runtime dependency to load in plain Node ESM.
   - From `package.json` only (nothing installed or run), `@atlaskit/pragmatic-drag-and-drop` fails that gate by construction (see §3.1).
   - `match-sorter`, `@hello-pangea/dnd`, `sortablejs`, `@xterm/xterm` and `react-resizable-panels` have no `exports` map and a CJS `main`. Whether named exports are detected is unverified.
   - Run the repo's `node --input-type=module -e "import {…} from 'pkg'"` probe before adopting any of them.

Method limits: `check:dep-cost` and `check:licences` were not run (no installs). Sizes are bundlephobia whole-entry min+gzip, not tree-shaken and not marginal over Base UI, so treat them as upper bounds. Vendor claims are labelled.

## 1. Summary matrix (element × candidate × verdict)

Verdicts: ADOPT = dependency. ENGINE = headless engine only (rule-4 exempt profile). BORROW = hand-roll with Base UI, take patterns only. REJECT. "ADR" marks a recommendation needing an ADR or rule-4 exception.

| Element | Candidate | Verdict | Reason |
|---|---|---|---|
| 1 DnD | **Hand-roll native HTML5 DnD + Base UI Menu "Move to…"** | **PICK** (BORROW) | Menu is the keyboard / WCAG 2.5.7 alternative at zero rule-4 cost. Pointer path is ~80-150 lines. |
| 1 DnD | @dnd-kit/react 0.5.0 | ADOPT with ADR (fallback pick) | Best pointer feel and real-element drag styling. Pre-1.0. `Accessibility` plugin and `KeyboardSensor` own tabindex/role/keydown (strippable). |
| 1 DnD | @atlaskit/pragmatic-drag-and-drop 4.0.0 | REJECT for now (packaging) | Right profile (no DOM/ARIA), but the root entry exports `{}`. Subpaths use nested package.json stubs. No `exports`, not ESM. |
| 1 DnD | @dnd-kit/core 6.3.1 + sortable 10.0.0 | REJECT | Legacy line, last release Dec 2024. |
| 1 DnD | react-aria DnD (@react-aria/dnd, RAC) | REJECT | Best a11y, but owns focus and needs react-stately collections. Apache-2.0. RAC was already barred in shadcn-evaluation. |
| 1 DnD | @hello-pangea/dnd 18.0.1 | REJECT | List-only, redux inside, no `exports`, last release Feb 2025, owns focus. |
| 1 DnD | SortableJS 1.15.7 / dragula 3.7.3 | REJECT | DOM-mutating, UMD, no keyboard. dragula untouched since 2020. |
| 1 DnD | @formkit/drag-and-drop 0.6.1 | REJECT | Unexplained peer dep on `@marko/runtime-tags`; no a11y story found. |
| 2 Calendar | **Base UI Calendar / DateField (when public)** | **PICK**, wait | Same library as rule 4. Internals exist in 1.9.0. |
| 2 Calendar | Hand-rolled month grid on date-fns | BORROW (interim) | ~120-180 lines. date-fns is already Base UI's optional peer. |
| 2 Calendar | react-day-picker 10.0.2 | ADOPT with ADR (interim fallback) | MIT, CSS variables plus `classNames`. Owns a roving-day keyboard model. |
| 2 Calendar | @internationalized/date 3.12.4 | ENGINE (only if non-Gregorian needed) | Apache-2.0, 11 KB, pure. |
| 2 Calendar | date-fns 4.4.0 | ADOPT-grade as pure date math | MIT, ESM, `sideEffects:false`, tree-shakeable. |
| 2 Calendar | temporal-polyfill / native Temporal | REJECT for now | Safari stable unconfirmed. Polyfill is 19.8 KB gz. |
| 2 Calendar | @full-ui/headless-calendar 7.1.2 | ENGINE candidate, spike only | MIT, 0 deps, event slicing/layout "like TanStack Table". README: beta, thinly documented. |
| 2 Calendar | FullCalendar 7.1.2 | REJECT | Owns drag/focus/keys. Timeline/resource plugins are non-MIT (6.x manifests). |
| 2 Calendar | Schedule-X 4.9.1 | REJECT | Preact + signals renderer, 38.9 KB gz, own interaction model. |
| 2 Calendar | react-big-calendar 1.20.0 | REJECT | 16 deps including moment, luxon, globalize, lodash. |
| 3 Editor | **CodeMirror 6 core** (state, view, language, @lezer/highlight) | **ADOPT with ADR**, only if editable code is in scope | Theme values are raw CSS strings, so `var(--ds-*)` works. No popup/focus library if autocomplete is excluded. |
| 3 Editor | @uiw/react-codemirror 4.25.12 | REJECT | Adds `theme-one-dark` and basic-setup. A ~40-line hook does the same. |
| 3 Editor | Monaco 0.57.0 | REJECT | Hex-only themes (via search mirror), 101 MB unpacked, workers. |
| 3 Editor | Shiki 4.5 (display only) | Already adopted in apps/site | CSS-variables theme mapped to role tokens. |
| 3 Editor | Prism / highlight.js / starry-night | REJECT | Prism last released Mar 2025. hljs is BSD-3 and CJS. starry-night is 15 MB unpacked. |
| 3 Editor | react-simple-code-editor 0.14.1 | BORROW | Textarea-over-`<pre>` trick. Package stale (Jul 2024). |
| 3 Editor | Lexical 0.52 / ProseMirror / TipTap 3.32 | REJECT unless rich text becomes a requirement | Own selection and keyboard. Lexical is pre-1.0 with an `@floating-ui/react` dep. |
| 4 Palette | **Base UI Autocomplete, `inline` in Modal/Dialog** | **PICK** | Documented command-palette example. `useFilter`, `virtualized`, groups, `data-highlighted`. |
| 4 Palette | @tanstack/match-sorter-utils 9.2.6 (`rankItem`) | ENGINE, optional | MIT, 2.6 KB, ESM, exports map. |
| 4 Palette | match-sorter 8.3.0 | BORROW | Used in Base UI's own example. No `exports`, CJS main. |
| 4 Palette | fuse.js 7.5.0 | REJECT | Apache-2.0, 9.4 KB. Heavier than needed. |
| 4 Palette | cmdk 1.1.1 / kbar 1.0.0 | REJECT (barred) | Both depend on `@radix-ui/*`. kbar uses react-portal; cmdk uses react-dialog. |
| 5 Grid | **TanStack Table + Virtual (existing) + DS-owned selection and row nav** | **PICK** | State exists. Missing piece is DOM semantics and focus. |
| 5 Grid | TanStack Table 9.3.1 | Defer (#347) | 31.6 KB vs 14.1 KB gz whole-entry. A bump trips `check:dep-cost`. |
| 5 Grid | AG Grid Community 36.2.0 | REJECT | 377 KB gz, owns keys and focus. |
| 5 Grid | Glide Data Grid 6.0.3 | REJECT | Canvas, React 16-18 peers, last release Feb 2024. |
| 6 Tree | headless-tree 1.7.0 | BORROW, or ADOPT with ADR | Headless styling, MIT, 12.6 KB, but owns tabindex, keydown, ARIA, DnD. |
| 6 Tree | react-arborist 4.0.1 | REJECT | Peers `react-dnd` + HTML5 backend. |
| 6 Panes | Hand-rolled APG window splitter | **PICK** (BORROW) | ~100 lines. |
| 6 Panes | react-resizable-panels 4.14.5 | ADOPT with ADR | MIT. `role="separator"`, arrows/Home/End/F6, SSR `defaultLayout`. Owns a keyboard model. |
| 6 Panes | allotment 1.20.6 | REJECT | 6 deps, CSS-first. |
| 6 Diff | **jsdiff `diff` 9.0.0** | **ADOPT-grade engine** | BSD-3 (allowed), ESM, 7.9 KB, pure, 0 deps. |
| 6 Diff | @codemirror/merge 6.12.2 | Coupled to CodeMirror ADR | Only if CM is adopted. |
| 6 Diff | react-diff-view 3.3.3 | REJECT | lodash, gitdiff-parser, less/CSS. |
| 6 Terminal | @xterm/xterm 6.0.0 | ADOPT with ADR, only if a live terminal is required | Theme is a JS object that maps onto the emitted ANSI slots. 81.7 KB gz. |
| 6 Forms | **Base UI `Form` + `Field` (existing) + any Standard Schema validator** | **PICK** | `errors` prop keyed by field name. |
| 6 Forms | TanStack Form 1.33.5 | ENGINE, when a form surface exists (#203) | Native Standard Schema, no DOM. |
| 6 Forms | react-hook-form 7.90.0 | REJECT | Overlaps Base UI Field state. Ref-based. |
| 6 Forms | valibot 1.5.0 / zod 4.6.7 | Consumer choice | DS should stay schema-agnostic. |

## 2. Scoring columns

Customisation (1-5) is for our look: hard edges, offset shadows, role tokens, monospace. Sizes are bundlephobia whole-entry gzip.

| Candidate | Licence (baseline OK?) | gz | Last release | ESM | React 19 | RSC/SSR | Owns focus / keys / popup / style-inject | Custom. |
|---|---|---|---|---|---|---|---|---|
| @dnd-kit/react 0.5.0 | MIT yes | 33.1 KB | 2026-06-11 | `type:module`, exports+import | peer `^18 \|\| ^19` | No `"use client"`; wrap in a client component (DS has 48 such files) | tabindex/role/aria via `Accessibility`; keydown via `KeyboardSensor`; `.focus(` once; `StyleInjector` injects a `<style>` during drag (nonce configurable) | 4 |
| @atlaskit/pragmatic-drag-and-drop 4.0.0 | Apache-2.0 yes | ~4.7 KB core (vendor claim; bundlephobia 0.2 KB is meaningless since root exports `{}`) | 2026-09-24 | **No `type`, no `exports`; nested stub package.json per subpath** | Core has no peers | Event-listener API, effect-only | None (headless). Optional a11y package pulls Atlaskit icon/emotion/tokens. | 5 |
| react-aria / RAC DnD | Apache-2.0 yes | @react-aria/dnd 33 KB; RAC 279 KB whole | 2026-10-09 | exports+import | yes | `client-only` dep | Owns all | 4 (but rule 4) |
| @hello-pangea/dnd 18.0.1 | Apache-2.0 yes | 28.8 KB | 2025-02-09 | no exports | `^18 \|\| ^19` | client | focus, keys, own style tag | 2 |
| SortableJS 1.15.7 | MIT yes | 18.3 KB | 2026-02-11 | no exports, UMD main | n/a | DOM-only | DOM mutation, no keys | 2 |
| react-day-picker 10.0.2 | MIT yes (+date-fns, @date-fns/tz) | 19.8 KB | 2026-09-30 | `type:module`, exports+import | peer `>=16.8` | pure render | roving focus in the grid | 4 |
| @internationalized/date 3.12.4 | Apache-2.0 yes | 11.1 KB | 2026-09-01 | exports+import | n/a | pure | none | n/a |
| date-fns 4.4.0 | MIT yes | 17.5 KB whole (tree-shakeable) | 2026-05-29 | `type:module` | n/a | pure | none | n/a |
| @full-ui/headless-calendar 7.1.2 | MIT yes | not measured (53 KB unpacked, 0 deps; peer temporal-polyfill 19.8 KB) | 2026-10-12 | `type:module` | n/a | pure | none | n/a |
| FullCalendar react 7.1.2 | MIT core; timeline/resource `SEE LICENSE` (6.x) | 31.4 KB + plugins + polyfill | 2026-10-12 | `type:module` | `^17-^19` | client | drag, focus, keys | 3 |
| Schedule-X calendar 4.9.1 | MIT yes | 38.9 KB | 2026-09-29 | peers `preact`, `@preact/signals`, pinned `temporal-polyfill@0.3.2` | via `@schedule-x/react` | client | own | 3 |
| @codemirror/view 6.43.14 (+state 6.7.6, language 6.13.1, @lezer/highlight 1.2.5) | MIT yes | view 79 KB + state 16 KB + lezer 9 KB + language; ~100 KB+ total, unmeasured | 2026-10-07 | `type:module`, exports+import | framework-free | needs DOM, client-only | own keymap, selection, `aria-live` announcer; no popups unless autocomplete/tooltip packages added | 5 |
| Monaco 0.57.0 | MIT yes (+marked, dompurify) | 27.9 KB loader; 101 MB unpacked | 2026-09-24 | AMD/ESM mix | wrapper peers ok | workers, client | owns everything | 2 |
| Base UI Autocomplete/Combobox 1.9.0 | MIT yes | in Base UI's 89.5 KB marginal | 2026-10-09 | `type:commonjs` with exports map | `^17-^19` | `"use client"` per component (existing pattern) | the one allowed library | 5 |
| @tanstack/match-sorter-utils 9.2.6 | MIT yes (`remove-accents` needs a baseline entry) | 2.6 KB | 2026-10-04 | `type:module` | n/a | pure | none | n/a |
| headless-tree core / react 1.7.0 | MIT yes | 12.6 + 1.2 KB | 2026-05-17 | exports+import | peer `*` | client | `role: tree/treeitem`, tabIndex, onKeyDown, onDragStart, hotkeys | 5 (headless styling) |
| react-resizable-panels 4.14.5 | MIT yes | 19.7 KB | 2026-10-12 | `type:module`, `main` is `.cjs`, no `exports` | `^18 \|\| ^19` | has `"use client"`; `defaultLayout` for SSR | `role=separator`, aria-valuenow, arrows/Home/End/F6, localStorage | 4 |
| jsdiff `diff` 9.0.0 | BSD-3-Clause yes (`BSD-*` allowed) | 7.9 KB | 2026-04-13 | `type:module`, exports | n/a | pure | none | n/a |
| @xterm/xterm 6.0.0 | MIT yes | 81.7 KB | 2025-12-22 | no exports; `lib/xterm.mjs` module | n/a | client only | full keyboard capture; `screenReaderMode` option | 3 |
| TanStack Form 1.33.5 | MIT yes | 17.9 KB | 2026-08-11 | `type:module` | `^17-^19` | pure state | none | n/a |
| @tanstack/react-table 9.3.1 | MIT | 31.6 KB (v8.21.3: 14.1 KB) | 2026-10-12 | `type:module` | `>=18` | pure | none | n/a |

## 3. Per-element recommendation

### 3.1 Kanban / sortable lists / drag-and-drop

**Pick: do not adopt a DnD library yet.** Hand-roll the pointer path on native HTML5 DnD. Make the keyboard path a Base UI `Menu` ("Move to column / Move up / Move down").

- WCAG 2.2 SC 2.5.7 (Dragging Movements, AA) needs a single-pointer alternative, and SC 2.1.1 needs keyboard. A per-card Menu satisfies both with a primitive the repo already pays for (`Menu` is +18.2 KB, prepaid per `dependency-cost.md`).
- Atlassian's own accessibility guidance recommends the same: the core package adds no keyboard controls; build a "More" menu of move outcomes. The page was blocked, so this comes from a search summary and is unverified at source.
- Pointer reorder within and across columns with a drop indicator is ~80-150 lines (`dragstart/over/drop`, an index computation, an `aria-live` status).
- The weak point is the native drag preview, which is a bitmap snapshot. An offset-shadow "lifted card" must be a purpose-built preview node.
- Touch via native DnD is implemented in iOS Safari 15+ and Android Chrome but is less controllable (unverified here).

**Fallback: @dnd-kit/react, with an ADR.**
- It is 0.5.0 (2026-06-11), 17.7k stars, 143 open issues, last push 2026-09-12. The changelog shows regular minor releases and pre-1.0 API churn.
- Source-verified: `defaultPreset = { plugins: [Accessibility, AutoScroller, Cursor, Feedback, PreventSelection], sensors: [PointerSensor, KeyboardSensor] }`. `plugins` and `sensors` accept a function over the defaults, so `Accessibility` and `KeyboardSensor` can be filtered out. `StyleInjector` is always added; it injects a `<style>` during a drag and accepts a CSP nonce.
- Stripping them leaves pointer sensor, feedback and collision. **Keyboard reorder then has to be hand-rolled anyway, so use the Menu.**
- Keeping them imports a keyboard model: Space/Enter start, arrows move, Escape cancels, live-region announcements, `role="button"`, `aria-roledescription="draggable"`, `tabindex=0`. That is what rule 4 bars, and it is the ADR.
- Customisation 4/5. The dragged element is the real DOM node, so data-attribute hooks plus our offset shadow work.

**@atlaskit/pragmatic-drag-and-drop 4.0.0 has the ideal rule-4 profile but is blocked on packaging.**
- Profile: headless, event-listener API, no DOM, no ARIA. Apache-2.0 verified in the LICENSE file (the GitHub API reports NOASSERTION). The README claims ~4.7 KB core and "unopinionated about visual language or accessibility".
- The root entry exports `{}` ("Please use individual entry points"). Subpaths are directories with nested stub `package.json` files (`main` CJS plus `module`). There is no `exports` map and no `"type":"module"`.
- In plain Node ESM, `@atlaskit/pragmatic-drag-and-drop/element/adapter` is predicted to throw `ERR_UNSUPPORTED_DIR_IMPORT`. This is a prediction from the manifest, not executed. It would fail the repo's "loads from an ES module" rule and the "consumer probe imports the whole root in plain Node" check, unless it is only reached through a lazy `import()` inside an effect.
- Its optional a11y package depends on Atlaskit icon, emotion and tokens (reject). Majors went 2.0 -> 3.0 -> 4.0 in a year, all entry-point reshuffles.

Needs ADR: the dnd-kit fallback (second keyboard model), and pragmatic if its packaging is accepted via lazy import.

### 3.2 Calendar / scheduling

**Pick: wait for Base UI Calendar/DateField. For a date picker now, hand-roll a month grid on `date-fns`. Do not adopt a scheduler.**

- Base UI 1.9.0 exports `./internals/temporal`, `./internals/temporal-adapter-date-fns` and `./internals/temporal-adapter-luxon`, but no `./calendar`.
- Issue #4786 says a Big Calendar/Scheduler is "very low probability" in that repo, so the scheduler stays our problem either way.

**Month grid / date picker**
- `react-day-picker` 10.0.2 is the best picker on customisation.
  - `--rdp-*` CSS variables on `.rdp-root`: `--rdp-accent-color`, `--rdp-day-width`, `--rdp-range_*`, `--rdp-today-color`.
  - A `classNames` prop keyed by UI element, `getDefaultClassNames()`, `styles`, and a CSS-modules variant. The stylesheet is optional.
  - Depends on `date-fns` + `@date-fns/tz` (MIT; need baseline entries).
  - It owns a roving-day grid keyboard model (Arrow, PageUp/Down, Home/End). That is a rule-4 question and needs a stated exception.
  - Registry wrinkle: the docs reference `@daypicker/react`, a thin re-export of `react-day-picker` 10.0.2 with the same bundle size. Which name is canonical is unverified; pick one and record it.
  - `shadcn-evaluation.md` line 214 already lists it at 10.0.1, MIT.
- Hand-roll: build the weeks array with `startOfMonth/startOfWeek/addDays/isSameDay` from `date-fns`. Add `role="grid"` with roving `tabIndex` and arrow keys, `aria-selected`, `aria-current="date"`. About 120-180 lines including range selection. Later swap the interior for Base UI Calendar with the same props.
- react-aria Calendar/DateField (Apache-2.0) has excellent i18n (`createCalendar`, `I18nProvider`, `firstDayOfWeek`) and `data-*` states, but RAC owns focus. It was already rejected in `shadcn-evaluation.md` §6; not redone here.

**Date maths**
- Use `date-fns` (MIT). `@internationalized/date` (Apache-2.0, 11 KB, exports map, `sideEffects:false`) only if non-Gregorian calendars are required.
- Temporal: Firefox 139 (May 2025) and Chrome 144 (Jan 2026) ship it. MDN says "not Baseline". Safari stable is unconfirmed (secondary sources, unverified). `temporal-polyfill` 1.0.6 is MIT and 19.8 KB gz. Not worth it yet.

**Event layout (week/day time grid, overlap packing, multi-day slicing)** is the one genuinely hard hand-roll, about 300-500 lines done well.
- Candidate engine: `@full-ui/headless-calendar` 7.1.2. MIT, 0 deps, ESM, 53 KB unpacked, peer `temporal-polyfill`. Its README says "similar to what Tanstack Table does for data grids" and lists event object slicing "needed to make event display conform to a variety of DOM structures". That is the same shape as the repo's exempt engines.
- Caveats: it is used internally by `@fullcalendar/core`, is "not yet thoroughly documented", and is offered as beta to premium users. **Spike only, do not adopt.**

**Rejected**
- FullCalendar 7.1.2: MIT for the core and day/time/multi-month/list/interaction. npm shows `SEE LICENSE IN LICENSE.md` for `@fullcalendar/timeline` and `resource-*` at 6.1.21; v7 equivalents were not verified. Theming is per-element `className` props plus `skeleton.css`, a theme and a palette CSS, with shadcn and MUI theme packages. 7.1.2 has good a11y work (list roles, `table` rather than `grid` for JAWS). But it owns drag, focus and keys, takes `temporal-polyfill` as a peer, and the React wrapper alone is ~31 KB gz before plugins.
- Schedule-X is Preact + signals. react-big-calendar pulls moment, luxon, globalize, dayjs and lodash.
- `@tanstack/react-calendar` does not exist on npm (checked).

Needs ADR: react-day-picker (keyboard model). Hand-roll and the Base UI pick need none.

### 3.3 Code editor

**Pick: if editable code is a real requirement, CodeMirror 6 core, with an ADR classifying it as a text-editing engine rather than an interaction primitive.** For display, keep Shiki + CSS variables, already shipped in `apps/site`. For tiny editable snippets, borrow the textarea-over-pre pattern.

**Theming depth is 5/5, verified in source.**
- `@codemirror/language` 6.13.1: `HighlightStyle` builds a `style-mod` `StyleModule`. `style-mod`'s `render` writes values verbatim into `prop: value;` strings, so `{ color: 'var(--ds-accent-secondary)' }` survives.
- `HighlightStyle` entries also accept `class:` for external CSS. `EditorView.theme({...}, {dark})` takes selector maps (`&`, `.cm-content`, `.cm-gutters`, `.cm-cursor`, `.cm-selectionBackground`). `EditorView.cspNonce` is supported.
- The styling doc says injected rules are placed before other stylesheets, so our CSS wins at equal specificity. That doc is silent on CSS variables; the source confirms it.
- Pattern: map lezer tags to the same `--shiki-token-*` to `--ds-*` mapping already in `apps/site/src/app/globals.css` (keyword -> `--ds-accent-secondary`, string -> `--ds-intent-success`, comment -> `--ds-text-muted`). Static Shiki output and the editing surface then agree, and Level switching is free because the variables re-resolve.
- Hard edges and monospace are plain CSS on `cm-editor` and `cm-scroller`. Nothing to fight.

**Rule 4 position**
- CM is a text surface with its own selection and keymap. It does not need a focus library.
- `@codemirror/autocomplete`, hover tooltips and lint tooltips are popups and must stay out, or be rendered via Base UI.
- Tab trapping: Escape-then-Tab is documented upstream but was not verified here.
- Needs ADR.

**Cost and SSR**
- view 79 KB gz (whole entry) + state 16 KB + lezer/highlight 9 KB + language. Marginal cost unmeasured; expect ~100 KB+.
- Skip `@uiw/react-codemirror` (53 KB wrapper). It adds `theme-one-dark` and basic-setup; a `useEffect`-mounted `EditorView` in a `'use client'` component is ~40 lines.
- SSR: render a Shiki-highlighted `<pre>` on the server and mount CM on interaction.
- `@codemirror/merge` provides a diff view if CM is adopted.

**Rejected or secondary**
- Monaco: its `defineTheme` validation rejects `var(--…)` ("Illegal value for token color"), per a Monaco issue mirrored on Lightrun. That is a third-party mirror, and current-version behaviour is unverified. The workaround is to resolve variables to hex via `getComputedStyle` at runtime. 101 MB unpacked, web workers, and it owns every popup.
- Shiki display-only: `createCssVariablesTheme` is documented as less granular than TextMate themes. It lives in `apps/site`, not the published package, so `check:licences` does not see its 8 MIT dependencies.
- Prism 1.30.0 (Mar 2025) is stale, highlight.js is BSD-3 and CJS, starry-night is 15 MB unpacked.
- Rich text (Lexical, ProseMirror/TipTap) is not an app archetype yet.

### 3.4 Command palette

**Pick: Base UI `Autocomplete` rendered `inline` inside the DS `Modal`/Dialog (#158 Option A).** Rank with `Autocomplete.useFilter()` first, and `@tanstack/match-sorter-utils` only if fuzzy ranking is needed.

From the base-ui.com Autocomplete docs:
- A command-palette example exists: a Dialog containing `Autocomplete.Root` with `open`, `inline`, `autoHighlight="always"`, `keepHighlight`. Items' `onClick` closes the dialog.
- `filter` takes `(item, query, itemToString?)`. `filter={null}` is for async. `filteredItems` is for external ranking.
- Groups: `Autocomplete.Group`, `GroupLabel`, `Collection`.
- `virtualized` + `useFilteredItems()` with a 10,000-item TanStack Virtual example. `highlightItemOnHover`, `data-highlighted`, and `Autocomplete.Status` for async.
- The fuzzy example uses `match-sorter`.

From the Combobox docs: when nesting `inline` in `Dialog.Root`, bind `open`/`onOpenChange` to the dialog so query, highlight and input reset on close.

Base UI 1.9.0 also adds a preview `Menu.FilterProvider` / `Menu.Input`, and an internal `filter-dropdown` that is not public.

- Customisation 5/5. Everything is `render`/`className` with `data-*` state.
- Dependency cost: nothing new. These entry points live inside the existing `@base-ui/react`. Price the marginal entry-point cost with `check:dep-cost`, per the #166 precedent.
- Rankers:
  - `@tanstack/match-sorter-utils` 9.2.6 (MIT, 2.6 KB, `type:module`, exports map, one dep `remove-accents`; needs baseline entries) is preferred.
  - `match-sorter` 8.3.0 (3.3 KB, `@babel/runtime` + `remove-accents`) has no `exports`.
  - `fuse.js` 7.5.0 is Apache-2.0, 9.4 KB. Reject.
  - A hand-rolled subsequence scorer is ~25 lines and the cheapest path.
- The global open shortcut can use `@tanstack/react-hotkeys` (adopted; installed 0.10, latest 0.13.0; a bump re-prices `dependency-cost`).
- **Barred, as #158 already concluded:** cmdk 1.1.1 (last release 2025-03-14; deps `@radix-ui/react-dialog`, `react-id`, `react-primitive`, `react-compose-refs`) and kbar 1.0.0 (deps `@radix-ui/react-portal`, `fuse.js`, `@tanstack/react-virtual`).

No ADR needed. The real work is shortcut display and recents.

### 3.5 Data grid / virtualisation / filtering (inbox-style lists)

**Pick: keep `@tanstack/react-table` + `@tanstack/react-virtual`.** Add selection and keyboard row navigation as DS-owned DOM behaviour in `DataTable` (or a sibling `RecordList`). Add no grid library.

What `DataTable` has today (read in `src/components/DataTable.tsx`): sorting with `aria-sort`, pagination, fixed-row-height virtualisation with `aria-rowcount`/`aria-rowindex`, row headers (`<th scope="row">`), caption, and a caller-owned TanStack table instance. Grep shows no row selection, no active row and no `aria-selected`.

What is missing for inbox lists, and who supplies it:

| Need | Source | Effort |
|---|---|---|
| Selection state (single, multi, select-all, shift-range) | TanStack `enableRowSelection`, `getIsSelected`, `toggleSelected`, plus a range helper | State exists. Range helper ~15 lines. |
| Selection DOM: checkbox column with Base UI `Checkbox`, `aria-selected` on rows, `aria-multiselectable` on the container | DS | ~40 lines |
| Active row and keyboard: roving `tabIndex` or `aria-activedescendant`; Up/Down/Home/End/PageUp/PageDown; Space toggle; Enter open; Shift+Arrow extend | DS | ~80-120 lines |
| Shortcut bindings (`j`/`k`/`x`/`e`) | `@tanstack/react-hotkeys` (adopted) | ~20 lines |
| Keep the active row mounted/focusable when virtualised away; scroll into view | `virtualizer.scrollToIndex` plus remembering the active key and rendering that row regardless of the window | ~30 lines. Same trap #346 notes for Cascader (the highlighted option must stay mounted so the active descendant can reference it). |
| Typed filter model | #345; TanStack `columnFilters` plus a DS model | Design work, not a dependency |
| Column visibility / sizing / pinning | TanStack state | #347 |

Semantics decision, not a library: a native `<table>` with row actions is not a `grid`. #347 already says a public grid needs a deliberate keyboard and focus contract. Recommendation: rows are the unit for an inbox, not cells.

- **TanStack Table 9.3.1** is current (2026-10-12). The repo is on ^8.21.3, and `shadcn-evaluation.md` recorded 9.2.4.
  - Bundlephobia whole-entry: v9 31.6 KB vs v8 14.1 KB gz. v9 registers features, so the real tree-shaken cost is likely lower (unverified).
  - Treat the v8 -> v9 move as its own PR gated by `check:dep-cost`. #347 already flags the v9 API gap.
- AG Grid Community 36.2.0 (MIT): 377 KB gz, 21 MB unpacked, owns keyboard and focus. Its theming API injects its own CSS; hard-edge and CSS-variable specifics are unverified. REJECT.
- Glide Data Grid 6.0.3: canvas, React 16-18 peers, last release 2024-02-03. REJECT.
- TanStack Virtual 3.14.19 (installed 3.14.12): keep fixed row heights, because measured-row mode conflicts with `deterministic-rendering.md`.
- react-aria Table/GridList/Tree would solve selection and keyboard but owns focus. Barred.

No ADR.

### 3.6 Other items

- **Tree view.** BORROW patterns.
  - Use Base UI `Collapsible` for expand/collapse and hand-roll the APG tree keys: Up/Down/Left/Right/Home/End/typeahead, `role=tree/treeitem`, `aria-expanded`, `aria-level/setsize/posinset`. About 150 lines static, plus virtualisation via the existing `react-virtual`.
  - `@headless-tree/core` 1.7.0 (MIT, 12.6 KB, last push 2026-10-14) is the best library: DOM-free state with prop getters, typeahead, rename, DnD, and an `AssistiveTreeDescription` live region. But its bundle emits `role: "tree"|"treeitem"`, `tabIndex`, `onKeyDown`, `onDragStart`, `aria-*` and 25 hotkey references. That is a keyboard and focus model: headless for styling, not for rule 4. If a file tree becomes a headline component, take it with an exception.
  - react-arborist peers on `react-dnd` (REJECT).
- **Resizable split panes.** Hand-roll an APG window splitter: `role="separator"`, `aria-valuenow/min/max`, `aria-controls`, Arrow keys, Home/End, Enter to collapse, pointer capture, and a CSS grid template via a custom property. About 100 lines.
  - `react-resizable-panels` 4.14.5 (MIT, 19.7 KB, 0 open issues, pushed 2026-10-12) was verified in its bundle: `role="separator"`, `aria-valuenow/min`, `aria-controls`, ArrowLeft, Home, End, F6, `"use client"`, localStorage and `defaultLayout` for SSR persistence, and `data-group`/`data-panel`/`data-separator` hooks (styling 4/5).
  - Take it with an exception only if nested, persisted, collapsible IDE-style layouts are wanted. `main` points to a `.cjs` and there is no `exports`, so run the Node ESM probe. `allotment` has 6 deps (REJECT).
- **Diff.** `diff` (jsdiff) 9.0.0: BSD-3-Clause (matches the `BSD-*` allow-list row), `type:module`, 7.9 KB, 0 deps, pure functions (`diffLines`, `diffWords`, `structuredPatch`). ADOPT-grade as an engine if a `DiffView` is built. We render the rows ourselves (monospace table, `intent-success`/`intent-danger` roles), which is deterministic. `react-diff-view` 3.3.3 drags lodash, gitdiff-parser and less/CSS (REJECT). `@codemirror/merge` only if CM is adopted.
- **Terminal emulation.** `@xterm/xterm` 6.0.0 (MIT, 81.7 KB gz, last release 10 months ago, pushed 2026-10-13, 308 open issues).
  - Its `ITheme` is a JS object of strings (foreground, background, cursor, selection*, black ... brightWhite, extendedAnsi). It maps onto the 16 ANSI slots the repo already emits via `ansi:build` and `terminal/*.alacritty.toml`, so theming means one more emitter target, not a real problem.
  - Whether `ITheme` accepts `var()` was not verified. Resolve with `getComputedStyle` at mount, so Level switches need an effect.
  - It has a `screenReaderMode` option (typings) and captures the keyboard fully, so it needs a documented Escape/Tab story.
  - Only if a live terminal surface is a goal. For a static terminal look use `<pre>` plus the ANSI palette. ADR required.
- **Forms.** DS stays schema-agnostic.
  - Base UI `Form` (docs verified): `errors` prop keyed by `Field.Root name`, `onFormSubmit(formValues)`, `validationMode`, `actionsRef.validate()`, and `action` for `useActionState`. The docs wire Zod manually with `safeParse` plus `z.flattenError(...).fieldErrors`. That is the whole integration surface for any validator, ~15 lines.
  - TanStack Form 1.33.5: "natively supports all libraries following the Standard Schema specification", no DOM. Matches #203's "adopt when a form surface exists, blocked".
  - react-hook-form 7.90.0 overlaps Base UI Field state and is ref-based (REJECT).
  - Validators: valibot 1.5.0 is 14.7 KB whole and tree-shakeable. zod 4.6.7 is 89 KB whole-entry on bundlephobia; `zod/mini` exists but its size is unverified.
- **Not researched further:** Zag.js / Ark UI state machines (date-picker, tree-view, splitter, combobox) own focus and keys by design, so rule 4 bars them.

## 4. ADR / exception flags

| Recommendation | Needs |
|---|---|
| @dnd-kit/react (Kanban fallback) | ADR: DnD sensor engine. Decide whether `KeyboardSensor`/`Accessibility` plugins are allowed or stripped. |
| pragmatic-drag-and-drop | ADR or lazy-import policy for a package that does not resolve in plain Node ESM. Check `check:import-cost` and the Node probe. |
| CodeMirror 6 | ADR: text-editing engine is not an interaction primitive; autocomplete/tooltip popups excluded. |
| react-day-picker | Rule-4 exception for day-grid roving focus, or wait for Base UI Calendar. |
| headless-tree / react-resizable-panels / xterm | Rule-4 exception each, or hand-roll (recommended for panes; tree optional). |
| `@full-ui/headless-calendar` | ADR-0005-style note listing it as a layout engine. Spike first. |
| TanStack Table v9 bump | `deps:cost:update` diff review, #347. |
| Everything else picked (Menu DnD alternative, Autocomplete palette, DataTable selection, forms, jsdiff) | No ADR. Manifest entries and baseline updates only (`remove-accents`, `date-fns`, `@date-fns/tz`, `diff` BSD-3-Clause if adopted). |

## 5. Cheapest path: hand-roll vs dependency

| Piece | Hand-roll size | Worth a dependency? |
|---|---|---|
| Command palette | ~150 lines of DS surface over Base UI | No |
| Fuzzy scorer | ~25 lines | No (or 2.6 KB `match-sorter-utils`) |
| Kanban keyboard path | Menu composition, ~60 lines | No |
| Kanban pointer path | ~100 lines native | Only if drag feel/auto-scroll is demanded: dnd-kit with ADR |
| Month grid | ~150 lines | No, Base UI will ship it |
| Event layout (week/day overlap packing) | 300-500 lines | Candidate: headless-calendar spike |
| Row selection + keyboard nav | ~150-200 lines | No |
| Split panes | ~100 lines | Optional |
| Tree view | ~150 lines static | Optional headless-tree with exception |
| Diff | ~40 lines on jsdiff | Yes, `diff` (7.9 KB) |
| Code editing | Thousands of lines | Yes, CodeMirror, with ADR |
| Terminal | Not realistic | Yes, xterm, with ADR |
| Form validation glue | ~15 lines | No new dependency |

## 6. Unverified or not verifiable

- Atlassian accessibility guidelines page (fetch blocked); relied on a search-result summary.
- Whether `@atlaskit/pragmatic-drag-and-drop` really fails plain-Node ESM (predicted from the manifest, not executed). Same for the other no-`exports` packages.
- Safari status of Temporal (secondary sources only). Native HTML5 DnD touch behaviour on current iOS/Android.
- FullCalendar v7 licence status of timeline/resource views (only 6.x manifests inspected).
- Monaco's current `var()` behaviour. xterm `ITheme` acceptance of `var()`.
- `react-day-picker` vs `@daypicker/react` as the canonical install name.
- CodeMirror Tab-trap behaviour and screen-reader quality (not tested). Real marginal cost of every package (`check:dep-cost` not run). `zod/mini` size.
- TanStack Table v9 real tree-shaken size. Base UI combobox/autocomplete marginal entry-point cost.
- Maintenance claims come from npm publish times and GitHub `pushed_at`; no issue-triage health was assessed beyond open-issue counts.

## 7. Evidence log

- **Repo (local).** AGENTS.md rule 4; `docs/dependency-cost.md`; `docs/dependencies.md` (ESM probe rule, licence allow-list including Apache-2.0 and BSD-*); `docs/adr/0005`; `docs/radix-vs-base-ui.md` §5 (stale on calendar); `docs/shadcn-evaluation.md` coverage table and decision; `licenses.baseline.json` (default-deny, shipped scope only); `src/components/DataTable.tsx`; `apps/site/src/lib/highlight.ts`; `apps/site/src/app/globals.css`. Issues #158, #203, #209, #344-#348 read via `gh`.
- **dnd-kit (source).** `defaultPreset`; `Accessibility` defaults and attributes; `KeyboardSensor` default codes (Space/Enter start, Escape cancel, Tab ends); `StyleInjector` doc; `.focus(` count 1; no `"use client"` banner in `@dnd-kit/react`.
- **pragmatic-dnd (source).** README capabilities; LICENSE (Apache-2.0); root `index.js` exports `{}`; nested stub `package.json` with `main`/`module`; CHANGELOG 2.0.2 -> 4.0.0.
- **Base UI (source and docs).** 1.9.0 release notes; exports map (80 entries; `calendar` absent; `internals/temporal*` present); issues #1709, #1973, #3666, #4505, #4786; Autocomplete, Combobox and Form docs pages.
- **Others.** react-day-picker styling docs and npm manifests. FullCalendar v7.1.2 CHANGELOG, LICENSE and `headless-calendar` README. CodeMirror `HighlightStyle` implementation, `style-mod` rendering and `cspNonce`. Shiki css-variables doc. react-resizable-panels and headless-tree dist bundles grepped for ARIA/keys. xterm typings. npm registry JSON and bundlephobia for all version, date, licence, dependency and size figures (fetched 2026-10-14).

## 8. Sources

Repo (local): `/Users/ryankelly/code/personal/design-system/temp/eval-applied-archetypes/packages/design-system/` (AGENTS.md, DESIGN.md, docs/dependencies.md, docs/dependency-cost.md, docs/radix-vs-base-ui.md, docs/shadcn-evaluation.md, docs/adr/0005-chart-rendering-engines.md, licenses.baseline.json, src/components/DataTable.tsx); `/Users/ryankelly/code/personal/design-system/temp/eval-applied-archetypes/apps/site/src/lib/highlight.ts` and `src/app/globals.css`. GitHub issues rtkelly13/design-system #158, #203, #209, #344, #345, #346, #347, #348.

DnD
- https://github.com/clauderic/dnd-kit
- https://www.npmjs.com/package/@dnd-kit/react
- https://dndkit.com
- https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/extend/plugins/accessibility.mdx
- https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/extend/sensors/keyboard-sensor.mdx
- https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/extend/plugins/style-injector.mdx
- https://unpkg.com/@dnd-kit/dom@0.5.0/index.js
- https://github.com/atlassian/pragmatic-drag-and-drop
- https://www.npmjs.com/package/@atlaskit/pragmatic-drag-and-drop
- https://unpkg.com/@atlaskit/pragmatic-drag-and-drop@4.0.0/?meta
- https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines/ (blocked; summary via search)
- https://react-aria.adobe.com/dnd
- https://www.npmjs.com/package/@react-aria/dnd
- https://www.npmjs.com/package/@hello-pangea/dnd
- https://github.com/hello-pangea/dnd
- https://www.npmjs.com/package/sortablejs
- https://www.npmjs.com/package/dragula

Calendar
- https://github.com/mui/base-ui/issues/1709, /1973, /3666, /4505, /4786
- https://github.com/mui/base-ui/releases/tag/v1.9.0
- https://www.npmjs.com/package/@base-ui/react
- https://daypicker.dev/docs/styling
- https://github.com/gpbl/react-day-picker
- https://www.npmjs.com/package/@daypicker/react
- https://react-aria.adobe.com/Calendar
- https://www.npmjs.com/package/@internationalized/date
- https://github.com/fullcalendar/fullcalendar (CHANGELOG.md, LICENSE.md, packages/headless-calendar/README.md)
- https://fullcalendar.io/docs/theming
- https://github.com/schedule-x/schedule-x
- https://www.npmjs.com/package/react-big-calendar
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal
- https://flaviocopes.com/temporal-api.md
- https://www.npmjs.com/package/temporal-polyfill

Editor
- https://codemirror.net/examples/styling/
- https://codemirror.net/docs/ref/
- https://unpkg.com/@codemirror/language@6.13.1/dist/index.js
- https://unpkg.com/style-mod@4/src/style-mod.js
- https://shiki.style/guide/theme-colors
- https://www.npmjs.com/package/shiki
- https://lightrun.com/answers/microsoft-monaco-editor-allow-css-variables-in-themes
- https://www.npmjs.com/package/monaco-editor
- https://www.npmjs.com/package/@uiw/react-codemirror
- https://www.npmjs.com/package/react-simple-code-editor
- https://www.npmjs.com/package/lexical
- https://www.npmjs.com/package/@tiptap/react

Palette
- https://base-ui.com/react/components/autocomplete
- https://base-ui.com/react/components/combobox
- https://www.npmjs.com/package/cmdk
- https://www.npmjs.com/package/kbar
- https://www.npmjs.com/package/match-sorter
- https://www.npmjs.com/package/@tanstack/match-sorter-utils
- https://www.npmjs.com/package/fuse.js

Grid
- https://www.npmjs.com/package/@tanstack/react-table
- https://www.npmjs.com/package/@tanstack/react-virtual
- https://www.npmjs.com/package/@tanstack/react-hotkeys
- https://www.ag-grid.com/react-data-grid/theming/
- https://www.npmjs.com/package/ag-grid-community
- https://www.npmjs.com/package/@glideapps/glide-data-grid

Other
- https://github.com/lukasbach/headless-tree
- https://headless-tree.lukasbach.com/
- https://www.npmjs.com/package/react-arborist
- https://github.com/bvaughn/react-resizable-panels
- https://unpkg.com/react-resizable-panels@4.14.5/dist/react-resizable-panels.js
- https://www.npmjs.com/package/allotment
- https://www.npmjs.com/package/diff
- https://www.npmjs.com/package/react-diff-view
- https://github.com/xtermjs/xterm.js (releases/6.0.0)
- https://unpkg.com/@xterm/xterm@6.0.0/typings/xterm.d.ts
- https://tanstack.com/form/latest/docs/framework/react/guides/validation
- https://base-ui.com/react/components/form
- https://www.npmjs.com/package/react-hook-form
- npm registry JSON `https://registry.npmjs.org/<pkg>` and https://bundlephobia.com/api/size for all version, date, licence, dependency and size figures.
