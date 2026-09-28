import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { Radio as BaseRadio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';
import { cn } from '../lib/recipe';
import type { AccentToken } from '../lib/theme';
import { booleanControl } from './booleanControl';
import { FieldItem, GroupFrame, accentStyle } from './fieldFrame';
import { Legend } from './Fieldset';

export interface RadioGroupProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'defaultValue' | 'onChange'> {
  /**
   * The question the set answers, rendered as a `Legend` and wired to the
   * `radiogroup` by `aria-labelledby` — the group's one accessible name. Omit
   * it only to place a `Legend` of your own among the children.
   */
  legend?: string;
  /**
   * The group's validation message. Its presence is also the invalid state:
   * `aria-invalid` on the `radiogroup`, the danger border on every option, and
   * a message that describes the group rather than any one option, read when
   * focus reaches an option. It is not a live region.
   */
  error?: string;
  /**
   * Standing guidance for the whole set, shown under it and replaced by
   * `error` while one is set. Guidance for a single option is that `Radio`'s
   * own `helperText`.
   */
  helperText?: string;
  /**
   * Semantic accent for the selected mark. Accepts an `Emphasis`
   * (`primary`…`quiet`) or an `Intent`; set once on the group and inherited by
   * every option as a custom property.
   */
  accent?: AccentToken;
  /** The selected option's `value`. Supplying it makes the group controlled; pair it with `onValueChange`. */
  value?: string;
  /** The option selected at first, for an uncontrolled group. Ignored when `value` is set. */
  defaultValue?: string;
  /** Called with the newly selected option's `value`. */
  onValueChange?: (value: string) => void;
  /**
   * The name the selected value is submitted under. One name for the group,
   * not one per option: Base UI gives every option's hidden input this name,
   * so a native form submits exactly the checked one.
   */
  name?: string;
  /** Disables every option. A single option takes its own `disabled`. */
  disabled?: boolean;
  /** Announces and renders the selection, but refuses to change it. */
  readOnly?: boolean;
  /** Requires a selection before the form submits; announced as `aria-required`. */
  required?: boolean;
  /** Merged onto the `radiogroup` element. */
  className?: string;
  /** The options — `Radio` elements, in the order arrow keys visit them. */
  children: ReactNode;
}

/**
 * Choose exactly one of a set: a legend, the options, and a description and
 * error for the set.
 *
 * Built on `Fieldset`'s frame rather than beside it. The group's label,
 * description and error are the fieldset contract — `error` is the message
 * and the invalid state, `helperText` gives way to it — and the only thing
 * this adds is what makes a set of options a *choice*: Base UI's `RadioGroup`
 * is rendered as the fieldset itself, so one element carries
 * `role="radiogroup"`, the legend's `aria-labelledby`, the group's
 * `aria-describedby` and the roving focus.
 *
 * That focus model is the difference from "several radios sharing a `name`":
 * Tab enters the group once, at the selected option or the first enabled one,
 * and leaves it on the next Tab; the arrow keys move *and select* within the
 * set, wrapping at either end.
 *
 * Reach for it for two to about seven mutually exclusive options that should
 * all be visible at once. Many more is a `Select`; a yes/no is a `Checkbox`.
 *
 * ```tsx
 * <RadioGroup legend="Preferred deployment" name="deployment" defaultValue="self-hosted">
 *   <Radio value="cloud" label="Cloud" />
 *   <Radio value="self-hosted" label="Self-hosted" />
 *   <Radio value="hybrid" label="Hybrid" />
 * </RadioGroup>
 * ```
 */
export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(function RadioGroup(
  {
    legend,
    error,
    helperText,
    accent = 'primary',
    className,
    style,
    value,
    defaultValue,
    onValueChange,
    name,
    disabled,
    readOnly,
    required,
    children,
    ...props
  },
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
      style={accentStyle(accent, style)}
      render={
        <BaseRadioGroup<string>
          name={name}
          value={value}
          defaultValue={defaultValue}
          readOnly={readOnly}
          required={required}
          // The new value only. Base UI's second argument is its own event
          // details type, and forwarding it would publish that type.
          onValueChange={(next) => onValueChange?.(next)}
        />
      }
      {...props}
    >
      {children}
    </GroupFrame>
  );
});

export interface RadioProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'onChange'> {
  /** What the group's `value` becomes, and what a form submits, when this option is chosen. */
  value: string;
  /**
   * The option's visible label. The control renders inside it, so the words
   * are the hit target as well as the name.
   */
  label?: string;
  /** Guidance for this option alone, described on it and not on its siblings. */
  helperText?: string;
  /** Disables this option while leaving the rest of the group usable. */
  disabled?: boolean;
  /** Merged onto the control itself. */
  className?: string;
}

/**
 * One option of a `RadioGroup`.
 *
 * It has a label and may have guidance of its own, but no error: validity
 * belongs to the choice, not to one answer, so it is set on the group and
 * reaches every option from there. It must render inside a `RadioGroup`, whose
 * context supplies the `name`, the selection and the roving focus.
 *
 * Like `Checkbox`, the element is a `span role="radio"` with a hidden native
 * input beside it, both Base UI's: the input is what a form submits, and the
 * span is what is focused and announced.
 *
 * ```tsx
 * <Radio value="hybrid" label="Hybrid" helperText="Control plane in our cloud" />
 * ```
 */
export const Radio = forwardRef<HTMLSpanElement, RadioProps>(function Radio(
  { value, label, helperText, disabled, className, ...props },
  ref,
) {
  const styles = booleanControl({ shape: 'dot' });

  return (
    <FieldItem label={label} helperText={helperText} disabled={disabled}>
      <BaseRadio.Root
        ref={ref}
        value={value}
        disabled={disabled}
        data-slot="radio"
        className={cn(styles.control(), className)}
        {...props}
      >
        <BaseRadio.Indicator data-slot="radio-indicator" className={styles.mark()} />
      </BaseRadio.Root>
    </FieldItem>
  );
});
