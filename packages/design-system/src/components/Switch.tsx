'use client';

import { forwardRef } from 'react';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import { cn } from '../lib/recipe';
import { booleanControl } from './booleanControl';
import { FieldFrame, accentStyle } from './fieldFrame';
import type { BooleanFieldProps } from './fieldFrame';

export interface SwitchProps extends BooleanFieldProps {}

/**
 * A switch, with its label, description and error as one unit.
 *
 * The same boolean `Checkbox` carries, in the presentation that says *this
 * takes effect now*: a setting being turned on, not an answer being collected.
 * Pick by when the change lands, not by how it looks — a switch inside a form
 * that only applies on submit is a checkbox drawn misleadingly.
 *
 * There is no indeterminate switch, deliberately. A track has two ends and a
 * third state has nowhere to sit; a tri-state answer is a `Checkbox`.
 *
 * It composes the same `Field` as every other control here —
 * `SwitchRootState extends FieldRootState` — so `error`, `disabled`,
 * `required` and the description behave exactly as they do on `Input`, and
 * form participation is Base UI's hidden input rather than one written here.
 *
 * ```tsx
 * <Switch name="telemetry" label="Send anonymous telemetry" defaultChecked />
 * ```
 */
export const Switch = forwardRef<HTMLSpanElement, SwitchProps>(function Switch(
  {
    label,
    error,
    helperText,
    accent = 'primary',
    className = '',
    style,
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
  const styles = booleanControl({ shape: 'track' });

  return (
    <FieldFrame label={label} error={error} helperText={helperText} disabled={disabled} layout="inline">
      <BaseSwitch.Root
        ref={ref}
        id={id}
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        // The event details Base UI passes second are dropped here for the same
        // reason `Checkbox` drops them: they are a Base UI type, and the
        // published surface names none.
        onCheckedChange={(next) => onCheckedChange?.(next)}
        data-slot="switch"
        style={accentStyle(accent, style)}
        // `cn`, for the reason `Checkbox` states: the merge is what makes a
        // caller's utility replace the recipe's rather than race it.
        className={cn(styles.control(), className)}
        {...props}
      >
        <BaseSwitch.Thumb data-slot="switch-thumb" className={styles.mark()} />
      </BaseSwitch.Root>
    </FieldFrame>
  );
});
