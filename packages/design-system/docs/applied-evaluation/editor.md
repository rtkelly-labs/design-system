# Code editor archetype: findings (VS Code / Zed vs @rtkelly13/design-system)

Date 2026-10-14. Package 0.14.0, two levels (`midnight`, `sketch`).

I could not write `FINDINGS.md`. The harness rejected the Write ("subagents should return findings as text"), so this message is the full report. Screenshots, PDFs and measurement scripts are in `/private/tmp/claude-501/-Users-ryankelly-code-personal/bf919a17-fd46-452f-9827-41b743b650ae/scratchpad/editor/`.

## (A) What was built

Both files are under `/Users/ryankelly/code/personal/design-system/temp/eval-applied-archetypes/apps/site/src/examples/editor/`:
- `data.ts`: seeded fixtures (file text, a small tokenizer, diagnostics, diff rows, file tree, commands). No Math.random, Date or locale calls.
- `workbench.tsx`: `'use client'`, default export `EditorWorkbench`.

Registry line (I did not touch `index.ts`):
```ts
import EditorWorkbench from './editor/workbench';
// in EXAMPLES:
  'editor/workbench.tsx': EditorWorkbench,
```
This is a full-viewport screen (`h-dvh`), not a docs snippet. A component-page preview would need a tall frame. Registering it as a sample page needs `src/content/samples.ts` and `src/samples/index.tsx`, both left alone.

**Contents**
- **Chrome:** title bar with a palette trigger, an activity bar (NerdIcon), and a `Drawer` for the sidebar below `md`.
- **Sidebar:** a hand-built `role=tree` explorer with git badges, plus an Outline section using `TreeDiagram`.
- **Tabs:** an editor tab strip built from `Tabs`, `TabsList`, `TabsTab` and `TabsPanel`, with a dirty dot and close buttons. `Breadcrumbs` sit under it.
- **Editing surface:** line numbers, git gutter, fold markers, indent guides, current line, selection, find matches, bracket match, error/warning/info squiggles, minimap, a find widget and a wrap toggle.
- **Diff:** a unified diff tab with `ChangeSummary`.
- **Bottom panel:** a Problems list, a `Terminal` figure, and a 16-slot ANSI test strip.
- **Remaining chrome:** a status bar, a command palette (`Modal` plus a hand-rolled combobox), and a theme-level button.

**Limits**
- **Mock surface:** the editing surface is a static, line-addressed mock. It has no caret, text input or undo. The package has no editing primitive and Monaco/CodeMirror were ruled out.
- **Syntax by role:** syntax colour is role-only: keyword `accent-tertiary`, string `intent-success`, number `intent-warning`, function `accent-primary`, type `text-primary` bold, punctuation `text-secondary`, comment `text-muted` italic. This mirrors the site's own Shiki stand-in in `apps/site/src/app/globals.css`.
- **Chrome by alpha:** selection, find, bracket, line-highlight and diff bands are role colours with Tailwind opacity (`/25` etc.). No `editor.*` roles exist.
- **One deliberate exception:** `AnsiStrip` colours the 16 slots through `var(--ds-palette-*)`, because a terminal has no concept of a role. It is isolated and has no literals.
- **Gates:** `pnpm check:tokens` in apps/site is 0 (87 files), eslint `--max-warnings 0` on my folder is clean, and `tsc --noEmit` shows 0 errors there. Three eslint-disable lines carry reasons: the scrollable-region tabindex, the combobox option click, and the palette `autoFocus` (see F-09).
- **No dev server on 3105:** the example mounts nowhere without editing `index.ts`, so I did not start it. I viewed it through a scratch esbuild plus `@tailwindcss/postcss` harness in the scratchpad (`harness/`). It uses the real `dist/styles.css` and has `@source` pointed at my folder. It lacks the site's `Providers` (`LinkProvider`, search).
- **Repo hygiene:** nothing was written outside `examples/editor/`.

## (B) Per-format results

