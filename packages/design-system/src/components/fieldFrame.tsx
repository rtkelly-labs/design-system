import { forwardRef, useId } from 'react';
import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode } from 'react';
import { Field as BaseField } from '@base-ui/react/field';
import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';
import { recipe } from '../lib/recipe';
import { accentVar } from '../lib/theme';
import type { AccentToken } from '../lib/theme';

/**
 * The one field implementation.
 *
 * It was inside `Input.tsx`, which was fine while the only fields were the
 * three text controls. It is a module of its own now because `Checkbox` and
 * `Switch` need exactly the same semantics in a different arrangement, and the
 * alternative — a second `Field.Root` composed by hand next door — is the
 * "second field implementation" #238 exists to prevent. One implementation is
 * also what makes a boolean and a text input agree about what `error` means.
 *
 * It carries three arrangements of that one contract: `FieldFrame` for a
 * single control, `GroupFrame` for a set of controls that answer one question
 * together (#239), and `FieldItem` for one option inside such a set. The group
 * is the reason the message moved into `FieldMessage`: a radio group's error
 * and a text input's error are the same element, wired the same way, and a
 * second copy is the drift this module exists to stop.
 *
 * Nothing exports this from `src/index.ts`, deliberately, for the reason
 * `dialogSurface.ts` states: it holds a `recipe`, whose type comes from
 * `tailwind-variants`, and publishing it would put that library back into the
 * `.d.ts`.
 */

const frame = recipe({
  slots: {
    root: 'flex w-full flex-col gap-1.5 font-mono',
    label: 'text-xs font-bold uppercase tracking-wider text-content-secondary',
    message: 'font-mono text-xs',
    /**
     * The grouping element — a `<fieldset>`, or the `radiogroup` a `RadioGroup`
     * renders in its place. The reset is the browser's fieldset chrome: the
     * groove border, the padding and the `min-inline-size: min-content` that
     * lets a fieldset overflow its column.
     */
    group: 'm-0 flex min-w-0 flex-col gap-3 border-0 p-0',
  },
  variants: {
    invalid: {
      true: {
        message: 'font-bold text-intent-danger',
      },
      false: {
        message: 'text-content-muted',
      },
    },
    /**
     * Where the label sits, which is the whole difference between a text field
     * and a boolean one.
     *
     * `stack` writes the label above the control. `inline` puts the control
     * *inside* the label, which is Base UI's documented pattern for a checkbox
     * or a switch: the label then owns the hit area, and `htmlFor` still points
     * at the hidden input, so a click on the words toggles the control without
     * anyone wiring an `onClick`.
     */
    layout: {
      stack: {},
      inline: {
        label:
          'flex w-fit cursor-pointer items-center gap-3 text-sm text-content-primary '
          + 'data-[disabled]:cursor-not-allowed data-[disabled]:text-content-muted',
      },
    },
  },
  defaultVariants: {
    invalid: false,
    layout: 'stack',
  },
});

/** Shared by every control built on this frame. */
export interface FieldProps {
  /**
   * The visible label, wired to the control by `id` — generated when none is
   * supplied, so the association holds without the caller arranging it. Omit
   * it only where a visible label exists elsewhere, and then give the control
   * an `aria-label`: a field with no name is a field a screen reader cannot
   * announce.
   */
  label?: string;
  /**
   * The validation message. Its presence is also the invalid state: it sets
   * `aria-invalid`, switches the border to `intent.danger`, and joins the
   * control's `aria-describedby`, so it is read when the field takes focus.
   * It is not a live region: on submit, `ErrorSummary` is what announces the
   * errors. Pass the message, never a boolean — "invalid" without a reason leaves the
   * reader to guess what to change.
   */
  error?: string;
  /**
   * Standing guidance shown under the control — a format, a constraint, what
   * the value is for. Always visible, unlike `error`, and replaced by it while
   * one is set, because two competing instructions under one field is worse
   * than either.
   */
  helperText?: string;
  /**
   * Semantic accent for the focus border. Accepts an `Emphasis`
   * (`primary`…`quiet`) or an `Intent` (`info`/`success`/`warning`/`danger`);
   * the legacy hue names still resolve to the same values.
   */
  accent?: AccentToken;
  /**
   * Merged onto the control itself, not the wrapper — so it sizes the input
   * (`w-full`) rather than the label-and-error group around it.
   */
  className?: string;
}

