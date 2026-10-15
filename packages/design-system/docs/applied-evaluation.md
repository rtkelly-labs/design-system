# Applied evaluation

In October 2026 we rebuilt five apps with the system (kanban, inbox, settings, calendar, code editor),
audited all 359 stories, and surveyed open-source options for what the system lacks. Each app ran on both
levels at 375, 768 and 1280, with keyboard only, reduced motion, print and emulated touch.

The visual language held up. The gaps were missing components and a role palette with too few distinct
colours. PRs #382–#400 fix most of what was found. This page records the decisions behind them and what is
still open.

The full per-pass reports, with sources for every finding, are on the tag `exp/applied-refinements-record`
under `packages/design-system/docs/applied-evaluation/`. The decision board lives only on that tag.

## Decisions

| ID | Pick | Why |
|---|---|---|
| D1 | `quiet` button: 2px neutral border, no fill, hard shadow on hover only. It is the new default variant | Every app had row actions louder than the data |
| D2 | `secondary` becomes an `edge-strong` outline with a 4px hard shadow, no ink fill | The filled secondary was louder than primary |
| D3 | `danger` variant: danger outline and text, filled on hover or focus. A `ButtonGroup` warns in development when two same-hue buttons sit together | `accent.tertiary` and `intent.danger` are the same hue on both levels, and `tertiary` was the default |
| D4 | `xs` 28px, icon-only 32px, `icon-touch` 40px | WCAG 2.5.8 needs 24px; 2.5.5 asks for 44px |
| D5 | Paper prints in Sketch's roles, with `print-color-adjust: exact` | Midnight printed at 1.0–3.3:1 with backgrounds off. Print picks a Level rather than adding a palette (ADR 0004) |
| D6 | Multi-select rows use an opaque accent tint at 3:1 or more. A single current item (nav, SegmentedControl, selected day) uses a solid accent fill with inverse text | Surface-step selection was 1.03–1.11:1 and failed WCAG 1.4.11 |
| D7 | Skeleton is a diagonal hatch on `sunken` | The old skeleton was invisible |
| D8 | Role tints at 20% on Midnight, 12% on Sketch. Edge-only, no fill, for tentative or low-priority items | The levels are authored independently and need not match. Every role passes 4.5:1 on its own tint |
| D9 | A runtime preference axis beside Level: motion, contrast, colour vision (`patterns`), link underlines. Each defaults to the OS signal where one exists | [ADR 0007](./adr/0007-preference-axis.md); research in [`applied-evaluation/a11y-preferences-research.md`](./applied-evaluation/a11y-preferences-research.md) |
| D10 | Superseded by R6 | The owner rejected the first two syntax directions |
| D11 | Labels inside tables are hairline: a 1px subtle outline, no fill, secondary text | "We have a lot of colour already." Kanban cards keep filled Tags |
| Tabs | A closable tab's × is a real button named "Close &lt;file&gt;", rendered beside the tablist rather than inside it | Voice-control users need a target they can name. Inside the tablist, axe fails `aria-required-children` |
| R6 | A role-based code theme. Keywords `accent.tertiary` (red on Sketch), functions `accent.primary`, strings green, numbers and types `accent.secondary` on Midnight and violet on Sketch. Selection is one region at about 30% with a forced ink. Find matches are drawn as borders, not fills | The structure comes from [Pink Ink](https://github.com/IEvangelist/pink-ink) (MIT). Its hues do not. The theme is cited, not vendored ([`reference-material.md`](./reference-material.md)) |

## Still open

Filed:

- #395 `ThemeProvider` loses the stored level under React StrictMode.
- #396 Importing `LEVELS` costs 5.5 KB since it carries syntax and editor data.
- #397 Sketch syntax prints as one grey.
- #398 Midnight `intent.danger` is the same pink as `accent.tertiary`.
- #399 Temporal components, CodeView and DiffView.
- #158 Command palette.
- #77, #80–#86 The editor theme itself, its emitters (VS Code, terminals, Zed, JetBrains) and the gates it needs.

Not filed:

- DataTable has no row selection, no sticky header and no responsive mode, so it cannot be an inbox. #347 is adjacent.
- No keyboard composites: listbox, grid, tree and toolbar roving focus. Four of five apps rewrote arrow-key handling.
- No drag primitive. The kanban sample hand-rolls about 250 lines, and touch drag across columns fails at phone width because scroll-snap fights auto-scroll.
- No interactive Tree or SplitPane.
- ANSI pairs the terminal gate misses: Midnight `brightBlack` is 1.09:1 and Sketch `white` and `brightWhite` are about 1.1:1. There are no `--ds-ansi-*` CSS variables.
- Form fields take string labels only and always uppercase them, have no optional or required marker, and drop the character count when an error shows. Input has no adornment slot.
- Density: rows are 37px against Gmail's 28–30, and there is no small Checkbox.
- Elevation: Card's docs say "4px hard shadow" but it computes `none`. Shadows appear at 2, 3, 4, 6 and 8px.
- Type scale: 6 tokens, about 25 rendered sizes, and about 800 characters set at 9–10.5px.
- Hit targets under 24px: table sort buttons (16px), sidebar toggles (18px).
- Radio and Checkbox look the same unchecked.

## Libraries for what is not built yet

Rule 4 applies: Base UI is the only interaction library.

| Need | Pick | Fallback |
|---|---|---|
| Drag | Native pointer drag, with a Base UI `Menu` "Move to…" as the keyboard path | `@dnd-kit/react` |
| Calendar grid | Hand-rolled on `date-fns`. Base UI removed its Calendar in #4505, so don't wait for it | `react-day-picker` |
| Code editing | CodeMirror 6, themed with `var(--ds-*)`. Display stays on Shiki | — |
| Command palette | Base UI `Autocomplete` inline in `Modal` | — |
| Diff | `diff` (jsdiff) | — |
| Tree, split pane | Hand-rolled to the APG patterns | `headless-tree`, `react-resizable-panels` |
| Live terminal | Static `<pre>` with ANSI variables | `@xterm/xterm` |

Ruled out: `cmdk`, `kbar`, `react-aria`,
`@hello-pangea/dnd`, FullCalendar, Monaco, AG Grid.

## Not tested

Real iOS or Android devices, real screen readers, and Windows High Contrast.
