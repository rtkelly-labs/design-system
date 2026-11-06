import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from '../components/Tag';

const meta: Meta<typeof Tag> = {
  title: 'Foundations/Tag',
  component: Tag,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: { text: 'typescript' },
};

/** With `href` the tag renders as an anchor rather than a span. */
export const AsLink: Story = {
  args: { text: 'design-systems', href: '#design-systems' },
};

export const CustomPrefix: Story = {
  args: { text: 'v0.1.3', prefix: '@', accent: 'info' },
};

export const Row: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Tag text="react" accent="primary" />
      <Tag text="storybook" accent="secondary" />
      <Tag text="tailwind" accent="tertiary" />
      <Tag text="archived" accent="quiet" />
    </div>
  ),
};