/**
 * The props a boolean control adds to the shared field contract.
 *
 * Declared once and implemented by both `Checkbox` and `Switch`, because #238
 * is one capability in two presentations: a pair that disagreed about
 * `readOnly` or `onCheckedChange` would be the same defect as having no
 * control at all.
 *
 * `onCheckedChange` takes the new value and nothing else. Base UI passes event
 * details as a second argument; forwarding that would name a Base UI type in
 * the published `.d.ts`, which the confinement rule forbids.
 */
export interface BooleanFieldProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'defaultChecked' | 'onChange'>,
    FieldProps {
  /** Ticked or on. Supplying it makes the control controlled; pair it with `onCheckedChange`. */
  checked?: boolean;
  /** The starting value for an uncontrolled control. Ignored when `checked` is set. */
  defaultChecked?: boolean;
  /** Called with the new value whenever the user toggles the control. */
  onCheckedChange?: (checked: boolean) => void;
  /**
   * The name the value is submitted under. Base UI renders the hidden input
   * that carries it, so a control inside a `<form>` appears in `FormData`
   * without anything here rendering an input of its own.
   */
  name?: string;
  /** The value submitted when checked. Defaults to the native `"on"`. */
  value?: string;
  /** Ignores user interaction, and greys the label with it. */
  disabled?: boolean;
  /** Announces and renders the current value, but refuses to change it. */
  readOnly?: boolean;
  /** Marks the control as required for form submission. */
  required?: boolean;
  /** Placed on the control, never on the wrapper — see `FieldFrame`. */
  id?: string;
}

/**
 * The accent is known at runtime, so it travels as a custom property.
 *
 * The caller's `style` is merged in rather than left to a later prop spread:
 * spread after `style={accentStyle(…)}`, any `style={{ width: 320 }}` replaced
 * the whole object and took `--field-accent` with it, leaving a checked
 * control with no fill. The accent is set last so a caller cannot unset it by
 * accident.
 */
export function accentStyle(accent: AccentToken, style?: CSSProperties): CSSProperties {
  return { ...style, '--field-accent': accentVar(accent) } as CSSProperties;
}

export interface FieldFrameProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  /** Passed to `Field.Root`, so the label and message grey out with the control. */
  disabled?: boolean;
  /** `stack` for a text control, `inline` for a boolean one. */
  layout?: 'stack' | 'inline';
  /** Merged onto the wrapper. The control's own `className` is its business. */
  className?: string;
  /** Merged onto the label, for the row a boolean control lays out. */
  labelClassName?: string;
  /**
   * Whether the label is a native `<label>`. `false` renders it as a `div`
   * that names the control by `aria-labelledby` and focuses it on click — for
   * a control that is a button, where a native label's click would activate
   * it. `Select`'s listbox trigger is that case (#164).
   */
  nativeLabel?: boolean;
  /** An explicit id for the label, for a second element that must be named by it. */
  labelId?: string;
  children: ReactNode;
}

/**
 * The label, message and ARIA wiring every control shares.
 *
 * This was a hand-rolled `useField()` returning `id`, `aria-invalid` and
 * `aria-describedby`. Base UI's `Field` is the public equivalent, and it owns
 * two things the hook did not: `aria-describedby` composes when a field carries
 * *both* a description and an error, and the validity state is exposed to
 * descendants — `CheckboxRootState extends FieldRootState`, so `Checkbox` and
 * `Switch` inherit `disabled`, `touched`, `dirty`, `valid`, `filled` and
 * `focused` rather than re-deriving them.
 *
 * `error` here is a prop rather than native constraint validation, so
 * `Field.Root` is told it is `invalid` and `Field.Error` is matched
 * unconditionally. That keeps the control externally driven, which is what the
 * existing API promises.
 *
 * Both parts render a `span` rather than Base UI's default `p`, because a
 * message sits inside a flex column beside the control and a block paragraph
 * would change the layout.
 *
 * A caller's `id` goes on the *control*, never on `Field.Root` — the root's
 * `id` names the wrapper, and passing it there silently leaves the control on
 * a generated id while the label still points at it. The symptom is an `id`
 * prop that appears to do nothing.
 */
