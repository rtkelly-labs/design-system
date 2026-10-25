import { scaleLinear } from '@visx/scale';
import { forwardRef, useId, type HTMLAttributes } from 'react';
import { recipe } from '../lib/recipe';
import { benchmarkDisplayUnit, formatPercent, formatRatioChange, formatSignificant, noiseBand, type BenchmarkDirection } from '../lib/benchmark';

/** Every value each enumerable prop accepts, first the default — for stories and evaluation grids to iterate. */
export const BENCHMARK_TREND_VARIANTS = {
  interval: ['whisker', 'ribbon', 'none'],
  density: ['regular', 'compact'],
} as const satisfies Record<string, readonly unknown[]>;

/** How each point's interval is drawn. */
export type BenchmarkTrendInterval = (typeof BENCHMARK_TREND_VARIANTS.interval)[number];

/** One commit's measurement — the `diffra.timeseries.v1` point shape, plus an optional interval. */
export interface BenchmarkTrendPoint {
  /** The commit measured. Printed shortened to seven characters. */
  commit: string;
  /** When the commit was measured, ISO 8601. Read in the accessible summary, never as an axis: commits are spaced evenly. */
  timestamp: string;
  /** A release tag on the commit, drawn as a label above it. */
  tag?: string;
  /** The benchmark's median at this commit, in the chart's `unit`. */
  value: number;
  /** Lower end of the median's interval, when one was recorded. */
  low?: number;
  /** Upper end of the median's interval, when one was recorded. */
  high?: number;
}

const WIDTH = 760;
/** The drawing used below a 44rem container, at close to its natural size. */
const NARROW_WIDTH = 360;
const LAYOUT = {
  regular: { height: 200, left: 52, right: 84, top: 22, bottom: 26, font: 10, dot: 3 },
  compact: { height: 130, left: 44, right: 70, top: 16, bottom: 20, font: 9, dot: 2.5 },
} as const;

const benchmarkTrend = recipe({
  slots: {
    root: '@container flex min-w-0 flex-col gap-1 font-mono text-xs text-content-primary',
    title: 'text-xs uppercase tracking-wide text-content-secondary',
    chart: 'block h-auto max-w-full overflow-visible',
    narrowChart: 'block h-auto w-full max-w-md overflow-visible',
    readout: 'tabular-nums text-content-secondary',
    empty: 'border border-dashed border-edge-default px-3 py-6 text-center text-content-muted',
  },
});

export interface BenchmarkTrendProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The benchmark along the main branch, oldest first: one point per measured commit. */
  points: readonly BenchmarkTrendPoint[];
  /** The candidate, drawn to the right of the history after a dashed divider. */
  candidate?: BenchmarkTrendPoint;
  /** The values' unit, e.g. `ns`. A time unit scales to fit. */
  unit: string;
  /** Whether a smaller or larger value is better. Read in the summary only; it changes no colour. */
  direction?: BenchmarkDirection;
  /**
   * Relative noise threshold, e.g. `0.05`: a band of `[1 / (1 + t), 1 + t]` around the last
   * history point, the range the candidate must leave to count as a change. Omit for no band.
   */
  threshold?: number;
  /** How each point's `low`–`high` interval is drawn: `whisker` (default), a `ribbon` along the line, or `none`. */
  interval?: BenchmarkTrendInterval;
  /** `compact` lowers the chart and tightens type. Default `regular`. */
  density?: 'regular' | 'compact';
  /** The chart's accessible name, also shown above it. Default `Benchmark trend` (not shown). */
  title?: string;
}

/**
 * A benchmark's median along the main branch, one point per commit and evenly spaced, with the
 * candidate set apart at the right, release tags labelled above their commits, and the noise
 * band around the latest baseline shaded so a reader sees at once whether the candidate left it.
 *
 * The shape is Diffra's time-series projection (ADR 0007): commit, timestamp, tag and value per
 * point, a candidate overlay and a threshold band. History is drawn in the `delta-removed` role
 * and the candidate in `delta-added` — before and after, as a diff draws them — and neither is a
 * verdict. A fixed `viewBox` scaled to the container: no script, no measurement, so it renders in
 * a static report.
 */