| Format | midnight | sketch | Notes |
|---|---|---|---|
| 1440x900 render | Pass. Neon-on-ink suits code. | Pass. Looks like a printed listing; best of the two. | Squiggles, indent guides, selection and git gutter are visible in both. Midnight selection is faint (band vs ground 1.64:1). |
| 768 | Pass | Pass (`s-768.png`) | Sidebar and activity bar stay. Code scrolls sideways. The wrap toggle is hidden below `sm`. |
| 375 | Degrades acceptably (`m-375.png`) | Same | Activity bar and sidebar vanish; the sidebar opens in `Drawer`. Search, Source control and Debug are unreachable. The panel eats 176px of 800. The find widget and minimap are hidden. |
| Keyboard only | Pass with caveats | Pass with caveats | Tab walk is sane across the 34 stops I walked, with a visible 2px focus ring everywhere. `Tabs` roving arrows work and wrap. Ctrl+K opens the palette and Down/Enter runs a command (the "changes" query opened the diff tab). Caveats: the activity bar is 5 tab stops, the tree is one stop per row with no arrow keys, and every tab's close button is an extra stop. |
| prefers-reduced-motion | Vacuous pass | Same | Only 150ms colour/opacity transitions exist; they are 0.15s under both settings. `Modal` and `Tabs` have no `motion-reduce:`; `Drawer` has one. Harmless here, but not honoured. |
| Print (emulated `print`) | Poor (`print-m.png`) | Good (`print-s-grey.png`) | The DS ships zero `@media print` rules (0 matches in `dist/styles.css`, `theme.css` and `prose.css`). I wrote the `print:` utilities myself: chrome hidden, lines wrap, line numbers print. Midnight keeps its dark ground. With background graphics off, its `text.primary` `#ffffff` is on white (1.0:1) and every band vanishes. I inferred this from arithmetic; my attempt to render it was inconclusive. |
| Greyscale | n/a | Syntax collapses (`print-s-grey.png`) | The four sketch hue roles all have gamma-luma 93 (+/-1). Keyword, string, number and function are indistinguishable. Midnight spreads 146 to 220. |
| Terminal medium | `pnpm ansi:check` OK: "8 files, 2 levels x 4 encodings; 16 slots each, all distinct". `pnpm check:contrast` OK: 260 pairs, 24 selection devices, 16 Role-to-Hue. | Same | Both gates pass, yet F-04 problems exist. See F-04, F-05. |

## (C) Findings

Severity: S1 blocks the use case, S2 significant, S3 polish.

### Editor-theme role gaps

**F-01 · No syntax Group exists; #77's premise is stale · editor-theme-role-gap · S1 · both**
- **Evidence:** `levels.ts` `LevelDefinition` has no `syntax` or `editor` field, and `dist/theme.css` emits no `--ds-syntax-*` or `--ds-editor-*`.
  - #77, #78 and #80 describe a four-rung ladder with eight syntax roles from #76. #76 is CLOSED and the ladder is now two levels.
  - #148 ("Declare the syntax Group, and the composited-contrast gate it needs") is the live issue and is OPEN. #80 (editor chrome) and #84 (`build-themes.mjs`) are also still OPEN.
  - #77 and #80 need re-basing on two levels plus the `palette` layer.
- **Consequence:** a role-only consumer has 4 distinct hues per level.
  - Midnight: cyan (accent.primary = intent.info), yellow (accent.secondary = intent.warning), pink (accent.tertiary = intent.danger), green (intent.success).
  - Sketch: blue, green (accent.secondary = intent.success), red, orange.
  - Only `{accent.primary, accent.tertiary, intent.success, intent.warning}` is distinct on both levels. Types, functions, constants, properties and decorators collapse onto `text-*` tones; I shipped type as bold white. VS Code themes use 8 to 12 token colours.
- **Fix:** declare `syntax.*` roles per level (keyword, string, number, function, type, constant, property, comment, punctuation, tag, attribute, regex, invalid), each referencing a `palette` Hue and gated by the composited-contrast check in #148.
- **In-language:** yes. It follows the `intent` role-group pattern.

**F-02 · No editor-chrome roles; alpha faking fails AA, especially on sketch · editor-theme-role-gap · S1 · both, worse on sketch**
- **Evidence:** #80 is open. These are measured contrast values for foreground roles over the bands I invented (`used.mts`). `*` means under 4.5:1.

| Band over `surface.sunken` | midnight failing | sketch failing | Band/ground (mid / sketch) |
|---|---|---|---|
| selection = accent.primary/25 | muted 3.73\*, keyword 4.05\* | muted 3.44\*, ALL hue roles 3.78 to 3.81\* | 1.64 / 1.46 |
| find = intent.warning/25 | muted 3.54\*, keyword 3.84\* | muted and ALL hue roles about 3.84\* | 1.72 / 1.44 |
| find-current (/50) | secondary 3.06\*, primary 2.94\*, keyword 1.74\* | all hue roles about 2.5\* | 3.81 / 2.17 |
| diff add or del at 15% | passes | muted about 4.0\*, ALL hue roles 4.2 to 4.5\* | 1.17 to 1.32 / 1.25 to 1.31 |
| bracket = text.primary/15 | muted 4.22\* | muted and hues about 4.2\* | 1.45 / 1.32 |

