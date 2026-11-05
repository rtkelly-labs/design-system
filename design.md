---
version: "1.0"
name: "@rtkelly-labs/design-system"
description: "Brutalist neon terminal and architectural drafting table design system for rtkelly labs (oxbow, rig, Diffra, docs, blog)."
themes:
  default: "midnight"
  supported: ["midnight", "sketch"]
colors:
  midnight:
    canvas: "#0a0a1a"
    surface_base: "#0a0a1a"
    surface_raised: "#121316"
    surface_sunken: "#0c0d0f"
    text_primary: "#f1f5f9"
    text_secondary: "#94a3b8"
    text_muted: "#64748b"
    border_strong: "#334155"
    border_default: "#1e293b"
    border_subtle: "#172033"
    accent_primary: "#34d399" # Teal
    accent_secondary: "#22d3ee" # Cyan
    accent_warning: "#facc15" # Amber
    accent_danger: "#ff586e" # Red
  sketch:
    canvas: "#f5f3ec"
    surface_base: "#f5f3ec"
    surface_raised: "#ffffff"
    surface_sunken: "#eceae0"
    text_primary: "#14171a"
    text_secondary: "#4b5563"
    text_muted: "#646a73"
    border_strong: "#2b2d2f"
    border_default: "#d4d0c5"
    border_subtle: "#e5e2d6"
    accent_primary: "#006859" # Dark Teal
    accent_secondary: "#006675" # Dark Cyan
    accent_warning: "#974503" # Ochre
    accent_danger: "#bd0010" # Ink Red
typography:
  display: "Space Grotesk, sans-serif"
  body: "Inter, sans-serif"
  mono: "IBM Plex Mono, JetBrains Mono, monospace"
  pixel: "VT323, monospace"
rounded:
  none: "0px"
  sm: "0px"
  md: "0px"
  lg: "0px"
  full: "0px"
elevation:
  shadow_sm: "2px 2px 0 0 var(--ds-shadow-color)"
  shadow_md: "4px 4px 0 0 var(--ds-shadow-color)"
  shadow_lg: "6px 6px 0 0 var(--ds-shadow-color)"
spacing:
  unit: "4px"
  density: "compact"
---

# design.md — rtkelly labs visual specification

This document is the agent contract and brand specification for `@rtkelly-labs`. It provides autonomous coding agents (Claude Code, Cursor, Codex, Google Stitch) with the structural rules, visual constraints, and design tokens required to generate and implement on-brand interfaces across the product estate (`oxbow`, `rig`, `Diffra`, `docs`, `blog`).

---

## 1. Product Feel & Identity

The visual language is **Brutalist Neon Terminal** (`midnight` dark default) meets **Architectural Drafting Table** (`sketch` warm paper light).

* **Density:** High. Favor compact data presentations, technical grids, and dense command surfaces over sprawling whitespace.
* **Structural Edges:** Edges are razor-sharp and drawn with high contrast. Never imply boundaries with background gradients; draw them with 1px or 2px solid rules.
* **Tone:** Terse, technical, operational. Controls state exact verbs (`EXECUTE`, `DIFF`, `DISPATCH`). Section headers use bracketed uppercase monospace (`[ 01 // OVERVIEW ]`, `[ PR-104 // TRIAGE ]`).
* **Metaphor:** The interface should read like a CRT debugger cockpit or a mechanical drafting blueprint, not a modern consumer SaaS app.

---

## 2. Two Independent Themes (The Theme Ladder)

Do not treat themes as an inverted "light and dark" switch. Neither theme is derived from the other:

1. **`midnight` (Default Dark):**
   * Neon accents on deep slate/blue-black ground (`#0a0a1a`).
   * High-chroma technical accents (Teal `#34d399`, Cyan `#22d3ee`, Pink `#f955a4`).
2. **`sketch` (Warm Paper Light):**
   * Deep graphite ink on warm drafting vellum paper (`#f5f3ec`).
   * Pen-colored accents (India ink `#14171a`, 2H pencil `#646a73`, technical ochre `#974503`).

---

## 3. Token-Based Roles (Never Hardcode Hues)

Components must address **semantic roles**, never raw color hues or arbitrary hex values:

