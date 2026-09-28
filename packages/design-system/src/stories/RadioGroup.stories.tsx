import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Radio, RadioGroup } from '../components/RadioGroup';
import type { RadioGroupProps } from '../components/RadioGroup';

/** The three options every sample here chooses between — the issue's own example. */
function DeploymentOptions() {
  return (
    <>
      <Radio value="cloud" label="Cloud" />
      <Radio value="self-hosted" label="Self-hosted" />
      <Radio value="hybrid" label="Hybrid" />
    </>
  );
}

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/Actions & Forms/RadioGroup',
  component: RadioGroup,
  subcomponents: { Radio },
  tags: ['autodocs', 'stable'],
  args: {
    legend: 'Preferred deployment',
    name: 'deployment',
  },
  render: (args: RadioGroupProps) => (
    <RadioGroup {...args}>
      <DeploymentOptions />
    </RadioGroup>
  ),
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

/**
 * Choose exactly one. The legend is the group's name — one accessible name
 * for the set — and each option is named by its own label. Tab reaches the
 * group once, at the selected option; the arrow keys move and select within
 * it, wrapping at either end.
 */
export const Default: Story = {
  args: {
    defaultValue: 'self-hosted',
  },
};

/**
 * Nothing chosen yet. Tab then lands on the first enabled option, and a form
 * submitted in this state carries no value under the group's name — exactly
 * what native radios do.
 */
export const NoSelection: Story = {};

/**
 * Guidance for the whole set, under it — the group's description, in the
 * `radiogroup`'s `aria-describedby`. Guidance for one option is that option's
 * `helperText`, described on it and not its siblings.
 */
export const WithDescriptions: Story = {
  render: (args: RadioGroupProps) => (
    <RadioGroup {...args} defaultValue="cloud" helperText="You can migrate between these later">
      <Radio value="cloud" label="Cloud" helperText="We run everything" />
      <Radio value="self-hosted" label="Self-hosted" helperText="You run everything" />
      <Radio value="hybrid" label="Hybrid" helperText="Control plane with us, workers with you" />
    </RadioGroup>
  ),
};

/**
 * `error` on the group. It is a message about the *choice*, so it describes
 * the `radiogroup`, marks it `aria-invalid`, and borders every option — never
 * just the one it was rendered next to.
 */
export const WithError: Story = {
  args: {
    error: 'Choose where this workspace runs',
    required: true,
  },
};

/**
 * Disabled at both levels. The group's `disabled` reaches every option; an
 * option's own `disabled` removes just that one, and the arrow keys step over
 * it.
 */
export const Disabled: Story = {
  render: (args: RadioGroupProps) => (
    <div className="flex flex-col gap-8">
      <RadioGroup {...args} legend="Whole group disabled" name="locked" defaultValue="cloud" disabled>
        <DeploymentOptions />
      </RadioGroup>
      <RadioGroup {...args} legend="One option disabled" name="partial" defaultValue="cloud">
        <Radio value="cloud" label="Cloud" />
        <Radio value="self-hosted" label="Self-hosted" disabled helperText="Needs an enterprise plan" />
        <Radio value="hybrid" label="Hybrid" />
      </RadioGroup>
    </div>
  ),
};

function ControlledExample() {
  const [value, setValue] = useState('hybrid');

  return (
    <div className="flex flex-col gap-3 font-mono text-sm text-content-primary">
      <RadioGroup legend="Preferred deployment" name="deployment" value={value} onValueChange={setValue}>
        <DeploymentOptions />
      </RadioGroup>
      <span>&gt; deployment: {value}</span>
    </div>
  );
}

/**
 * Controlled: `value` plus `onValueChange`. The handler receives the new
 * option's `value` and nothing else — Base UI's event details stay behind
 * the wrapper, so no Base UI type appears in the published API.
 */
export const Controlled: Story = {
  render: () => <ControlledExample />,
};

/**
 * Every state on one surface — the row the visual suite asserts. The legend,
 * the selected mark, per-option guidance, the group message, the invalid
 * border and both disabled treatments change here rather than in whichever
 * single story happened to be captured.
 */
export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <RadioGroup legend="Selected" name="selected" defaultValue="self-hosted">
        <DeploymentOptions />
      </RadioGroup>
      <RadioGroup legend="With descriptions" name="described" defaultValue="cloud" helperText="Group guidance">
        <Radio value="cloud" label="Cloud" helperText="Option guidance" />
        <Radio value="hybrid" label="Hybrid" />
      </RadioGroup>
      <RadioGroup legend="Invalid" name="invalid" error="Choose one to continue" required>
        <DeploymentOptions />
      </RadioGroup>
      <RadioGroup legend="Disabled" name="disabled" defaultValue="cloud" disabled>
        <Radio value="cloud" label="Group disabled, selected" />
        <Radio value="hybrid" label="Group disabled" />
      </RadioGroup>
      <RadioGroup legend="One option disabled" name="partial" defaultValue="cloud">
        <Radio value="cloud" label="Enabled, selected" />
        <Radio value="hybrid" label="Option disabled" disabled />
      </RadioGroup>
    </div>
  ),
};
