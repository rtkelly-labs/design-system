/**
 * Benchmarks with repeated samples: summaries, an interval for the change,
 * and a classification that refuses to guess.
 *
 * ## What is compared
 *
 * The **ratio of medians**, candidate over baseline. Medians, because
 * benchmark timings are skewed and carry outliers (a GC pause, a context
 * switch) that drag a mean; a ratio, because "18% slower" means the same for a
 * 40ns method and a 4s one. A ratio is asymmetric in its own units — 0.5× and
 * 2× are the same size of change — so intervals and bands are reasoned about on
 * the log scale.
 *
 * ## The interval
 *
 * Two methods, both deterministic:
 *
 * - `bootstrap` (default): percentile bootstrap of the ratio of medians, each
 *   side resampled with replacement from a seeded PRNG (`mulberry32`). The same
 *   samples and seed always give the same interval.
 * - `mann-whitney`: the Hodges–Lehmann shift on log values with its
 *   distribution-free Mann–Whitney confidence interval. It estimates the median
 *   of the pairwise ratios rather than the ratio of medians — close, and equal
 *   for a pure scale shift — and needs no randomness at all. It costs `n × m`
 *   pairs, so it suits the tens of iterations a benchmark harness records, not
 *   tens of thousands.
 *
 * ## The classification
 *
 * Against a **noise band** `[1 / (1 + t), 1 + t]` around 1.0 — log-symmetric,
 * so a 5% threshold reads the same in both directions:
 *
 * | The interval is… | Classification |
 * |---|---|
 * | from too few samples on either side (`minSamples`) | `inconclusive` |
 * | entirely inside the band | `unchanged` |
 * | entirely above the band | `slower` for lower-is-better, `faster` for higher-is-better |
 * | entirely below the band | the other one |
 * | anything else — it crosses a band edge | `inconclusive` |
 *
 * That last row is deliberate and stricter than "the interval excludes 1.0":
 * an interval of `[1.02×, 1.08×]` under a 5% threshold is real change of
 * uncertain size, and the honest answer is that the run cannot say whether it
 * matters. A comparison never passes silently — a missing side, summary-only
 * input or a non-positive median each say so in `reason`.
 *
 * Everything here is pure: no clock, no DOM, no React.
 */

import type { MetricDirection } from '../components/review/DeltaValue';
import { percentile } from './latency';

/** Which way a benchmark is preferred to move. The same words a numeric Delta uses. */
export type BenchmarkDirection = MetricDirection;

/** Every classification, in impact order: what a reader should look at first. */
export const BENCHMARK_CLASSIFICATIONS = ['slower', 'faster', 'inconclusive', 'unchanged'] as const;

/** What a comparison concluded about one benchmark. */
export type BenchmarkClassification = (typeof BENCHMARK_CLASSIFICATIONS)[number];

/** Why a comparison is `inconclusive`. */
export type BenchmarkInconclusiveReason =
  | 'missing-baseline'
  | 'missing-candidate'
  | 'no-raw-samples'
  | 'too-few-samples'
  | 'non-positive-median'
  | 'straddles-threshold';

/** The interval methods `compareBenchmark` offers, first the default. */
export const BENCHMARK_INTERVAL_METHODS = ['bootstrap', 'mann-whitney'] as const;

/** How the interval for the change was computed. */
export type BenchmarkIntervalMethod = (typeof BENCHMARK_INTERVAL_METHODS)[number];

/** Descriptive statistics of one side's samples. Every field is `NaN` when `n` is 0. */
export interface SampleSummary {
  /** Finite samples counted. */
  n: number;
  mean: number;
  median: number;
  /** Sample standard deviation (`n − 1`); 0 for a single sample. */
  stddev: number;
  min: number;
  max: number;
  /** 95th percentile, linearly interpolated (as `latency.percentile`). */
  p95: number;
  /** Median absolute deviation from the median, unscaled (multiply by 1.4826 for a normal-consistent σ). */
  mad: number;
}

