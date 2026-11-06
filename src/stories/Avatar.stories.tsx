import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '../components/Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Foundations/Avatar',
  component: Avatar,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    fallback: 'RK',
    accent: 'primary',
    size: 'md',
  },
};

export const PinkAccent: Story = {
  args: {
    fallback: 'AI',
    accent: 'tertiary',
    size: 'lg',
  },
};
