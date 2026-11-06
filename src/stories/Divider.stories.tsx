import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Divider } from '../components/Divider';

/**
 * `Divider`, not `AsciiDivider`. The old name described the mark — `//====//` —
 * which is only what the *dark* rungs draw; the light rungs draw a pencil rule.
 * `AsciiDivider` survives as a deprecated alias for existing call sites, so
 * there is deliberately no story for it: a story is a recommendation.
 */
const meta: Meta<typeof Divider> = {
  title: 'Foundations/Divider',
  component: Divider,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Default: Story = {};

/**
 * `variant` forces a mark instead of following the level. `auto` — the default —
 * reads the level's declared polarity, so these two are what a `midnight` and a
 * `bright` page respectively produce on their own.
 */
export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Divider variant="terminal" />
      <Divider variant="pencil" />
    </div>
  ),
};

/**
 * `pattern` repeats to fill the width, overriding both the variant and the
 * level. Keep it to characters the mono stack actually carries — the display
 * font is latin-only, so box-drawing glyphs can fall back to a different face
 * mid-rule.
 */
export const Patterns: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <Divider />
      <Divider pattern="=" />
      <Divider pattern="-=" />
      <Divider pattern="*" />
    </div>
  ),
};
