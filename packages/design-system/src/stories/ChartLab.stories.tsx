import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { LATENCY_HEATMAP_VARIANTS, LatencyHeatmap } from '../components/LatencyHeatmap';
import { LATENCY_HISTOGRAM_VARIANTS, LatencyHistogram } from '../components/LatencyHistogram';
import { TIME_SERIES_VARIANTS, TimeSeriesChart } from '../components/TimeSeriesChart';
import { LAB_DATASETS, type LabDataset } from './chartLab/datasets';

/**
 * The chart lab (#418): every visual choice the charts expose, judged on data
 * built to break them. Nothing here is a component — it is the bench the
 * components' variation props are evaluated on. `pnpm walkthrough` captures
 * every story on both levels, so each run is a contact sheet to review.
 */

type SeriesArgs = {
  curve: (typeof TIME_SERIES_VARIANTS.curve)[number];
  points: (typeof TIME_SERIES_VARIANTS.points)[number];
  grid: (typeof TIME_SERIES_VARIANTS.grid)[number];
  yScale: (typeof TIME_SERIES_VARIANTS.yScale)[number];
  yDomain: (typeof TIME_SERIES_VARIANTS.yDomain)[number];
  colorStrategy: (typeof TIME_SERIES_VARIANTS.colorStrategy)[number];
  legend: (typeof TIME_SERIES_VARIANTS.legend)[number];
  strokeWidth: number;
};
type HistogramArgs = {
  bar: (typeof LATENCY_HISTOGRAM_VARIANTS.bar)[number];
  markers: (typeof LATENCY_HISTOGRAM_VARIANTS.markers)[number];
  cumulative: boolean;
};
type HeatmapArgs = {
  colorScale: (typeof LATENCY_HEATMAP_VARIANTS.colorScale)[number];
  colorSteps: number;
  cellGap: number;
};
type LabArgs = SeriesArgs & HistogramArgs & HeatmapArgs & {
  dataset: string;
  axis: string;
};

const select = (options: readonly (string | number | boolean)[], category: string) => ({ control: 'select' as const, options, table: { category } });

const meta: Meta<LabArgs> = {
  title: 'Showcase/ChartLab',
  tags: ['autodocs', 'experimental'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The bench for issue 418: the observability charts drawn through stress datasets — dense, sparse, gaps, a spike, negative values, twelve series, one point, a bimodal distribution and nothing at all. Every visual choice is a control; the sweeps draw every value of one choice side by side. When an option wins, record why and make it the default; when one loses, delete it.',
      },
    },
  },
  args: {
    curve: 'linear', points: 'hover', grid: 'horizontal', yScale: 'linear', yDomain: 'zero', colorStrategy: 'categorical', legend: 'bottom', strokeWidth: 1.5,
    bar: 'bars', markers: 'lines', cumulative: false,
    colorScale: 'sqrt', colorSteps: 6, cellGap: 1,
    dataset: 'spike', axis: 'curve',
  },
  argTypes: {
    curve: select(TIME_SERIES_VARIANTS.curve, 'Time series'),
    points: select(TIME_SERIES_VARIANTS.points, 'Time series'),
    grid: select(TIME_SERIES_VARIANTS.grid, 'Time series'),
    yScale: select(TIME_SERIES_VARIANTS.yScale, 'Time series'),
    yDomain: select(TIME_SERIES_VARIANTS.yDomain, 'Time series'),
    colorStrategy: select(TIME_SERIES_VARIANTS.colorStrategy, 'Time series'),
    legend: select(TIME_SERIES_VARIANTS.legend, 'Time series'),
    strokeWidth: { control: { type: 'range', min: 0.5, max: 4, step: 0.25 }, table: { category: 'Time series' } },
    bar: select(LATENCY_HISTOGRAM_VARIANTS.bar, 'Histogram'),
    markers: select(LATENCY_HISTOGRAM_VARIANTS.markers, 'Histogram'),
    cumulative: { control: 'boolean', table: { category: 'Histogram' } },
    colorScale: select(LATENCY_HEATMAP_VARIANTS.colorScale, 'Heatmap'),
    colorSteps: { control: { type: 'range', min: 3, max: 9, step: 1 }, table: { category: 'Heatmap' } },
    cellGap: select(LATENCY_HEATMAP_VARIANTS.cellGap, 'Heatmap'),
    dataset: select(LAB_DATASETS.map((dataset) => dataset.id), 'Sweep'),
    axis: { control: 'select', table: { category: 'Sweep' } },
  },
};
export default meta;
type Story = StoryObj<LabArgs>;

