import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TraceWaterfall } from '../components/TraceWaterfall';
import { useTraceClock } from '../hooks/useTraceClock';
import { checkoutTrace, deployTrace, STREAM_LENGTH, streamTrace } from './traceFixtures';

const meta: Meta<typeof TraceWaterfall> = {
  title: 'Components/Data/TraceWaterfall',
  component: TraceWaterfall,
  tags: ['autodocs', 'preview'],
  parameters: {
    docs: {
      description: {
        component:
          'A distributed-trace waterfall: spans nested by parent on one time axis, bars in the primary accent, errors in the danger role, in-flight spans in the info role, and `◆` on the critical path. The rows are a keyboard tree — arrows move, Left/Right collapse and expand, Enter selects.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof TraceWaterfall>;

/** A failing checkout request, fully expanded. */
export const Checkout: Story = {
  args: { spans: checkoutTrace, defaultSelectedId: 'e1' },
  parameters: { docs: { description: { story: 'Nine spans across seven services. The payment call timed out, so the critical path runs through it.' } } },
};

/** Collapsing a subtree hides its spans but keeps the axis. */
export const Collapsed: Story = {
  args: { spans: checkoutTrace, defaultCollapsed: ['c1', 'e1'] },
  parameters: { docs: { description: { story: 'The cart and payment subtrees start collapsed; `▸` marks a span with hidden children.' } } },
};

/** A filter keeps matching spans and the ancestors that place them. */
export const Filtered: Story = {
  args: { spans: checkoutTrace, filter: 'postgres' },
  parameters: { docs: { description: { story: 'Filtering on `postgres` keeps the query and the two spans above it.' } } },
};

function LiveDeploy() {
  const [start] = useState(() => Date.now() - 6600);
  const now = useTraceClock({ interval: 100 });
  return <TraceWaterfall spans={deployTrace(start)} now={now} />;
}

/** In-flight spans grow with `useTraceClock`. Not snapshotted: it moves. */
export const Live: Story = {
  render: () => <LiveDeploy />,
  parameters: { docs: { description: { story: 'A deploy whose upload and smoke checks are still running: `now` advances every 100ms and their bars grow.' } } },
};

function StreamingTrace() {
  const [start] = useState(() => Date.now());
  const now = useTraceClock({ interval: 80 });
  // Replays the script on a loop, with a beat at the end to read the result.
  const elapsed = (now - start) % (STREAM_LENGTH + 1500);
  return <TraceWaterfall spans={streamTrace(elapsed)} now={Math.min(elapsed, STREAM_LENGTH)} />;
}

/** Spans arrive as they start and close as they end. Not snapshotted: it moves. */
export const Streaming: Story = {
  render: () => <StreamingTrace />,
  parameters: { docs: { description: { story: 'A request replayed as a collector sees it: rows appear when a span starts, bars grow while it runs, and the axis rescales as the trace gets longer. Loops every few seconds.' } } },
};

/** The sketch level, frozen at a fixed `now`. */
export const SketchTheme: Story = {
  args: { spans: deployTrace(0), now: 7400 },
  globals: { level: 'sketch' },
  parameters: { docs: { description: { story: 'The deploy pipeline on the sketch level, frozen at 7.4s so it renders the same every time.' } } },
};
