import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs } from '../components/docs/Breadcrumbs';

const meta: Meta<typeof Breadcrumbs> = {
  title: 'Docs/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

/** The final crumb omits `href` — it is the current page, not a link. */
export const Default: Story = {
  args: {
    items: [
      { label: 'Docs', href: '/docs' },
      { label: 'Foundations', href: '/docs/foundations' },
      { label: 'Colour' },
    ],
  },
};

/** A grouping segment with no index page also omits `href`. */
export const WithUnlinkedGroup: Story = {
  args: {
    items: [
      { label: 'Docs', href: '/docs' },
      { label: 'Internals' },
      { label: 'Theme resolution' },
    ],
  },
};

export const CustomSeparator: Story = {
  args: {
    separator: '/',
    items: [
      { label: 'Docs', href: '/docs' },
      { label: 'Components', href: '/docs/components' },
      { label: 'Badge' },
    ],
  },
};
