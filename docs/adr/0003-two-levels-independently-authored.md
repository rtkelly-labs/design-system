---
status: accepted
---

# Two Levels, each independently authored, neither derived from the other

Sits under [`0002`](./0002-one-source-many-emitted-surfaces.md) and alongside
[`0001`](./0001-hues-declared-below-roles.md). 0002 says a colour originates exactly once;
0001 says the vocabulary is layered hue-below-role. This one says **how many origins there
are, and whether either can be computed from the other.**

The ladder currently has four rungs — `midnight`, `dim`, `bright`, `white` — and #116 records
the evidence that nothing consumes the fourth or reaches the second: `levelsByPolarity` has no
callers, and `SYSTEM_LEVEL` maps two media states onto four rungs so half the ladder is
unreachable from the OS preference.

But collapsing to two is not the interesting part of the decision. The interesting part is
what the two *are*. Six years of authored colour across this repo and the blog contain exactly
**two identities**, and they are not variations of one theme:

- **`midnight` — neon on ink.** A blue-black `#0a0a1a` ground with high-chroma accents. The
  character the README leads with.
- **`sketch` — paper and pen.** Warm paper, graphite ink, pen-coloured accents. Not the dark
  theme lightened; a different drawing.

**The decision: the ladder is exactly two Levels, `midnight` and `sketch`. Each is an
independently authored identity that declares its own complete set of Groups, including its own
`palette`. Neither Level is derived from the other, by inversion, rotation or any other
formula.**

They are named for what they are rather than for their polarity, and that is load-bearing
rather than decorative — see the last consequence below.

This ADR records no colour values. Per 0002 a colour originates exactly once — in
`src/theme/levels.ts` — so naming values here would create a second origin and contradict the
decision above it. The derivation method and its provenance are in
[`docs/palette-provenance.md`](../palette-provenance.md); the values themselves land with #79
and #116.

## Considered options

**Keep four rungs.** Rejected on #116's evidence: the cost is paid on every Group, every Gate
and every Emitter — #80's editor chrome is roughly a dozen hand-tuned literals *per rung*, and
#84 emits one theme file *per rung* — while the benefit was never collected. Two rungs halve
every downstream issue.

**One Level, the other derived by inversion.** The tempting one, and the reason this ADR
exists. Rejected on two grounds. First, character: an inversion of neon-on-ink is not sketch,
it is neon-on-white, which is a third thing nobody wants. Second, arithmetic: the two Levels'
tightest grounds differ in kind, not just direction — the dark Level's is its *raised* surface
and the light Level's is its *sunken* surface — so a single transform cannot satisfy both, and
the measured hue angles of the two identities do not correspond.

**One shared `palette`, with per-Level lightness derived from it.** The subtle one, and it
fails for the same reason 0001 rejects deriving hues from roles — one layer down. A single
lightness per hue cannot serve both grounds: matching the dark Level's neon lightness caps
achievable chroma in the red and blue regions, so a shared source would force either a washed
dark palette or an out-of-gamut light one. Sharing the *hue angles* across Levels is correct
and is what makes the two read as one brand; sharing the values is not.

**Three Levels, keeping `dim`.** Rejected because it reintroduces the exact defect being
removed: `prefers-color-scheme` has two states, so the third rung is reachable only by an
explicit call, which is what made `dim` unreachable in practice. If a third Level is ever
wanted, the discipline below keeps it cheap.

## Consequences

- **`Polarity` survives, and this reverses what #116 predicted.** That issue argues polarity
  becomes the axis at two Levels, so `Polarity`, `SYSTEM_LEVEL` and `levelsByPolarity` all come
  out. The reasoning holds only if the Levels are *named* for their polarities — at
  `['dark', 'light']`, `SYSTEM_LEVEL` degenerates to an identity map and
  `Record<Polarity, T>` becomes `Record<ThemeLevel, T>`. Naming them `midnight` and `sketch`
  keeps the two vocabularies distinct, so `SYSTEM_LEVEL` still maps two media states onto two
  names that are neither of them. Only `levelsByPolarity` comes out, and only for having had
  zero callers since it was written. Still a **breaking change** in `0.5.0` — `THEME_LEVELS`
  changes shape — and the `api/index.d.ts` diff is where it is reviewed.
- **`palette` is a per-Level Group**, exactly like `surface`, `text` and `accent`. It is not a
  global constant with per-Level overrides, because that shape is the rejected third option.
- **Every hue is authored twice**, once per Level, and this is the accepted cost. It is the
  same cost the surface ramps already pay, for the reason already recorded in `levels.ts`: a
  single derived formula cannot express the behaviours, and hand-tuned literals can.
- **Each Level is gated independently.** There is no cross-Level derivation to verify, which
  removes a class of check the third option would have required — but it doubles what
  `check:contrast` and the separation gate must cover, and the two Levels can fail for
  different reasons on different grounds.
- **The `Record<ThemeLevel, T>` and `assertNever` discipline stays, and matters more.** Two
  Levels is not "a boolean flip"; it is a two-entry record that a third Level turns into a
  compile error. That is what keeps this decision reversible at a known cost.
- **Level names become load-bearing across repos.** `@custom-variant dark` and the
  nested-panel substitution blocks are generated into `theme.css` and consumed from
  `node_modules`, so the rename must land in the package before any consumer moves. The
  ordering is not optional.
- **`sketch` is the name the consumer already uses.** `rtkelly13/blog` has shipped a `.sketch`
  light theme since 2026-07-14, with thirteen hand-tuned prose and component rules scoped to it.
  Choosing `sketch` over `light` means those keep their selector instead of needing re-scoping,
  which removes the largest mechanical part of the blog migration. Naming the package's Level
  after the consumer's is the opposite of the usual direction, and it is worth it here because
  the consumer's name was the better one.
