import type { Meta, StoryObj } from '@storybook/react-vite';
import { DesignSandbox } from '../components/experiments/DesignSandbox';

const meta: Meta<typeof DesignSandbox> = {
  title: 'Showcase/DesignSandbox',
  tags: ['experimental'],
  component: DesignSandbox,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof DesignSandbox>;

export const DefaultSandbox: Story = {};
