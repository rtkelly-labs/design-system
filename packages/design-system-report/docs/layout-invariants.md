# Layout invariants

Rendering defects that show up as geometry, checked in real Chromium at paper width under print media
(`reports/layout-invariants.ts`, `reports/layout-invariants.test.ts`). The checks run over every plate cell
(`[data-component][data-state][data-rung]`). Each violation names the cell, the offending element's
`data-slot` (else a short selector path) and the measured numbers.

## Invariants

| id | Rule | Default tolerance |
|---|---|---|
| escape | `scrollWidth > clientWidth` or `scrollHeight > clientHeight`, whatever `overflow` says; re-measured from in-flow descendants so absolutely positioned decoration does not count | 1px; vertical also allows 0.25em of the largest font in the box (descenders, `leading-none`) |
| spill | a text `Range` rect past the content box of its nearest non-inline ancestor (visible: it prints over the border; hidden/clip: it is cut off); any in-flow box past the cell's right edge | 1px |
| truncation | `text-overflow: ellipsis` or `-webkit-line-clamp` with scroll size above client size | 1px |
| overlap | sibling boxes, and text rects of unrelated elements (not ancestor/descendant, not out of flow), intersecting | 1.5px both axes; text must also overlap by 35% of the shorter rect vertically, since tight line boxes graze |
| font | from the PDF with pdfjs-dist: fonts drawn that are not IBM Plex Mono, Inter, Space Grotesk, VT323, DS Symbols, Symbols Nerd Font Mono, with the characters drawn in them and the cell they sit in | none |

Plates print under a transform, so computed lengths (padding, border) are multiplied by `rect / offset`
before being compared to rects. Without that, every padded box "spills" by 20%.

## False positives and how they are filtered

General rules live in the page-side code (sr-only, out-of-flow, scroll containers, decorative clips, tight
leading, clipped text, scaled plates; see the comment above `ALLOWLIST`). Specific accepted findings go in
the typed `ALLOWLIST`, one `{ inv, component, where, reason }` each, and the reason is asserted non-trivial.
Today: the TickerTape marquee track, and ActivityGrid month labels hanging over an empty column.

## Ratchet

`reports/layout-invariants.baseline.json` holds the ratchet keys (`invariant|component|where`) of known
defects. Rung and state are left out so one defect in a component is one key. The test fails only on a key
that is not in the file. Fixed defects leave stale keys that do no harm; prune them with
`UPDATE_LAYOUT_BASELINE=1 pnpm exec vitest run reports/layout-invariants.test.ts`, and review that diff
like any other. The same key list can be a Diffra trusted baseline instead of a repo file if the
protocol should own it. Keying on `data-slot` survives layout churn; keying on pixel numbers would not.

## Mutation check

Defects are planted in plates the detector finds clean (fixed 40px width on a text container, nowrap plus
overflow hidden, `min-width` on a flex child, negative margin onto a sibling, an unknown font family) and
the detector must flag them. A mutant counts only if it is a real defect by direct measurement (text
rect outside its box, child past the cell, intersecting siblings). A harmless-style control must add
nothing. The kill table prints on every run.

## Property-based layer (not built; needs fast-check, not added here)

Generate content and environment, render a component in a bare page with the DS stylesheet, run
`inspectLayout`. Content: long unbroken tokens, URLs, CJK, RTL, combining marks, emoji ZWJ sequences,
empty, one item and hundreds of items. Environment: container width from 120px to 1200px, each of the four
theme rungs, 200% zoom. Metamorphic checks do not need an oracle:

1. widening the container never creates an escape or spill that the narrower one did not have;
2. shortening content never creates one;
3. a rung or zoom change never adds a violation for content that has none at the base setting.

Shrink to the minimal failing width and string. Record counterexamples as fixed cases.

## What to build next

1. Move the checker into the design system's own test run against stories (`ratchet` per story), not only
   the report.
2. Wrapped-text checks: line count change between widths for labels that should stay on one line
   (catches the wrapped bracket in MetadataGrid, which no overflow rule sees).
3. Text sequence checks for duplicated adjacent words (Gantt "May May 4" is content, not geometry).
4. Fix the font fallback findings (box-drawing and arrow glyphs drawn in JetBrains Mono, section sign in
   Georgia) or add a fallback face to the allowed set on purpose.
5. The property layer above, starting with Card, MetadataGrid, TrackCard and Pagination.