/** A confidence interval for a ratio, candidate over baseline. */
export interface RatioInterval {
  /** The ratio's point estimate. */
  estimate: number;
  low: number;
  high: number;
  /** Coverage the interval was built for, 0–1. */
  level: number;
  method: BenchmarkIntervalMethod;
}

/** One benchmark's repeated samples on each side. */
export interface BenchmarkInput {
  /** Stable identity; defaults to `name`. */
  id?: string;
  /** What the benchmark is called on the page. */
  name: string;
  /** The samples' unit, e.g. `ns`, `ms` or `ops/s`. Time units scale when formatted. */
  unit: string;
  /** Whether a smaller or a larger value is better. Required: a benchmark always has one. */
  direction: BenchmarkDirection;
  /** The baseline's samples. `null` or omitted when the baseline has no run of this benchmark. */
  baseline?: readonly number[] | null;
  /** The candidate's samples. `null` or omitted when the candidate has no run of this benchmark. */
  candidate?: readonly number[] | null;
  /** A summary to use when the baseline's raw samples are not available. Such a comparison is always inconclusive. */
  baselineSummary?: SampleSummary | null;
  /** A summary to use when the candidate's raw samples are not available. Such a comparison is always inconclusive. */
  candidateSummary?: SampleSummary | null;
}

/** Knobs for `compareBenchmark`. */
export interface BenchmarkCompareOptions {
  /** Relative change treated as noise, e.g. `0.05` for ±5%. Default 0.05. */
  threshold?: number;
  /** Interval coverage, 0–1. Default 0.95. */
  level?: number;
  /** Fewest samples on each side for a conclusive answer. Default 5. */
  minSamples?: number;
  /** Interval method. Default `bootstrap`. */
  method?: BenchmarkIntervalMethod;
  /** Bootstrap resamples. Default 2000. */
  resamples?: number;
  /** Bootstrap seed. Default fixed, so a report is reproducible. */
  seed?: number;
}

/** The comparison of one benchmark. */
export interface BenchmarkComparison {
  id: string;
  name: string;
  unit: string;
  direction: BenchmarkDirection;
  baseline: SampleSummary | null;
  candidate: SampleSummary | null;
  /** Candidate median over baseline median; `null` when either is missing or not positive. */
  ratio: number | null;
  /** The interval for the ratio; `null` when it cannot be computed. */
  interval: RatioInterval | null;
  /** The noise band the interval was judged against. */
  band: { low: number; high: number };
  /** The threshold the band was built from. */
  threshold: number;
  classification: BenchmarkClassification;
  /** Why, when `classification` is `inconclusive`. */
  reason?: BenchmarkInconclusiveReason;
}

const DEFAULTS = { threshold: 0.05, level: 0.95, minSamples: 5, method: 'bootstrap', resamples: 2000, seed: 0x5eed } as const;

const finite = (value: number) => typeof value === 'number' && Number.isFinite(value);

/** A seeded PRNG (mulberry32): uniform in `[0, 1)`, the same sequence for the same seed. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sortedFinite(samples: readonly number[]): number[] {
  return samples.filter(finite).sort((a, b) => a - b);
}

/** Median of an ascending array. */
function medianOfSorted(ordered: ArrayLike<number>): number {
  const n = ordered.length;
  if (!n) return Number.NaN;
  const mid = n >> 1;
  return n % 2 ? ordered[mid]! : (ordered[mid - 1]! + ordered[mid]!) / 2;
}

/** The median of the finite samples; `NaN` when there are none. */
export function median(samples: readonly number[]): number {
  return medianOfSorted(sortedFinite(samples));
}

/** n, mean, median, standard deviation, min, max, p95 and MAD of the finite samples. */
export function summarize(samples: readonly number[]): SampleSummary {
  const ordered = sortedFinite(samples);
  const n = ordered.length;
  if (!n) return { n: 0, mean: Number.NaN, median: Number.NaN, stddev: Number.NaN, min: Number.NaN, max: Number.NaN, p95: Number.NaN, mad: Number.NaN };
  const mean = ordered.reduce((sum, value) => sum + value, 0) / n;
  const variance = n > 1 ? ordered.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (n - 1) : 0;
  const mid = medianOfSorted(ordered);
  const deviations = ordered.map((value) => Math.abs(value - mid)).sort((a, b) => a - b);
  return { n, mean, median: mid, stddev: Math.sqrt(variance), min: ordered[0]!, max: ordered[n - 1]!, p95: percentile(ordered, 95), mad: medianOfSorted(deviations) };
}

