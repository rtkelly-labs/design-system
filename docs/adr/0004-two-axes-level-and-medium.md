---
status: accepted
---

# Two axes: a token varies by Level, or by Medium, and never by both

Sits under [`0002`](./0002-one-source-many-emitted-surfaces.md), whose final consequence is
that "type, spacing and motion are in scope, not only colour". This ADR is the shape of that
sentence. [`0003`](./0003-two-levels-independently-authored.md) settles how many Levels there
are; this one settles what a Level is *for*, by naming the axis that is not it.

Everything the token layer declares today varies by Level, and every term in
[`CONTEXT.md`](../../CONTEXT.md) — Group, Role, Hue, Slot, Target, Emitter — is a term about
colour varying by Level. But 0002 names **four classes of surface**, and only one of them is
the web. A 1080p Remotion frame and a 16px page do not share a type scale;
[`evidence-pipeline.md`](../evidence-pipeline.md) records the measured version of the same
split for motion — nineteen CSS transitions that are wall-clock rather than frame-clock and
"smear under seeking"; and an editor or a terminal takes neither scale from us, because its
host already owns both. None of those disagreements is about theme selection, so none of them
can be expressed on the axis the system has.

There is no word for that axis, which is why #49 has nowhere to land: it asks for spacing,
type, motion and z-index tokens and then has to guess whether they are fields on
`LevelDefinition` or a flat sibling record. Both answers are wrong, and the reason is that
they are answers about one axis to a question about two. § 7 of
[`DESIGN.md`](../../DESIGN.md) states the gap in the terms a consumer meets it in — "there is
no type scale, spacing scale, motion or z-index in the token layer yet … a 1080p video frame
and a 16px page disagree about the scale" — and that is the sentence this ADR gives a shape
to.

**The decision: a token declares which of exactly two orthogonal axes it varies on, and no
token varies on both.**

| Axis | Selected | Varies |
|---|---|---|
| **Level** | at runtime, by `data-theme` | colour, and only colour |
| **Medium** | at build time, by which artifact is being emitted | geometry and time, and only those |

A **Medium** is the class of surface a token is measured *for*. It fixes the unit system —
CSS pixel, video frame, `viewBox` unit — and the time base — wall clock, frame clock, none.
There are three:

| Medium | Unit system | Time base |
|---|---|---|
| `web` | CSS pixels, reflowing, user-zoomable | wall clock |
| `video` | a fixed 1920×1080 frame, no reflow, no zoom | frame clock |
| `graphic` | a fixed `viewBox`, no reflow | none |

**Developer themes are not a Medium**, and that exclusion is the load-bearing half of the
enumeration. VS Code, Zed, Neovim, a terminal and JetBrains own their own geometry and their
own clock; a theme may not set an editor's line height or a terminal's cell size. They consume
colour and nothing else, so they are Targets and no Medium at all — five of the eleven rows in
the taxonomy's Target table. This is what stops the two axes collapsing into one list.

Medium carries: type scale, leading, tracking, font weight, spacing, border width, shadow
offset, radius, motion duration, easing, z-index layers, focus-ring geometry, and the
contrast floor a Gate enforces. Level carries colour. A token that varies on neither axis is
**invariant** and declared once: the `fixed` Group — `fixed.black`, `fixed.white`,
`fixed.transparent` — is that class and already ships, as does the set of hue angles
[`palette-provenance.md`](../palette-provenance.md) anchors on six years of authored colour.
Three variance classes, then, and `fixed` is the evidence that the third is real rather than a
tidy corner of the model.

One asymmetry is worth stating because it is the thing most likely to be got wrong later:
**colour values do not vary by Medium, but the floors they must clear do.** A projected frame,
a compressed video and an unantialiased terminal cell are not the same legibility problem as
a browser at 1×.

This ADR records no values, for the reason 0003 records none: per 0002 a token originates
exactly once, and naming values here would create a second origin.

## Considered options

**One axis — non-colour tokens as fields on `LevelDefinition`.** Rejected because it authors
every spacing value twice for two Levels that must agree, and still gives video nowhere to
differ. The double-authoring 0003 accepts for colour is accepted *because* the two Levels'
values must differ and no formula relates them; spacing has no such argument, so the same cost
buys nothing.