export const FieldFrame = forwardRef<HTMLDivElement, FieldFrameProps>(function FieldFrame(
  {
    label,
    error,
    helperText,
    disabled,
    layout = 'stack',
    className,
    labelClassName,
    nativeLabel = true,
    labelId,
    children,
    ...props
  },
  ref,
) {
  const styles = frame({ invalid: Boolean(error), layout });
  // Base UI warns when a non-native label renders a `<label>`, so the element
  // follows the flag.
  const labelElement = nativeLabel ? undefined : <div />;

  return (
    <BaseField.Root
      ref={ref}
      data-slot="field"
      className={styles.root({ class: className })}
      invalid={Boolean(error)}
      disabled={disabled}
      {...props}
    >
      {layout === 'inline' ? (
        // The control goes *inside* the label. A boolean control is a span with
        // `role="checkbox"`, not a labelable element, so a sibling label would
        // associate by `aria-labelledby` alone and the words would not be a hit
        // target. Base UI's own Field examples nest it for the same reason.
        label ? (
          <BaseField.Label data-slot="field-label" className={styles.label({ class: labelClassName })}>
            {children}
            {label}
          </BaseField.Label>
        ) : (
          children
        )
      ) : (
        <>
          {label && (
            <BaseField.Label
              id={labelId}
              nativeLabel={nativeLabel}
              render={labelElement}
              data-slot="field-label"
              className={styles.label({ class: labelClassName })}
            >
              {label}
            </BaseField.Label>
          )}
          {children}
        </>
      )}
      <FieldMessage error={error} helperText={helperText} />
    </BaseField.Root>
  );
});

export interface FieldMessageProps {
  error?: string;
  helperText?: string;
  /** Names the rendered message, for a group that must point at it by hand. */
  id?: string;
  /** `field` for a single control's message, `fieldset` for a group's. */
  slot?: 'field' | 'fieldset';
}

/**
 * The message under a field: the error when there is one, the standing
 * guidance otherwise, and nothing when neither is set.
 *
 * Its own component because two frames render it. Both parts register their
 * `id` with the enclosing `Field.Root`, which is what puts them in the
 * control's `aria-describedby` — for a group, in the `radiogroup`'s, and in
 * every option's through `Field.Item`'s inherited message ids.
 *
 * ## An error is described, not announced (#299)
 *
 * The error is not a live region: no `role="alert"`, no `role="status"`, no
 * `aria-live`. Base UI's `Field.Error` adds none of its own either. The error
 * reaches a screen reader through the control's `aria-describedby`, together
 * with `aria-invalid`, so it is read when the reader arrives at the field.
 *
 * It was `role="alert"`, and that collided with `ErrorSummary`. On a failed
 * submit every invalid field fired an assertive alert at the moment the
 * summary took focus, so a four-error form read four alerts and then the same
 * four messages again in the summary. This is GOV.UK's pattern: the summary
 * takes focus and says what is wrong, each link moves focus to its field, and
 * the field's own error is read as its description on arrival.
 *
 * Inline or on-blur validation, with no summary, is the one case where a live
 * error would help. No consumer does it yet. A form that needs it should own
 * one live region for the whole form, rather than every field carrying its own.
 */
export function FieldMessage({ error, helperText, id, slot = 'field' }: FieldMessageProps) {
  const styles = frame({ invalid: Boolean(error) });

  if (error) {
    return (
      <BaseField.Error
        match
        id={id}
        data-slot={`${slot}-error`}
        className={styles.message()}
        render={<span />}
      >
        &gt; {error}
      </BaseField.Error>
    );
  }
  if (helperText) {
    return (
      <BaseField.Description id={id} data-slot={`${slot}-description`} className={styles.message()} render={<span />}>
        &gt; {helperText}
      </BaseField.Description>
    );
  }
  return null;
}

/**
 * The label typography, for the one label this module does not render: the
 * public `Legend`, which lives beside `Fieldset` so its type is published under
 * its own name. A group's name and a field's name are the same kind of text,
 * and reading the class from here is what keeps them the same.
 */
export function labelClassName(className?: string): string {
  return frame().label({ class: className });
}

export interface GroupFrameProps
  extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> {
  /** The group's name — a rendered `Legend`, placed first inside the group. */
  legend?: ReactNode;
  error?: string;
  helperText?: string;
  /** Disables the whole group: the fieldset, and every `Field` inside it. */
  disabled?: boolean;
  /** Merged onto the grouping element, not the wrapper around it and its message. */
  className?: string;
  /**
   * What the group renders as. Omitted, it is a `<fieldset>`. `RadioGroup`
   * passes Base UI's `RadioGroup` here, so the `radiogroup` role, the roving
   * focus and the fieldset's legend wiring land on one element rather than two
   * nested ones each claiming to be the group.
   */
  render?: ReactElement;
  children: ReactNode;
}

