# Kanban archetype: findings (original compared: Trello / Linear board view)

## (A) What was built

Files (only these were written in the repo):
- `apps/site/src/examples/kanban/board.tsx` (default export `KanbanBoard`, ~830 lines)
- `apps/site/src/examples/kanban/data.ts` (seeded fixture: 15 cards, 5 columns, fixed "today" 2026-10-14, hand-formatted dates)

Registry line for `apps/site/src/examples/index.ts` (not edited by me):
    import KanbanBoard from './kanban/board';
    ...
    'kanban/board.tsx': KanbanBoard,

Features: 5 columns (one empty, one over its soft WIP limit); cards with id, wrapped long titles, labels, priority, due/[LATE], avatar; pointer drag with live drop placeholder, drag ghost and edge auto-scroll; keyboard drag (Space lift, arrows move within and across columns, Space/Enter drop, Esc cancel, focus kept across re-parenting, aria-live announcements); per-card Menu (edit, MOVE TO radio group as non-drag alternative, delete with toast UNDO); inline add per column; Modal editor (Input, TextArea, 3x Select); filter Input + assignee Select; Progress for done ratio; STRESS +20 button (deterministic) for overflow testing. Uses only package exports (Avatar, Badge, Button, EmptyState, Input, Menu*, Modal, Progress, Select, Tag, TextArea, useToast). No dependencies added.

Gates: `pnpm check:tokens` 0; eslint (react-hooks, jsx-a11y) clean on the folder; `tsc` clean for kanban.

Harness note: to avoid editing registry/routes, I ran a scratch copy of the site shell at `scratchpad/kanban/harness` (port 3101, route `/site/kanban/`) that symlinks the real kanban folder. Not in the repo.

## (B) Per-format results

| Format | Result |
|---|---|
| midnight, 1440 | Good. Reads as CRT board. Hierarchy clear. See V-1 (button noise). |
| sketch, 1440 | Good, arguably the better theme here. But tertiary buttons render red (reads as danger), see C-2. |
| 1280/1440 | 5 columns overflow, board scrolls horizontally; 5th column cut at fold (expected, scroll). Per-column vertical scroll (62vh). |
| 768 | Works; header toolbar wraps leaving STRESS button orphaned on its own row; 2.5 columns visible. |
| 375 | No page-level horizontal overflow (scrollWidth 375). Columns 85vw with snap, next column peeks. Header/filter chrome eats ~290px before the first card (original collapses this). Long title wraps fine. |
| Both themes axe (wcag2a/aa/21aa/22aa + best-practice) | 0 violations on base, modal open, lifted state, in both themes. Menu open: 1 moderate `region` (portal popup outside landmarks, A-3). Harness-only title/main findings excluded. Color-contrast clean. |
| Keyboard only | Pass. Tab reaches ~40 stops with 15 cards (no roving tabindex, A-1). Lift/move/drop/cancel verified incl. cross-column; announcements correct; focus retained after move. Enter opens editor; Esc closes. |
| Pointer drag (mouse) | Pass. Drop lands at the right index, announcement fires. |
| Touch drag | NOT executed (no touch emulation). By inspection: only the `::` handle starts a drag on touch; handle is 22x16px (below 24px target, WCAG 2.5.8). Menu "MOVE TO" is the real mobile path. |
| prefers-reduced-motion | FAIL at package level: Button `transition-all` still computes 0.15s under `reduce` (P-3). My own transitions use `motion-reduce:transition-none`. |
| Print (Chromium print media screenshot + pdf; PDF not rasterised, no pdftoppm) | Layout works with my `print:` utilities: columns become 2-up wrap, controls hidden, no clipped cards. But the package ships no print level: midnight prints dark ground (ink-heavy, and light text vanishes if "background graphics" is off); sketch prints correctly. See P-1. |
| Terminal | Partial/n.a. Package terminal target = 16-slot palettes for alacritty/ghostty/iTerm/Windows Terminal + `ansi.ts` role-to-slot map. Colour roles (intent, accent, WIP over-limit) map fine to a TUI board, and box-drawing is covered by DS Symbols. Not expressible: hard offset shadow, 2px border weight, any component renderer (no Ink/blessed adapter, no layout/focus model). A TUI kanban would be hand-written against the palette only. |

## (C) Findings

**K-1 No way to express "quiet/ghost" or icon-only button** [component-gap] severity: high; both themes, all viewports.
Evidence: Button variants are primary/secondary/tertiary/inverse/default, all solid fills with hard shadow. A dense card carries a menu trigger plus the column has ADD CARD; every card gets a large pink (midnight) or red (sketch) slab (see desk-midnight.png). Trello/Linear use ghost icon buttons revealed on hover. Content (title) is out-shouted by the chrome. `size="sm"` still ~40x36px.
Fix: add `variant="ghost"` (border-only or text-only, fill on hover/focus) and an icon-only/`square` size with required `aria-label`. IN-LANGUAGE (drafting-table outline button; hard shadow only on hover/focus).

**K-2 Tertiary button is red in sketch, reading as danger** [visual-refinement/token] severity: medium; sketch.
Evidence: sketch tertiary = red fill (menu-sketch.png). "ADD CARD", "..." and CANCEL look like destructive actions while real DELETE is not red. Emphasis vs meaning separation (DESIGN.md s3) is violated by the button's role mapping.
Fix: map tertiary to an accent role that is not the danger hue in sketch, or document. IN-LANGUAGE.