**One axis — a single flat sibling record of level-independent tokens.** #49's own suggestion,
and the tempting one: it correctly gets spacing off the Level axis. Rejected because it has
exactly one cell, so a 1080p frame and a 16px page must share a type scale — which 0002 says
they cannot, and which `remotion-evaluation.md` measured for motion before anything was built.
It solves the half of the problem that is visible from the web and leaves the half that is not.

**A two-dimensional record keyed (Level × Medium).** Rejected on emittability rather than
taste. A Level is switchable in the browser; a Medium is chosen before the build runs. A
product record would ask the generator to emit six cells into a stylesheet where no selector
can reach four of them, and every colour cell would be identical across Media while every
spacing cell would be identical across Levels. Six cells to express two.

**Per-Medium modules, each declaring its own scales.** Rejected on the evidence 0002 already
rejected per-surface palettes on, one axis over: this is what has already happened.
`blog/css/tailwind.css` carries 35 `--diagram-*` declarations across ten token names, and
`blog/video/src` hardcodes `#0a0a1a` — a value [`colour-heritage.md`](../colour-heritage.md)
retires. A Medium that declares its own scales will declare its own colours next, because
that is the observed direction of travel.

**Medium as a Target — add rows to the taxonomy's Target table and stop.** The subtle one, and
the option this ADR is most easily mistaken for. Rejected because a Target is a *format* and a
Medium is a *unit system and a clock*, and the two do not correspond in either direction: four
Targets (VS Code, Zed, Shiki, a terminal) share one host geometry and declare no scale at all,
while one Medium (`graphic`) is emitted to several formats — SVG, a Mermaid theme, a raster
export. Collapsing them makes "which Targets need a type scale" unanswerable, and that is
precisely the question #49 is blocked on. The taxonomy's Target table stays a table about the
Level axis; the rows for `video` and `graphic` are rows about what colour those Media need,
not about their scales.

## Consequences

- **`Record<Medium, T>` and `assertNever`, exactly as for Level.** A `MEDIA` const, ordered,
  never re-listed; adding a fourth Medium is a compile error until every site answers it. This
  is the discipline 0003 keeps for Levels, applied to the axis that has been missing it, and it
  is what makes the enumeration above reversible at a known cost.
- **#49 lands on this axis, with spacing as the worked example.** Its list — spacing, type
  scale, font weight, border width, shadow offset, motion, z-index, focus ring — is
  Medium-keyed in full, and none of it belongs on `LevelDefinition`.
- **Radius becomes a token, which folds in #54.** `src/styles.css` sets
  `border-radius: 0px !important` as a hardcoded rule reaching the whole consumer document.
  Zero is a value on a scale, not the absence of one; declared per Medium it stops being a
  reset.
- **`theme.css` carries exactly one Medium.** The web Medium's values reach the `@theme` block
  and Tailwind consumers; `video` and `graphic` are emitted to their own artifacts by their own
  Emitters. A Medium must never be selectable by a CSS attribute the way a Level is — if a
  future stylesheet needs two Media at once, that is a new decision, not a wider record.
- **The contrast floor becomes per-Medium data the Gate reads.** `MINIMUM_RATIO` in
  `src/theme/contrast.ts` is now indexed by Role and by vocabulary — 4.5:1 for a Role, 5.5:1
  for a Hue, 4.5:1 for its bright variant — which is what retired #78 by arithmetic. The
  dimension still missing is this one: those are *one set of numbers for every surface the
  system emits to*. A projected 1080p frame, a compression-damaged video and an unantialiased
  terminal cell do not read against the browser's floor. Nothing here needs a new Gate; it
  needs the number it reads to be indexed twice.
- **The `graphic` Medium needs a Group that does not exist.** 0002 states it: graphics need "N
  mutually distinguishable colours rather than four levels of emphasis". No Group in
  [`theme-taxonomy.md`](../theme-taxonomy.md) can express an *ordered sequence with a
  guaranteed pairwise floor* — `palette` is a named record and `accent` is four steps of
  hierarchy. The taxonomy now carries the row; the Group is still unowned.
- **An off-scale literal becomes reportable.** `scripts/token-rules.mjs` already reports a
  colour written as a literal at the line that wrote it, and #49 asks for the same rule shape
  for spatial values. It cannot be written before the scales exist, and it is cheap
  immediately afterwards — so the scales should land in the order that lets the rule follow
  each one.
- **This axis is why `check:visual-coverage` is not enough on its own.** Coverage is asserted
  for stories on the web Medium. A type scale that is wrong for a 1080p frame is invisible to
  every gate in the repo, which is the same structural blindness 0002 records for colour.
