import type { Meta, StoryObj } from '@storybook/react-vite';
import { BarChart, type BarChartDatum } from '../components/BarChart';
import { ResponsiveChartContainer } from '../components/ResponsiveChartContainer';
import { ThemeProvider } from '../components/ThemeProvider';

const SAMPLE_DATA: BarChartDatum[] = [
  { label: 'HTTP 200', value: 3420, accent: 'success' },
  { label: 'HTTP 304', value: 890, accent: 'primary' },
  { label: 'HTTP 400', value: 120, accent: 'warning' },
  { label: 'HTTP 404', value: 240, accent: 'secondary' },
  { label: 'HTTP 500', value: 45, accent: 'danger' },
];

const meta: Meta<typeof BarChart> = {
  title: 'Components/Data/BarChart',
  component: BarChart,
  // The width tracker `responsive` uses, exported for a custom chart: a part of BarChart.
  subcomponents: { ResponsiveChartContainer },
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof BarChart>;

export const Vertical: Story = {
  args: {
    data: SAMPLE_DATA,
    width: 540,
    height: 280,
    orientation: 'vertical',
    accent: 'primary',
  },
};

export const Horizontal: Story = {
  args: {
    data: SAMPLE_DATA,
    width: 540,
    height: 280,
    orientation: 'horizontal',
    accent: 'secondary',
  },
};

export const EmptyState: Story = {
  args: {
    data: [],
    width: 540,
    height: 200,
    emptyMessage: 'NO METRICS RECORDED',
  },
};

/**
 * `responsive` inside a parent with no height of its own, like a card or a tab
 * panel. The chart keeps its `height` and takes the parent's width.
 */
export const Responsive: Story = {
  render: (args) => (
    <div className="w-[420px] border border-dashed border-edge-subtle p-2">
      <BarChart {...args} />
    </div>
  ),
  args: {
    data: SAMPLE_DATA,
    height: 240,
    responsive: true,
  },
};

/** With `onBarClick` the chart is one tab stop and the arrows move between bars. */
export const Interactive: Story = {
  args: {
    data: SAMPLE_DATA,
    width: 540,
    height: 280,
    onBarClick: () => {},
  },
};

export const SketchTheme: Story = {
  render: (args) => (
    <ThemeProvider defaultLevel="sketch" scoped persist={false} followSystem={false}>
      <BarChart {...args} />
    </ThemeProvider>
  ),
  args: {
    data: SAMPLE_DATA,
    width: 540,
    height: 280,
    orientation: 'vertical',
    accent: 'primary',
  },
};
