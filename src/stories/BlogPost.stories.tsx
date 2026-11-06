import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BlogPost } from '../components/blog/BlogPost';

const meta: Meta<typeof BlogPost> = {
  title: 'Blog/BlogPost',
  component: BlogPost,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof BlogPost>;

/**
 * The minimum: a title, a date and a body. The byline row carries the author
 * and the date and nothing else — no reading time, no tags — because neither
 * was supplied and neither is invented.
 */
export const Default: Story = {
  args: {
    title: 'Where a theme stops applying',
    date: '2026-08-11',
    children: (
      <p>
        A custom property substitutes where it is declared, not where it is used — which decides
        whether a nested panel keeps its own theme or inherits the root&rsquo;s.
      </p>
    ),
  },
};

export const FullMetadata: Story = {
  args: {
    title: 'Where a theme stops applying',
    subtitle: 'Nested panels, var() substitution, and one line of CSS',
    author: 'Ryan Kelly',
    date: '2026-08-11',
    readingTime: '6 min read',
    tags: ['css', 'design-systems'],
    children: (
      <>
        <p>Re-declaring the indirected tokens on the mode classes re-runs substitution at the panel.</p>
        <p>Without it, utilities resolve to whatever the root theme happened to compute.</p>
      </>
    ),
  },
};

/**
 * Partial metadata: tags but no reading time.
 *
 * The two are independent, and each simply disappears when absent. Until #93
 * they did not — a post omitting them rendered `5 min read` and three sample
 * topics, indistinguishable from a post that had supplied them. Absent
 * metadata now looks absent, which is the only honest option for a value only
 * the author can know.
 */
export const PartialMetadata: Story = {
  args: {
    title: 'A post that supplied only some metadata',
    date: '2026-08-30',
    tags: ['css'],
    children: (
      <p>
        The byline row carries an author, a date and one tag. No reading time is shown, because
        none was measured.
      </p>
    ),
  },
};
