/**
 * Pure geometry and arithmetic behind `TimeSeriesChart`: cleaning points,
 * resolving the x domain, clipping to it, finding the point nearest a cursor,
 * stacking, summarising and formatting values.
 *
 * Nothing here reads the clock or the DOM, so every function is a pure
 * function of its arguments and can be tested without a browser.
 */
import { normaliseRange, type TimeRange } from './timeRange';

/** One sample: epoch milliseconds and a value, or `null` for a gap. */
export type TimeSeriesPoint = readonly [time: number, value: number | null];

/** A named line on a time-series chart. */
export interface TimeSeries {
  /** Stable id — keys the legend and `hiddenSeries`. */
  id: string;
  /** What the legend and the readout call it. */
  label: string;
  /** Samples in epoch milliseconds. A `null` value is a gap: the line breaks there. */
  points: ReadonlyArray<TimeSeriesPoint>;
  /** Unit for this series' values; falls back to the chart's `unit`. */
  unit?: string;
  /**
   * Pin the series to a role when its colour carries a meaning — a 5xx series
   * is `danger`, a 4xx one `warning`. Omitted, series take the neutral cycle.
   */
  tone?: 'primary' | 'secondary' | 'neutral' | 'info' | 'success' | 'warning' | 'danger';
}

/**
 * Points with a finite time, sorted ascending; a non-finite value becomes a
 * gap. Returns the input when it is already clean, so memoised callers keep
 * their identity.
 */
export function cleanPoints(points: ReadonlyArray<TimeSeriesPoint>): ReadonlyArray<TimeSeriesPoint> {
  let clean = true;
  for (let index = 0; index < points.length; index += 1) {
    const [time, value] = points[index]!;
    if (!Number.isFinite(time) || (value !== null && !Number.isFinite(value)) || (index > 0 && time < points[index - 1]![0])) {
      clean = false;
      break;
    }
  }
  if (clean) return points;
  return points
    .filter(([time]) => Number.isFinite(time))
    .map(([time, value]): TimeSeriesPoint => [time, value !== null && Number.isFinite(value) ? value : null])
    .sort((a, b) => a[0] - b[0]);
}

/** The first and last sample time across every series, or null with no samples. */
export function dataExtent(series: ReadonlyArray<{ points: ReadonlyArray<TimeSeriesPoint> }>): TimeRange | null {
  let from = Infinity;
  let to = -Infinity;
  for (const { points } of series) {
    for (const [time] of points) {
      if (!Number.isFinite(time)) continue;
      if (time < from) from = time;
      if (time > to) to = time;
    }
  }
  return from <= to ? { from, to } : null;
}

/** Half the width given to a domain that would otherwise be a single instant. */
const MIN_HALF_SPAN = 30_000;

/**
 * The x domain: an explicit range, else the shared one, else the data's
 * extent. A zero-width domain is widened a little so it can be drawn.
 */
export function resolveTimeDomain(
  explicit: TimeRange | null | undefined,
  shared: TimeRange | null | undefined,
  series: ReadonlyArray<{ points: ReadonlyArray<TimeSeriesPoint> }>,
): TimeRange | null {
  const range = normaliseRange(explicit) ?? normaliseRange(shared) ?? dataExtent(series);
  if (!range) return null;
  if (range.to > range.from) return range;
  return { from: range.from - MIN_HALF_SPAN, to: range.to + MIN_HALF_SPAN };
}

/** Index of the first point with `time >= target`, or `points.length`. */
function lowerBound(points: ReadonlyArray<TimeSeriesPoint>, target: number): number {
  let lo = 0;
  let hi = points.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid]![0] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** The points inside `range`. */
export function pointsInRange(points: ReadonlyArray<TimeSeriesPoint>, range: TimeRange): ReadonlyArray<TimeSeriesPoint> {
  const start = lowerBound(points, range.from);
  let end = lowerBound(points, range.to);
  while (end < points.length && points[end]![0] === range.to) end += 1;
  return points.slice(start, end);
}

