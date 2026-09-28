import type { Meta, StoryObj } from '@storybook/react-vite';
import { BarChart, type BarChartDatum } from '../components/BarChart';
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
