'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { cn } from '../lib/recipe';
import { usePortalThemeAttribute } from './portalTheme';
import { dialogSurface } from './dialogSurface';
import { usePopupRef } from './dialogPopupRef';
import { Button } from './Button';

/**
 * Which edge the drawer is anchored to.
 *
 * Two values, and the omission is deliberate. #241 asks for `left` and
 * `right` only: nothing in the roadmap — mobile navigation, the responsive
 * admin sidebar, filter and settings panels — anchors to `top` or `bottom`,
 * and an edge no consumer asks for is still surface that has to be themed,
 * screenshotted, documented and kept working. Adding one later is additive;
 * removing one is a breaking change.
 *
 * A plain string union rather than anything Base UI or the recipe engine
 * names, so neither library reaches the published `.d.ts`.
 */
export type DrawerPlacement = 'left' | 'right';

export interface DrawerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'className'> {
  /** Whether the drawer is open. Controlled, as `Modal` is. */
  isOpen: boolean;
  /**
   * Called on every dismissal — Escape, the backdrop, the close control, and
   * the default footer button. The caller owns the state; this only reports.
   */
  onClose: () => void;
  /**
   * The drawer's accessible name, rendered in the header. Required for the
   * same reason `Modal`'s is: an off-canvas surface a screen reader announces
   * as "dialog" and nothing else gives no clue what slid in.
   */
  title: string;
  /** The panel's content — a nav list, a filter form, a settings group. */
  children: ReactNode;
  /**
   * Which edge to anchor to. Defaults to `right`, the placement a panel
   * raised *from* something takes — a filter or settings panel next to the
   * control that opened it. Site navigation names `left` explicitly.
   */
  placement?: DrawerPlacement;
  /** Replaces the default close button in the footer. */
  footer?: ReactNode;
  /**
   * Close when the backdrop is clicked. On for the usual case; turn it off
   * for a drawer holding unsaved input, where a stray click should not
   * discard it.
   */
  closeOnBackdropClick?: boolean;
  /**
   * Merged into the panel's classes rather than appended, so a caller's width
   * genuinely wins over the default `max-w-sm`.
   */
  className?: string;
}

/**
 * An edge-anchored dialog — the off-canvas primitive.
 *
 * A drawer is a dialog with a different position and a different transition,
 * and this component is written to make that literally true. It is
 * `@base-ui/react/dialog`, the same primitive `Modal` is built on, wearing
 * `dialogSurface`'s `placement` variant. Nothing about stacking, dismissal,
 * focus or scroll locking is implemented here, because all four already exist
 * one layer down and a second implementation of any of them would be a second
 * answer to a question this system has already answered.
 *
 * ## What it inherits, and why that is the whole point
 *
 * - **The dialog stack.** A drawer over a `Modal`, or an `AlertDialog` over a
 *   drawer, resolves through Base UI's stack: Escape closes the topmost
 *   surface only. That invariant arrived with #162 and is asserted again in
 *   `Drawer.test.tsx` — not because it could plausibly differ, but because
 *   the whole overlay set now depends on it and a test is what keeps it true
 *   when the next surface is added.
 * - **Focus.** It moves into the panel on open, is trapped while open, and
 *   returns to the invoker on close. As in `Modal`, `initialFocus` points at
 *   the popup rather than its first tabbable child, so a screen reader
 *   announces the drawer's own title instead of "Close drawer, button".
 * - **The background, hidden from assistive technology.** Base UI marks the
 *   portal's siblings `aria-hidden` while the drawer is open.
 * - **The scroll lock.** `overflow-y: hidden` on `body` with
 *   `scrollbar-gutter: stable` on `html`, so the page behind does not jump by
 *   the width of its scrollbar when the drawer opens.
 *
 * ## What is its own
 *
 * The position and the transition, both from the recipe. The panel is full
 * height against one edge, bordered on its inner side only, and enters by
 * translating in from off-screen via `data-starting-style` /
 * `data-ending-style` over `--duration-quick` and `--ease-brutalist`.
 * `motion-reduce:transition-none` drops the movement entirely: a panel flying
 * across the viewport is precisely the motion `prefers-reduced-motion` asks
 * not to see, and the drawer still opens and closes without it.
 *
 * ## Why it is not `Modal` with a prop
 *
 * It nearly is, and that was considered. The difference is the *shape of the
 * API a caller wants*: a drawer is sized by its edge and its width, a modal by
 * its width alone; a drawer's `placement` is meaningless on a modal, and a
 * modal's centring is meaningless on a drawer. Keeping them separate leaves
 * both prop lists honest while the surface underneath stays single — which is
 * the same trade `AlertDialog` made against `Modal`, for the same reason.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Button onClick={() => setOpen(true)}>MENU</Button>
 * <Drawer isOpen={open} onClose={() => setOpen(false)} placement="left" title="Navigation">
 *   <nav>…</nav>
 * </Drawer>
 * ```
 */
export const Drawer = forwardRef<HTMLDivElement, DrawerProps>(function Drawer(
  {
    isOpen,
    onClose,
    title,
    children,
    placement = 'right',
    footer,
    closeOnBackdropClick = true,
    className,
    ...props
  },
  ref,
) {
  const slots = dialogSurface({ placement });
  const [popup, attachPopup] = usePopupRef(ref);

  const portalTheme = usePortalThemeAttribute();
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      // Base UI's own name for "a click outside does not dismiss this",
      // inverted because the published API asks the question the other way
      // round — the same inversion `Modal` makes, and for the same reason: the
      // published API is the one that stays.
      disablePointerDismissal={!closeOnBackdropClick}
    >
      <Dialog.Portal {...portalTheme}>
        <Dialog.Backdrop data-slot="drawer-backdrop" className={slots.backdrop()} />
        <Dialog.Viewport data-slot="drawer-viewport" className={slots.viewport()}>
          <Dialog.Popup
            ref={attachPopup}
            // The function form, not the ref form: Base UI reads a `RefObject`
            // early enough that the popup is sometimes still `null`, and then
            // silently falls back to the first tabbable element. Reading
            // `.current` at focus time is the same intent without the race.
            initialFocus={() => popup.current}
            data-slot="drawer"
            // The placement is on the element as well as in the classes.
            // Classes are a rendering detail that a caller's `className` may
            // legitimately override; this is what the drawer *is*, and it is
            // what a test or a snapshot should read.
            data-placement={placement}
            // `class`, not an appended string: a caller's `max-w-md` would
            // otherwise emit alongside `max-w-sm` and leave CSS source order
            // to pick one.
            className={cn(slots.popup(), className)}
            {...props}
          >
            <div data-slot="drawer-header" className={slots.header()}>
              {/*
                * The heading text lives on the render element rather than on
                * `Title`: Base UI keeps the element's own children, and the
                * a11y lint rule can only see content it can read literally.
                */}
              <Dialog.Title
                data-slot="drawer-title"
                className={slots.title()}
                render={<h3>[ {title} ]</h3>}
              />
              <Dialog.Close
                data-slot="drawer-close"
                className={slots.close()}
                aria-label="Close drawer"
              >
                &times;
              </Dialog.Close>
            </div>

            <div data-slot="drawer-body" className={slots.body()}>
              {children}
            </div>

            <div data-slot="drawer-footer" className={slots.footer()}>
              {footer || (
                <Button onClick={onClose} variant="tertiary" bracketed size="sm">
                  CLOSE
                </Button>
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
});
