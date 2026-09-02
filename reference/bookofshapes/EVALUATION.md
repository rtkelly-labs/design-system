# Fitting Book of Shapes to the generator system

An evaluation of the 57 reference patterns against the blog's
`components/graphics` generators, as they stand on
[blog#121](https://github.com/rtkelly13/blog/pull/121) (the `sample`/`project` split),
[blog#132](https://github.com/rtkelly13/blog/pull/132) (`lattice.ts`, hex/triangle/ridgeline)
and [blog#136](https://github.com/rtkelly13/blog/pull/136) (the Remotion spike).

Per-pattern verdicts live in `verdicts.json` and render in the contact sheet.
Nothing here proposes copying artwork — see [README.md](./README.md).

## Where to look at them

`python3 contact_sheet.py`, then serve it. The patterns recolour cleanly into the
brutalist accents, which is what makes the judgement possible at all: in the source
site's grey they all read as "nice pattern", and in neon-on-black it becomes obvious
which ones are *structural* and which are *illustrative*.

**This viewer cannot become a deployed `/experiments/` page.** The blog deploys to
Vercel, so shipping the reference art is publishing it — the exact thing the missing
licence forbids. What belongs at `/experiments/graphics` is our own generators; the
reference sheet stays local. That split is the whole shape of this work: look here,
build there.

## The verdicts

All 57 judged against the 17 generators now in
[blog#138](https://github.com/rtkelly13/blog/pull/138):

| | Count | Meaning |
|---|---|---|
| **covered** | 12 | Shipped |
| **variation** | 36 | A *parameter* away from something we have |
| **port** | 4 | A mechanism nothing in the set has |
| **skip** | 5 | Aesthetic or technical mismatch |

**Thirty-six of fifty-seven are variations.** That is the finding, and it only
becomes visible when the set is sorted by *mechanism* rather than by look — two
patterns can be unrecognisably different on screen and still be one generator
and one argument apart. Sorting by appearance is what produced the first pass of
this file, which called `chevron_blocks`, `radial_harmony` and `brockmann_arcs`
three separate builds; they are one isometric face treatment and two ring
parameters.

So the remaining work is **4 generators and 6 parameters**, not 45 generators.

### The families

| Family | n | What one parameter would absorb |
|---|---|---|
| `iso-cubes` | 11 | A height-field source, a carve mask, a face treatment |
| `mesh-mode` | 8 | Any lattice drawn as a connected wireframe instead of as marks |
| `radial-ring` | 5 | Cell counts and stroke weights on the three ring generators |
| `disorder` | 4 | **Already shipped** — the order-to-chaos ramp |
| `truchet` | 3 | Arcs per tile |
| `wave-envelope` | 2 | An amplitude/frequency envelope across `contour` |
| `interference` | 2 | Mark type and source count |
| `field-source` | 1 | A field built from poles rather than crossed sines |

**`mesh-mode` is the single highest-value thing left.** Eight patterns —
`polar_mesh`, `joy_division_mesh`, `deformed_grid_mesh` and five others — differ
from what we have in exactly one respect: their lattice points are *joined to
their neighbours* rather than drawn as independent marks. `lattice.ts` already
computes neighbour relationships for hex and triangle tilings and throws them
away. A mesh renderer is one function over data that already exists, and it
converts more of the reference set than any new generator could.

The `iso-cubes` family is larger but shallower: eleven patterns that are all the
same cube lattice with a different rule for how tall each column is. Four of
them exceed 950 KB as drawn, and `iso-sphere` — the heaviest of all 57 at
1.76 MB — is just the carve mask applied to a sphere.

### Corrections from looking rather than reading

Three verdicts in the first pass came from the source site's own descriptions
and were wrong:

- **`chevron_blocks`** — described as "ruled hexagons", actually striped-face
  isometric cubes. An `iso-cubes` face treatment, not a new tiling.
- **`radial_harmony`** — described as "concentric circles with radial
  divisions", actually a ring of short radial dashes. `radial-spokes` with a
  high inner radius.
- **`brockmann_arcs`** — three or four very thick arc segments, not a fine
  concentric structure. `broken-ring` with a handful of cells per band.

`wavy_fabric` also moved: it is a quad mesh under wave displacement, not the
over/under weaving the name suggests, so the "genuine 2D occlusion" claim this
file used to make about it does not hold.

### The four that are genuinely new

- **`phyllotaxis-bloom`** and **`spiral_dot_field`** — golden-angle placement.
  Every generator we have places marks by lattice, by scatter, or on a ring;
  none has a *growth* rule. Build one, get both.
- **`lissajous_field`** — parametric curves whose integer frequency ratios close
  the loop natively, which is the property `cycles()` enforces by hand.
- **`rect_field_void`** — negative space as the composition. Wants a
  cross-cutting mask parameter more than a generator of its own, and that same
  mask is what `iso-cross` and `iso-sphere` need.

## The radial gap, closed

This file used to lead with it: all nine original generators were Cartesian —
grids, lattices, hatches, horizontal bands — against 18 radial patterns in the
reference set, so every background the site could draw was edge-to-edge uniform
texture with nothing to sit behind a title.

Three radial generators shipped (`radial-spokes`, `broken-ring`,
`modular-circle`), and the five patterns left in the `radial-ring` family are
parameters on them rather than new work. `rect_field_void` still makes the point
from the other direction and remains unbuilt: a dense Cartesian field with a
hole punched in it, where the negative space is the composition.

Building them turned up something the survey could not have: **rigid rotation
does not work at this scale.** `radial-spokes` first turned the whole wheel once
per loop and was much the fastest thing in the set — peak displacement 1581px
against 155px for the next busiest generator — because tangential speed is
`ω · r`, so the rim always outruns the hub. Sweeping each spoke through an angle
*inversely* proportional to its reach gives every tip the same arc and shears
the wheel into a spiral. Any future centred generator wants the same treatment,
and both of the others are capped at one turn per loop for the same reason.

## The colour contract needed a third slot, and got one

`GraphicParams` carries a single `accent` plus a `background`, and generators fake
depth with `withAlpha(accent, α)`. The reference set separates `--fill-color`,
`--stroke-color` and `--occlusion-color`, and the distribution says why: **exactly 10
of 57 use occlusion, and all 10 are isometric.**

Alpha cannot substitute. Occlusion has to be opaque and match the backdrop, or stacked
solids show through each other and the depth cue collapses. And it cannot be derived
from `background` either, because `background` defaults to `'transparent'` — which is
correct for layering over a surface, and leaves literally no colour to occlude with.

So `iso-grid` drew diamonds rather than cubes, and the whole eleven-pattern
isometric family sat behind one missing parameter. `occlusion` on
`GraphicParams` — defaulting to the theme's surface rather than to `background`
— unblocked it, and `iso-cubes` uses it.

It turned out to have a second user nobody predicted. `ridgeline` filled its
layered ranges with `withAlpha(p.accent, 0.04 + depth * 0.07)`, so every far
range stayed fully visible through every near one: the layers were stacked in
draw order and occluded *nothing*, and the depth cue was carried entirely by
stroke contrast. It read as a pile of overlapping line charts. Mountains hide
what is behind them, and that is most of what makes a range look like distance.

The lesson generalises past isometrics: **any generator that draws things in
front of other things needs this, and alpha will not do it.** Worth checking
`contour` next, which stacks bands the same way.

## Animation fit

The `sample`/`project` split rewards a specific shape of pattern: structure drawn once
from the rng, then moved by pure arithmetic. Judged that way the reference set sorts
sharply, and *not* along the lines its own tags suggest.

**Best fits — `project` is pure formula, no sampled structure needed at all:**

- `lissajous_field` — integer frequency ratios close the loop *by construction*.
  `cycles()` is enforcing by hand exactly the property Lissajous figures have natively.
- `interference-mesh` and `ripple_grid` — two-source interference as displaced lines.
  Sample the grid once; project the wave. The sources orbit on whole cycles, the marks
  never re-roll. This is the closest fit to the machinery already built, and
  `contour`'s travelling-wave phase advance is the precedent. **Shipped** as
  `interference` in [blog#138](https://github.com/rtkelly13/blog/pull/138).

**A correction, from building it.** This section originally led with `flow_lines` and
`flow_poles` as the best fits of all, on the reasoning that streamlines through a vector
field are pure arithmetic. Implementing them disproved it, and the failure is worth more
than the recommendation was.

Integrating a streamline feeds each step's position into the next, so an angular nudge at
the seed compounds all the way down the line — and near a separatrix the tail *switches
channel* rather than drifting. It scored a smoothness ratio of **1.0**, the confetti
signature, from a generator that re-rolls nothing at all: one value moved 271px in a
single 1/300 step. Weakening the field only postpones it; a sweep over amplitudes
0.4–1.1 and step counts 4–26 never cleared 5.5, against 45+ for everything else.

Advection and coherence are in genuine tension. The form of the idea that survives is
`wave-field` — the direction field itself, no feedback between marks — and that is what
shipped as `flow-field`. **"Pure arithmetic" was the wrong test; "no term feeds the next"
is the right one**, and it is the property worth checking any future adaptation against.

**Motion ideas the current generators lack:**

- `flow_dots` — a strict grid at one edge coming apart into strands toward the other.
  Current generators wobble every mark by the same amplitude, so they read as uniform
  texture; a *gradient* of disorder across the frame is a composition, not a texture.
  `jittery_squares_grid` and `triangular_mosaic` are the same idea, and the order-to-chaos
  ramp is the half of `triangular_mosaic` that `triangle-grid` does not cover.
- `signal_decay` — decaying oscillation. Matches the site's terminal voice more
  directly than anything currently in the set.
- Truchet tiling (`quarter_circles_grid`, `concentric_arc_truchet_2`) — per-tile
  rotation through whole turns. `lattice.ts` already provides the cell geometry, so
  this is close to free, and it is a genuinely different motion: the tiling stays put
  while the marks inside it turn.

**Poor fits, and worth knowing why:** `deformed_grid_mesh` and `spiral_morph` animate
by driving the *distortion*, which is sampled — the same trap `density` falls into, and
`generators.ts` already documents interpolating between two sampled structures as the
way out. `masked_letter_grid` needs font metrics a pure-string generator cannot get.

## Weight

Reference SVGs are drawn at fixed detail; ours scale with `density`. It shows:

| | median | range |
|---|---|---|
| Reference patterns (57) | **172 KB** | 2 KB – 1.76 MB |
| Our generators at `density 0.5` | **15 KB** | 4 KB – 69 KB |

37 of 57 exceed 100 KB. That matters because `LayoutWrapper.tsx` and
`SpectacleDeck.tsx` consume generators through `graphicDataUri()`, and a data URI is
~1.3× the SVG after `encodeURIComponent` — so a median reference pattern would land
~230 KB inline in the HTML.

Our own outlier is instructive: `iso-grid` is 69 KB at `density 0.5` and **176 KB at
1.0**, far and away the heaviest of the nine — and the reference set's isometric
patterns are its heaviest too (`iso-sphere`, 1.76 MB). Isometric lattices are expensive
because every cell is three filled faces plus strokes. If occlusion gets added and
isometric generators follow, they need a lower `density` ceiling than the others, and
`iso-grid` should probably get one now regardless.

## What is left, in order of value

The first list here has been done in full — `occlusion`, a radial generator,
`interference`, a time control, and the disorder ramp, all in blog#138. What the
family analysis says to do next is mostly *parameters*:

1. **`mesh-mode`.** One rendering mode — join lattice neighbours instead of
   drawing marks — absorbs eight patterns. Nothing else on this list has that
   ratio, and `lattice.ts` already carries the indices it needs.
2. **A height-field source on `iso-cubes`.** Noise, sine, or flat. Absorbs five
   more of the eleven-strong isometric family, and `disorder` already covers the
   scattered ones.
3. **`phyllotaxis`.** The only genuinely new *placement* rule left — everything
   we have places by lattice, scatter, or ring. Covers two patterns and is the
   one that would not be reachable by parameterising anything existing.
4. **A void/carve mask.** Cross-cutting: it is what `rect_field_void`,
   `iso-cross` and `iso-sphere` all are, and it composes with every generator
   rather than adding one.
5. **`lissajous`.** Small, self-contained, and its integer frequency ratios
   close the loop natively.

Deliberately not on this list: anything in the `iso-cubes` family over 950 KB as
drawn, and `masked_letter_grid`, which needs font metrics a pure-string
generator cannot get.
