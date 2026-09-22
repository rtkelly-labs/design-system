import { forwardRef, useId } from 'react';
import type { HTMLAttributes, KeyboardEvent, Ref } from 'react';
import { ChevronDown } from 'lucide-react';
import { Field as BaseField } from '@base-ui/react/field';
import { Select as BaseSelect } from '@base-ui/react/select';
import { recipe } from '../lib/recipe';
import { FieldFrame, accentStyle } from './fieldFrame';
import { fieldControl } from './Input';
import type { FieldProps } from './fieldFrame';

export interface SelectOption {
  /** What the option says, in the list and in the closed control once chosen. */
  label: string;
  /** What `value` becomes, and what a form submits, when this option is chosen. */
  value: string;
  /**
   * Shown but not choosable. The keyboard skips it, as the pointer cannot
   * select it, so a list with a disabled row still has somewhere to land.
   */
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'defaultValue' | 'onChange' | 'children'>,
    FieldProps {
  /** The choices, in the order the list shows them and the arrow keys visit them. */
  options: SelectOption[];
  /** The chosen option's `value`. Supplying it makes the field controlled; pair it with `onValueChange`. */
  value?: string;
  /**
   * The option chosen at first, for an uncontrolled field. Omitted, the first
   * enabled option is chosen — what a native `<select>` does — unless a
   * `placeholder` is set, in which case nothing is.
   */
  defaultValue?: string;
  /** Called with the newly chosen option's `value`, on either presentation. */
  onValueChange?: (value: string) => void;
  /**
   * Shown in the closed control while nothing is chosen. Its presence is also
   * what makes "nothing chosen" the starting state, so a required field can
   * refuse to submit until someone picks.
   */
  placeholder?: string;
  /** The name the chosen value is submitted under in a native form. */
  name?: string;
  /** The `id` of a `<form>` elsewhere in the page that the value belongs to. */
  form?: string;
  /** An autofill hint, as on a native `<select>`. */
  autoComplete?: string;
  /** Ignores user interaction, and greys the label and control with it. */
  disabled?: boolean;
  /** Requires a choice before the form submits; announced as `aria-required`. */
  required?: boolean;
  /** Placed on the control — the trigger, or the native `<select>` — never on the wrapper. */
  id?: string;
  /**
   * Render the platform's own `<select>` instead of this system's list.
   *
   * A deliberate choice rather than a fallback (#164): on a phone, a long list
   * is genuinely better as the native picker, which scrolls with momentum and
   * sits where the thumb is. The cost is the one the listbox exists to remove —
   * the open list is painted by the operating system, which `color-scheme`
   * reaches as a light/dark hint and not as a palette.
   */
  native?: boolean;
}

// The open list. The closed trigger is `fieldControl`, so it matches the text
// controls; everything that only exists once the list is open is here. The
// highlighted row is an accent fill with inverse text and the chosen row
// carries an accent mark: selection devices in the sense
// `auditSelectionDevices` means, never a surface swap, and pairs
// `check:contrast` measures under `select.*`. (Comments inside the object
// literal would ship: esbuild keeps them there.)
const list = recipe({
  slots: {
    trigger:
      'flex items-center justify-between gap-3 text-left data-[disabled]:cursor-not-allowed '
      + 'data-[disabled]:border-edge-subtle data-[disabled]:bg-surface-sunken data-[disabled]:text-content-muted',
    value: 'truncate data-[placeholder]:text-content-muted',
    icon: 'flex shrink-0 text-content-secondary',
    positioner: 'z-top',
    popup:
      'min-w-[var(--anchor-width)] border-2 border-edge-strong bg-surface-raised font-mono text-sm '
      + 'text-content-primary shadow-hard-md',
    list: 'max-h-[min(var(--available-height),20rem)] overflow-y-auto py-1',
    item:
      'group flex cursor-pointer items-center gap-2 px-3 py-2 select-none '
      + 'data-[highlighted]:bg-[var(--field-accent)] data-[highlighted]:text-content-inverse '
      + 'data-[selected]:font-bold '
      + 'data-[disabled]:cursor-not-allowed data-[disabled]:text-content-muted',
    mark: 'w-3 shrink-0 text-[var(--field-accent)] group-data-[highlighted]:text-content-inverse',
    empty: 'px-3 py-2 text-content-muted',
  },
});

// Base UI's listbox lets the arrows, Home and End land on a disabled row (it
// passes `disabledIndices: []` on purpose, after the APG), and a row that can
// be focused but not chosen is a dead end under Enter. Native `<select>` skips
// them, and so does this: the keys are taken in the capture phase, before Base
// UI sees them, and focus moves to the next enabled row — which Base UI's own
// item `onFocus` then adopts as the highlight. With no enabled row at all the
// keys are left to Base UI, so the list is never left with nowhere to be.
function skipDisabledRows(event: KeyboardEvent<HTMLElement>) {
  const { key } = event;
  if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End') return;
  const rows = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]'));
  const enabled = rows.filter((row) => row.getAttribute('aria-disabled') !== 'true');
  if (enabled.length === 0) return;

