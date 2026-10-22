/**
 * Stress datasets for the chart lab (#418): each one breaks a chart in a
 * different way, so a visual choice is judged on more than the happy path.
 *
 * Every dataset is seeded and on a fixed epoch, so the lab renders the same
 * contact sheet on every machine and both levels.
 */

export const LAB_NOW = Date.UTC(2026, 9, 22, 14, 0);
const MINUTE = 60_000;

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const normal = (random: () => number) => Math.sqrt(-2 * Math.log(Math.max(1e-12, random()))) * Math.cos(2 * Math.PI * random());
const round = (value: number) => Math.round(value * 10) / 10;

export type LabPoint = readonly [time: number, value: number | null];
export interface LabSeries { id: string; label: string; unit?: string; points: LabPoint[] }
export interface LabDataset {
  id: string;
  label: string;
  /** What this dataset is here to break. */
  stresses: string;
  series: LabSeries[];
  /** Latency samples drawn from the same story, for the histogram and heatmap. */
  samples: { time: number; value: number }[];
}

function walk(seed: number, count: number, step: number, base: number, noise: number, shape: (index: number) => number = () => 0): LabPoint[] {
  const random = seeded(seed);
  const start = LAB_NOW - count * step;
  return Array.from({ length: count + 1 }, (_, index) => [start + index * step, round(base + shape(index) + noise * normal(random))] as const);
}

function latencySamples(seed: number, count: number, perStep: number, step: number, body: number, slow?: (index: number) => number): { time: number; value: number }[] {
  const random = seeded(seed);
  const start = LAB_NOW - count * step;
  const out: { time: number; value: number }[] = [];
  for (let index = 0; index <= count; index += 1) {
    for (let k = 0; k < perStep; k += 1) {
      const isSlow = slow ? random() < slow(index) : false;
      out.push({ time: start + index * step + Math.floor(random() * step), value: Math.round(isSlow ? body * 25 * Math.exp(0.25 * normal(random)) : body * Math.exp(0.5 * normal(random))) });
    }
  }
  return out;
}

const spike = (centre: number, width: number, height: number) => (index: number) => height * Math.exp(-(((index - centre) / width) ** 2));

export const LAB_DATASETS: readonly LabDataset[] = [
  {
    id: 'typical',
    label: 'Typical',
    stresses: 'The baseline: three related series an hour long.',
    series: [
      { id: 'p50', label: 'p50', unit: 'ms', points: walk(1, 60, MINUTE, 80, 5) },
      { id: 'p95', label: 'p95', unit: 'ms', points: walk(2, 60, MINUTE, 190, 14) },
      { id: 'p99', label: 'p99', unit: 'ms', points: walk(3, 60, MINUTE, 310, 30) },
    ],
    samples: latencySamples(1, 60, 30, MINUTE, 85),
  },
  {
    id: 'dense',
    label: 'Dense',
    stresses: 'A point every 5s for six hours: 4,320 points per series. Over-plotting and render cost.',
    series: [{ id: 'rps', label: 'req/s', unit: 'req/s', points: walk(4, 4320, 5000, 400, 35, (index) => 60 * Math.sin(index / 300)) }],
    samples: latencySamples(4, 360, 12, MINUTE, 90),
  },
  {
    id: 'sparse',
    label: 'Sparse',
    stresses: 'Eight points over an hour. Do markers, curves and steps still read?',
    series: [{ id: 'jobs', label: 'batch jobs', points: walk(5, 7, 8 * MINUTE + 30_000, 12, 4) }],
    samples: latencySamples(5, 7, 4, 8 * MINUTE, 400),
  },
  {
    id: 'gaps',
    label: 'Gaps',
    stresses: 'Missing scrapes (null values): gaps must not be drawn as zero or bridged.',
    series: [{
      id: 'cpu', label: 'cpu', unit: '%',
      points: walk(6, 60, MINUTE, 45, 6).map(([time, value], index) => [time, (index > 18 && index < 26) || index === 40 || (index > 50 && index < 53) ? null : value] as const),
    }],
    samples: latencySamples(6, 60, 20, MINUTE, 60),
  },
  {
    id: 'spike',
    label: 'Spike',
    stresses: 'One 40× outlier against a flat line: linear versus log scale, zero versus data domain.',
    series: [
      { id: 'p99', label: 'p99', unit: 'ms', points: walk(7, 60, MINUTE, 120, 6, spike(38, 2.5, 4800)) },
      { id: 'p50', label: 'p50', unit: 'ms', points: walk(8, 60, MINUTE, 60, 3, spike(38, 2.5, 300)) },
    ],
    samples: latencySamples(7, 60, 30, MINUTE, 80, (index) => (Math.abs(index - 38) < 4 ? 0.45 : 0.002)),
  },
  {
    id: 'negative',
    label: 'Negative',
    stresses: 'Values below zero (queue drift, clock skew): the axis must cross zero honestly.',
    series: [{ id: 'skew', label: 'clock skew', unit: 'ms', points: walk(9, 60, MINUTE, 0, 8, (index) => 25 * Math.sin(index / 7)) }],
    samples: latencySamples(9, 60, 20, MINUTE, 40),
  },
  {
    id: 'many',
    label: 'Many series',
    stresses: 'Twelve pods: legend overflow, colour cycling, and whether emphasis beats categorical.',
    series: Array.from({ length: 12 }, (_, index) => ({ id: `pod-${index}`, label: `checkout-${String.fromCharCode(97 + index)}`, unit: 'ms', points: walk(20 + index, 60, MINUTE, 70 + index * 9, 6 + index) })),
    samples: latencySamples(20, 60, 40, MINUTE, 95),
  },
  {
    id: 'single',
    label: 'Single point',
    stresses: 'One sample: no line to draw, an axis with no width.',
    series: [{ id: 'once', label: 'cold start', unit: 'ms', points: [[LAB_NOW - 30 * MINUTE, 812]] }],
    samples: [{ time: LAB_NOW - 30 * MINUTE, value: 812 }],
  },
  {
    id: 'bimodal',
    label: 'Bimodal',
    stresses: 'Two latency populations (cache hit and miss). The mean is a lie; the heatmap and histogram must show both.',
    series: [{ id: 'mean', label: 'mean', unit: 'ms', points: walk(30, 60, MINUTE, 420, 25) }],
    samples: latencySamples(30, 60, 40, MINUTE, 30, () => 0.4),
  },
  {
    id: 'empty',
    label: 'Empty',
    stresses: 'Nothing in range: every chart needs a deliberate empty state.',
    series: [],
    samples: [],
  },
];
