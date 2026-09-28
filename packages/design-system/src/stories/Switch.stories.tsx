import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from '../components/Switch';

const meta: Meta<typeof Switch> = {
  title: 'Components/Actions & Forms/Switch',
  component: Switch,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Switch>;

/**
 * Off. The same boolean `Checkbox` carries, in the presentation that says the
 * change takes effect now — a setting, not an answer being collected.
 */
export const Off: Story = {
  args: {
    label: 'Send anonymous telemetry',
  },
};

/** On. The thumb travels to the far end of the track and the track takes the accent. */
export const On: Story = {
  args: {
    label: 'Send anonymous telemetry',
    defaultChecked: true,
  },
};

/**
 * Standing guidance under the control — what the setting actually does, which
 * matters more here than on a checkbox because a switch applies immediately.
 */
export const WithDescription: Story = {
  args: {
    label: 'Send anonymous telemetry',
    helperText: 'Page views only, never form contents',
  },
};

/**
 * `error` set, which is also the invalid state: message, `aria-invalid` and
 * the danger border from one prop, exactly as on `Input` and `Checkbox`.
 */
export const WithError: Story = {
  args: {
    label: 'Accept the data policy',
    error: 'This setting must be on before the workspace can sync',
  },
};

/**
 * Required for submission. Rarer on a switch than on a checkbox, and worth
 * reading as a prompt to ask whether the answer really belongs in a form.
 */
export const Required: Story = {
  args: {
    label: 'Accept the data policy',
    required: true,
    helperText: 'Required before the workspace is created',
  },
};

/**
 * Ignored by the pointer and the keyboard, greyed with its label. Both ends of
 * the travel are shown, because a disabled switch that reads as "off" when it
 * is on is the failure worth catching.
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Switch label="Locked off" disabled />
      <Switch label="Locked on" disabled defaultChecked />
    </div>
  ),
};

/**
 * Uncontrolled: `defaultChecked` sets the starting position and the control
 * owns it from there, submitting under its `name` like any native input.
 */
export const Uncontrolled: Story = {
  args: {
    label: 'Keep me signed in',
    defaultChecked: true,
    helperText: 'The control owns its own state',
  },
};

function ControlledExample() {
  const [checked, setChecked] = useState(true);

  return (
    <div className="flex flex-col gap-3 font-mono text-sm text-content-primary">
      <Switch
        label="Live deployments"
        checked={checked}
        onCheckedChange={setChecked}
        helperText="State lives in the page, not the control"
      />
      <span>&gt; deployments: {checked ? 'LIVE' : 'PAUSED'}</span>
    </div>
  );
}

/**
 * Controlled: `checked` plus `onCheckedChange`, which is the usual shape for a
 * switch — the setting is applied by the page, so the page holds the value.
 */
export const Controlled: Story = {
  render: () => <ControlledExample />,
};

/**
 * Every state on one surface, and the row the visual suite asserts: track,
 * thumb travel, disabled treatment and error border in a single screenshot.
 */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Switch label="Off" />
      <Switch label="On" defaultChecked />
      <Switch label="Required" required />
      <Switch label="With description" helperText="Standing guidance" />
      <Switch label="Invalid" error="This setting must be on" />
      <Switch label="Disabled" disabled />
      <Switch label="Disabled and on" disabled defaultChecked />
    </div>
  ),
};
