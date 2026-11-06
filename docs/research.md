# Outside reading that shaped this system

**Parent:** [`AGENTS.md`](../AGENTS.md) ·
**Siblings:** [`shadcn-evaluation.md`](./shadcn-evaluation.md),
[`radix-vs-base-ui.md`](./radix-vs-base-ui.md),
[`remotion-evaluation.md`](./remotion-evaluation.md),
[`storybook-benchmarks.md`](./storybook-benchmarks.md) — those evaluate *specific tools* against
this repo. This file holds the *general* ideas about building a component library, and what each one
changed here.

Not a reading list. An entry earns its place by having altered a decision, created an issue, or
named a gap that is still open — and each says which.

> [!NOTE]
> **Links, never copies.** The same rule as [`reference-material.md`](./reference-material.md):
> summarise in our own words and link to the source. Nothing here quotes at length, and no
> third-party text is vendored into this repo.

Measurements of *this* repo below were taken on `c9f592c`, 11 September 2026. They are dated rather
than maintained, following the convention in `radix-vs-base-ui.md`.

---

## 1. Breaking change is a visual question, not only a type question

**[Visual Breaking Change in Design Systems](https://nathanacurtis.substack.com/p/visual-breaking-change-in-design-systems-1e9109fac9c4)** — Nathan Curtis, EightShapes.
Also: **[Versioning Design Systems](https://medium.com/eightshapes-llc/versioning-design-systems-48cceb5ace4d)**,
**[Releasing Design Systems](https://medium.com/eightshapes-llc/releasing-design-systems-57fca91a23f6)**,
**[Design System Release Cadence](https://medium.com/eightshapes-llc/design-system-release-cadence-2e3e6694ba21)**.

The most load-bearing idea we have adopted from outside. Curtis argues colour, type and space each
need *stated criteria* for what constitutes a breaking change, and that few teams write them down.
His colour criteria turn on **who owns the other half of the pair**: a text colour that may sit on an
adopter's background, or a background an adopter paints text onto, is breaking to change. A colour
used only *inside* a component is not — adopters should not be overriding those anyway.

**What it means here.** That line runs straight through this system and no gate sees it:

| | Owned by | Safe to tune? |
|---|---|---|
| `accent.primary` as used inside `Button` | us | yes — `check:contrast` covers it |
| `--ds-text-secondary` emitted as a custom property | the adopter's ground | **no — breaking** |

`pnpm check:contrast` reports *222 pairs across 2 levels*, every pair drawn from `levels.ts`. It
measures our surfaces against our inks. It cannot see the blog's background, and the emitted
`--ds-text-*` / `--ds-surface-*` / `--ds-type-*` properties are exactly the surface his criteria
name. His typography criteria bite the same way: a `font-weight` or `letter-spacing` change wraps
tabs and crops headings in an adopter's layout, and we now emit a `--ds-type-*` scale.

**It also vindicates the pre-1.0 policy.** Curtis's rule of thumb is to experiment freely and
finalise type styles *before* `1.0.0`. Breaking freely now is the recommended use of pre-1.0 — and
the corollary is that these criteria become binding the day we tag 1.0. That is the real deadline on
the custom-property surface.

**Status:** not acted on. Wants an ADR splitting the token surface into an internal tier we may tune
and a published tier whose names *and values* are API, with the gate falling out of that decision.

## 2. The public API is larger than the type signature

**[Versioning and Release Management](https://stevekinney.com/courses/enterprise-ui/versioning-and-release-management)** — Steve Kinney.

Version numbers without a defined public API are decorative. For a design system the API includes
token names and their meaning, generated CSS custom properties, supported theme contexts,
**accessibility behaviour**, and documented DOM or styling hooks — so renaming a token or changing a
keyboard interaction is a breaking change.

**What it means here.** `pnpm check:api` gates `api/index.d.ts`, which is the TypeScript surface
only. We emit 83 `--ds-*` custom properties with no committed baseline, so a rename is invisible to
every gate. And under the accessibility-behaviour clause, changing `CodeTabs`' keyboard model is a
breaking change — which is awkward for [#163](https://github.com/rtkelly13/design-system/issues/163),
because nothing currently records what that model is.

**Status:** open. Same ADR as §1; the custom-property baseline is the mechanical half.

## 3. Adoption is measurable from production, and the obvious methods are wrong

**[Building a design system adoption metric from production data](https://developers.mews.com/design-system-adoption-metric-building/)** — Mews.

They measure *HTML-level coverage*: a build plugin stamps a data attribute on every DOM element
originating from the design system, then a function counts marked elements against total elements,
sampled in production. The pitfalls are the valuable part — **import-based tracking failed** because
teams extend components internally; **visual/area coverage distorted** results because large
containers dominate area while being few components; and **dynamic content has to be measured in
production**, or dialogs and dropdowns never appear in the numbers.

**What it means here.** We have two consumers and no idea what fraction of either is ours.
[#115](https://github.com/rtkelly13/design-system/issues/115) proposes `data-slot` for a different
reason — letting a consumer target internals — and
[#160](https://github.com/rtkelly13/design-system/issues/160) makes it clause 4 of the component
contract. That attribute is most of the instrumentation this method needs, so the metric is close to
free once the contract lands.

**Status:** not filed. Cheap after #160.

## 4. Visual regression is the only automated catch for CSS-only change

**[Visual Regression Testing for Design Systems](https://lastest.cloud/blog/visual-regression-testing-design-systems-2026)**.

A token or stylesheet change that breaks components produces no test failure anywhere else — no
JavaScript logic changed. Screenshot diffing is the only thing that observes it.

**What it means here.** Already the practice: `test:visual` pins `maxDiffPixels: 0` on Linux, and
[`visual-regression.md`](./visual-regression.md) records the determinism contract. The qualifier we
have written down and the industry articles do not is recorded in
[`workflow.md`](./workflow.md) and stated as rule 5 of `AGENTS.md`: **this suite does not gate
colour** — no pixel threshold separates anti-aliasing noise from a small hue change. Arithmetic
gates colour; screenshots gate layout. Keeping those two claims apart is ours, not borrowed.

## 5. Governance, and the one-maintainer case

**[How to Maintain a Design System](https://www.parallelhq.com/blog/building-maintaining-design-system)** ·
**[9 Design System Metrics That Matter](https://www.supernova.io/blog/9-design-system-metrics-that-matter)** ·
**[Design system versioning: single library or individual components?](https://bradfrost.com/blog/post/design-system-versioning-single-library-or-individual-components/)** — Brad Frost.

Reported industry figures: most teams have a contribution process, far fewer have a defined
governance model; staffing is the most-cited challenge; a meaningful minority of design systems are
maintained by one person. Commonly tracked health metrics are component reuse, accessibility pass
rate, design–code alignment, **dependency freshness** and adoption rate.

Curtis and Frost agree on versioning granularity: the library versions as a whole, so one breaking
change anywhere increments the major for everything — and teams should keep a running collection of
deferred breaking changes to batch into the next major rather than deciding case by case.

**What it means here.** This repo *is* the one-maintainer case, and the mitigation is unusual: the
gates are the governance. A rule that is a Gate survives without a reviewer to enforce it, which is
why [`CONTEXT.md`](../CONTEXT.md) defines Gate as distinct from convention, and why
[#152](https://github.com/rtkelly13/design-system/pull/152) added a gate that checks the repository's
own rules against the repository.

Of the named health metrics, **accessibility pass rate** is
[#52](https://github.com/rtkelly13/design-system/issues/52) and **dependency freshness** is
untracked — `check:deps` gates that every dependency is *justified*, not that it is *current*.

---

## What we do that the canon does not describe

Recorded because it is the part most likely to be argued with, and the reasoning should be findable.

**Ratchets with stated budgets.** The articles describe gates as on or off. Every gate here that
cannot pass today instead carries a budget equal to its current count and fails only on a rise —
`check:css`, `check:deps`, `check:fonts`, and `check:tokens` until it reached zero. This is the
mechanism for paying down debt without either blocking work or pretending the debt is absent. PR #58
is the counter-example that proves it: a lint ruleset landed as an assertion, failed its own CI, and
never merged.

**Colour is chosen by arithmetic, not review.** Contrast, hue agreement and separation are computed,
so most rules about colour can be Gates rather than conventions. The industry writing treats colour
as a design decision subject to review; here a review that disagrees with `check:contrast` is wrong.

**No compatibility window before 1.0.** The canon says make deprecations visible before removals. We
do not, deliberately — every consumer is in the same estate and migrates in the same change, so a
shim has no beneficiary. This is a deviation with an expiry date, and §1 above is what it expires
into.
