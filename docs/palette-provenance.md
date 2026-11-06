# Where the base palette comes from

**Siblings:** [`adr/0003`](./adr/0003-two-levels-independently-authored.md) (the decision this
serves) · [`adr/0001`](./adr/0001-hues-declared-below-roles.md) (why a Hue vocabulary exists) ·
[`theme-taxonomy.md`](./theme-taxonomy.md) (what a Level must declare)

**This file contains no colour values.** Per
[`adr/0002`](./adr/0002-one-source-many-emitted-surfaces.md) a colour originates exactly once,
in `src/theme/levels.ts`; writing values here would create a second origin and contradict the
decision. What this file records is *how the values were arrived at*, which is the part that
would otherwise be lost.

## The audit

`scripts/audit-colour-history.mjs` indexes every hex literal ever committed to this repo and to
`rtkelly13/blog`, per commit, and classifies each by whether it is still live and where it
lives. It is an audit, not a Gate: a colour count is not a contract, and a check that failed on
it would fail on every blog post that quotes a hex code. Output is committed at
[`data/colour-audit.tsv`](./data/colour-audit.tsv) as dated evidence.

The first run covered 573 commits — 152 here, 421 in the blog, spanning 2020-09 to 2026-09 —
and found **304 distinct values authored on or after 2026**, classified as:

| tag | n | meaning |
|---|---|---|
| `AUTHORED` | 97 | live at HEAD in a theme, token or component file — a real choice |
| `INCIDENTAL` | 21 | live, but only in one-off surfaces |
| `VENDORED` | 24 | live only inside imported artwork or generated documents |
| `RETIRED` | 162 | present in history, gone at HEAD |

Two exclusions matter, and both are tagged rather than deleted so the judgement stays
auditable. Imported drawio diagram exports under `public/static/` are frozen artwork whose
colours are someone else's decisions. The upstream blog starter's Prism palette in
`tailwind.config.js` is inherited, not chosen. Both would otherwise dominate the ranking purely
because their files never change.

## What the audit established

**The brand core is four chromatic values**, each present in essentially every commit of both
repos since 2026-01-18 — cyan, neon green, yellow and pink, plus the neutral grounds. These are
not a preference; they are what six years of work converged on, and the palette is anchored on
their **hue angles** rather than replacing them.

**Three hue territories wider than 28° had no authored colour at all** — between yellow-green
and green, between teal and cyan, and between azure and the light-mode blue.

**Violet is the empirical proof of #79.** Fifty-seven distinct violets appear in the history;
five are live and authored; none is canonical. Volume without convergence is what an absent
vocabulary looks like. Magenta is worse — one authored value, and it is a raw primary.

**The graphics surfaces reach for raw primaries.** Pure red, cyan, green, yellow and magenta
appear in `theme-engine.test.ts` and the design sandbox because no Hue vocabulary existed to
address instead. That is the same gap `adr/0002` records the blog's graphics palette forking to
fill.

## Method

Hue angles are taken from the audit. Lightness and chroma are then solved per Level, and the
two Levels are solved **differently**, which is `adr/0003` in arithmetic:

- **Dark keeps the brand literal wherever it already clears the floor**, and fills absent hues
  at the brand's own lightness so the set reads as one family. Three of the four brand values
  survive untouched; one needed lifting.
- **Light is solved downward**, because every brand light accent failed against
  `surface.sunken` — the light Level's tightest ground is its *sunken* surface where the dark
  Level's is its *raised* one. This asymmetry is why no single transform can produce one Level
  from the other.

### The floor is 5.5:1, not 4.5:1

Every value clears **5.5:1 against the tightest ground of its own Level**, above the WCAG AA
4.5:1 that `check:contrast` currently enforces. The extra headroom is #78's argument: an editor
draws selection, current-line, find-match and diff backgrounds *behind* the same tokens, and a
palette solved to exactly 4.5:1 has no room left to tint the ground. Solving once at 5.5
retires #78 rather than deferring it.