* **Surfaces:**
  * `bg-surface-base`: The root page canvas.
  * `bg-surface-raised`: Floating panels, cards, menus, dialogs.
  * `bg-surface-sunken`: Wells, code blocks, input fields, recessed panels.
* **Text / Ink:**
  * `text-content-primary`: High-contrast body text and headings.
  * `text-content-secondary`: Subtitles and labels.
  * `text-content-muted`: Metadata, timestamps, bracket markers.
* **Borders:**
  * `border-edge-strong`: Load-bearing structural 2px frames and active cards.
  * `border-edge-default`: Standard 1px dividers and cards.
  * `border-edge-subtle`: Hairline grid rules.
* **Accents & Intents:**
  * Accents (`accent-primary`, `accent-secondary`): Carries emphasis, not status.
  * Intents (`intent-info`, `intent-success`, `intent-warning`, `intent-danger`): Carries operational status.

---

## 4. Component Construction Rules

### A. Containers & Cards
* **Radius:** Strictly `rounded-none` / `border-radius: 0`. No rounded corners under any circumstance.
* **Borders:** 2px solid (`border-2 border-edge-strong`) for interactive cards; 1px solid (`border border-edge-default`) for layout grids.
* **Drop Shadows:** Brutalist hard-offset box shadows with **0px blur radius**:
  * Default: `box-shadow: 2px 2px 0 0 var(--ds-shadow-color)`
  * Elevated: `box-shadow: 4px 4px 0 0 var(--ds-shadow-color)`
  * *Never* use diffuse, blurred shadows (`box-shadow: 0 4px 6px ...`).

### B. Typography & Headers
* **Display / Top Headings (h1, h2):** Set in `Space Grotesk`, uppercase, extrabold, with subtle letter-spacing. Use bottom border underlines (`border-b-2 border-edge-strong`).
* **Section Markers & Badges:** Monospace `IBM Plex Mono` enclosed in square brackets: `[ LATEST POSTS ]`, `[ 01 // SYSTEM METRICS ]`.
* **Body Text:** Set in `Inter`, highly legible, 1.5 line height.
* **Code & Tabular Numbers:** `IBM Plex Mono` / `JetBrains Mono`. Tables must always use tabular figures for alignment.

### C. Buttons & Controls
* **Buttons:** Zero radius (`rounded-none`), uppercase monospace or display font, 2px solid borders.
  * Primary: High-contrast solid accent or inverted background (`bg-accent-primary text-content-inverse`).
  * Secondary / Ghost: 1px/2px border with hover inversion (`hover:bg-accent-primary hover:text-content-inverse`).
* **Form Inputs:** Hard edges, `bg-surface-sunken`, 1px solid `border-edge-strong`, high-contrast focus rings with 0px radius (`focus:outline-2 focus:outline-accent-primary focus:outline-offset-2`).

### D. Data Presentation & Tables
* Full available container width.
* Explicit column headers formatted in uppercase monospace.
* Row borders using `border-b border-edge-default`.
* Row hover states using `hover:bg-surface-raised` or accent hairline.

---

## 5. Strict Do's and Don'ts (Negative Guardrails)

* ❌ **DON'T** use border-radius (`rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full`). All shapes must be razor-sharp rectangles.
* ❌ **DON'T** use soft, blurry drop shadows (`shadow-md`, `shadow-lg`, blurred rgba glows).
* ❌ **DON'T** use pastel gradients, mesh backgrounds, or multi-color linear gradient buttons.
* ❌ **DON'T** default to Inter-on-white with indigo accents (the standard generic SaaS template).
* ❌ **DON'T** use emoji as section markers or bullet icons. Use ASCII glyphs (`>`, `[+]`, `✓`, `•`) or monospace brackets (`[ METRIC ]`).
* ❌ **DON'T** hardcode arbitrary Tailwind color classes (`bg-blue-500`, `text-purple-400`). Use semantic role tokens (`bg-surface-raised`, `text-accent-primary`).
* ✅ **DO** verify designs in both `midnight` (neon on dark slate) and `sketch` (ink on warm paper).
* ✅ **DO** keep information density compact, structured, and legible for developer workflows.
* ✅ **DO** ensure high contrast: all text-to-ground pairs must clear WCAG AA (4.5:1) floor minimums.
