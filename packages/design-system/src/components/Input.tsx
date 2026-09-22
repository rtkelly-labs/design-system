import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { recipe } from '../lib/recipe';
import { Field as BaseField } from '@base-ui/react/field';
import { FieldFrame, accentStyle } from './fieldFrame';
import type { FieldProps } from './fieldFrame';

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
 *
 * The label, message and ARIA wiring are not here: they are `FieldFrame` in
 * `./fieldFrame`, shared with `Checkbox` and `Switch` so that one field
 * implementation serves every control.
 */

/**
 * The control every text-shaped field wears: `Input`, `TextArea`, and both of
 * `Select`'s presentations — the native `<select>` and the listbox trigger.
 *
 * Exported for `./Select` (#164), whose closed trigger has to look like the
 * native control it replaced — one recipe is what makes that true rather than
 * approximately true. `src/index.ts` names this module's exports rather than
 * re-exporting it wholesale, so the recipe, and the `tailwind-variants` type
 * it carries, stays out of the published `.d.ts`.
 */
export const fieldControl = recipe({
  slots: {
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

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>,
    FieldProps {}

/**
 * A single-line text field, with its label, helper text and error as one unit.
 *
 * `Input`, `TextArea` and `Select` share one contract — `label`, `error`,
 * `helperText`, `accent` — and one recipe. The first two share a page; `Select`
 * has its own, for the list it opens. Pick by the shape of the answer, not by
 * styling: one line, several, or one of a fixed set.
 *
 * The field owns its own labelling. Supplying `label` associates it with a
 * generated `id` when the caller gives none, and `error` does three things at
 * once — the message, `aria-invalid`, and the danger border — so an invalid
 * field cannot end up looking wrong while announcing nothing.
 */
export function Input({
  label,
  error,
  helperText,
  /**
   * Semantic accent for the focus border, as on every control here. Declared
   * on `FieldProps` in `./fieldFrame`, and named again at the default so the
   * generated props table has a description rather than a blank cell.
   */
  accent = 'primary',
  /** Merged onto the control itself, not the label-and-error group. */
  className = '',
  id,
  ...props
}: InputProps) {
  const styles = fieldControl({ invalid: Boolean(error) });

  return (
    <FieldFrame label={label} error={error} helperText={helperText}>
      <BaseField.Control
        id={id}
        data-slot="field-control"
        style={accentStyle(accent)}
        // `class` is the recipe's override slot: it merges in rather than being
        // appended after, so a caller's utility actually wins.
        className={styles.control({ class: className })}
        {...props}
      />
    </FieldFrame>
  );
}

export interface TextAreaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>,
    FieldProps {}

export function TextArea({
  label,
  error,
  helperText,
  /**
   * Semantic accent for the focus border, as on every control here. Declared
   * on `FieldProps` in `./fieldFrame`, and named again at the default so the
   * generated props table has a description rather than a blank cell.
   */
  accent = 'primary',
  /** Merged onto the control itself, not the label-and-error group. */
  className = '',
  id,
  ...props
}: TextAreaProps) {
  const styles = fieldControl({ shape: 'box', invalid: Boolean(error) });

  return (
    <FieldFrame label={label} error={error} helperText={helperText}>
      {/*
        The function form of `render`, not the element form, because
        `Field.Control` is typed to `HTMLInputElement` — spreading a
        textarea's own props through it is a type error rather than a
        cosmetic one. This takes the wired props and puts them on an element
        of the right type.
      */}
      <BaseField.Control
        render={(controlProps) => (
          <textarea
            {...controlProps}
            {...props}
            id={id}
            style={accentStyle(accent)}
            className={styles.control({ class: className })}
          />
        )}
      />
    </FieldFrame>
  );
}
