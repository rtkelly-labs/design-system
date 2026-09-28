import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline } from '../components/docs/figures/Timeline';
import { FigureFrame } from '../components/docs/figures/FigureFrame';

const meta: Meta<typeof Timeline> = {
  title: 'Docs/Figures/Timeline',
  component: Timeline,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'A compact dated sequence with done, current, and upcoming states. Adapted from [mdxcn](https://github.com/keshav-exe/mdxcn), `registry/default/graph-timeline/graph-timeline.tsx`.' } } },
};

export default meta;
type Story = StoryObj<typeof Timeline>;

/** A shipped sequence marks the live documentation milestone. */
export const Shipped: Story = { render: () => <FigureFrame title="SHIPPED"><Timeline><ul><li>Mar 12: CLI copies the files</li><li><strong>Mar 18: Docs, live previews</strong></li><li><em>Apr 02: Registry listed</em></li></ul></Timeline></FigureFrame> };

/** An incident timeline keeps the current rollback visually obvious. */
export const Incident: Story = { render: () => <FigureFrame title="INCIDENT"><Timeline><ul><li>14:02: p95 crossed 800ms</li><li><strong>14:11: rolled back the cache flag</strong></li><li><em>14:40: write the postmortem</em></li></ul></Timeline></FigureFrame> };

/** The timeline maintains its hierarchy on the light sketch level. */
export const SketchTheme: Story = { render: () => <FigureFrame title="SKETCH"><Timeline><ul><li>Mon: <strong>now</strong></li><li>Tue: <em>next</em></li></ul></Timeline></FigureFrame>, globals: { level: 'sketch' } };
