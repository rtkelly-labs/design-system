# AGENTS.md — @rtkelly-labs/design-system-report

Renders a `.tsx` file to one self-contained HTML report, styled by
`@rtkelly-labs/design-system`. Published to public npm.

**The bin is `ds-report`, not the package name.** That asymmetry is deliberate: a
package name is read, in a manifest and on npm, where
`@rtkelly-labs/design-system-report` says exactly what it is and what it belongs to.
A bin name is typed, every time, and `npx ds-report audit.tsx` is the thing
somebody actually runs. `typescript` shipping `tsc` is the same trade.

Package manager is **pnpm** (`node >=22`). This is one package in a workspace —
see the [root AGENTS.md](../../AGENTS.md) for how the two fit together, and
[`packages/design-system/AGENTS.md`](../design-system/AGENTS.md) for the rules
every report is held to.

---

## 🛑 The one-way dependency

`@rtkelly-labs/design-system-report` depends on `@rtkelly-labs/design-system`. The design system
must never depend on this package, and nothing there may import from here —
that includes stories and tests. When a change seems to need it, the thing being
reached for belongs on the design system's side of the line.

`@rtkelly-labs/design-system` is a **peer**, resolved from the *report's* own
directory rather than from this package. An author renders against the version
they installed, the one their editor typechecks against; a fix here is not a
release of the components.

---

## 📜 Commands

- `pnpm report <file.tsx>`: Renders a report straight from `src/`, no build first.
- `pnpm manifesto`: Renders the Design Manifesto (`reports/manifesto.tsx`) — a repo-local
  report — to HTML and `--pdf` paper. Lint-strict; output is ignored, the `.tsx` is the artefact.
- `pnpm compendium`: Renders the Compendium (`reports/compendium.tsx`), one plate per component, packed several to an A4 sheet, to HTML and `--pdf`. See below.
- `pnpm verify:report-cli`: Packs both packages, installs them into a throwaway project and drives `ds-report` as a consumer. Runs in CI.
- `pnpm build`: Bundles ESM, CJS and types via `tsup`, and copies the templates to `dist/`.
- `pnpm typecheck`: Validates TypeScript strict mode. Needs the design system built first — it resolves the peer through that package's `exports` map.
- `pnpm test`: Vitest, node environment throughout.
- `pnpm check:deps`: knip over dependencies, unlisted and unresolved imports.

---

## 📄 Reports Are TSX, Not Hand-Written HTML

**An agent that needs to emit an HTML report renders a `.tsx` file through
`ds-report`. It does not write HTML.**

The rules are here. The reference behind them — report design and its sources,
the determinism and speed measurements, the lint's two rule families, and which
components render inert in a static document — is
[`docs/reports.md`](./docs/reports.md).

```bash
ds-report audit.tsx --theme white               # → audit.html, self-contained
ds-report audit.tsx --theme midnight,white      # both rungs, one render
ds-report audit.tsx --pdf                       # → audit.html + audit.pdf: the same markup on paper
ds-report a.tsx b.tsx c.tsx --strict            # a batch, lint warnings fatal
pnpm report src/templates/sample.tsx            # the same thing from a checkout
```

Two files, with different jobs:

- **`src/templates/template.tsx` is what you copy.** Small on purpose — a title, a
  stat row, a table, a note.
- **`src/templates/sample.tsx` is what you read.** The worked example, exercising
  every path the generator supports, and it is *also* the regression: the render
  test asserts it and `components-reports-reportdocument--sample` screenshots it.
  Adding a component to the report vocabulary means adding it there.

Both ship to `dist/report/` so they are readable from an install.
`reports/contrast.tsx` is a third kind — a repo-local report, rendered by
`pnpm contrast:report:html`, that runs `auditContrast` **during the render**. It
is the proof that a report can compute rather than display: the audit is not
passed in and cannot go stale. Repo-local reports live in `reports/`, are
typechecked, and ship nowhere.