  let target: HTMLElement | undefined;
  if (key === 'Home') target = enabled[0];
  else if (key === 'End') target = enabled[enabled.length - 1];
  else {
    const step = key === 'ArrowDown' ? 1 : -1;
    const from = rows.indexOf(event.target as HTMLElement);
    for (let i = from + step; i >= 0 && i < rows.length; i += step) {
      if (enabled.includes(rows[i]!)) {
        target = rows[i];
        break;
      }
    }
    // Past the last enabled row: stay put, as a native `<select>` does,
    // rather than wrapping or stepping onto a disabled one.
    if (!target) target = enabled.includes(rows[from]!) ? rows[from] : enabled[0];
  }

  event.preventDefault();
  event.stopPropagation();
  target?.focus();
}

/**
 * One of a fixed set, chosen from a list this system paints.
 *
 * The closed control is the same field as `Input` — label, helper text, error,
 * accent, drawn by the same recipe. The open list is a Base UI listbox rather
 * than the platform's, so it is drawn from the Level's roles like every other
 * surface: `surface.raised` behind the rows, an accent fill on the highlighted
 * one, an accent mark beside the chosen one. On a native `<select>` that list
 * belonged to the operating system, and `midnight` and `sketch` reached it only
 * as far as `color-scheme` allowed.
 *
 * The keyboard is a listbox's: Enter, Space or the arrows open it; the arrows,
 * Home and End move through it, skipping disabled rows; typing jumps to the
 * option that starts with what was typed; Enter commits the highlighted row
 * and Escape closes without changing anything.
 *
 * The value still reaches a native form: Base UI keeps a hidden input under
 * `name`, so `FormData` carries the chosen `value` as it did from the
 * `<select>`.
 *
 * Set `native` for the platform picker instead — see the prop.
 *
 * ```tsx
 * <Select
 *   label="Deployment region"
 *   name="region"
 *   options={[
 *     { label: 'US East (N. Virginia)', value: 'us-east-1' },
 *     { label: 'EU West (Frankfurt)', value: 'eu-west-1' },
 *   ]}
 * />
 * ```
 */
