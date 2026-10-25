import type { Meta, StoryObj } from '@storybook/react-vite';
import { variantAxes } from './chartLab/axes';
import { BENCHMARKDOTNET_INPUTS, BIMODAL_CASE, PARQUET_BENCHMARKS, PARQUET_COMPARISONS, SERIALIZE_CANDIDATE, SERIALIZE_HISTORY } from './chartLab/benchmarks';
import { BENCHMARK_COMPARE_VARIANTS, BenchmarkCompare } from '../components/BenchmarkCompare';
import { BenchmarkTrend } from '../components/BenchmarkTrend';
import { DistributionCompare } from '../components/DistributionCompare';
import { ProvenanceStrip } from '../components/review/ProvenanceStrip';
import { StatusMark } from '../components/review/StatusMark';
import { VerdictBand } from '../components/review/VerdictBand';
import { compareBenchmarks } from '../lib/benchmark';

const meta: Meta<typeof BenchmarkCompare> = {
  title: 'Components/Data/BenchmarkCompare',
  component: BenchmarkCompare,
  tags: ['autodocs', 'experimental'],
  args: { comparisons: PARQUET_COMPARISONS },
  argTypes: {
    sort: { control: 'inline-radio', options: [...BENCHMARK_COMPARE_VARIANTS.sort] },
    density: { control: 'inline-radio', options: [...BENCHMARK_COMPARE_VARIANTS.density] },
    plot: { control: 'inline-radio', options: [...BENCHMARK_COMPARE_VARIANTS.plot] },
    comparisons: { control: false },
    domain: { control: 'object' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Benchmarks with repeated samples, baseline against candidate: the medians, the ratio with its confidence interval drawn over a 1× line and a shaded noise band, the sample sizes, and a classification — `slower`, `faster`, `unchanged` or `inconclusive`. Compute the rows with `compareBenchmarks` from `lib/benchmark` (or `fromBenchmarkDotNet` + `pairBenchmarkRuns` for a .NET suite); the component draws them and never recomputes. An inconclusive row prints why, and its whisker is dashed and its point hollow. Every drawing choice is listed in `BENCHMARK_COMPARE_VARIANTS`.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof BenchmarkCompare>;

/** A Parquet serializer suite: one regression, one improvement, noise, n = 3, a bimodal run, a straddler, a throughput metric and a removed case. */
export const ParquetSuite: Story = {
  args: { caption: 'Parquet.Benchmarks · main@ad61c03 → PR 212 at f00dcaf' },
  parameters: { docs: { description: { story: 'Sorted by impact, so the 18% regression is first and the noise last. `ReadFooter` moved 14% but ran three iterations a side, so it is inconclusive with a visibly wide whisker; `Serialize(Rows=100)` is bimodal, its median barely moves while its interval reaches 1.35×, which is exactly what a single-point rule would miss.' } } },
};

/** The same rows in the order the suite declared them. */
export const InputOrder: Story = {
  args: { sort: 'input' },
  parameters: { docs: { description: { story: '`sort="input"` keeps the producer\'s order — for a suite whose order means something, such as size steps of one benchmark.' } } },
};

/** Tight rows for a dense report. */
export const Compact: Story = {
  args: { density: 'compact' },
  parameters: { docs: { description: { story: '`density="compact"` tightens the rows and shrinks the interval plot; the numbers stay the same size as the rest of the table text.' } } },
};

/** Decoded from two BenchmarkDotNet JSON exports, paired by FullName. */
export const FromBenchmarkDotNet: Story = {
  args: { comparisons: compareBenchmarks(BENCHMARKDOTNET_INPUTS), caption: 'BenchmarkDotNet *-report-full.json, baseline and candidate' },
  parameters: { docs: { description: { story: 'The same suite written as two BenchmarkDotNet full exports — `Workload`/`Result` measurements divided by `Operations` — then `fromBenchmarkDotNet` and `pairBenchmarkRuns`. A case only in the baseline export pairs as `missing-candidate`.' } } },
};

/** The distribution-free alternative to the bootstrap. */
export const MannWhitney: Story = {
  args: { comparisons: compareBenchmarks(PARQUET_BENCHMARKS, { method: 'mann-whitney' }) },
  parameters: { docs: { description: { story: '`method: "mann-whitney"` — the Hodges–Lehmann ratio with its rank-sum interval. No randomness at all; it agrees with the bootstrap on every clean shift here, and refuses an interval for n = 3 rather than drawing one.' } } },
};

/** No rows. */
export const Empty: Story = {
  args: { comparisons: [] },
  parameters: { docs: { description: { story: 'An empty suite says "No benchmarks." rather than drawing an empty table.' } } },
};

const AXES = variantAxes(BENCHMARK_COMPARE_VARIANTS);

/** Every variant value, one labelled table each over the same suite. Not snapshotted: it is for evaluation. */
export const VariationMatrix: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {AXES.map(([axis, values]) => (
        <section key={axis} className="flex flex-col gap-2">
          <h3 className="font-mono text-xs uppercase tracking-wide text-content-secondary">{axis}</h3>
          <div className="flex flex-col gap-4">
            {(values as readonly string[]).map((value) => (
              <figure key={value} className="m-0 flex min-w-0 flex-col gap-1 border border-edge-subtle p-2">
                <figcaption className="font-mono text-xs text-content-muted">{`${axis}=${value}`}</figcaption>
                <BenchmarkCompare {...args} comparisons={PARQUET_COMPARISONS.slice(0, 5)} {...{ [axis]: value }} />
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
  parameters: { docs: { description: { story: 'One row per prop in `BENCHMARK_COMPARE_VARIANTS`, one labelled table per value, over the first five benchmarks of the suite.' } } },
};

/** A whole benchmark report, composed from the review family and the three benchmark views. */
export const BenchmarkReport: Story = {
  render: () => {
    const regression = PARQUET_COMPARISONS[0]!;
    return (
      <article className="flex max-w-5xl flex-col gap-6">
        <VerdictBand outcome="none" title="Delta only. One benchmark is slower beyond the 5% noise band; four cannot be called.">
          No benchmark policy was supplied, so nothing below is a pass or a fail.
        </VerdictBand>
        <ProvenanceStrip
          items={[
            { label: 'Subject', value: 'Parquet.Benchmarks' },
            { label: 'Baseline', value: 'main@ad61c03', note: 'merge-base' },
            { label: 'Candidate', value: 'PR 212 at f00dcaf' },
            { label: 'Trust', value: <StatusMark vocabulary="trust" status="trusted" /> },
            { label: 'Comparator', value: 'benchmark-distribution@1 · bootstrap 2000 · 95%' },
          ]}
        />
        <BenchmarkCompare comparisons={PARQUET_COMPARISONS} caption="Parquet.Benchmarks · median ns/op" />
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <DistributionCompare title={regression.name} baseline={PARQUET_BENCHMARKS[0]!.baseline!} candidate={PARQUET_BENCHMARKS[0]!.candidate!} unit="ns" comparison={regression} />
          <DistributionCompare title={BIMODAL_CASE.name} baseline={BIMODAL_CASE.baseline!} candidate={BIMODAL_CASE.candidate!} unit="ns" comparison={PARQUET_COMPARISONS[4]} />
        </section>
        <BenchmarkTrend title={`${regression.name} along main`} points={SERIALIZE_HISTORY} candidate={SERIALIZE_CANDIDATE} unit="ns" threshold={0.05} />
      </article>
    );
  },
  parameters: { layout: 'padded', docs: { description: { story: 'What a Diffra benchmark report could look like: no verdict without a policy, provenance, the suite by impact, the two distributions worth looking at, and the regression in its history. Static throughout — every part renders with no script.' } } },
};
