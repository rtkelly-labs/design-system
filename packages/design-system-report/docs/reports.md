# Reports

Why an HTML report in this system is a `.tsx` file rather than markup, what
makes a generated report worth reading, and the parts of the pipeline that will
bite you.

[`AGENTS.md`](../AGENTS.md) § *Reports Are TSX, Not Hand-Written HTML* is the
short version and remains the rule. This is the reference behind it: the
reasoning, the sources, the measurements, and what is not yet good enough.

---

## The problem this replaces

An agent asked for an HTML report writes markup. That markup inherits nothing:
not the four rungs of the ladder, not roles whose contrast `pnpm check:contrast`
has audited, not a layout the visual suite pins, not the type scale. It is a
fresh design decision every time, made by whatever was in context, and the second
report looks nothing like the first.

`ds-report` takes the `.tsx` and emits one self-contained `.html` — markup and
every byte of CSS it needs, inlined. The report author writes components; the
system supplies the appearance. That it also takes **less** code than the HTML
would is the part that makes it stick.

---

## What makes a generated report worth reading

Seven patterns. None of them needs JavaScript, which matters because this
pipeline emits none.

### 1. The verdict comes first

A reader learns the outcome before the evidence. `sample.tsx` opens with a
`<Verdict>` band — one word, one line of context — above the contents, the stats
and everything else.

This is the "understand high-level results, then drill down into specific areas
of interest" shape that report tooling converges on
([McGarrah][mcgarrah], [Artic6][artic6]).

### 2. Numbers before prose

A stat row is scannable in about two seconds; a paragraph saying the same thing
is not. `StatCard` for the counts, then the narrative.

### 3. Provenance is part of the report

When it ran, from what commit, on what branch, under what configuration. That is
what the `meta` strip on `ReportDocument` is for, and it is not decoration: a
report that cannot be traced back to its inputs cannot be reproduced or trusted.
A report header carrying the title, the generation date and a pointer to the
configuration used is the near-universal convention ([Artic6][artic6]).

### 4. Progressive disclosure, not omission

Detail belongs **in** the document, folded away — not cut, and not in the way.
Show what is essential first and reveal the rest on demand
([NN/g][nng], [UXPin][uxpin]).

`ReportDetails` is a `<details>` element, which the browser implements itself.
That makes it the one interactive affordance a static report genuinely has: a
200-row table, a stack trace or a full diff collapses with no script at all.

Keep it to one level. Nested disclosure past two levels is where these designs
start causing problems ([LogRocket][logrocket]).

### 5. Severity never rides on colour alone

Every badge carries a word; the disclosure marker is `[+]`/`[-]` **text** rather
than an icon. Similar shades are hard to tell apart under colour blindness, on a
poor screen, and in greyscale printing — which is exactly where a report ends up
([Eval Academy][evalacademy]).

This is also why `pnpm check:contrast` gating every role pair matters more for
reports than for an app: nobody is going to notice a report is unreadable until
they have already sent it to someone.

### 6. Sections are addressable

`ReportSection` derives an `id` from its title, so the contents strip links
resolve and a reader can paste a URL instead of writing "the third section
down". A generated report is very often the thing someone drops into a ticket.

### 7. The zero case is designed

"No advisories. 24 packages audited." is a result. An empty region is a bug
someone will spend ten minutes investigating. `DataTable`'s `emptyText` exists
for this; the sample exercises it.

---

## Sources

Consulted while designing the report vocabulary. Where a claim above rests on
one, it is cited inline.

- [AI-Generated HTML Reports on GitHub Pages — McGarrah Technical Blog][mcgarrah] —
  the case for a single file as a deliverable: no toolchain, no build step, no
  framework boilerplate, and it renders anywhere.
- [Building a Self-Contained HTML Report — Artic6][artic6] — self-containment as
  a hard requirement (no external requests for structure or styling), and the
  report-header/provenance convention.
- [Progressive Disclosure — Nielsen Norman Group][nng] — the canonical statement
  of showing essentials first and deferring the rest.
- [What Is Progressive Disclosure in UX? — UXPin][uxpin] — prioritisation and
  consistency when applying it.