export const Select = forwardRef<HTMLElement, SelectProps>(function Select(
  {
    label,
    error,
    helperText,
    options,
    /** Semantic accent for the focus border, the highlighted row and the chosen mark. */
    accent = 'primary',
    /** Merged onto the control itself, not the label-and-error group. */
    className = '',
    style,
    id,
    value,
    defaultValue,
    onValueChange,
    placeholder,
    name,
    form,
    autoComplete,
    disabled,
    required,
    native = false,
    ...props
  },
  ref,
) {
  const labelId = useId();
  const control = fieldControl({ invalid: Boolean(error), interactive: !disabled });
  // What a native `<select>` shows with no value: its first enabled option. A
  // placeholder is the explicit way to start from nothing instead.
  const initial = defaultValue ?? (placeholder === undefined ? options.find((o) => !o.disabled)?.value : undefined);

  if (native) {
    return (
      <FieldFrame label={label} error={error} helperText={helperText} disabled={disabled}>
        <BaseField.Control
          ref={ref as Ref<HTMLInputElement>}
          id={id}
          name={name}
          disabled={disabled}
          value={value}
          defaultValue={value === undefined ? (initial ?? '') : undefined}
          onValueChange={(next) => onValueChange?.(next)}
          render={(controlProps) => (
            <select
              {...controlProps}
              {...props}
              form={form}
              autoComplete={autoComplete}
              required={required}
              data-slot="field-control"
              style={accentStyle(accent, style)}
              className={control.control({ class: className })}
            >
              {placeholder !== undefined && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((opt) => (
                // The platform paints this list. `color-scheme`, which each
                // Level declares, is as far as the palette reaches into it.
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        />
      </FieldFrame>
    );
  }

  const styles = list();
  // The listbox is named by the same label as the trigger, or by the trigger's
  // own `aria-label` when there is no visible one — a list that opens with no
  // name is announced as "listbox" and nothing else.
  const listName = label
    ? { 'aria-labelledby': labelId }
    : { 'aria-label': props['aria-label'], 'aria-labelledby': props['aria-labelledby'] };

  return (
    <FieldFrame
      label={label}
      error={error}
      helperText={helperText}
      disabled={disabled}
      nativeLabel={false}
      labelId={labelId}
    >
      <BaseSelect.Root<string>
        items={options}
        name={name}
        form={form}
        autoComplete={autoComplete}
        disabled={disabled}
        required={required}
        // `''` is "nothing chosen" on the native element, so it is here too.
        value={value === undefined ? undefined : value === '' ? null : value}
        defaultValue={value === undefined ? (initial ?? null) : undefined}
        // The new value only. Base UI's second argument is its own event
        // details type, and forwarding it would publish that type.
        onValueChange={(next) => {
          if (next !== null) onValueChange?.(next);
        }}
      >
        <BaseSelect.Trigger
          ref={ref as Ref<HTMLButtonElement>}
          id={id}
          data-slot="select-trigger"
          style={accentStyle(accent, style)}
          className={control.control({ class: [styles.trigger(), className] })}
          {...props}
        >
          <BaseSelect.Value data-slot="select-value" placeholder={placeholder} className={styles.value()} />
          <BaseSelect.Icon data-slot="select-icon" className={styles.icon()}>
            <ChevronDown size={16} strokeWidth={2.5} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>
        <BaseSelect.Portal>
          {/* Below the trigger, never over it: Base UI's default slides the
              list up so the chosen row sits on the trigger, which moves with
              the value and hides the field it belongs to. */}
          <BaseSelect.Positioner alignItemWithTrigger={false} sideOffset={4} className={styles.positioner()}>
            {/* The accent again, because the list is portalled out of the
                trigger's subtree and would not inherit it. */}
            <BaseSelect.Popup
              data-slot="select-popup"
              style={accentStyle(accent)}
              className={styles.popup()}
              onKeyDownCapture={skipDisabledRows}
            >
              <BaseSelect.List data-slot="select-list" className={styles.list()} {...listName}>
                {options.map((opt) => (
                  <BaseSelect.Item
                    key={opt.value}
                    value={opt.value}
                    label={opt.label}
                    disabled={opt.disabled}
                    data-slot="select-item"
                    className={styles.item()}
                  >
                    <span aria-hidden="true" className={styles.mark()}>
                      <BaseSelect.ItemIndicator>&gt;</BaseSelect.ItemIndicator>
                    </span>
                    <BaseSelect.ItemText data-slot="select-item-text">{opt.label}</BaseSelect.ItemText>
                  </BaseSelect.Item>
                ))}
              </BaseSelect.List>
              {options.length === 0 && (
                <div data-slot="select-empty" className={styles.empty()}>
                  &gt; No options
                </div>
              )}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </FieldFrame>
  );
});
