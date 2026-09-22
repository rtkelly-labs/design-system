import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Select } from '../components/Select';
import type { SelectOption, SelectProps } from '../components/Select';

/** The regions every sample here chooses between. */
const REGIONS: SelectOption[] = [
  { label: 'US East (N. Virginia)', value: 'us-east-1' },
  { label: 'US West (Oregon)', value: 'us-west-2' },
  { label: 'EU West (Frankfurt)', value: 'eu-west-1' },
  { label: 'EU North (Stockholm)', value: 'eu-north-1' },
  { label: 'AP South (Singapore)', value: 'ap-south-1' },
];

const meta: Meta<typeof Select> = {
  title: 'Foundations/Select',
  component: Select,
  tags: ['autodocs', 'stable'],
  args: {
    label: 'Deployment region',
    name: 'region',
    options: REGIONS,
  },
  render: (args: SelectProps) => (
    <div className="max-w-sm">
      <Select {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof Select>;

/**
 * The resting state: label, closed control, helper text. The control is the
 * same field `Input` draws; open it and the list is this system's — rows on
 * `surface.raised`, the highlighted one filled with the accent, the chosen one
 * marked `>` — rather than the operating system's.
 */
export const Default: Story = {
  args: {
    helperText: 'Where the cluster runs',
  },
};

/**
 * A `placeholder` starts the field from nothing, which is what makes
 * `required` mean something: with no placeholder the first option is chosen,
 * as on a native `<select>`, and a required field is satisfied before anyone
 * has looked at it.
 */
export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Choose a region',
    required: true,
  },
};

/**
 * `error` set. The same prop is the message, `aria-invalid` on the trigger and
 * the danger border, exactly as on `Input`.
 */
export const WithError: Story = {
  args: {
    placeholder: 'Choose a region',
    error: 'A region is required to provision the cluster',
  },
};

/**
 * One option disabled — the row the visual suite opens. The keyboard steps
 * over it (Base UI's default would let the arrows stop on it), the pointer
 * cannot choose it, and it is drawn `text.muted` so it reads as present but
 * unavailable.
 */
export const DisabledOption: Story = {
  args: {
    defaultValue: 'us-west-2',
    options: REGIONS.map((r) => (r.value === 'eu-west-1' ? { ...r, disabled: true } : r)),
    helperText: 'EU West is at capacity',
  },
};

/**
 * `native` — the platform's own `<select>`. The closed control is the same
 * recipe; the open list is the operating system's again, reached by the
 * Level's `color-scheme` and nothing else. Worth it for a long list on a
 * phone, where the native picker scrolls with momentum and sits under the
 * thumb. That is the whole reason the prop exists.
 */
export const Native: Story = {
  args: {
    native: true,
    helperText: 'The platform picker',
  },
};

function ControlledExample() {
  const [value, setValue] = useState('eu-north-1');

  return (
    <div className="flex max-w-sm flex-col gap-3 font-mono text-sm text-content-primary">
      <Select label="Deployment region" name="region" options={REGIONS} value={value} onValueChange={setValue} />
      <span>&gt; region: {value}</span>
    </div>
  );
}

/**
 * Controlled: `value` plus `onValueChange`. The handler receives the chosen
 * option's `value` and nothing else — on both presentations, so switching to
 * `native` changes no caller code.
 */
export const Controlled: Story = {
  render: () => <ControlledExample />,
};

/**
 * Every closed state on one surface — the row the visual suite asserts at
 * rest. The open list is asserted separately, opened by keyboard, on both
 * Levels.
 */
export const AllStates: Story = {
  render: () => (
    <div className="grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
      <Select label="Chosen" name="chosen" options={REGIONS} defaultValue="eu-west-1" helperText="Helper text" />
      <Select label="Placeholder" name="placeholder" options={REGIONS} placeholder="Choose a region" />
      <Select label="Invalid" name="invalid" options={REGIONS} placeholder="Choose a region" error="Required" />
      <Select label="Disabled" name="disabled" options={REGIONS} disabled />
      <Select label="Native" name="native" options={REGIONS} native />
      <Select label="Accent" name="accent" options={REGIONS} accent="tertiary" defaultValue="ap-south-1" />
    </div>
  ),
};
