import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TLDR } from '../components/TLDR';

const meta: Meta<typeof TLDR> = {
  title: 'Foundations/TLDR',
  component: TLDR,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof TLDR>;

export const Default: Story = {
  args: {
    children:
      'Composition is resolved in the browser, so the composed Storybook has to send CORS headers on its index.',
  },
};

/** Longer summaries still read as a single block rather than a paragraph. */
export const Multiline: Story = {
  args: {
    children:
      'Adopt rather than manage anything already serving traffic. Import existing resources before the first apply, and treat a proposed domain deletion as a registry bug.',
  },
};
