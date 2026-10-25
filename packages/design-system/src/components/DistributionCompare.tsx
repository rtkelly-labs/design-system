import { scaleLinear } from '@visx/scale';
import { forwardRef, useId, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { cn, recipe } from '../lib/recipe';
import {
  INCONCLUSIVE_REASON_TEXT,
  benchmarkDisplayUnit,
  compareBenchmark,
  formatPercent,
  formatRatio,
  formatSignificant,
  kernelDensity,
  medianInterval,
  summarize,
  type BenchmarkCompareOptions,
  type BenchmarkComparison,
  type BenchmarkDirection,
} from '../lib/benchmark';
import { logTicks } from '../lib/latency';

/** Every value each enumerable prop accepts, first the default — for stories and evaluation grids to iterate. */
export const DISTRIBUTION_COMPARE_VARIANTS = {
  variant: ['strip', 'violin'],
  scale: ['linear', 'log'],
  density: ['regular', 'compact'],
} as const satisfies Record<string, readonly unknown[]>;

/** How the two distributions are drawn. */
export type DistributionCompareVariant = (typeof DISTRIBUTION_COMPARE_VARIANTS.variant)[number];

/** Fewest samples a side needs before `violin` draws a density for it rather than its points. */
const MIN_DENSITY_SAMPLES = 8;

const WIDTH = 640;
const LAYOUT = {
  regular: { height: 168, left: 104, right: 16, top: 10, bottom: 28, font: 11, dot: 2.6 },
  compact: { height: 112, left: 88, right: 10, top: 6, bottom: 20, font: 9, dot: 2.1 },
} as const;

const distributionCompare = recipe({
  slots: {
    root: 'flex min-w-0 flex-col gap-1 font-mono text-xs text-content-primary',
    title: 'text-xs uppercase tracking-wide text-content-secondary',
    chart: 'block h-auto max-w-full overflow-visible',
    readout: 'flex flex-wrap gap-x-4 gap-y-1 tabular-nums text-content-secondary',
    empty: 'border border-dashed border-edge-default px-3 py-6 text-center text-content-muted',
  },
});

export interface DistributionCompareProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The baseline's samples, in `unit`. */
  baseline: readonly number[];
  /** The candidate's samples, in `unit`. */
  candidate: readonly number[];
  /** The samples' unit, e.g. `ns`. A time unit scales to fit (`6.72 µs`). */
  unit: string;
  /** Whether a smaller or larger value is better. Default `lower-is-better`, the usual for timings. */
  direction?: BenchmarkDirection;
  /**
   * The comparison to print beneath: ratio, interval and classification. Default: computed here
   * from the samples with `options`, so a caller that already has one passes it to avoid the work.
   */
  comparison?: BenchmarkComparison;
  /** Options for the comparison computed when `comparison` is not given. */
  options?: BenchmarkCompareOptions;
  /**
   * `strip` (default): every sample as a dot, jittered deterministically in its lane — honest at
   * any n, and the form that shows a bimodal run. `violin`: mirrored densities, baseline above
   * the centre line and candidate below; a side with fewer than 8 samples keeps its dots.
   */
  variant?: DistributionCompareVariant;
  /** The value axis. Default `linear`; `log` for samples spanning orders of magnitude. */
  scale?: 'linear' | 'log';
  /** `compact` lowers the chart and tightens type, for small multiples. Default `regular`. */
  density?: 'regular' | 'compact';
  /** Coverage of each side's median interval (the bracket under its median). Default 0.95. */
  level?: number;
  /** The chart's accessible name, also shown above it. Default `Sample distributions` (not shown). */
  title?: string;
  /** What each side is called. Default `baseline` and `candidate`. */
  labels?: { baseline?: string; candidate?: string };
}

/** Low-discrepancy jitter in `[-0.5, 0.5)` from the sample's index: deterministic, no PRNG, no clumping. */
const jitter = (index: number) => ((index * 0.6180339887498949) % 1) - 0.5;

/**
 * One benchmark's two sample distributions, baseline and candidate, on one value axis: every
 * sample as a dot in its lane (`strip`, the default) or mirrored densities (`violin`), each
 * side's median as a heavy tick with a distribution-free interval bracketed beneath it, and the
 * ratio, its interval and the classification printed under the chart.
 *
 * Baseline and candidate take the `delta` roles a diff uses for before and after — `removed` and
 * `added` — and are also told apart by lane and by label, so the colour only repeats them.
 * Geometry is a fixed `viewBox` scaled to the container's width: it renders in a static report
 * with no script and no measurement.
 */
