import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../components/Checkbox';

const meta: Meta<typeof Checkbox> = {
  title: 'Components/Actions & Forms/Checkbox',
  component: Checkbox,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

/**
 * The resting state: an unticked box and its label. The label is the hit
 * target as well as the name — the control is rendered inside it — so the
 * words are clickable without anything here wiring that up.
 */
export const Unchecked: Story = {
  args: {
    label: 'Accept the terms',
  },
};

/** Ticked. The mark is a mono glyph on the accent fill, not an icon font. */
export const Checked: Story = {
  args: {
    label: 'Accept the terms',
    defaultChecked: true,
  },
};

/**
 * Neither ticked nor unticked — the state a "select all" box sits in while
 * some of its children are selected.
 *
 * It is a prop rather than a value `checked` can take, because that is what
 * the platform does: `input.indeterminate` is separate from `input.checked`,
 * and a form submits the latter. `aria-checked="mixed"` and the DOM property
 * are Base UI's, not this component's.
 */
export const Indeterminate: Story = {
  args: {
    label: 'Select all regions',
    indeterminate: true,
  },
};

/**
 * Standing guidance under the control. Always visible, unlike `error`, and
 * replaced by it while one is set — two competing instructions under one field
 * is worse than either.
 */
export const WithDescription: Story = {
  args: {
    label: 'Send release notes',
    helperText: 'One email per release, never more',
  },
};

/**
 * `error` set, which is also the invalid state. One prop drives the message,
 * `aria-invalid` and the danger border, so an invalid control cannot end up
 * looking wrong while announcing nothing.
 */
export const WithError: Story = {
  args: {
    label: 'Accept the terms',
    error: 'You must accept the terms to continue',
  },
};

/**
 * Required for submission. The state is announced (`aria-required`) rather
 * than drawn as an asterisk a screen reader would read as punctuation.
 */
export const Required: Story = {
  args: {
    label: 'Accept the terms',
    required: true,
    helperText: 'Required before the account is created',
  },
};

/**
 * Ignored by the pointer and the keyboard, and greyed with its label: the
 * disabled state reaches the label because both inherit it from the enclosing
 * field rather than being told twice.
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Checkbox label="Unavailable, unticked" disabled />
      <Checkbox label="Unavailable, ticked" disabled defaultChecked />
    </div>
  ),
};

/**
 * Uncontrolled: `defaultChecked` sets the starting value and the control owns
 * it from there. Reach for this in a form that reads its values on submit —
 * which is most forms.
 */
export const Uncontrolled: Story = {
  args: {
    label: 'Remember this device',
    defaultChecked: true,
    helperText: 'The control owns its own state',
  },
};

function ControlledExample() {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex flex-col gap-3 font-mono text-sm text-content-primary">
      <Checkbox
        label="Enable experimental mode"
        checked={checked}
        onCheckedChange={setChecked}
        helperText="State lives in the page, not the control"
      />
      <span>&gt; experimental: {checked ? 'ON' : 'OFF'}</span>
    </div>
  );
}

/**
 * Controlled: `checked` plus `onCheckedChange`. The handler is given the new
 * value and nothing else — Base UI's event details stay behind the wrapper, so
 * no Base UI type appears in this package's published API.
 */
export const Controlled: Story = {
  render: () => <ControlledExample />,
};

/**
 * Every state on one surface, which is the row the visual suite asserts: a
 * change to the box, the mark, the disabled treatment or the error border
 * shows up here rather than in whichever single story happened to be captured.
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Indeterminate" indeterminate />
      <Checkbox label="Required" required />
      <Checkbox label="With description" helperText="Standing guidance" />
      <Checkbox label="Invalid" error="This one is required" />
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Disabled and checked" disabled defaultChecked />
    </div>
  ),
};
