import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChartTooltip } from '../components/ChartTooltip';
import { ThemeProvider } from '../components/ThemeProvider';

const meta: Meta<typeof ChartTooltip> = {
  title: 'Components/Data/ChartTooltip',
  component: ChartTooltip,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof ChartTooltip>;

export const Primary: Story = {
  args: {
    title: 'HTTP 200',
    accent: 'success',
    children: <span>3,420 requests</span>,
  },
};

export const SketchTheme: Story = {
  render: (args) => (
    <ThemeProvider defaultLevel="sketch" scoped persist={false} followSystem={false}>
      <ChartTooltip {...args} />
    </ThemeProvider>
  ),
  args: {
    title: 'HTTP 200',
    accent: 'success',
    children: <span>3,420 requests</span>,
  },
};
