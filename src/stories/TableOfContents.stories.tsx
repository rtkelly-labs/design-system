import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { TableOfContents } from '../components/docs/TableOfContents';

const toc = [
  { id: 'overview', title: 'Overview', depth: 2 },
  { id: 'composition', title: 'Composition', depth: 2 },
  { id: 'cors', title: 'CORS on the composed origin', depth: 3 },
  { id: 'refs', title: 'Declaring refs', depth: 3 },
  { id: 'domains', title: 'Domains', depth: 2 },
  { id: 'branch-domains', title: 'Branch domains', depth: 3 },
  { id: 'deep', title: 'Too deep to list', depth: 4 },
];

const meta: Meta<typeof TableOfContents> = {
  title: 'Docs/TableOfContents',
  component: TableOfContents,
  tags: ['autodocs', 'stable'],
  // Scroll-spy needs a scrolling document; the story frame does not have one.
  args: { spy: false },
};

export default meta;
type Story = StoryObj<typeof TableOfContents>;

/** Nesting is derived from `depth`, and h4 is outside the default 2–3 range. */
export const Default: Story = {
  args: { toc },
};

export const IncludingDeeperHeadings: Story = {
  args: { toc, toDepth: 4 },
};

export const WithoutLabel: Story = {
  args: { toc, label: null },
};
