# Design System Guardrails & Agent Steering Contract

> **Target Package:** `@rtkelly-labs/design-system`  
> **Status:** Estate Standard  
> **Enforcement Engines:** `ls-lint` (Filesystem), `@shadcn/lint` & ESLint (AST & Semantic), `check-design-system-guardrails` (CI Verifier)

This document defines the automated guardrails that prevent UI erosion and style drift when autonomous coding agents (Claude Code, Cursor, Codex, Google Stitch) implement frontend features across the `@rtkelly-labs` estate (`rig`, `blog`, `hearth`, `ynab-budget-companion`, `docs`, `design-system`).

---

## 1. The Design System Contract

When an agent writes UI in this estate, it must conform to these non-negotiable foundations:

1. **Package Scope & Registry**:
   * Always depend on `@rtkelly-labs/design-system` (published on npm).
   * Never use legacy scopes (`@rtkelly13/design-system`) or brittle relative file links (`file:../../...`).
2. **Dual-Theme Ladder**:
   * Two independent rungs: **`midnight`** (dark slate/neon terminal default) and **`sketch`** (warm architectural drafting paper).
   * Themes are not an inverted light/dark flip. Every view must resolve through semantic role tokens (`--ds-*`).
3. **Zero Border Radius**:
   * Strictly 0px radius (`rounded-none`). No `rounded-sm`, `rounded-md`, `rounded-lg`, or `rounded-full`.
4. **Load-Bearing Edges & Hard Shadows**:
   * Razor-sharp 1px or 2px solid borders.
   * Offset box shadows have **0px blur radius** (`2px 2px 0 0`, `4px 4px 0 0`). No soft or diffuse drop shadows.
5. **Semantic Role Tokens**:
   * Surfaces: `bg-surface-base`, `bg-surface-raised`, `bg-surface-sunken`.
   * Borders: `border-strong`, `border-default`, `border-subtle`.
   * Accents: `text-accent-primary`, `text-accent-secondary`, `text-accent-tertiary`.
   * No raw Tailwind color classes (e.g. `bg-blue-500`, `text-purple-400`, `bg-zinc-900`) and no hex literals.

---

## 2. Guardrail 1: Outright Ban on `.css` Files via `ls-lint`

### Why `ls-lint`?
When an AI agent is asked to build a custom component, its default instinct is to create `ComponentName.css` or dump ad-hoc rules into `index.css`/`App.css`. This quickly introduces un-tokenized CSS, custom border radii, and styling drift.

`ls-lint` is a fast static Go binary that inspects the filesystem in under 15 milliseconds.

> [!IMPORTANT]
> **No `dlx` policy:** Running via `pnpm dlx` is strictly prohibited across the estate due to cold network roundtrips, floating untracked versions, and CI delays. Every consuming repository MUST declare `@ls-lint/ls-lint` in `devDependencies` (enforced as a peer dependency of `@rtkelly-labs/design-system`) and invoke it via `"lint:fs": "ls-lint"` or `pnpm exec ls-lint`.

### Configuration (`.ls-lint.yml`)
Every consumer repository enforces a closed allowlist that bans `.css` files across the repository, with exceptions granted only to the single designated entrypoint:

```yaml
# .ls-lint.yml
ls:
  # Ban .css globally
  .css: exists:0
  "**":
    .css: exists:0

  # Whitelist the single application entrypoint directory
  web:
    .dir: regex:.*
    app.src.css: regex:.*
    .*: exists:0

  # Strictly ban .css in components, layouts, or feature modules
  "web/components/**":
    .dir: regex:.*
    .tsx: regex:.*
    .ts: regex:.*
    .css: exists:0
    .*: exists:0

ignore:
  - .git
  - node_modules
  - dist
  - temp
  # Whitelisted single-entrypoint stylesheets:
  - web/app.src.css
  - src/styles/globals.css
```

---

## 3. Guardrail 2: AST & Semantic Checks via `@shadcn/lint`

`@shadcn/lint` provides an agent-first static analysis plugin designed for Tailwind CSS v4 design systems. It hooks directly into ESLint flat config (`eslint.config.mjs`) or Oxlint.

### Active Rules & Agent Feedback