/**
 * The standard normal quantile (Acklam's rational approximation, relative
 * error below 1.2e-9). `p` in `(0, 1)`.
 */
export function normalQuantile(p: number): number {
  if (!(p > 0 && p < 1)) return p === 0 ? -Infinity : p === 1 ? Infinity : Number.NaN;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;
  if (p < low || p > 1 - low) {
    const q = Math.sqrt(-2 * Math.log(p < low ? p : 1 - p));
    const x = (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) / ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
    return p < low ? x : -x;
  }
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) / (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
}

/**
 * A distribution-free interval for one side's median, from its order
 * statistics: `[x(k), x(n−k+1)]` with the largest `k` whose binomial coverage
 * is at least `level`. With few samples no `k` reaches it; the interval is
 * then `[min, max]` and `level` reports the coverage it actually has — five
 * samples can promise 93.75%, not 95%.
 */
export function medianInterval(samples: readonly number[], level: number = DEFAULTS.level): { low: number; high: number; level: number } | null {
  const ordered = sortedFinite(samples);
  const n = ordered.length;
  if (n < 2) return null;
  // P(B <= j) for B ~ Binomial(n, 1/2), in log space so a large n does not underflow.
  let logPmf = -n * Math.LN2; // P(B = 0)
  let cdf = Math.exp(logPmf);
  let best = { k: 1, coverage: 1 - 2 * cdf };
  for (let j = 1; j < n / 2; j += 1) {
    logPmf += Math.log((n - j + 1) / j);
    cdf += Math.exp(logPmf);
    const coverage = 1 - 2 * cdf; // interval [x(j+1), x(n-j)]
    if (coverage < level) break;
    best = { k: j + 1, coverage };
  }
  return { low: ordered[best.k - 1]!, high: ordered[n - best.k]!, level: best.coverage };
}

/**
 * Percentile-bootstrap interval for the ratio of medians, candidate over
 * baseline. Deterministic for a given `seed`. `null` when either side is empty
 * or either median is not positive.
 */
export function bootstrapRatioInterval(
  baseline: readonly number[],
  candidate: readonly number[],
  { level = DEFAULTS.level, resamples = DEFAULTS.resamples, seed = DEFAULTS.seed }: { level?: number; resamples?: number; seed?: number } = {},
): RatioInterval | null {
  const base = sortedFinite(baseline);
  const cand = sortedFinite(candidate);
  const estimate = medianOfSorted(cand) / medianOfSorted(base);
  if (!base.length || !cand.length || !(medianOfSorted(base) > 0) || !(medianOfSorted(cand) > 0)) return null;
  const random = mulberry32(seed);
  const count = Math.max(1, Math.floor(resamples));
  const ratios = new Float64Array(count);
  const bufferA = new Float64Array(base.length);
  const bufferB = new Float64Array(cand.length);
  for (let r = 0; r < count; r += 1) {
    for (let i = 0; i < base.length; i += 1) bufferA[i] = base[Math.floor(random() * base.length)]!;
    for (let i = 0; i < cand.length; i += 1) bufferB[i] = cand[Math.floor(random() * cand.length)]!;
    bufferA.sort();
    bufferB.sort();
    ratios[r] = medianOfSorted(bufferB) / medianOfSorted(bufferA);
  }
  ratios.sort();
  const tail = ((1 - level) / 2) * 100;
  const list = Array.from(ratios);
  return { estimate, low: percentile(list, tail), high: percentile(list, 100 - tail), level, method: 'bootstrap' };
}

/**
 * Hodges–Lehmann ratio with its Mann–Whitney interval, on log values: the
 * median of every pairwise `candidate / baseline`, bracketed by the order
 * statistics of those ratios the rank-sum test's normal approximation picks.
 * `null` when a side is empty, a sample is not positive, or the samples are
 * too few for any interval at `level`.
 */
