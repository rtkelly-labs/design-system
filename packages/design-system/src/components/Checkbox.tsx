'use client';

import { forwardRef } from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { cn } from '../lib/recipe';
import { booleanControl } from './booleanControl';
import { FieldFrame, accentStyle } from './fieldFrame';
import type { BooleanFieldProps } from './fieldFrame';

export interface CheckboxProps extends BooleanFieldProps {
  /**
   * The third state: neither ticked nor unticked.
   *
   * It is a prop rather than a value `checked` can take, because that is what
   * the platform does — `input.indeterminate` is separate from `input.checked`
   * and a form submits the underlying `checked`. Base UI sets the DOM property
   * and renders `aria-checked="mixed"`; nothing here tracks it.
   */
  indeterminate?: boolean;
}

/**
 * A checkbox, with its label, description and error as one unit.
 *
 * Reach for it to choose *many* from a set, or to answer one yes/no that the
 * form submits. `Switch` is the same boolean where the change takes effect
 * immediately and there is nothing to submit — a setting rather than an answer.
 *
 * It composes the same `Field` the text controls use, so `error` does three
 * things at once here too: the message, `aria-invalid`, and the danger border.
 * `CheckboxRootState extends FieldRootState`, so `disabled`, `touched`,
 * `dirty`, `valid`, `filled` and `focused` arrive as data attributes on the
 * control without either the field or the control being told about the other.
 *
 * Everything a hand-rolled checkbox gets wrong is Base UI's here and not
 * written in this file: the generated `id` and its label association, the
 * composed `aria-describedby`, `aria-checked="mixed"`, the `indeterminate` DOM
 * property, and the hidden input that makes the control appear in `FormData`
 * under its `name`.
 *
 * ```tsx
 * <Checkbox name="terms" label="Accept the terms" required />
 * ```
 */
export const Checkbox = forwardRef<HTMLSpanElement, CheckboxProps>(function Checkbox(
  {
    label,
    error,
    helperText,
    accent = 'primary',
    className = '',
    style,
    indeterminate = false,
    checked,
    defaultChecked,
    onCheckedChange,
    name,
    value,
    disabled,
    readOnly,
    required,
    id,
    ...props
  },
  ref,
) {
  const styles = booleanControl({ shape: 'box' });

  return (
    <FieldFrame label={label} error={error} helperText={helperText} disabled={disabled} layout="inline">
      <BaseCheckbox.Root
        ref={ref}
        id={id}
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        indeterminate={indeterminate}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        // Base UI's handler takes event details as a second argument. Dropping
        // them is the confinement rule: forwarding the object would name a Base
        // UI type in the published `.d.ts`.
        onCheckedChange={(next) => onCheckedChange?.(next)}
        data-slot="checkbox"
        style={accentStyle(accent, style)}
        // `cn`, not an appended string: the merge is what makes a caller's
        // utility actually replace the recipe's rather than race it in CSS
        // source order. Same composition `Modal` uses over `dialogSurface`.
        className={cn(styles.control(), className)}
        {...props}
      >
        <BaseCheckbox.Indicator data-slot="checkbox-indicator" className={styles.mark()}>
          {/*
            * ASCII, not an icon: the mark is a glyph in the same mono face the
            * rest of the system sets, so it scales with the type rather than
            * being a second unit of measure. `aria-hidden` because the control
            * announces itself through `aria-checked` — the glyph would
            * otherwise be read as part of the name.
            */}
          <span aria-hidden="true">{indeterminate ? '-' : 'X'}</span>
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
    </FieldFrame>
  );
});