export const BenchmarkTrend = forwardRef<HTMLDivElement, BenchmarkTrendProps>(function BenchmarkTrend(
  { points, candidate, unit, direction = 'lower-is-better', threshold, interval = 'whisker', density = 'regular', title, className, ...props },
  ref,
) {
  const id = useId();
  const styles = benchmarkTrend();
  const layout = LAYOUT[density] ?? LAYOUT.regular;
  const history = points.filter((point) => Number.isFinite(point.value));

  if (!history.length && !candidate) {
    return (
      <div ref={ref} data-slot="benchmark-trend" data-empty="" {...props} className={styles.root({ className })}>
        {title ? <p className={styles.title()}>{title}</p> : null}
        <p className={styles.empty()}>No history.</p>
      </div>
    );
  }

  const last = history[history.length - 1];
  const band = last && threshold != null ? { low: last.value * noiseBand(threshold).low, high: last.value * noiseBand(threshold).high } : null;
  const values = [...history, ...(candidate ? [candidate] : [])].flatMap((p) => [p.value, ...(interval === 'none' ? [] : [p.low, p.high])]).filter((v): v is number => v != null && Number.isFinite(v));
  if (band) values.push(band.low, band.high);
  const yScale = scaleLinear<number>({ domain: [Math.min(...values), Math.max(...values)], range: [layout.height - layout.bottom, layout.top], nice: true });
  const yTicks = yScale.ticks(4);
  const display = benchmarkDisplayUnit(last?.value ?? candidate!.value, unit);

  const fmt = (value: number) => `${formatSignificant(value / display.factor)} ${display.unit}`;
  const change = candidate && last ? candidate.value / last.value : null;
  const outside = band && candidate ? candidate.value < band.low || candidate.value > band.high : null;
  const tags = history.flatMap((p, i) => (p.tag ? [{ tag: p.tag, i }] : []));

  const summary = [
    history.length ? `${history.length} commits from ${history[0]!.commit.slice(0, 7)} (${history[0]!.timestamp}) to ${last!.commit.slice(0, 7)} (${last!.timestamp}); latest ${fmt(last!.value)}.` : '',
    tags.length ? `Tags: ${tags.map((t) => `${t.tag} at ${history[t.i]!.commit.slice(0, 7)}`).join(', ')}.` : '',
    candidate ? `Candidate ${candidate.commit.slice(0, 7)}: ${fmt(candidate.value)}${change !== null ? `, ${formatRatioChange(change)} on the latest` : ''}${outside === null ? '' : outside ? `, outside the ±${formatPercent(threshold!)} band` : `, inside the ±${formatPercent(threshold!)} band`}.` : '',
    `${direction.replace(/-/g, ' ')}.`,
  ].filter(Boolean).join(' ');

  const chartAt = (W: number) => {
    // Slots: the history, a gap, then the candidate.
    const slots = history.length + (candidate ? 2 : 0);
    const innerWidth = W - layout.left - layout.right;
    const step = innerWidth / Math.max(1, slots - 1 || 1);
    const xAt = (slot: number) => layout.left + (slots <= 1 ? innerWidth / 2 : slot * step);
    const candidateX = candidate ? xAt(slots - 1) : null;
    const dividerX = candidate ? xAt(slots - 2) : null;
    const labelEvery = Math.max(1, Math.ceil(history.length / Math.max(1, Math.floor(innerWidth / 70))));

    const line = history.map((p, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)},${yScale(p.value).toFixed(1)}`).join('');
    const withInterval = history.filter((p) => p.low != null && p.high != null);
    const ribbon = interval === 'ribbon' && withInterval.length === history.length && history.length > 1
      ? `${history.map((p, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(1)},${yScale(p.high!).toFixed(1)}`).join('')}${[...history].reverse().map((p, i) => `L${xAt(history.length - 1 - i).toFixed(1)},${yScale(p.low!).toFixed(1)}`).join('')}Z`
      : null;
    return (
        <svg role="img" aria-label={title ?? 'Benchmark trend'} aria-describedby={`${id}-summary`} viewBox={`0 0 ${W} ${layout.height}`} width={W === WIDTH ? W : undefined} height={W === WIDTH ? layout.height : undefined} className={W === WIDTH ? styles.chart() : styles.narrowChart()}>
          <g aria-hidden="true">
            {yTicks.map((tick) => (
              <g key={tick}>
                <line x1={layout.left} x2={W - layout.right} y1={yScale(tick)} y2={yScale(tick)} className="stroke-edge-subtle" strokeDasharray="2 3" />
                <text x={layout.left - 6} y={yScale(tick)} textAnchor="end" dominantBaseline="central" fontSize={layout.font} className="fill-content-muted">{formatSignificant(tick / display.factor)}</text>
              </g>
            ))}
            <text x={layout.left - 6} y={layout.top - 8} textAnchor="end" fontSize={layout.font} className="fill-content-muted">{display.unit}</text>
            {band ? (
              <g data-part="band">
                <rect x={layout.left} y={yScale(band.high)} width={innerWidth} height={Math.max(0, yScale(band.low) - yScale(band.high))} className="fill-content-muted" fillOpacity={0.14} />
                <text x={W - layout.right + 6} y={yScale(band.high)} dominantBaseline="hanging" fontSize={layout.font} className="fill-content-muted">{`±${formatPercent(threshold!)}`}</text>
              </g>
            ) : null}
            {ribbon ? <path data-part="ribbon" d={ribbon} className="fill-delta-removed" fillOpacity={0.18} /> : null}
            {history.length > 1 ? <path data-part="line" d={line} fill="none" strokeWidth={1.5} strokeLinejoin="round" className="stroke-delta-removed" /> : null}
            {history.map((p, i) => (
              <g key={`${p.commit}-${i}`} data-part="point" data-commit={p.commit}>
                {interval === 'whisker' && p.low != null && p.high != null ? (
                  <line x1={xAt(i)} x2={xAt(i)} y1={yScale(p.low)} y2={yScale(p.high)} strokeWidth={1.25} className="stroke-delta-removed" />
                ) : null}
                <circle cx={xAt(i)} cy={yScale(p.value)} r={layout.dot} className="fill-delta-removed" />
                {i % labelEvery === 0 || (i === history.length - 1 && !candidate) ? (
                  <text x={xAt(i)} y={layout.height - layout.bottom + layout.font + 6} textAnchor="middle" fontSize={layout.font} className="fill-content-muted">{p.commit.slice(0, 7)}</text>
                ) : null}
              </g>
            ))}
            {tags.map(({ tag, i }) => (
              <g key={tag} data-part="tag">
                <line x1={xAt(i)} x2={xAt(i)} y1={layout.top - 2} y2={layout.height - layout.bottom} className="stroke-edge-default" strokeDasharray="1 3" />
                <text x={xAt(i)} y={layout.top - 6} textAnchor="middle" fontSize={layout.font} className="fill-content-secondary">{tag}</text>
              </g>
            ))}
            {candidate && candidateX !== null && dividerX !== null ? (
              <g data-part="candidate">
                <line x1={dividerX} x2={dividerX} y1={layout.top} y2={layout.height - layout.bottom} className="stroke-edge-default" strokeDasharray="4 3" />
                {interval !== 'none' && candidate.low != null && candidate.high != null ? (
                  <line x1={candidateX} x2={candidateX} y1={yScale(candidate.low)} y2={yScale(candidate.high)} strokeWidth={1.5} className="stroke-delta-added" />
                ) : null}
                {last ? <line x1={xAt(history.length - 1)} x2={candidateX} y1={yScale(last.value)} y2={yScale(candidate.value)} strokeDasharray="3 3" className="stroke-delta-added" /> : null}
                <rect
                  x={candidateX - layout.dot * 1.5}
                  y={yScale(candidate.value) - layout.dot * 1.5}
                  width={layout.dot * 3}
                  height={layout.dot * 3}
                  transform={`rotate(45 ${candidateX} ${yScale(candidate.value)})`}
                  className="fill-delta-added stroke-content-primary"
                  strokeWidth={1}
                />
                <text x={candidateX + 10} y={yScale(candidate.value)} dominantBaseline="central" fontSize={layout.font} className="fill-content-primary">
                  {change !== null ? formatRatioChange(change) : fmt(candidate.value)}
                </text>
                <text x={candidateX} y={layout.top - 6} textAnchor="middle" fontSize={layout.font} className="fill-content-primary">candidate</text>
                <text x={candidateX} y={layout.height - layout.bottom + layout.font + 6} textAnchor="middle" fontSize={layout.font} className="fill-content-muted">{candidate.commit.slice(0, 7)}</text>
              </g>
            ) : null}
          </g>
        </svg>
    );
  };

  return (
    <div ref={ref} data-slot="benchmark-trend" data-outside-band={outside ?? undefined} {...props} className={styles.root({ className })}>
      {title ? <p aria-hidden="true" className={styles.title()}>{title}</p> : null}
      <p id={`${id}-summary`} className="sr-only">{summary}</p>
      {/* Two drawings, one shown by a container query, so a narrow container gets its own geometry
          at near 1:1 rather than the wide one's type shrunk to nothing. */}
      <div data-size="wide" className="hidden @min-[44rem]:block">{chartAt(WIDTH)}</div>
      <div data-size="narrow" className="@min-[44rem]:hidden">{chartAt(NARROW_WIDTH)}</div>
      <p data-part="readout" className={styles.readout()}>
        {[
          last ? `latest ${fmt(last.value)} at ${last.commit.slice(0, 7)}` : null,
          candidate ? `candidate ${fmt(candidate.value)}${change !== null ? ` (${formatRatioChange(change)})` : ''}` : null,
          outside === null ? null : outside ? 'outside the noise band' : 'inside the noise band',
        ].filter(Boolean).join(' · ')}
      </p>
    </div>
  );
});

BenchmarkTrend.displayName = 'BenchmarkTrend';
