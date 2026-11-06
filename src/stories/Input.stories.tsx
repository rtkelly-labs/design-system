import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input, TextArea, Select } from '../components/Input';

const meta: Meta<typeof Input> = {
  title: 'Foundations/Input',
  component: Input,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const DefaultInput: Story = {
  args: {
    label: 'API Key',
    placeholder: 'sk-brutalist-...',
    helperText: 'Required for cloud SDK authentication',
    accent: 'primary',
  },
};

export const InputWithError: Story = {
  args: {
    label: 'Workspace Domain',
    value: 'invalid-domain-name',
    error: 'Domain must end with .internal or .dev',
    accent: 'tertiary',
  },
};

export const TextAreaStory: StoryObj<typeof TextArea> = {
  render: () => (
    <TextArea
      label="System Configuration (YAML)"
      rows={4}
      defaultValue={`version: "2.0"\ncluster: us-east-1\nauto_scale: true`}
    />
  ),
};

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
