import type { Meta, StoryObj } from '@storybook/react-vite';
import { BeforeAfter } from '../components/docs/figures/BeforeAfter';
import { FigureFrame } from '../components/docs/figures/FigureFrame';

const meta: Meta<typeof BeforeAfter> = {
  title: 'Docs/Figures/BeforeAfter',
  component: BeforeAfter,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'Before/after comparisons with directional change. Adapted from [mdxcn](https://github.com/keshav-exe/mdxcn), `registry/default/graph-slope/graph-slope.tsx`.' } } },
};

export default meta;
type Story = StoryObj<typeof BeforeAfter>;

/** Markdown values preserve units while the accessible row carries the comparison. */
export const Default: Story = { render: () => <FigureFrame title="LATENCY"><BeforeAfter fromLabel="before" toLabel="after"><ul><li>p95: 160 ms → 142 ms</li><li>p99: 420 ms → 390 ms</li></ul></BeforeAfter></FigureFrame> };

/** Explicit items avoid parsing when values come from application data. */
export const ExplicitItems: Story = { args: { fromLabel: 'yesterday', toLabel: 'today', palette: 'multi', items: [{ label: 'requests', from: 8200, to: 12400 }, { label: 'errors', from: '2.4%', to: '1.2%' }] }, render: (args) => <FigureFrame title="TRAFFIC"><BeforeAfter {...args} /></FigureFrame> };

/** A neutral comparison has a stable resting state in sketch. */
export const SketchTheme: Story = { render: () => <FigureFrame title="SKETCH"><BeforeAfter fromLabel="old" toLabel="new"><ul><li>size: 10 → 10</li><li>speed: 4 → 8</li></ul></BeforeAfter></FigureFrame>, globals: { level: 'sketch' } };
