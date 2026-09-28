import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from '../components/Spinner';
import { Card } from '../components/Card';

const meta: Meta<typeof Spinner> = {
  title: 'Components/Feedback/Spinner',
  component: Spinner,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Spinner>;

/**
 * The default: a `md` mark on the primary accent, with the label `Loading`.
 *
 * The label is not drawn — it is the text inside the `role="status"` region,
 * which is what a screen reader announces when the spinner appears. Replace it
 * with something that says what is being waited for; "Loading" alone is the
 * least useful thing a status region can say.
 */
export const Default: Story = {
  render: () => <Spinner label="Loading results" />,
};

/**
 * The three sizes, against the content each belongs beside.
 *
 * `sm` fits a control's line box, `md` a sentence, `lg` an empty panel. There
 * is no larger step on purpose: past `lg` the honest thing to draw is the shape
 * of the content that is coming, which is `Skeleton`.
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <Spinner size="sm" label="Saving" />
      <Spinner size="md" label="Loading results" />
      <Spinner size="lg" label="Rebuilding the index" />
    </div>
  ),
};

/**
 * Beside text, and in the accent that names the work.
 *
 * The accent is semantic like every other in the system: `intent.warning` for
 * a retry, `intent.danger` for a job that is failing over. It is not decoration
 * — a row of spinners in four colours says four different things.
 */
export const Accents: Story = {
  render: () => (
    <div className="flex flex-col gap-4 font-mono text-sm text-content-primary">
      <span className="flex items-center gap-3">
        <Spinner size="sm" accent="primary" label="Fetching rules" />
        FETCHING RULES
      </span>
      <span className="flex items-center gap-3">
        <Spinner size="sm" accent="warning" label="Retrying upload" />
        RETRYING UPLOAD
      </span>
      <span className="flex items-center gap-3">
        <Spinner size="sm" accent="danger" label="Failing over" />
        FAILING OVER
      </span>
    </div>
  ),
};

/**
 * A panel that is fetching, which is the case a spinner is genuinely right for:
 * the wait is short, and nothing is known about the shape of what is coming.
 *
 * The container carries `aria-busy`, so the state belongs to the region rather
 * than to the mark — the same division `Skeleton` relies on, where the
 * placeholder is `aria-hidden` and the region does the announcing.
 */
export const InAPanel: Story = {
  render: () => (
    <Card variant="panel" title="Rule engine" className="max-w-sm">
      <div
        aria-busy="true"
        className="flex min-h-32 flex-col items-center justify-center gap-4"
      >
        <Spinner size="lg" label="Loading rules" />
        <p className="font-mono text-xs uppercase tracking-wider text-content-muted">
          &gt; contacting the engine
        </p>
      </div>
    </Card>
  ),
};