- [Progressive disclosure in UX design — LogRocket][logrocket] — the practical
  limit: past two levels of disclosure these designs typically have problems.
- [Accessible Reports: 10 Best Practices — Eval Academy][evalacademy] — contrast,
  plain language, and why colour alone cannot carry meaning in a document that
  gets printed.
- [pytest-html user guide][pytesthtml] — a widely used generator in this shape,
  as a reference point for what shipped reports actually contain.

The observations about Lighthouse, coverage output and CI report tooling
converging on these patterns are our own reading of those artefacts, not claims
from the sources above.

[mcgarrah]: https://mcgarrah.org/ai-generated-html-reports-jekyll-github-pages/
[artic6]: https://www.a6n.co.uk/2026/07/building-self-contained-html-report-for.html
[nng]: https://www.nngroup.com/articles/progressive-disclosure/
[uxpin]: https://www.uxpin.com/studio/blog/what-is-progressive-disclosure/
[logrocket]: https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/
[evalacademy]: https://www.evalacademy.com/articles/10-tips-for-making-your-evaluation-report-more-accessible
[pytesthtml]: https://pytest-html.readthedocs.io/en/latest/user_guide.html

---

## The pipeline

```
TSX ──esbuild──▶ markup ──class attributes──▶ candidates ──tailwind──▶ CSS ──▶ one .html
```

### Why one pass is possible

Tailwind normally has to **guess** which utilities a build will need, by scanning
source text before anything renders. That guess is why the generated `theme.css`
carries `@source "./"`, and why `text-${role}` assembled at runtime generates no
CSS at all — the constraint `src/lib/accentClasses.ts` exists to work around.

Rendering first removes the guess. By the time the generator asks, the document
is finished markup, so the class attributes in it are exactly and only the
utilities it uses. `candidates.ts` reads them out, `css.ts` hands that list to
Tailwind's own compiler, and the `sources` the compiler offers back are ignored.

The emitted CSS is therefore minimal **and** complete by construction — no
safelist, no scanner, no arbitrary-value edge case. A `text-[0.8125rem]` a
scanner might miss is plainly there in the output.

`render.test.ts` asserts the negative half, which is the half that matters: CSS
for a utility the document does not use must be **absent**. A test that only
checked the used utilities were present would pass just as happily against a
generator that emitted the whole framework.

### Determinism

The same report renders to the same bytes, and the test asserts it rather than
assuming it. Three things make it true:

1. Candidates are sorted before they reach the compiler.
2. The document shell stamps nothing at render time.
3. The lint blocks the values that would otherwise vary — see `nondeterministic`
   below.

This is what makes a generated report diffable, and the useful question about a
report is rarely "what does it say" but "what changed since the last one".

### Speed

Both expensive steps are paid once per invocation, not once per document:

| | Cost | Paid |
|---|---|---|
| Tailwind `compile()` | ~150ms | once per invocation |
| Tailwind `build(candidates)` | ~13ms first, ~0 after | per report |
| esbuild bundle + render | ~230ms | once per **input**, not per level |
| Lint | 0.11ms | per input, before any bundling |

The level lives on `<html>`, so the markup — and therefore the candidate set and
the entire stylesheet — is identical on all four rungs.

Measured on `sample.tsx`: the whole ladder from one file takes **603ms**, against
**2402ms** for four separate invocations. Pass several inputs or several levels
to one invocation; never loop the CLI.

The lint runs before any bundling for the same reason: a batch containing a bad
file should fail in milliseconds rather than after rendering its siblings.

---

## The typecheck

esbuild strips types without reading them. Until this existed, a report could
pass the lint, bundle cleanly, and still be wrong — `value={{ nope: true }}` on a
`StatCard` is not a lint problem and not a runtime crash, it is a report with
`[object Object]` in it, discovered by whoever reads the report. This was listed
here as a known gap; it is now closed.

`ds-report` spawns a compiler over the report before rendering, on by default,
`--no-typecheck` to skip.

### Three decisions

