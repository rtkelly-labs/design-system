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

# machine.design.md — machine-readable token specification

This file provides machine-readable token definitions for programmatic parsers, CLI utilities (e.g. `stitch upload design machine.design.md`), and automated design-to-code pipelines.

Human editorial judgment, layout composition rules, and negative guardrails are documented in [`design.md`](./design.md).
