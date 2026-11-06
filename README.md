# 🎨 @rtkelly13/design-system

The foundational visual design system for **ryankelly.dev** and every personal surface that has
to look like it. Built around a **brutalist / neon-terminal** aesthetic: hard edges, zero
border-radius, offset shadows, and two themes — `midnight`, neon on blue-black, and `sketch`,
warm paper and pen ink.

## This is a multi-surface system, and that is the foundational decision

**A colour originates exactly once**, as a literal in
[`src/theme/levels.ts`](./src/theme/levels.ts). Every consumable form is *generated* from it
and verified against it in CI. Nothing else may hold a colour literal — not a website, not a
video composition, not a graphic generator, not an editor theme.

| Surface | Form | State |
|---|---|---|
| **Websites** | Tailwind v4 tokens via generated `theme.css` | ships today |
| **Design tokens** | `tokens/palette.<level>.tokens.json`, DTCG 2025.10, OKLCH | ships today |
| **Developer themes** | VS Code · Zed · Shiki · Neovim · JetBrains, and a terminal's 16 ANSI slots | designed, blocked on a hue vocabulary |
| **Graphics** | generated diagrams, charts, ASCII-art panels | forked in the consumer — to be reclaimed |
| **Video** | Remotion frames at 1080p, where a 16px web type scale is wrong | groundwork only |

Two decisions carry this, and they are worth reading before changing anything about colour:

- [**ADR 0002 — One source of colour decisions, many emitted surfaces**](./docs/adr/0002-one-source-many-emitted-surfaces.md).
  The root decision. Why per-surface palettes, manual ports and a runtime theming service were
  all rejected, and why the source is TypeScript rather than JSON.
- [**ADR 0003 — Two Levels, each independently authored**](./docs/adr/0003-two-levels-independently-authored.md).
  `midnight` and `sketch`, neither derived from the other. Neither is named for its polarity,
  which is what keeps `Polarity` a real declared property.
- [**ADR 0001 — Hues are declared below Roles**](./docs/adr/0001-hues-declared-below-roles.md).
  Components address a colour by its **job** (`accent.primary`), never its appearance (`cyan`).
  But a terminal has sixteen positions named by colour and no concept of a keyword — so a hue
  vocabulary is declared *underneath* the role vocabulary. Half the surfaces above cannot exist
  without it.

[`docs/theme-taxonomy.md`](./docs/theme-taxonomy.md) is the full matrix: what every Level must
declare, which target needs which group, what is generated, and which gate covers each.

Published to the public **npm registry** as `@rtkelly13/design-system` (via npm trusted publishing — see `.github/workflows/publish-package.yml`).

