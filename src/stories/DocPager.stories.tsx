import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DocPager } from '../components/docs/DocPager';

const meta: Meta<typeof DocPager> = {
  title: 'Docs/DocPager',
  component: DocPager,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof DocPager>;

export const Both: Story = {
  args: {
    prev: { label: 'Semantic theming', href: '/docs/theming' },
    next: { label: 'Composition', href: '/docs/composition' },
  },
};

/** First page: `prev` omitted, and `next` should stay right-aligned. */
export const NextOnly: Story = {
  args: { next: { label: 'Composition', href: '/docs/composition' } },
};

export const PrevOnly: Story = {
  args: { prev: { label: 'Semantic theming', href: '/docs/theming' } },
};
