import { describe, expect, it } from 'vitest';
import {
  areaPath,
  cleanPoints,
  clipPoints,
  fittedDomain,
  formatMetric,
  labelRows,
  linePath,
  logDomain,
  nearestIndex,
  nearestTimeIndex,
  nudgeLabels,
  pointsInRange,
  resolveTimeDomain,
  splitRuns,
  stackSeries,
  summarisePoints,
  valueDomain,
  withUnit,
  type TimeSeriesPoint,
} from './timeSeries';

const pts: TimeSeriesPoint[] = [[0, 1], [10, 2], [20, null], [30, 4], [40, 5]];

describe('timeSeries', () => {
  it('cleans points: sorts, drops bad times, turns bad values into gaps', () => {
    expect(cleanPoints(pts)).toBe(pts);
    expect(cleanPoints([[20, 2], [Number.NaN, 1], [10, Number.POSITIVE_INFINITY]])).toEqual([[10, null], [20, 2]]);
  });

  it('resolves the domain: explicit, shared, extent, widened when zero-width', () => {
    const series = [{ points: pts }];
    expect(resolveTimeDomain({ from: 5, to: 1 }, { from: 0, to: 100 }, series)).toEqual({ from: 1, to: 5 });
    expect(resolveTimeDomain(undefined, { from: 0, to: 100 }, series)).toEqual({ from: 0, to: 100 });
    expect(resolveTimeDomain(undefined, null, series)).toEqual({ from: 0, to: 40 });
    expect(resolveTimeDomain(undefined, null, [{ points: [[1000, 1]] }])).toEqual({ from: -29_000, to: 31_000 });
    expect(resolveTimeDomain(undefined, null, [])).toBeNull();
  });

  it('clips with one neighbour either side, and filters strictly in range', () => {
    expect(pointsInRange(pts, { from: 10, to: 30 }).map(([time]) => time)).toEqual([10, 20, 30]);
    expect(clipPoints(pts, { from: 15, to: 25 }).map(([time]) => time)).toEqual([10, 20, 30]);
  });

  it('finds the nearest point, earlier on a tie', () => {
    expect(nearestIndex(pts, 14)).toBe(1);
    expect(nearestIndex(pts, 15)).toBe(1);
    expect(nearestIndex(pts, 16)).toBe(2);
    expect(nearestIndex(pts, -100)).toBe(0);
    expect(nearestIndex(pts, 1000)).toBe(4);
    expect(nearestIndex([], 1)).toBe(-1);
    expect(nearestTimeIndex([0, 10, 20], 6)).toBe(1);
    expect(nearestTimeIndex([], 6)).toBe(-1);
  });

  it('stacks on the union of times, a gap adding nothing', () => {
    const { times, layers } = stackSeries([[[0, 1], [10, 2]], [[0, 3], [10, null], [20, 1]]]);
    expect(times).toEqual([0, 10, 20]);
    expect(layers[1]!.map((point) => [point.y0, point.y1, point.value])).toEqual([[1, 4, 3], [2, 2, null], [0, 1, 1]]);
  });

  it('summarises non-null values', () => {
    expect(summarisePoints(pts)).toEqual({ min: 1, max: 5, latest: 5, latestTime: 40, count: 4 });
    expect(summarisePoints([[0, null]])).toBeNull();
  });

  it('computes value domains', () => {
    expect(valueDomain([3, 7], [10])).toEqual([0, 10]);
    expect(valueDomain([-2, 4])).toEqual([-2, 4]);
    expect(valueDomain([])).toEqual([0, 1]);
    expect(fittedDomain([10, 20])).toEqual([9.5, 20.5]);
    expect(fittedDomain([5, 5])).toEqual([4, 6]);
    expect(logDomain([0, -1, 10, 1000])).toEqual([10, 1000]);
    expect(logDomain([0])).toEqual([1, 10]);
  });

  it('formats values compactly', () => {
    expect(formatMetric(0)).toBe('0');
    expect(formatMetric(950)).toBe('950');
    expect(formatMetric(1234)).toBe('1.23k');
    expect(formatMetric(3_400_000)).toBe('3.4M');
    expect(formatMetric(0.04213)).toBe('0.0421');
    expect(formatMetric(Number.NaN)).toBe('—');
    expect(withUnit('42', '%')).toBe('42%');
    expect(withUnit('42', 'ms')).toBe('42 ms');
    expect(withUnit('42', undefined)).toBe('42');
  });

  it('builds paths per run and curve', () => {
    const run = [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 0 }];
    expect(linePath([run])).toBe('M0,0L10,10L20,0');
    expect(linePath([run], 'step')).toBe('M0,0L5,0L5,10L10,10L15,10L15,0L20,0');
    const monotone = linePath([run], 'monotone');
    expect(monotone.startsWith('M0,0C')).toBe(true);
    // A peak gets a flat tangent: no overshoot above y=10.
    expect(monotone).toContain(',10,10');
    expect(linePath([[{ x: 0, y: 0 }], [{ x: 5, y: 5 }, { x: 6, y: 6 }]])).toBe('M0,0M5,5L6,6');
    expect(areaPath([[{ x: 0, y0: 10, y1: 2 }, { x: 10, y0: 10, y1: 4 }]])).toBe('M0,2L10,4L10,10L0,10Z');
  });

  it('splits runs on undefined items', () => {
    expect(splitRuns([1, 0, 2, 3, 0, 0, 4], (n) => n > 0)).toEqual([[1], [2, 3], [4]]);
  });

  it('nudges labels apart within bounds, keeping input order', () => {
    expect(nudgeLabels([50, 52, 10], 12, 0, 100)).toEqual([50, 62, 10]);
    expect(nudgeLabels([99, 98], 12, 0, 100)).toEqual([100, 88]);
  });

  it('alternates label rows on collision', () => {
    expect(labelRows([[0, 50], [20, 50], [40, 50], [200, 50]])).toEqual([0, 1, 0, 0]);
  });
});
