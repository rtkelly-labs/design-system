---
status: accepted
---

# A component may change how it draws by Level, never its geometry or its time

Sits beside [`0003`](./0003-two-levels-independently-authored.md) and under
[`0004`](./0004-two-axes-level-and-medium.md). 0003 says the two Levels are two drawings, not
one theme and its inversion. 0004 says a *token* varies by Level or by Medium, never both, and
that a Level carries colour and only colour. Neither says what a *component* may do when one
drawing should look different on the other Level, and the first component that needs to is
`Spinner`.

## Context

`DESIGN.md` §2 calls `sketch` "a different drawing", and #441 spells out what it draws with: an
India-ink pen for the load-bearing edge, a 2H pencil for construction lines and hairlines,
straightedges, no wobble. Until now that difference has been carried by colour alone, because
colour was the only thing a Level could vary. Every component draws the same shape on both
Levels and lets the tokens repaint it.

That stops being enough for a mark whose whole job is to be drawn. The motion rules in
`DESIGN.md` §8 make the quadrant the reference loading mark: a square with one quarter drawn in
the accent, stepping round. On `midnight` the natural drawing is a lit cell, a block cursor on a
CRT. On `sketch` a solid blue square reads as the midnight cell with the lights turned up, which
is exactly the inversion 0003 rejects. The drafting-table drawing of the same quarter is section
hatching in pen.

The mechanism already exists and is unused. `theme.css` generates `midnight:` and `sketch:`
custom variants, meant to match an element's nearest themed ancestor, and no component reaches
for either. Because nothing used them, nothing noticed that they fail inside a nested provider:
any ancestor on a different Level excludes the element. The first component that varies its
drawing fixes that selector, with a test.

## Decision

**A component may vary its drawing technique by Level, through the `midnight:` and `sketch:`
variants. It may not vary its geometry, its time or its behaviour.**

| May vary by Level | May not |
|---|---|
| how a shape is filled: solid, hatched, outlined | the box a mark occupies, its stroke widths, its offsets |
| which edges are inked and which are left as construction lines | the number of steps, the period, the easing |
| the colour roles a part is painted in (already true) | the DOM, the accessible name, the props, the keyboard model |

The unprefixed drawing is the default and the `sketch:` (or `midnight:`) classes override it.
No prop selects a drawing: the Level owns it, and a consumer who chose `sketch` gets the sketch
drawing everywhere without asking for it.

## Considered options

**A prop, `variant="hatch"`.** Rejected. The consumer picks the drawing, so the same page could
show both on one Level, and the theme stops owning what it draws. It also grows the public
surface for something that is not a choice.

**A drawing token per Level.** Rejected by 0004: it would be a token varying by Level that is
not a colour, and a token for "how to fill a quarter" is a style hidden in a variable.

**One drawing for both Levels.** The status quo, and correct for almost every component, which
is why this ADR permits a variation rather than requiring one. Rejected only where the drawing
*is* the component: a loading mark, a status mark, a construction line.

## Consequences

- `Spinner` is the first user: the lit cell on `midnight`, the hatched quarter on `sketch`, on
  one clock (`DESIGN.md` §8). Its props do not change.
- Both Levels already have visual baselines for every asserted story, so a variation is
  reviewed as a pixel diff on the Level it changes and on no other.
- A third Level inherits the default drawing and declares its own only if it wants one. Adding a
  Level never breaks a component.
- This permits a variation; it does not license one. A component that varies its drawing says
  why in its JSDoc, as `Spinner` will.
