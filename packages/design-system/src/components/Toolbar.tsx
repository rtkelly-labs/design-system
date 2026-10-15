'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar';
import { cn, recipe } from '../lib/recipe';
import { Button } from './Button';
import type { ButtonElementProps } from './Button';

const toolbar = recipe({
  base: 'flex items-center',
  variants: {
    orientation: {
      horizontal: 'flex-wrap gap-3',
      vertical: 'flex-col items-stretch gap-1',
    },
    framed: {
      true: 'border-2 border-edge-strong bg-surface-raised px-3 py-2 shadow-hard-sm',
    },
  },
  defaultVariants: { orientation: 'horizontal' },
});

export interface ToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'> {
  /**
   * The toolbar's accessible name — "Bulk actions", "Activity bar". Required: a
   * `toolbar` with no name is announced as an anonymous one, and a page with
   * two cannot tell them apart.
   */
  label: string;
  /**
   * Which way the bar runs, and so which arrow keys move through it:
   * `horizontal` uses Left and Right, `vertical` uses Up and Down.
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Whether arrowing past either end wraps round to the other. On by default,
   * as the ARIA practices' toolbar example does it.
   */
  loopFocus?: boolean;
  /** Disables every item at once. */
  disabled?: boolean;
  /**
   * The bordered, raised, hard-shadowed surface — a bar that sits in a page.
   * Turn it off for a toolbar that is already inside a surface of its own: an
   * editor's activity bar, a table header.
   */
  framed?: boolean;
  /** `ToolbarButton`s (and any `Menu` whose trigger is one), `ToolbarSeparator`s, and plain text between them. */
  children: ReactNode;
  /** Merged onto the toolbar. For a minimum height or placement. */
  className?: string;
}

/**
 * A row (or column) of controls that is one tab stop.
 *
 * Three or more related controls — bulk actions, formatting, a view's tools —
 * are a toolbar in the ARIA practices' sense: `Tab` enters the bar once, at the
 * control last focused, and the arrow keys move between the controls, so
 * the bar costs a keyboard user one stop rather than one per button. Built on
 * Base UI's toolbar, which owns the roving focus; every `ToolbarButton` inside
 * it joins automatically, however deeply nested, including inside a
 * `ButtonGroup`.
 *
 * A control that opens a menu joins by being the menu's trigger:
 *
 * ```tsx
 * <Toolbar label="Bulk actions">
 *   <ToolbarButton size="xs">ARCHIVE</ToolbarButton>
 *   <Menu trigger={<ToolbarButton size="xs">STATUS</ToolbarButton>}>
 *     <MenuItem>Open</MenuItem>
 *   </Menu>
 * </Toolbar>
 * ```
 *
 * Give two bars that swap in the same place the same `className` minimum
 * height, so the page does not jump when one replaces the other.
 */
export const Toolbar = forwardRef<HTMLDivElement, ToolbarProps>(function Toolbar(
  { label, orientation = 'horizontal', loopFocus = true, disabled, framed = true, children, className, ...props },
  ref,
) {
  return (
    <BaseToolbar.Root
      ref={ref}
      {...props}
      data-slot="toolbar"
      aria-label={label}
      orientation={orientation}
      loopFocus={loopFocus}
      disabled={disabled}
      className={cn(toolbar({ orientation, framed: framed || undefined }), className)}
    >
      {children}
    </BaseToolbar.Root>
  );
});

/**
 * Props for a `ToolbarButton`: everything a `Button` takes (variant, size,
 * `bracketed`, `pending`), plus `bare`.
 */
export type ToolbarButtonProps = ButtonElementProps & {
  /**
   * Render a plain `<button>` carrying only the roving focus, with no `Button`
   * styling, for a bar whose items have a look of their own — an editor's
   * activity bar of icon buttons. Style it with `className`.
   */
  bare?: boolean;
};

/**
 * One control in a {@link Toolbar}: a `Button` that takes part in the bar's
 * roving focus. It forwards its ref and props, so it can be a `Menu` or
 * `Tooltip` trigger.
 *
 * Only the buttons participate; a `Link`, `Input` or anything else in a toolbar
 * stays in the ordinary tab order.
 */
export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButton(props, ref) {
    const { bare, ...rest } = props;
    if (bare) {
      const { children, className, ...plain } = rest as ButtonHTMLAttributes<HTMLButtonElement> & {
        children?: ReactNode;
        className?: string;
      };
      return (
        <BaseToolbar.Button ref={ref} {...plain} data-slot="toolbar-button" className={className}>
          {children}
        </BaseToolbar.Button>
      );
    }
    return (
      <BaseToolbar.Button
        ref={ref}
        data-slot="toolbar-button"
        // The Button is the element, so every variant, size and the pending
        // state apply; Base UI's own props are merged onto it.
        render={<Button {...(rest as ButtonElementProps)} />}
      />
    );
  },
);

export interface ToolbarSeparatorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Merged onto the rule. */
  className?: string;
}

/** A rule between groups of controls. Not a tab stop. */
export const ToolbarSeparator = forwardRef<HTMLDivElement, ToolbarSeparatorProps>(
  function ToolbarSeparator({ className, ...props }, ref) {
    return (
      <BaseToolbar.Separator
        ref={ref}
        {...props}
        data-slot="toolbar-separator"
        className={cn('self-stretch bg-edge-default data-[orientation=vertical]:w-0.5 data-[orientation=horizontal]:h-0.5', className)}
      />
    );
  },
);
