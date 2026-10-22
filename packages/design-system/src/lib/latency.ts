/**
 * Latency distributions: bucket edges that suit them, histograms, percentiles,
 * and the time × latency grid a heatmap draws.
 *
 * ## Why log-spaced buckets
 *
 * Request latency spans orders of magnitude — a cache hit at 2ms and a cold
 * path at 2s on the same endpoint. Equal-width buckets put the whole fast mode
 * in the first bar and spend the rest on the tail; equal *ratio* buckets give
 * every decade the same resolution, which is what a reader comparing 20ms with
 * 200ms wants.
 *
 * ## Percentiles interpolate
 *
 * `percentile` is the linear-interpolation estimate (NumPy's default, R type
 * 7): sort, take the fractional rank `p/100 × (n − 1)`, and interpolate between
 * its neighbours. It never returns a value outside the samples and agrees with
 * nearest-rank at the ends.
 *
 * Everything here is pure: no clock, no randomness.
 */

import type { TimeRange } from './timeRange';
import { formatTraceDuration } from './trace';

/** One histogram bar: samples in `[from, to)` (the last bucket also includes `to`). */
export interface LatencyBucket {
  /** Lower edge, in milliseconds. */
  from: number;
  /** Upper edge, in milliseconds. */
  to: number;
  /** Samples in the bucket. */
  count: number;
}

/** A point in a latency-over-time series. */
export interface LatencyPoint {
  /** When the request happened, epoch milliseconds. */
  time: number;
  /** How long it took, in milliseconds. */
  value: number;
}

/** One cell of a latency heatmap. */
export interface LatencyCell {
  /** Time bucket index, 0 at the left. */
  column: number;
  /** Latency bucket index, 0 at the fastest. */
  row: number;
  /** The cell's time window. */
  timeRange: TimeRange;
  /** The cell's latency window, in milliseconds. */
  latencyRange: { from: number; to: number };
  /** Points in the cell. */
  count: number;
}

/** The cells of a heatmap, column-major (`cells[column * rows + row]`), and their totals. */
export interface LatencyGrid {
  cells: LatencyCell[];
  columns: number;
  rows: number;
  /** The busiest cell's count; 0 for an empty grid. */
  max: number;
  /** Points placed in the grid (inside the time buckets). */
  total: number;
}

const finite = (value: number) => typeof value === 'number' && Number.isFinite(value);

/** Round to two significant figures, down or up. */
function roundSig(value: number, direction: 'floor' | 'ceil' | 'round'): number {
  if (value <= 0) return value;
  const magnitude = 10 ** (Math.floor(Math.log10(value)) - 1);
  const scaled = value / magnitude;
  // A little tolerance, so 120.00000001 does not round up to 130.
  const rounded = direction === 'floor' ? Math.floor(scaled + 1e-9) : direction === 'ceil' ? Math.ceil(scaled - 1e-9) : Math.round(scaled);
  return Number((rounded * magnitude).toPrecision(12));
}

/**
 * `count + 1` log-spaced bucket edges from `min` to `max`, in milliseconds.
 * Edges are rounded to two significant figures (so labels read `120–180ms`)
 * unless rounding would merge two of them. A non-positive `min` is lifted to
 * `max / 1000`; an empty span is widened to a decade.
 */
export function latencyBuckets(min: number, max: number, count: number): number[] {
  const n = Math.max(1, Math.floor(finite(count) ? count : 1));
  let hi = finite(max) && max > 0 ? max : 1000;
  let lo = finite(min) && min > 0 ? min : hi / 1000;
  if (lo > hi) [lo, hi] = [hi, lo];
  if (hi / lo < 1.0001) { lo /= Math.sqrt(10); hi *= Math.sqrt(10); }
  const ratio = Math.log(hi / lo) / n;
  const raw = Array.from({ length: n + 1 }, (_, index) => (index === n ? hi : lo * Math.exp(ratio * index)));
  const nice = raw.map((edge, index) => roundSig(edge, index === 0 ? 'floor' : index === n ? 'ceil' : 'round'));
  return nice.every((edge, index) => index === 0 || edge > nice[index - 1]!) ? nice : raw;
}

/** `count + 1` evenly spaced edges from `min` to `max`. */
export function linearBuckets(min: number, max: number, count: number): number[] {
  const n = Math.max(1, Math.floor(finite(count) ? count : 1));
  let lo = finite(min) ? min : 0;
  let hi = finite(max) ? max : lo + 1;
  if (lo > hi) [lo, hi] = [hi, lo];
  if (hi === lo) hi = lo + 1;
  return Array.from({ length: n + 1 }, (_, index) => lo + ((hi - lo) * index) / n);
}

