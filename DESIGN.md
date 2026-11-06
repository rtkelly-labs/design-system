# DESIGN.md — the brand outline

**Ryan Kelly · `ryankelly.dev`** · the visual language for the blog, the design system, the
talks, generated graphics and editor themes.

This file is the portable form of the brand. It is written for a person or an agent arriving
with no context and asked to make something that looks like the rest of it. Everything here is
generated from or verified against `src/theme/levels.ts`, which is the only place a colour
originates — see [`docs/adr/0002`](./docs/adr/0002-one-source-many-emitted-surfaces.md).

Machine-readable form: [`tokens/palette.<level>.tokens.json`](./tokens), Design Tokens Format
Module 2025.10, installable as `@rtkelly13/design-system/tokens/midnight.tokens.json`.

---

## 1. The character, in one paragraph

**Brutalist neon terminal.** Hard edges and no rounding at all. Offset shadows that sit beside
an element rather than blurring under it. Monospace and condensed display type. Bracketed
labels — `[ LATEST POSTS ]`, `> FULL_STACK_ENGINEER.exe`. High-chroma accents on a near-black
ground, or ink on warm paper. It should read as a CRT and a drafting table, not as a SaaS
dashboard.

**What it is not:** soft shadows, gradients, rounded cards, Inter-on-white, an indigo accent,
glassmorphism, emoji as section markers. If a generated design drifts toward any of those, it
has regressed to the mean and is wrong.

## 2. Two themes, not a light-and-dark pair

There are exactly two, and **neither is derived from the other** — see
[`docs/adr/0003`](./docs/adr/0003-two-levels-independently-authored.md).

| Level | `data-theme` | Character |
|---|---|---|
| **Midnight** | `midnight` | Neon on blue-black `#0a0a1a`. High-chroma accents. The signature, and the default. |
| **Sketch** | `sketch` | Warm paper `#f5f3ec`, graphite ink, pen-coloured accents. Not the dark theme lightened; a different drawing. |

The levels are deliberately **not** named `dark` and `light`. `midnight` names a ground and
`sketch` names a surface and a way of drawing on it; neither is a synonym for its polarity. That
keeps `polarity` a real declared property rather than collapsing into the level name — which is
what keeps a third level cheap to add — and it means both the `dark:` and `light:` variants
survive alongside `midnight:` and `sketch:`.

`sketch` is also the name `rtkelly13/blog` has used for its light theme since 2026-07-14, so the
consumer's existing `.sketch` rules keep their selector.

An inversion of neon-on-ink is neon-on-white, which is a third thing nobody wants. The two
themes also have opposite tightest grounds — dark's is its `raised` surface, light's is its
`sunken` — so no single transform produces one from the other.

## 3. Colour is addressed by job, never by appearance

The single most important rule. A component says `bg-surface-raised` or `text-intent-danger`.
It never says `cyan`. See [`docs/adr/0001`](./docs/adr/0001-hues-declared-below-roles.md).

There are two vocabularies and they point one way:

```
Components  ──►  Roles  ──►  Hues
                        via accentHue / intentHue — declared, never inferred

Components  ──✗──►  Hues        a Hue in component code is a defect
```

The lookup is a real map in `levels.ts`, not a coincidence of shared hex. `check:contrast`
asserts every Role holds its declared Hue's value, so the two vocabularies cannot drift — and
a Role declared `neutral` (only `accent.quiet`) is checked to measurably *be* neutral rather
than skipped.

### Roles — what a component may address

| Group | Members | For |
|---|---|---|
| `surface` | `base` `raised` `sunken` `overlay` | grounds; see §5 |
| `text` | `primary` `secondary` `muted` `inverse` | ink |
| `border` | `strong` `default` `subtle` | edges |
| `accent` | `primary` `secondary` `tertiary` `quiet` | emphasis, carrying no meaning |
| `intent` | `info` `success` `warning` `danger` | meaning |

`accent` and `intent` are deliberately separate. Emphasis is not meaning: a red *accent* is a
visual choice, a red *intent* says something is wrong.

### Hues — what a Target addresses when it has no notion of jobs

A terminal has sixteen positions named by colour and no concept of a keyword. So a Hue
vocabulary is declared *underneath* the Roles, referenced by them, and **never addressed by a
component**.

