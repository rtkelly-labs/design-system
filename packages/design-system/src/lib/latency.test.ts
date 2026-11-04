import { describe, expect, it } from 'vitest';
import {
  bucketIndex,
  bucketPercentile,
  formatCount,
  formatLatencyRange,
  formatRequests,
  formatShare,
  heatmapCells,
  histogram,
  intensityLevel,
  intensityThresholds,
  latencyBuckets,
  latencyExtent,
  latencyRowPosition,
  linearBuckets,
  logTicks,
  percentile,
  percentiles,
  shareAbove,
} from './latency';

describe('latencyBuckets', () => {
  it('returns count + 1 increasing, log-spaced edges covering the span', () => {
    const edges = latencyBuckets(10, 1000, 4);
    expect(edges).toHaveLength(5);
    expect(edges[0]).toBeLessThanOrEqual(10);
    expect(edges[4]).toBeGreaterThanOrEqual(1000);
    for (let i = 1; i < edges.length; i += 1) expect(edges[i]).toBeGreaterThan(edges[i - 1]!);
    // Equal ratios, give or take the two-significant-figure rounding.
    expect(edges[2]! / edges[1]!).toBeCloseTo(edges[3]! / edges[2]!, 0);
    expect(edges).toEqual([10, 32, 100, 320, 1000]);
  });

  it('survives a non-positive min, a reversed span and an empty one', () => {
    expect(latencyBuckets(0, 1000, 3)[0]).toBeGreaterThan(0);
    expect(latencyBuckets(1000, 10, 2)).toEqual(latencyBuckets(10, 1000, 2));
    const flat = latencyBuckets(50, 50, 4);
    expect(flat[0]).toBeLessThan(50);
    expect(flat[4]).toBeGreaterThan(50);
  });

  it('linearBuckets are evenly spaced', () => {
    expect(linearBuckets(0, 100, 4)).toEqual([0, 25, 50, 75, 100]);
  });
});

describe('histogram', () => {
  it('counts into [from, to) and clamps outliers into the end buckets', () => {
    const buckets = histogram([1, 5, 10, 15, 20, 25, -3, 99, Number.NaN], [0, 10, 20, 30]);
    expect(buckets.map((bucket) => bucket.count)).toEqual([3, 2, 3]);
    expect(buckets.reduce((sum, bucket) => sum + bucket.count, 0)).toBe(8);
    expect(bucketIndex(30, [0, 10, 20, 30])).toBe(2);
    expect(bucketIndex(1, [0])).toBe(-1);
  });
});

describe('percentile', () => {
  it('interpolates linearly between closest ranks', () => {
    const samples = [1, 2, 3, 4];
    expect(percentile(samples, 0)).toBe(1);
    expect(percentile(samples, 50)).toBe(2.5);
    expect(percentile(samples, 100)).toBe(4);
    expect(percentiles([10, 20, 30, 40, 50], [50, 90, 99])).toEqual([30, 46, 49.6]);
  });

  it('ignores non-finite samples and returns NaN for nothing', () => {
    expect(percentile([Number.NaN, 5, Infinity], 50)).toBe(5);
    expect(percentile([], 50)).toBeNaN();
    expect(percentile([1, 2], Number.NaN)).toBeNaN();
  });

  it('estimates from buckets', () => {
    const buckets = [{ from: 10, to: 20, count: 50 }, { from: 20, to: 40, count: 50 }];
    expect(bucketPercentile(buckets, 50)).toBe(20);
    expect(bucketPercentile(buckets, 100)).toBe(40);
    expect(bucketPercentile([], 50)).toBeNaN();
  });

  it('shareAbove and latencyExtent', () => {
    expect(shareAbove([100, 200, 300, 400], 250)).toBe(0.5);
    expect(shareAbove([], 1)).toBe(0);
    expect(latencyExtent([0, 5, 50, Number.NaN])).toEqual({ min: 5, max: 50 });
    expect(latencyExtent([])).toBeNull();
  });
});

describe('logTicks', () => {
  it('lands on 1-2-5 and thins to the target', () => {
    expect(logTicks(1, 100, 10)).toEqual([1, 2, 5, 10, 20, 50, 100]);
    expect(logTicks(1, 100, 3)).toEqual([1, 10, 100]);
    expect(logTicks(0, 10)).toEqual([]);
  });
});

describe('heatmapCells', () => {
  const buckets = [{ from: 0, to: 10 }, { from: 10, to: 20 }];
  const edges = [1, 10, 100];

  it('places points column-major, drops points outside time, clamps latency', () => {
    const grid = heatmapCells([
      { time: 1, value: 5 }, { time: 2, value: 5 }, { time: 15, value: 50 }, { time: 20, value: 5000 }, { time: 99, value: 5 },
    ], buckets, edges);
    expect(grid).toMatchObject({ columns: 2, rows: 2, max: 2, total: 4 });
    expect(grid.cells.map((cell) => cell.count)).toEqual([2, 0, 0, 2]);
    expect(grid.cells[3]).toMatchObject({ column: 1, row: 1, timeRange: { from: 10, to: 20 }, latencyRange: { from: 10, to: 100 } });
  });

  it('is empty without buckets', () => {
    expect(heatmapCells([{ time: 1, value: 1 }], [], edges)).toMatchObject({ cells: [], total: 0, max: 0 });
  });

  it('positions a latency as a fractional row', () => {
    expect(latencyRowPosition(10, edges)).toBe(1);
    expect(latencyRowPosition(Math.sqrt(10), edges)).toBeCloseTo(0.5);
    expect(latencyRowPosition(1e6, edges)).toBe(2);
  });
});

describe('intensity scales', () => {
  const counts = [0, 1, 2, 4, 9, 16, 36, 100];

  it('sqrt (default), linear and log thresholds ascend from 1', () => {
    for (const scale of ['sqrt', 'linear', 'log'] as const) {
      const thresholds = intensityThresholds(counts, 6, scale);
      expect(thresholds).toHaveLength(6);
      expect(thresholds[0]).toBe(1);
      for (let i = 1; i < thresholds.length; i += 1) expect(thresholds[i]).toBeGreaterThanOrEqual(thresholds[i - 1]!);
    }
    expect(intensityThresholds(counts, 4, 'linear')).toEqual([1, 26, 51, 76]);
    expect(intensityThresholds(counts, 4, 'sqrt')).toEqual([1, 7, 26, 57]);
  });

  it('quantile thresholds split the non-empty cells evenly', () => {
    expect(intensityThresholds(counts, 3, 'quantile')).toEqual([1, 4, 16]);
  });

  it('levels: 0 for empty, then the number of thresholds reached', () => {
    const thresholds = intensityThresholds(counts, 6);
    expect(intensityLevel(0, thresholds)).toBe(0);
    expect(intensityLevel(1, thresholds)).toBe(1);
    expect(intensityLevel(100, thresholds)).toBe(6);
    expect(intensityThresholds([0, 0], 6)).toEqual([]);
  });
});

describe('formatting', () => {
  it('formats counts, shares, ranges and requests by hand', () => {
    expect(formatCount(1234567)).toBe('1,234,567');
    expect(formatShare(0.032)).toBe('3.2%');
    expect(formatShare(0.0004)).toBe('0.04%');
    expect(formatShare(0)).toBe('0%');
    expect(formatLatencyRange(120, 180)).toBe('120–180ms');
    expect(formatLatencyRange(850, 1200)).toBe('850ms–1.2s');
    expect(formatRequests(1)).toBe('1 request');
    expect(formatRequests(342)).toBe('342 requests');
  });
});