const seriesProps = (args: SeriesArgs) => ({
  curve: args.curve, points: args.points, grid: args.grid, yScale: args.yScale, yDomain: args.yDomain,
  colorStrategy: args.colorStrategy, legend: args.legend, strokeWidth: args.strokeWidth,
});
const datasetById = (id: string): LabDataset => LAB_DATASETS.find((dataset) => dataset.id === id) ?? LAB_DATASETS[0]!;

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="flex min-w-0 flex-col gap-1 border border-edge-subtle bg-surface-raised p-2">
      <figcaption className="font-mono text-xs text-content-secondary">{label}</figcaption>
      {children}
    </figure>
  );
}

function ContactSheet(args: LabArgs) {
  return (
    <div className="flex flex-col gap-6">
      {LAB_DATASETS.map((dataset) => (
        <section key={dataset.id} aria-label={`${dataset.label} dataset`} className="flex flex-col gap-2">
          <header className="flex flex-wrap items-baseline gap-x-3">
            <h3 className="font-mono text-sm font-bold uppercase">{dataset.label}</h3>
            <p className="font-mono text-xs text-content-muted">{dataset.stresses}</p>
          </header>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <Cell label="line"><TimeSeriesChart title={`${dataset.label} line`} series={dataset.series} density="compact" height={150} {...seriesProps(args)} /></Cell>
            <Cell label="area"><TimeSeriesChart title={`${dataset.label} area`} series={dataset.series} variant={dataset.series.length > 1 ? 'stacked' : 'area'} density="compact" height={150} {...seriesProps(args)} /></Cell>
            <Cell label="histogram"><LatencyHistogram title={`${dataset.label} histogram`} samples={dataset.samples.map((sample) => sample.value)} density="compact" bar={args.bar} markers={args.markers} cumulative={args.cumulative} /></Cell>
            <Cell label="heatmap"><LatencyHeatmap title={`${dataset.label} heatmap`} points={dataset.samples} columns={30} rows={12} density="compact" colorScale={args.colorScale} colorSteps={args.colorSteps} cellGap={args.cellGap} /></Cell>
          </div>
        </section>
      ))}
    </div>
  );
}

/** Every dataset through every chart, with one set of controls for all of them. */
export const ContactSheetStory: Story = {
  name: 'Contact sheet',
  render: (args) => <ContactSheet {...args} />,
  parameters: { docs: { description: { story: 'Ten stress datasets × line, area, histogram and heatmap. Change a control and every cell redraws, so a choice is judged on the spike and the gaps and the empty state at once — not just the happy path.' } } },
};

function Sweep<T extends Record<string, readonly unknown[]>>({ variants, axis, dataset, render }: { variants: T; axis: string; dataset: LabDataset; render: (prop: Record<string, unknown>, value: unknown) => ReactNode }) {
  const key = (axis in variants ? axis : Object.keys(variants)[0]!) as keyof T & string;
  return (
    <div className="flex flex-col gap-2">
      <p className="font-mono text-xs text-content-muted">{dataset.label}: {dataset.stresses} Sweeping <code>{key}</code>.</p>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {variants[key]!.map((value) => (
          <Cell key={JSON.stringify(value)} label={`${key}=${JSON.stringify(value)}`}>{render({ [key]: value }, value)}</Cell>
        ))}
      </div>
    </div>
  );
}

/** Every value of one time-series choice, side by side on one dataset. */
export const TimeSeriesSweep: Story = {
  args: { dataset: 'spike', axis: 'yScale' },
  argTypes: { axis: { options: Object.keys(TIME_SERIES_VARIANTS) } },
  render: (args) => {
    const dataset = datasetById(args.dataset);
    return <Sweep variants={TIME_SERIES_VARIANTS} axis={args.axis} dataset={dataset} render={(prop) => <TimeSeriesChart title={`${dataset.label} sweep`} series={dataset.series} height={180} {...seriesProps(args)} {...prop} />} />;
  },
  parameters: { docs: { description: { story: 'Choose a dataset and an axis. The spike under `yScale` is the case the log scale exists for; the twelve series under `colorStrategy` is the case for emphasis; the gaps under `curve` show whether a smoothed line invents data across a missing scrape.' } } },
};