| Hue | Midnight | Midnight bright | Sketch | Sketch bright | Angle | Note |
|---|---|---|---|---|---|---|
| `red` | `#ff586e` | `#ff939b` | `#bd0010` | `#8f002a` | 17° | Danger and ANSI red.
| `orange` | `#ff8c00` | `#ffba85` | `#974503` | `#6c3700` | 58° | Warning, and the ANSI slot between red and yellow.
| `yellow` | `#facc15` | `#ffeaab` | `#705a00` | `#534200` | 92° | Brand. Attention without alarm.
| `green` | `#39ff14` | `#c0ffb8` | `#006b2e` | `#024f00` | 142° | Brand. Success and ANSI green.
| `teal` | `#34d399` | `#00f7ae` | `#006859` | `#004d34` | 163° | The cool half of green; ANSI has no slot for it.
| `cyan` | `#22d3ee` | `#88ebff` | `#006675` | `#004b56` | 212° | Brand, and the most-used hue in the estate.
| `blue` | `#38bdf8` | `#8cd7ff` | `#1450d7` | `#004e6d` | 233° | Information. A sky blue at 233 degrees by heritage rather than a true blue.
| `violet` | `#c3afff` | `#ddd4ff` | `#7d00f4` | `#6000bd` | 295° | Added by this work — no canonical violet existed. Fills ANSI magenta-adjacent space.
| `magenta` | `#ff1cff` | `#ff88fd` | `#a300ad` | `#7f0080` | 328° | ANSI magenta, which no Role previously reached.
| `pink` | `#f955a4` | `#ff8ebe` | `#b4006c` | `#8a0052` | 354° | Brand. Emphasis, and the neon-terminal signature.
Ten is the **ceiling**, not a comfortable middle: the tightest pair already sits at ΔE 0.049,
and an eleventh candidate was dropped during derivation for landing 13° from the measured blue
at ΔE 0.024. Adding one means re-running the separation gate, not just extending the list.

The `bright` half fills ANSI's upper eight. It carries emphasis rather than body text, so it is
held to 4.5:1 where the base hues are held to 5.5:1.

### Fixed colours — the three that do not vary

| | | |
|---|---|---|
| `fixed.black` | `#000000` | when true black is meant — a print surface, an SVG fill |
| `fixed.white` | `#ffffff` | referenced by the light theme's `surface.raised` |
| `fixed.transparent` | — | the explicit absence of a ground |

**Do not use `--color-black` or `--color-white` for this.** They are deprecated compat aliases
tracking `surface.base` and `text.primary`, so `--color-black` resolves to `#ffffff` on the
`sketch` theme — a token named for an appearance holding warm paper. The `white` level, where
it resolved to literal `#ffffff` and the inversion was starkest, is gone with the collapse; the
alias is still the wrong shape.

## 4. Contrast is arithmetic, and it is a gate

Colour is the one axis with a machine-checkable definition of correct, so it is checked.
`pnpm check:contrast` audits **222 pairs — 111 per theme** on every build and fails CI, plus 24 selection devices and 16 Role→Hue agreement checks. The per-theme figure is the one to reason from: it is what a third theme would add.

| | Floor | Why |
|---|---|---|
| text, `accent`, `intent` | 4.5:1 | WCAG AA |
| **`palette`** | **5.5:1** | above AA on purpose — an editor draws selection, diff and find-match backgrounds *behind* the same tokens, and a palette solved to exactly 4.5 has no room left to tint the ground |
| `palette.bright` | 4.5:1 | emphasis, not body text |
| `border.strong`, `border.default` | 3:1 | non-text UI, WCAG 1.4.11 |
| `border.subtle` | 1.4:1 | decorative hairline — must be visible, not accessible |

**Separation is measured in OKLab ΔE, not luma.** Solving a set of hues to the same contrast
against one ground equalises their luma by construction — the measured spread across these ten
is 1.000–1.009, so a luma test rates the entire palette as identical. Minimum ΔE is 0.04.

## 5. Background hierarchy

Four grounds per theme, each answering a different question. Not decoration.

| | What sits on it |
|---|---|
| `surface.base` | the page itself |
| `surface.raised` | panels, cards, menus — above the page |
| `surface.sunken` | wells, code blocks, inputs — recessed into it |
| `surface.overlay` | the modal scrim; the only value carrying alpha |

Two things that are not obvious:

