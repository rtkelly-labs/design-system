'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import { recipe } from '../lib/recipe';
import { usePortalThemeAttribute } from './portalTheme';
import { floatingSurface } from './floatingSurface';

/**
 * Which side of its trigger a floating element prefers. A preference, not a
 * promise: when that side has no room the element flips to the opposite one.
 *
 * Shared by `Tooltip`, `Popover` and `Menu`. A plain string union rather than
 * Base UI's own `Side`, so the primitive stays out of the published `.d.ts`.
 */
export type OverlaySide = 'top' | 'bottom' | 'left' | 'right';

/** How a floating element lines up along its trigger's edge. */
export type OverlayAlign = 'start' | 'center' | 'end';

export interface TooltipProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'content' | 'children' | 'className'> {
  /**
   * What the tooltip says. Short, and never the only place the information
   * lives: a tooltip is not exposed to assistive technology and never opens
   * on touch, so it restates the trigger's accessible name (and may add a
   * shortcut) rather than replacing it.
   */
  content: ReactNode;
  /**
   * The trigger — one element that forwards its ref, such as `Button`. It
   * keeps its own tag and its own accessible name; give an icon-only control
   * an `aria-label`, which the tooltip then mirrors for sighted users.
   */
  children: ReactElement;
  /** The preferred side. `top` by default; flips when there is no room. */
  side?: OverlaySide;
  /** Alignment along the trigger's edge. `center` by default. */
  align?: OverlayAlign;
  /**
   * Milliseconds of hover before it opens. Keyboard focus opens it at once,
   * whatever this says.
   */
  delay?: number;
  /** Controlled open state. Leave unset and the tooltip manages its own. */
  open?: boolean;
  /** Open on first render, uncontrolled — for a story or a walkthrough. */
  defaultOpen?: boolean;
  /** Called with the next open state, whatever caused the change. */
  onOpenChange?: (open: boolean) => void;
  /** Suppress the tooltip without changing the trigger. */
  disabled?: boolean;
  /** Merged into the popup's classes. */
  className?: string;
}

// A label, not a panel: the smallest shadow and the tightest box, capped at
// 20rem or the room the positioner measured, whichever is less. `data-instant`
// is Base UI's mark for a tooltip that replaced an adjacent one without the
// delay — fading that one in would flash.
const tooltip = recipe({
  extend: floatingSurface,
  slots: {
    popup:
      'max-w-[min(20rem,var(--available-width))] px-2 py-1 text-xs font-bold uppercase tracking-wider '
      + 'shadow-hard-sm data-[instant]:transition-none',
  },
});

/**
 * A short visual label for a control, on hover and on keyboard focus.
 *
 * The replacement for `title=""`, which a keyboard cannot reach and a theme
 * cannot style. Built on `@base-ui/react/tooltip`: the delay, the hover
 * bridge, collision flipping and the dismissal stack are the primitive's.
 *
 * A tooltip is **supplementary**. It is not announced — the trigger's own
 * accessible name is — and Base UI does not open it on touch, so an icon-only
 * control still needs an `aria-label`, and nothing a user must know may live
 * only here. Anything with content worth reading, or that a touch user
 * needs, is a {@link Popover}.
 *
 * Escape closes it, and only it: an open tooltip is the topmost surface, so a
 * `Popover` or `Modal` underneath stays open — the stack #162 established.
 *
 * @example
 * ```tsx
 * <Tooltip content="Speaker notes (N)">
 *   <Button aria-label="Show speaker notes"><FileText /></Button>
 * </Tooltip>
 * ```
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  {
    content,
    children,
    side = 'top',
    align = 'center',
    delay = 400,
    open,
    defaultOpen,
    onOpenChange,
    disabled,
    className,
    ...props
  },
  ref,
) {
  const styles = tooltip();

  const portalTheme = usePortalThemeAttribute();
  return (
    <BaseTooltip.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
      disabled={disabled}
    >
      <BaseTooltip.Trigger delay={delay} render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner
          {...portalTheme}
          side={side}
          align={align}
          sideOffset={8}
          collisionPadding={8}
          data-slot="tooltip-positioner"
          className={styles.positioner()}
        >
          <BaseTooltip.Popup
            ref={ref}
            data-slot="tooltip"
            className={styles.popup({ class: className })}
            {...props}
          >
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
});
