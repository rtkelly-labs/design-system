# DESIGN.md — the brand outline

> **Canonical Source:** [`packages/design-system/DESIGN.md`](./packages/design-system/DESIGN.md)  
> **Storybook Guide:** Served in Storybook under `Guides/DESIGN.md` via `packages/design-system/src/stories/guides/Design.mdx`.  
> **Tokens:** `packages/design-system/tokens/palette.<level>.tokens.json`

**@rtkelly-labs/design-system** · the foundational visual language for rtkelly labs (`@rtkelly-labs`):
engineering tooling (`oxbow`, `rig`, `Diffra`), documentation portals (`docs.ryankelly.dev`),
technical publications (`ryankelly.dev`), terminal interfaces, and agent-generated presentation layers.

This file is the portable form of the brand, adhering to the `design.md` agent contract. It is written for an autonomous coding agent or engineer arriving with no context and asked to make something that looks like the rest of the estate.

---

## 1. The Character, in One Paragraph

**Brutalist neon terminal.** Hard edges and no rounding at all (`rounded-none`). Offset drop shadows that sit beside an element rather than blurring under it (`2px 2px 0 0`, `4px 4px 0 0`). Monospace and condensed display type. Bracketed labels — `[ LATEST POSTS ]`, `[ PR-104 ]`, `> FULL_STACK_ENGINEER.exe`. High-chroma accents on a near-black ground, or ink on warm paper. It should read as a CRT and an architectural drafting table, not as a SaaS dashboard.

**What it is not:** soft shadows, blurred glows, rounded cards (`rounded-md`, `rounded-lg`), Inter-on-white, an indigo accent, glassmorphism, emoji as section markers. If a generated design drifts toward any of those, it has regressed to the mean and is wrong.

---

## 2. Two Themes, Not a Light-and-Dark Pair

There are exactly two, and **neither is derived from the other** (ADR 0003):

| Level | `data-theme` | Character |
| :--- | :--- | :--- |
| **Midnight** | `midnight` | Neon on blue-black `#0a0a1a`. High-chroma accents. The signature, and the default. |
| **Sketch** | `sketch` | Warm paper `#f5f3ec`, graphite ink, pen-coloured accents. Not the dark theme lightened; a different drawing. |

* The levels are deliberately **not** named `dark` and `light`. `midnight` names a ground and `sketch` names a surface and a way of drawing on it.
* Both `midnight:` and `sketch:` variants exist alongside Tailwind's `dark:` and `light:`.

---

## 3. Colour is Addressed by Job, Never by Appearance

The single most important rule: **A component addresses Roles, never Hues.**
* Write: `bg-surface-raised`, `text-intent-danger`, `border-edge-strong`.
* Never write: `cyan`, `bg-red-500`, or raw hex.

```
Components  ──►  Roles (surface, text, border, accent, intent)  ──►  Hues (palette)
Components  ──✗──►  Hues (a Hue in component code is a defect)
```

---

## 4. Non-Negotiable Form Constraints

1. **Radius:** Zero everywhere. Non-negotiable. All containers, inputs, and buttons must use `rounded-none`.
2. **Shadows:** Hard offsets, never blurred (`2px 2px 0`, `4px 4px 0`, `6px 6px 0` in `--ds-shadow-color`).
3. **Borders:** 2px is the load-bearing weight (`border-2 border-edge-strong`). Edges are drawn, not implied.
4. **Typography:**
   * Display: `Space Grotesk`
   * Body: `Inter`
   * Monospace: `IBM Plex Mono` / `JetBrains Mono`
   * Pixel: `VT323`

---

## 5. Agent Instructions for Building on this Brand

1. Read the token files, not memory, for values: `packages/design-system/tokens/palette.<theme>.tokens.json`.
2. Address Roles. If you find yourself writing a hue name in a component, stop.
3. Zero radius, hard offset shadows, 2px borders.
4. Always test both themes: `midnight` and `sketch`.
5. Run verification gates before concluding:
   - `node packages/design-system/scripts/check-contrast.mjs`
   - `node packages/design-system/scripts/check-docs.mjs`
   - `node packages/design-system/scripts/check-fonts.mjs`
