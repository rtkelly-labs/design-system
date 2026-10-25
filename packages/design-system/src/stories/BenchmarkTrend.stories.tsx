import type { Meta, StoryObj } from '@storybook/react-vite';
import { variantAxes } from './chartLab/axes';
import { SERIALIZE_CANDIDATE, SERIALIZE_HISTORY } from './chartLab/benchmarks';
import { BENCHMARK_TREND_VARIANTS, BenchmarkTrend } from '../components/BenchmarkTrend';

const meta: Meta<typeof BenchmarkTrend> = {
  title: 'Components/Data/BenchmarkTrend',
  component: BenchmarkTrend,
  tags: ['autodocs', 'experimental'],
  args: { points: SERIALIZE_HISTORY, candidate: SERIALIZE_CANDIDATE, unit: 'ns', threshold: 0.05, title: 'ParquetSerializer.Serialize(Rows=10000)' },
  argTypes: {
    interval: { control: 'inline-radio', options: [...BENCHMARK_TREND_VARIANTS.interval] },
    density: { control: 'inline-radio', options: [...BENCHMARK_TREND_VARIANTS.density] },
    threshold: { control: { type: 'number', min: 0, max: 0.5, step: 0.01 } },
    points: { control: false },
    candidate: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'A benchmark\'s median along main, one evenly spaced point per commit, in the shape of Diffra\'s time-series projection (ADR 0007): commit, timestamp, tag and value, a candidate overlay set apart at the right, and a threshold band around the latest baseline. Release tags label their commits. History and candidate take the diff\'s before and after roles; neither is a verdict. Every drawing choice is listed in `BENCHMARK_TREND_VARIANTS`.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof BenchmarkTrend>;

/** The 18% regression in its history: well outside the band, and above even the pre-improvement level. */
export const Regression: Story = {
  parameters: { docs: { description: { story: 'Twenty-four commits, a 9% improvement landing at the tenth, tags at v5.0.0 and v5.1.0. The candidate leaves the ±5% band — and undoes the improvement, which the pairwise table alone could not show.' } } },
};

/** Intervals as a continuous ribbon. */
export const Ribbon: Story = {
  args: { interval: 'ribbon' },
  parameters: { docs: { description: { story: '`interval="ribbon"` joins each commit\'s interval into one band along the line; it needs every point to carry `low` and `high`.' } } },
};

/** History alone, no candidate and no band. */
export const HistoryOnly: Story = {
  args: { candidate: undefined, threshold: undefined },
  parameters: { docs: { description: { story: 'Without a candidate the chart is a plain history; without `threshold` there is no band.' } } },
};

const AXES = variantAxes(BENCHMARK_TREND_VARIANTS);

/** Every variant value as small multiples over the same history. Not snapshotted: it is for evaluation. */
export const VariationMatrix: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {AXES.map(([axis, values]) => (
        <section key={axis} className="flex flex-col gap-2">
          <h3 className="font-mono text-xs uppercase tracking-wide text-content-secondary">{axis}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(values as readonly string[]).map((value) => (
              <figure key={value} className="m-0 flex min-w-0 flex-col gap-1 border border-edge-subtle p-2">
                <figcaption className="font-mono text-xs text-content-muted">{`${axis}=${value}`}</figcaption>
                <BenchmarkTrend {...args} {...{ [axis]: value }} title={`${axis} ${value}`} />
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
  parameters: { docs: { description: { story: 'One row per prop in `BENCHMARK_TREND_VARIANTS`, one labelled cell per value, all over the Serialize history and its candidate.' } } },
};