/** The index of the bucket `value` falls in, clamped to the ends. -1 when there are no buckets. */
export function bucketIndex(value: number, edges: readonly number[]): number {
  const last = edges.length - 2;
  if (last < 0) return -1;
  if (value < edges[1]!) return 0;
  if (value >= edges[last]!) return last;
  let lo = 0;
  let hi = last;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (edges[mid]! <= value) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * Count `samples` into the buckets `edges` describe. Values below the first
 * edge land in the first bucket and above the last in the last, so the counts
 * always sum to the finite samples; non-finite samples are skipped.
 */
export function histogram(samples: readonly number[], edges: readonly number[]): LatencyBucket[] {
  const buckets: LatencyBucket[] = [];
  for (let index = 0; index < edges.length - 1; index += 1) buckets.push({ from: edges[index]!, to: edges[index + 1]!, count: 0 });
  if (!buckets.length) return buckets;
  for (const sample of samples) {
    if (!finite(sample)) continue;
    buckets[bucketIndex(sample, edges)]!.count += 1;
  }
  return buckets;
}

/** Finite samples, sorted ascending. */
function sorted(samples: readonly number[]): number[] {
  return samples.filter(finite).sort((a, b) => a - b);
}

function interpolate(ordered: readonly number[], p: number): number {
  if (!ordered.length || !finite(p)) return Number.NaN;
  const rank = (Math.max(0, Math.min(100, p)) / 100) * (ordered.length - 1);
  const below = Math.floor(rank);
  const above = Math.min(ordered.length - 1, below + 1);
  return ordered[below]! + (ordered[above]! - ordered[below]!) * (rank - below);
}

/**
 * The `p`th percentile (0–100) of `samples`, by linear interpolation between
 * closest ranks. Non-finite samples are ignored; `NaN` when none remain or `p`
 * is not a number.
 */
export function percentile(samples: readonly number[], p: number): number {
  return interpolate(sorted(samples), p);
}

/** Several percentiles at once, sorting once. Same method as `percentile`. */
export function percentiles(samples: readonly number[], ps: readonly number[] = [50, 90, 99]): number[] {
  const ordered = sorted(samples);
  return ps.map((p) => interpolate(ordered, p));
}

/**
 * The `p`th percentile estimated from pre-bucketed counts — for when only a
 * histogram is available. Interpolates linearly inside the bucket the rank
 * falls in (geometrically when both edges are positive, matching log buckets).
 */
export function bucketPercentile(buckets: readonly LatencyBucket[], p: number): number {
  const total = buckets.reduce((sum, bucket) => sum + Math.max(0, bucket.count), 0);
  if (!total || !finite(p)) return Number.NaN;
  const target = (Math.max(0, Math.min(100, p)) / 100) * total;
  let seen = 0;
  for (const bucket of buckets) {
    const count = Math.max(0, bucket.count);
    if (count && seen + count >= target) {
      const t = (target - seen) / count;
      return bucket.from > 0 && bucket.to > 0 ? bucket.from * (bucket.to / bucket.from) ** t : bucket.from + (bucket.to - bucket.from) * t;
    }
    seen += count;
  }
  return buckets[buckets.length - 1]!.to;
}

/** The share (0–1) of finite samples strictly above `threshold`; 0 when there are none. */
export function shareAbove(samples: readonly number[], threshold: number): number {
  let total = 0;
  let over = 0;
  for (const sample of samples) {
    if (!finite(sample)) continue;
    total += 1;
    if (sample > threshold) over += 1;
  }
  return total ? over / total : 0;
}

/** The smallest and largest finite, positive value; null when there is none. */
export function latencyExtent(values: Iterable<number>): { min: number; max: number } | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (!finite(value) || value <= 0) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  return max >= min ? { min, max } : null;
}

/**
 * Ticks for a log axis: 1, 2 and 5 of each decade inside `[min, max]`, thinned
 * to 1 and 5, then to decades, until there are at most `target`.
 */
export function logTicks(min: number, max: number, target = 6): number[] {
  if (!finite(min) || !finite(max) || min <= 0 || max <= min) return [];
  const steps = [[1, 2, 5], [1, 5], [1], [1]];
  for (let pass = 0; pass < steps.length; pass += 1) {
    const ticks: number[] = [];
    const decadeStep = pass === 3 ? 2 : 1;
    for (let decade = Math.floor(Math.log10(min)); decade <= Math.ceil(Math.log10(max)); decade += decadeStep) {
      for (const mantissa of steps[pass]!) {
        const tick = Number((mantissa * 10 ** decade).toPrecision(12));
        if (tick >= min * (1 - 1e-9) && tick <= max * (1 + 1e-9)) ticks.push(tick);
      }
    }
    if (ticks.length <= target || pass === steps.length - 1) return ticks;
  }
  return [];
}

/**
 * Place `points` on a time × latency grid. A point outside every time bucket
 * is dropped (it is outside the window); one outside the latency edges is
 * clamped into the first or last row. Cells are dense — an empty cell is there
 * with `count: 0` — and column-major: `cells[column * rows + row]`.
 */
