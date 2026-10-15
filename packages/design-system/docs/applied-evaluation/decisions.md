# Decisions — applied refinements

Owner picks made on the decision board (`apps/site/src/app/decisions`, scaffolding), with the evidence each
rests on. Roll-up rows refer to `../applied-evaluation.md` §2.

## Phase 1 — 2026-10-15

| ID | Decision | Pick | Evidence |
|---|---|---|---|
| D1 | Low-emphasis ("quiet") button | **D1-A**: 2px neutral border and transparent fill. The hard shadow and accent border appear on hover only | Carbon Button (ghost is least prominent), Primer Button (invisible variant). Rows 2 and 18 |
| D2 | Secondary button | **D2-B**: `edge-strong` outline with a matching 4px hard shadow; no ink fill | Carbon Button (secondary "less visual prominence"), GOV.UK Button (one primary per page). AUD-F14 |
| D3 | Danger intent | **D3-B**: `intent-danger` outline and text, filled on hover or focus. **Rule:** a danger button never sits beside a button of the same hue | Primer Button (danger "used sparingly"), WCAG 1.4.1. SET-01, K-2/K-3 |
| D3 rule | Enforcing the rule | A ButtonGroup context checks hue collisions through the declared role→hue map (`levels.ts`) and warns in development. A test runs the check over every story and sample. The Button default variant changes from `tertiary` to `quiet` | `accent.tertiary` and `intent.danger` resolve to the same hue on both levels, and `tertiary` was the default, so the collision was the common case |
| D4 | Small sizes | **D4-A + touch**: `xs` 28px and icon-only 32px, plus a 40px icon-only size for touch surfaces | WCAG 2.5.8 (24px AA), 2.5.5 (44px AAA). Carbon xs row 24px. PT-06/07/10 |
| D5 | Midnight on paper | **D5-B**: paper prints in Sketch's roles, and #360's `print-color-adjust: exact` keeps fills | MDN `print-color-adjust`. PT-02. ADR 0004: Level is colour, so print selects a Level and adds no new palette |

### Phase 1 — as built

- `Button` variants: `quiet` (default), `secondary` (outline), `primary`, `tertiary`, `inverse`, `danger`, `default`. Sizes: `xs` 28px, `sm` 40px, `md`, `lg`, plus `icon` 32px and `icon-touch` 40px, which require `aria-label` in the types. Danger is a variant, not an `intent` prop: it is one look, not a hue that composes with the others.
- `ButtonGroup` (`role="group"`) is the D3 rule's home. `findHueCollisions` (pure, exported) compares `accentHue` / `intentHue` on every Level. `Modal` and `AlertDialog` footers render a ButtonGroup. `src/buttonGroupRule.test.tsx` scans every story and the five samples; its limits are stated at the top of the file.
- `inverse` stays: it is the solid ink fill that `secondary` no longer is.

## Phase 2 — 2026-10-15

| ID | Decision | Pick | Evidence / notes |
|---|---|---|---|
| D6 | Selected, hover and cursor | **Both, by context.** Multi-select collections (inbox rows, table rows, selected kanban cards) use **D6-B**: an opaque accent-primary tint, ≥3:1 against base. Single "current" selections (nav item, SegmentedControl, active filter, calendar's selected day) use **D6-C**: a solid accent fill with inverse text. Fix B's two board failures: text on a tinted row is primary ink, and the cursor is an outline, not a glyph | WCAG 1.4.11 (selected ≥3:1; hover is supplemental). Board: B tint 3.26 / 3.34:1; C fill 10.85 / 5.99:1 |
| D7 | Skeleton | **D7-B**: diagonal `//` hatch on sunken | Hatch against sunken 7.64 / 6.16:1. NN/g: skeletons convey structure |
| D8 | Tints | **Diverge per level.** Midnight uses **D8-B**: a 20% opaque tint (lowest role 4.81:1). Sketch uses **D8-A**: 12% (lowest 4.57:1). **D8-C** (edge only, no fill) is the alternative for **lower-priority or tentative** items: tentative or declined events, background tasks, low-priority issues | Owner: "Both themes do not need the same decisions." ADR 0003 levels are independently authored. Every role passes 4.5:1 on its own level's tint |
| D9 | Categorical colour and accessibility | **A preference axis plus a menu.** A runtime Preference axis, orthogonal to Level, set as `data-a11y-*` attributes: `motion`, `contrast`, `colour-vision` (one value, "patterns") and `link-underline`. Each is system / on / off and defaults to the OS signal where one exists. Preferences are stored per device, with an adapter for account sync. Delivered as `A11yPreferencesProvider`, a no-flash init script, and a menu beside the theme picker. Glyphs appear only under "patterns", and series labels or legend text are always present. The palette is the D9-A 6-hue `series` group | `a11y-preferences-research.md`. WCAG 1.4.1 plus the conformance "alternate version" route. Precedents: GitHub, Discord, Apple. csswg #7406 and #10335 (there is no CVD media query) |
| D10 | Syntax and editor | **D10-C as the base** (today's 4 hues plus non-colour channels). A and B were judged off-theme. The owner allows "specific differentiation"; those options go to a second-round board | ED-F01/F06 |
| P3 tab close | Closable tab × | **Expose it as a button**: "Close <file>", beside the tab rather than nested in it, in the accessibility tree and Tab order | APG deletable tabs; voice-control users need a nameable target |

### P3 tab close — as built

- The × is a real button named `Close <label>` (or `closeLabel`), beside the `role="tab"` and not inside the `role="tablist"`. A first attempt put it in a `role="presentation"` frame next to the tab; axe still failed `aria-required-children` on the tablist ("children which are not allowed: button"), because a presentational wrapper is transparent and a focusable named button beneath a tablist is not a tab. So `TabsList` renders a `tabs-close-layer` beside the tablist, and each closable tab portals its button into it, laid over the tab's trailing edge (measured, and kept current by a `ResizeObserver`). Consequence: the button mounts after hydration, so server HTML carries the tab without it.
- It is in the accessibility tree for every tab. Only the selected tab's control is a Tab stop, right after the roving tab, so a strip costs one extra stop. `Delete` on a focused tab is unchanged. The target is 24px (WCAG 2.5.8).
