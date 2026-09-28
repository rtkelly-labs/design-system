# AGENTS.md — @rtkelly13/design-system-report

Renders a `.tsx` file to one self-contained HTML report, styled by
`@rtkelly13/design-system`. Published to public npm.

**The bin is `ds-report`, not the package name.** That asymmetry is deliberate: a
package name is read, in a manifest and on npm, where
`@rtkelly13/design-system-report` says exactly what it is and what it belongs to.
A bin name is typed, every time, and `npx ds-report audit.tsx` is the thing
somebody actually runs. `typescript` shipping `tsc` is the same trade.

Package manager is **pnpm** (`node >=22`). This is one package in a workspace —
see the [root AGENTS.md](../../AGENTS.md) for how the two fit together, and
[`packages/design-system/AGENTS.md`](../design-system/AGENTS.md) for the rules
every report is held to.

---

## 🛑 The one-way dependency

`@rtkelly13/design-system-report` depends on `@rtkelly13/design-system`. The design system
must never depend on this package, and nothing there may import from here —
that includes stories and tests. When a change seems to need it, the thing being
reached for belongs on the design system's side of the line.

`@rtkelly13/design-system` is a **peer**, resolved from the *report's* own
directory rather than from this package. An author renders against the version
they installed, the one their editor typechecks against; a fix here is not a
release of the components.

---

## 📜 Commands

- `pnpm report <file.tsx>`: Renders a report straight from `src/`, no build first.
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
| Version skew | `@rtkelly13/design-system` is aliased to the copy of the package that owns the renderer, so the markup and the CSS can never come from two versions. |

### Where it lives, and the two optional peers

This is a **separate package** for that reason: it needs `esbuild`, Tailwind's
compiler and a TypeScript compiler to do its job, and none of that belongs in the
dependency graph of an app that installs the design system for its components.

Both are **optional peer dependencies**, the same shape `@tailwindcss/typography`
already has. The trade is only defensible because the CLI turns a missing one into
an install instruction rather than a stack trace — see `explain()` in
`src/cli.ts`, and keep that true.

`ReportDocument`, `ReportSection` and `ReportDetails` ship from
**`@rtkelly13/design-system`**, not from here: they are ordinary components with
no Node imports, they have a story and a visual baseline there, and a report
imports them by name like anything else. The dependency runs one way — this
package depends on the design system, never the reverse.

---
