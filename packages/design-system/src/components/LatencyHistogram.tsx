'use client';

import { scaleLinear, scaleLog } from '@visx/scale';
import { forwardRef, useCallback, useEffect, useId, useMemo, useState, type HTMLAttributes, type KeyboardEvent, type MouseEvent } from 'react';
import { cn, recipe } from '../lib/recipe';
import {
  bucketPercentile,
  formatCount,
  formatLatencyRange,
  formatRequests,
  formatShare,
  histogram,
  latencyBuckets,
  latencyExtent,
  linearBuckets,
  logTicks,
  percentiles as samplePercentiles,
  shareAbove,
  type LatencyBucket,
} from '../lib/latency';
import { formatTraceDuration } from '../lib/trace';

/** Width used before (or without) a measurement — jsdom, a server render. */
const FALLBACK_WIDTH = 640;
const LAYOUT = {
  regular: { margin: { top: 42, right: 16, bottom: 24, left: 44 }, font: 10, line: 12, height: 180, tickGap: 16 },
  compact: { margin: { top: 32, right: 8, bottom: 18, left: 34 }, font: 9, line: 10, height: 120, tickGap: 13 },
} as const;

/** Every value each enumerable prop accepts, first the default — for stories and evaluation grids to iterate. */
export const LATENCY_HISTOGRAM_VARIANTS = {
  scale: ['log', 'linear'],
  binning: ['log', 'linear'],
  bar: ['bars', 'steps', 'outline'],
  markers: ['lines', 'labels', 'none'],
  density: ['regular', 'compact'],
  cumulative: [false, true],
} as const satisfies Record<string, readonly unknown[]>;

/** Track an element's content width; `FALLBACK_WIDTH` until it reports one. */
function useMeasuredWidth(): [(node: HTMLDivElement | null) => void, number] {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!node) return undefined;
    const measure = () => setWidth(Math.floor(node.getBoundingClientRect().width));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return [setNode, width > 0 ? width : FALLBACK_WIDTH];
}

/** The CDF overlay: a step-free line through each bucket's upper edge at its running share. */
function cumulativePath(buckets: readonly LatencyBucket[], total: number, x: (value: number) => number, innerHeight: number): string {
  if (!buckets.length || !total) return '';
  const parts = [`M${x(buckets[0]!.from).toFixed(1)},${innerHeight}`];
  let seen = 0;
  for (const bucket of buckets) {
    seen += bucket.count;
    parts.push(`L${x(bucket.to).toFixed(1)},${(innerHeight * (1 - seen / total)).toFixed(1)}`);
  }
  return parts.join('');
}

const latencyHistogram = recipe({
  slots: {
    root: 'flex min-w-0 flex-col gap-1 font-mono text-xs text-content-primary',
    title: 'text-xs uppercase tracking-wide text-content-secondary',
    frame: 'w-full min-w-0',
    chart: 'block max-w-full cursor-crosshair overflow-visible focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
    readout: 'min-h-[1.5em] tabular-nums text-content-secondary',
    empty: 'border border-dashed border-edge-default px-3 py-6 text-center text-content-muted',
  },
});

/** A service-level objective line. */
export interface LatencySlo {
  /** The threshold, in milliseconds. */
  value: number;
  /** The line's label. Default `SLO <value>`. */
  label?: string;
}

export interface LatencyHistogramProps extends HTMLAttributes<HTMLDivElement> {
  /** Raw latencies, in milliseconds. Bucketed here; ignored when `buckets` is given. */
  samples?: readonly number[];
  /** Pre-bucketed counts, for when only a histogram is stored. Percentiles are then estimated. */
  buckets?: readonly LatencyBucket[];
  /** Percentiles drawn as labelled markers. Default `[50, 90, 99]`; `[]` draws none. */
  percentiles?: readonly number[];
  /** A latency objective: a dashed danger line, and the bars wholly past it tinted danger. */
  slo?: LatencySlo;
  /** The x axis. Default `log` — latency spans orders of magnitude. Falls back to linear for buckets that start at 0. */
  scale?: 'log' | 'linear';
  /** How `samples` are cut into buckets: equal ratios (`log`) or equal widths (`linear`). Default follows `scale`. */
  binning?: 'log' | 'linear';
  /** How many buckets to cut `samples` into. Default 40. */
  bins?: number;
  /** Lower latency bound for the buckets, in milliseconds. Default the fastest sample. */
  min?: number;
  /** Upper latency bound for the buckets, in milliseconds. Default the slowest sample. */
  max?: number;
  /** Height of the chart in pixels. Default 180. */
  height?: number;
  /** The chart's accessible name, also shown above it. Default `Latency distribution` (not shown). */
  title?: string;
  /** Format a latency for labels. Default `formatTraceDuration` (`412ms`, `1.24s`). */
  formatValue?: (ms: number) => string;
  /** How buckets are drawn: filled `bars` (default), a `steps` outline along their tops, or `outline` boxes with a faint fill. */
  bar?: 'bars' | 'steps' | 'outline';
  /** Overlay the cumulative share (a CDF, 0–100% on the right). Default false. */
  cumulative?: boolean;
  /** Percentile markers: full-height `lines` with labels (default), `labels` with a short tick only, or `none`. The summary still says them. */
  markers?: 'lines' | 'labels' | 'none';
  /** `compact` tightens margins and type and lowers the default height to 120. Default `regular`. */
  density?: 'regular' | 'compact';
}

