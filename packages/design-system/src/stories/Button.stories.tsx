import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Actions & Forms/Button',
  component: Button,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * The unadorned button: default accent, no brackets. This is the one to reach
 * for, and the reason the other two need a justification rather than a
 * preference.
 */
export const Default: Story = {
  args: {
    children: 'EXECUTE ACTION',
    bracketed: false,
    variant: 'default',
  },
};

/**
 * `bracketed` adds the `[ ]` cue. Right where a button is the point of the
 * screen — a form's submit, a confirm — and wrong on a row of them, where
 * every button shouting is the same as none of them doing so.
 */
export const Bracketed: Story = {
  args: {
    children: 'SUBMIT FORM',
    bracketed: true,
    variant: 'default',
  },
};

/**
 * `tertiary` is pink on `midnight` and remaps with the level, which is why the
 * prop is named for the role and not the colour. Paired with `bracketed` here
 * because that is the combination a destructive action earns: the accent says
 * which one it is, the brackets say it will do something.
 */
export const PinkAccent: Story = {
  args: {
    children: 'DELETE RECORD',
    bracketed: true,
    variant: 'tertiary',
  },
};

/**
 * `disabled`, beside the same button enabled. A sunken ground, the subtle
 * edge, muted ink and no shadow — the treatment the disabled text fields and
 * `Select` wear — and no lift on hover or sink on press. Reach for it while a
 * submit is in flight, not to hold a form shut until it is valid: a disabled
 * button cannot say what is missing, and the error summary can.
 */
export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="primary" bracketed>
        SAVE CHANGES
      </Button>
      <Button variant="primary" bracketed disabled>
        SAVE CHANGES
      </Button>
      <Button variant="inverse" disabled>
        DISCARD
      </Button>
    </div>
  ),
};
