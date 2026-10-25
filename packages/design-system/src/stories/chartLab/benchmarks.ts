/**
 * Deterministic benchmark fixtures: a Parquet serializer suite, baseline vs
 * candidate, in nanoseconds per operation, plus its history along main.
 *
 * Every sample comes from the seeded `mulberry32`, so stories, tests and
 * snapshots see the same numbers on every render.
 */
import {
  compareBenchmarks,
  fromBenchmarkDotNet,
  mulberry32,
  pairBenchmarkRuns,
  type BenchmarkDotNetReport,
  type BenchmarkInput,
} from '../../lib/benchmark';
import type { BenchmarkTrendPoint } from '../../components/BenchmarkTrend';

/** Log-normal samples around `median`, `spread` the sigma of the log. Box–Muller over the seeded PRNG. */
function logNormal(random: () => number, count: number, median: number, spread: number): number[] {
  return Array.from({ length: count }, () => {
    const u = Math.max(1e-12, random());
    const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
    return median * Math.exp(spread * z);
  });
}

function samples(seed: number, count: number, median: number, spread = 0.025): number[] {
  return logNormal(mulberry32(seed), count, median, spread);
}

/** A run that alternates between two modes — tiered JIT promotion halfway through the iterations. */
function bimodal(seed: number, count: number, fast: number, slow: number, slowShare: number): number[] {
  const random = mulberry32(seed);
  const slowCount = Math.round(count * slowShare);
  return [...logNormal(random, count - slowCount, fast, 0.02), ...logNormal(random, slowCount, slow, 0.02)];
}

/** The suite: one clear regression, one improvement, noise, n = 3, a bimodal run, a straddler, a throughput metric and a removed case. */
export const PARQUET_BENCHMARKS: readonly BenchmarkInput[] = [
  { name: 'ParquetSerializer.Serialize(Rows=10000)', unit: 'ns', direction: 'lower-is-better', baseline: samples(101, 30, 1_842_000), candidate: samples(102, 30, 2_171_000) },
  { name: 'ParquetSerializer.Deserialize(Rows=10000)', unit: 'ns', direction: 'lower-is-better', baseline: samples(103, 30, 2_604_000), candidate: samples(104, 30, 2_031_000) },
  { name: 'ParquetWriter.WriteColumn(Type=Int32)', unit: 'ns', direction: 'lower-is-better', baseline: samples(105, 30, 412_300, 0.02), candidate: samples(106, 30, 413_100, 0.02) },
  { name: 'ParquetReader.ReadFooter', unit: 'ns', direction: 'lower-is-better', baseline: samples(107, 3, 18_420, 0.04), candidate: samples(108, 3, 21_050, 0.04) },
  { name: 'ParquetSerializer.Serialize(Rows=100)', unit: 'ns', direction: 'lower-is-better', baseline: samples(109, 40, 41_800, 0.02), candidate: bimodal(110, 40, 41_600, 57_900, 0.4) },
  { name: 'Snappy.Compress(Size=64K)', unit: 'ns', direction: 'lower-is-better', baseline: samples(111, 15, 96_400, 0.06), candidate: samples(112, 15, 100_300, 0.06) },
  { name: 'RowGroup.Throughput', unit: 'rows/s', direction: 'higher-is-better', baseline: samples(113, 20, 1_212_000, 0.03), candidate: samples(114, 20, 1_398_000, 0.03) },
  { name: 'ParquetSerializer.SerializeLegacy', unit: 'ns', direction: 'lower-is-better', baseline: samples(115, 30, 3_120_000), candidate: null },
];

/** The suite compared with the defaults: ±5% noise, 95% bootstrap intervals, at least 5 samples a side. */
export const PARQUET_COMPARISONS = compareBenchmarks(PARQUET_BENCHMARKS);