**K-3 No danger/destructive Button intent** [component-gap] severity: medium; both.
Evidence: modal footer DELETE had to use `default` (cyan/blue) next to CANCEL in loud pink/red (modal-sketch.png). Menu has `intent="danger"` but Button does not.
Fix: `intent="danger"` on Button using intent-danger role. IN-LANGUAGE.

**K-4 No drag-and-drop primitive or documented pattern** [component-gap] severity: high (capability the originals have natively).
Evidence: hand-rolled ~250 lines: threshold detection, elementsFromPoint hit-testing, ghost, placeholder, edge auto-scroll, keyboard lift/move/drop/cancel, live announcements, focus restoration after re-parenting. Every one of these is something Trello gets from its library. Base UI offers no DnD, so the package can't borrow.
Fix: ship `useSortable`/`SortableList` style headless hook (own pointer + keyboard + announcer, Base-UI-free) or a documented recipe with the keyboard contract. Style tokens needed: lifted state, drop placeholder. IN-LANGUAGE (dashed placeholder, hard-shadow ghost looked right).

**K-5 No live-region / announcer primitive** [component-gap] severity: medium.
Evidence: needed `role=status aria-live` + `sr-only` div by hand; Toast exists but is visual and timed, unsuitable for per-move announcements. Fix: export `LiveRegion`/`useAnnounce`. IN-LANGUAGE.

**K-6 EmptyState is too big/centered for a column well** [visual-refinement] severity: low-medium; both.
Evidence: "[ NO CARDS ] / Drop a card here or add one." occupies a 150px dashed box; heading text nearly fills 288px. Fix: `size="sm"`/`inline` variant. IN-LANGUAGE.

**K-7 Badge/Tag sizing needs overrides for dense UI** [token/spacing] severity: medium.
Evidence: Badge (2px border, 0.6rem x 0.2rem pad) and Tag (uppercase, 2px border) are heavy; I overrode padding via className on each. A card with 3 labels + priority is the visually densest area. No `size="sm"` on either; Tag forces `#` prefix and uppercase (cannot show "api" or "in review"). Fix: `size` prop on Badge/Tag, optional `prefix=""`. IN-LANGUAGE.

**K-8 Drag affordance: no handle/grip glyph or `cursor-grab` token** [visual-refinement] severity: low. I used literal `::`. Touch target 22x16px (<24px, WCAG 2.5.8). Fix: a Glyph/NerdIcon grip and min 24px target in the recipe. IN-LANGUAGE.

**K-9 Print has no level** [component-gap/token] severity: medium; midnight print.
Evidence: print-midnight.png (print media emulation): dark ground and light ink retained. Browsers drop backgrounds by default, which leaves light-on-white (invisible text); with backgrounds on it burns ink. DESIGN.md calls sketch "a drafting table", which is the right print identity, but nothing forces it.
Fix: `@media print { :root { sketch tokens } }` emitted by theme.css (or a documented `print` Medium; ADR 0004 already has web/video/graphic). IN-LANGUAGE.

**K-10 Package transitions ignore prefers-reduced-motion** [a11y] severity: medium; both.
Evidence: `getComputedStyle(button).transitionDuration` = 0.15s with reducedMotion: reduce. Fix: `--ds-duration-*` zeroed under the media query, or `motion-reduce:` in the Button recipe. IN-LANGUAGE.

**K-11 Menu popup flagged by axe `region`** [a11y] severity: low. Portal content outside landmarks (moderate, best-practice rule). Likely acceptable; maybe the portal could get `role=presentation` wrapper or landmark exemption. Both themes.

**K-12 Original does better: no ready column/board layout and no sticky column headers** [original-does-better] severity: medium. Trello gives per-column scroll with sticky header/footer and a horizontal scroller with snap; I hand-built with overflow + `snap-x`. A `Board`/`Lane` layout primitive (title, count, WIP state, scroll body, footer slot) would remove ~60 lines and give consistent WIP-over styling (I used border-intent-danger + text). IN-LANGUAGE.

**K-13 Original does better: card detail, quick edit, labels picker, cover, checklists, inline-edit title, undo** [original-does-better] severity: low (app features, not system gaps) except: Modal + 3 Selects + TextArea composed fine; Select has no clearable/placeholder-less "none" idiom (I used a sentinel 'none' value) and no multi-select, so a label picker is not buildable from the package. component-gap: multi-select/combobox, severity medium.

**K-14 Mobile header chrome is not compact** [visual-refinement] severity: low-medium; 375/768. Filter, select, NEW CARD, STRESS stack to ~290px before content; at 768 STRESS wraps alone. Original collapses into a toolbar/overflow. A `Toolbar` or collapsible filter (Drawer exists) would fit. IN-LANGUAGE.

**K-15 No roving focus for lists of cards** [a11y] severity: low. ~40 Tab stops with 15 cards (card + menu each); Trello has the same issue, Linear uses arrow-key list nav. Package has no roving-tabindex helper to reuse (Base UI Toolbar/Composite not wrapped). Fix: export a `useRovingFocus` or wrap Base UI Composite. IN-LANGUAGE.

Positives worth recording: hard-shadow card plus dashed accent placeholder reads very well and is clearly not SaaS; WIP-over state via role (intent-danger) works in both themes with no hue names; zero axe contrast failures in either theme; Modal/Menu/Select/Toast composed cleanly and focus-return worked; seeded data produced no hydration warnings (no page errors in console).

Artifacts (scratchpad/kanban): desk-{midnight,sketch}.png, v375/v768-{theme}.png, drag-mid.png, kb-lifted.png, modal-*.png, menu-*.png, stress-midnight.png, filter-midnight.png, print-{midnight,sketch}.png/.pdf, audit.mjs, print.mjs, reg.mjs.