export function mannWhitneyRatioInterval(baseline: readonly number[], candidate: readonly number[], { level = DEFAULTS.level }: { level?: number } = {}): RatioInterval | null {
  const base = sortedFinite(baseline);
  const cand = sortedFinite(candidate);
  const m = base.length;
  const n = cand.length;
  if (!m || !n || base[0]! <= 0 || cand[0]! <= 0) return null;
  const logBase = base.map(Math.log);
  const logCand = cand.map(Math.log);
  const diffs = new Float64Array(m * n);
  let k = 0;
  for (const y of logCand) for (const x of logBase) diffs[k++] = y - x;
  diffs.sort();
  const z = normalQuantile(1 - (1 - level) / 2);
  const c = Math.floor((m * n) / 2 - z * Math.sqrt((m * n * (m + n + 1)) / 12));
  if (c < 1) return null;
  return { estimate: Math.exp(medianOfSorted(diffs)), low: Math.exp(diffs[c - 1]!), high: Math.exp(diffs[m * n - c]!), level, method: 'mann-whitney' };
}

/** The log-symmetric noise band `[1 / (1 + t), 1 + t]` for a threshold `t`. */
export function noiseBand(threshold: number): { low: number; high: number } {
  const t = finite(threshold) && threshold > 0 ? threshold : 0;
  return { low: 1 / (1 + t), high: 1 + t };
}

/**
 * Classify an interval against a noise band. Above the band is `slower` for a
 * lower-is-better benchmark and `faster` for a higher-is-better one.
 */
export function classifyInterval(
  interval: { low: number; high: number },
  band: { low: number; high: number },
  direction: BenchmarkDirection,
): { classification: BenchmarkClassification; reason?: BenchmarkInconclusiveReason } {
  if (interval.low >= band.low && interval.high <= band.high) return { classification: 'unchanged' };
  const up = direction === 'lower-is-better' ? 'slower' : 'faster';
  const down = direction === 'lower-is-better' ? 'faster' : 'slower';
  if (interval.low > band.high) return { classification: up };
  if (interval.high < band.low) return { classification: down };
  return { classification: 'inconclusive', reason: 'straddles-threshold' };
}

/** Compare one benchmark's baseline and candidate samples. See the module header for the rules. */
export function compareBenchmark(input: BenchmarkInput, options: BenchmarkCompareOptions = {}): BenchmarkComparison {
  const { threshold, level, minSamples, method, resamples, seed } = { ...DEFAULTS, ...options };
  const band = noiseBand(threshold);
  const baseRaw = input.baseline ?? null;
  const candRaw = input.candidate ?? null;
  const baseline = baseRaw ? summarize(baseRaw) : (input.baselineSummary ?? null);
  const candidate = candRaw ? summarize(candRaw) : (input.candidateSummary ?? null);
  const ratio = baseline && candidate && baseline.median > 0 && candidate.median > 0 ? candidate.median / baseline.median : null;
  const base = { id: input.id ?? input.name, name: input.name, unit: input.unit, direction: input.direction, baseline, candidate, ratio, band, threshold };
  const inconclusive = (reason: BenchmarkInconclusiveReason, interval: RatioInterval | null = null): BenchmarkComparison => ({ ...base, interval, classification: 'inconclusive', reason });

  if (!baseline || !baseline.n) return inconclusive('missing-baseline');
  if (!candidate || !candidate.n) return inconclusive('missing-candidate');
  if (!baseRaw || !candRaw) return inconclusive('no-raw-samples');
  if (ratio === null) return inconclusive('non-positive-median');
  const interval = method === 'mann-whitney' ? mannWhitneyRatioInterval(baseRaw, candRaw, { level }) : bootstrapRatioInterval(baseRaw, candRaw, { level, resamples, seed });
  // Still draw the interval a small run has: a wide whisker is the point.
  if (baseline.n < minSamples || candidate.n < minSamples || !interval) return inconclusive('too-few-samples', interval);
  return { ...base, interval, ...classifyInterval(interval, band, input.direction) };
}

