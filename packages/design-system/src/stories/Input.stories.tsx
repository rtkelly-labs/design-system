import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, TextArea } from '../components/Input';
import { Select } from '../components/Select';

const meta: Meta<typeof Input> = {
  title: 'Foundations/Input',
  component: Input,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Input>;

/**
 * The resting state: label, control, helper text. What every other state here
 * is a departure from.
 */
export const DefaultInput: Story = {
  args: {
    label: 'API Key',
    placeholder: 'sk-brutalist-...',
    helperText: 'Required for cloud SDK authentication',
    accent: 'primary',
  },
};

/**
 * `error` set. The message replaces the helper text rather than joining it,
 * and the same prop drives `aria-invalid` and the danger border — so what a
 * screen reader is told and what the page shows cannot disagree.
 */
export const InputWithError: Story = {
  args: {
    label: 'Workspace Domain',
    value: 'invalid-domain-name',
    error: 'Domain must end with .internal or .dev',
    accent: 'tertiary',
  },
};

/**
 * The same contract over several lines. Reach for it when the answer is prose
 * — a description, a note — rather than when a single-line value merely runs
 * long.
 */
export const TextAreaStory: StoryObj<typeof TextArea> = {
  render: () => (
    <TextArea
      label="System Configuration (YAML)"
      rows={4}
      defaultValue={`version: "2.0"\ncluster: us-east-1\nauto_scale: true`}
    />
  ),
};

/**
 * One of a fixed set, on the same field contract. The closed control is drawn
 * by the same recipe as the two above; the list it opens is this system's
 * rather than the operating system's. Its states, the open list and the
 * `native` escape hatch are on the `Select` page.
 */
export const SelectStory: StoryObj<typeof Select> = {
  render: () => (
    <Select
      label="Deployment Region"
      options={[
        { label: 'US East (N. Virginia)', value: 'us-east-1' },
        { label: 'EU West (Frankfurt)', value: 'eu-west-1' },
        { label: 'AP South (Singapore)', value: 'ap-south-1' },
      ]}
    />
  ),
};
