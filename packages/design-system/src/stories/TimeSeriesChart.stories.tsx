import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimeRangePicker, TimeRangeProvider } from '../components/TimeRange';
import {
  TIME_SERIES_VARIANTS,
  TimeSeriesChart,
  type TimeSeries,
  type TimeSeriesAnnotation,
  type TimeSeriesChartProps,
  type TimeSeriesThreshold,
} from '../components/TimeSeriesChart';

/** A fixed clock, so every story renders the same frame. */
const NOW = Date.UTC(2026, 9, 22, 14, 0);
const MINUTE = 60_000;
const HOUR_RANGE = { from: NOW - 60 * MINUTE, to: NOW };

/** mulberry32: a tiny seeded PRNG — the same numbers on every run, so the stories are deterministic. */
function prng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** One sample a minute for `minutes`, ending at `now`, shaped by `value(index, noise)`. */
function sampled(seed: number, minutes: number, now: number, value: (index: number, noise: number) => number | null) {
  const random = prng(seed);
  return Array.from({ length: minutes + 1 }, (_, index) => [now - (minutes - index) * MINUTE, value(index, random())] as const);
}

/** A latency incident between minutes 34 and 42, and a scrape gap at 20–22. */
const incident = (index: number) => (index >= 34 && index <= 42 ? Math.sin(((index - 34) / 8) * Math.PI) : 0);
const gap = (index: number) => index >= 20 && index <= 22;

function latencySeries(now: number, minutes = 60): TimeSeries[] {
  return [
    { id: 'p50', label: 'p50', unit: 'ms', points: sampled(11, minutes, now, (i, n) => (gap(i) ? null : Math.round(42 + n * 10 + incident(i) * 30))) },
    { id: 'p95', label: 'p95', unit: 'ms', points: sampled(12, minutes, now, (i, n) => (gap(i) ? null : Math.round(140 + n * 40 + incident(i) * 220))) },
    { id: 'p99', label: 'p99', unit: 'ms', points: sampled(13, minutes, now, (i, n) => (gap(i) ? null : Math.round(260 + n * 80 + incident(i) * 520))) },
  ];
}

function throughputSeries(now: number, minutes = 60): TimeSeries[] {
  const wave = (i: number) => Math.sin((i / minutes) * Math.PI * 2);
  return [
    { id: '2xx', label: '2xx', unit: 'req/s', points: sampled(21, minutes, now, (i, n) => Math.round(820 + wave(i) * 140 + n * 60)) },
    { id: '3xx', label: '3xx', unit: 'req/s', points: sampled(22, minutes, now, (i, n) => Math.round(120 + wave(i) * 20 + n * 15)) },
    { id: '4xx', label: '4xx', unit: 'req/s', points: sampled(23, minutes, now, (i, n) => Math.round(40 + n * 18)) },
    { id: '5xx', label: '5xx', unit: 'req/s', points: sampled(24, minutes, now, (i, n) => Math.round(4 + n * 4 + incident(i) * 90)) },
  ];
}

const LATENCY = latencySeries(NOW);
const THROUGHPUT = throughputSeries(NOW);
const SLO: TimeSeriesThreshold[] = [
  { value: 500, label: 'SLO p99', intent: 'danger' },
  { value: 350, label: 'Warn', intent: 'warning' },
];
const DEPLOYS: TimeSeriesAnnotation[] = [
  { time: NOW - 27 * MINUTE, label: 'deploy v4.12', intent: 'info' },
  { time: NOW - 17 * MINUTE, label: 'rollback', intent: 'warning' },
];

const select = (options: readonly string[], description: string) => ({ control: 'select' as const, options, description });

