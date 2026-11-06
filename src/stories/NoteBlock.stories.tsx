import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NoteBlock } from '../components/NoteBlock';

const meta: Meta<typeof NoteBlock> = {
  title: 'Foundations/NoteBlock',
  component: NoteBlock,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof NoteBlock>;

export const Note: Story = {
  args: {
    type: 'note',
    children: 'Branch domains map to exactly one branch; per-PR builds keep their generated URLs.',
  },
};

export const Tip: Story = {
  args: {
    type: 'tip',
    children: 'Leaving the composition ref unset composes nothing, which is what you want locally.',
  },
};

export const Warning: Story = {
  args: {
    type: 'warning',
    children: 'A preview that proposes deleting a domain is a bug in the registry, not something to apply.',
  },
};

export const Important: Story = {
  args: {
    type: 'important',
    title: 'Read before applying',
    children: 'Existing resources must be imported first — declaring them makes the provider try to create them.',
  },
};

/** All four together, which is how the severity ramp is actually judged. */
export const AllTypes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <NoteBlock type="note">A neutral aside.</NoteBlock>
      <NoteBlock type="tip">Something worth doing.</NoteBlock>
      <NoteBlock type="warning">Something that bites.</NoteBlock>
      <NoteBlock type="important">Something that must not be skipped.</NoteBlock>
    </div>
  ),
};
