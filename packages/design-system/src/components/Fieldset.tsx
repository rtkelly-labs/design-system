import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';
import { cn } from '../lib/recipe';
import { GroupFrame, labelClassName } from './fieldFrame';

export interface LegendProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  /** Merged onto the legend, after the label typography it shares with every field label. */
  className?: string;
  /** The group's name. Plain text in almost every case; it is announced as the group's label. */
  children?: ReactNode;
}

/**
 * The name of a group — the one accessible name a `Fieldset` or a
 * `RadioGroup` is announced by.
 *
 * `Fieldset` and `RadioGroup` render one for you from their `legend` prop, so
 * reach for this directly only when the name is more than a string. It must
 * sit inside one of them: Base UI's `Fieldset.Legend` registers its id with
 * the enclosing fieldset, and that registration is the whole association.
 *
 * A `div`, not a native `<legend>`. The group it names is sometimes a
 * `<fieldset>` and sometimes a `radiogroup`, and a `<legend>` is only valid as
 * the first child of the former; `aria-labelledby` works for both.
 *
 * ```tsx
 * <Fieldset>
 *   <Legend>Notify me about <code>main</code></Legend>
 *   …
 * </Fieldset>
 * ```
 */
export const Legend = forwardRef<HTMLDivElement, LegendProps>(function Legend(
  { className, ...props },
  ref,
) {
  return (
    <BaseFieldset.Legend
      ref={ref}
      data-slot="fieldset-legend"
      // `cn` for the reason every control here gives: a caller's utility has to
      // replace the shared typography, not race it in CSS source order.
      className={cn(labelClassName(), className)}
      {...props}
    />
  );
});

export interface FieldsetProps
  extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'className' | 'children'> {
  /**
   * The group's visible name, rendered as a `Legend` and wired to the group by
   * `aria-labelledby`. Omit it only to place a `Legend` of your own among the
   * children; a group with no name is one a screen reader announces as
   * "group" and nothing else.
   */
  legend?: string;
  /**
   * The group's validation message — an error about the set, not any one
   * control in it ("choose at least one region"). It describes the fieldset
   * and every control inside it, so it is read when focus enters the group.
   * It is not a live region; `ErrorSummary` announces a failed submit.
   * Per-control errors belong on the controls.
   */
  error?: string;
  /**
   * Standing guidance for the whole group, shown under it and replaced by
   * `error` while one is set — the same rule a single field follows.
   */
  helperText?: string;
  /**
   * Disables every control in the group. It is the native fieldset attribute
   * *and* the fieldset context Base UI's fields read, so `Checkbox`, `Switch`
   * and `Input` inside grey out and refuse input without each being told.
   */
  disabled?: boolean;
  /** Merged onto the `<fieldset>`, not the wrapper around it and its message. */
  className?: string;
  /** The controls the group gathers — typically `Checkbox`es, or a pair of `Input`s. */
  children: ReactNode;
}

/**
 * A set of controls that answer one question together, with a label, a
 * description and an error for the set.
 *
 * `Input`, `Checkbox` and `Switch` each carry one label and one message for
 * one control. A set of checkboxes, a start-and-end date pair or an address
 * block needs the same three things one level up, and this is where they
 * live: it is the same field contract — `error` is the message *and* the
 * invalid state, `helperText` gives way to it — applied to a group. It is not
 * radio-specific; `RadioGroup` is built on the same frame.
 *
 * What it gets right that a `<div>` with a heading does not: the legend is
 * the group's accessible name, the group's error is in the fieldset's
 * `aria-describedby` rather than hanging off whichever control it was placed
 * next to, and `disabled` reaches every control inside.
 *
 * ```tsx
 * <Fieldset legend="Regions" helperText="Where the replicas run">
 *   <Checkbox name="region" value="eu" label="Europe" />
 *   <Checkbox name="region" value="us" label="North America" />
 * </Fieldset>
 * ```
 */
export const Fieldset = forwardRef<HTMLFieldSetElement, FieldsetProps>(function Fieldset(
  { legend, error, helperText, disabled, className, children, ...props },
  ref,
) {
  return (
    <GroupFrame
      ref={ref as Ref<HTMLElement>}
      legend={legend ? <Legend>{legend}</Legend> : undefined}
      error={error}
      helperText={helperText}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </GroupFrame>
  );
});
