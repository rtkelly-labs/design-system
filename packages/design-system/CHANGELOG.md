# Changelog

Pre-1.0 and moving fast. **Every minor may break.** There are two consumers —
`rtkelly13/blog` and this package's own Storybook — both in the same estate and
migrated in the same change, so compatibility between 0.x versions buys nothing
and is not attempted: no deprecation shims, no alias layers, no staged removals.

Proper release notes start at 1.0. Until then this file records only what a
consumer has to *do*, newest first. The reasoning lives in the pull requests and
in [`docs/adr/`](./docs/adr/).

## Unreleased

A field's `error` is described, not announced (#299). It was `role="alert"`, so a failed submit
read every invalid field on top of `ErrorSummary` taking focus. No export, prop or rendering
changed; only the `role` attribute is gone. This affects `Input`, `TextArea`, `Select`, `Checkbox`,
`Switch`, `RadioGroup` and `Fieldset`.

### You have to do something

- **A form that validates on submit should render `ErrorSummary`.** It takes focus and is the
  announcement. Each field's error stays in its control's `aria-describedby`, with `aria-invalid`,
  so it is read when a summary link moves focus to the field.
- **A form that validates inline or on blur, with no summary, is no longer announced.** Setting
  `error` on the focused field is silent until the reader returns to it. If the change needs to be
  heard, give the form one polite live region of its own and write the message into it. Do not
  put a live region on each field.
- **Tests that found a field error with `getByRole('alert')` will fail.** Find it by its text, or
  follow the control's `aria-describedby`.

## 0.12.0

New documentation visuals adapted from mdxcn: `ActivityGrid`, `GanttChart`,
`UptimeStrip`, `FlowDiagram`, `Timeline`, `TreeDiagram`, `ChangeSummary`, and
`BeforeAfter`. `Steps` and `Terminal` are available as unframed blocks. Wrap one
or more of them in `FigureFrame` when the content needs a shared caption and
border. Each adapted component links to its upstream source in its file header.

No mdxcn package dependency is required. Existing published components and
their props are unchanged.

## 0.11.0

