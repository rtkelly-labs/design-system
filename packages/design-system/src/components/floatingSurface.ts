import { recipe } from '../lib/recipe';

// The chrome `Tooltip`, `Popover` and `Menu` share (#166).
//
// A module of its own for the reason `dialogSurface.ts` is one: `src/index.ts`
// re-exports each component file wholesale, and a `recipe` in the published
// surface would put `tailwind-variants`' types into the `.d.ts`. Nothing
// exports this file.
//
// The three are one module because they are one kind of thing — an element
// anchored to another, positioned by the same Floating UI engine Base UI
// wraps, dismissed by the same stack #162 established. Three recipes would
// drift into three answers to the same three questions: which layer, which
// motion, which edge.
//
// ## The layer is `z-top`, the dialogs' layer, on purpose
//
// `--ds-layer-overlay` sits below `--ds-layer-top`, and the obvious reading is
// that a floating element belongs on it. It does not: a menu opened from a
// control inside a `Modal` would then paint *underneath* the modal it was
// opened from. Every surface here is portalled to the end of `<body>`, so one
// layer plus DOM order is already the stack — whichever opened last paints
// last, which is the same order Escape unwinds them in.
//
// ## Motion
//
// Enter and exit are `data-starting-style` / `data-ending-style`, the dialogs'
// and the toast's attributes, over `--duration-quick` and `--ease-brutalist`.
// Opacity only: a floating element that also scaled or slid would be a
// second movement arriving at the pointer, and the hard shadow already says
// which way is up. `motion-reduce:transition-none` drops the fade entirely.
//
// ## Collision
//
// Nothing here positions. `--available-width` (here) and `--available-height`
// (the popover's and the menu's caps) are the Positioner's own measurements of
// the room between the anchor and the viewport edge, so at a phone's width a
// popup shrinks to fit rather than running off-screen once the engine has
// flipped and shifted it as far as it can.
//
// ## No compositor layer: `will-change` is forced back to `auto`
//
// Floating UI writes `will-change: transform` onto the positioner's inline
// style, but only when `devicePixelRatio >= 1.5` — so on a phone and never on
// a desktop at 1x. That promotes the popup to its own compositor layer, which
// Chromium rasterises on its own schedule and may then draw resampled at a
// sub-pixel offset rather than painted on the pixel grid with the page. Which
// of the two you get depends on timing, not on the markup: #293 was the
// mobile tooltip failing its baseline with the whole popup smeared
// horizontally by a fraction of a pixel, box and text alike, then matching on
// retry. The desktop rows of the same components, with no layer, never have.
//
// The hint buys smoother repositioning while a scroll moves the anchor, which
// a label-sized popup does not need, and costs soft text on exactly the
// high-density screens it is added for. `!` because the value is inline, and
// an inline declaration beats every non-important class.
//
// Each component extends this recipe in its own file — `recipe({ extend:
// floatingSurface, … })` — with the box that is its own: a tooltip's label
// size, a popover's width, a menu's list padding. The shared half stays here,
// so the three cannot disagree about layer, edge, fill or motion.
export const floatingSurface = recipe({
  slots: {
    positioner: 'z-top will-change-auto!',
    popup:
      'max-w-(--available-width) border-2 border-edge-strong bg-surface-raised font-mono text-content-primary '
      + 'shadow-hard-md transition-opacity duration-quick ease-brutalist '
      + 'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none',
  },
});

// The parts only `Popover` and `Menu` render. Kept beside the surface so the
// header a popover wears is visibly the dialogs' header at a smaller scale.
export const floatingParts = recipe({
  slots: {
    header:
      'flex items-center justify-between gap-3 border-b-2 border-edge-strong bg-surface-base px-4 py-2',
    title: 'font-display text-sm font-bold uppercase tracking-wider text-content-primary',
    close:
      'border-2 border-edge-strong bg-surface-raised px-1.5 font-mono text-base font-bold leading-none '
      + 'text-content-primary transition-colors hover:bg-surface-base hover:text-accent-tertiary '
      + 'motion-reduce:transition-none',
    body: 'px-4 py-3 font-sans text-sm leading-relaxed text-content-primary',
    // A highlighted item is marked by the accent *fill* and the inverse ink —
    // `text.inverse on accent.primary`, a pair `check:contrast` audits on
    // every Level. Not a surface pair: `docs/theming.md` § Selection State is
    // why a raised-against-base highlight is ruled out.
    item:
      'flex w-full cursor-default select-none items-center gap-2 px-3 py-1.5 text-left text-sm '
      + 'text-content-primary data-[highlighted]:bg-accent-primary data-[highlighted]:text-content-inverse',
    // A disabled item is muted ink, and stays muted when the arrow keys land
    // on it: the highlight is the page ground (`text.muted on surface.base`)
    // rather than the accent fill, so a focused disabled item never looks
    // actionable. The focus ring still marks where the keyboard is.
    disabled:
      'cursor-not-allowed text-content-muted data-[highlighted]:bg-surface-base '
      + 'data-[highlighted]:text-content-muted',
    danger: 'text-intent-danger data-[highlighted]:bg-intent-danger',
    indicator: 'flex w-4 shrink-0 justify-center font-bold',
    groupLabel:
      'px-3 pt-2 pb-1 text-xs font-bold uppercase tracking-wider text-content-secondary',
    separator: 'my-1 h-0.5 bg-edge-strong',
  },
});
