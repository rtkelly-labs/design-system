import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActivityGrid } from '../components/docs/figures/ActivityGrid';
import { FigureFrame } from '../components/docs/figures/FigureFrame';

const meta: Meta<typeof ActivityGrid> = {
  title: 'Docs/Figures/ActivityGrid',
  component: ActivityGrid,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'A calendar grid for dated counts. Adapted from [mdxcn](https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/graph-activity/graph-activity.tsx).' } } },
};
export default meta;
type Story = StoryObj<typeof ActivityGrid>;

const blog = Array.from({ length: 84 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 0, 1 + index)).toISOString().slice(0, 10);
  return { date, count: [0, 1, 2, 4, 0, 3, 1][index % 7] === 0 ? 0 : (index * 7 % 5) };
});
const commits = Array.from({ length: 126 }, (_, index) => ({ date: new Date(Date.UTC(2026, 2, 1 + index)).toISOString().slice(0, 10), count: (index * 13 + Math.floor(index / 5)) % 11 }));
const sketch = Array.from({ length: 35 }, (_, index) => ({ date: new Date(Date.UTC(2026, 4, 1 + index)).toISOString().slice(0, 10), count: index % 6 === 0 ? 0 : index % 4 }));

/** Publishing activity makes quiet gaps and busy weeks visible at a glance. */
export const BlogPostingCadence: Story = {
  render: () => <FigureFrame title="BLOG POSTING CADENCE"><ActivityGrid data={blog} weekStartsOn={1} palette="duo" /></FigureFrame>,
  parameters: { docs: { description: { story: 'Daily post and editing activity over twelve weeks, with Monday-first calendar columns.' } } },
};

/** A denser activity record uses the full intensity scale. */
export const Commits: Story = {
  render: () => <FigureFrame title="COMMITS"><ActivityGrid data={commits} legend glyphs="ascii" palette="multi" /></FigureFrame>,
  parameters: { docs: { description: { story: 'A longer commit history demonstrates sparse days, varied intensity, and month transitions.' } } },
};

/** The lighter hand-drawn level keeps the same data readable. */
export const SketchTheme: Story = {
  render: () => <FigureFrame title="SKETCH"><ActivityGrid data={sketch} weekStartsOn={1} palette="mono" /></FigureFrame>,
  globals: { level: 'sketch' },
  parameters: { docs: { description: { story: 'A short activity grid on the sketch level, composed inside the shared figure wrapper.' } } },
};
