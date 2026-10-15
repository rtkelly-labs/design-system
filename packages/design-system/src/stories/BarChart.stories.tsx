import type { Meta, StoryObj } from '@storybook/react-vite';
import { BarChart, type BarChartDatum } from '../components/BarChart';
import { SeriesLegend } from '../components/SeriesMark';
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

const SERIES_DATA: BarChartDatum[] = [
  { label: 'Work', value: 62, series: 1 },
  { label: 'Home', value: 40, series: 2 },
  { label: 'Family', value: 78, series: 3 },
  { label: 'Fitness', value: 30, series: 4 },
  { label: 'Travel', value: 55, series: 5 },
  { label: 'Team', value: 90, series: 6 },
];

const SERIES_LEGEND = SERIES_DATA.map((d) => ({ label: d.label, series: d.series! }));

/**
 * Six categorical series, coloured from the series group rather than from
 * emphasis. Colour is not the only cue: every bar's name is on the axis, and
 * the legend below repeats it in text beside each colour. That text is what
 * WCAG 1.4.1 rests on, with no preference involved.
 */
export const Series: Story = {
  render: (args) => (
    <div className="grid max-w-xl gap-3">
      <BarChart {...args} />
      <SeriesLegend items={SERIES_LEGEND} />
    </div>
  ),
  args: {
    data: SERIES_DATA,
    width: 540,
    height: 300,
    orientation: 'vertical',
    ariaLabel: 'Hours by calendar, six series',
  },
};

/**
 * The same chart under the `patterns` preference (`data-a11y-cvd="patterns"` on
 * an ancestor): each bar gains its series' shape and letter above its value,
 * and the legend marks gain theirs. The chart is not re-rendered to get here —
 * the glyphs are in the SVG always and the stylesheet reveals them. The asserted
 * story.
 */
export const SeriesWithPatterns: Story = {
  render: (args) => (
    <div data-a11y-cvd="patterns" className="grid max-w-xl gap-3">
      <BarChart {...args} />
      <SeriesLegend items={SERIES_LEGEND} />
    </div>
  ),
  args: {
    data: SERIES_DATA,
    width: 540,
    height: 300,
    orientation: 'vertical',
    ariaLabel: 'Hours by calendar, six series, with patterns',
  },
};