**The consumer's compiler, not ours.** `typescript` resolves from the *report's*
directory rather than this package's, so a report is checked by the same compiler
its author's editor and CI use. It is an optional peer like the rest; without it
the render proceeds and the CLI notes that nothing checked it.

**The CLI, not the API.** The API would pull the whole of `typescript` into this
process for a check that takes a second either way, and would bind this code to
one compiler's internals. Spawning keeps the compiler swappable — which matters,
because the compiler here is expected to change.

**Extend the nearest tsconfig, then narrow to the one file.** A report written
inside somebody's project may import from it through a path alias; checking with
fixed flags alone would report those as missing modules. That is a false failure
on a correct report, and a check that cries wolf is a check somebody turns off.
`include: []` alongside `files` is what stops the extended config's own `include`
widening the check to that project's whole source tree.

### The cost depends on where the report lives

| | Resolves this package to | Whole invocation |
|---|---|---|
| A consumer project | `dist/index.d.ts`, which `skipLibCheck` skips | **~850ms** |
| This repo | `src/index.ts`, via the `paths` mapping | **~4.6s** |

The difference is not the checker — it is that in this repo the check follows the
import into the entire package source rather than stopping at a declaration file.
`scripts/verify-report-cli.mjs` measures the consumer number, which is the one
that matters, and asserts a ceiling on it.

Repo-local reports are already covered by `pnpm typecheck`, so `--no-typecheck`
is the right flag when iterating on one. `render.test.ts` passes it for the same
reason: those tests are about rendering, and paying the check on every render
took the unit suite from 28s to 76s while measuring `tsc` over and over.

### On tsgo

The TS 7 native compiler is a drop-in for `tsc` at the command line. Measured
here on `sample.tsx`: **480ms against tsc's 1130ms**, identical diagnostics.
Spawning a CLI rather than calling an API is what makes adopting it a one-line
change — `CHECKERS` in `src/typecheck.ts` is the whole surface.

It is deliberately not used yet. It is a development preview, and a report
silently checked by a preview compiler — because a consumer happened to have one
installed for their own experiments — would be a worse bug than a slow check.

This is independent of the repo's own TS 7 blocker, which is `tsup`'s dts worker
(see `AGENTS.md` § *The TypeScript 7 blocker*). This check is a separate program
and never touches it, so the report checker can move to TS 7 before the build
can.

---

## The lint

A report written outside this repo was the one file nothing checked.
`pnpm check:tokens` only ever scanned `src/components` and `src/stories`, there
is no ESLint config, and esbuild strips types without reading them.

The rules live in `src/lib/tokenRules.ts`; `scripts/check-tokens.mjs` imports the
same module, so the two enforcers cannot drift. What differs is the budget:

| | Ratchet (`check:tokens`) | Report (`ds-report`) |
|---|---|---|
| Scope | `src/components`, `src/stories` | the report's `.tsx` |
| Budget | the count when the ladder landed | **zero** |
| Why | pre-existing debt, migrated file by file | new code, no debt to grandfather |

A hex literal in a report renders identically on `midnight` and on `white`, which
is precisely the failure the ladder exists to prevent. Those four rules are
**errors** and they block.

Two further rules **warn**, because neither is always a mistake:

| Rule | Catches | Why it is a warning |
|---|---|---|
| `nondeterministic` | `new Date()`, `Date.now()`, `Math.random()` | A timestamp is a reasonable thing to want. `new Date('2026-08-19')` is deliberately fine — only the zero-argument form varies. |
| `inert` | `onClick={…}`, `useState`, `useEffect` | Some components are worth rendering without their behaviour. `useMemo` and `useId` are untouched: both do their work during the render that gets captured. |

`--strict` promotes warnings to errors, which is what CI should use.
`--no-lint` skips the lint entirely, for rendering a file you did not write.

### A note on writing regex rules against trimmed lines

Rules match the **trimmed** line, so that the reported text is what gets printed
under the finding. Two false negatives came from forgetting that, and both were
found by running the `inert` rule over this package's own components and
checking the answer against the source instead of believing it:

- `\son[A-Z]` never matched `onClick={`, because after trimming the handler is at
  index 0 with no whitespace in front of it — which is where handlers usually
  are. It anchors on `\b` now.
- `useState\(` never matched `useState<Record<string, boolean>>({})`, because a
  hook called with an explicit type argument has no `(` after its name.

Both have regression tests. The lesson generalises: a rule that reports nothing
is indistinguishable from a rule that is broken, so point a new one at code you
already know the answer for.

---

## What renders, and what renders inert

The output has no client JS. A component whose behaviour lives in a handler or a
state hook still renders — it simply does nothing when clicked. That is fine for
some and useless for others, and the difference is worth knowing before a report
ships with a dead control in it.

Generated by running the `inert` rule over `src/components`: of 38 components,
**24 are static-safe and 14 contain behaviour that will not run.**

| Component | In a static report |
|---|---|
| `Modal` | **Avoid.** A dialog with no way to close it. |
| `SlideDeck` | **Avoid.** Renders one slide, no navigation. |
| `DesignSandbox` | **Avoid.** The whole point is the interaction. |
| `DocsSidebar` | Renders its default expanded state; toggles are dead. |
| `DocsHeader` | Renders; the search does nothing. |
| `Pagination` | Renders the page numbers; they do not navigate. |
| `CodeBlock` | **Fine.** The code renders; only the copy button is dead. |
| `AnchorHeading` | **Fine.** Heading and `id` render; only copy-link is dead. |
| `TableOfContents` | **Fine.** The anchor links work; only scroll-spy is dead. |
| `Tag` | **Fine** with `href`; the `onClick` form is dead. |
| `ThemeProvider` | Unnecessary at the root — the generator sets `data-theme` on `<html>`. See below for the scoped case. |

The other 24 are static-safe: `AsciiDivider`, `Avatar`, `Badge`, `BracketText`,
`Button`, `Card`, `DataTable`, `Divider`, `Input`, `NoteBlock`, `PageHeader`,
`PageTitle`, `SectionContainer`, `StatCard`, `TLDR`, `BlogPost`,
`LoremIpsumPost`, `Breadcrumbs`, `DocPager`, `DocsLinkProvider`, `Prose`,
`mdxComponents`, `SaasLandingPage`, `Slide`.

`Button` is on that list because its only `onClick` is in a JSDoc example — it
renders an anchor when given an `href`, which is the form a report wants anyway.
Regenerate the split with the rule itself rather than by reading the components,
and check a couple of answers against the source; that is how the two false
negatives above were found.

### A scoped theme panel does work

Every rung's tokens ship in the stylesheet regardless of which one the document
declares, so `<ThemeProvider scoped>` emits its `data-theme` attribute into the
markup and a `dim` panel inside a `white` report resolves correctly. There is a
test, because it would break silently.

The test is worth reading as a cautionary one. Its first version passed while
proving nothing: the fixture set a `level` prop that does not exist — the real
name is `defaultLevel` — so React dropped it and the panel rendered
`DEFAULT_LEVEL`, which was the very value being asserted. It now scopes to a
level that is neither the document's nor the provider's default, and reads the
body rather than the whole file, since the stylesheet names all four rungs in its
own variant selectors. `pnpm typecheck` catches the prop name; nothing but the
choice of assertion catches the other two.

---

## The three kinds of report in this repo

| | `src/template.tsx` | `src/sample.tsx` | `reports/contrast.tsx` |
|---|---|---|---|
| Job | what you **copy** | what you **read** | what the repo **uses** |
| Size | small on purpose | every supported path | one real job |
| Data | placeholder | fixed, by design | **computed at render** |
| Ships | `dist/templates/` | `dist/templates/` | nowhere — repo-local |
| Also | — | the regression: `render.test.ts` asserts it, `components-reports-reportdocument--sample` screenshots it | `pnpm contrast:report:html` |

`reports/contrast.tsx` is the one that answers "does this actually work". It calls
`auditContrast(LEVELS)` during the render, so it *is* the audit rather than a
picture of one — nothing is passed in and nothing can go stale. It also shows
what the `nondeterministic` lint rule is really drawing a line around: this report
is full of real data and still renders identically every time, because the data
comes from `levels.ts` rather than from a clock.