/** Compare every benchmark with the same options. */
export function compareBenchmarks(inputs: readonly BenchmarkInput[], options: BenchmarkCompareOptions = {}): BenchmarkComparison[] {
  return inputs.map((input) => compareBenchmark(input, options));
}

/**
 * How much a comparison should draw the eye, for sorting: classification first
 * (`slower`, `faster`, `inconclusive`, `unchanged`), then the size of the
 * change on the log scale. Larger is more urgent.
 */
export function benchmarkImpact(comparison: BenchmarkComparison): number {
  const rank = BENCHMARK_CLASSIFICATIONS.length - BENCHMARK_CLASSIFICATIONS.indexOf(comparison.classification);
  const size = comparison.ratio !== null ? Math.min(Math.abs(Math.log(comparison.ratio)), 9.99) : 0;
  return rank * 10 + size;
}

/** The comparisons ordered by `benchmarkImpact`, most urgent first; ties keep their input order. */
export function sortByImpact(comparisons: readonly BenchmarkComparison[]): BenchmarkComparison[] {
  return comparisons.map((comparison, index) => ({ comparison, index, impact: benchmarkImpact(comparison) }))
    .sort((a, b) => b.impact - a.impact || a.index - b.index)
    .map((entry) => entry.comparison);
}

/** A sentence a screen reader, a summary line or a tooltip can use for `reason`. */
export const INCONCLUSIVE_REASON_TEXT: Readonly<Record<BenchmarkInconclusiveReason, string>> = {
  'missing-baseline': 'no baseline run',
  'missing-candidate': 'no candidate run',
  'no-raw-samples': 'summary only, no samples to compare',
  'too-few-samples': 'too few samples',
  'non-positive-median': 'a median is zero or negative',
  'straddles-threshold': 'the interval crosses the noise threshold',
};

// ── Formatting ────────────────────────────────────────────────────────────────

const TIME_UNITS: ReadonlyArray<{ unit: string; ns: number }> = [
  { unit: 'ns', ns: 1 },
  { unit: 'µs', ns: 1e3 },
  { unit: 'ms', ns: 1e6 },
  { unit: 's', ns: 1e9 },
];
const TIME_ALIASES: Readonly<Record<string, string>> = { ns: 'ns', us: 'µs', 'µs': 'µs', μs: 'µs', ms: 'ms', s: 's' };

/**
 * The unit to print a value in, and the factor to divide by. A time unit scales
 * to the largest unit the value is at least 1 of (`6715 ns` prints as µs);
 * anything else is returned unchanged with factor 1.
 */
export function benchmarkDisplayUnit(value: number, unit: string): { unit: string; factor: number } {
  const canonical = TIME_ALIASES[unit];
  if (!canonical || !finite(value)) return { unit, factor: 1 };
  const own = TIME_UNITS.find((entry) => entry.unit === canonical)!;
  const ns = Math.abs(value) * own.ns;
  let pick = TIME_UNITS[0]!;
  for (const entry of TIME_UNITS) if (ns >= entry.ns) pick = entry;
  return { unit: pick.unit, factor: pick.ns / own.ns };
}

