import { useId } from 'react';
import type {
  CSSProperties,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { recipe } from '../lib/recipe';
import { accentVar } from '../lib/theme';
import type { AccentToken } from '../lib/theme';

/**
 * Form controls — the reference for how a component in this system is built.
 *
 * Three things to copy from here:
 *
 *   1. **Every colour addresses a role.** `bg-surface-base`,
 *      `text-content-primary`, `border-edge-strong`, `text-intent-danger`. All
 *      four levels are styled by the same classes and a fifth would be too.
 *   2. **Styling is a `recipe`, not a template string.** The recipe has one
 *      slot per element, so a consumer can reach any of them, and conflicts
 *      resolve — a caller's `bg-surface-raised` genuinely replaces the base's
 *      `bg-surface-base` rather than racing it in CSS source order.
 *   3. **Runtime values stay out of the class string.** The focus accent comes
 *      from a prop, so it travels as a custom property; a utility cannot be
 *      assembled at build time from a value known only at runtime.
 */

const field = recipe({
  slots: {
    root: 'flex w-full flex-col gap-1.5 font-mono',
    label: 'text-xs font-bold uppercase tracking-wider text-content-secondary',
    /**
     * No `outline-none` here, deliberately. The focus accent is a *border*
     * swap, and a border swap is invisible under forced-colors — which is why
     * `styles.css` declares a global `:focus-visible` outline. Suppressing the
     * outline from this slot defeats that rule: the utility carries a class and
     * a pseudo-class, so it outranks the bare `:focus-visible` selector and
     * wins on exactly the keyboard focus the rule exists to cover.
     */
    control:
      'w-full border-2 border-edge-strong bg-surface-base font-mono text-sm text-content-primary transition-colors placeholder:text-content-muted focus:border-[var(--field-accent)]',
    message: 'font-mono text-xs',
  },
  variants: {
    /** Padding differs by control: a textarea is a box, the others are lines. */
    shape: {
      line: { control: 'px-4 py-2.5' },
      box: { control: 'p-4' },
    },
    invalid: {
      true: {
        control: 'border-intent-danger',
        message: 'font-bold text-intent-danger',
      },
      false: {
        message: 'text-content-muted',
      },
    },
    interactive: {
      true: { control: 'cursor-pointer' },
    },
  },
  defaultVariants: {
    shape: 'line',
    invalid: false,
  },
});

/** Shared by every control here. */
interface FieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  /**
   * Semantic accent for the focus border. Accepts an `Emphasis`
   * (`primary`…`quiet`) or an `Intent` (`info`/`success`/`warning`/`danger`);
   * the legacy hue names still resolve to the same values.
   */
  accent?: AccentToken;
  className?: string;
}

/**
 * Wires label, control, error and helper text together.
 *
 * `useId` rather than a slug of the label text: two fields labelled "Name" on
 * one page produced the same `id`, so clicking one label focused the other.
 * `aria-describedby` and `aria-invalid` make the error something a screen
 * reader announces rather than a visual-only cue.
 */
function useField(id: string | undefined, error?: string, helperText?: string) {
  const generated = useId();
  const fieldId = id ?? generated;
  const messageId = error ? `${fieldId}-error` : helperText ? `${fieldId}-help` : undefined;
  return {
    fieldId,
    messageId,
    controlProps: {
      id: fieldId,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': messageId,
    },
  };
}

/** The accent is known at runtime, so it travels as a custom property. */
function accentStyle(accent: AccentToken): CSSProperties {
  return { '--field-accent': accentVar(accent) } as CSSProperties;
}

function Message({
  id,
  error,
  helperText,
  className,
}: {
  id?: string;
  error?: string;
  helperText?: string;
  className: string;
}) {
  const body = error ?? helperText;
  if (!body) return null;
  return (
    <span id={id} role={error ? 'alert' : undefined} className={className}>
      &gt; {body}
    </span>
  );
}

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>,
    FieldProps {}

export function Input({
  label,
  error,
  helperText,
  accent = 'primary',
  className = '',
  id,
  ...props
}: InputProps) {
  const { fieldId, messageId, controlProps } = useField(id, error, helperText);
  const styles = field({ invalid: Boolean(error) });

  return (
    <div className={styles.root()}>
      {label && (
        <label htmlFor={fieldId} className={styles.label()}>
          {label}
        </label>
      )}
      <input
        {...controlProps}
        style={accentStyle(accent)}
        // `class` is the recipe's override slot: it merges in rather than being
        // appended after, so a caller's utility actually wins.
        className={styles.control({ class: className })}
        {...props}
      />
      <Message id={messageId} error={error} helperText={helperText} className={styles.message()} />
    </div>
  );
}

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>,
    FieldProps {}

export function TextArea({
  label,
  error,
  helperText,
  accent = 'primary',
  className = '',
  id,
  ...props
}: TextAreaProps) {
  const { fieldId, messageId, controlProps } = useField(id, error, helperText);
  const styles = field({ shape: 'box', invalid: Boolean(error) });

  return (
    <div className={styles.root()}>
      {label && (
        <label htmlFor={fieldId} className={styles.label()}>
          {label}
        </label>
      )}
      <textarea
        {...controlProps}
        style={accentStyle(accent)}
        className={styles.control({ class: className })}
        {...props}
      />
      <Message id={messageId} error={error} helperText={helperText} className={styles.message()} />
    </div>
  );
}

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'>,
    FieldProps {
  options: SelectOption[];
}

export function Select({
  label,
  error,
  helperText,
  options,
  accent = 'primary',
  className = '',
  id,
  ...props
}: SelectProps) {
  const { fieldId, messageId, controlProps } = useField(id, error, helperText);
  const styles = field({ invalid: Boolean(error), interactive: true });

  return (
    <div className={styles.root()}>
      {label && (
        <label htmlFor={fieldId} className={styles.label()}>
          {label}
        </label>
      )}
      <select
        {...controlProps}
        style={accentStyle(accent)}
        className={styles.control({ class: className })}
        {...props}
      >
        {options.map((opt) => (
          // Most platforms paint the open dropdown natively rather than from
          // CSS. `color-scheme`, which each level declares, is what actually
          // makes it match — another reason polarity is a declared field.
          <option
            key={opt.value}
            value={opt.value}
            className="bg-surface-raised text-content-primary"
          >
            {opt.label}
          </option>
        ))}
      </select>
      <Message id={messageId} error={error} helperText={helperText} className={styles.message()} />
    </div>
  );
}
