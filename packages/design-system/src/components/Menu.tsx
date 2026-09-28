'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Menu as BaseMenu } from '@base-ui/react/menu';
import { Check } from 'lucide-react';
import { cn, recipe } from '../lib/recipe';
import { usePortalThemeAttribute } from './portalTheme';
import { floatingSurface, floatingParts } from './floatingSurface';
import type { OverlayAlign, OverlaySide } from './Tooltip';

export interface MenuProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'> {
  /**
   * The control that opens it — one element that forwards its ref, such as
   * `Button`. Its accessible name becomes the menu's: Base UI labels the
   * `role="menu"` popup by the trigger, so name the trigger for what the
   * menu holds.
   */
  trigger: ReactElement;
  /** `MenuItem`, `MenuRadioGroup` and `MenuSeparator`, in order. */
  children: ReactNode;
  /** The preferred side. `bottom` by default; flips when there is no room. */
  side?: OverlaySide;
  /** Alignment along the trigger's edge. `start` by default. */
  align?: OverlayAlign;
  /** Controlled open state. Leave unset and the menu manages its own. */
  open?: boolean;
  /** Open on first render, uncontrolled — for a story or a walkthrough. */
  defaultOpen?: boolean;
  /** Called with the next open state, whatever caused the change. */
  onOpenChange?: (open: boolean) => void;
  /** Merged into the popup's classes. */
  className?: string;
}

// A list: a minimum width so short labels do not make a sliver, and the
// available height as a cap, so a long menu scrolls inside itself.
const menu = recipe({
  extend: floatingSurface,
  slots: { popup: 'min-w-48 max-h-(--available-height) overflow-y-auto py-1' },
});

/**
 * A list of actions or choices, opened from a button.
 *
 * The *Context actions* capability: rename, duplicate, delete, or a choice
 * between a few settings, behind one control rather than spread across a
 * toolbar. Built on `@base-ui/react/menu`, which owns the keyboard model —
 * Enter, Space or ArrowDown on the trigger opens it on the first item,
 * ArrowUp on the last; the arrow keys move and wrap; Home and End jump;
 * typing a letter jumps to the item that starts with it; Enter or a click
 * selects; Escape or a press outside closes and returns focus to the
 * trigger. Tab closes it too, rather than stepping through the items: a menu
 * is one stop in the tab order.
 *
 * Escape closes only the topmost surface — a menu opened inside a `Modal`
 * closes and leaves the modal open, the stack #162 established.
 *
 * @example
 * ```tsx
 * <Menu trigger={<Button size="sm">ACTIONS</Button>}>
 *   <MenuItem onClick={rename}>Rename</MenuItem>
 *   <MenuItem disabled>Move</MenuItem>
 *   <MenuSeparator />
 *   <MenuItem intent="danger" onClick={remove}>Delete</MenuItem>
 * </Menu>
 * ```
 */
export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  {
    trigger,
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
  const styles = menu();

  const portalTheme = usePortalThemeAttribute();
  return (
    <BaseMenu.Root
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}
    >
      <BaseMenu.Trigger render={trigger} />
      <BaseMenu.Portal>
        <BaseMenu.Positioner
          {...portalTheme}
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          data-slot="menu-positioner"
          className={styles.positioner()}
        >
          <BaseMenu.Popup
            ref={ref}
            data-slot="menu"
            className={styles.popup({ class: className })}
            {...props}
          >
            {children}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
});

export interface MenuItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  /** The label. Its first letter is what typeahead matches. */
  children: ReactNode;
  /**
   * `danger` for the destructive action — the `intent.danger` ink, and the
   * danger fill when highlighted. Put it last, after a `MenuSeparator`.
   */
  intent?: 'danger';
  /**
   * Shown muted and cannot be activated. It stays in the arrow-key sequence,
   * announced as unavailable, rather than vanishing from it.
   */
  disabled?: boolean;
  /**
   * Close the menu when the item is chosen. On by default; turn it off for an
   * item that changes something the user will want to change again at once.
   */
  closeOnClick?: boolean;
  /** Merged into the item's classes. */
  className?: string;
}

/**
 * One action in a {@link Menu}.
 *
 * Handle it with `onClick`, which fires for a pointer press and for Enter or
 * Space alike — Base UI routes the keyboard through the same handler.
 */
