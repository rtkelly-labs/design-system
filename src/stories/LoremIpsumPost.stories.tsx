import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoremIpsumPost } from '../components/blog/LoremIpsumPost';
import { ThemeProvider } from '../components/ThemeProvider';

const meta: Meta<typeof LoremIpsumPost> = {
  title: 'Blog/LoremIpsumPost',
  tags: ['stable'],
  component: LoremIpsumPost,
};

export default meta;
type Story = StoryObj<typeof LoremIpsumPost>;

export const FoundationalBlogPost: Story = {
  render: () => (
    <ThemeProvider defaultLevel="midnight" persist={false} followSystem={false}>
      <LoremIpsumPost />
    </ThemeProvider>
  ),
};
