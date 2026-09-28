'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { cn } from '../lib/recipe';
import { usePortalThemeAttribute } from './portalTheme';
import { dialogSurface } from './dialogSurface';
import { usePopupRef } from './dialogPopupRef';
import { Button } from './Button';

export interface ModalProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'className'> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /**
   * Close when the backdrop is clicked. On for the usual case; turn it off for
   * a dialog holding unsaved input, where a stray click should not discard it.
   */
  closeOnBackdropClick?: boolean;
  className?: string;
}

/**
 * A modal dialog, on Base UI's `dialog`.
 *
 * "Modal" is a behavioural claim, not a visual one: while it is open, the rest
 * of the page is inert. This component used to make that claim and hand-roll
 * every part of it — a capture-phase `document` listener for Escape, a
 * first/last focus trap, `body.style.overflow`, and focus return through a ref
 * captured at open time. All of it is deleted. What replaced it is not a
 * smaller version of the same code; it is the primitive that owns the problem.
 *
 * Three defects went with the deletion, each of which the hand-rolled version
 * had and none of which was cheap to fix in place:
 *
 *   1. **No dialog stack.** Two open dialogs both listened on `document` in
 *      the capture phase, so Escape closed both. Base UI keeps a stack, and
 *      Escape now closes the topmost surface only — the invariant every
 *      overlay added after this one inherits.
 *   2. **The background was never hidden from assistive technology.** Nothing
 *      set `inert` or `aria-hidden`, so a screen reader's virtual cursor
 *      walked the page behind the dialog even though Tab could not. Base UI
 *      marks every sibling of the portal `aria-hidden` while the dialog is
 *      open — `aria-hidden`, not `inert`, which is worth knowing when reading
 *      the DOM: the outside content stays in the tab order's way only as far
 *      as the focus guards allow, and the guards are what stop it.
 *   3. **The focus trap read the DOM once, by first and last.** Content that
 *      changed while open — a list that filtered, a button that became
 *      disabled — left the boundary pointing at a node that was no longer
 *      focusable.
 *
 * ## What is deliberately kept
 *
 * `ModalProps` is unchanged, so no consumer moves. `isOpen`/`onClose` stay the
 * API rather than becoming Base UI's `open`/`onOpenChange`: this is a
 * controlled dialog in both consumers, and a compound `Dialog.Root`/`Trigger`
 * composition would be a breaking change bought for nothing they need.
 *
 * Focus goes to the **popup**, not to the first tabbable element inside it.
 * Base UI's default would land on the close button, which a screen reader
 * announces as "Close dialog, button" — the dialog's own title never read.
 * Pointing `initialFocus` at the popup restores what the hand-rolled
 * `tabIndex={-1}` container was for.
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(
  {
    isOpen,
    onClose,
    title,
    children,
    footer,
    closeOnBackdropClick = true,
    className,
    ...props
  },
  ref,
) {
  const slots = dialogSurface();
  const [popup, attachPopup] = usePopupRef(ref);

  const portalTheme = usePortalThemeAttribute();
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      // Base UI's own name for "a click outside does not dismiss this". The
      // prop is inverted because the published API asks the question the other
      // way round, and the published API is the one that stays.
      disablePointerDismissal={!closeOnBackdropClick}
    >
      <Dialog.Portal {...portalTheme}>
        <Dialog.Backdrop data-slot="modal-backdrop" className={slots.backdrop()} />
        <Dialog.Viewport data-slot="modal-viewport" className={slots.viewport()}>
          <Dialog.Popup
            ref={attachPopup}
            // Base UI's default is the first tabbable element, which here is
            // the close button. Pointing at the popup itself is what the
            // hand-rolled `tabIndex={-1}` container did, and it is why the
            // dialog's own title is what gets announced.
            // The function form, not the ref form: Base UI reads a `RefObject`
            // early enough that the popup is sometimes still `null`, and it
            // then silently falls back to the first tabbable element. Reading
            // `.current` at focus time is the same intent without the race.
            initialFocus={() => popup.current}
            data-slot="modal"
            // `class`, not an appended string: a caller's `max-w-3xl` would
            // otherwise emit alongside `max-w-lg` and leave CSS source order to
            // pick one. A dialog is sized by its caller often enough that this
            // is the prop most likely to be reached for.
            className={cn(slots.popup(), className)}
            {...props}
          >
            <div data-slot="modal-header" className={slots.header()}>
              {/*
                * The heading text lives on the render element rather than on
                * `Title`: Base UI keeps the element's own children, and the
                * a11y lint rule can only see content it can read literally.
                */}
              <Dialog.Title
                data-slot="modal-title"
                className={slots.title()}
                render={<h3>[ {title} ]</h3>}
              />
              <Dialog.Close
                data-slot="modal-close"
                className={slots.close()}
                aria-label="Close dialog"
              >
                &times;
              </Dialog.Close>
            </div>

            <div data-slot="modal-body" className={slots.body()}>
              {children}
            </div>

            <div data-slot="modal-footer" className={slots.footer()}>
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
