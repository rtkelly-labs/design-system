import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { TraceViewer } from '../components/TraceViewer';
import { useTraceClock } from '../hooks/useTraceClock';
import { checkoutTrace, deployTrace } from './traceFixtures';

const meta: Meta<typeof TraceViewer> = {
  title: 'Components/Data/TraceViewer',
  component: TraceViewer,
  tags: ['autodocs', 'preview'],
  parameters: {
    docs: {
      description: {
        component:
          'A trace viewer: summary strip, filterable `TraceWaterfall`, and the selected span’s timing, self time, status and attributes. Pair with `useTraceClock` for a live trace, and `parseTraceDocument` to load OTLP/JSON.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof TraceViewer>;

/** A failing checkout request with the payment span selected. */
export const Checkout: Story = {
  args: { spans: checkoutTrace, title: 'GET /checkout · 4f2a91', defaultSelectedId: 'e1' },
  parameters: { docs: { description: { story: 'The payment span is selected: its self time, status and attributes show beside the waterfall.' } } },
};

/** Nothing selected and no filter field, for embedding in a smaller panel. */
export const Compact: Story = {
  args: { spans: checkoutTrace, title: 'checkout', defaultSelectedId: null, searchable: false },
  parameters: { docs: { description: { story: 'Without search and with nothing selected — the details panel prompts for a selection.' } } },
};

function LiveDeploy() {
  const [start] = useState(() => Date.now() - 6600);
  const now = useTraceClock({ interval: 100 });
  return <TraceViewer spans={deployTrace(start)} now={now} title="deploy web@4f2a" defaultSelectedId="p4" />;
}

/** A pipeline still running. Not snapshotted: it moves. */
export const Live: Story = {
  render: () => <LiveDeploy />,
  parameters: { docs: { description: { story: 'Two steps are in flight; the duration, the in-flight count and their bars update as the clock ticks.' } } },
};
