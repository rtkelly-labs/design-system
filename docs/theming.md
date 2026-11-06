# Theming rules

**Parent:** [`AGENTS.md`](../AGENTS.md)

The Level system's rules. Vocabulary is in [`CONTEXT.md`](../CONTEXT.md); the Group/Target matrices are in [`theme-taxonomy.md`](./theme-taxonomy.md).

---

## 🎨 Design System Principles

- **Zero Border-Radius**: `0px` globally enforced.
- **Hard Offset Shadows**: `shadow-hard-*` utilities (2px, 4px, 6px offset, no blur).
- **Two Themes**: `midnight` and `sketch`, selected by a `data-theme` attribute. Independently authored, neither derived from the other — see Theme Ladder below.
- **Bracketed Display Typography**: Headings render in Space Grotesk enclosed in `[ BRACKETED ]` display type.
- **Semantic Roles Over Hues**: Components address roles, never colours. See below.
- **Styling Lives in TSX**: Tailwind utilities on the element. CSS files declare variables and nothing else. See below.


## 🪜 The Theme Ladder

**`src/theme/levels.ts` is the only place a level name or a level colour is written.**
Everything else derives from it: `src/theme.css` (generated), the runtime provider, the
Storybook toolbar, the walkthrough matrix, and the contrast gate.

| Level | Polarity | Ground | For |
|---|---|---|---|
| `midnight` | dark | `#0a0a1a` | Neon on blue-black — the signature, and the default |
| `sketch` | light | `#f5f3ec` | Warm paper and pen ink |

The ladder ran to four rungs — `midnight`, `dim`, `bright`, `white` — until `0.5.0`. The
argument for four was sound: two themes can share a polarity and still want different grounds.
The assumption under it was not, which is that four were *used*. Nothing consumed the fourth
and nothing reached the second. See [`adr/0003`](./adr/0003-two-levels-independently-authored.md)
for the collapse and [`colour-heritage.md`](./colour-heritage.md) for what the retired rungs held.

Four rules follow from that, and they are what keep hand-authored levels maintainable:

1. **`theme.css` is generated — never edit it.** Change `levels.ts`, run `pnpm tokens:build`,
   commit both. `pnpm tokens:check` fails CI on drift. TypeScript covers the TS half of the
   ladder; this covers the CSS half, which is where the drift used to live.
   `src/theme.css.test.ts` covers a third thing neither reaches: the *shape* the
   generator has to emit. Every `@theme` token that indirects through a
   per-level variable is repeated inside every level block, because a custom
   property substitutes where it is **declared**, not where it is used — so an
   alias left only in `@theme` resolves against the root level and a nested
   `<ThemeProvider scoped>` panel keeps the wrong colour. `tokens:check` would
   not notice: it proves the CSS matches `levels.ts`, and would be equally happy
   with a generator that reproducibly emitted the wrong shape. Neither would a
   screenshot, since single-level pages render correctly either way.
2. **Never branch on a level with an if-chain.** Use a `Record<ThemeLevel, T>` — adding a rung
   is then a compile error until every branch answers it — or end a `switch` with
   `assertNever(level)`. Map over `THEME_LEVELS`; never re-list the names.
3. **Polarity is a declared field, not the axis** — and it stays one at two levels, which is
   the opposite of what the collapse is usually assumed to do. `LEVELS[x].polarity` drives
   `color-scheme`, the `dark:`/`light:` variants, and the `prefers-color-scheme` mapping in
   `SYSTEM_LEVEL`. That survives because **neither level is named for its polarity**:
   `midnight` names a ground, `sketch` names a surface. Had they been called `dark` and
   `light`, `SYSTEM_LEVEL` would have degenerated to an identity map and
   `Record<Polarity, T>` would have become `Record<ThemeLevel, T>`. `dark:` now means
   `midnight` and `light:` means `sketch`, and both remain for non-colour utilities.
4. **Every level colour is a literal.** No `color-mix` derivation, because percentages tuned
   against near-black do not hold at the light end — and because literals make
   `pnpm check:contrast` able to audit all 222 pairs without a browser — including every
   Hue in `palette` against every ground, at a 5.5:1 floor rather than 4.5:1, so an editor
   still has headroom to tint the ground behind a token.