**📖 Browse it: [design-system.ryankelly.dev](https://design-system.ryankelly.dev)** — the
full Storybook, with the blog's own Storybook composed into the sidebar. Unreleased work
lands at [preview.design-system.ryankelly.dev](https://preview.design-system.ryankelly.dev)
(the `preview` branch). Domains are declared in `rtkelly13/shared-utilities` at
[`infra/vercel/`](https://github.com/rtkelly13/shared-utilities/tree/main/infra/vercel);
see [AGENTS.md](./AGENTS.md#-hosted-storybook).

---

## 📸 Visual Regression Layer

The design system incorporates a **Playwright Visual Snapshot Testing Layer** matching the architecture of **ryankelly.dev**:

- **Framework**: Playwright snapshot engine (`playwright.config.ts` & `tests/visual.spec.ts`).
- **Isolation**: Runs against static Storybook builds (`http://localhost:6006`).
- **Precision**: `maxDiffPixelRatio: 0.002` (0.2% max pixel tolerance).
- **Platform Integrity**: Executed strictly on Linux CI runners to prevent macOS / Windows font rendering variations.

```bash
# Run visual regression suite locally:
pnpm test:visual

# Update visual snapshots:
pnpm test:visual:update
```

### Capturing this package deterministically

If you screenshot, print, or render outside a live browser session, three switches decide whether
you get the same output twice:

```tsx
<ThemeProvider defaultLevel="midnight" scoped>   {/* 1. no storage, no matchMedia, no documentElement */}
```

```ts
await document.fonts.ready;                       // 2. or you capture the fallback face
// 3. suppress transitions:
// *, *::before, *::after { transition: none !important; animation: none !important }
```

`scoped` is the one that does the work — `persist={false} followSystem={false}` look like the
determinism controls and are redundant under it. Full reasoning in
[`docs/deterministic-rendering.md`](./docs/deterministic-rendering.md).

---

## 📦 Installation & Prerelease Testing

### Stable Release

```bash
pnpm add @rtkelly13/design-system
```

No registry configuration needed — it's a public npm package.

### Dev Prerelease Testing

Comment `/publish-dev` on a Pull Request and CI publishes that branch as
`<version>-dev.<pr>.<short-sha>` under the `dev` dist-tag:

```bash
pnpm add @rtkelly13/design-system@dev          # latest dev build
pnpm view @rtkelly13/design-system dist-tags   # exact versions per PR
```

---

## ⚡ Usage & Setup

### 1. Import Stylesheet & Theme Provider

In your app entrypoint (`_app.tsx`, `main.tsx`, or `layout.tsx`):

```tsx
import '@rtkelly13/design-system/styles.css';
import { ThemeProvider, Button, Card, PageTitle, Badge, Divider } from '@rtkelly13/design-system';

export function App() {
  return (
    <ThemeProvider defaultLevel="midnight">
      <main style={{ padding: '2rem' }}>
        <PageTitle subtitle="Foundation Design System Surface">
          [ MY APPLICATION ]
        </PageTitle>

        <Card>
          <Badge accent="primary">v1.2.0 ACTIVE</Badge>
          <p style={{ margin: '1rem 0' }}>
            Brutalist UI surface shared across all projects.
          </p>
          <Button bracketed variant="pink">
            EXECUTE ACTION
          </Button>
        </Card>

        {/* The mark follows the level's polarity: a terminal rule on the dark
            rungs, a hand-ruled pencil dash on the light ones. */}
        <Divider />
      </main>
    </ThemeProvider>
  );
}
```

---

### 2. Tailwind CSS v4 token contract

Import the theme contract in your CSS entrypoint. It ships the `@theme` tokens,
one `[data-theme]` block per level, the per-level and polarity variants, and an
`@source` directive — that last one is load-bearing, because Tailwind v4 skips
`node_modules` during content detection and would otherwise generate none of the
utilities the compiled components use:

```css
@import "tailwindcss";
@import "@rtkelly13/design-system/theme.css";
```

`theme.css` is **generated** from `src/theme/levels.ts`, which is the single place
any level name or colour is written.

`styles.css` = `theme.css` + `prose.css` + web-font imports + opinionated global
resets (zero border-radius everywhere, base typography). Import that, or compose
the pieces yourself — but not both.

**Peer requirements.** `tailwindcss` v4 for either stylesheet, and
`@tailwindcss/typography` if you import `prose.css`, which loads it as a
`@plugin`. Both are optional peers: a Tailwind plugin resolves from *your*
`node_modules` at your build time, so neither can be bundled.

### 3. Semantic tokens

Address **roles**, not hues. Each rung of the ladder declares its own mapping of
these roles, so a component that hard-codes `cyan` cannot be rethemed without
editing the component. Every pair is contrast-audited on every level by
`pnpm check:contrast`, which gates CI.

| Role group | Tokens | Use for |
|---|---|---|
| `--ds-accent-*` | `primary`, `secondary`, `tertiary`, `quiet` | Visual hierarchy |
| `--ds-intent-*` | `info`, `success`, `warning`, `danger` | Communicated meaning |
| `--ds-surface-*` | `base`, `raised`, `sunken`, `overlay` | Background elevation |
| `--ds-text-*` | `primary`, `secondary`, `muted`, `inverse` | Text prominence |
| `--ds-border-*` | `strong`, `default`, `subtle` | Rule weight |
| `--ds-font-*` | `display`, `body`, `mono`, `pixel` | Typography roles |

```tsx
import { Badge, Tag, accentVar, semanticTokens } from '@rtkelly13/design-system';

<Badge accent="primary">HIERARCHY</Badge>
<Tag text="deprecated" accent="danger" />          {/* meaning, not colour */}
<div style={{ borderColor: accentVar('secondary') }} />
<div style={{ background: semanticTokens.surface.raised }} />
```

Tailwind aliases are generated too: `text-accent-primary`, `bg-surface-raised`,
`border-edge-subtle`, `text-intent-danger`.

The legacy palette names (`'cyan' | 'pink' | 'yellow' | 'green'`) still resolve to
identical values, so existing call sites keep working — but they are deprecated.

---

## 📚 Documentation Portal

A complete chrome kit for MDX documentation sites.

```tsx
import {
  DocsLayout, DocsHeader, DocsSidebar, TableOfContents,
  Breadcrumbs, DocPager, Prose, CodeBlock, CodeTabs, CodeTab, AnchorHeading,
  DocsLinkProvider, mdxComponents,
} from '@rtkelly13/design-system';
import '@rtkelly13/design-system/prose.css';
```

**Every section is addressable.** Headings render through `AnchorHeading`, which gives
each one a `#slug` id and a hover affordance that copies the *absolute* URL including
the hash — the thing you actually paste into a ticket.

**The header is durable.** `DocsHeader` is sticky and measures its own height into
`--docs-header-height`. That single value feeds `scroll-padding-top`, the
`scroll-margin-top` on every heading, and the scroll-spy reading line — so anchors
never land underneath the bar, at any viewport width.

**Bring your own router.** Wrap the app in `DocsLinkProvider` and all chrome navigation
goes through it instead of hard-navigating:

```tsx
import { Link } from 'react-router-dom';

<DocsLinkProvider component={({ href, ...props }) => <Link to={href} {...props} />}>
  <App />
</DocsLinkProvider>
```

**Code tabs switch together.** `CodeTabs` is the language / package-manager
switcher: a real `tablist` with arrow-key traversal. Blocks sharing a `group`
switch as one and the choice persists across pages, so a reader picks `pnpm`
once. Fenced blocks inside a `CodeTab` attach to the strip automatically.

**One MDX mapping.** `mdxComponents` maps `h1`–`h6` → anchored headings, `pre` →
`CodeBlock`, `a` → router-aware links, and exposes `NoteBlock` / `TLDR` / `Card` /
`Tag` to MDX authors. Pass it to any MDX provider so every site renders Markdown
identically.

`prose.css` styles the bare tags a Markdown pipeline emits (`ul`, `ol`, `table`,
`blockquote`, `hr`, inline `code`, task lists), plus GitHub alert syntax
(`> [!NOTE]`) as produced by `remark-github-blockquote-alert`, and code titles from
`remark-code-title`. It is plain CSS on purpose: the docs chrome is layout-critical,
and Tailwind v4 skips `node_modules` in automatic content detection, so a
misconfigured `@source` would half-break a sidebar rather than fail loudly.

---

## 🛠 Repository & Publishing

- **Repository**: `https://github.com/rtkelly13/design-system`
- **npm**: `@rtkelly13/design-system` on `https://registry.npmjs.org`
- **CI Pipelines**:
  - `ci.yml`: Typecheck, package build, Storybook build, and Linux visual regression testing.
  - `publish-package.yml`: npm publishing (stable on main, dev prereleases via dispatch).
  - `publish-dev-command.yml`: `/publish-dev` PR comment handler.
  - `update-snapshots.yml`: On-demand visual snapshot regeneration.