For comparison, `IEvangelist/pink-ink` — a two-theme VS Code palette with the same
neon-on-ink/vivid-on-white structure — gates at 4.5:1 for text and 3:1 for non-text indicators,
and explicitly excludes decorative guides. Its canvas is pure white, so its tightest ground is
easier than this system's warm `sunken`.

### Separation must be measured in OKLab ΔE, not luma

[`CONTEXT.md`](../CONTEXT.md) defines **Separation** as "the luma distance between two
foreground colours". For a palette that definition is structurally useless, and the audit
proved it: solving every hue to the same contrast against the same ground **equalises luma by
construction**. Across the ten solved hues the luma ratio spread is 1.000–1.009 — every pair
looks identical to a luma test while being obviously different colours.

Perceptual distance in OKLab is the measure that works. It caught two genuine collisions a luma
test could never see: an invented blue sitting 13° from the measured brand blue (ΔE 0.024, and
the invented one was dropped), and a teal/cyan pair at ΔE 0.049. **`CONTEXT.md`'s definition
should be corrected, and `check:separation` — which is described there but does not exist as a
script — should be specified in ΔE.**

## Storage format

The palette should be **emitted** as [Design Tokens Format
Module](https://www.designtokens.org/tr/drafts/format/) files, one per Level with identical
token paths:

```
tokens/palette.midnight.tokens.json
tokens/palette.sketch.tokens.json
```

Three reasons this is the right target rather than an invented shape:

1. **It reached its first stable version, 2025.10, in October 2025**, backed by 40+
   organisations including Adobe, Figma, Google and Microsoft, and is read or written by Figma,
   Penpot, Sketch, Tokens Studio, Style Dictionary and Terrazzo. It is a Community Group Report
   rather than a W3C Standard, and not on the Standards Track — but it is the only format with
   real multi-tool support.
2. **Its alias syntax expresses `adr/0001` natively.** A Role referencing a Hue by name is
   `"$value": "{palette.cyan}"` — a declared lookup, which is exactly the direction that ADR
   argues for and the inverse of the one it rejects.
3. **The spec deliberately says nothing about themes or modes.** One file per Level with
   matching token paths is therefore the conventional answer, and it happens to be the shape
   `adr/0003` requires anyway: two independently authored sets that share their vocabulary but
   not their values.

Two details worth knowing before implementing. A colour `$value` in 2025.10 is a **structured
object** — `{"colorSpace": "srgb", "components": [r, g, b]}`, components normalised 0–1, with
an optional `hex` alongside — not the bare hex string most examples still show. And `$type`
inherits from the enclosing group, so a `palette` group declares `"$type": "color"` once.

**`oklch` is a permitted `colorSpace`**, confirmed against the 2025.10 Color module, which
enumerates `srgb`, `srgb-linear`, `hsl`, `hwb`, `lab`, `lch`, `oklab`, `oklch`, `display-p3`,
`a98-rgb`, `prophoto-rgb`, `rec2020`, `xyz-d65` and `xyz-d50`. Its components are
`[L, chroma, hue]` with L in `[0, 1]`, chroma in `[0, ∞)` and hue in `[0, 360)`. The `hex`
property is **optional**, and the spec describes it as a fallback value.

So the emitter should write **OKLCH components with an sRGB `hex` fallback**. That keeps the
artifact in the space the derivation was done in — the hue angle, which is the part anchored on
six years of history, survives as a first-class number rather than something a consumer has to
recover from three bytes. The `hex` fallback covers any tool that has not implemented the
colour module.

Because these files are Derived, they are generated and drift-checked exactly as
`src/theme.css` is — never hand-edited. That work is #117, which already proposes emitting
Design Tokens JSON for the OpenDesign sidecar; this makes it two targets from one emitter
rather than a separate pipeline.