/** The bimodal case, on its own. */
export const BIMODAL_CASE = PARQUET_BENCHMARKS[4]!;
/** The clear regression, on its own. */
export const REGRESSION_CASE = PARQUET_BENCHMARKS[0]!;
/** The n = 3 case, on its own. */
export const SMALL_CASE = PARQUET_BENCHMARKS[3]!;
/** The noise-only case, on its own. */
export const NOISE_CASE = PARQUET_BENCHMARKS[2]!;

/** A BenchmarkDotNet full JSON export for one side, built from per-op samples as the harness would record them. */
function benchmarkDotNetReport(side: 'baseline' | 'candidate'): BenchmarkDotNetReport {
  return {
    Title: `Parquet.Benchmarks.SerializerBenchmarks-${side}`,
    Benchmarks: PARQUET_BENCHMARKS.filter((b) => b.unit === 'ns' && b[side]).map((b) => {
      const [type, rest] = b.name.split('.') as [string, string];
      const [method, parameters = ''] = rest.replace(')', '').split('(') as [string, string?];
      const operations = 1024;
      return {
        FullName: `Parquet.Benchmarks.${type}.${method}`,
        Namespace: 'Parquet.Benchmarks',
        Type: type,
        Method: method,
        MethodTitle: method,
        Parameters: parameters,
        Statistics: null,
        Measurements: [
          { IterationMode: 'Overhead', IterationStage: 'Actual', Operations: operations, Nanoseconds: 2_048 },
          ...b[side]!.map((value, index) => ({ IterationMode: 'Workload', IterationStage: 'Result', LaunchIndex: 1, IterationIndex: index + 1, Operations: operations, Nanoseconds: value * operations })),
        ],
      };
    }),
  };
}

/** The same suite as two BenchmarkDotNet exports, decoded and paired — what a .NET repo's CI hands over. */
export const BENCHMARKDOTNET_INPUTS = pairBenchmarkRuns(fromBenchmarkDotNet(benchmarkDotNetReport('baseline')), fromBenchmarkDotNet(benchmarkDotNetReport('candidate')));

const HISTORY_COMMITS = [
  '3a1f9c8', 'b72e014', '9c0d3e1', '51aa7f2', 'e09b6c4', '7d2c1a9', 'c4f8e37', '0b6a2d5', 'f1e9c40', '28d7b1e',
  'a93c5f6', '6e04d8b', 'd5b1f23', '41c9e7a', '8f2a06d', 'bc7e391', '12d4a8f', 'e6f0b52', '93a7c1d', '5c18e9b',
  '7fa2d34', 'c0e5b68', '2b9d4f7', 'ad61c03',
];

/**
 * `Serialize(Rows=10000)` along main: steady around 2.0 ms, a 9% improvement
 * landing at the tenth commit, tags at v5.0.0 and v5.1.0.
 */
export const SERIALIZE_HISTORY: readonly BenchmarkTrendPoint[] = HISTORY_COMMITS.map((commit, index) => {
  const random = mulberry32(500 + index);
  const level = index < 10 ? 2_020_000 : 1_842_000;
  // The last commit is the merge-base, so it carries the suite's own baseline median.
  const value = index === HISTORY_COMMITS.length - 1 ? PARQUET_COMPARISONS[0]!.baseline!.median : level * (1 + (random() - 0.5) * 0.03);
  const width = value * (0.012 + random() * 0.01);
  const day = String(1 + index).padStart(2, '0');
  return {
    commit: `${commit}${'0'.repeat(33)}`,
    timestamp: `2026-09-${day}T14:30:00Z`,
    tag: index === 6 ? 'v5.0.0' : index === 17 ? 'v5.1.0' : undefined,
    value,
    low: value - width,
    high: value + width,
  };
});

/** The candidate for that history: the regression from the suite, +18%. */
export const SERIALIZE_CANDIDATE: BenchmarkTrendPoint = (() => {
  const c = PARQUET_COMPARISONS.find((row) => row.name === REGRESSION_CASE.name)!;
  const median = c.candidate!.median;
  return { commit: 'f00dcafe1234567890abcdef1234567890abcdef', timestamp: '2026-09-25T09:12:00Z', value: median, low: median * 0.985, high: median * 1.015 };
})();
