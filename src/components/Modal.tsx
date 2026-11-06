import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../lib/recipe';
import { Button } from './Button';

/**
 * Everything the browser will focus, in DOM order. `:not([tabindex="-1"])`
 * keeps programmatically-focusable-but-not-tabbable elements out of the cycle,
 * which is the same set Tab itself walks.
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
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
 * A modal dialog.
 *
 * "Modal" is a behavioural claim, not a visual one: while it is open, the rest
 * of the page is inert. Four things make that true, and this component
 * previously had none of them — it was a styled `position: fixed` box.
 *
 *   1. **Portal.** `position: fixed` resolves against the nearest ancestor with
 *      a `transform`, `filter` or `contain` — so rendered in place, a dialog
 *      inside any animated or filtered subtree is clipped to that subtree
 *      instead of covering the viewport. Portalling to `body` removes the
 *      question.
 *   2. **Focus trap.** Without one, Tab walks straight out of the dialog into
 *      the page behind it, which a keyboard user cannot see is still there.
 *   3. **Escape.** The dialog is dismissible by keyboard, not only by finding
 *      and clicking a close control.
 *   4. **Scroll lock.** The background does not scroll under the overlay.
 *
 * Focus is moved into the dialog on open and returned on close to whatever had
 * it before — otherwise dismissing the dialog drops focus onto `<body>` and the
 * next Tab restarts from the top of the document.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeOnBackdropClick = true,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Captured at open time rather than read at close time: by the time the
  // dialog is closing, focus is inside it and the original element is gone
  // from `document.activeElement`.
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // `document` does not exist while server-rendering, and a portal needs it.
  // Rendering nothing until mounted keeps the server and client markup
  // identical instead of hydration-mismatching.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) {
        // Nothing to cycle between — hold focus on the dialog rather than
        // letting Tab escape to the page behind it.
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      // Only the two ends need intercepting; between them the browser's own
      // ordering is what we want, and re-implementing it would get it wrong.
      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleKeyDown, true);

    // The dialog container carries `tabIndex={-1}`, so it can hold focus when
    // it contains nothing focusable, and a screen reader announces the dialog
    // rather than starting mid-content on the first control.
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      data-slot="modal-backdrop"
      className="fixed inset-0 z-top flex items-center justify-center bg-surface-overlay p-4"
      // A backdrop is not an interactive control, so it gets no role and no key
      // handler — Escape already covers the keyboard path, and adding a
      // `button` role here would put a meaningless stop in the tab order.
      onMouseDown={(event) => {
        if (closeOnBackdropClick && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        // `cn`, not a template string: appended, a caller's `max-w-3xl` would
        // have emitted alongside `max-w-lg` and left CSS source order to pick
        // one. A dialog is sized by its caller often enough that this is the
        // prop most likely to be reached for.
        className={cn(
          'max-h-[90vh] w-full max-w-lg overflow-y-auto border-4 border-edge-strong bg-surface-raised font-mono shadow-hard-lg',
          className,
        )}
      >
        <div data-slot="modal-header" className="flex items-center justify-between border-b-2 border-edge-strong bg-surface-base px-6 py-4">
          <h3
            id={titleId}
            data-slot="modal-title"
            className="font-display text-xl font-bold uppercase tracking-wider text-content-primary"
          >
            [ {title} ]
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-edge-strong bg-surface-raised px-2 font-mono text-lg font-bold text-content-primary transition-colors hover:bg-surface-base hover:text-accent-tertiary focus-visible:ring-2 focus-visible:ring-accent-primary"
            aria-label="Close dialog"
          >
            &times;
          </button>
        </div>

        <div data-slot="modal-body" className="p-6 font-sans text-sm leading-relaxed text-content-primary">
          {children}
        </div>

        <div data-slot="modal-footer" className="flex justify-end gap-3 border-t-2 border-edge-strong bg-surface-base px-6 py-4">
          {footer || (
            <Button onClick={onClose} variant="tertiary" bracketed size="sm">
              CLOSE
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
