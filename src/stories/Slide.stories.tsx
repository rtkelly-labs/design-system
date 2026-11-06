import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Slide } from '../components/slides/Slide';
import { BracketText } from '../components/BracketText';

const meta: Meta<typeof Slide> = {
  title: 'Presentation/Slide',
  component: Slide,
  tags: ['autodocs', 'experimental'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof Slide>;

/** A single slide. `SlideDeck` composes these with navigation around them. */
export const Default: Story = {
  args: {
    title: 'One stack, three modes',
    children: <p>Dark, dim and sketch resolve from the same semantic layer.</p>,
  },
};

export const WithSubtitle: Story = {
  args: {
    title: 'Composition',
    subtitle: 'One URL, two tiers',
    children: (
      <p>
        The system publishes primitives; the site documents what it builds on top —{' '}
        <BracketText accent="primary">ryankelly.dev (site)</BracketText>.
      </p>
    ),
  },
};

/**
 * `speakerNotes` renders nothing *here*, and that is the point: they are for
 * the presenter, not the audience, so a bare `Slide` shows no trace of them.
 * `Presentation/SlideDeck → WithSpeakerNotes` is where they surface.
 */
export const WithSpeakerNotes: Story = {
  args: {
    title: 'Adopt, do not manage',
    children: <p>Adoption cannot delete what it does not own.</p>,
    speakerNotes: 'Mention that import is mandatory: declaring an existing domain tries to create it.',
  },
};
