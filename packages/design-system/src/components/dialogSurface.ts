import { recipe } from '../lib/recipe';

/**
 * The chrome both dialogs wear.
 *
 * A module of its own, not a shared export from `Modal.tsx`: `src/index.ts`
 * re-exports that file wholesale, and a `recipe` in the published surface puts
 * `tailwind-variants`' types back into the `.d.ts` — which `lib/recipe.ts`
 * exists to prevent, since it would make swapping the engine a breaking
 * change. Nothing exports this one, so the types stay in.
 *
 * `Modal` and `AlertDialog` are the same surface with different dismissal
 * contracts, so the surface is declared once. Two recipes would drift, and the
 * drift would show up as a confirmation dialog that does not look like the
 * dialog it was opened from.
 *
 * `Drawer` is the third caller and the reason `placement` exists. A drawer is
 * a dialog anchored to an edge — the same chrome, a different position and a
 * different transition — so it takes a variant here rather than a recipe of
 * its own. The header, title, close, body and footer slots are shared
 * verbatim, which is the point: a drawer that does not look like the modal it
 * sits beside is the drift a second recipe would have produced.
 *
 * `overlay` and `popup` both sit on `z-top`: the viewport follows the backdrop
 * in DOM order, so it paints above it without a second stacking value. The
 * layer comes from the `--ds-layer-*` scale either way — the `z-50` this
 * component used to hardcode is the drift the token layer exists to prevent.
 */
export const dialogSurface = recipe({
  slots: {
    /*
     * Enter and exit are `data-starting-style` / `data-ending-style` rather
     * than keyframes: Base UI sets them for one frame either side of the
     * transition, so an opacity pair and a duration is the whole animation.
     * `motion-reduce` drops it — an overlay appearing is exactly the motion
     * `prefers-reduced-motion` is asking not to see.
     */
    backdrop:
      'fixed inset-0 z-top bg-surface-overlay transition-opacity duration-quick ease-brutalist '
      + 'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none',
    viewport: 'fixed inset-0 z-top flex items-center justify-center p-4',
    /*
     * `focus-visible:outline-none!` on the popup and nowhere else. Focus lands
     * on this element so a screen reader announces the dialog's own title
     * rather than its close button — it is an announcement target, not a
     * keyboard stop, and the global `:focus-visible` rule in styles.css would
     * otherwise draw the accent ring around the entire surface. The
     * hand-rolled container this replaced took focus the same way and painted
     * no ring; Base UI's focus call matches `:focus-visible`, so the ring has
     * to be turned off here instead. Controls inside the dialog keep theirs.
     *
     * The `!` is load-bearing, and the only one in the package. That rule is
     * unlayered on purpose — styles.css says keyboard focus must stay visible
     * even where a component restyles it — so it outranks Tailwind's
     * `@layer utilities` regardless of specificity. Important is the sanctioned
     * way past it, and the narrow scope is what makes it safe: one slot, one
     * element that no keyboard user can Tab to.
     */
    popup:
      'max-h-[90vh] w-full max-w-lg overflow-y-auto border-4 border-edge-strong bg-surface-raised '
      + 'focus-visible:outline-none! '
      + 'font-mono shadow-hard-lg transition-opacity duration-quick ease-brutalist '
      + 'data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 motion-reduce:transition-none',
    header:
      'flex items-center justify-between border-b-2 border-edge-strong bg-surface-base px-6 py-4',
    title:
      'font-display text-xl font-bold uppercase tracking-wider text-content-primary',
    close:
      'border-2 border-edge-strong bg-surface-raised px-2 font-mono text-lg font-bold '
      + 'text-content-primary transition-colors hover:bg-surface-base hover:text-accent-tertiary '
      + 'focus-visible:ring-2 focus-visible:ring-accent-primary',
    body: 'p-6 font-sans text-sm leading-relaxed text-content-primary',
    footer:
      'flex justify-end gap-3 border-t-2 border-edge-strong bg-surface-base px-6 py-4',
  },
  /*
   * Placement, and nothing else.
   *
   * There is deliberately no `centred` value and no `defaultVariants`. `Modal`
   * and `AlertDialog` call `dialogSurface()` with no argument and get exactly
   * the class strings above, unchanged — a default variant would have appended
   * classes to both and made two components' rendering depend on an edit made
   * for a third.
   *
   * `top` and `bottom` are absent for the reason #241 states: no consumer asks
   * for them, and an edge nobody anchors to is surface that still has to be
   * themed, screenshotted and kept working.
   */
  variants: {
    placement: {
      left: {
        // `items-stretch` and `justify-start` beat the base's centring, and
        // `p-0` its gutter: a drawer meets three edges of the viewport, so the
        // padding that keeps a modal off the edges is exactly wrong here.
        viewport: 'items-stretch justify-start p-0',
        popup:
          'flex h-full max-h-full max-w-sm flex-col overflow-y-hidden '
          + 'border-y-0 border-l-0 border-r-4 '
          // `transition`, not the base's `transition-opacity`: the drawer moves
          // as well as fades, and a translate with no transition on it would
          // land instantly and leave only the fade visible.
          + 'transition data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full',
        // The panel is as tall as the viewport, so the body takes the slack
        // and scrolls inside it. Scrolling the whole popup instead would take
        // the title and the close control off-screen with the content.
        body: 'flex-1 overflow-y-auto',
      },
      right: {
        viewport: 'items-stretch justify-end p-0',
        popup:
          'flex h-full max-h-full max-w-sm flex-col overflow-y-hidden '
          + 'border-y-0 border-r-0 border-l-4 '
          // The hard shadow falls down and to the right, so on a drawer flush
          // with the right edge it paints off-screen and draws nothing. The
          // 4px inner border is the separation instead. `shadow-none` clears it
          // only because `lib/recipe.ts` declares the hard-shadow scale to the
          // merger — the case its `mergeConfig` comment calls out.
          + 'shadow-none '
          + 'transition data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full',
        body: 'flex-1 overflow-y-auto',
      },
    },
  },
});