`ReportDocument`, `ReportSection` and `ReportDetails` are the frame; everything inside is ordinary
composition with `Card`, `StatCard`, `DataTable`, `NoteBlock` and `Prose`.

### What makes a generated report worth reading

The full reference, with the sources it rests on, is
[`docs/reports.md`](./docs/reports.md); the header comment in `sample.tsx` is the
same list next to the code that implements it. The short version — seven patterns
the report generators people actually keep converge on, none of which needs
JavaScript:

1. **The verdict comes first**, before the evidence.
2. **Numbers before prose.** A stat row is scannable in two seconds.
3. **Provenance is part of the report** — when, what commit, what config. A
   report that cannot be traced to its inputs cannot be reproduced.
4. **Progressive disclosure, not omission.** `ReportDetails` is a `<details>`
   element, so a 200-row table folds away with no script at all. This is the one
   interactive affordance a static document genuinely has.
5. **Severity never rides on colour alone.** Every badge carries a word and the
   disclosure marker is `[+]`/`[-]` text, so the report survives greyscale
   printing and a reader who cannot distinguish the hues.
6. **Sections are addressable.** `ReportSection` derives an `id` from its title,
   so a reader can link to one instead of describing it.
7. **The zero case is designed.** "No advisories" has to look deliberate rather
   than like a rendering failure.

### Reports are typechecked

**esbuild strips types without reading them**, so a report could pass the lint,
bundle cleanly, and still be wrong. `value={{ nope: true }}` on a `StatCard` is
not a lint problem and not a runtime crash — it is a report with
`[object Object]` in it, found by whoever reads the report.

`ds-report` therefore spawns a compiler over the report before rendering it, on
by default, `--no-typecheck` to skip. Three decisions in that:

- **The consumer's compiler, not ours.** `typescript` is resolved from the
  *report's* directory, so a report is checked by the same compiler its author's
  editor uses. It is an optional peer, like the others; without it the render
  proceeds and the CLI says it was not checked.
- **The CLI, not the API.** Spawning keeps the compiler swappable and keeps the
  whole of `typescript` out of this process for a check that takes a second.
- **Extending the nearest tsconfig**, then narrowing to the one file. A report
  written inside somebody's project may import from it through a path alias, and
  checking with fixed flags alone would report those as missing modules — a false
  failure on a correct report, which is the fastest way to get a check switched
  off.

**The cost differs sharply by where the report lives, and the reason is worth
knowing.** In a consumer project the package resolves to `dist/index.d.ts`,
`skipLibCheck` skips it, and the whole invocation is **~850ms** —
`verify:report-cli` measures exactly that. In *this* repo, `tsconfig.json` maps
the package name onto `src/`, so the check follows the import into the entire
package source and the same render takes **~4.6s**. Repo-local reports are
already covered by `pnpm typecheck`, so use `--no-typecheck` when iterating on
one.

**On `tsgo`.** The TS 7 native compiler is a drop-in for `tsc` at the command
line — measured here at 480ms against tsc's 1130ms on identical diagnostics — and
spawning a CLI is what makes adopting it a one-line change. It is deliberately
**not** used: it is a development preview, and a report silently checked by a
preview compiler because a consumer happened to have one installed is a worse bug
than a slow check. `CHECKERS` in `src/typecheck.ts` is where it goes when
it ships. Note this is independent of the repo's own TS 7 blocker, which is
`tsup`'s dts worker; this check is a separate program that never touches it.

### The lint is not optional

**A report is checked against this system's own rules before it renders.** That
closes a real hole: `pnpm check:tokens` only ever scanned `src/components` and
`src/stories`, there is no ESLint config, and esbuild strips types without
reading them — so the file most likely to be written in a hurry was the one file
nothing looked at.

The rules live in `src/lib/tokenRules.ts` and `scripts/check-tokens.mjs` imports
the same module, so the two can never drift. What differs is the budget:

