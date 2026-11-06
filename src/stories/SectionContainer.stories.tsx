import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionContainer } from '../components/SectionContainer';

const meta: Meta<typeof SectionContainer> = {
  title: 'Foundations/SectionContainer',
  component: SectionContainer,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof SectionContainer>;

/**
 * A width-and-gutter wrapper, so what it does is only visible against the
 * viewport edge — the dashed outline here is the story's, not the component's.
 */
export const Default: Story = {
  render: () => (
    <SectionContainer>
      <div style={{ outline: '1px dashed currentColor', padding: '2rem' }}>
        Content sits inside the measured column; the dashed edge marks where it starts.
      </div>
    </SectionContainer>
  ),
};

export const LongProse: Story = {
  render: () => (
    <SectionContainer>
      <p style={{ lineHeight: 1.7 }}>
        {'Constrained measure keeps lines readable. '.repeat(12)}
      </p>
    </SectionContainer>
  ),
};
