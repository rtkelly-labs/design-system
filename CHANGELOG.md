# Changelog

Pre-1.0 and moving fast. **Every minor may break.** There are two consumers —
`rtkelly13/blog` and this package's own Storybook — both in the same estate and
migrated in the same change, so compatibility between 0.x versions buys nothing
and is not attempted: no deprecation shims, no alias layers, no staged removals.

Proper release notes start at 1.0. Until then this file records only what a
consumer has to *do*, newest first. The reasoning lives in the pull requests and
in [`docs/adr/`](./docs/adr/).

## 0.7.0

The primitive layer, and four new gates.

### You have to do something

- **`@base-ui/react` is a runtime dependency.** Nine packages, all MIT. `Input`, `TextArea` and
  `Select` are built on its `Field` instead of a hand-rolled `useField()`; the props are unchanged.
  It is now the *only* permitted primitive library — rule 4 in `AGENTS.md` — which bars `radix-ui`
  and anything depending on it, `cmdk` included.
- **`BracketText` no longer accepts `accent="white"`.** Omit `accent` for the default ink. It was an
  appearance name in a component API, which ADR 0001 exists to prevent, and it outlived the hue
  vocabulary #138 removed because the union named it explicitly.
- **`AdminNavItem.icon` and `AdminStatusBadge.icon` take a component, not an element** —
  `LayoutDashboard`, never `<LayoutDashboard size={18} />`. Size travels as a `className`. This
  matches `PageHeader`, `StatCard` and `DocsHeader`, and it is what stopped Storybook's source
  generator throwing on those stories.

### Rendering changed

- **Code blocks are `text.primary`, not `intent.success`.** Every code block rendered in the
  "this worked" green, contradicting the `--tw-prose-pre-code` mapping eleven lines above it.
  6.02:1 → 13.63:1 on `sketch`.
- **`Modal` is above the docs header.** It was `z-50` against the header's `z-index: 60`, so a
  dialog painted *under* the page chrome it covers. Both now read the `--ds-layer-*` scale.
- **Three touch-device affordances stopped being dimmed.** `.docs-anchor-link`,
  `.docs-codeblock-copy` and `.docs-sidebar-link-static` addressed `text.muted` instead of an
  `opacity` on `text.primary` — 3.45:1 and 2.64:1 on `sketch`, permanently, on every touch device.
  `opacity` changes the foreground *after* `check:contrast` reads it.

### New

- **`Swatch` and `SwatchGroup`** — the package can draw its own palette outside a story file.
- `accentFillClass()`, joining `accentTextClass()` / `accentFocusClass()` / `accentHoverEdgeClass()`.
  All four accent-to-class maps are now one, in `lib/accentClasses`.
- **Four gates**: `check:doc-snippets` (props and level names in documentation code fences against
  `api/index.d.ts`), `check:component-docs` (every component carries a JSDoc — a ratchet at 18),
  plus `motion.transitions` and `motion.keyframes` claims in `check:docs`.
- `docs/deterministic-rendering.md` — the three switches that decide whether a capture reproduces.
  `scoped` is the one that does the work; `persist={false} followSystem={false}` look like the
  determinism controls and are redundant under it.
- `docs/research.md` — the outside reading, and what each idea changed here.
- Interaction baselines: `button-hover`, `button-pressed`, `input-keyboard-focus`. The focus one is
  the assertion `focus-ring.test.ts` says it cannot make.

### Fixed

- The keyboard focus ring survives on `Input`, `TextArea`, `Tag`, `Modal` and `CodeTabs` —
  `focus:outline-none` at (0,2,0) was beating the global `:focus-visible` at (0,1,0).
- `DocsHeader` and `AdminDashboardLayout` render without a `ThemeProvider` instead of throwing.
- `SectionContainer` merges a caller's `className` instead of appending it, so a conflicting
  utility now wins.
- `accent.quiet` is audited as a fill. 220 contrast pairs → 222.
- The README's integration snippet passed a prop that does not exist.

### Also in this release, landed after 0.6.0 published

Terminal schemes, and the second axis.