- **Sketch headroom:** every syntax colour fails AA inside a selection or find band, and even a 15% tint gives 4.2 to 4.5.
  - Palette hues sit at 5.51 to 5.60 on `sunken`, so a `text.primary` tint has about 0.11 alpha of headroom. Midnight allows 0.16 to 0.37.
  - `levels.ts` says the 5.5 floor exists so "an editor still has room to tint the ground". Sketch has about 0.02:1 of room. #78's problem survives on `sketch`.
- **`color-mix()`:** `bg-accent-primary/25` compiles to `color-mix()`, which `levels.ts` rule 4 says cannot hold on both grounds. Passing `check:tokens` is not evidence it is right.
- **Missing roles I needed:**
  - Selection and find: `selection`, `selectionInactive`, `findMatch`, `findMatchCurrent`.
  - Highlights and guides: `lineHighlight`, `bracketMatch`, `wordHighlight`, `indentGuide`, `indentGuideActive`.
  - Diff and gutter: `diffInserted`, `diffRemoved`, `gutterAdded`, `gutterModified`, `gutterRemoved`.
  - Other chrome: `lineNumber`, `lineNumberActive`, `cursor`, `minimapViewport`, `foldMarker`.
- **Diagnostics are the exception:** `intent.*` squiggles read fine in both levels.
- **Fix:** #80 as scoped, as literal `#rrggbbaa` per level, with a composited-contrast gate. Sketch needs a lower alpha or darker hue values.
- **In-language:** yes.

**F-03 · Diff pair is not separable; only red/green is on offer · editor-theme-role-gap · S2 · both**
- **Evidence:** inserted and removed 15% bands are 1.14:1 against each other on midnight and 1.05:1 on sketch. Sketch danger and success have equal luma; ANSI red `#bd0010` vs green `#006b2e` measures 1.01:1.
- **Mitigation I added:** a `+`/`−` column and `sr-only` "added:/removed:" text.
- **Stale reference:** `separation.ts`, cited in #80/#81, no longer exists in `src/theme/`.
- **Fix:** ship a deliberately non-red/green pair and gate it.
- **In-language:** yes.

**F-04 · ANSI: `brightBlack`, selection, and sketch `white`/`brightWhite` are unreadable · editor-theme-role-gap · S1 · both**
- **Evidence:** contrast vs terminal `background` (`measure.mts`):

| Slot | midnight | sketch |
|---|---|---|
| black | 1.03 | 13.63 |
| brightBlack | 1.09 | 10.75 |
| white | 11.27 | 1.08 |
| brightWhite | 19.60 | 1.11 |
| selection bg vs bg | 1.09 | 1.11 |
| cursor vs bg | 10.85 | 5.99 |

- **Why it matters:** `brightBlack` (SGR 90) is the dim-text slot (autosuggestions, git-ignored files, hints, vim comments). On midnight it is `surface.raised` on `surface.base`, so it cannot be read. Sketch `white` and `brightWhite` are the paper itself.
- **Selection:** `selectionBackground` is a barely visible ghost in both (`#14142a` on `#0a0a1a`; `#ffffff` on `#f5f3ec`). `ansi.ts` justifies it as "must be opaque and every foreground reads against it", but nothing checks that it is visible against the background.
- **Gate gap:** `check:contrast` passes because none of these pairs is in its 260.
- **Fix:** gate `brightBlack` >= 3:1 against `background`, gate `white` and `brightWhite` >= 4.5:1 as text, and require a visible selection.
- **In-language:** yes.

