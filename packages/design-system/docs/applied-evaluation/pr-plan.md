# Landing the applied refinements: the PR plan

The work was built and reviewed visually on `exp/applied-refinements`. The tag
`exp/applied-refinements-record` (b370bd4) is the permanent record, and the
decision board at `/site/decisions` lives only there. It lands on `main` as the
PRs below. Each one is cut from current `main`, or from the PR it depends on,
and is opened as a draft for the owner to merge.

| # | PR | Contents | Depends on |
|---|---|---|---|
| 1 | docs: applied evaluation | This folder: roll-up, reports, references, decisions, accessibility research, the reference-themes reading. Also keeps dated reports out of `check:docs` | — |
| 2 | feat(site): applied samples | Kanban, inbox, settings, calendar and editor as full-page samples; `fullHeight` | — |
| 3 | fix(motion): reduced motion at the token | Duration tokens collapse under reduce; the `--transition-duration-*` name fix | — |
| 4 | fix: brackets, `pre` radius, NoteBlock intents | NBSP brackets, `text-wrap: balance`, zero radius on code `pre`, NoteBlock names match intents (breaking) | — |
| 5 | feat(print): paper prints in Sketch | `PRINT_LEVEL` and the generated print block (D5-B); tables unclip in print | — |
| 6 | feat(button): weight ladder and danger rule | quiet (new default), outline secondary, danger, small and icon sizes, `ButtonGroup` hue check (D1–D4) (breaking) | 2 |
| 7 | feat: SegmentedControl | A view switcher that isn't a tab pattern; calendar and inbox migrate | 2, 6 |
| 8 | feat(tabs): case option and closable tabs | `transform`, `onClose`/`dirty`, an exposed close button | 2 |
| 9 | feat: dialog shells, Toolbar, `<main>` ownership | `initialFocus`, header-less mode, AlertDialog confirm props, Toolbar, `AppShell mainAs` | 2, 6 |
| 10 | feat(theme): role tints, selection devices, hatch skeleton | D6, D7, D8 | 2, 7 |
| 11 | fix: responsive and consistency sweep | G01–G16, AUD-F28–F34 | 8 |
| 12 | feat(a11y): preference axis | ADR 0007, provider, init script, menu, contrast-more, series marks (D9) | 10 |
| 13 | feat(labels): small and hairline labels | Badge/Tag `size="sm"`, hairline appearance, Table label context (D11) (breaking: Tag becomes a client component) | 12 |
| 14 | feat(theme): syntax and editor roles | The round 6 code theme: #148, #80, Shiki mapping, code metrics, Terminal error and warn | 12 |
| 15 | feat(site): specimen pattern and Code & syntax page | Specimen components and the foundations page | 14 |

## Rules for cutting them

- Regenerate, never hand-resolve: `api/index.d.ts`, `api/slots.txt`, `theme.css`, `tokens/*.json`.
- Budgets are measured per PR. Since #379, only `theme.css` and import-cost are gated.
- A new component gets its root `data-slot` and a compendium plate in the same PR.
- Breaking PRs (4, 6, 13) bump the minor with a terse CHANGELOG line.
- `/update-snapshots` is requested only on the PR that merges next, after its final rebase.

## Follow-up issues (not in these PRs)

- `ThemeProvider` loses the stored level under React StrictMode (SET-11).
- `LEVELS` carries the syntax and editor data, so importing it now costs 5.5 KB; split it.
- Sketch syntax prints as one grey (round 6 ✕).
- Midnight `intent.danger` shares pink with `accent.tertiary`; the editor uses the red hue.
- Temporal primitives, CodeView and DiffView, the command palette (#158).
- The IDE theme exercise: VS Code, terminals (including Windows Terminal), Zed, JetBrains.