Selection is `data-theme="<level>"` on the root (the level class is mirrored for consumers
whose own CSS selects on it). `<ThemeProvider scoped>` themes a subtree instead — a `sketch`
panel inside a `midnight` page resolves correctly at any depth. For SSR, render
`getThemeInitScript()` in an inline `<script>` in `<head>`: it sets the attribute before
first paint, which React cannot do without either a flash or a hydration mismatch.


## 🎯 Semantic Theming

Components must **never** reference `--brutalist-cyan`, `--color-white`, `--border-color`
or the `brutalist-*` Tailwind utilities directly, nor a hex literal, nor a raw palette
utility like `bg-zinc-900`. `pnpm lint` reports each one at the line that wrote it, with
the role to use instead.

**The migration is done: zero call sites remain.** Those names still resolve through a
**deprecated compatibility block** in the generated `theme.css`, which existed only so
the not-yet-migrated components kept rendering while they were ported. Nothing in this
package needs it now, so removing it is unblocked — but it ships in `theme.css`, so a
consumer may be leaning on it, which makes deletion a breaking change and a deliberate
one rather than a tidy-up.

`src/components/Input.tsx` is the worked example of a migrated component.

| Role group | Tokens | Use for |
|---|---|---|
| `--ds-accent-*` | `primary`, `secondary`, `tertiary`, `quiet` | Visual hierarchy — what draws the eye first |
| `--ds-intent-*` | `info`, `success`, `warning`, `danger` | Communicated meaning the reader must act on |
| `--ds-surface-*` | `base`, `raised`, `sunken`, `overlay` | Background elevation |
| `--ds-text-*` | `primary`, `secondary`, `muted`, `inverse` | Text prominence |
| `--ds-border-*` | `strong`, `default`, `subtle` | Rule weight |
| `--ds-font-*` | `display`, `body`, `mono`, `pixel` | Typography roles |

From TypeScript, use `accentVar()`, `surfaceVar()`, `textVar()`, `borderVar()`, or the
`semanticTokens` object from `src/lib/theme.ts`. From Tailwind, use the semantic aliases:
`text-accent-primary`, `bg-surface-raised`, `border-edge-subtle`, `text-intent-danger`.

**When the role comes from a prop, the two are not interchangeable.**
`src/lib/accentClasses.ts` is the Tailwind counterpart to `accentVar()`, and it exists
because Tailwind's scanner reads source text: `text-${role}` generates no CSS at all,
so every class has to be spelled out somewhere the scanner can see it. Use
`accentTextClass()` / `accentHoverEdgeClass()` when the accent decides a *class*, and
`accentVar()` when it decides an inline value. A test asserts the two encodings agree,
because a drift would have one component's class and another's style resolve the same
prop to different colours.

Accent-style props take an `Emphasis` or an `Intent`. The old palette names
(`'cyan' | 'pink' | 'yellow' | 'green'`) still resolve to identical values so existing
consumers keep compiling, but they are deprecated — do not use them in new code.


## 🎯 Selection State

**A selected item is marked with an accent `fill` or a 4px accent `edge`. Never
with one surface against another.**

The surfaces exist to *layer* — a strip behind its tabs, a panel over a page —
so they are deliberately close in lightness: `surface.raised` against
`surface.base` is under 1.1:1 on both levels, and on `sketch` it is 1.11:1. A
widget that marks its chosen tab `bg-surface-base` among `bg-surface-raised`
siblings therefore reads on `midnight`, where the reviewer usually is, and is
invisible on the light rungs. That is exactly how it shipped once, in the blog.

`pnpm check:contrast` now carries the rule as arithmetic
(`auditSelectionDevices` in `src/theme/contrast.ts`): every accent fill and edge
must clear 3:1 against `base` and `raised` on every level, and the surface pairs
are printed in the report so the number that rules them out is in the output
rather than in someone's memory. `src/theme/contrast.test.ts` asserts both
halves. `CodeTabs` is the worked example — three variants, each selecting by
fill or edge, none by surface.

Pair either device with a text change (`text-content-muted` →
`text-content-primary`, or `text-content-inverse` on a fill) so the state reads
at a glance and not only in colour.