**F-05 · Terminal emitters stop at ANSI-16 plus four chrome values; no CSS ANSI vars · editor-theme-role-gap · S2 · both**
- **Evidence:** `terminal/` holds 8 files (Alacritty, Ghostty, iTerm2, Windows Terminal, x2 levels). There is no Kitty (named in #86), no VS Code/Shiki theme (#84 open), and no Neovim/Zed. Each carries only fg, bg, cursor and selection.
- **Web terminals:** there are no `--ds-ansi-*` custom properties, so a web terminal view cannot colour by slot without picking Hue vars by hand. I had to reimplement the lightness-flipped achromatic rule from `ansi.ts`. My first attempt put dark-theme black on paper (`s-ansi.png`).
- **Fix:** emit `--ds-ansi-0..15` into `theme.css` from `ansi.ts`, and add Kitty and VS Code `terminal.ansi*` targets.
- **In-language:** yes.

**F-06 · Sketch hues are equal-luma by design, so syntax dies in greyscale · editor-theme-role-gap · S2 · sketch**
- **Evidence:** DESIGN.md §4 notes that equal contrast equalises luma. Gamma-luma of the sketch hue roles is 93, 92, 93, 93, so print and e-ink readers see one colour. Only bold type and italic comments survive.
- **Fix:** when a `syntax` group lands, give 2 or 3 roles a non-colour channel (bold keyword, italic comment, underlined type) as part of the role contract, and add a greyscale-distinctness check.
- **In-language:** yes.

### Component gaps

**F-07 · No line-addressed code component or editing surface · component-gap · S1 · both**
- **Evidence:** `CodeBlock` renders `children` in a `<pre>`, with no line numbers, gutter, wrap control, line highlight or decorations. `prose.css` styles it with `overflow-x: auto` only. I hand-built the gutter and line grid.
- **Fix:** add a read-only `CodeView` (line numbers, highlighted lines, per-range decorations, per-line a11y) built on F-02 roles. Declare editing a non-goal.
- **In-language:** yes.

**F-08 · `Tabs` cannot express an editor tab: no close, no dirty state, no overflow · component-gap · S2 · both**
- **Evidence:** `TabsTab` is a `<button>`, so a close button cannot nest. I placed a sibling close button per tab.
  - Roving arrows still work, but each close is an extra tab stop. The pair is not one visual tab (hover and selected states do not cover the close).
  - Dirty state is an `aria-label` plus a `●` in the label.
  - There is no reorder, overflow scroll or menu, or middle-click.
  - The `underline` strip draws a full 2px box; my strip is about 50px tall vs VS Code's 35px.
  - `TabsTab` forces `uppercase tracking-widest` (I overrode with `normal-case`), which mangles case-significant filenames.
- **Fix:** a `closable`/`onClose`/`dirty` API on `TabsTab`, a density variant, and a case-preserving option.
- **In-language:** yes.

**F-09 · No command palette; `Modal` is the wrong shell · component-gap · S2 · both**
- **Evidence:** #158 is the open palette issue. I built the minimum (about 70 lines): `Modal`, a `role=combobox` input, a `role=listbox` with `aria-activedescendant`, up/down/enter and Ctrl K.
- **`Modal` problems** (`m-palette.png`):
  - It forces a titled header and a footer with a mandatory `[ CLOSE ]` button, which take about a third of the dialog.
  - It has no `initialFocus`. Without my `autoFocus`, focus lands on the dialog div and typed text goes nowhere (verified in `kb.mjs`).
  - It has no top-anchored placement.
- **Still missing:** fuzzy scoring with match highlight, groups, recents, a `Kbd` component, async results.
- **Fix:** ship `Command*` as scoped in #158 with a headerless/footerless dialog mode, and add `initialFocus` to `Modal` and `Drawer`.
- **In-language:** yes.

**F-10 · `TreeDiagram` is a figure, not a tree; `FileChangeTree` does not exist · component-gap · S2 · both**
- **Evidence:** `TreeDiagram` renders ASCII connectors with `label`/`meta`/`accent`, with no selection, expansion, icons or keyboard model. It works well as an Outline, but it cannot be an explorer. `grep` for `FileChangeTree` across `src`, `api` and `docs` finds nothing.
- **What I hand-built:** an `aria-expanded` button tree with no arrow keys, type-ahead, virtualisation, multi-select or rename.
- **Fix:** an interactive `Tree` with ARIA tree keys (Base UI has no tree primitive), plus a `FileTree` preset with git status.
- **In-language:** yes.

**F-11 · `Terminal` figure has no ANSI and no error/warn line kinds · component-gap · S2 · both**
- **Evidence:** the four line kinds are command, comment, ok and output. `FAIL ...` and `error TS2551` render as muted output, indistinguishable from a comment (`m-terminal.png`). There is no streaming, input, SGR parsing, selection or search. It is a good static transcript and decorative as a panel.
- **Fix:** parse SGR into `--ds-ansi-*` (F-05) and add `error` and `warn` kinds mapped to `intent.*`.
- **In-language:** yes.

**F-12 · `ChangeSummary` and `BeforeAfter` are metric figures, not diff views · component-gap · S2 · both**
- **Evidence:** `ChangeSummary` rows are `{label, value, sign}` (`+2`, `-1`, net). `BeforeAfter` is a slope chart. I hand-built unified diff rows with old/new line numbers, a sign column, two bands and `sr-only` text. There is no split diff, word-level diff, collapsed context or hunk headers.
- **Fix:** a `DiffView` (unified and split) on diff roles.
- **In-language:** yes.

**F-13 · No resizable panes, toolbar, `Kbd` or status-bar primitive · component-gap · S3 · both**
- **Evidence:** the panel height and sidebar width are fixed. I used a raw `<kbd>`. The activity bar is plain buttons with `aria-pressed`, not a roving toolbar. The minimap is hand-built. `AppShell` assumes `min-h-screen` flow, so I did not use it. I did not use `Menu` (no menubar pattern).
- **Fix:** `Splitter`, `Toolbar` with roving focus, `Kbd`, `StatusBar`.
- **In-language:** yes.

### Original does better, visual, a11y, token

**F-14 · Mobile: views are unreachable and `Drawer` is clumsy · original-does-better · S2 · 375**
- **Evidence:** below `md` only the Explorer survives, in a `Drawer`. `Drawer` repeats its title above my own heading and forces a Close footer (`m-375-drawer.png`). The editor gets about 200px with the panel open. VS Code web folds the activity bar to a bottom nav and collapses the panel by default.
- **Fix:** a bottom-nav `ActivityBar` variant, per-breakpoint panel defaults, and an optional `Drawer` footer.
- **In-language:** yes.

**F-15 · No print story · visual-refinement · S2 · midnight worst**
- **Evidence:** zero `@media print` rules. Midnight prints its dark ground, or white-on-white without background graphics. Bands are background-only and vanish; `print-color-adjust: exact` is never set. Sketch prints well because its ink is dark. Printing code is a core editor use case.
- **Fix:** a `print` Medium (the system already has `web`/`video`/`graphic`) that resolves to ink-on-paper values and sets `print-color-adjust: exact` for bands.
- **In-language:** yes.

**F-16 · `Breadcrumbs` uppercases path segments · visual-refinement · S3 · both**
- **Evidence:** it renders `PAGINATION-KIT / SRC / PAGINATE.TS`. Paths are case-significant. The separator and segments use `accent.secondary`, which collides with the colours of the code below.
- **Fix:** a `transform: none` option and a quieter default tone.
- **In-language:** partly. Uppercase is the language, but not for path data.

**F-17 · Syntax via `intent.*` breaks "emphasis is not meaning" · token/spacing · S3 · both**
- **Evidence:** I used `intent-success` for strings and `intent-warning` for numbers because they are the only distinct hue roles left (DESIGN.md §3). The site's own stand-in does the same. It makes `diffInserted` and `string` the same green. F-01 resolves it; consumer discipline cannot.
- **In-language:** the workaround is not.

**F-18 · `check:tokens` does not enforce "components never address Hues" · token/spacing · S3 · n/a**
- **Evidence:** the `rawPalette` rule only matches Tailwind literal names after the utility prefix (`text-cyan-500`). `text-palette-cyan` and `var(--ds-palette-red)` both pass, though DESIGN.md §3 calls a Hue in component code "a defect". My `AnsiStrip` is the one legitimate case and nothing marks it as such.
- **Fix:** flag `palette-` utilities and `--ds-palette-` in `src/` unless an allow marker with a reason is present.
- **In-language:** yes (governance).

**F-19 · What held up · note · both**
- The brutalist idiom suits an editor: 2px rules, square edges, offset shadow on the find widget and theme button, bracketed `[ EXPLORER ]` labels.
- Plex Mono at 13px reads well. `NerdIcon` covers the editor icon set (folder, folder-open, file-code, git-branch, bug, search, settings, close, alert).
- `decoration-intent-*` squiggles work in both levels.
- Role tokens made the level swap free: my file has no theme conditionals.
- Focus rings were visible on all 34 stops I walked.

### Do first
1. F-01 and F-02: declare the `syntax` and `editor` role groups plus the composited-contrast gate, re-baselined on two levels. Sketch needs the most work.
2. F-04, then F-05: gate the ANSI pairs, then emit `--ds-ansi-*`.
3. F-07 (`CodeView`) and F-08 (`Tabs` close and dirty) are the two components an editor cannot do without. F-09 (palette, #158) next.
4. F-15: a print Medium.
