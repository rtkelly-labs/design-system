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
 * `Select` wear — and no lift on hover or sink on press. Reach for it when the
 * action is not available at all. Not while a submit is in flight — that is
 * `pending`, which keeps focus — and not to hold a form shut until it is valid:
 * a disabled button cannot say what is missing, and the error summary can.
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

/**
 * `pending`, between an enabled button and a disabled one. The fill stays and
 * the button sits in its press — offset, no shadow — with a spinner over the
 * label's box, so the width does not move. It is `aria-disabled` rather than
 * `disabled`: it keeps focus and its tab stop, and ignores clicks, Enter,
 * Space and a second submit of its form. `pendingLabel` is announced through
 * a status region beside it. Reach for it while a request is in flight;
 * `disabled` is for an action that is not available at all.
 */
export const Pending: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="primary" bracketed>
        SAVE CHANGES
      </Button>
      <Button variant="primary" bracketed pending pendingLabel="Saving your changes">
        SAVE CHANGES
      </Button>
      <Button variant="primary" bracketed disabled>
        SAVE CHANGES
      </Button>
      <Button variant="inverse" pending pendingLabel="Discarding">
        DISCARD
      </Button>
    </div>
  ),
};
