import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { LATENCY_HEATMAP_VARIANTS, LatencyHeatmap } from '../components/LatencyHeatmap';
import { TimeRangePicker, TimeRangeProvider } from '../components/TimeRange';
import { formatLatencyRange, formatRequests, type LatencyCell, type LatencyPoint } from '../lib/latency';
import { formatClock } from '../lib/timeRange';

/** The fixed clock every static story renders against. */
const NOW = Date.UTC(2026, 9, 22, 14, 0);
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/** A seeded PRNG (mulberry32): the same points on every render. */
function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One log-normal draw around `median` ms. */
function logNormal(random: () => number, median: number, spread: number): number {
  const u = Math.max(1e-12, random());
  return median * Math.exp(spread * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random()));
}

/** `count` requests spread evenly at random over `[from, to)`, each drawn from whichever population `pick` returns for its time. */
function series(seed: number, count: number, from: number, to: number, pick: (time: number, random: () => number) => { median: number; spread: number }): LatencyPoint[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const time = Math.floor(from + random() * (to - from));
    const { median, spread } = pick(time, random);
    return { time, value: logNormal(random, median, spread) };
  }).sort((a, b) => a.time - b.time);
}

const HIT = { median: 18, spread: 0.35 };
const MISS = { median: 260, spread: 0.4 };
/** An hour of a cached endpoint: three quarters hits, a quarter misses. */
const bimodalHour = series(3, 6000, NOW - HOUR, NOW, (_, random) => (random() < 0.75 ? HIT : MISS));
/** An hour with a ten-minute spike in the middle: most requests stall on a slow dependency. */
const incidentHour = series(5, 6000, NOW - HOUR, NOW, (time, random) => {
  const inIncident = time >= NOW - 35 * MINUTE && time < NOW - 25 * MINUTE;
  if (inIncident && random() < 0.65) return { median: 1400, spread: 0.45 };
  return { median: 85, spread: 0.35 };
});
/** Six hours, so every preset up to 6h has data to show. */
const sixHours = series(9, 12_000, NOW - 6 * HOUR, NOW, (time, random) => {
  const slowHour = time >= NOW - 4 * HOUR && time < NOW - 3 * HOUR;
  return random() < (slowHour ? 0.45 : 0.2) ? MISS : HIT;
});

