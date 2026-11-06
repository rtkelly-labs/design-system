import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnchorHeading } from '../components/docs/AnchorHeading';

const meta: Meta<typeof AnchorHeading> = {
  title: 'Docs/AnchorHeading',
  component: AnchorHeading,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof AnchorHeading>;

export const Default: Story = {
  args: { level: 2, id: 'composition', children: 'Composition' },
};

/**
 * Anchor emphasis defaults to the level's place in the hierarchy, so colour
 * tracks document structure without each heading restating it.
 */
export const Levels: Story = {
  render: () => (
    <div>
      <AnchorHeading level={1} id="h1">Level one</AnchorHeading>
      <AnchorHeading level={2} id="h2">Level two</AnchorHeading>
      <AnchorHeading level={3} id="h3">Level three</AnchorHeading>
      <AnchorHeading level={4} id="h4">Level four</AnchorHeading>
    </div>
  ),
};

/** A page title is not a section, so it does not need a copyable anchor. */
export const WithoutAnchor: Story = {
  args: { level: 1, id: 'title', anchor: false, children: 'Page title' },
};