/**
 * The points inside `range` plus one neighbour either side, so a line that
 * leaves the window runs to its edge instead of stopping short. The chart
 * clips what lands outside.
 */
export function clipPoints(points: ReadonlyArray<TimeSeriesPoint>, range: TimeRange): ReadonlyArray<TimeSeriesPoint> {
  const start = Math.max(0, lowerBound(points, range.from) - 1);
  let end = lowerBound(points, range.to);
  while (end < points.length && points[end]![0] === range.to) end += 1;
  return points.slice(start, Math.min(points.length, end + 1));
}

/** Index of the point nearest `time` (earlier wins a tie), or -1 with no points. */
export function nearestIndex(points: ReadonlyArray<TimeSeriesPoint>, time: number): number {
  if (!points.length) return -1;
  const after = lowerBound(points, time);
  if (after === 0) return 0;
  if (after === points.length) return points.length - 1;
  return time - points[after - 1]![0] <= points[after]![0] - time ? after - 1 : after;
}

/** Index of the value in sorted `times` nearest `time` (earlier wins a tie), or -1 when empty. */
export function nearestTimeIndex(times: readonly number[], time: number): number {
  if (!times.length) return -1;
  let lo = 0;
  let hi = times.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid]! < time) lo = mid + 1;
    else hi = mid;
  }
  if (lo === 0) return 0;
  if (lo === times.length) return times.length - 1;
  return time - times[lo - 1]! <= times[lo]! - time ? lo - 1 : lo;
}

/** Every distinct sample time across `series`, sorted. */
export function unionTimes(series: ReadonlyArray<ReadonlyArray<TimeSeriesPoint>>): number[] {
  const times = new Set<number>();
  for (const points of series) for (const [time] of points) times.add(time);
  return [...times].sort((a, b) => a - b);
}

/** One stacked sample: the band from `y0` to `y1`, or a gap when `value` is null. */
export interface StackedPoint {
  time: number;
  value: number | null;
  y0: number;
  y1: number;
}

/**
 * Stack series on their union of times, in order — the first series sits on
 * zero. A series with no value at a time (missing or `null`) is a gap there
 * and adds nothing to the bands above it.
 */
export function stackSeries(series: ReadonlyArray<ReadonlyArray<TimeSeriesPoint>>): { times: number[]; layers: StackedPoint[][] } {
  const times = unionTimes(series);
  const lookups = series.map((points) => new Map(points.map(([time, value]) => [time, value] as const)));
  const layers: StackedPoint[][] = series.map(() => []);
  for (const time of times) {
    let base = 0;
    lookups.forEach((lookup, index) => {
      const value = lookup.get(time) ?? null;
      const top = value === null ? base : base + value;
      layers[index]!.push({ time, value, y0: base, y1: top });
      base = top;
    });
  }
  return { times, layers };
}

/** Min, max and latest of a series' non-null values. */
export interface SeriesSummary {
  min: number;
  max: number;
  latest: number;
  latestTime: number;
  count: number;
}

/** Summarise the non-null values of `points`, or null when there are none. */
export function summarisePoints(points: ReadonlyArray<TimeSeriesPoint>): SeriesSummary | null {
  let summary: SeriesSummary | null = null;
  for (const [time, value] of points) {
    if (value === null) continue;
    if (!summary) summary = { min: value, max: value, latest: value, latestTime: time, count: 1 };
    else {
      summary.min = Math.min(summary.min, value);
      summary.max = Math.max(summary.max, value);
      summary.latest = value;
      summary.latestTime = time;
      summary.count += 1;
    }
  }
  return summary;
}

/**
 * The y domain before rounding: from zero, or from the minimum when values go
 * negative, to the largest value or threshold. Never zero-height.
 */
export function valueDomain(values: Iterable<number>, thresholds: Iterable<number> = []): [number, number] {
  let min = 0;
  let max = -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  for (const value of thresholds) if (Number.isFinite(value) && value > max) max = value;
  if (!Number.isFinite(max) || max <= min) max = min + 1;
  return [min, max];
}

