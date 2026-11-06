import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../components/Badge';

const meta: Meta<typeof Badge> = {
  title: 'Foundations/Badge',
  component: Badge,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: 'ACTIVE' },
};

/** Emphasis tokens: hierarchy, not meaning — which pill should catch the eye. */
export const Emphasis: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <Badge accent="primary">PRIMARY</Badge>
      <Badge accent="secondary">SECONDARY</Badge>
      <Badge accent="tertiary">TERTIARY</Badge>
      <Badge accent="quiet">QUIET</Badge>
    </div>
  ),
};

/** Intent tokens: communicated meaning. Reach for these when the state matters. */
export const Intent: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <Badge accent="info">SYNCING</Badge>
      <Badge accent="success">HEALTHY</Badge>
      <Badge accent="warning">DEGRADED</Badge>
      <Badge accent="danger">FAILED</Badge>
    </div>
  ),
};
