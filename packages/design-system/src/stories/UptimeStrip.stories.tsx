import type { Meta, StoryObj } from '@storybook/react-vite';
import { UptimeStrip } from '../components/docs/figures/UptimeStrip';
import { FigureFrame } from '../components/docs/figures/FigureFrame';

const meta: Meta<typeof UptimeStrip> = {
  title: 'Docs/Figures/UptimeStrip',
  component: UptimeStrip,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'A compact uptime strip with a percentage and screen-reader summary. Adapted from [mdxcn](https://github.com/keshav-exe/mdxcn), `registry/default/graph-uptime/graph-uptime.tsx`.' } } },
};

export default meta;
type Story = StoryObj<typeof UptimeStrip>;

/** Mixed service states show the compact status vocabulary. */
export const Default: Story = { args: { days: 'ok ok ok degraded ok down ok empty ok', from: 'MAR 01', to: 'MAR 09' }, render: (args) => <FigureFrame title="API UPTIME"><UptimeStrip {...args} /></FigureFrame> };

/** A longer strip wraps into fixed columns and uses the ASCII glyph set. */
export const LongRange: Story = { args: { days: ['ok', 'ok', 'degraded', 'ok', 'ok', 'ok', 'down', 'ok', 'ok', 'ok', 'ok', 'ok'], columns: 6, glyphs: 'ascii', palette: 'multi' }, render: (args) => <FigureFrame title="WORKER UPTIME"><UptimeStrip {...args} /></FigureFrame> };

/** Empty slots are represented without making them count against uptime. */
export const SketchTheme: Story = { args: { days: 'empty empty ok degraded', columns: 4 }, render: (args) => <FigureFrame title="SKETCH"><UptimeStrip {...args} /></FigureFrame>, globals: { level: 'sketch' } };