const meta: Meta<typeof LatencyHeatmap> = {
  title: 'Components/Data/LatencyHeatmap',
  component: LatencyHeatmap,
  tags: ['autodocs', 'preview'],
  argTypes: {
    colorScale: { control: 'inline-radio', options: [...LATENCY_HEATMAP_VARIANTS.colorScale] },
    colorSteps: { control: { type: 'range', min: 3, max: 9, step: 1 } },
    density: { control: 'inline-radio', options: [...LATENCY_HEATMAP_VARIANTS.density] },
    showLegend: { control: 'boolean' },
    zoomable: { control: 'boolean' },
    cellGap: { control: { type: 'range', min: 0, max: 6, step: 1 } },
    percentileOverlay: { control: 'object' },
    columns: { control: { type: 'range', min: 10, max: 120, step: 5 } },
    rows: { control: { type: 'range', min: 4, max: 32, step: 1 } },
    height: { control: { type: 'number', min: 100, max: 480, step: 10 } },
    points: { control: false },
    range: { control: false },
    formatValue: { control: false },
    onCellSelect: { control: false },
    onRangeSelect: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Latency over time: time buckets across, log-spaced latency buckets up, each cell shaded by its request count — one role, stepped opacities on a square-root scale by default, so a faint slow mode still shows beside a busy fast one. Inside a `TimeRangeProvider` it takes the shared window, hovering moves the shared cursor (and draws one set elsewhere), and dragging across columns zooms every view on the page. One tab stop: arrows move a focus cell, Enter or Space selects it through `onCellSelect`. Every drawing choice — `colorScale`, `colorSteps`, `cellGap`, `showLegend`, `density`, `percentileOverlay` — is a prop, listed in `LATENCY_HEATMAP_VARIANTS`.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof LatencyHeatmap>;

/** A cached endpoint over an hour — the snapshot story. */
export const Bimodal: Story = {
  args: { points: bimodalHour, range: { from: NOW - HOUR, to: NOW }, title: 'GET /product' },
  parameters: { docs: { description: { story: '6,000 seeded requests between 13:00 and 14:00 UTC: cache hits in a band around 18ms and misses around 260ms. The two bands are the point — a percentile line alone would hide them.' } } },
};

/** A ten-minute latency spike in the middle of the hour. */
export const Incident: Story = {
  args: { points: incidentHour, range: { from: NOW - HOUR, to: NOW }, percentileOverlay: [50, 99], title: 'POST /checkout' },
  parameters: { docs: { description: { story: 'From 13:25 to 13:35 most requests stall around 1.4s on a slow dependency; the p50 and p99 overlays jump with them. Drag across the spike to report the window through `onRangeSelect`.' } } },
};

/** Inside a `TimeRangeProvider` with a picker: pick a preset, or drag to zoom. */
export const WithTimeRange: Story = {
  render: (args) => (
    <TimeRangeProvider now={NOW}>
      <div className="flex flex-col gap-3">
        <TimeRangePicker />
        <LatencyHeatmap {...args} points={sixHours} title="GET /product" />
      </div>
    </TimeRangeProvider>
  ),
  parameters: { docs: { description: { story: 'Six hours of data under a `TimeRangePicker`. The heatmap draws whatever window the picker holds; drag across columns and the provider zooms — the picker shows `Zoomed` and a reset.' } } },
};

function Selectable(args: Story['args']) {
  const [cell, setCell] = useState<LatencyCell | null>(null);
  return (
    <div className="flex flex-col gap-3">
      <LatencyHeatmap {...args} points={incidentHour} range={{ from: NOW - HOUR, to: NOW }} onCellSelect={setCell} title="POST /checkout" />
      <p className="font-mono text-xs text-content-secondary">
        {cell
          ? `Show traces: ${formatClock(cell.timeRange.from)}–${formatClock(cell.timeRange.to)} UTC · ${formatLatencyRange(cell.latencyRange.from, cell.latencyRange.to)} · ${formatRequests(cell.count)}`
          : 'Click a cell, or focus the chart and press Enter.'}
      </p>
    </div>
  );
}

/** `onCellSelect` reports the chosen bucket — the "show traces in this cell" hand-off. */
export const SelectableCells: Story = {
  render: (args) => <Selectable {...args} />,
  parameters: { docs: { description: { story: 'Clicking a cell, or Enter on the focused one, outlines it and passes it to `onCellSelect`; here the chosen bucket is printed below as a trace query would receive it.' } } },
};

const AXES = Object.entries(LATENCY_HEATMAP_VARIANTS) as Array<[keyof typeof LATENCY_HEATMAP_VARIANTS, readonly unknown[]]>;
const label = (value: unknown) => (Array.isArray(value) ? `[${value.join(', ')}]` : String(value));

/** Every variant value as small multiples over one dataset. Not snapshotted: it is for evaluation. */
export const VariationMatrix: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {AXES.map(([axis, values]) => (
        <section key={axis} className="flex flex-col gap-2">
          <h3 className="font-mono text-xs uppercase tracking-wide text-content-secondary">{axis}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {values.map((value) => (
              <figure key={label(value)} className="m-0 flex min-w-0 flex-col gap-1 border border-edge-subtle p-2">
                <figcaption className="font-mono text-xs text-content-muted">{`${axis}=${label(value)}`}</figcaption>
                <LatencyHeatmap
                  {...args}
                  points={incidentHour}
                  range={{ from: NOW - HOUR, to: NOW }}
                  height={axis === 'density' ? undefined : 160}
                  {...{ [axis]: value }}
                  title={`${axis} ${label(value)}`}
                />
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
  parameters: { docs: { description: { story: 'One row per prop in `LATENCY_HEATMAP_VARIANTS`, one labelled cell per value, all over the same seeded incident hour. The controls apply to every cell except the axis that row varies.' } } },
};
