import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button';
import { NerdIcon } from '../components/NerdIcon';

const meta: Meta<typeof Button> = {
  title: 'Components/Actions & Forms/Button',
  component: Button,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Button>;

/**
 * The unadorned button, and the one to reach for: `quiet`, the default — a 2px
 * neutral outline on a transparent fill, no shadow at rest. The hard shadow and
 * an accent border arrive on hover. Most buttons on a page are this one; the
 * louder variants need a reason.
 */
export const Default: Story = {
  args: {
    children: 'CANCEL',
    bracketed: false,
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
  },
};

/**
 * The loudness ladder, left to right: `quiet` (outline, shadow on hover),
 * `secondary` (an `edge-strong` outline with its shadow at rest), `primary`
 * (the accent fill) and `inverse` (a solid ink fill). One `primary` per view;
 * the rest step down from it.
 */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="quiet">QUIET</Button>
      <Button variant="secondary">SECONDARY</Button>
      <Button variant="primary">PRIMARY</Button>
      <Button variant="inverse">INVERSE</Button>
    </div>
  ),
};

/**
 * `danger`: an `intent.danger` outline and text that fills on hover and on
 * keyboard focus, so the destructive action reads as unfinished until it is
 * aimed at. It carries no shadow at rest, which keeps it quieter than
 * `primary`: a delete is never the page's main action. Pair it with a quiet or
 * secondary neighbour — the `ButtonGroup` stories show why.
 */
export const Danger: Story = {
  args: {
    children: 'DELETE RECORD',
    bracketed: true,
    variant: 'danger',
  },
};

/**
 * The small sizes. `xs` is 28px, for dense toolbars and row actions; `icon` is
 * a 32px square and `icon-touch` a 40px one for surfaces a finger uses. An
 * icon-only button has no text, so `aria-label` is required by the types.
 * `sm` and `md` sit beside them for scale.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="xs">XS</Button>
      <Button size="sm">SM</Button>
      <Button size="md">MD</Button>
      <Button size="icon" aria-label="Close">
        <NerdIcon name="close" aria-hidden="true" />
      </Button>
      <Button size="icon-touch" aria-label="Close">
        <NerdIcon name="close" aria-hidden="true" />
      </Button>
    </div>
  ),
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
