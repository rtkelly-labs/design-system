import type { Meta, StoryObj } from '@storybook/react-vite';
import { FigureFrame } from '../components/docs/figures/FigureFrame';
import { GanttChart } from '../components/docs/figures/GanttChart';

const meta: Meta<typeof GanttChart> = {
  title: 'Docs/Figures/GanttChart',
  component: GanttChart,
  tags: ['autodocs', 'stable'],
  parameters: { docs: { description: { component: 'A dated schedule with calendar-based bars. Adapted from [mdxcn](https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/graph-gantt/graph-gantt.tsx).' } } },
};
export default meta;
type Story = StoryObj<typeof GanttChart>;

const editorial = [
  { label: 'Pitch', start: '2026-03-02', end: '2026-03-06', complete: 1 },
  { label: 'Research', start: '2026-03-05', end: '2026-03-13', complete: 1 },
  { label: 'Draft', start: '2026-03-09', end: '2026-03-20', complete: 0.72 },
  { label: 'Edit', start: '2026-03-18', end: '2026-03-25', complete: 0.2 },
  { label: 'Publish', start: '2026-03-27', end: '2026-03-27' },
];
const release = [
  { label: 'API freeze', start: '2026-04-01', end: '2026-04-07', complete: 1 },
  { label: 'Preview', start: '2026-04-08', end: '2026-04-21', complete: 0.65 },
  { label: 'Migration', start: '2026-04-14', end: '2026-05-05', complete: 0.3 },
  { label: 'Release', start: '2026-05-08', end: '2026-05-08' },
];
const sketch = [
  { label: 'Outline', start: '2026-05-04', end: '2026-05-08', complete: 1 },
  { label: 'Illustrate', start: '2026-05-07', end: '2026-05-18', complete: 0.45 },
  { label: 'Review', start: '2026-05-19', end: '2026-05-22' },
];

/** A month of editorial work shows overlapping drafting and review. */
export const EditorialCalendar: Story = {
  render: () => <FigureFrame title="EDITORIAL CALENDAR"><GanttChart items={editorial} /></FigureFrame>,
  parameters: { docs: { description: { story: 'Real March dates place research, drafting, and editing on a shared calendar scale.' } } },
};

/** A release plan crosses a month boundary and keeps its dates explicit. */
export const ReleasePlan: Story = {
  render: () => <FigureFrame title="RELEASE PLAN"><GanttChart items={release} columns={56} /></FigureFrame>,
  parameters: { docs: { description: { story: 'A release schedule spans April and May, with completed fractions rendered inside each date-based bar.' } } },
};

/** The sketch level presents a small illustrative schedule. */
export const SketchTheme: Story = {
  render: () => <FigureFrame title="SKETCH"><GanttChart items={sketch} range={{ start: '2026-05-01', end: '2026-05-31' }} columns={31} /></FigureFrame>,
  globals: { level: 'sketch' },
  parameters: { docs: { description: { story: 'An explicit May range reserves calendar space around a short illustration workflow.' } } },
};
