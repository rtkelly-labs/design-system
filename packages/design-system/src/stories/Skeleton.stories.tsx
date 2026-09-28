import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '../components/Skeleton';
import { Card } from '../components/Card';

const meta: Meta<typeof Skeleton> = {
  title: 'Components/Feedback/Skeleton',
  component: Skeleton,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

/**
 * The four shapes, each a placeholder for something the system already
 * renders: a line of prose, a heading, a block of media, an avatar.
 *
 * They set a default height and width and nothing else. Sizing is the caller's
 * — `className` wins over the shape — because the measurement that matters is
 * the one the real content will have.
 */
export const Shapes: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-4">
      <Skeleton shape="heading" />
      <Skeleton shape="text" />
      <Skeleton shape="text" className="w-3/5" />
      <Skeleton shape="block" />
      <Skeleton shape="avatar" />
    </div>
  ),
};

/**
 * **A loading card.** The skeleton is not a grey rectangle where the card will
 * be — it is the card's own layout, held open: avatar, heading, three lines
 * with the last one short, and the media block.
 *
 * That is the whole argument for a skeleton over a spinner. Nothing moves when
 * the data lands, because the space was already the right shape.
 *
 * `aria-busy` is on the region and the skeletons are `aria-hidden`, so a screen
 * reader hears the state once instead of hearing a scaffold read out.
 */
export const LoadingCard: Story = {
  render: () => (
    <Card variant="panel" className="max-w-sm">
      <div aria-busy="true" className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Skeleton shape="avatar" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton shape="text" className="w-2/3" />
            <Skeleton shape="text" className="h-3 w-1/3" />
          </div>
        </div>
        <Skeleton shape="block" />
        <Skeleton shape="text" />
        <Skeleton shape="text" />
        <Skeleton shape="text" className="w-2/5" />
      </div>
    </Card>
  ),
};

/**
 * **A loading table.** One skeleton per cell, at the column's own width, under
 * a header that has already rendered — because the header is known before the
 * rows are.
 *
 * A single full-width block across the table body would be quicker to write
 * and would reflow the page the moment the rows arrive, which is the failure
 * the component exists to prevent.
 */
export const LoadingTable: Story = {
  render: () => (
    <div aria-busy="true" className="w-full max-w-2xl border-2 border-edge-strong">
      <div className="flex gap-4 border-b-2 border-edge-strong bg-surface-base px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-content-secondary">
        <span className="w-1/2">Rule</span>
        <span className="w-1/4">Owner</span>
        <span className="w-1/4">Status</span>
      </div>
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="flex items-center gap-4 border-b border-edge-subtle px-4 py-3">
          <Skeleton className="w-1/2" />
          <Skeleton className="w-1/4" />
          <Skeleton className="h-5 w-1/4" />
        </div>
      ))}
    </div>
  ),
};

/**
 * **A loading list.** The same idea at list density: a glyph slot, a title line
 * and a shorter subtitle, repeated.
 *
 * Five rows rather than one is deliberate. A single row says "one thing is
 * coming"; a list that loads into five rows from a one-row placeholder jumps
 * as far as an empty container would have.
 */
export const LoadingList: Story = {
  render: () => (
    <ul aria-busy="true" className="flex w-full max-w-md list-none flex-col gap-4 p-0">
      {[0, 1, 2, 3, 4].map((row) => (
        <li key={row} className="flex items-center gap-3">
          <Skeleton shape="avatar" className="size-8" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  ),
};
