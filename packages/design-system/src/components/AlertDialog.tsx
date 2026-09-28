'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { cn } from '../lib/recipe';
import { usePortalThemeAttribute } from './portalTheme';
import { dialogSurface } from './dialogSurface';
import { Button } from './Button';

export interface AlertDialogProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'className'> {
  isOpen: boolean;
  /** Dismissal — Escape, or the cancel control. Never a backdrop click. */
  onClose: () => void;
  /** The destructive action. Called instead of, not as well as, `onClose`. */
  onConfirm: () => void;
  title: string;
  /**
   * What the action does, and what it costs. Short: this is wired as the
   * dialog's accessible description, so a screen reader reads it immediately
   * after the title.
   */
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * Replaces the cancel/confirm pair outright, for the rare confirmation with
   * a third option. Supplying it means owning dismissal — nothing else in the
   * dialog closes it.
   */
  footer?: ReactNode;
  className?: string;
}

/**
 * A destructive-action confirmation, on Base UI's `alert-dialog`.
 *
 * ## Why this is not `Modal` with different buttons
 *
 * The difference is the dismissal contract, and it is the whole point.
 * `AlertDialog` cannot be dismissed by clicking outside it: Base UI's
 * `AlertDialog.Root` omits `disablePointerDismissal` from its props
 * altogether, because the answer is never "yes". A confirmation you can
 * dismiss with a stray click is a confirmation that has not confirmed
 * anything, and shipping `Modal` without this is how a delete dialog ends up
 * backdrop-dismissible by default.
 *
 * Escape still closes it. That is deliberate and not a contradiction: Escape
 * is deliberate, unambiguous and always means *cancel*, and removing it would
 * trap a keyboard user in the dialog.
 *
 * It renders `role="alertdialog"` rather than `role="dialog"`, which is what
 * tells a screen reader to announce the whole surface rather than just its
 * name — the reason the description below is wired rather than decorative.
 *
 * ## The cancel control is the close control
 *
 * There is no `×`. A confirmation asks a question with two answers and both
 * are buttons; adding a third dismissal affordance in the corner makes the
 * safe answer ambiguous. Cancel is `AlertDialog.Close`, so it is also what a
 * touch screen reader finds when it looks for the way out.
 */
export const AlertDialog = forwardRef<HTMLDivElement, AlertDialogProps>(function AlertDialog(
  {
    isOpen,
    onClose,
    onConfirm,
    title,
    children,
    confirmLabel = 'CONFIRM',
    cancelLabel = 'CANCEL',
    footer,
    className,
    ...props
  },
  ref,
) {
  const slots = dialogSurface();

  const portalTheme = usePortalThemeAttribute();
  return (
    <BaseAlertDialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BaseAlertDialog.Portal {...portalTheme}>
        <BaseAlertDialog.Backdrop
          data-slot="alert-dialog-backdrop"
          className={slots.backdrop()}
        />
        <BaseAlertDialog.Viewport
          data-slot="alert-dialog-viewport"
          className={slots.viewport()}
        >
          <BaseAlertDialog.Popup
            ref={ref}
            data-slot="alert-dialog"
            // Narrower than `Modal`'s `max-w-lg`: a confirmation is one
            // sentence and two buttons, and a wide one reads as a workflow the
            // reader is expected to study rather than a question to answer.
            className={cn(slots.popup(), 'max-w-md', className)}
            {...props}
          >
            <div data-slot="alert-dialog-header" className={slots.header()}>
              <BaseAlertDialog.Title
                data-slot="alert-dialog-title"
                className={slots.title()}
                render={<h3>[ {title} ]</h3>}
              />
            </div>

            <BaseAlertDialog.Description
              data-slot="alert-dialog-body"
              className={slots.body()}
              // A `div`, not Base UI's default `p`: the body takes arbitrary
              // nodes, and a block element inside a paragraph is invalid HTML
              // that the parser silently repairs by closing the paragraph
              // early — which would leave the description pointing at nothing.
              render={<div />}
            >
              {children}
            </BaseAlertDialog.Description>

            <div data-slot="alert-dialog-footer" className={slots.footer()}>
              {footer || (
                <>
                  {/*
                    * The label goes on the render element rather than on
                    * `Close`: `Button`'s props are a union whose link arm
                    * requires `children` and `href`, so an empty `<Button />`
                    * does not typecheck even though Base UI would fill it in.
                    */}
                  <BaseAlertDialog.Close
                    render={
                      <Button variant="default" size="sm">
                        {cancelLabel}
                      </Button>
                    }
                  />
                  <Button onClick={onConfirm} variant="tertiary" bracketed size="sm">
                    {confirmLabel}
                  </Button>
                </>
              )}
            </div>
          </BaseAlertDialog.Popup>
        </BaseAlertDialog.Viewport>
      </BaseAlertDialog.Portal>
    </BaseAlertDialog.Root>
  );
});
