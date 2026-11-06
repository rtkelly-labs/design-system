import type { Meta, StoryObj } from '@storybook/react-vite';
import { Sparkline } from '../components/Sparkline';
import { ThemeProvider } from '../components/ThemeProvider';

const meta: Meta<typeof Sparkline> = {
  title: 'Foundations/Sparkline',
  component: Sparkline,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Sparkline>;

export const PrimaryTrend: Story = {
  args: {
    data: [12, 19, 14, 25, 22, 30, 28, 42],
    width: 140,
    height: 36,
    accent: 'primary',
    showArea: true,
  },
};

export const DangerLatencySpike: Story = {
  args: {
    data: [15, 14, 16, 18, 55, 62, 20, 18],
    width: 140,
    height: 36,
    accent: 'danger',
    showArea: true,
  },
};

export const SuccessRecovery: Story = {
  args: {
    data: [5, 8, 12, 18, 24, 35, 48, 60],
    width: 140,
    height: 36,
    accent: 'success',
    showArea: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    width: 140,
    height: 36,
  },
};

export const SketchTheme: Story = {
  render: (args) => (
    <ThemeProvider defaultLevel="sketch" scoped persist={false} followSystem={false}>
      <Sparkline {...args} />
    </ThemeProvider>
  ),
  args: {
    data: [12, 19, 14, 25, 22, 30, 28, 42],
    width: 140,
    height: 36,
    accent: 'primary',
    showArea: true,
  },
};