/** Three significant figures, grouped by hand so a server render and a browser agree. */
export function formatSignificant(value: number): string {
  if (!finite(value)) return '—';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 2 : Math.min(6, 2 - Math.floor(Math.log10(abs)));
  const [whole, fraction] = abs.toFixed(digits).split('.');
  const grouped = whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${value < 0 ? '−' : ''}${grouped}${fraction ? `.${fraction}` : ''}`;
}

/** `6.72 µs`, `1.24 s`, `48,200 ops/s`: a value in its unit, a time unit scaled to fit. */
export function formatBenchmarkValue(value: number, unit: string): string {
  if (!finite(value)) return '—';
  const display = benchmarkDisplayUnit(value, unit);
  return `${formatSignificant(value / display.factor)} ${display.unit}`;
}

/** `5%`, `95%`, `95.7%`: a 0–1 share to three significant figures, trailing zeros dropped. */
export function formatPercent(share: number): string {
  if (!finite(share)) return '—';
  return `${Number.parseFloat((share * 100).toPrecision(3))}%`;
}

/** `1.18×`, `0.912×`. */
export function formatRatio(ratio: number | null): string {
  if (ratio === null || !finite(ratio)) return '—';
  return `${ratio >= 10 ? ratio.toFixed(1) : ratio >= 1 ? ratio.toFixed(2) : ratio.toFixed(3)}×`;
}

/** `+18.0%`, `−8.8%`: a ratio as a signed relative change. */
export function formatRatioChange(ratio: number | null): string {
  if (ratio === null || !finite(ratio)) return '—';
  const percent = (ratio - 1) * 100;
  const text = Math.abs(percent).toFixed(1);
  return text === '0.0' ? '±0.0%' : `${percent > 0 ? '+' : '−'}${text}%`;
}

// ── BenchmarkDotNet ───────────────────────────────────────────────────────────

/** One measured iteration in a BenchmarkDotNet full JSON export. */
export interface BenchmarkDotNetMeasurement {
  IterationMode: string;
  IterationStage: string;
  LaunchIndex?: number;
  IterationIndex?: number;
  Operations: number;
  Nanoseconds: number;
}

/** The parts of a BenchmarkDotNet `Statistics` block read here. Times are nanoseconds per operation. */
export interface BenchmarkDotNetStatistics {
  OriginalValues?: number[];
  N: number;
  Min: number;
  Max: number;
  Mean: number;
  Median: number;
  StandardDeviation: number;
  Percentiles?: { P95?: number };
}

/** One benchmark case in a BenchmarkDotNet JSON export. */
export interface BenchmarkDotNetBenchmark {
  FullName?: string;
  Namespace?: string;
  Type?: string;
  Method?: string;
  MethodTitle?: string;
  Parameters?: string;
  DisplayInfo?: string;
  Statistics?: BenchmarkDotNetStatistics | null;
  Measurements?: BenchmarkDotNetMeasurement[];
}

/** A BenchmarkDotNet JSON export (`JsonExporter.Full` or the brief one): `*-report-full.json`. */
export interface BenchmarkDotNetReport {
  Title?: string;
  Benchmarks: BenchmarkDotNetBenchmark[];
}

/** One side's run of one benchmark, decoded from a harness export. */
export interface BenchmarkRun {
  id: string;
  name: string;
  unit: string;
  direction: BenchmarkDirection;
  /** Per-operation samples; `null` when the export carried only statistics. */
  samples: number[] | null;
  /** Always present: computed from `samples`, or read from the export's statistics. */
  summary: SampleSummary;
  /** Where the samples came from. */
  source: 'measurements' | 'original-values' | 'statistics';
}

function benchmarkDotNetName(benchmark: BenchmarkDotNetBenchmark): string {
  const method = benchmark.MethodTitle ?? benchmark.Method ?? '?';
  const name = benchmark.Type ? `${benchmark.Type}.${method}` : method;
  return benchmark.Parameters ? `${name}(${benchmark.Parameters})` : name;
}

/**
 * Decode a BenchmarkDotNet JSON export into runs, nanoseconds per operation.
 *
 * Samples are taken from the `Workload` / `Result` measurements (the
 * iterations BenchmarkDotNet reports, after overhead subtraction and outlier
 * removal) as `Nanoseconds / Operations`; failing that from
 * `Statistics.OriginalValues`; failing that the run carries only the export's
 * statistics, and any comparison with it is inconclusive. Identity is
 * `FullName` plus parameters — two runs pair when those match.
 */
export function fromBenchmarkDotNet(report: BenchmarkDotNetReport): BenchmarkRun[] {
  const runs: BenchmarkRun[] = [];
  for (const benchmark of report?.Benchmarks ?? []) {
    const name = benchmarkDotNetName(benchmark);
    const id = benchmark.FullName ? (benchmark.Parameters ? `${benchmark.FullName}(${benchmark.Parameters})` : benchmark.FullName) : name;
    const measured = (benchmark.Measurements ?? [])
      .filter((m) => m.IterationMode === 'Workload' && m.IterationStage === 'Result' && m.Operations > 0)
      .map((m) => m.Nanoseconds / m.Operations);
    const original = benchmark.Statistics?.OriginalValues?.filter(finite) ?? [];
    const samples = measured.length ? measured : original.length ? original : null;
    const stats = benchmark.Statistics;
    if (!samples && !stats) continue;
    const summary: SampleSummary = samples
      ? summarize(samples)
      : { n: stats!.N, mean: stats!.Mean, median: stats!.Median, stddev: stats!.StandardDeviation, min: stats!.Min, max: stats!.Max, p95: stats!.Percentiles?.P95 ?? Number.NaN, mad: Number.NaN };
    runs.push({ id, name, unit: 'ns', direction: 'lower-is-better', samples, summary, source: measured.length ? 'measurements' : original.length ? 'original-values' : 'statistics' });
  }
  return runs;
}

/**
 * Pair two sides' runs by `id` into comparison inputs: baseline order first,
 * then candidate-only runs. A run missing on one side becomes an input with
 * that side `null`, which compares as inconclusive.
 */
export function pairBenchmarkRuns(baseline: readonly BenchmarkRun[], candidate: readonly BenchmarkRun[]): BenchmarkInput[] {
  const byId = new Map(candidate.map((run) => [run.id, run]));
  const seen = new Set<string>();
  const inputs: BenchmarkInput[] = [];
  const toInput = (base: BenchmarkRun | undefined, cand: BenchmarkRun | undefined): BenchmarkInput => {
    const run = (base ?? cand)!;
    return {
      id: run.id,
      name: run.name,
      unit: run.unit,
      direction: run.direction,
      baseline: base?.samples ?? null,
      candidate: cand?.samples ?? null,
      baselineSummary: base?.summary ?? null,
      candidateSummary: cand?.summary ?? null,
    };
  };
  for (const run of baseline) {
    seen.add(run.id);
    inputs.push(toInput(run, byId.get(run.id)));
  }
  for (const run of candidate) if (!seen.has(run.id)) inputs.push(toInput(undefined, run));
  return inputs;
}

// ── Density ───────────────────────────────────────────────────────────────────

/**
 * A Gaussian kernel density estimate at `points` evenly spaced values over
 * `[from, to]`, with Silverman's rule-of-thumb bandwidth (taking the MAD as
 * a third spread, so two modes are not smoothed into one). Densities integrate
 * to about 1. Empty for fewer than two distinct samples — a density drawn from
 * one value is a picture of the kernel, not of the data.
 */
export function kernelDensity(samples: readonly number[], from: number, to: number, points = 64): Array<{ value: number; density: number }> {
  const ordered = sortedFinite(samples);
  const n = ordered.length;
  if (n < 2 || ordered[0] === ordered[n - 1] || !(to > from)) return [];
  const { stddev } = summarize(ordered);
  const iqr = percentile(ordered, 75) - percentile(ordered, 25);
  // Silverman's rule with the MAD as a third, robust spread: a bimodal run's IQR and σ both span
  // the gap between its modes and smooth them into one hump; its MAD stays inside the larger mode.
  const mid = medianOfSorted(ordered);
  const mad = medianOfSorted(ordered.map((value) => Math.abs(value - mid)).sort((a, b) => a - b)) * 1.4826;
  const spread = Math.min(stddev, iqr > 0 ? iqr / 1.34 : stddev, mad > 0 ? mad : stddev);
  const bandwidth = 0.9 * spread * n ** -0.2;
  const norm = 1 / (n * bandwidth * Math.sqrt(2 * Math.PI));
  const count = Math.max(2, Math.floor(points));
  return Array.from({ length: count }, (_, index) => {
    const value = from + ((to - from) * index) / (count - 1);
    let sum = 0;
    for (const sample of ordered) {
      const u = (value - sample) / bandwidth;
      sum += Math.exp(-0.5 * u * u);
    }
    return { value, density: sum * norm };
  });
}
