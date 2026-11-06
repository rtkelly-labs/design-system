import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { BracketText } from '../components/BracketText';

const meta: Meta<typeof BracketText> = {
  title: 'Foundations/BracketText',
  component: BracketText,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof BracketText>;

export const Default: Story = {
  args: { children: 'SYSTEM READY' },
};

export const Emphasis: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <BracketText accent="primary">PRIMARY</BracketText>
      <BracketText accent="secondary">SECONDARY</BracketText>
      <BracketText accent="quiet">QUIET</BracketText>
      <BracketText accent="danger">DANGER</BracketText>
    </div>
  ),
};

/** Inline in running text, which is where the bracket glyphs earn their keep. */
export const Inline: Story = {
  render: () => (
    <p style={{ maxWidth: '40ch', lineHeight: 1.7 }}>
      Deployment finished and the surface is <BracketText accent="success">LIVE</BracketText> — the
      previous build stays reachable until the alias moves.
    </p>
  ),
};