/**
 * A latency histogram: how many requests took how long, on a log axis by
 * default, with p50 / p90 / p99 markers and an optional SLO line past which the
 * bars turn to the danger role.
 *
 * The bars are one tab stop — a one-row grid whose active cell Left and Right
 * move (Home and End jump to the ends) — and hovering a bar reads it out:
 * `120–180ms · 342 requests`. A screen reader gets the count, the percentiles
 * and the share over the SLO as a summary. Geometry is SVG attributes only.
 */
export const LatencyHistogram = forwardRef<HTMLDivElement, LatencyHistogramProps>(function LatencyHistogram(
  {
    samples,
    buckets: bucketsProp,
    percentiles: ps = [50, 90, 99],
    slo,
    scale = 'log',
    binning,
    bins = 40,
    min,
    max,
    height: heightProp,
    title,
    formatValue = formatTraceDuration,
    bar = 'bars',
    cumulative = false,
    markers: markerStyle = 'lines',
    density = 'regular',
    className,
    ...props
  },
  ref,
) {
  const id = useId();
  const layout = LAYOUT[density] ?? LAYOUT.regular;
  const height = heightProp ?? layout.height;
  const MARGIN = useMemo(() => (cumulative ? { ...layout.margin, right: layout.margin.right + 26 } : layout.margin), [cumulative, layout]);
  const bucketing = binning ?? scale;
  const styles = latencyHistogram();
  const [measureRef, width] = useMeasuredWidth();

  const buckets = useMemo<LatencyBucket[]>(() => {
    if (bucketsProp) return bucketsProp.filter((bucket) => Number.isFinite(bucket.from) && Number.isFinite(bucket.to) && bucket.to > bucket.from).map((bucket) => ({ ...bucket }));
    const values = (samples ?? []).filter((value) => Number.isFinite(value));
    if (!values.length) return [];
    if (bucketing === 'linear') {
      // A linear axis starts at zero; a log axis cannot, so linear bins on it start at the fastest sample.
      const lo = min ?? (scale === 'linear' ? Math.min(0, ...values) : Math.min(...values));
      const hi = max ?? Math.max(...values);
      return histogram(values, linearBuckets(lo, hi, bins));
    }
    const extent = latencyExtent(values);
    return histogram(values, latencyBuckets(min ?? extent?.min ?? 1, max ?? extent?.max ?? 1000, bins));
  }, [bucketsProp, samples, bucketing, scale, bins, min, max]);

  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  const markers = useMemo(() => {
    const values = bucketsProp || !samples ? ps.map((p) => bucketPercentile(buckets, p)) : samplePercentiles(samples, ps);
    return ps.map((p, index) => ({ p, value: values[index]! })).filter((marker) => Number.isFinite(marker.value));
  }, [bucketsProp, samples, buckets, ps]);
  const overSlo = useMemo(() => {
    if (!slo || !total) return null;
    if (samples && !bucketsProp) return shareAbove(samples, slo.value);
    return buckets.reduce((sum, bucket) => sum + (bucket.from >= slo.value ? bucket.count : 0), 0) / total;
  }, [slo, total, samples, bucketsProp, buckets]);

  const [active, setActive] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [focused, setFocused] = useState(false);
  const busiest = useMemo(() => buckets.reduce((best, bucket, index) => (bucket.count > (buckets[best]?.count ?? -1) ? index : best), 0), [buckets]);
  const activeIndex = active !== null && active < buckets.length ? active : null;
  const shown = hover ?? (focused ? activeIndex : null);

  const innerWidth = Math.max(10, width - MARGIN.left - MARGIN.right);
  const innerHeight = Math.max(10, height - MARGIN.top - MARGIN.bottom);
  const lo = buckets[0]?.from ?? 0;
  const hi = buckets[buckets.length - 1]?.to ?? 1;
  const useLog = scale === 'log' && lo > 0;
  const xScale = useMemo(
    () => (useLog ? scaleLog<number>({ domain: [lo, hi], range: [0, innerWidth] }) : scaleLinear<number>({ domain: [lo, hi], range: [0, innerWidth] })),
    [useLog, lo, hi, innerWidth],
  );
  const maxCount = Math.max(1, ...buckets.map((bucket) => bucket.count));
  const yScale = useMemo(() => scaleLinear<number>({ domain: [0, maxCount], range: [innerHeight, 0], nice: true }), [maxCount, innerHeight]);
  const xTicks = useLog ? logTicks(lo, hi, Math.max(2, Math.floor(innerWidth / 64))) : xScale.ticks(Math.max(2, Math.floor(innerWidth / 80)));
  const yTicks = yScale.ticks(3);

  const bucketAt = useCallback((event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = box.width > 0 ? width / box.width : 1;
    const x = (event.clientX - box.left) * ratio - MARGIN.left;
    if (x < 0 || x > innerWidth) return null;
    const value = xScale.invert(x);
    const index = buckets.findIndex((bucket, i) => value >= bucket.from && (value < bucket.to || i === buckets.length - 1));
    return index < 0 ? null : index;
  }, [width, innerWidth, xScale, buckets, MARGIN]);

  const describe = (bucket: LatencyBucket) => `${formatLatencyRange(bucket.from, bucket.to, formatValue)} · ${formatRequests(bucket.count)}`;

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const current = activeIndex ?? busiest;
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = Math.min(buckets.length - 1, current + 1); break;
      case 'ArrowLeft': next = Math.max(0, current - 1); break;
      case 'Home': next = 0; break;
      case 'End': next = buckets.length - 1; break;
      default: return;
    }
    event.preventDefault();
    setHover(null);
    setActive(next);
  };

  if (!total) {
    return (
      <div ref={ref} data-slot="latency-histogram" data-empty="" {...props} className={styles.root({ className })}>
        {title ? <p className={styles.title()}>{title}</p> : null}
        <p className={styles.empty()}>No samples.</p>
      </div>
    );
  }

  const markerText = markers.map((marker) => `p${marker.p} ${formatValue(marker.value)}`).join(', ');
  const summary = [
    `${formatRequests(total)}.`,
    markerText ? `${markerText}.` : '',
    slo && overSlo !== null ? `${formatShare(overSlo)} over the ${formatValue(slo.value)} objective.` : '',
  ].filter(Boolean).join(' ');
  const cdfPath = cumulativePath(buckets, total, (value) => xScale(value), innerHeight);
  const sloX = slo && slo.value >= lo && slo.value <= hi ? xScale(slo.value) : null;
  const label = title ?? 'Latency distribution';

  return (
    <div ref={ref} data-slot="latency-histogram" {...props} className={styles.root({ className })}>
      {title ? <p aria-hidden="true" className={styles.title()}>{title}</p> : null}
      <p id={`${id}-summary`} className="sr-only">{summary}</p>
      <div ref={measureRef} className={styles.frame()}>
        <svg
          role="grid"
          tabIndex={0}
          aria-label={label}
          aria-describedby={`${id}-summary`}
          aria-activedescendant={focused && activeIndex !== null ? `${id}-b${activeIndex}` : undefined}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className={styles.chart()}
          onKeyDown={onKeyDown}
          onFocus={() => { setFocused(true); if (activeIndex === null) setActive(busiest); }}
          onBlur={() => setFocused(false)}
          onMouseMove={(event) => setHover(bucketAt(event))}
          onMouseLeave={() => setHover(null)}
        >
          <g aria-hidden="true" transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {yTicks.map((tick) => (
              <g key={tick}>
                <line x1={0} x2={innerWidth} y1={yScale(tick)} y2={yScale(tick)} className="stroke-edge-subtle" strokeDasharray={tick === 0 ? undefined : '2 3'} />
                <text x={-6} y={yScale(tick)} textAnchor="end" dominantBaseline="central" fontSize={layout.font} className="fill-content-muted">{formatCount(tick)}</text>
              </g>
            ))}
            {xTicks.map((tick) => (
              <g key={tick} transform={`translate(${xScale(tick)},${innerHeight})`}>
                <line y1={0} y2={4} className="stroke-edge-default" />
                <text y={layout.tickGap} textAnchor="middle" fontSize={layout.font} className="fill-content-muted">{formatValue(tick)}</text>
              </g>
            ))}
          </g>
          <g role="row" transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {buckets.map((bucket, index) => {
              const x0 = xScale(bucket.from);
              const x1 = xScale(bucket.to);
              const barWidth = Math.max(1, x1 - x0 - (x1 - x0 > 4 ? 1 : 0));
              const y = yScale(bucket.count);
              const over = slo ? bucket.from >= slo.value : false;
              const lit = index === shown;
              return (
                <rect
                  key={index}
                  id={`${id}-b${index}`}
                  role="gridcell"
                  aria-label={describe(bucket)}
                  aria-selected={focused && index === activeIndex}
                  data-over-slo={over || undefined}
                  data-active={lit || undefined}
                  x={x0}
                  y={y}
                  width={barWidth}
                  height={Math.max(0, innerHeight - y)}
                  fillOpacity={bar === 'steps' ? (lit ? 0.15 : 0) : bar === 'outline' ? (lit ? 0.35 : 0.15) : shown === null || lit ? 1 : 0.7}
                  strokeWidth={lit ? 1.5 : bar === 'outline' ? 1 : 0}
                  className={cn(
                    over ? 'fill-intent-danger' : 'fill-accent-primary',
                    bar === 'outline' && (over ? 'stroke-intent-danger' : 'stroke-accent-primary'),
                    lit && 'stroke-content-primary',
                  )}
                />
              );
            })}
          </g>
          {bar === 'steps' ? (
            <g aria-hidden="true" data-part="steps" transform={`translate(${MARGIN.left},${MARGIN.top})`} fill="none" strokeWidth={1.5}>
              {buckets.map((bucket, index) => {
                const previous = index ? yScale(buckets[index - 1]!.count) : innerHeight;
                const y = yScale(bucket.count);
                const x1 = xScale(bucket.to);
                const closing = index === buckets.length - 1 ? `V${innerHeight}` : '';
                return (
                  <path key={index} d={`M${xScale(bucket.from)},${previous}V${y}H${x1}${closing}`} className={slo && bucket.from >= slo.value ? 'stroke-intent-danger' : 'stroke-accent-primary'} />
                );
              })}
            </g>
          ) : null}
          {cumulative ? (
            <g aria-hidden="true" data-part="cumulative" transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              <path d={cdfPath} fill="none" strokeWidth={1.5} strokeLinejoin="round" className="stroke-accent-secondary" />
              {[0, 0.5, 1].map((share) => (
                <text key={share} x={innerWidth + 6} y={innerHeight * (1 - share)} dominantBaseline="central" fontSize={layout.font} className="fill-accent-secondary">{`${share * 100}%`}</text>
              ))}
            </g>
          ) : null}
          <g aria-hidden="true" transform={`translate(${MARGIN.left},0)`}>
            {(markerStyle === 'none' ? [] : markers).map((marker, index) => {
              const x = xScale(Math.max(lo, Math.min(hi, marker.value)));
              const flip = x > innerWidth - 72;
              const top = 4 + index * layout.line;
              return (
                <g key={marker.p} data-part="percentile" data-percentile={marker.p}>
                  <line x1={x} x2={x} y1={top} y2={markerStyle === 'labels' ? MARGIN.top : MARGIN.top + innerHeight} className="stroke-content-primary" strokeWidth={1} />
                  <text x={flip ? x - 4 : x + 4} y={top} dominantBaseline="hanging" textAnchor={flip ? 'end' : 'start'} fontSize={layout.font} className="fill-content-primary">
                    {`p${marker.p} ${formatValue(marker.value)}`}
                  </text>
                </g>
              );
            })}
            {slo && sloX !== null ? (
              <g data-part="slo">
                <line x1={sloX} x2={sloX} y1={MARGIN.top} y2={MARGIN.top + innerHeight} className="stroke-intent-danger" strokeWidth={1.5} strokeDasharray="4 3" />
                <text x={sloX > innerWidth - 72 ? sloX - 4 : sloX + 4} y={MARGIN.top + innerHeight - 4} textAnchor={sloX > innerWidth - 72 ? 'end' : 'start'} fontSize={layout.font} className="fill-intent-danger">
                  {slo.label ?? `SLO ${formatValue(slo.value)}`}
                </text>
              </g>
            ) : null}
          </g>
        </svg>
      </div>
      <p aria-hidden="true" data-part="readout" className={styles.readout()}>
        {shown !== null && buckets[shown] ? describe(buckets[shown]) : `${formatRequests(total)}${markerText ? ` · ${markerText.replace(/, /g, ' · ')}` : ''}${slo && overSlo !== null ? ` · ${formatShare(overSlo)} over SLO` : ''}`}
      </p>
    </div>
  );
});

LatencyHistogram.displayName = 'LatencyHistogram';
