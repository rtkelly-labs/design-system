'use client';

import { createContext, forwardRef, useContext } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { cn, recipe } from '../lib/recipe';

/** The two heights, matching `Button`'s `xs` (28px) and `sm` (40px). */
export type SegmentedControlSize = 'xs' | 'sm';

const segmented = recipe({
  slots: {
    root: 'inline-flex items-stretch font-mono font-bold uppercase',
    item:
      'relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center whitespace-nowrap '
      + 'border-2 border-edge-default bg-transparent text-content-muted transition-colors duration-quick ease-brutalist '
      + '-ml-0.5 first:ml-0 hover:text-content-primary '
      + 'data-[disabled]:cursor-not-allowed data-[disabled]:border-edge-subtle data-[disabled]:text-content-muted '
      + 'motion-reduce:transition-none '
      // D6: selection device pending. A neutral placeholder: the strong edge
      // and the primary ink, with no accent fill, until the owner chooses.
      + 'data-[checked]:z-10 data-[checked]:border-edge-strong data-[checked]:text-content-primary',
  },
  variants: {
    size: {
      xs: { item: 'h-7 px-2 text-xs' },
      sm: { item: 'h-10 px-4 text-sm' },
    },
  },
  defaultVariants: { size: 'xs' },
});

const SegmentedControlContext = createContext<SegmentedControlSize>('xs');

export interface SegmentedControlProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'className'> {
  /**
   * The group's accessible name, read before the selected option — "Calendar
   * view". Required: a segmented control has no visible legend of its own.
   */
  label: string;
  /** The selected option's `value`. Supplying it makes the control controlled; pair it with `onValueChange`. */
  value?: string;
  /** The option selected at first, for an uncontrolled control. */
  defaultValue?: string;
  /** Called with the newly selected option's `value`, from a click or an arrow key. */
  onValueChange?: (value: string) => void;
  /** Height, matched to `Button`: `xs` is 28px, `sm` is 40px. Defaults to `xs`. */
  size?: SegmentedControlSize;
  /** Disables every option. One option takes its own `disabled`. */
  disabled?: boolean;
  /** The `SegmentedControlItem`s, in the order the arrow keys visit them. */
  children: ReactNode;
  /** Merged onto the group. For placement. */
  className?: string;
}

/**
 * A single-select view switcher: one of a few related choices, all visible at
 * once — Week, Day, Month; All, Mine, Unread.
 *
 * It is **not** a tab pattern. Tabs pair each tab with a panel through
 * `aria-controls`, and a switcher whose options filter or re-render one shared
 * region has no panel to point at; a tab strip with the pairing removed, or
 * with empty hidden panels, is a workaround that axe flags as a critical
 * `aria-valid-attr-value`. This is a `radiogroup` instead, which is what the
 * pattern is: Primer's SegmentedControl and Carbon's content switcher make the
 * same call. Reach for `Tabs` when each option reveals its own content.
 *
 * Built on Base UI's radio group, so the keyboard model comes with it: `Tab`
 * enters the group once at the selected option, the arrow keys move *and
 * select*, wrapping at either end. Sized to sit beside `Button` `xs` or `sm`.
 *
 * ```tsx
 * <SegmentedControl label="Calendar view" value={view} onValueChange={setView}>
 *   <SegmentedControlItem value="week">WEEK</SegmentedControlItem>
 *   <SegmentedControlItem value="day">DAY</SegmentedControlItem>
 * </SegmentedControl>
 * ```
 */
export const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>(
  function SegmentedControl(
    {
      label,
      value,
      defaultValue,
      onValueChange,
      size = 'xs',
      disabled,
      children,
      className,
      ...props
    },
    ref,
  ) {
    const styles = segmented({ size });
    return (
      <SegmentedControlContext.Provider value={size}>
        <BaseRadioGroup<string>
          ref={ref}
          {...props}
          data-slot="segmented-control"
          aria-label={label}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          onValueChange={(next) => onValueChange?.(next)}
          className={cn(styles.root(), className)}
        >
          {children}
        </BaseRadioGroup>
      </SegmentedControlContext.Provider>
    );
  },
);

export interface SegmentedControlItemProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'onChange' | 'className'> {
  /** What the control's `value` becomes when this option is chosen. */
  value: string;
  /** Disables this option alone. */
  disabled?: boolean;
  /** The label. Short: the control does not wrap. Written in caps at the call site, as `Button` is. */
  children: ReactNode;
  /** Merged onto the option. */
  className?: string;
}

/** One option of a {@link SegmentedControl}. It renders inside one. */
export const SegmentedControlItem = forwardRef<HTMLSpanElement, SegmentedControlItemProps>(
  function SegmentedControlItem({ value, disabled, children, className, ...props }, ref) {
    const size = useContext(SegmentedControlContext);
    const styles = segmented({ size });
    return (
      <BaseRadio.Root
        ref={ref}
        {...props}
        value={value}
        disabled={disabled}
        data-slot="segmented-control-item"
        className={cn(styles.item(), className)}
      >
        {children}
      </BaseRadio.Root>
    );
  },
);
