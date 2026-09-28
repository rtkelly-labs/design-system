import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from '../components/Progress';
import { Card } from '../components/Card';

const meta: Meta<typeof Progress> = {
  title: 'Components/Feedback/Progress',
  component: Progress,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Progress>;

/**
 * **Determinate.** A value, a label and the formatted percentage beside it.
 *
 * `aria-valuenow`, `aria-valuemin` and `aria-valuemax` come off the same value
 * that draws the fill, so the number a screen reader reads cannot disagree
 * with the bar a sighted reader sees — the defect this component takes a
 * primitive to avoid.
 */
export const Determinate: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <Progress value={62} label="Uploading evidence" showValue />
    </div>
  ),
};

/**
 * **Indeterminate.** No value at all — not zero.
 *
 * The distinction is the point: a bar pinned at 0% claims no work has been
 * done, where this one reports `aria-valuetext: indeterminate progress` and
 * drops `aria-valuenow` entirely. Pass `null`, or leave `value` off.
 *
 * The sweep stops under `prefers-reduced-motion` and the bar fills the track
 * and pulses in place instead, because a third of a track standing still reads
 * as a third done.
 */
export const Indeterminate: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <Progress label="Rebuilding tokens" />
    </div>
  ),
};

/**
 * A value against a `max` that is not 100 — steps in a wizard, files in a
 * batch.
 *
 * The formatted value still reads as a percentage, because that is what the
 * bar is drawing; the step count belongs in the label, where it is a sentence
 * rather than a ratio the reader has to convert.
 */
export const AgainstASteppedMax: Story = {
  render: () => (
    <div className="w-full max-w-md">
      <Progress value={3} max={4} label="Step 3 of 4 — signing" showValue />
    </div>
  ),
};

/**
 * The accents, each naming what the bar is about rather than decorating it: a
 * job completing, a quota filling, a deadline being spent.
 *
 * `hideLabel` on the last one — the surrounding card already says what it is,
 * and the name survives for assistive technology.
 */
export const Accents: Story = {
  render: () => (
    <Card variant="panel" title="Storage" className="max-w-md">
      <div className="flex flex-col gap-5">
        <Progress value={100} label="Import complete" accent="success" showValue />
        <Progress value={78} label="Quota used" accent="warning" showValue />
        <Progress value={94} label="Retention window" accent="danger" showValue />
        <Progress value={41} label="Storage" accent="primary" hideLabel showValue />
      </div>
    </Card>
  ),
};
