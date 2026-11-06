import type { Meta, StoryObj } from '@storybook/react-vite';
import { BulletChart } from '../components/BulletChart';
import { ThemeProvider } from '../components/ThemeProvider';

const meta: Meta<typeof BulletChart> = {
  title: 'Foundations/BulletChart',
  component: BulletChart,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof BulletChart>;

export const PrimaryBenchmark: Story = {
  args: {
    value: 82,
    target: 90,
    bands: [50, 75, 100],
    accent: 'primary',
    width: 200,
    height: 24,
    title: 'Deployment Velocity',
  },
};

export const TargetExceeded: Story = {
  args: {
    value: 96,
    target: 85,
    bands: [40, 70, 100],
    accent: 'success',
    width: 200,
    height: 24,
    title: 'Cache Hit Rate',
  },
};

export const CriticalThreshold: Story = {
  args: {
    value: 38,
    target: 80,
    bands: [50, 75, 100],
    accent: 'danger',
    width: 200,
    height: 24,
    title: 'Storage Headroom',
  },
};

export const SketchTheme: Story = {
  render: (args) => (
    <ThemeProvider defaultLevel="sketch" scoped persist={false} followSystem={false}>
      <BulletChart {...args} />
    </ThemeProvider>
  ),
  args: {
    value: 82,
    target: 90,
    bands: [50, 75, 100],
    accent: 'primary',
    width: 200,
    height: 24,
    title: 'Deployment Velocity',
    summary: '82 against a target of 90',
  },
};
