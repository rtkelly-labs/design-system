import { describe, expect, it } from 'vitest';
import {
  benchmarkDisplayUnit,
  bootstrapRatioInterval,
  classifyInterval,
  compareBenchmark,
  formatBenchmarkValue,
  formatPercent,
  formatRatio,
  formatRatioChange,
  fromBenchmarkDotNet,
  kernelDensity,
  mannWhitneyRatioInterval,
  median,
  medianInterval,
  mulberry32,
  noiseBand,
  normalQuantile,
  pairBenchmarkRuns,
  sortByImpact,
  summarize,
  type BenchmarkDotNetReport,
} from './benchmark';

/** `count` samples around `centre` with ±`spread` relative jitter, seeded. */
function around(seed: number, count: number, centre: number, spread = 0.02): number[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => centre * (1 + (random() * 2 - 1) * spread));
}

describe('summarize', () => {
  it('reports n, mean, median, sample stddev, extremes, p95 and MAD', () => {
    const s = summarize([1, 2, 3, 4, 100, Number.NaN]);
    expect(s.n).toBe(5);
    expect(s.mean).toBe(22);
    expect(s.median).toBe(3);
    expect(s.min).toBe(1);
    expect(s.max).toBe(100);
    expect(s.stddev).toBeCloseTo(Math.sqrt((21 ** 2 + 20 ** 2 + 19 ** 2 + 18 ** 2 + 78 ** 2) / 4), 9);
    expect(s.p95).toBeCloseTo(80.8, 9);
    // |x − 3| = 2,1,0,1,97 → median 1.
    expect(s.mad).toBe(1);
  });

  it('is NaN throughout for no samples, and has zero spread for one', () => {
    expect(Number.isNaN(summarize([]).median)).toBe(true);
    expect(summarize([]).n).toBe(0);
    expect(summarize([7]).stddev).toBe(0);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});

describe('normalQuantile', () => {
  it('matches the familiar critical values', () => {
    expect(normalQuantile(0.975)).toBeCloseTo(1.959964, 5);
    expect(normalQuantile(0.995)).toBeCloseTo(2.575829, 5);
    expect(normalQuantile(0.5)).toBeCloseTo(0, 9);
    expect(normalQuantile(0.001)).toBeCloseTo(-3.090232, 5);
  });
});

describe('medianInterval', () => {
  it('picks the order statistics whose binomial coverage reaches the level', () => {
    const samples = Array.from({ length: 20 }, (_, i) => i + 1);
    // n = 20 at 95%: k = 6, coverage 1 − 2·P(B ≤ 5) ≈ 0.9586.
    const interval = medianInterval(samples, 0.95)!;
    expect(interval.low).toBe(6);
    expect(interval.high).toBe(15);
    expect(interval.level).toBeCloseTo(0.9586, 4);
  });

  it('falls back to [min, max] and says what coverage it has when n is small', () => {
    const interval = medianInterval([3, 1, 2], 0.95)!;
    expect(interval).toEqual({ low: 1, high: 3, level: 0.75 });
    expect(medianInterval([1])).toBeNull();
  });
});

describe('ratio intervals', () => {
  const baseline = around(1, 30, 100);
  const slower = around(2, 30, 120);

  it('bootstrap is deterministic for a seed and brackets the ratio of medians', () => {
    const a = bootstrapRatioInterval(baseline, slower)!;
    const b = bootstrapRatioInterval(baseline, slower)!;
    expect(a).toEqual(b);
    expect(a.method).toBe('bootstrap');
    expect(a.estimate).toBeCloseTo(median(slower) / median(baseline), 12);
    expect(a.low).toBeLessThanOrEqual(a.estimate);
    expect(a.high).toBeGreaterThanOrEqual(a.estimate);
    expect(a.low).toBeGreaterThan(1.1);
    expect(a.high).toBeLessThan(1.3);
    expect(bootstrapRatioInterval(baseline, slower, { seed: 99 })).not.toEqual(a);
  });

  it('Mann–Whitney agrees with the bootstrap on a clean shift', () => {
    const mw = mannWhitneyRatioInterval(baseline, slower)!;
    expect(mw.method).toBe('mann-whitney');
    expect(mw.estimate).toBeGreaterThan(1.15);
    expect(mw.estimate).toBeLessThan(1.25);
    expect(mw.low).toBeLessThan(mw.estimate);
    expect(mw.high).toBeGreaterThan(mw.estimate);
  });

  it('Mann–Whitney has no interval for tiny samples or non-positive values', () => {
    expect(mannWhitneyRatioInterval([1, 2], [1, 2])).toBeNull();
    expect(mannWhitneyRatioInterval([0, 1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6])).toBeNull();
  });
});

describe('classification', () => {
  const band = noiseBand(0.05);

  it('builds a log-symmetric band', () => {
    expect(band.high).toBeCloseTo(1.05, 12);
    expect(band.low).toBeCloseTo(1 / 1.05, 12);
  });

  it('reads the interval against the band and the direction', () => {
    expect(classifyInterval({ low: 0.98, high: 1.03 }, band, 'lower-is-better').classification).toBe('unchanged');
    expect(classifyInterval({ low: 1.1, high: 1.2 }, band, 'lower-is-better').classification).toBe('slower');
    expect(classifyInterval({ low: 1.1, high: 1.2 }, band, 'higher-is-better').classification).toBe('faster');
    expect(classifyInterval({ low: 0.8, high: 0.9 }, band, 'lower-is-better').classification).toBe('faster');
    // Real change of uncertain size: entirely above 1.0, but crossing the band edge.
    expect(classifyInterval({ low: 1.02, high: 1.08 }, band, 'lower-is-better')).toEqual({ classification: 'inconclusive', reason: 'straddles-threshold' });
  });

  it('classifies a regression, an improvement and noise end to end', () => {
    const base = around(10, 30, 1000);
    expect(compareBenchmark({ name: 'a', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: around(11, 30, 1200) }).classification).toBe('slower');
    expect(compareBenchmark({ name: 'b', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: around(12, 30, 800) }).classification).toBe('faster');
    expect(compareBenchmark({ name: 'c', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: around(13, 30, 1003) }).classification).toBe('unchanged');
    expect(compareBenchmark({ name: 'd', unit: 'ops/s', direction: 'higher-is-better', baseline: base, candidate: around(14, 30, 1200) }).classification).toBe('faster');
    expect(compareBenchmark({ name: 'e', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: around(15, 30, 1200) }, { method: 'mann-whitney' }).classification).toBe('slower');
  });

  it('never passes silently', () => {
    const base = around(20, 30, 1000);
    const small = compareBenchmark({ name: 'n3', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: [1500, 1510, 1490] });
    expect(small).toMatchObject({ classification: 'inconclusive', reason: 'too-few-samples' });
    // A small run still draws its (wide) interval.
    expect(small.interval).not.toBeNull();
    expect(compareBenchmark({ name: 'x', unit: 'ns', direction: 'lower-is-better', candidate: base })).toMatchObject({ classification: 'inconclusive', reason: 'missing-baseline' });
    expect(compareBenchmark({ name: 'x', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: [] })).toMatchObject({ reason: 'missing-candidate' });
    expect(compareBenchmark({ name: 'x', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: base.map(() => 0) })).toMatchObject({ reason: 'non-positive-median' });
    const summaryOnly = compareBenchmark({ name: 'x', unit: 'ns', direction: 'lower-is-better', baseline: base, candidateSummary: summarize(base) });
    expect(summaryOnly).toMatchObject({ classification: 'inconclusive', reason: 'no-raw-samples', ratio: 1 });
  });

  it('sorts by impact: regressions, improvements, inconclusive, unchanged — larger first', () => {
    const base = around(30, 30, 1000);
    const rows = [
      compareBenchmark({ name: 'noise', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: around(31, 30, 1001) }),
      compareBenchmark({ name: 'small-regression', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: around(32, 30, 1150) }),
      compareBenchmark({ name: 'n3', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: [900, 950, 1000] }),
      compareBenchmark({ name: 'big-regression', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: around(33, 30, 1600) }),
      compareBenchmark({ name: 'improvement', unit: 'ns', direction: 'lower-is-better', baseline: base, candidate: around(34, 30, 700) }),
    ];
    expect(sortByImpact(rows).map((row) => row.name)).toEqual(['big-regression', 'small-regression', 'improvement', 'n3', 'noise']);
  });
});

describe('formatting', () => {
  it('scales time units and leaves others alone', () => {
    expect(benchmarkDisplayUnit(6715, 'ns')).toEqual({ unit: 'µs', factor: 1000 });
    expect(formatBenchmarkValue(6715.85, 'ns')).toBe('6.72 µs');
    expect(formatBenchmarkValue(1_240_000_000, 'ns')).toBe('1.24 s');
    expect(formatBenchmarkValue(412, 'us')).toBe('412 µs');
    expect(formatBenchmarkValue(0.5, 'ms')).toBe('500 µs');
    expect(formatBenchmarkValue(48_213, 'ops/s')).toBe('48,213 ops/s');
  });

  it('prints ratios and their relative change', () => {
    expect(formatRatio(1.1834)).toBe('1.18×');
    expect(formatRatio(0.9123)).toBe('0.912×');
    expect(formatRatio(null)).toBe('—');
    expect(formatRatioChange(1.18)).toBe('+18.0%');
    expect(formatRatioChange(0.912)).toBe('−8.8%');
    expect(formatRatioChange(1)).toBe('±0.0%');
    expect(formatPercent(0.05)).toBe('5%');
    expect(formatPercent(0.957)).toBe('95.7%');
  });
});

describe('BenchmarkDotNet', () => {
  // The shape of a real `*-report-full.json`, trimmed: one case with Measurements,
  // one with OriginalValues only, one with statistics only.
  const report = (scale: number): BenchmarkDotNetReport => ({
    Title: 'ParquetSerializerBenchmarks',
    Benchmarks: [
      {
        FullName: 'Parquet.Benchmarks.Serializer.Write',
        Type: 'Serializer',
        Method: 'Write',
        MethodTitle: 'Write',
        Parameters: 'Rows=1000',
        Statistics: { N: 3, Min: 0, Max: 0, Mean: 0, Median: 0, StandardDeviation: 0 },
        Measurements: [
          { IterationMode: 'Overhead', IterationStage: 'Actual', Operations: 1024, Nanoseconds: 10_000 },
          { IterationMode: 'Workload', IterationStage: 'Pilot', Operations: 16, Nanoseconds: 99_999 },
          { IterationMode: 'Workload', IterationStage: 'Actual', Operations: 1024, Nanoseconds: 9_999_999 },
          { IterationMode: 'Workload', IterationStage: 'Result', Operations: 1024, Nanoseconds: 1024 * 6000 * scale },
          { IterationMode: 'Workload', IterationStage: 'Result', Operations: 1024, Nanoseconds: 1024 * 6100 * scale },
          { IterationMode: 'Workload', IterationStage: 'Result', Operations: 1024, Nanoseconds: 1024 * 5900 * scale },
        ],
      },
      {
        FullName: 'Parquet.Benchmarks.Serializer.Read',
        Type: 'Serializer',
        MethodTitle: 'Read',
        Statistics: { OriginalValues: [10, 11, 12], N: 3, Min: 10, Max: 12, Mean: 11, Median: 11, StandardDeviation: 1 },
      },
      {
        FullName: 'Parquet.Benchmarks.Serializer.Schema',
        Type: 'Serializer',
        MethodTitle: 'Schema',
        Statistics: { N: 15, Min: 1, Max: 3, Mean: 2, Median: 2, StandardDeviation: 0.5, Percentiles: { P95: 2.9 } },
      },
    ],
  });

  it('takes Workload/Result measurements per operation, then OriginalValues, then statistics', () => {
    const [write, read, schema] = fromBenchmarkDotNet(report(1));
    expect(write).toMatchObject({ id: 'Parquet.Benchmarks.Serializer.Write(Rows=1000)', name: 'Serializer.Write(Rows=1000)', unit: 'ns', direction: 'lower-is-better', source: 'measurements' });
    expect(write!.samples).toEqual([6000, 6100, 5900]);
    expect(read).toMatchObject({ source: 'original-values', samples: [10, 11, 12] });
    expect(schema).toMatchObject({ source: 'statistics', samples: null });
    expect(schema!.summary).toMatchObject({ n: 15, median: 2, p95: 2.9 });
  });

  it('pairs runs by identity, keeping one-sided runs as inconclusive inputs', () => {
    const baseline = fromBenchmarkDotNet(report(1));
    const candidate = fromBenchmarkDotNet(report(1.2)).slice(0, 1);
    const inputs = pairBenchmarkRuns(baseline, candidate);
    expect(inputs).toHaveLength(3);
    expect(inputs[0]!.candidate).toEqual([7200, 7320, 7080]);
    expect(compareBenchmark(inputs[1]!)).toMatchObject({ reason: 'missing-candidate' });
    // n = 3 per side: a 20% shift, still not enough samples to say so.
    expect(compareBenchmark(inputs[0]!)).toMatchObject({ classification: 'inconclusive', reason: 'too-few-samples' });
    expect(compareBenchmark(inputs[0]!, { minSamples: 3 }).ratio).toBeCloseTo(1.2, 12);
  });
});

describe('kernelDensity', () => {
  it('integrates to about one and refuses degenerate input', () => {
    const samples = around(40, 200, 100, 0.1);
    const curve = kernelDensity(samples, 70, 130, 121);
    const step = 60 / 120;
    const area = curve.reduce((sum, point) => sum + point.density * step, 0);
    expect(area).toBeGreaterThan(0.95);
    expect(area).toBeLessThan(1.05);
    expect(kernelDensity([5, 5, 5], 0, 10)).toEqual([]);
    expect(kernelDensity([5], 0, 10)).toEqual([]);
  });

  it('keeps two modes apart rather than smoothing them into one hump', () => {
    const samples = [...around(41, 24, 42, 0.02), ...around(42, 16, 58, 0.02)];
    const curve = kernelDensity(samples, 38, 62, 97);
    const peaks = curve.filter((point, i) => i > 0 && i < curve.length - 1 && point.density > curve[i - 1]!.density && point.density > curve[i + 1]!.density);
    expect(peaks).toHaveLength(2);
  });
});