| | Ratchet (`check:tokens`) | Report (`ds-report`) |
|---|---|---|
| Scope | `src/components`, `src/stories` | the report's `.tsx` |
| Budget | the count when the ladder landed | **zero** |
| Why | pre-existing debt, migrated file by file | new code, no debt to grandfather |

A hex literal in a report renders identically on `midnight` and on `white`, which
is precisely the failure the ladder exists to prevent — so those four rules are
**errors** and they block.

Two further rules are **warnings**, because both are context-dependent and
neither is always a mistake:

- `nondeterministic` — `new Date()`, `Date.now()`, `Math.random()`. A report that
  differs on every run cannot be diffed to answer "did anything change". Note
  that `new Date('2026-08-19')` is fine: only the zero-argument form varies.
- `inert` — `onClick={…}`, `useState`, `useEffect`. The output has no client JS,
  so these render as dead controls. `useMemo` and `useId` are untouched; both do
  their work during the render that gets captured.

`--strict` promotes warnings to errors, which is what CI should use.
`--no-lint` skips it, for rendering a file you did not write.

The reason this exists is not convenience. A hand-written `<div style="…">` report
is a fresh design decision every time, and it inherits nothing: not the four rungs
of the ladder, not roles whose contrast `pnpm check:contrast` has audited, not a
layout the visual suite has pinned. A report built from these components inherits
all of it and costs the agent less code than the HTML would.

### The compendium: every component, as a golden artifact

`reports/compendium.tsx` is a repo-local report with one plate per component, packed several to an A4
sheet, each shown on the `sketch` and `midnight` rungs (page-scale templates on `sketch` only, or one
rung per sheet when a pair is too tall). The self-contained HTML is the golden artifact; the PDF is its human
rendering and is never byte-compared. Every cell carries `data-component`, `data-state` and
`data-rung`, so a text diff localises to one component.

- **Generated from the stories, not retyped.** `compendium.registry.tsx` names story exports and
  renders them (meta args, `render`, decorators); a deleted story throws. Hand-written states exist
  only where no story does (Table, the MDX-only `Path` and `Event`). The report imports the design
  system's `src/` (stories import `../components/*`), which is the allowed direction; the design
  system never imports the report.
- **Coverage is a test, `reports/compendium.test.ts`.** Every export is classified from the running
  module: `component`, `part` (parent derived from a story's `subcomponents`, the defining file, or a
  name prefix), `provider`, or `nonvisual`. A component needs a plate, an `EXEMPT` entry (typed, tiny)
  or a `BACKLOG` entry (a ratchet that only shrinks); a part must be exercised inside its parent's
  plate, proved by an instrumented render, so a new export fails until it is classified.
- **Source to printed is `reports/compendium.print.test.ts`** (needs Chromium): every expected cell is
  present once, visible, non-empty, unclipped, wholly on its own sheet, the sheet manifest matches the
  registry, and every plate fits its declared height. Then the PDF itself is read back with
  `pdfjs-dist` (`compendium.pdfcheck.ts`): each cell's words must be among the PDF text items inside
  that cell's rectangle on that page (positional, because the sketch and midnight twins share text), and
  the cell body, rasterised from the PDF, must not be one flat colour. `compendium.pdfcheck.test.ts`
  mutation-tests it (opacity 0, hidden or transparent content, an unfilled graphic, text moved off its
  cell). Known gaps: text clipped by an `overflow:hidden` ancestor is still in the PDF (the DOM
  `clipped` check sees it); transparent text next to other painted content is not flagged (a pending
  Button hides its label on purpose); icon-font glyphs are checked by pixels only.
- **Pagination is a function of the registry.** Each plate declares a `height` in mm
  (`compendium.layout.ts`); sheets are packed best-fit decreasing over whole plates (both rungs of a plate stay
  on one sheet; only a plate too tall for that splits), the index is one sheet, and the
  footer, the index and the print test read one page map. The print test fails a plate taller than its
  declared height or more than `SLACK_MM` shorter, so the declarations cannot lie.
- **Ids.** `useId` ids depend on tree position, so each plate is rendered as its own root with its
  component as `identifierPrefix`; otherwise adding a plate renumbers every later id.
