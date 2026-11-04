import type { Meta, StoryObj } from '@storybook/react-vite';
import { variantAxes } from './chartLab/axes';
import { LATENCY_HISTOGRAM_VARIANTS, LatencyHistogram } from '../components/LatencyHistogram';

/** A seeded PRNG (mulberry32): the same samples on every render. */
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

/** Log-normal latencies around `median` ms — `spread` is sigma of the log. Box–Muller over the seeded PRNG. */
function logNormal(random: () => number, count: number, median: number, spread: number): number[] {
  return Array.from({ length: count }, () => {
    const u = Math.max(1e-12, random());
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
    return median * Math.exp(spread * z);
  });
}

function mixture(seed: number, parts: ReadonlyArray<{ count: number; median: number; spread: number }>): number[] {
  const random = mulberry32(seed);
  return parts.flatMap((part) => logNormal(random, part.count, part.median, part.spread));
}

/** A checkout endpoint: a 120ms body and a long tail of slow payment calls. */
const checkout = mixture(7, [{ count: 2400, median: 120, spread: 0.45 }, { count: 90, median: 650, spread: 0.5 }]);
/** Cache hits at ~4ms and misses at ~180ms. */
const bimodal = mixture(11, [{ count: 1800, median: 4, spread: 0.35 }, { count: 700, median: 180, spread: 0.4 }]);

const meta: Meta<typeof LatencyHistogram> = {
  title: 'Components/Data/LatencyHistogram',
  component: LatencyHistogram,
  tags: ['autodocs', 'preview'],
  argTypes: {
    scale: { control: 'inline-radio', options: [...LATENCY_HISTOGRAM_VARIANTS.scale] },
    binning: { control: 'inline-radio', options: [...LATENCY_HISTOGRAM_VARIANTS.binning] },
    bar: { control: 'inline-radio', options: [...LATENCY_HISTOGRAM_VARIANTS.bar] },
    markers: { control: 'inline-radio', options: [...LATENCY_HISTOGRAM_VARIANTS.markers] },
    density: { control: 'inline-radio', options: [...LATENCY_HISTOGRAM_VARIANTS.density] },
    cumulative: { control: 'boolean' },
    bins: { control: { type: 'range', min: 5, max: 80, step: 1 } },
    height: { control: { type: 'number', min: 80, max: 400, step: 10 } },
    percentiles: { control: 'object' },
    slo: { control: 'object' },
    samples: { control: false },
    buckets: { control: false },
    formatValue: { control: false },
  },
  parameters: {
    docs: {
      description: {
        component:
          'How long requests took: a histogram on a log axis by default (latency spans orders of magnitude), with p50 / p90 / p99 markers and an optional SLO as a dashed danger line — bars wholly past it turn to the danger role. Pass raw `samples` or pre-bucketed `buckets`. The bars are one tab stop: Left/Right (and Home/End) move through the buckets, and hovering reads one out as `120–180ms · 342 requests`. A screen reader gets the count, the percentiles and the share over the SLO. Every drawing choice — `scale`, `binning`, `bar`, `markers`, `cumulative`, `density` — is a prop, listed in `LATENCY_HISTOGRAM_VARIANTS`.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof LatencyHistogram>;

/** A checkout endpoint against a 300ms objective — the snapshot story. */
export const Checkout: Story = {
  args: { samples: checkout, slo: { value: 300 }, title: 'POST /checkout' },
  parameters: { docs: { description: { story: '2,490 seeded log-normal requests around 120ms, plus a slow tail from the payment provider. The bars past the 300ms SLO are tinted danger, and the markers show p99 well beyond it.' } } },
};

/** Two populations — cache hits and misses — read as two humps. */
export const Bimodal: Story = {
  args: { samples: bimodal, title: 'GET /product (cached)' },
  parameters: { docs: { description: { story: 'Hits around 4ms and misses around 180ms. On a log axis both humps are legible; p50 sits in the hits and p90 in the misses, which is why a single average lies about this service.' } } },
};

/** The same checkout data on a linear axis with equal-width bins. */
export const LinearScale: Story = {
  args: { samples: checkout, scale: 'linear', slo: { value: 300 } },
  parameters: { docs: { description: { story: 'A linear axis crowds the body into a few bars and spends most of the width on the tail — the comparison that motivates the log default.' } } },
};

/** Steps with a cumulative overlay: the shape and the CDF together. */
export const StepsWithCumulative: Story = {
  args: { samples: bimodal, bar: 'steps', cumulative: true, markers: 'labels' },
  parameters: { docs: { description: { story: '`bar="steps"` traces the bucket tops, `cumulative` adds the running share on a 0–100% scale at the right, and `markers="labels"` keeps the percentiles out of the plot.' } } },
};

/** Nothing to plot. */
export const Empty: Story = {
  args: { samples: [], title: 'GET /health' },
  parameters: { docs: { description: { story: 'No samples renders "No samples." in place of the chart.' } } },
};

const AXES = variantAxes(LATENCY_HISTOGRAM_VARIANTS) as Array<[keyof typeof LATENCY_HISTOGRAM_VARIANTS, readonly (string | boolean)[]]>;

/** Every variant value as small multiples over one dataset. Not snapshotted: it is for evaluation. */
export const VariationMatrix: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {AXES.map(([axis, values]) => (
        <section key={axis} className="flex flex-col gap-2">
          <h3 className="font-mono text-xs uppercase tracking-wide text-content-secondary">{axis}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {values.map((value) => (
              <figure key={String(value)} className="m-0 flex min-w-0 flex-col gap-1 border border-edge-subtle p-2">
                <figcaption className="font-mono text-xs text-content-muted">{`${axis}=${String(value)}`}</figcaption>
                <LatencyHistogram {...args} samples={bimodal} slo={{ value: 300 }} height={axis === 'density' ? undefined : 140} {...{ [axis]: value }} title={`${axis} ${String(value)}`} />
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
  parameters: { docs: { description: { story: 'One row per prop in `LATENCY_HISTOGRAM_VARIANTS`, one labelled cell per value, all over the same seeded bimodal dataset with a 300ms SLO. The controls apply to every cell except the axis that row varies.' } } },
};
