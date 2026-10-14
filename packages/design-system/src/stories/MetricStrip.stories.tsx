import type { Meta, StoryObj } from '@storybook/react-vite';
import { MetricStrip } from '../components/docs/figures/MetricStrip';
import { FigureFrame } from '../components/docs/figures/FigureFrame';

const meta: Meta<typeof MetricStrip> = {
  title: 'Docs/Figures/MetricStrip',
  component: MetricStrip,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'A row of headline figures, each with a short label, read before the detail. Values arrive formatted, so units and signs stay under the author\'s control.' } } },
};

export default meta;
type Story = StoryObj<typeof MetricStrip>;

/** Three figures, the last toned success because zero failures is the point. */
export const Default: Story = {
  args: {
    label: 'Contrast audit',
    items: [
      { value: '260', label: 'pairs checked' },
      { value: '5.5:1', label: 'hue floor' },
      { value: '0', label: 'failing', tone: 'success' },
    ],
  },
  render: (args) => <FigureFrame title="AUDIT"><MetricStrip {...args} /></FigureFrame>,
};

/** One item of each tone, so the colour meanings sit side by side. */
export const Tones: Story = {
  args: {
    label: 'Tones',
    items: [
      { value: '12', label: 'neutral' },
      { value: '9', label: 'success', tone: 'success' },
      { value: '3', label: 'warning', tone: 'warning' },
      { value: '1', label: 'danger', tone: 'danger' },
    ],
  },
  render: (args) => <FigureFrame title="TONES"><MetricStrip {...args} /></FigureFrame>,
};

/** The page level is sketch here, and the strip follows it. */
export const SketchTheme: Story = { ...Tones, globals: { level: 'sketch' } };
