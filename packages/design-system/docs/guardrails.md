# Design System Guardrails & Agent Steering Contract

See [Root Documentation](../../docs/guardrails.md) for full details.

This document records the automated guardrail architecture for `@rtkelly-labs/design-system`:
- **Filesystem Governance**: `.ls-lint.yml` closed allowlist banning rogue `.css` files (`.css: exists: 0`).
- **Semantic AST Linters**: `@shadcn/lint` enforcement (`no-restyle`, `no-raw-colors`, `no-arbitrary-values`, `no-inline-styles`).
- **3-Tier Escape Hatch System**:
  - Tier 1: `src/styles/escape-hatches/` filesystem container.
  - Tier 2: `allow: ["layout"]` component contract.
  - Tier 3: In-code `// eslint-disable-next-line ... -- ESCAPE_HATCH(<domain>): <explanation>`.
- **Estate Verification Tool**: `scripts/check-design-system-guardrails.mjs`.
