---
version: "1.0"
name: "@rtkelly-labs/design-system"
description: "Machine-readable design tokens for Google Stitch CLI and automated parsers for rtkelly labs."
themes:
  default: "midnight"
  supported: ["midnight", "sketch"]
colors:
  midnight:
    canvas: "#0a0a1a"
    surface_base: "#0a0a1a"
    surface_raised: "#14142a"
    surface_sunken: "#050510"
    text_primary: "#ffffff"
    text_secondary: "#c3c3d4"
    text_muted: "#9d9db4"
    border_strong: "#ffffff"
    border_default: "#9d9db4"
    border_subtle: "#33334d"
    accent_primary: "#22d3ee" # Cyan
    accent_secondary: "#facc15" # Yellow
    accent_tertiary: "#f955a4" # Pink
    accent_quiet: "#8b8ba3"
    intent_info: "#38bdf8"
    intent_success: "#39ff14"
    intent_warning: "#ff8c00"
    intent_danger: "#ff586e"
  sketch:
    canvas: "#f5f3ec"
    surface_base: "#f5f3ec"
    surface_raised: "#ffffff"
    surface_sunken: "#efeadf"
    text_primary: "#23262e"
    text_secondary: "#33373f"
    text_muted: "#5c5546"
    border_strong: "#23262e"
    border_default: "#8f8672"
    border_subtle: "#c8c3b4"
    accent_primary: "#1450d7" # Blue
    accent_secondary: "#006b2e" # Green
    accent_tertiary: "#bd0010" # Red
    accent_quiet: "#6a6252"
    intent_info: "#1450d7"
    intent_success: "#006b2e"
    intent_warning: "#974503"
    intent_danger: "#bd0010"
typography:
  display: 'Space Grotesk, Inter, "Symbols Nerd Font Mono", "DS Symbols", sans-serif'
  body: 'Inter, "Symbols Nerd Font Mono", "DS Symbols", sans-serif'
  mono: '"IBM Plex Mono", "Symbols Nerd Font Mono", "DS Symbols", "Courier New", monospace'
  pixel: 'VT323, "Symbols Nerd Font Mono", "DS Symbols", monospace'
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

# machine.design.md — machine-readable token specification

This file provides machine-readable token definitions for programmatic parsers, CLI utilities (e.g. `stitch upload design machine.design.md`), and automated design-to-code pipelines.

Human editorial judgment, layout composition rules, and negative guardrails are documented in [`design.md`](./design.md).