- **Terminal / ANSI ships.** `terminal/rtk-{midnight,sketch}.{itermcolors,windows-terminal.json,alacritty.toml,ghostty.conf}` — eight files, exported and packed. Four encodings of one fan-out, which is why terminal was the cheapest Target left.
- `pnpm ansi:build` / `ansi:check`. The check is **slot coverage plus a committed fixture diff** — the two gates ADR 0001 says a fan-out map requires, since a wrong map emits confidently: a terminal renders an unfilled slot as the foreground rather than erroring.
- `ANSI_SLOTS`, `SLOTS`, `ansiScheme` are public. The fan-out is data, so it is unit-tested.
- `allowImportingTsExtensions` in `tsconfig.json`, so a module can be imported by both `tsc` and a plain `.mjs` emitter without a workaround.

The second axis. Geometry and time are declared for the first time; ADRs 0001–0004 are accepted.

- **`Medium`** — `web`, `video`, `graphic`. A unit system and a time base, chosen at build time
  by which artifact is being emitted, where a Level is chosen at runtime. **No token varies on
  both axes.** `src/theme/media.ts`.
- `theme.css` carries exactly one Medium, `web`: `--ds-space-*`, `--ds-type-*`,
  `--ds-leading-*`, `--ds-weight-*`, `--ds-stroke-*`, `--ds-elev-*`, `--ds-radius-*`,
  `--ds-duration-*`, `--ds-ease`, `--ds-layer-*`, `--ds-focus-*`. 274 → 336 properties.
- **Prefixes do not collide across axes.** `--ds-text-*` is ink and `--ds-type-*` is size;
  `--ds-border-*` is colour and `--ds-stroke-*` is width. Renamed before shipping, not after.
- **Radius is a token, not a reset.** `*, *::before, *::after { border-radius: 0 !important }`
  is gone; Tailwind's whole radius scale is redefined to the Medium's value, so `rounded-lg` is
  square without this package touching a consumer's document. Closes #54.
- **The contrast floor is Medium-keyed.** `pnpm check:contrast` defaults to the web floors;
  `--medium=video` enforces the stricter frame ones, which the current palette does **not**
  clear — deliberately, since no video artifact is emitted yet.
- `video` is not the web scaled: its type steps are its own and its motion is whole frames.
  `graphic` has no time base at all.

## 0.6.0

The hue vocabulary is gone from the component API. Nothing addresses a colour by
its appearance any more.

- `LegacyAccent`, `brutalistTokens`, and the `--color-brutalist-*`,
  `--color-black` and `--color-white` compat aliases are **deleted**. 540
  emitted custom properties down to 250.
- `accent` / `variant` props take Roles only: `primary`, `secondary`,
  `tertiary`, `quiet` and the four intents. `cyan` → `primary`,
  `yellow` → `secondary`, `pink` → `tertiary`, `green` → `success`.
- Tailwind utilities: `bg-brutalist-cyan` → `bg-accent-primary`,
  `text-brutalist-pink` → `text-accent-tertiary`,
  `text-brutalist-yellow` → `text-accent-secondary`,
  `text-brutalist-neonGreen` → `text-intent-success`.
- CSS variables: `var(--brutalist-cyan)` → `var(--ds-accent-primary)`. Do not
  keep a hue-named fallback — it will be a dark value applied on a light theme.
- `PageHeaderAccent`, `CardAccent`, `TagAccent` deleted; use `AccentToken`.
- **Added** a glow per role — `--shadow-glow-accent-tertiary` and friends —
  because the compat layer's `glow-cyan` / `glow-pink` / `glow-orange` had no
  role-named equivalent. `shadow-glow-cyan` → `shadow-glow-accent-primary`,
  `shadow-glow-pink` → `shadow-glow-accent-tertiary`,
  `shadow-glow-orange` → `shadow-glow-accent-secondary`. Hard shadows were
  already role-named; the glows being hue-only was a symptom of the layer being
  removed.

## 0.5.0

Two themes, and a colour vocabulary underneath the semantic one.

- `THEME_LEVELS` is `['midnight', 'sketch']`. `dim`, `bright` and `white` are
  gone, and so is `levelsByPolarity`. `dim` → `midnight`;
  `bright` / `white` → `sketch`.
- `palette` and `paletteBright` — ten Hues per theme, gated at 5.5:1. Components
  address Roles; a Hue in component code is a defect.
- `accentHue` / `intentHue` declare which Hue each Role is, and
  `check:contrast` asserts they agree.
- `FIXED_COLOURS` — Level-invariant `black`, `white`, `transparent`.
- Design Tokens Format Module export at `tokens/palette.<level>.tokens.json`,
  OKLCH with an sRGB hex fallback.
- Themes are selected with `[data-theme="…"]`. A consumer applying them as a
  class only will match no theme block at all.