`Select` themed on Base UI's select: the open list is painted by the Level, not the operating
system (#164). With it the last row of [`docs/capability-readiness.md`](./docs/capability-readiness.md)
is `ready`. Breaking only for `Select`: no export was added or removed, and the entry points,
dependencies and peer dependencies are the same as 0.10.0.

### You have to do something

- **`onChange(event)` is removed. Use `onValueChange(value: string)`.** It is called with the newly
  chosen option's `value` — a string, not a `ChangeEvent` — so `onChange={(e) => set(e.target.value)}`
  becomes `onValueChange={set}`. There is no alias and no shim.
- **`multiple` and `size` are removed.** `Select` chooses exactly one option from a closed list.
  Choosing several is `Checkbox`; showing a visible set is `RadioGroup`.
- **`value` and `defaultValue` are strings only.** `number` and `string[]` are no longer accepted.
  With neither given, the first enabled option is chosen, as on a native `<select>`; pass
  `placeholder` to start from nothing instead.
- **Options still come from `options`, never from children.** `children` is no longer part of
  `SelectProps` at all; `<option>` elements passed as children were never rendered and are now a
  type error. A row that cannot be chosen is `{ label, value, disabled: true }`.
- **The control is a button with `role="combobox"`, not a `<select>`.** `SelectProps` extends
  `HTMLAttributes<HTMLElement>` instead of `SelectHTMLAttributes<HTMLSelectElement>`, and the ref
  (`Select` now forwards one) is the trigger. The field label is no longer a `<label>`: it names the
  trigger by `aria-labelledby`, and clicking it focuses the trigger without opening the list.
  Tests that drove it with `fireEvent.change` on a `<select>` should find it with
  `getByRole('combobox', { name })`, open it, and choose a row by `getByRole('option', { name })`.
- **If you need the platform picker, pass `native`.** It renders the `<select>` element, with the
  same props and the same `onValueChange` — not the removed native API.
- **A `name` still submits.** Base UI keeps a hidden input under `name`, so `FormData` carries the
  chosen `value` as before. `form` and `autoComplete` are now explicit props.

### Rendering changed

- **The closed `Select` gains a chevron, and its open list is drawn from roles** — `surface.raised`
  rows, an accent fill on the highlighted row, an accent `>` on the chosen one. The
  `errorsummary-account-settings*` baselines move with it, and `select-*` rows are new.

## 0.10.0

The capability release: every row in [`docs/capability-readiness.md`](./docs/capability-readiness.md)
but *Choose one* is `ready`, so a site can be built without inventing its own interaction
behaviour. The themed `Select` that finishes that row is a breaking change and follows in 0.11.0.

### You have to do something

- **Nothing, for imports.** No export was removed or renamed; 120 were added. The entry points,
  `files`, runtime dependencies and peer dependencies are the same as 0.9.0.
- **If you pass `BlogPost` an `author` string other than the default name**, the card now shows that
  author — their own initials, no description — instead of the default author's initials and bio.
  Pass a `BlogAuthor` object (`name`, `initials`, `avatar`, `url`, `description`) to describe them,
  or `authorCard` to replace the card. Omitting `author` is unchanged.
- **If you pass `SaasLandingPage` `deployLog=""`**, the terminal preview is now hidden, as the prop
  always documented.

### Rendering changed

- **`Pagination` renders a numbered page list** rather than previous/next alone.
- **A `DataTable` with `pageSize` now paginates:** one page of rows, with `Pagination` beneath when
  there is more than one page. It also renders `caption`, row headers, `scope` and `aria-sort`.
- **Portalled surfaces follow a scoped `ThemeProvider`.** `Modal`, `AlertDialog`, `Drawer`, `Toast`,
  `Tooltip`, `Popover` and `Menu` rendered inside `<ThemeProvider scoped>` take that provider's Level,
  not the document's. Under an unscoped provider nothing changes.
- **`SaasLandingPage`** is now composed from the marketing sections. Its prices use the display
  face (they had fallen back to the system sans-serif), and its grids drop to one column below `md`
  instead of overflowing a phone's width.

### New

- **Forms:** `Checkbox`, `Switch`, `Fieldset` + `Legend`, `RadioGroup` + `Radio`, and
  `ErrorSummary` — a form-level summary that links to each invalid field and takes focus when it
  appears.
- **Feedback:** `Spinner`, `Skeleton`, `Progress`, `EmptyState`, and `ToastProvider` / `useToast`.
- **Overlays:** `Drawer`, `Tooltip`, `Popover` and `Menu`, all on Base UI.
- **Navigation:** `Tabs`, `SiteHeader` (skip link, breakpoint swap), `SiteNav` + `SiteNavItem`,
  `MobileNav` and `SiteFooter`, with `LinkProvider` / `SiteLink` to inject a router's link and its
  current-route test once. `DocsLinkProvider` keeps its API and now shares that context.
- **Layout:** `AppShell` with `AppSidebar`, `AppSidebarNav`, `AppTopbar` and `AppMain`.
- **Marketing:** `Hero`, `FeatureGrid` + `Feature`, `PricingGrid` + `PricingTier`, `CTASection`.
- **Reports:** `ReportDocument`, `ReportSection`, `ReportDetails`.
- **`BlogPost`:** `BlogAuthor` and the `authorCard` slot.

### Fixed

- `Input`, `TextArea` and `Select` merge a caller's `style` with the accent instead of losing it.
- `TextArea` and `Select` put their `id` on the control, so the label's `for` points at it and a
  click on the label focuses the field.
- `Card` forwards its ref.
## 0.9.0

`Modal` on Base UI's dialog, and the `AlertDialog` that had to ship with it.

### You have to do something

- **Nothing, if you only render `Modal`.** `ModalProps` is unchanged — `isOpen`, `onClose`,
  `title`, `children`, `footer`, `closeOnBackdropClick`, `className` all mean what they meant.
  `Modal` now also forwards a ref and spreads unrecognised props onto the dialog.
- **If you targeted `[data-slot="modal-backdrop"]` to position or size the dialog**, that element
  no longer wraps it. Base UI splits the one element into two: `modal-backdrop` is the dim,
  `modal-viewport` is the centring container and the dialog's parent. Styling the dim is unchanged;
  anything about layout moves to `modal-viewport`.
- **If you asserted `aria-modal` on the dialog**, it is gone, and not by omission. Base UI marks the
  portal's siblings `aria-hidden` instead — the mechanism `aria-modal` is a hint for, and the one
  screen readers implement consistently. Assert the sibling marking, not the attribute.
- **If you tested backdrop dismissal with `mouseDown` alone**, send a pointer sequence
  (`pointerdown` then `click`). Base UI confirms an outside press rather than acting on the first
  event, which is closer to what a browser sends.

### Rendering changed

- **`Modal` gains a backdrop element and a viewport element**, and fades both on open and close via
  `data-starting-style` / `data-ending-style`, at `--ds-duration-quick`. The enter/exit is
  suppressed under `prefers-reduced-motion`. `modal-*` baselines move.
- **Focus lands on the dialog, not on its close button.** Unchanged in effect from the hand-rolled
  version, but it is now a deliberate `initialFocus` rather than a side effect of a `tabIndex={-1}`
  container.

### New

- **`AlertDialog`** — destructive confirmation. Same surface as `Modal`, different dismissal
  contract: a backdrop press *cannot* close it, Escape can, and there is no `×`. `onConfirm` is
  separate from `onClose`, so the two answers never collapse into one handler.

### Deleted

- `Modal`'s hand-rolled focus trap, capture-phase `document` Escape listener, `body.style.overflow`
  scroll lock and focus-return ref. With them go three defects: Escape closing two stacked dialogs
  at once, a focus boundary computed once from the first and last focusable node, and a page behind
  the dialog that was never hidden from assistive technology. The scroll lock also no longer shifts
  the page by the scrollbar's width.

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