const trim = (value: number) => String(Number(value.toPrecision(3)));

/** `950`, `1.25k`, `3.4M`, `0.042`: a compact value label, three significant digits. */
export function formatMetric(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${trim(value / 1e9)}G`;
  if (abs >= 1e6) return `${trim(value / 1e6)}M`;
  if (abs >= 1e3) return `${trim(value / 1e3)}k`;
  if (abs === 0) return '0';
  return trim(value);
}

/** A value with its unit: `120 ms`, `42%` — no space before `%`. */
export function withUnit(text: string, unit: string | undefined): string {
  if (!unit) return text;
  return unit === '%' ? `${text}%` : `${text} ${unit}`;
}

// ── Paths ───────────────────────────────────────────────────────────────────

/** How a line joins its samples: straight, a monotone cubic, or a mid-point step. */
export type TimeSeriesCurve = 'linear' | 'monotone' | 'step';

/** A point already in pixel space. */
export interface PlotPoint {
  x: number;
  y: number;
}

/** A band sample in pixel space: the top `y1` and the bottom `y0` at `x`. */
export interface PlotBand {
  x: number;
  y0: number;
  y1: number;
}

const r = (value: number) => Math.round(value * 100) / 100;

const sign = (value: number) => (value < 0 ? -1 : 1);

/**
 * Tangents for a monotone cubic through `points` — the Steffen/Fritsch–Carlson
 * rule d3's `curveMonotoneX` uses, so the curve never overshoots a sample.
 */
function monotoneTangents(points: readonly PlotPoint[]): number[] {
  const n = points.length;
  const slopes: number[] = [];
  for (let k = 0; k < n - 1; k += 1) {
    const h = points[k + 1]!.x - points[k]!.x;
    slopes.push(h === 0 ? 0 : (points[k + 1]!.y - points[k]!.y) / h);
  }
  const tangents: number[] = new Array<number>(n).fill(0);
  for (let k = 1; k < n - 1; k += 1) {
    const h0 = points[k]!.x - points[k - 1]!.x;
    const h1 = points[k + 1]!.x - points[k]!.x;
    const s0 = slopes[k - 1]!;
    const s1 = slopes[k]!;
    const p = h0 + h1 === 0 ? 0 : (s0 * h1 + s1 * h0) / (h0 + h1);
    tangents[k] = (sign(s0) + sign(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
  }
  // Ends: one-sided, as d3's slope2.
  const end = (k: number, neighbour: number, slope: number) => {
    const h = points[neighbour]!.x - points[k]!.x;
    return h === 0 ? tangents[neighbour]! : (3 * slope - tangents[neighbour]!) / 2;
  };
  tangents[0] = end(0, 1, slopes[0]!);
  tangents[n - 1] = end(n - 1, n - 2, slopes[n - 2]!);
  return tangents;
}

/** Path commands through one unbroken run of points, starting with `start`. */
function segmentCommands(points: readonly PlotPoint[], curve: TimeSeriesCurve, start: 'M' | 'L'): string {
  if (!points.length) return '';
  const first = points[0]!;
  let d = `${start}${r(first.x)},${r(first.y)}`;
  if (points.length === 1) return d;
  if (curve === 'step') {
    for (let k = 1; k < points.length; k += 1) {
      const a = points[k - 1]!;
      const b = points[k]!;
      const mid = r((a.x + b.x) / 2);
      d += `L${mid},${r(a.y)}L${mid},${r(b.y)}L${r(b.x)},${r(b.y)}`;
    }
    return d;
  }
  if (curve === 'monotone' && points.length > 2) {
    const tangents = monotoneTangents(points);
    for (let k = 1; k < points.length; k += 1) {
      const a = points[k - 1]!;
      const b = points[k]!;
      const h = (b.x - a.x) / 3;
      d += `C${r(a.x + h)},${r(a.y + tangents[k - 1]! * h)},${r(b.x - h)},${r(b.y - tangents[k]! * h)},${r(b.x)},${r(b.y)}`;
    }
    return d;
  }
  for (let k = 1; k < points.length; k += 1) d += `L${r(points[k]!.x)},${r(points[k]!.y)}`;
  return d;
}

/** An SVG path through each unbroken run; runs are separate sub-paths, so gaps stay gaps. */
export function linePath(segments: ReadonlyArray<readonly PlotPoint[]>, curve: TimeSeriesCurve = 'linear'): string {
  return segments.map((segment) => segmentCommands(segment, curve, 'M')).join('');
}

/** A closed band per unbroken run: along the tops, back along the bottoms. */
export function areaPath(segments: ReadonlyArray<readonly PlotBand[]>, curve: TimeSeriesCurve = 'linear'): string {
  return segments
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      const top = segment.map((band) => ({ x: band.x, y: band.y1 }));
      const bottom = segment.map((band) => ({ x: band.x, y: band.y0 })).reverse();
      return `${segmentCommands(top, curve, 'M')}${segmentCommands(bottom, curve, 'L')}Z`;
    })
    .join('');
}

/** Split `items` into runs where `defined` holds; an undefined item ends a run. */
export function splitRuns<T>(items: readonly T[], defined: (item: T) => boolean): T[][] {
  const runs: T[][] = [];
  let run: T[] = [];
  for (const item of items) {
    if (defined(item)) run.push(item);
    else if (run.length) { runs.push(run); run = []; }
  }
  if (run.length) runs.push(run);
  return runs;
}

/**
 * Spread label positions so no two sit closer than `gap`, keeping them inside
 * `[min, max]` and as near their wanted positions as that allows. Returns the
 * positions in the input order.
 */
export function nudgeLabels(wanted: readonly number[], gap: number, min: number, max: number): number[] {
  const order = wanted.map((y, index) => ({ y, index })).sort((a, b) => a.y - b.y || a.index - b.index);
  const placed = order.map((entry) => Math.max(min, Math.min(max, entry.y)));
  for (let k = 1; k < placed.length; k += 1) placed[k] = Math.max(placed[k]!, placed[k - 1]! + gap);
  const overflow = placed.length ? placed[placed.length - 1]! - max : 0;
  if (overflow > 0) {
    placed[placed.length - 1] = max;
    for (let k = placed.length - 2; k >= 0; k -= 1) placed[k] = Math.min(placed[k]!, placed[k + 1]! - gap);
  }
  const result: number[] = new Array<number>(wanted.length);
  order.forEach((entry, k) => { result[entry.index] = placed[k]!; });
  return result;
}

/** The y domain fitted to the values alone, padded 5% each way. Never zero-height. */
export function fittedDomain(values: Iterable<number>): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min > max) return [0, 1];
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * 0.05;
  return [min - pad, max + pad];
}

/** The y domain of a log scale: positive values (and thresholds) only. Never zero-height. */
export function logDomain(values: Iterable<number>, thresholds: Iterable<number> = []): [number, number] {
  let min = Infinity;
  let max = -Infinity;
  for (const value of [...values, ...thresholds]) {
    if (!Number.isFinite(value) || value <= 0) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min > max) return [1, 10];
  if (min === max) return [min / 10, max * 10];
  return [min, max];
}

/**
 * Rows for marker labels left to right: a label that would overlap the one
 * before it on row 0 drops to row 1, and back. `spans` are `[x, width]` in
 * pixels, sorted by `x`.
 */
export function labelRows(spans: ReadonlyArray<readonly [x: number, width: number]>): Array<0 | 1> {
  let lastEnd = -Infinity;
  let lastRow: 0 | 1 = 1;
  return spans.map(([x, width]) => {
    const row: 0 | 1 = x < lastEnd ? (lastRow === 0 ? 1 : 0) : 0;
    if (row === 0) lastEnd = x + width;
    lastRow = row;
    return row;
  });
}