export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  { children, intent, disabled = false, closeOnClick = true, className, ...props },
  ref,
) {
  const parts = floatingParts();

  // A disabled item stays in Base UI's roving list, as the WAI-ARIA menu
  // pattern recommends: the arrow keys still land on it, so a keyboard or
  // screen-reader user learns the action exists and is unavailable, rather
  // than finding a gap. Base UI marks it `aria-disabled` and never fires it.
  return (
    <BaseMenu.Item
      ref={ref}
      disabled={disabled}
      closeOnClick={closeOnClick}
      data-slot="menu-item"
      className={cn(
        parts.item(),
        intent === 'danger' && parts.danger(),
        disabled && parts.disabled(),
        className,
      )}
      {...props}
    >
      {children}
    </BaseMenu.Item>
  );
});

export interface MenuRadioGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange' | 'className'> {
  /**
   * The group's visible heading, and its accessible name — Base UI wires the
   * label's id to the group's `aria-labelledby`, so the name lands on the
   * `role="group"` element rather than on a wrapper.
   */
  label?: string;
  /** The chosen item's `value`. Controlled; pair with `onValueChange`. */
  value?: string;
  /** The initially chosen value, uncontrolled. */
  defaultValue?: string;
  /** Called with the chosen item's `value`. */
  onValueChange?: (value: string) => void;
  /** `MenuRadioItem`s. */
  children: ReactNode;
  /** Merged into the group's classes. */
  className?: string;
}

/**
 * A choose-one set inside a {@link Menu} — a setting rather than an action.
 * The chosen item carries `aria-checked` and a check mark; the mark, not the
 * colour, is what says which one is chosen.
 */
export const MenuRadioGroup = forwardRef<HTMLDivElement, MenuRadioGroupProps>(
  function MenuRadioGroup(
    { label, value, defaultValue, onValueChange, children, className, ...props },
    ref,
  ) {
    const parts = floatingParts();

    return (
      <BaseMenu.RadioGroup
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange ? (next: string) => onValueChange(next) : undefined}
        data-slot="menu-radio-group"
        className={className}
        {...props}
      >
        {label ? (
          <BaseMenu.GroupLabel data-slot="menu-group-label" className={parts.groupLabel()}>
            {label}
          </BaseMenu.GroupLabel>
        ) : null}
        {children}
      </BaseMenu.RadioGroup>
    );
  },
);

export interface MenuRadioItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  /** What choosing this item sets the group's value to. */
  value: string;
  /** The label. Its first letter is what typeahead matches. */
  children: ReactNode;
  /**
   * Close the menu once a value is chosen. Off by default, as Base UI's is —
   * a setting is often adjusted and checked in one visit. A picker whose
   * choice is the whole point, like a theme, turns it on.
   */
  closeOnClick?: boolean;
  /** Merged into the item's classes. */
  className?: string;
}

/** One choice in a {@link MenuRadioGroup}. */
export const MenuRadioItem = forwardRef<HTMLDivElement, MenuRadioItemProps>(
  function MenuRadioItem({ value, children, closeOnClick = false, className, ...props }, ref) {
    const parts = floatingParts();

    return (
      <BaseMenu.RadioItem
        ref={ref}
        value={value}
        closeOnClick={closeOnClick}
        data-slot="menu-radio-item"
        className={cn(parts.item(), className)}
        {...props}
      >
        {/* The slot is always there so labels align whether or not they are
            chosen; only the mark inside it mounts and unmounts. */}
        <span aria-hidden="true" className={parts.indicator()}>
          <BaseMenu.RadioItemIndicator data-slot="menu-radio-indicator">
            <Check size={14} strokeWidth={3} />
          </BaseMenu.RadioItemIndicator>
        </span>
        {children}
      </BaseMenu.RadioItem>
    );
  },
);

export interface MenuSeparatorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  /** Merged into the rule's classes. */
  className?: string;
}

/**
 * A rule between groups of items — before the destructive action, or between
 * actions and settings. Announced as a separator; never a keyboard stop.
 */
export const MenuSeparator = forwardRef<HTMLDivElement, MenuSeparatorProps>(
  function MenuSeparator({ className, ...props }, ref) {
    const parts = floatingParts();
    return (
      <BaseMenu.Separator
        ref={ref}
        data-slot="menu-separator"
        className={cn(parts.separator(), className)}
        {...props}
      />
    );
  },
);
