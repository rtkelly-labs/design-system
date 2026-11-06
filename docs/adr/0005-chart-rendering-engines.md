# ADR 0005 — Rendering-only engines for chart geometry

## Status

Accepted

## Context

The design system needs both composed charts (axes, grids, responsive sizing and custom SVG
geometry) and dense KPI indicators that fit inside a table cell or `StatCard`. One chart library
does not provide both authoring surfaces without making one of them carry unnecessary layout and
interaction machinery.

## Decision

The repository has one interaction-primitive library: `@base-ui/react`. Chart rendering engines
are a separate layer and may be more than one when each has a bounded job:

- `@visx/*` is for composed or responsive charts whose geometry, axes, grids or tooltip position
  are authored by this package (`BarChart`, `Sparkline`, `ChartTooltip`).
- `@microcharts/react` is for fixed-size, word-sized KPI indicators with a complete chart grammar
  (`BulletChart`).

Neither engine may own focus management, keyboard handling, popups or application interaction.
The design-system component owns the semantic wrapper, labels and event contract. A new engine
needs a component-level fit comparison and a manifest rationale; adding a second engine for a
chart that fits the existing boundary is not justified by size alone.

## Consequences

This keeps the Base UI decision about interaction semantics while allowing chart-specific geometry
to remain small and deterministic. It adds dependency and bundle cost, so each engine must remain
limited to its declared surface and its visual stories must cover both `midnight` and `sketch`.
