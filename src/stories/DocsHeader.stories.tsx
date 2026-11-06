import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookOpen } from 'lucide-react';
import { DocsHeader } from '../components/docs/DocsHeader';

const nav = [
  { label: 'Docs', href: '/docs', active: true },
  { label: 'Components', href: '/docs/components' },
  { label: 'GitHub', href: 'https://github.com/rtkelly13/design-system', external: true },
];

const meta: Meta<typeof DocsHeader> = {
  title: 'Docs/DocsHeader',
  component: DocsHeader,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof DocsHeader>;

export const Default: Story = {
  args: { title: 'Design System', nav },
};

export const WithIcon: Story = {
  args: { title: 'Design System', nav, icon: BookOpen },
};

/** Omitting `onSearch` hides the search button entirely. */
export const WithSearch: Story = {
  args: { title: 'Design System', nav, onSearch: () => {}, searchShortcut: '⌘K' },
};

export const BrandOnly: Story = {
  args: { title: 'Design System' },
};
