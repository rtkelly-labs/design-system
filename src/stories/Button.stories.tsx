import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button';

const meta: Meta<typeof Button> = {
  title: 'Foundations/Button',
  component: Button,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'EXECUTE ACTION',
    bracketed: false,
    variant: 'default',
  },
};

export const Bracketed: Story = {
  args: {
    children: 'SUBMIT FORM',
    bracketed: true,
    variant: 'default',
  },
};

export const PinkAccent: Story = {
  args: {
    children: 'DELETE RECORD',
    bracketed: true,
    variant: 'tertiary',
  },
};