`pnpm check:contrast` answers yes or no; `pnpm contrast:report` prints 200 rows to
a terminal. Neither answers *which pair is closest to failing on which rung*,
which is the question anyone touching a level colour actually has. That is what
the report is for.

Both ship to `dist/templates/` so they are readable from an install. Adding a
component to the report vocabulary means adding it to `sample.tsx`, which is what
keeps the screenshot and the test honest.

---

## Checking what consumers actually get

Everything else that tests the generator runs from `src/` inside this repo, where
every dependency is already installed and every path resolves. That is exactly
why it cannot see what a consumer sees: a tarball, an `exports` map, a `bin`, and
peers they have to install themselves.

`pnpm verify:report-cli` packs the package, installs it into a throwaway project
with **only the peers the README names**, and drives `ds-report` there. Twelve
checks, and its first run found two real bugs that no in-repo test could have:

**1. The optional-peer promise was false.** `esbuild` was a static import, so its
absence failed at module load — before any code in this package ran, and
therefore before `explain()` could turn it into an install instruction. The
promise was written into the code, `AGENTS.md`, the README and this file, and it
did not work. Both optional peers are now `await import(…)` inside the function
that needs them.

**2. An optional peer was effectively required.** `prose.css` loads
`@tailwindcss/typography` via `@plugin`, `styles.css` imports `prose.css`, and
this pipeline compiles `styles.css` — so a clean install without the plugin
crashed the entire render. It is declared optional because "theme.css-only
consumers never load prose.css", which is true of consumers and false of
`ds-report`.

The fix is degradation rather than a new required dependency, because the plugin
genuinely is optional here: it styles the bare tags a Markdown pipeline emits, so
a report that never renders `<Prose>` — most of them — needs nothing from it.
`css.ts` drops the `@plugin` line when the package cannot be resolved and returns
a note, which the CLI prints. Silence would have been the wrong answer: a report
whose Markdown is mysteriously unstyled is worse than one that says why.

Both bugs share a shape worth remembering: **a promise about what happens when
something is missing cannot be tested in an environment where nothing is
missing.**

---

## Where it lives

This is a separate **package** rather than an entry point in the design system.
It needs `esbuild`, Tailwind's compiler and a TypeScript compiler; none of that
belongs in the dependency graph of an app that installs the design system for its
components, and before the split all three sat in that package's peer list while
its `exports` map and `bin` advertised a report generator to every consumer of a
component library.

`@rtkelly13/design-system` is a **peer**, resolved from the *report's* own
directory. A report renders against the copy its project installed — the one its
author's editor typechecks against — rather than a copy bundled with the tool,
and the two version on their own clocks.

Both are **optional peer dependencies**, the same shape `@tailwindcss/typography`
already has. That trade is only defensible because the CLI turns a missing one
into an install instruction rather than a stack trace — see `explain()` in
`src/cli.ts`, and keep that true.

`ReportDocument`, `ReportSection` and `ReportDetails` ship from
`@rtkelly13/design-system`: ordinary components with no Node imports, with a
story and a visual baseline there. The dependency runs one way, so that package
may never import from this one — which is why its story composes the frame itself
rather than importing the sample below.

---

## Not yet good enough

- **`compile()` is not documented API.** It is Tailwind's main export and what
  `@tailwindcss/vite` is built on, but a v4 minor could move it. `css.ts` is the
  only file that would need to change, which is the mitigation rather than a fix.
- **`TLDR` and friends still emit inline styles against `--brutalist-*`.** They
  resolve through the deprecated compat block in `theme.css`, so reports render
  correctly today and get better for free as that migration lands.
- **The unit suite went from 12s to 26s.** That is what a dozen real renders
  cost. If it becomes a problem, the sample renders are the ones to share.
- **Typechecking a repo-local report costs 4.6s against a consumer's 850ms**,
  because this repo's `paths` mapping sends the check into the package source.
  `--no-typecheck` is the workaround rather than the fix.
