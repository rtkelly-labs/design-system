# Design System

The visual language for ryankelly.dev and its sibling applications: a set of colour and
type decisions held in one TypeScript module, from which every consumable form — a
stylesheet, an editor theme, a terminal scheme — is generated rather than written.

## Language

### Structure

**Level**:
One complete set of colour decisions, selected at runtime by a `data-theme` attribute.
`dark` and `light` are the two.
_Avoid_: rung, tier, mode, variant

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

**Slot**:
A fixed, named position in a Target's format that must be filled for the output to be
valid — one of a terminal's sixteen ANSI positions, one of VS Code's workbench keys.
Belongs to the Target, not to the Level.

### Output

**Target**:
A format some other tool consumes — Tailwind CSS, a Shiki theme, a VS Code colour theme,
an iTerm2 scheme, a Neovim colorscheme.
_Avoid_: platform, consumer, integration

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
The luma distance between two foreground colours that appear next to each other in real
output. Distinct from Contrast because two colours can each read well against the ground
and still be indistinguishable from one another. What `check:separation` measures.

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