- **State matrix.** `compendium.states.tsx` holds a typed list of forced props per control (Button,
  Badge, Checkbox, Switch, Input, Select, RadioGroup), typed `Partial<ComponentProps>` so a prop the
  component lacks is a compile error; a test proves each forced state changes the markup, so none is
  invented. Cells are `data-state="forced-<id>"`. `:hover`, `:focus`, `:active` cannot be forced in a
  static document and are not faked.
- **Backlog, with reasons.** `compendium.backlog.ts` is a record of typed reasons and a pinned ceiling.
  What remains: six overlays (below) and five components taller than a sheet even for one rung.
- **Overlays (Modal, Drawer, AlertDialog, Popover, Menu, Tooltip, Toast).** All take `open`,
  `defaultOpen` or `isOpen`, and none shows its popup in a static render: every one portals through
  Base UI, whose Portal mounts on the client only, so `renderToStaticMarkup` emits the trigger
  (`aria-expanded="false"` even with `defaultOpen`) and nothing else. Options for the owner: render the
  open state client-side (jsdom or the browser) and serialise it into the plate, or add a portal-less
  static mode to the design system. Neither was done here.
- **Slots.** The design system's `data-slot` contract (`packages/design-system/docs/styling.md`) is the
  marker convention; `compendium.slots.ts` maps components to slots from the design system's own
  contract and inventory (`api/slots.txt`), and the coverage test checks that each plate shows the
  slot of the component, and of each part, it claims. The classification of exports now lives in the
  design system (`src/slots/exports.ts`) and is reused here.
- **What a plate neutralises.** Viewport units (`min-h-screen` etc.) and `print:hidden` inside a cell,
  because a plate shows the screen rendering at content height, printed at 0.65 scale (`PLATE_ZOOM`; 0.6 is about two sheets fewer, at 4pt captions). A `side` plate puts its
  rungs next to each other, a `stack` plate one above the other (use it for anything wider than half a sheet, such as
  the `Divider` rule); `COLUMNS` in `compendium.tsx` packs small controls four cells to a row; `FIT` trims a page
  template's own page padding. Declared heights are mechanical: after any change that moves a plate's height, set each
  `height` to its measured mm rounded up plus one, then re-run the print test.

### Checking the thing consumers actually get

Everything else that tests the generator runs from `src/` inside this repo, where
every dependency is installed and every path resolves — which is precisely why it
cannot see what a consumer sees.

`pnpm verify:report-cli` packs the tarball, installs it into a throwaway project
with **only the peers the README names**, and drives `ds-report` there. It is the
only check that can catch a broken `bin` path, a file missing from `files`, an
entry absent from `exports`, or a peer documented as optional that is not.

Its first run found two real bugs, both invisible from inside the repo: the
static imports above, and the typography plugin. Add a check here whenever the
published surface grows.

### Deterministic, and quick

**The same report renders to the same bytes.** `src/render.test.ts` asserts it
directly. Three things make it true: candidates are sorted, nothing in the shell
is stamped at render time, and the lint blocks the values that would otherwise
vary. That is what makes a generated report diffable — the useful question about
a report is rarely "what does it say" but "what changed since the last one".

**Rendering more costs almost nothing more.** Both expensive steps are paid once
per invocation:

| | Cost | Paid |
|---|---|---|
| Tailwind `compile()` | ~150ms | once per invocation, not per document |
| Tailwind `build(candidates)` | ~13ms first, ~0 after | per report |
| esbuild bundle + render | ~230ms | once per **input**, not per level |
| Lint | 0.11ms | per input, before any bundling |
| Typecheck | ~850ms in a consumer, ~4.6s in this repo | once per invocation, all inputs in one compiler run |

The level lives on `<html>`, so the markup — and therefore the candidate set and
the whole stylesheet — is identical on all four rungs. Measured: the entire
ladder from one file takes **603ms**, against **2402ms** for four separate
invocations. Use one invocation with several inputs or several levels; do not
loop the CLI.

