import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoremIpsumPost } from '../components/blog/LoremIpsumPost';

const meta: Meta<typeof LoremIpsumPost> = {
  title: 'Blog/LoremIpsumPost',
  tags: ['stable'],
  component: LoremIpsumPost,
};

export default meta;
type Story = StoryObj<typeof LoremIpsumPost>;

export const FoundationalBlogPost: Story = {
  // No ThemeProvider here: the story follows the toolbar's Level, so the sketch
  // column of a review is sketch rather than midnight a second time.
  render: () => <LoremIpsumPost />,
};
