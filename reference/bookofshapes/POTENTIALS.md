# Every potential background

The full list, so nothing has to be rediscovered. Each Book of Shapes pattern
mapped to the generator that would draw it — ours, not theirs. No reference
artwork ships; see [README.md](./README.md).

**17 built · 15 new generators + 17 presets would cover every remaining pattern · 8 carry a caveat**

The count that matters: 57 reference patterns need **15 more generators**, not 40,
because 17 of them are a parameter away from something that already exists and
two of the "new" entries (`flow-poles` on `flow-lines`, striped faces on
`iso-cubes`) are new *parameters* on built generators rather than new files.

## Built

`dot-grid`, `diagonal-hatch`, `node-network`, `contour`, `iso-grid`, `scatter-blocks`, `hex-grid`, `triangle-grid`, `ridgeline`, `radial-spokes`, `interference`, `flow-field`, `truchet-arcs`, `iso-cubes`, `flow-lines`, `broken-ring`, `orbit-rings`


## New generators (19)

A mechanism nothing we have can produce.

| Reference | Generator | Notes |
| --- | --- | --- |
| [`hiding-squares`](https://bookofshapes.com/patterns/hiding-squares/) — Hiding Squares | `cell-mask` | marks clipped by their own grid cell |
| [`dna_helix`](https://bookofshapes.com/patterns/dna_helix/) — Cube Helix | `cube-helix` | cubes on a sine helix; more motif than background |
| [`flow_poles`](https://bookofshapes.com/patterns/flow_poles/) — Flow Poles | `flow-lines` | field from vortices and sinks — a new field source |
| [`chevron_blocks`](https://bookofshapes.com/patterns/chevron_blocks/) — Chevron Blocks | `iso-cubes` | striped faces — a face treatment, wants a new param |
| [`modular_circle`](https://bookofshapes.com/patterns/modular_circle/) — Modular Circle | `kaleidoscope` | triangular lattice in a hexagon + radiating tangent families |
| [`lissajous_field`](https://bookofshapes.com/patterns/lissajous_field/) — Lissajous Field | `lissajous` | integer frequency ratios close the loop natively |
| [`phyllotaxis-bloom`](https://bookofshapes.com/patterns/phyllotaxis-bloom/) — Phyllotaxis Bloom | `phyllotaxis` | golden-angle placement — the one rule we have no version of |
| [`polar_mesh`](https://bookofshapes.com/patterns/polar_mesh/) — Polar Mesh | `polar-mesh` | mesh mode, polar — join ring neighbours |
| [`isometric_ribbon_grid`](https://bookofshapes.com/patterns/isometric_ribbon_grid/) — Isometric Ribbon Grid | `ribbon-grid` | noise-driven parallelograms on a triangular lattice |
| [`rose_mesh`](https://bookofshapes.com/patterns/rose_mesh/) — Rose Mesh | `rose-curve` | r = cos(k.theta) — petal curves |
| [`signal_decay`](https://bookofshapes.com/patterns/signal_decay/) — Signal Decay | `signal-decay` | stacked rules under a decaying envelope |
| [`wavy_lines_converging`](https://bookofshapes.com/patterns/wavy_lines_converging/) — Wavy Lines Converging | `signal-decay` | same generator, convergent envelope |
| [`spiral_mesh`](https://bookofshapes.com/patterns/spiral_mesh/) — Spiral Mesh | `spiral-mesh` | mesh along spiral trajectories |
| [`spiral_morph`](https://bookofshapes.com/patterns/spiral_morph/) — Spiral Morph | `spiral-warp` | a grid warped toward an Archimedean spiral |
| [`nested_polygons`](https://bookofshapes.com/patterns/nested_polygons/) — Nested Polygons | `swept-polygons` | concentric polygons joined by swept parallels; the moire is the effect |
| [`deformed_grid_mesh`](https://bookofshapes.com/patterns/deformed_grid_mesh/) — Deformed Grid Mesh | `terrain-mesh` | same generator, noise displacement |
| [`joy_division_mesh`](https://bookofshapes.com/patterns/joy_division_mesh/) — Joy Division Mesh | `terrain-mesh` | mesh mode, cartesian — the wireframe of ridgeline |
| [`rect_field_void`](https://bookofshapes.com/patterns/rect_field_void/) — Rectangle Field Void | `void-field` | dense field + a mask; the mask is cross-cutting |
| [`wavy_fabric`](https://bookofshapes.com/patterns/wavy_fabric/) — Wavy Fabric | `weave` | quad mesh under wave displacement |

## Presets (17)

A parameter or two on a generator that already exists — the cheap wins.

| Reference | Generator | Notes |
| --- | --- | --- |
| [`brockmann_arcs`](https://bookofshapes.com/patterns/brockmann_arcs/) — Brockmann Beethoven Arcs | `broken-ring` | 3-4 very thick cells per band |
| [`resonance_field`](https://bookofshapes.com/patterns/resonance_field/) — Resonance Field | `interference` | raise the source count |
| [`ripple_grid`](https://bookofshapes.com/patterns/ripple_grid/) — Ripple Grid | `interference` | draw marks instead of rules |
| [`iso_test_noise_field`](https://bookofshapes.com/patterns/iso_test_noise_field/) — Isometric Noise Field | `iso-cubes` | noise height field |
| [`iso_test_noise_field_2`](https://bookofshapes.com/patterns/iso_test_noise_field_2/) — Isometric Noise Field II | `iso-cubes` | same, other noise parameters |
| [`isometric_cubes`](https://bookofshapes.com/patterns/isometric_cubes/) — Isometric Cubes | `iso-cubes` | flat height field, wider spacing |
| [`scattered-cube-grid`](https://bookofshapes.com/patterns/scattered-cube-grid/) — Scattered Cube Grid | `iso-cubes` | `disorder` on the cube lattice |
| [`scattered-cube-grid-v3`](https://bookofshapes.com/patterns/scattered-cube-grid-v3/) — Scattered Cube Grid v3 | `iso-cubes` | same, displaced outward from centre |
| [`sine-cube`](https://bookofshapes.com/patterns/sine-cube/) — Sine Cube | `iso-cubes` | sine height field — close to the default |
| [`concentric_noise_rings`](https://bookofshapes.com/patterns/concentric_noise_rings/) — Concentric Noise Rings | `orbit-rings` | rings drawn as noisy outlines, not beads |
| [`line_based_circles`](https://bookofshapes.com/patterns/line_based_circles/) — Line-Based Circles | `orbit-rings` | segments instead of beads |
| [`spiral_dot_field`](https://bookofshapes.com/patterns/spiral_dot_field/) — Spiral Dot Field | `phyllotaxis` | spiral arrangement, same placement rule |
| [`radial_harmony`](https://bookofshapes.com/patterns/radial_harmony/) — Radial Harmony | `radial-spokes` | high inner radius, short dashes |
| [`deformed_grid_mesh_2`](https://bookofshapes.com/patterns/deformed_grid_mesh_2/) — Deformed Grid Mesh II | `terrain-mesh` | parameter variant of deformed_grid_mesh |
| [`arcs_1`](https://bookofshapes.com/patterns/arcs_1/) — Rotating Arc Grid | `truchet-arcs` | one arc per tile instead of a pair |
| [`concentric_arc_truchet_2`](https://bookofshapes.com/patterns/concentric_arc_truchet_2/) — Quarter Arc Truchet | `truchet-arcs` | five nested arcs per tile |
| [`concentric_arc_truchet_3`](https://bookofshapes.com/patterns/concentric_arc_truchet_3/) — Arc Truchet Butterfly | `truchet-arcs` | mirrored tile — the butterfly variant |

## Harder, with a caveat (8)

Worth having, but each carries a real cost. Named so the decision is explicit.

| Reference | Generator | Notes |
| --- | --- | --- |
| [`halftone_sphere`](https://bookofshapes.com/patterns/halftone_sphere/) — Halftone Sphere | `halftone` | dot size by luminance — needs a shading model, not a lattice |
| [`iso-cross`](https://bookofshapes.com/patterns/iso-cross/) — Iso Cross | `iso-carve` | a shape carved from the cube lattice; needs the mask param |
| [`iso-cube-wireframe`](https://bookofshapes.com/patterns/iso-cube-wireframe/) — Iso Cube Wireframe | `iso-carve` | same, 977 KB; reads as an object rather than a ground |
| [`iso-sphere`](https://bookofshapes.com/patterns/iso-sphere/) — Iso Sphere | `iso-carve` | same, and 1.76 MB as drawn — cap the density |
| [`masked_letter_grid`](https://bookofshapes.com/patterns/masked_letter_grid/) — Masked Letter Grid | `letter-mask` | needs font metrics; possible with one glyph as a committed path |
| [`backpack-grid`](https://bookofshapes.com/patterns/backpack-grid/) — Backpack Grid | `mosaic` | rounded rectangles — against the zero-border-radius rule |
| [`noise_circle_1`](https://bookofshapes.com/patterns/noise_circle_1/) — Noise Circle | `noise-blob` | organic blob edge; same tension as above |
| [`chaos_circles`](https://bookofshapes.com/patterns/chaos_circles/) — Chaos Circles | `sketch-circles` | hand-drawn wobble; fights the zero-radius, hard-edge house style |

## Already covered (13)

Listed for completeness.

| Reference | Generator | Notes |
| --- | --- | --- |
| [`nested_polygons_filled`](https://bookofshapes.com/patterns/nested_polygons_filled/) — Broken Ring | `broken-ring` | — |
| [`flow_dots`](https://bookofshapes.com/patterns/flow_dots/) — Flow Dots | `dot-grid` | the `disorder` ramp is this pattern |
| [`wave-field`](https://bookofshapes.com/patterns/wave-field/) — Wave Field | `flow-field` | — |
| [`flow_lines`](https://bookofshapes.com/patterns/flow_lines/) — Flow Lines | `flow-lines` | — |
| [`interference-mesh`](https://bookofshapes.com/patterns/interference-mesh/) — Interference Mesh | `interference` | — |
| [`isometric-cube-grid`](https://bookofshapes.com/patterns/isometric-cube-grid/) — Isometric Cube Grid | `iso-cubes` | — |
| [`node_garden`](https://bookofshapes.com/patterns/node_garden/) — Node Garden | `node-network` | — |
| [`radial_spokes`](https://bookofshapes.com/patterns/radial_spokes/) — Radial Spokes | `radial-spokes` | — |
| [`joy_division`](https://bookofshapes.com/patterns/joy_division/) — Joy Division | `ridgeline` | — |
| [`noise_landscape_1`](https://bookofshapes.com/patterns/noise_landscape_1/) — Noise Landscape | `ridgeline` | — |
| [`jittery_squares_grid`](https://bookofshapes.com/patterns/jittery_squares_grid/) — Jittery Squares Grid | `scatter-blocks` | `disorder` on the square lattice |
| [`triangular_mosaic`](https://bookofshapes.com/patterns/triangular_mosaic/) — Triangular Mosaic | `triangle-grid` | — |
| [`quarter_circles_grid`](https://bookofshapes.com/patterns/quarter_circles_grid/) — Quarter Circles Grid | `truchet-arcs` | — |