/**
 * The label, message and ARIA wiring for a *set* of controls.
 *
 * `FieldFrame` models one control with one label, one description and one
 * error. A group needs all three for the set, and the failure when it does
 * not have them is specific: each option gets a label, the group gets none,
 * and the group's error is announced against whichever option carried it.
 *
 * So the set is a `Field.Root` of its own, wrapping a Base UI `Fieldset.Root`:
 *
 * - The legend names the group. `Fieldset.Legend` registers its id and the
 *   fieldset (or the `radiogroup` rendered in its place) takes it as
 *   `aria-labelledby` — one accessible name for the set.
 * - The message is `FieldMessage`, registered with the group's `Field.Root`.
 *   A `radiogroup` is that field's control and composes it into its own
 *   `aria-describedby`; a plain `<fieldset>` is not a Base UI control, so the
 *   id is also written onto it here by hand. Either way the error describes
 *   the group rather than one option.
 * - `aria-invalid` is left to the control. It is permitted on `radiogroup`,
 *   which Base UI sets from the field's validity, and not on `group` — the
 *   role a `<fieldset>` has — so a plain fieldset carries `data-invalid` for
 *   styling and announces its error through the description alone.
 * - `disabled` goes to both the field and the fieldset. The fieldset's context
 *   is what every `Field.Root` inside it reads, so a `Checkbox` in a disabled
 *   `Fieldset` greys and refuses input without being told.
 *
 * The message sits *after* the grouping element, inside the wrapper, because a
 * `radiogroup` owns radios, and a message span among them is a child the role
 * does not allow.
 */
export const GroupFrame = forwardRef<HTMLElement, GroupFrameProps>(function GroupFrame(
  { legend, error, helperText, disabled, className, render, children, ...props },
  ref,
) {
  const styles = frame({ invalid: Boolean(error) });
  const messageId = useId();
  const hasMessage = Boolean(error || helperText);

  return (
    <BaseField.Root
      data-slot="fieldset-field"
      className={styles.root()}
      invalid={Boolean(error)}
      disabled={disabled}
    >
      <BaseFieldset.Root
        ref={ref}
        render={render}
        disabled={disabled}
        data-slot="fieldset"
        data-invalid={error ? '' : undefined}
        aria-describedby={hasMessage ? messageId : undefined}
        className={styles.group({ class: className })}
        {...props}
      >
        {legend}
        {children}
      </BaseFieldset.Root>
      <FieldMessage error={error} helperText={helperText} id={messageId} slot="fieldset" />
    </BaseField.Root>
  );
});

export interface FieldItemProps {
  label?: string;
  /** Guidance for this one option, described on it alone. */
  helperText?: string;
  /** Disables this option without disabling the rest of the group. */
  disabled?: boolean;
  children: ReactNode;
}

/**
 * One option inside a group: its own label and description, the group's
 * error.
 *
 * A `Field.Item`, not a nested `Field.Root`. A second root would give the
 * option a field of its own, and the group's control — the `radiogroup` —
 * would stop seeing the option's hidden input, which is the half that makes
 * the selected value appear in `FormData`. `Field.Item` scopes only the label
 * and description, and inherits the group's message ids, so the group error
 * still reaches each option's `aria-describedby` while the option's own
 * guidance reaches that option only.
 *
 * The label is the `inline` one `FieldFrame` gives a boolean — the control
 * inside it, so the words are the hit target.
 */
export function FieldItem({ label, helperText, disabled, children }: FieldItemProps) {
  const styles = frame({ layout: 'inline' });

  return (
    <BaseField.Item data-slot="field-item" className="flex flex-col gap-1" disabled={disabled}>
      {label ? (
        <BaseField.Label data-slot="field-label" className={styles.label()}>
          {children}
          {label}
        </BaseField.Label>
      ) : (
        children
      )}
      {helperText && (
        <BaseField.Description
          data-slot="field-description"
          // Indented past the control, so the guidance sits under its words.
          className={styles.message({ class: 'pl-9' })}
          render={<span />}
        >
          &gt; {helperText}
        </BaseField.Description>
      )}
    </BaseField.Item>
  );
}
