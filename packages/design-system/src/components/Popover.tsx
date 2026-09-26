'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { recipe } from '../lib/recipe';
import { usePortalThemeAttribute } from './portalTheme';
import { floatingSurface, floatingParts } from './floatingSurface';
import type { OverlayAlign, OverlaySide } from './Tooltip';

export interface PopoverProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'className'> {
  /**
   * The control that opens it — one element that forwards its ref, such as
   * `Button`. It gets `aria-expanded` and `aria-haspopup`, and focus returns
   * to it when the popover closes.
   */
  trigger: ReactElement;
  /**
   * The heading, and the popover's accessible name: the popup is a
   * `role="dialog"`, and a dialog without a name announces nothing about
   * what it is. Required for that reason.
   */
  title: string;
  /** The content. Anything — text, a form, a list of links. */
  children: ReactNode;
  /** The preferred side. `bottom` by default; flips when there is no room. */
  side?: OverlaySide;
  /** Alignment along the trigger's edge. `start` by default. */
  align?: OverlayAlign;
  /** Controlled open state. Leave unset and the popover manages its own. */
  open?: boolean;
  /** Open on first render, uncontrolled — for a story or a walkthrough. */
  defaultOpen?: boolean;
  /** Called with the next open state, whatever caused the change. */
  onOpenChange?: (open: boolean) => void;
  /** Merged into the popup's classes — a caller's `w-96` wins over `w-80`. */
  className?: string;
}

// A panel: a reading width, and a height capped at the room below (or above)
// the trigger, scrolling inside rather than running off the viewport.
const popover = recipe({
  extend: floatingSurface,
  slots: { popup: 'w-80 max-h-(--available-height) overflow-y-auto' },
});

/**
 * Contextual content anchored to the control that asked for it.
 *
 * What a {@link Tooltip} cannot carry: content worth reading, content with
 * controls in it, content a touch user needs. It opens on press rather than
 * hover, so it works on every input, and it is a non-modal `role="dialog"`
 * named by its `title` — the page stays live behind it, and nothing outside
 * it is hidden from assistive technology.
 *
 * Built on `@base-ui/react/popover`. Positioning, collision handling and the
 * dismissal stack are the primitive's; this is the surface and its header.
 *
 * ## Focus and dismissal
 *
 * Opening moves focus into the popover — to its first control, which is the
 * close button when the content has none of its own. Escape, a press outside,
 * or the close button dismisses it, and focus returns to the trigger.
 * Escape closes only the topmost surface: a popover opened inside a `Modal`
 * closes and leaves the modal standing, as `AlertDialog` does (#162).
 *
 * @example
 * ```tsx
 * <Popover trigger={<Button size="sm">DETAILS</Button>} title="Build 1482">
 *   Passed 41 of 42 gates. `check:visual` is still running.
 * </Popover>
 * ```
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  {
    trigger,
    title,
    children,
    side = 'bottom',
    align = 'start',
    open,
    defaultOpen,
    onOpenChange,
    className,
    ...props
  },
  ref,
) {
  const styles = popover();
  const parts = floatingParts();

  const portalTheme = usePortalThemeAttribute();
  return (
    <BasePopover.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
    >
      <BasePopover.Trigger render={trigger} />
      <BasePopover.Portal>
        <BasePopover.Positioner
          {...portalTheme}
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={8}
          data-slot="popover-positioner"
          className={styles.positioner()}
        >
          <BasePopover.Popup
            ref={ref}
            data-slot="popover"
            className={styles.popup({ class: className })}
            {...props}
          >
            <div data-slot="popover-header" className={parts.header()}>
              {/* The text sits on the render element, as `Modal`'s does, so
                  the a11y lint can read the heading's content literally. */}
              <BasePopover.Title
                data-slot="popover-title"
                className={parts.title()}
                render={<h3>{title}</h3>}
              />
              <BasePopover.Close
                data-slot="popover-close"
                className={parts.close()}
                aria-label="Close"
              >
                &times;
              </BasePopover.Close>
            </div>
            <div data-slot="popover-body" className={parts.body()}>
              {children}
            </div>
          </BasePopover.Popup>
        </BasePopover.Positioner>
      </BasePopover.Portal>
    </BasePopover.Root>
  );
});
