import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DocsSidebar } from '../components/docs/DocsSidebar';

const nav = [
  { label: 'Getting started', href: '/docs' },
  {
    label: 'Foundations',
    items: [
      { label: 'Colour', href: '/docs/colour' },
      { label: 'Typography', href: '/docs/typography' },
      { label: 'Semantic tokens', href: '/docs/semantic-tokens' },
    ],
  },
  {
    label: 'Components',
    items: [
      { label: 'Badge', href: '/docs/badge' },
      { label: 'Modal', href: '/docs/modal' },
    ],
  },
  {
    label: 'Internals',
    defaultCollapsed: true,
    items: [{ label: 'Theme resolution', href: '/docs/theme-resolution' }],
  },
];

const meta: Meta<typeof DocsSidebar> = {
  title: 'Docs/DocsSidebar',
  component: DocsSidebar,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof DocsSidebar>;

/** The group containing `currentPath` expands; `Internals` stays collapsed. */
export const Default: Story = {
  args: { nav, currentPath: '/docs/semantic-tokens' },
};

export const NothingActive: Story = {
  args: { nav },
};

export const WithoutLabel: Story = {
  args: { nav, currentPath: '/docs/badge', label: null },
};