const meta: Meta<typeof TimeSeriesChart> = {
  title: 'Components/Data/TimeSeriesChart',
  component: TimeSeriesChart,
  tags: ['autodocs', 'preview'],
  argTypes: {
    variant: select(TIME_SERIES_VARIANTS.variant, 'How the series are drawn.'),
    curve: select(TIME_SERIES_VARIANTS.curve, 'How a line joins its samples.'),
    points: select(TIME_SERIES_VARIANTS.points, 'Where point markers are drawn.'),
    grid: select(TIME_SERIES_VARIANTS.grid, 'Which grid lines are drawn.'),
    yScale: select(TIME_SERIES_VARIANTS.yScale, 'The value scale; log skips zero and negatives.'),
    yDomain: select(TIME_SERIES_VARIANTS.yDomain, 'From zero, or fitted to the data (a tuple is also accepted in code).'),
    legend: select(TIME_SERIES_VARIANTS.legend, 'Legend placement, or inline labels.'),
    colorStrategy: select(TIME_SERIES_VARIANTS.colorStrategy, 'Categorical role colours, or one emphasised series.'),
    emphasisSeriesId: select(['p50', 'p95', 'p99', '2xx', '3xx', '4xx', '5xx'], 'The series `emphasis` highlights.'),
    density: select(TIME_SERIES_VARIANTS.density, 'Spacing and type size.'),
    strokeWidth: { control: { type: 'range', min: 0.5, max: 4, step: 0.25 } },
    fillOpacity: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    height: { control: { type: 'range', min: 80, max: 400, step: 10 } },
    showAxes: { control: 'boolean' },
    showTitle: { control: 'boolean' },
    zoomable: { control: 'boolean' },
    unit: { control: 'text' },
    title: { control: 'text' },
    series: { control: false },
    range: { control: false },
    formatValue: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'The metrics chart of an observability dashboard: lines, areas or stacked areas over time, with dashed thresholds (danger tints the band above), annotations, a legend that hides series, a crosshair readout and drag-to-zoom. Inside a `TimeRangeProvider` it follows the shared window and cursor, so hovering one chart draws the same moment on all of them and a drag zooms them all. The plot is one tab stop: Left/Right step sample by sample, Home/End jump, Escape clears. Series colours are roles, cycling through five, never `accent-tertiary` — on midnight that is the danger pink. Every design choice is a prop; `TIME_SERIES_VARIANTS` lists their values.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof TimeSeriesChart>;

/** Request latency percentiles against an SLO, at a fixed clock — the visual baseline. */
export const Latency: Story = {
  args: {
    title: 'Checkout latency',
    series: LATENCY,
    range: HOUR_RANGE,
    unit: 'ms',
    thresholds: SLO,
    annotations: DEPLOYS,
  },
  parameters: {
    docs: {
      description: {
        story: 'p50, p95 and p99 over the last hour at a fixed `now`, with seeded data. The p99 crosses the 500ms danger threshold during the incident, so the band above it is tinted and the breaching samples are marked; a scrape gap breaks every line at 13:20. Every design prop is a control here.',
      },
    },
  },
};

/** Requests per second by status class, as stacked areas. */
export const Throughput: Story = {
  args: {
    title: 'Throughput by status',
    series: THROUGHPUT,
    range: HOUR_RANGE,
    variant: 'stacked',
    unit: 'req/s',
  },
  parameters: {
    docs: {
      description: {
        story: 'Four status classes stacked, the first on zero. The readout lists each class’s own rate, not the running total. Toggle a class in the legend and the stack closes up.',
      },
    },
  },
};

function SharedCursorDemo() {
  return (
    <TimeRangeProvider now={NOW}>
      <div className="flex flex-col gap-4">
        <TimeRangePicker />
        <TimeSeriesChart title="Latency" series={LATENCY} unit="ms" thresholds={SLO} height={180} />
        <TimeSeriesChart title="Throughput" series={THROUGHPUT} unit="req/s" variant="stacked" height={180} />
      </div>
    </TimeRangeProvider>
  );
}

/** Two charts in one `TimeRangeProvider`: one cursor, one window. */
export const SharedCursor: Story = {
  render: () => <SharedCursorDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Hover either chart and both draw the cursor and their readouts at the same moment. Drag across one to zoom both; the picker then shows `Zoomed` and a reset back to the preset.',
      },
    },
  },
};

/** What a chart shows when nothing falls in its window. */
export const Empty: Story = {
  args: {
    title: 'Queue depth',
    series: [{ id: 'depth', label: 'depth', points: [] }],
    range: HOUR_RANGE,
  },
  parameters: { docs: { description: { story: 'No samples in range: a dashed frame and “No data in this range.” The legend stays, so a hidden series can be shown again.' } } },
};

type Axis = keyof typeof TIME_SERIES_VARIANTS;
const AXES: Axis[] = ['curve', 'points', 'grid', 'yScale', 'yDomain', 'legend', 'colorStrategy', 'density', 'variant'];
/** Shorter data for small multiples: the last 35 minutes, incident included. */
const MATRIX_SERIES = LATENCY.map((entry) => ({ ...entry, points: entry.points.slice(25) }));
const MATRIX_BASE: Partial<TimeSeriesChartProps> = { density: 'compact', legend: 'none', height: 130, showTitle: false, thresholds: SLO.slice(0, 1), unit: 'ms' };

function VariationMatrixDemo() {
  return (
    <div className="flex flex-col gap-5 font-mono text-xs text-content-primary">
      {AXES.map((axis) => (
        <section key={axis} aria-label={axis} className="flex flex-col gap-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-content-secondary">{axis}</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3">
            {TIME_SERIES_VARIANTS[axis].map((value) => (
              <figure key={value} className="flex min-w-0 flex-col gap-1 border border-edge-subtle p-2">
                <figcaption className="text-content-muted">{axis}={value}</figcaption>
                <TimeSeriesChart
                  {...MATRIX_BASE}
                  {...{ [axis]: value }}
                  series={axis === 'variant' && value === 'stacked' ? MATRIX_SERIES.slice(0, 2) : MATRIX_SERIES}
                  title={`${axis}=${value}`}
                />
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** The same seeded data across every value of every design prop. Not snapshotted. */
export const VariationMatrix: Story = {
  render: () => <VariationMatrixDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Small multiples for evaluating design choices: one row per prop, one cell per value, each labelled `prop=value`. Every cell otherwise shares the same base — compact, no legend, one danger threshold — so only the named prop differs.',
      },
    },
  },
};