export const DistributionCompare = forwardRef<HTMLDivElement, DistributionCompareProps>(function DistributionCompare(
  {
    baseline,
    candidate,
    unit,
    direction = 'lower-is-better',
    comparison: comparisonProp,
    options,
    variant = 'strip',
    scale = 'linear',
    density = 'regular',
    level = 0.95,
    title,
    labels,
    className,
    ...props
  },
  ref,
) {
  const id = useId();
  const styles = distributionCompare();
  const layout = LAYOUT[density] ?? LAYOUT.regular;
  const names = { baseline: labels?.baseline ?? 'baseline', candidate: labels?.candidate ?? 'candidate' };

  const sides = useMemo(
    () =>
      (['baseline', 'candidate'] as const).map((side) => {
        const samples = (side === 'baseline' ? baseline : candidate).filter((value) => Number.isFinite(value));
        return { side, samples, summary: summarize(samples), interval: medianInterval(samples, level) };
      }),
    [baseline, candidate, level],
  );
  const comparison = useMemo(
    () => comparisonProp ?? compareBenchmark({ name: title ?? 'benchmark', unit, direction, baseline, candidate }, options),
    [comparisonProp, title, unit, direction, baseline, candidate, options],
  );

  const all = sides.flatMap((s) => s.samples);
  if (!all.length) {
    return (
      <div ref={ref} data-slot="distribution-compare" data-empty="" {...props} className={styles.root({ className })}>
        {title ? <p className={styles.title()}>{title}</p> : null}
        <p className={styles.empty()}>No samples.</p>
      </div>
    );
  }

  let min = Infinity;
  let max = -Infinity;
  for (const value of all) {
    if (value < min) min = value;
    if (value > max) max = value;
  }
  const useLog = scale === 'log' && min > 0;
  const span = max - min || Math.abs(max) || 1;
  const domain: [number, number] = useLog ? [min / 1.05, max * 1.05] : [min - span * 0.06, max + span * 0.06];
  const innerWidth = WIDTH - layout.left - layout.right;
  const innerHeight = layout.height - layout.top - layout.bottom;
  const x = (value: number) =>
    layout.left + (useLog ? (Math.log(value / domain[0]) / Math.log(domain[1] / domain[0])) * innerWidth : ((value - domain[0]) / (domain[1] - domain[0])) * innerWidth);
  const display = benchmarkDisplayUnit(sides[0]!.summary.n ? sides[0]!.summary.median : sides[1]!.summary.median, unit);
  const ticks = useLog ? logTicks(domain[0], domain[1], 6) : scaleLinear<number>({ domain, range: [0, innerWidth] }).ticks(6);
  const formatTick = (value: number) => formatSignificant(value / display.factor);

  // Lanes: strip stacks baseline over candidate; violin mirrors them about one centre line.
  const half = innerHeight / 2;
  const centre = layout.top + half;
  const lane = (side: 'baseline' | 'candidate') =>
    variant === 'violin'
      ? { from: side === 'baseline' ? layout.top : centre, to: side === 'baseline' ? centre : layout.top + innerHeight, sign: side === 'baseline' ? -1 : 1 }
      : { from: side === 'baseline' ? layout.top : centre, to: side === 'baseline' ? centre : layout.top + innerHeight, sign: 0 };

  const curves = variant === 'violin'
    ? sides.map((s) => (s.samples.length >= MIN_DENSITY_SAMPLES ? kernelDensity(s.samples, domain[0], domain[1], 96) : []))
    : [[], []];
  const peak = Math.max(1e-12, ...curves.flatMap((curve) => curve.map((point) => point.density)));

  const describeSide = (s: (typeof sides)[number]) =>
    s.summary.n
      ? `${names[s.side]} n ${s.summary.n}, median ${formatSignificant(s.summary.median / display.factor)} ${display.unit}${s.interval ? ` (${formatPercent(s.interval.level)} ${formatSignificant(s.interval.low / display.factor)}–${formatSignificant(s.interval.high / display.factor)})` : ''}`
      : `${names[s.side]} has no samples`;
  const verdict =
    comparison.classification === 'inconclusive'
      ? `inconclusive${comparison.reason ? ` — ${INCONCLUSIVE_REASON_TEXT[comparison.reason]}` : ''}`
      : comparison.classification;
  const ratioText = comparison.ratio !== null
    ? `ratio ${formatRatio(comparison.ratio)}${comparison.interval ? ` (${formatPercent(comparison.interval.level)} ${formatRatio(comparison.interval.low)}–${formatRatio(comparison.interval.high)})` : ''}`
    : 'no ratio';
  const label = title ?? 'Sample distributions';
  const summary = `${describeSide(sides[0]!)}. ${describeSide(sides[1]!)}. ${ratioText}: ${verdict}.`;

  return (
    <div ref={ref} data-slot="distribution-compare" data-variant={variant} data-classification={comparison.classification} {...props} className={styles.root({ className })}>
      {title ? <p aria-hidden="true" className={styles.title()}>{title}</p> : null}
      <p id={`${id}-summary`} className="sr-only">{summary}</p>
      <svg role="img" aria-label={label} aria-describedby={`${id}-summary`} viewBox={`0 0 ${WIDTH} ${layout.height}`} width={WIDTH} height={layout.height} className={styles.chart()}>
        <g aria-hidden="true">
          {ticks.map((tick) => (
            <g key={tick} data-part="tick">
              <line x1={x(tick)} x2={x(tick)} y1={layout.top} y2={layout.top + innerHeight} className="stroke-edge-subtle" strokeDasharray="2 3" />
              <text x={x(tick)} y={layout.height - layout.bottom + layout.font + 6} textAnchor="middle" fontSize={layout.font} className="fill-content-muted">{formatTick(tick)}</text>
            </g>
          ))}
          <text x={WIDTH - layout.right} y={layout.height - 2} textAnchor="end" fontSize={layout.font} className="fill-content-muted">{display.unit}</text>
          <line x1={layout.left} x2={WIDTH - layout.right} y1={layout.top + innerHeight} y2={layout.top + innerHeight} className="stroke-edge-default" />
          {variant === 'violin' ? <line x1={layout.left} x2={WIDTH - layout.right} y1={centre} y2={centre} className="stroke-edge-default" /> : null}
          {sides.map((s, sideIndex) => {
            const { from, to, sign } = lane(s.side);
            const tone = s.side === 'baseline' ? 'delta-removed' : 'delta-added';
            const fill = s.side === 'baseline' ? 'fill-delta-removed' : 'fill-delta-added';
            const stroke = s.side === 'baseline' ? 'stroke-delta-removed' : 'stroke-delta-added';
            const curve = curves[sideIndex]!;
            const laneMid = (from + to) / 2;
            const laneHeight = to - from;
            let body: ReactNode;
            if (curve.length) {
              const y = (d: number) => centre + sign * (d / peak) * (half - 4);
              const path = `M${x(curve[0]!.value).toFixed(1)},${centre}${curve.map((p) => `L${x(p.value).toFixed(1)},${y(p.density).toFixed(1)}`).join('')}L${x(curve[curve.length - 1]!.value).toFixed(1)},${centre}Z`;
              body = <path data-part="density" d={path} fillOpacity={0.35} strokeWidth={1.25} className={cn(fill, stroke)} />;
            } else {
              body = (
                <g data-part="samples">
                  {s.samples.map((value, index) => (
                    <circle key={index} cx={x(value)} cy={laneMid + jitter(index) * laneHeight * 0.62} r={layout.dot} fillOpacity={0.6} className={fill} />
                  ))}
                </g>
              );
            }
            const labelY = variant === 'violin' ? (sign < 0 ? from + layout.font + 2 : to - 4) : laneMid;
            return (
              <g key={s.side} data-part="side" data-side={s.side} data-tone={tone}>
                <text x={layout.left - 8} y={labelY} textAnchor="end" dominantBaseline="central" fontSize={layout.font} className="fill-content-secondary">
                  {`${names[s.side]} n ${s.summary.n}`}
                </text>
                {body}
                {s.summary.n ? (
                  <g data-part="median">
                    {s.interval ? (
                      <g data-part="median-interval" className="stroke-content-primary" strokeWidth={1.25}>
                        <line x1={x(s.interval.low)} x2={x(s.interval.high)} y1={sign > 0 ? to - 3 : from + 3} y2={sign > 0 ? to - 3 : from + 3} />
                        <line x1={x(s.interval.low)} x2={x(s.interval.low)} y1={(sign > 0 ? to - 3 : from + 3) - 3} y2={(sign > 0 ? to - 3 : from + 3) + 3} />
                        <line x1={x(s.interval.high)} x2={x(s.interval.high)} y1={(sign > 0 ? to - 3 : from + 3) - 3} y2={(sign > 0 ? to - 3 : from + 3) + 3} />
                      </g>
                    ) : null}
                    <line x1={x(s.summary.median)} x2={x(s.summary.median)} y1={from + 6} y2={to - 6} strokeWidth={2.5} className="stroke-content-primary" />
                  </g>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
      <p data-part="readout" className={styles.readout()}>
        <span>{describeSide(sides[0]!)}</span>
        <span>{describeSide(sides[1]!)}</span>
        <span className={comparison.classification === 'inconclusive' ? 'text-content-muted' : 'text-content-primary'}>{`${ratioText} · ${verdict}`}</span>
      </p>
    </div>
  );
});

DistributionCompare.displayName = 'DistributionCompare';