**Elevation is carried by the shadow, not the background.** `sketch`'s `base → raised` step is ΔE 0.037 — barely visible on its own. That is correct by idiom: a `6px 6px 0` offset
shadow and a 2px border do the work a subtle fill does in a soft design. Do not widen the ramp
or invent a fourth surface.

**The light scrim inverts which ink applies.** `surface.overlay` composited over `sketch`'s page becomes a mid-grey, on which `text.primary` scores 2.3–2.5:1 and *fails*, while
`text.inverse` scores 5.4–5.9:1. So anything painted on `sketch`'s scrim uses `text.inverse` —
the opposite of `midnight`. No gate can currently see this; it is tracked in #81.

## 6. Form

| | |
|---|---|
| **Radius** | Zero. Everywhere. Non-negotiable — it is the most recognisable single property. A *token* on the Medium axis, not a reset: `theme.css` redefines Tailwind's whole radius scale to it, so `rounded-lg` is square without this package reaching into your document. |
| **Shadows** | Hard offsets, never blurred: `2px 2px 0`, `4px 4px 0`, `6px 6px 0`, in `--ds-shadow-color`. Per-role variants exist so a card can lift in its own accent without naming a hue. |
| **Borders** | 2px is the load-bearing weight. Edges are drawn, not implied. |
| **Glow** | `--shadow-glow-accent` exists and is for the neon surfaces only. Not for UI chrome. |

## 7. Type

| Role | Stack |
|---|---|
| Display | Space Grotesk → Inter → sans-serif |
| Body | Inter → system sans |
| Mono | IBM Plex Mono → Symbols Nerd Font Mono → Courier New |
| Pixel | VT323 → monospace |

Fallback chains are load-bearing: when the web font has not loaded, the next entry decides the
metrics, and a different fallback reflows the page.

**The mono face is latin-only.** Box-drawing and block characters fall through to Symbols Nerd
Font Mono — which is why ASCII art needs testing rather than assuming.

**Geometry and time are the second axis, and they are declared.** A Level varies colour and is
picked at runtime; a **Medium** varies geometry and time and is picked at build time by which
artifact is being emitted. There are three — `web` (CSS pixels, wall clock), `video` (a fixed
1920×1080 frame, frame clock) and `graphic` (a fixed `viewBox`, no time base) — and no token
varies on both axes.

`theme.css` carries exactly one, the web Medium: `--ds-space-*`, `--ds-type-*`,
`--ds-leading-*`, `--ds-weight-*`, `--ds-stroke-*`, `--ds-elev-*`, `--ds-radius-*`,
`--ds-duration-*`, `--ds-ease`, `--ds-layer-*` and `--ds-focus-*`. The prefixes deliberately
do not collide with the colour ones: `--ds-text-primary` is an ink, `--ds-type-body` is a size.

`video` is **not** the web scaled — its type steps are its own, and its motion is measured in
whole frames because a fractional frame lands a render mid-transition. See
[`docs/adr/0004`](./docs/adr/0004-two-axes-level-and-medium.md).

**The contrast floor is Medium-keyed too**, which is the part most easily got wrong: colour
values do not vary by Medium, but the floors they must clear do. `pnpm check:contrast` defaults
to the web floors; `--medium=video` and `--medium=graphic` enforce the stricter 7:1 frame floors
and report **46 of 222 pairs below minimum**. That is deliberate, not a regression — no video or
graphic artifact is emitted yet, and only the `web` run gates CI. If palette values ever move,
those 46 are the number that moves first.

## 8. Voice

Terse. Technical. Lowercase in code contexts, `UPPERCASE_SNAKE` for terminal-flavoured labels.
Bracketed section headings. No exclamation marks, no marketing adjectives, no "seamlessly" or
"effortlessly". A control says exactly what happens: `PUBLISH`, then `PUBLISHED`.

## 9. If you are an agent building something on this brand

1. Read the token files, not this prose, for values — `tokens/palette.<theme>.tokens.json`.
2. Address Roles. If you find yourself writing a hue name in a component, stop.
3. Zero radius, hard offset shadows, 2px borders.
4. Both themes, always. Test `sketch`; it is the one that breaks.
5. Never use pure black as a page ground. `surface.base` is `#121316` on dark, and the darkest
   declared value anywhere is `#0c0d0f`.
6. Contrast is a gate, not a guideline. If `pnpm check:contrast` fails, the colour is wrong —
   not the gate.
