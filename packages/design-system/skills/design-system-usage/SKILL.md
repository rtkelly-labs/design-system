---
name: design-system-usage
description: >
  Build pages and components against @rtkelly13/design-system (brutalist React
  + Tailwind 4 system). Activate when importing from @rtkelly13/design-system,
  theming with its Level ladder, or using DataTable, SlideDeck, ThemeProvider.
  Covers the token rules, the single-primitive-library rule, and the component
  surfaces an agent cannot discover from code alone.
metadata:
  type: core
  version: '1.0'
---

# Using @rtkelly13/design-system

React-only. Import components and the `cn`/`recipe` helpers from the package
root; styles ship as one stylesheet you must import once:

```tsx
import '@rtkelly13/design-system/styles.css';
import { Button, DataTable, ThemeProvider } from '@rtkelly13/design-system';
```

## Non-negotiables

1. **Never hardcode colours.** Colours are addressed by role via Tailwind
   utilities generated from the token ladder: `bg-surface-raised`,
   `text-content-primary`, `border-edge-strong`, `text-intent-danger`. Hue
   names (`cyan`, `zinc-500`, hex literals) fail the repo's own lint gate.
2. **Theme via `ThemeProvider` + `data-theme`.** The system ships Levels
   (theme rungs); a page declares one Level and components inherit. Do not
   write CSS custom properties that start with `--ds-` by hand.
3. **One primitive library.** Interaction primitives come from Base UI; the
   only other runtime engines permitted are TanStack headless engines
   (table/virtual/hotkeys). Do not add Radix, shadcn, MUI, or Chakra
   alongside — focus-management collisions are the reason.

## DataTable

`columns` + `data` (legacy `Column<T>[]` or TanStack `ColumnDef<T>[]`), or pass
a fully controlled `table` from `useReactTable` — never both. `pageSize`
attaches pagination; `virtualize` windows the body instead; without either,
every row is mounted.

The semantics are the component's, not TanStack's: every header has
`scope="col"`, the sorted column's header has `aria-sort`, each sortable
header is a native `<button>`, a `rowHeader` column (`meta.rowHeader` on a
`ColumnDef`) renders `<th scope="row">`, and a windowed body reports the full
dataset through `aria-rowcount` / `aria-rowindex`. Pass `caption` to say what
the table is a table of — it becomes the table's accessible name. Row
selection and a sticky header are deliberately not built: no consumer needs
them yet (#245).

## SlideDeck keyboard

Deck bindings live in the exported `SLIDE_DECK_HOTKEYS` table (←/→/Space page,
F fullscreen, N notes when any slide has them). `chrome={false}` disables the
bindings entirely — a page owning its keyboard should pass it.

## Common mistakes

- **Wrong:** styling components with a second CSS-in-JS layer or Tailwind
  config overrides. **Correct:** compose classes with the exported `cn`
  (tailwind-variants based); variants go through `recipe`.
- **Wrong:** rendering `DataTable` with thousands of rows and no `pageSize`.
  **Correct:** paginate or `virtualize` — the default mounts every row.
- **Wrong:** assuming the package themes itself. **Correct:** wrap the app in
  `ThemeProvider` (or set `data-theme` on a root element) — unstyled
  tokens resolve to nothing.

## API discovery

The published type surface is the package's `dist/index.d.ts` — every export,
prop and token type. Do not invent props; if it is not in the `.d.ts`, it does
not exist.