export function heatmapCells(points: readonly LatencyPoint[], timeBuckets: readonly TimeRange[], latencyEdges: readonly number[]): LatencyGrid {
  const columns = timeBuckets.length;
  const rows = Math.max(0, latencyEdges.length - 1);
  const cells: LatencyCell[] = [];
  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      cells.push({ column, row, timeRange: timeBuckets[column]!, latencyRange: { from: latencyEdges[row]!, to: latencyEdges[row + 1]! }, count: 0 });
    }
  }
  let max = 0;
  let total = 0;
  if (!columns || !rows) return { cells, columns, rows, max, total };
  const first = timeBuckets[0]!.from;
  const end = timeBuckets[columns - 1]!.to;
  for (const point of points) {
    if (!point || !finite(point.time) || !finite(point.value)) continue;
    if (point.time < first || point.time > end) continue;
    let lo = 0;
    let hi = columns - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (timeBuckets[mid]!.from <= point.time) lo = mid;
      else hi = mid - 1;
    }
    const cell = cells[lo * rows + bucketIndex(point.value, latencyEdges)]!;
    cell.count += 1;
    total += 1;
    if (cell.count > max) max = cell.count;
  }
  return { cells, columns, rows, max, total };
}

/** How a cell's count maps to an intensity step. */
export type IntensityScale = 'sqrt' | 'linear' | 'log' | 'quantile';

/**
 * The smallest count in each of `levels` intensity steps — what a legend
 * prints, and what `intensityLevel` reads. Ascending; two steps can share a
 * threshold when counts are small, and the lower one is then never used.
 *
 * - `sqrt` (the heatmap default): latency counts are skewed, and a linear
 *   scale would leave the slow mode of a bimodal service invisible.
 * - `linear`: equal count ranges per step.
 * - `log`: equal ratios per step, on `log(1 + count)`.
 * - `quantile`: each step holds about the same number of non-empty cells.
 */
export function intensityThresholds(counts: readonly number[], levels = 6, scale: IntensityScale = 'sqrt'): number[] {
  const n = Math.max(1, Math.floor(levels));
  const nonzero = counts.filter((count) => finite(count) && count > 0).sort((a, b) => a - b);
  if (!nonzero.length) return [];
  const max = nonzero[nonzero.length - 1]!;
  if (scale === 'quantile') {
    return Array.from({ length: n }, (_, index) => nonzero[Math.min(nonzero.length - 1, Math.floor((index / n) * nonzero.length))]!);
  }
  const lower = (fraction: number) => {
    if (scale === 'linear') return max * fraction;
    if (scale === 'log') return (1 + max) ** fraction - 1;
    return max * fraction * fraction;
  };
  // The smallest whole count strictly past the step's lower bound.
  return Array.from({ length: n }, (_, index) => Math.max(1, Math.floor(lower(index / n) + 1e-9) + 1));
}

/** The intensity step (0 for empty, else 1…thresholds.length) a count falls in. */
export function intensityLevel(count: number, thresholds: readonly number[]): number {
  if (!finite(count) || count <= 0 || !thresholds.length) return 0;
  let level = 0;
  for (const threshold of thresholds) if (count >= threshold) level += 1;
  return Math.max(1, level);
}

/**
 * Where a latency sits on log-spaced edges, as a fractional row: 0 at the
 * first edge, `edges.length - 1` at the last, interpolated geometrically
 * inside a bucket and clamped to the ends.
 */
export function latencyRowPosition(value: number, edges: readonly number[]): number {
  const index = bucketIndex(value, edges);
  if (index < 0 || !finite(value)) return Number.NaN;
  const from = edges[index]!;
  const to = edges[index + 1]!;
  const fraction = from > 0 && value > 0 ? Math.log(value / from) / Math.log(to / from) : (value - from) / (to - from);
  return Math.max(0, Math.min(edges.length - 1, index + Math.max(0, Math.min(1, fraction))));
}

/** `1,234` — grouped by hand, so a server render and a browser agree. */
export function formatCount(value: number): string {
  if (!finite(value)) return '—';
  const [whole, fraction] = String(Math.round(value * 100) / 100).split('.');
  const grouped = whole!.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction ? `${grouped}.${fraction}` : grouped;
}

/** `3.2%`, `0.04%`, `100%` for a 0–1 share. */
export function formatShare(share: number): string {
  if (!finite(share)) return '—';
  const percent = share * 100;
  if (percent === 0 || percent === 100) return `${percent}%`;
  if (percent < 0.1) return `${percent.toFixed(2)}%`;
  return `${percent.toFixed(1).replace(/\.0$/, '')}%`;
}

/**
 * `120–180ms`, `850ms–1.2s`: a latency window, with the unit said once when
 * both ends share it. `format` defaults to `formatTraceDuration`.
 */
export function formatLatencyRange(from: number, to: number, format: (ms: number) => string = formatTraceDuration): string {
  const a = format(from);
  const b = format(to);
  const unitA = /^[\d.]+([a-zµ]+)$/.exec(a)?.[1];
  const unitB = /^[\d.]+([a-zµ]+)$/.exec(b)?.[1];
  return unitA && unitA === unitB ? `${a.slice(0, -unitA.length)}–${b}` : `${a}–${b}`;
}

/** `1 request`, `342 requests`. */
export function formatRequests(count: number): string {
  return `${formatCount(count)} ${count === 1 ? 'request' : 'requests'}`;
}
