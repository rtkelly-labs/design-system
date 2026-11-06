# Design System

The visual language for ryankelly.dev and its sibling applications: a set of colour and
type decisions held in one TypeScript module, from which every consumable form — a
stylesheet, an editor theme, a terminal scheme — is generated rather than written.

This file defines each term in the vocabulary it defines, which is what a glossary is for and
not much use as an introduction. If these read as jargon, start with
[`docs/orientation.md`](./docs/orientation.md) — the same concepts in plain terms, with what
each one is *for* — and come back here for the precise wording.

## Language

### Structure

**Level**:
One complete set of colour decisions, selected at runtime by a `data-theme` attribute.
`midnight` and `sketch` are the two. Deliberately not named for their Polarity — see
[`docs/adr/0003`](./docs/adr/0003-two-levels-independently-authored.md).
_Avoid_: rung, tier, mode, variant

**Medium**:
The class of surface a token is measured *for* — a unit system and a time base. `web` (CSS
pixels, wall clock), `video` (a fixed 1920×1080 frame, frame clock), `graphic` (a fixed
`viewBox`, no time base). Selected at build time by which artifact is being emitted, never at
runtime. Carries geometry and time; never colour.
_Avoid_: platform (that is a Target), surface, format, output

**Axis**:
Which of the two orthogonal things a token varies on. A Level varies colour; a Medium varies
geometry and time; **no token varies on both**, and one that varies on neither is _invariant_.
The distinction is load-bearing: it is why `--ds-text-primary` (a colour, Level axis) and
`--ds-type-body` (a size, Medium axis) do not share a prefix.

**Polarity**:
Whether a Level is fundamentally dark or light — a declared property *of* a Level, not the
axis Levels hang off. `midnight` has Polarity `dark`; `sketch` has `light`. The two
vocabularies stay separate because neither Level is named for its Polarity, which is what
makes a third Level cheap and what keeps the `dark:`/`light:` variants meaningful alongside
`midnight:`/`sketch:`.
_Avoid_: mode, scheme

**Medium**:
The class of surface a token is measured *for*. It fixes the unit system — a CSS pixel, a
video frame, a `viewBox` unit — and the time base — wall clock, frame clock, none. `web`,
`video` and `graphic` are the three. Orthogonal to both Level and Polarity: a Level is
selected at runtime and carries colour, a Medium is selected at build time and carries
geometry and time. Developer themes are not a Medium — the host owns their geometry and their
clock, so they consume colour only. See
[`docs/adr/0004`](./docs/adr/0004-two-axes-level-and-medium.md).
_Avoid_: surface (that is a Group), platform, context, output mode

**Group**:
A named record of colours inside a Level, gathering the ones that answer the same
question — `surface` for elevation, `intent` for meaning, `syntax` for code tokens.
_Avoid_: family (that is the CSS-side term), section, category

**Family**:
The prefix shared by a set of emitted CSS custom properties — the `accent` in
`--color-accent-primary`. A Group's name usually becomes a Family's name, but the two are
different things: one is a TypeScript record, the other a string in a generated file.

### Vocabulary

**Role**:
A name for a colour's job, not its appearance — `accent.primary`, `intent.danger`,
`syntax.keyword`. What a component addresses.
_Avoid_: semantic token, purpose

**Hue**:
A name for a colour's appearance, independent of any job — `cyan`, `violet`. What a
target addresses when it has no notion of jobs. Declared once per Level and referenced by
Roles; never addressed by a component.
_Avoid_: palette name, colour name, raw colour

**Categorical scale**:
An *ordered sequence* of Hues, of which a caller takes the first N, chosen so that any two
members read as different from each other rather than as steps of one hierarchy. What a chart,
a diagram or an ASCII panel addresses. Ordered because the guarantee has to survive
truncation: dropping members must not create a collision among the ones that remain. `chart` is
the Group; unlike every other Group it is a sequence and not a record.
_Avoid_: chart palette, series colours, qualitative palette

**Slot**:
A fixed, named position in a Target's format that must be filled for the output to be
valid — one of a terminal's sixteen ANSI positions, one of VS Code's workbench keys.
Belongs to the Target, not to the Level.

### Output

**Target**:
A format some other tool consumes — Tailwind CSS, a Shiki theme, a VS Code colour theme,
an iTerm2 scheme, a Neovim colorscheme. Distinct from a Medium and not a synonym for it: four
Targets (VS Code, Zed, Shiki, a terminal) share one host geometry and declare no scale at all,
while one Medium (`graphic`) is emitted to several formats.
_Avoid_: platform, consumer, integration, medium

**Emitter**:
The script that writes one or more Targets from the Levels. `build-tokens.mjs` is the
first one.
_Avoid_: builder, compiler, exporter

**Fan-out map**:
The data an Emitter uses to fill many Slots from fewer Roles or Hues — VS Code's
`parameter`, `property` and `namespace` all resolving to `syntax.variable`. Lives in the
Emitter, never in a Level, so that adding a Target cannot change a colour.
_Avoid_: adapter, translation table, alias map

**Declared**:
Written as a literal in the Levels module. The only place a colour originates.

**Derived**:
Computed by an Emitter from Declared values. Every Derived form is a cache that can be
regenerated and is verified against its source in CI, never edited by hand.
_Avoid_: generated (ambiguous — a Derived file is generated, but so is a story's markup)

### Verification

**Gate**:
A check that fails CI. A rule that is not a Gate is a convention, and the distinction is
load-bearing here: colours are chosen by arithmetic, so most rules about them can be
Gates.

**Contrast**:
The ratio between a foreground colour and a Declared background it is painted on. What
`check:contrast` measures.

**Separation**:
The perceptual distance between two foreground colours that appear next to each other in
real output, measured as OKLab ΔE. Distinct from Contrast because two colours can each read
well against the ground and still be indistinguishable from one another.
_Not luma_: solving a set of hues to the same Contrast against the same ground equalises
their luma by construction, so a luma test rates an entire palette as identical. See
`docs/palette-provenance.md`.

**Pairwise separation**:
Separation measured across *every* pair of a set rather than across pairs someone has judged
adjacent, and re-measured at every length the set may be truncated to. What a Categorical
scale needs and what no current Gate has the shape of.

**Composited contrast**:
The ratio between a foreground and a background that is itself translucent over another
background — a keyword over a selection band over a code well. Neither Contrast nor
Separation can express it.

**Selection device**:
The visual means by which a chosen item is marked — an accent fill or a 4px accent edge.
Never one surface against another, which is the failure `auditSelectionDevices` exists to
catch.

**Headroom**:
How far a translucent Group may shift a background before the tightest foreground painted
on it falls below its Contrast floor, counted in equal sRGB steps. The measure of whether
a Level can express editor chrome at all.