The lint runs before any bundling for the same reason: a batch containing a bad
file should fail in milliseconds, not after rendering its siblings.

### One pass, and why that is possible

```
TSX ──esbuild──▶ markup ──class attributes──▶ candidates ──tailwind──▶ CSS ──▶ one .html
```

Tailwind normally has to *guess* which utilities a build needs, by scanning source
text before anything renders. That is why the generated `theme.css` carries
`@source "./"`, and why `text-${role}` assembled at runtime generates no CSS at
all — the constraint that `src/lib/accentClasses.ts` exists to work around.

**Rendering first removes the guess.** By the time the generator asks, the document
is finished markup, so the class attributes in it are exactly and only the
utilities it uses. `src/candidates.ts` reads them out; `src/css.ts`
hands that list to Tailwind's own compiler and ignores the `sources` it offers
back. The emitted CSS is therefore minimal *and* complete by construction — no
safelist, no scanner, and no arbitrary-value edge case. A `text-[0.8125rem]` a
scanner might miss is plainly there in the output.

`src/render.test.ts` asserts the negative half of that, which is the half
that matters: CSS for a utility the document does not use must be **absent**. A
test that only checked the used utilities were present would pass just as happily
against a generator that emitted all of Tailwind.

### What the pipeline will and will not do

| | |
|---|---|
| Theme | `--theme <rung>`, default `white` — reports get read in bright rooms and printed. Every rung's tokens ship regardless, so a nested `<ThemeProvider scoped>` panel still resolves. |
| Fonts | The webfont `@import` survives, hoisted to the top of the inlined CSS. `--offline` strips it; the `--ds-font-*` tokens all declare fallback stacks, so the type degrades to system sans and mono rather than vanishing. |
| Interactivity | **None**, with one exception. There is no client JS, so an `onClick`, a `useState` or a `Modal` renders inert — the `inert` lint rule warns about exactly this. The exception is `<details>`, which the browser implements itself: use `ReportDetails`. |
| Async | `renderToStaticMarkup` is synchronous. Do the fetching before the render and pass the data in as props. |
| Resolution | Imports resolve from the report file's own directory, so a report can import the author's modules — but it has to sit inside a project where `react` resolves. |
| Version skew | `@rtkelly-labs/design-system` is aliased to the copy of the package that owns the renderer, so the markup and the CSS can never come from two versions. |
| PDF | `--pdf` prints the finished HTML through headless Chromium with print media emulated — it is not a second renderer, so the `@page` rule in `styles.css` owns the margin (`preferCSSPageSize`) and every `print:` utility applies. Chromium comes from the report's own project as an optional `playwright` peer; a missing one is an install instruction. `--pdf` also compares the page count Chromium produced with the pages the document's own `break-after: page` rules declare, measured at paper width: a sheet that outgrows the paper warns, and fails under `--strict`. Webfonts are inlined into the HTML as latin-subset data URIs, so the one file carries its own type. The HTML stays byte-deterministic; the PDF carries a `CreationDate`, so byte equality is never asserted on it. |

### Where it lives, and the optional peers

This is a **separate package** for that reason: it needs `esbuild`, Tailwind's
compiler and a TypeScript compiler to do its job, and none of that belongs in the
dependency graph of an app that installs the design system for its components.

Both are **optional peer dependencies**, the same shape `@tailwindcss/typography`
already has — `playwright`, needed only by `--pdf`, is the third. The trade is only
defensible because the CLI turns a missing one into an install instruction rather
than a stack trace — see `explain()` in `src/cli.ts` and `resolvePlaywright()` in
`src/pdf.ts`, and keep that true.

`ReportDocument`, `ReportSection` and `ReportDetails` ship from
**`@rtkelly-labs/design-system`**, not from here: they are ordinary components with
no Node imports, they have a story and a visual baseline there, and a report
imports them by name like anything else. The dependency runs one way — this
package depends on the design system, never the reverse.

---