```javascript
import { plugin as shadcn } from "@shadcn/lint";

export default [
  {
    plugins: { shadcn },
    rules: {
      // 1. Prevent restyling core design system components
      "shadcn/no-restyle": [
        "error",
        {
          "allow": ["layout"],
          "message": "Do not restyle @rtkelly-labs/design-system components with custom appearance classes. Use component variants or props."
        }
      ],

      // 2. Ban raw palette colors and hex literals
      "shadcn/no-raw-colors": [
        "error",
        {
          "message": "Raw colors (e.g. bg-blue-500, #hex) are banned. Use semantic tokens (e.g. text-accent-primary, bg-surface-raised, border-subtle)."
        }
      ],

      // 3. Ban arbitrary bracket values
      "shadcn/no-arbitrary-values": [
        "error",
        {
          "message": "Arbitrary bracket values (e.g. p-[13px], text-[0.82rem]) are banned. Use design system scale tokens."
        }
      ],

      // 4. Ban inline styles
      "shadcn/no-inline-styles": [
        "error",
        {
          "message": "Inline style={{ ... }} attributes are banned. Use Tailwind role classes or component props."
        }
      ],

      // 5. Catch typos and dead classes
      "shadcn/no-unknown-classes": "error",
      "shadcn/require-static-classes": "error"
    },
    settings: {
      shadcn: {
        ui: "@rtkelly-labs/design-system"
      }
    }
  }
];
```

---

## 4. Mechanisms for Escape Hatches

Guardrails without escape hatches cause agents to hallucinate workarounds, get stuck in infinite repair loops, or disable linters entirely. We define a 3-tier escape hatch model:

```
┌─────────────────────────────────────────────────────────────┐
│ Tier 1: Filesystem Escape Hatch (ls-lint)                   │
│         Designated folder: src/styles/escape-hatches/*.css  │
├─────────────────────────────────────────────────────────────┤
│ Tier 2: Linter Contract Exemption                           │
│         allow: ["layout"] on container boundaries           │
├─────────────────────────────────────────────────────────────┤
│ Tier 3: Code-Level Structured Justification                │
│         // eslint-disable-next-line ... -- ESCAPE_HATCH(...)│
└─────────────────────────────────────────────────────────────┘
```

### Tier 1: Filesystem Escape Hatch
When an application genuinely requires a raw CSS file (e.g. WebGL fragment canvas setup, Remotion video keyframe transitions, or complex 3rd-party integration):
1. The stylesheet must be placed exclusively in a designated directory: `src/styles/escape-hatches/`.
2. That directory is explicitly whitelisted in `.ls-lint.yml` `ignore:`.
3. Ad-hoc `.css` files directly adjacent to components remain strictly forbidden.

### Tier 2: Layout Contract Exemption
`@shadcn/lint` is configured with `allow: ["layout"]`.
* **Allowed on components**: `w-full`, `max-w-md`, `flex-1`, `col-span-2`, `mt-4`.
* **Banned on components**: `p-*`, `bg-*`, `text-*`, `rounded-*`, `border-*`.
* **Outcome**: Agents can compose components into layout grids without modifying internal appearance.

### Tier 3: Code-Level Escape Hatch with Mandatory Explanation
When an agent or developer must bypass a rule in JSX/TSX:
1. Every disable comment **MUST** include a structured reason tag:
   ```tsx
   {/* eslint-disable-next-line shadcn/no-arbitrary-values -- ESCAPE_HATCH(canvas): fixed aspect ratio required for 3D viewer */}
   <div className="h-[420px] w-full">
   ```
2. Any `eslint-disable` comment lacking `-- ESCAPE_HATCH(<domain>): <reason>` fails CI via `check-design-system-guardrails`.

---

## 5. Automated Verification: `check-design-system-guardrails`

To verify whether a consumer repository or new tool correctly enforces these guardrails, run the estate verifier:

```bash
# Verify the current repository
pnpm check:guardrails

# Verify any repository or target path
node scripts/check-design-system-guardrails.mjs --target /path/to/repo
```

### What It Asserts:
1. **Package Scope**: Validates `package.json` depends on `@rtkelly-labs/design-system` (and flags `@rtkelly13/*` or `file:...` paths).
2. **Filesystem Governance**: Validates `.ls-lint.yml` exists and declares `.css: exists: 0`.
3. **CSS Confinement**: Scans the filesystem to ensure zero rogue `.css` files exist outside approved entrypoints or escape-hatch folders.
4. **Negative Guardrails**: Scans TSX/JSX for forbidden classes (`rounded-*`, raw hex colors, arbitrary brackets) unless accompanied by a valid `-- ESCAPE_HATCH(...)` annotation.
5. **Escape Hatch Syntax**: Verifies all suppression comments adhere to the structured format.
