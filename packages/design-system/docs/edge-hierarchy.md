# Edge hierarchy

**Siblings:** [`visual-regression.md`](./visual-regression.md) (pixels) ·
[`storybook-benchmarks.md`](./storybook-benchmarks.md) (the other benchmark against public systems)

The brand's emphasis device is the box: a 2px `border.strong` edge, often with a hard offset
shadow. It reads as emphasis only while it is rare. Draw it on everything and a page becomes a
stack of equally loud rectangles, which is what the first cut of the review family did — twenty
strong boxes down one report.

That is a judgement a reader makes by eye, but most of it is countable. This file is the
counting: what is measured, what three shipped design systems measure at, what this package
measures at, and the gate that holds the line.

## What is measured

`tests/edges.ts` (`measureEdges`) runs in the browser over a rendered surface and reads computed
style, so it sees what a reader sees whatever wrote the class.

| Term | Means |
|---|---|
| side | a border edge that is drawn, opaque, and at least 1.15:1 against the ground behind it |
| frame | an element with three or four visible sides — a box. Table cells are not counted as frames, but their edges count toward ink and the heavy share |
| heavy panel | a frame of at least 15,000 px² whose sides are all ≥2px and ≥3:1 (WCAG's non-text floor), or any frame that size with a hard offset shadow. A card, not a tag — and not a control: buttons and fields are frames but never heavy panels, because their edge is the affordance and every benchmark system draws them as heavily |
| depth | how many frames enclose a frame: 0 on the page, 1 for a box in a box |
| heavy edge share | of all visible border length, the share drawn ≥2px and ≥3:1 |
| ink | border pixel area per thousand pixels of surface |

"Per screen" divides by the surface height in 900px screens, so a long page is not punished for
being long.

## The benchmark

`node scripts/benchmark-edges.mjs` renders two pages from each of three systems, from their own
published packages into the gitignored `temp/edge-benchmark/`, and runs the same function over
them at the gate's 1280px viewport. The pages are shaped like this package's: a review or
"check your answers" page, and an operations page with a table, tags and notices.

- **GOV.UK Frontend 6.6.0**, through its own Nunjucks macros.
- **Carbon** (`@carbon/react` 1.119.0, `@carbon/styles` 1.118.0), server-rendered.
- **Primer CSS 21.5.1** with `@primer/primitives` 10.7.0's light theme. 21.5.1 is the last
  release that ships `Box`, `Box-row` and `TimelineItem` as CSS; Primer has no template layer,
  so its two pages are written from those documented class patterns — the one benchmark here
  whose markup is ours rather than the system's.

| System | Page | Heavy panels | Depth | Frames / screen | Heavy panels / screen | Heavy edge share | Ink ‰ |
|---|---|---:|---:|---:|---:|---:|---:|
| GOV.UK Frontend | check answers | 0 | 0 | 1.4 | 0 | 0.117 | 14 |
| GOV.UK Frontend | checks and tasks | 1 | 0 | 1.5 | 0.7 | 0.291 | 21 |
| Primer CSS | pull request | 0 | 1 | 10.8 | 0 | 0 | 18.9 |
| Primer CSS | checks | 0 | 1 | 10 | 0 | 0 | 21.5 |
| Carbon | review | 0 | 0 | 0 | 0 | 0.005 | 12.7 |
| Carbon | checks | 0 | 0 | 0 | 0 | 0 | 8.1 |

Three different answers to the same problem, and one shared rule under them:

- **Carbon draws almost no edges.** Tiles are fills on a layered ground; tables and structured
  lists are hairline rows. Zero frames.
- **Primer draws many boxes, all light.** Ten frames a screen — every comment and file list is a
  `Box` — but every one is a 1px `borderColor.default` hairline, so the heavy share is zero. It
  nests one level (a comment box in a timeline item).
- **GOV.UK draws few, and keeps weight for meaning.** Summary cards are 1px grey frames; the only
  heavy object is the notification banner, the one thing the page wants read first.

None of them puts more than one heavy object on a screen, and none nests deeper than one.

## Where this package sits

All 180 asserted stories, measured on `midnight`:

| | Median | 90th percentile | Max |
|---|---:|---:|---:|
| Heavy panels | 1 | 2.1 | 11 |
| Heavy panels / screen | 1 | 2.1 | 6 |
| Depth | 0 | 1 | 2 |
| Frames / screen | 2 | 9 | 26 |
| Heavy edge share | 1.0 | 1.0 | 1.0 |

The heavy edge share is the number that separates this system from the benchmark: in more than
half the stories *every* visible edge is 2px and strong, where the benchmark systems' share runs
from 0 to 0.29. That is the brand, and it is deliberate — a single component is one box, and one
heavy box is fine. It stops being fine where components are composed into pages and each brings
its own.

### The review pages, before and after

The same function, run on the review pages as they were before and after the edges were
stepped down (commits `cf23c92` and `1a7796e`):

| Story | Heavy panels | / screen | Heavy edge share |
|---|---:|---:|---:|
| `SaaS/ReviewReport`, before | 14 | 4.8 | 0.672 |
| `SaaS/ReviewReport`, after | 1 | 0.3 | 0.222 |
| `SaaS/PullRequest`, before | 12 | 4.4 | 0.713 |
| `SaaS/PullRequest`, after | 1 | 0.4 | 0.113 |

The change a reader saw as "the borders are less aggressive" is a fall from four or five heavy
objects a screen to under one, and a heavy share that now sits beside GOV.UK's. The measure
agrees with the eye, which is what makes it worth gating.

## Other elements

Ranked by heavy panels a screen, the compositions furthest from the benchmark:

| Story | Heavy panels | / screen | Depth | Why |
|---|---:|---:|---:|---|
| `Components/Marketing/PricingGrid` | 6 | 6.0 | 1 | three tiers, each a strong box; the story does not use `weight` |
| `Docs/Figures/DrawingSheet` | 5–6 | 5.0–5.4 | **2** | the only story nested two deep: a sheet, a frame, a box |
| `ReportDocument` — quality gate | 7 | 5.2 | 1 | four stat cards, each shadowed, over a grid table |
| `Showcase/ExperimentsView` | 6 | 5.0 | 1 | a catalogue of boxed experiments |
| `SaaS/LandingPage` — product launch, project site | 9–11 | 4.3–4.8 | 1 | marketing fixtures composed directly, not through `SaasLandingPage` |
| `AdminDashboard` — finance console | 4 | 4.0 | 1 | a row of stat cards over a grid table |
| `SaasLandingPage` | 8 | 3.8 | 1 | a boxed headline, a shadowed terminal, every feature and every plan a strong box |
| `Docs/Layout/Portal` | 10 | 3.5 | 1 | cards for every section of the portal |
| `Components/Content/NoteBlock` — all types | 4 | 4.0 | 0 | four notes stacked, each a strong box |
| `Docs/Figures/IndexedSection` | 4 | 4.0 | 1 | sections as strong boxes with a strong header rule |

And the primitives that are heavy by default, which is where those pages get their weight:
`Card`, `StatCard`, `NoteBlock`, `IndexedSection`, `PricingTier`, `Feature`, `Hero`,
`CTASection`, `TLDR`, a grid `DataTable`, `CodeBlock`, `Terminal`, and `FigureFrame` (its dashed
edge is 2px strong, so it counts). 102 of the 180 stories carry at least one heavy panel; 78 carry
none.

`VerdictBand/AllOutcomes` and `Foundations/ThemeLadder` also rank high, and are not problems:
one stacks six bands and the other draws every swatch on purpose. Their numbers describe the demo,
not a page.

### What would bring the pages in line

The same moves the review family made, applied where components compose:

1. **One shadow a screen.** A row of `StatCard`s reads as one strip of figures, not four objects
   — the review report draws its figures as a ruled strip with dashed separators. A `flat` or
   in-row form of `StatCard` would let `ReportDocument` and `AdminDashboard` do the same.
2. **Tables in pages are `quiet` or `index`.** `Table` already has both; the grid appearance is
   the heaviest table there is and suits a standalone data view, not a report section.
3. **A panel inside a panel steps down.** `Card` inside an `AppShell` main, a field inside a form
   panel: the inner box takes `border.default` at 1px, as the review family's diff frames do.
4. **Marketing keeps one hero object.** The landing page's highlighted plan or the hero, not both
   and every feature besides.

## The gate

`pnpm test:edges` (`tests/edges.spec.ts`) measures every asserted story on `midnight` and holds
two numbers as a ratchet against `tests/edges.baseline.json`: heavy panels, and depth. A story may
not rise above its record. A story with no record — a new one — is held to the benchmark's shape
with a little room for the brand: **at most two heavy panels, and no box deeper than a box in a
box.**

It runs in CI's `visual` job beside `test:a11y`, on the same Storybook build and browser.

To change a recorded number on purpose, in the PR that changes the story:

```bash
EDGES_CENSUS=1 pnpm test:edges     # measure every asserted story into temp/edges/
node scripts/edges-baseline.mjs     # fold that census into tests/edges.baseline.json
```

The baseline's diff is the change under review, as a moved snapshot is.

### What it cannot see

It counts weight and nesting. It cannot tell whether the one heavy object is the right one,
whether a hairline is still visible on `sketch`'s paper, or whether a page still looks like this
brand. Those remain a reviewer's, and the visual baselines then hold whatever the reviewer
approved.
