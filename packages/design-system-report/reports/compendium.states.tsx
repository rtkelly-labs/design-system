/**
 * The state matrix: what a control looks like in each state it actually has, driven by forced props.
 *
 * Each list is typed against the component's own props (`Partial<ComponentProps>`), so a prop the
 * component does not have is a compile error, and `compendium.test.ts` proves every forced state
 * changes the markup, so a prop that does nothing (an invented state) fails too. A state is only
 * listed where the component has a prop for it: Switch has no `indeterminate`, Badge has no
 * `disabled`, and neither is faked.
 *
 * Not in the matrix, because they cannot be forced in a static document: `:hover`, `:focus`,
 * `:active`, `:focus-visible`. Those are recorded here and not simulated with classes, which would
 * show a state the stylesheet does not have.
 *
 * State ids carry a `forced-` prefix so they can never collide with a story export name.
 */

import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { Badge } from '../../design-system/src/components/Badge';
import { Button } from '../../design-system/src/components/Button';
import { Checkbox } from '../../design-system/src/components/Checkbox';
import { Input } from '../../design-system/src/components/Input';
import { Radio, RadioGroup } from '../../design-system/src/components/RadioGroup';
import { Select } from '../../design-system/src/components/Select';
import { Switch } from '../../design-system/src/components/Switch';
import type { PlateState } from './compendium.registry';

export interface Matrix<P> {
  /** Props every state starts from. */
  base: P;
  /** Forced props per state, merged over `base`. An empty object is the resting state. */
  states: Readonly<Record<string, Partial<P>>>;
}

/** Binds a matrix to its component and returns plate states. */
function plateStates<P extends object>(Component: ComponentType<P>, m: Matrix<P>, wrap?: (el: ReactNode) => ReactNode): PlateState[] {
  return Object.entries(m.states).map(([id, forced]) => {
    const props = { ...m.base, ...forced } as P;
    return { id: `forced-${id}`, from: 'custom' as const, render: () => (wrap ? wrap(<Component {...props} />) : <Component {...props} />), authored: props };
  });
}

type ButtonP = ComponentProps<typeof Button>;
export const BUTTON: Matrix<ButtonP> = {
  base: { children: 'SAVE CHANGES' },
  states: {
    default: {},
    secondary: { variant: 'secondary' },
    primary: { variant: 'primary' },
    inverse: { variant: 'inverse' },
    small: { size: 'sm' },
    large: { size: 'lg' },
    bracketed: { bracketed: true },
    disabled: { disabled: true },
    pending: { pending: true, pendingLabel: 'Saving' },
  },
};

type BadgeP = ComponentProps<typeof Badge>;
export const BADGE: Matrix<BadgeP> = {
  base: { children: 'STABLE' },
  // Badge is not interactive, so the states it has are its accents.
  states: { primary: {}, secondary: { accent: 'secondary' }, tertiary: { accent: 'tertiary' }, quiet: { accent: 'quiet' }, info: { accent: 'info' }, success: { accent: 'success' }, warning: { accent: 'warning' }, danger: { accent: 'danger' } },
};

type CheckboxP = ComponentProps<typeof Checkbox>;
export const CHECKBOX: Matrix<CheckboxP> = {
  base: { label: 'Accept the terms' },
  states: {
    unchecked: {},
    checked: { defaultChecked: true },
    indeterminate: { indeterminate: true },
    disabled: { disabled: true },
    'disabled-checked': { disabled: true, defaultChecked: true },
    invalid: { error: 'You must accept to continue' },
    required: { required: true },
  },
};

type SwitchP = ComponentProps<typeof Switch>;
export const SWITCH: Matrix<SwitchP> = {
  base: { label: 'Send anonymous telemetry' },
  states: {
    off: {},
    on: { defaultChecked: true },
    disabled: { disabled: true },
    'disabled-on': { disabled: true, defaultChecked: true },
    invalid: { error: 'Telemetry is required by policy' },
    required: { required: true },
  },
};

type InputP = ComponentProps<typeof Input>;
export const INPUT: Matrix<InputP> = {
  base: { label: 'Project name', defaultValue: 'edge-cache' },
  states: {
    default: {},
    disabled: { disabled: true },
    invalid: { error: 'Names are lowercase, no spaces' },
    required: { required: true },
    'read-only': { readOnly: true },
    helper: { helperText: 'Shown in the dashboard' },
  },
};

type SelectP = ComponentProps<typeof Select>;
const REGIONS = [
  { label: 'us-east-1', value: 'us-east-1' },
  { label: 'eu-west-2', value: 'eu-west-2' },
];
export const SELECT: Matrix<SelectP> = {
  base: { label: 'Region', options: REGIONS, defaultValue: 'us-east-1' },
  states: {
    default: {},
    disabled: { disabled: true },
    invalid: { error: 'Pick a region' },
    required: { required: true },
    native: { native: true },
  },
};

type RadioGroupP = ComponentProps<typeof RadioGroup>;
export const RADIO_GROUP: Matrix<RadioGroupP> = {
  base: {
    legend: 'Deployment',
    name: 'deployment',
    defaultValue: 'cloud',
    children: [<Radio key="c" value="cloud" label="Cloud" />, <Radio key="h" value="hybrid" label="Hybrid" />],
  },
  states: {
    default: {},
    disabled: { disabled: true },
    invalid: { error: 'Choose one' },
    required: { required: true },
    'read-only': { readOnly: true },
  },
};

/** What a matrix cannot show, for the record and for the docs. */
export const NOT_FORCEABLE = [':hover', ':focus', ':focus-visible', ':active', 'open popup states (see the overlay backlog)'] as const;

export const buttonStates = () => plateStates(Button as ComponentType<ButtonP>, BUTTON);
export const badgeStates = () => plateStates(Badge, BADGE);
export const checkboxStates = () => plateStates(Checkbox, CHECKBOX);
export const switchStates = () => plateStates(Switch, SWITCH);
export const inputStates = () => plateStates(Input, INPUT);
export const selectStates = () => plateStates(Select, SELECT);
export const radioGroupStates = () => plateStates(RadioGroup, RADIO_GROUP);

/** Every matrix with its component, for the test that proves no state is invented. */
export const MATRICES: readonly { component: string; render: (id: string) => ReactNode; ids: string[] }[] = (
  [
    ['Button', Button as ComponentType<ButtonP>, BUTTON],
    ['Badge', Badge, BADGE],
    ['Checkbox', Checkbox, CHECKBOX],
    ['Switch', Switch, SWITCH],
    ['Input', Input, INPUT],
    ['Select', Select, SELECT],
    ['RadioGroup', RadioGroup, RADIO_GROUP],
  ] as unknown as [string, ComponentType<object>, Matrix<object>][]
).map(([component, Component, m]) => ({
  component,
  ids: Object.keys(m.states),
  render: (id: string) => <Component {...m.base} {...m.states[id]} />,
}));
