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