/** Every value of one histogram choice, side by side on one dataset. */
export const HistogramSweep: Story = {
  args: { dataset: 'bimodal', axis: 'bar' },
  argTypes: { axis: { options: Object.keys(LATENCY_HISTOGRAM_VARIANTS) } },
  render: (args) => {
    const dataset = datasetById(args.dataset);
    return <Sweep variants={LATENCY_HISTOGRAM_VARIANTS} axis={args.axis} dataset={dataset} render={(prop) => <LatencyHistogram title={`${dataset.label} histogram sweep`} samples={dataset.samples.map((sample) => sample.value)} bar={args.bar} markers={args.markers} cumulative={args.cumulative} slo={{ value: 300 }} {...prop} />} />;
  },
  parameters: { docs: { description: { story: 'The bimodal set is the hard one for a histogram: on a linear scale the fast population is one bar and the slow one a smear. Sweep `scale` and `binning` to see it.' } } },
};

/** Every value of one heatmap choice, side by side on one dataset. */
export const HeatmapSweep: Story = {
  args: { dataset: 'spike', axis: 'colorScale' },
  argTypes: { axis: { options: Object.keys(LATENCY_HEATMAP_VARIANTS) } },
  render: (args) => {
    const dataset = datasetById(args.dataset);
    return <Sweep variants={LATENCY_HEATMAP_VARIANTS} axis={args.axis} dataset={dataset} render={(prop) => <LatencyHeatmap title={`${dataset.label} heatmap sweep`} points={dataset.samples} columns={30} rows={12} colorScale={args.colorScale} colorSteps={args.colorSteps} cellGap={args.cellGap} {...prop} />} />;
  },
  parameters: { docs: { description: { story: 'The spike is a few hundred slow requests among thousands of fast ones. Under `colorScale=linear` they vanish; `sqrt`, `log` and `quantile` trade how much of the quiet background they light up to keep them visible.' } } },
};

const ROLE_PAIRS: Array<[string, string, string]> = [
  ['accent-primary', 'intent-info', 'the same colour on both levels'],
  ['accent-secondary', 'intent-success', 'the same colour on sketch'],
  ['accent-secondary', 'intent-warning', 'the same colour on midnight'],
  ['accent-tertiary', 'intent-danger', 'the same colour on both levels (issue 398)'],
];
const SWATCH: Record<string, string> = {
  'accent-primary': 'bg-accent-primary', 'accent-secondary': 'bg-accent-secondary', 'accent-tertiary': 'bg-accent-tertiary',
  'intent-info': 'bg-intent-info', 'intent-success': 'bg-intent-success', 'intent-warning': 'bg-intent-warning', 'intent-danger': 'bg-intent-danger',
};

/** Why the categorical cycle is two colours and a neutral, then dashes. */
export const Palette: Story = {
  render: () => (
    <div className="flex flex-col gap-4 font-mono text-xs">
      <ul className="flex flex-col gap-2">
        {ROLE_PAIRS.map(([a, b, note]) => (
          <li key={`${a}-${b}`} className="flex items-center gap-3">
            <span aria-hidden="true" className={`size-5 border border-edge-subtle ${SWATCH[a]}`} />
            <span aria-hidden="true" className={`size-5 border border-edge-subtle ${SWATCH[b]}`} />
            <span><code>{a}</code> and <code>{b}</code>: {note}</span>
          </li>
        ))}
      </ul>
      <TimeSeriesChart title="Twelve series on the categorical cycle" series={datasetById('many').series} height={220} legend="bottom" />
    </div>
  ),
  parameters: { docs: { description: { story: 'The roles name fewer colours than they appear to. Only `accent-primary` and `accent-secondary` differ on every level without meaning something, so the chart cycles those two and a neutral, then tells series apart by dash. Switch the level in the toolbar: the pairs above collide on one level or both. A categorical palette is a token gap this lab exposes, not one a chart can paper over.' } } },
};
