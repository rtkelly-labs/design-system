---
status: accepted
---

# A third axis: Preference, a runtime delta over the active Level

Amends [`0004`](./0004-two-axes-level-and-medium.md), which settled that a token varies by Level or
by Medium and never both. A user's accessibility preferences fit neither. Motion and contrast
are chosen by the person reading, at runtime, and they change values on both of 0004's axes:
motion is time, which is Medium's, and contrast is colour, which is Level's. Forcing them onto
either axis breaks the rule that axis exists to keep. Decision D9 (the owner's) asks for them to
be selectable like the theme, so they need a place.

(This is numbered 0007, not 0006: [`0006`](./0006-document-visual-taxonomy.md) was taken by
the time D9 was decided.)

**The decision: a Preference is a third, runtime axis, orthogonal to Level and Medium. It is a
delta over whatever Level is active, and it never multiplies Levels.**

| Axis | Selected | Varies |
|---|---|---|
| **Level** | at runtime, by `data-theme` | colour, and only colour |
| **Medium** | at build time, by which artifact is emitted | geometry and time, and only those |
| **Preference** | at runtime, by `data-a11y-*` on the document | a small override of values the active Level or Medium already declares |

Each Preference is an attribute set **only when active**, so the default is no attribute and no
rule matches it. That is the property that keeps the cost off everyone who has not asked:

| Attribute | Default from the OS | Effect |
|---|---|---|
| `data-a11y-motion` = `reduce` or `full` | `prefers-reduced-motion` | `reduce` forces the duration tokens to zero with the OS silent; `full` forces them back on when the OS says reduce |
| `data-a11y-contrast` = `more` | `prefers-contrast: more` | borders step up a rung, `text.muted` becomes `text.secondary`, role tints become the ground |
| `data-a11y-cvd` = `patterns` | none exists | reveals a shape and a letter on categorical marks, and an icon beside danger and success |
| `data-a11y-links` = `underline` | none | inline links in `Prose` and the site and docs links always underline |

Every axis is tri-state in the API and the menu: `system`, `on`, `off`. `system` follows the OS
signal where one exists and is the same as `off` where none does. The stored value is the user's
*choice*, never the applied attribute, because `more` on the document cannot say whether the user
chose it or the OS did.

## What keeps it a delta

- **A Preference authors no colour.** The `contrast: more` values are another value the same
  Level already declares, derived by `applyContrastDelta` in `src/theme/contrast.ts` and emitted
  into `theme.css` as literals by the generator. `check:contrast` audits the delta ladder against
  the same floors as the Levels, so a preference cannot weaken a pair.
- **Not a Level, and not a product of them.** No third palette, no `midnight-high-contrast`. A
  preference is the same set of overrides on every Level, which is what ADR 0003's independently
  authored Levels allow so long as the override is expressed as a delta. A multiplied ladder is
  the failure mode (GitHub's Primer ships nine theme files for this reason).
- **The time delta is not the Medium.** Medium is still chosen at build time and still carries
  the durations. A preference only collapses them, at the token, with a selector.
- **Document-level only.** There is no `scoped` provider: the stylesheet keys off the document
  element, and a preference is about the person reading, not about a subtree. A preview may put
  `data-a11y-cvd="patterns"` on an ancestor, which the glyph rule honours.

## Colour is never the only cue

`patterns` is redundancy, not the conformance route. WCAG 1.4.1 permits an opt-in cue only
through the conforming-alternate-version route, and that is fragile for a person who has never
opened the menu (`docs/applied-evaluation/a11y-preferences-research.md`, D). So every categorical
use carries a cue that is there by default: a legend that names each series in text, or a direct
label. `BarChart` keeps its category labels on the axis; `SeriesLegend` is text beside every mark.
The glyph adds to that and is never what the reader has to find first.

## Consequences

- **Series is a Level-axis group.** Six members per Level (`series`, with a declared `seriesHue`
  agreeing with `palette`), told apart by hue rather than ranked. The separation is gated under
  normal vision and *reported* under simulated colour-vision deficiency, where it is low by
  design; that is the case the glyphs cover. The measured values are in `levels.ts`.
- **A new class of runtime selector.** Anything a Preference switches is an unlayered rule in
  `theme.css`, so a consumer that imports only that file gets the behaviour (the #302 lesson).
  The `motion-reduce:` variant is redefined there to follow the attribute as well as the OS.
- **Persistence is per device**, one `localStorage` key, with a `storage` adapter and an
  `onChange` for a product that syncs to an account. The init script and the provider share one
  resolution function, and a test runs the generated script against it.
- **Density and text size are still Medium's.** They need a decision about runtime selection on
  that axis before they can be a Preference; this ADR does not make it.
