'use client';

import { useParentSize } from '@visx/responsive';
import { scaleLinear, scaleLog, scaleTime } from '@visx/scale';
import {
  forwardRef,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { cn, recipe } from '../lib/recipe';
import { formatTimeTick, formatTimestamp, timeTicks, type TimeRange } from '../lib/timeRange';
import {
  areaPath,
  cleanPoints,
  clipPoints,
  fittedDomain,
  labelRows,
  formatMetric,
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
  unionTimes,
  valueDomain,
  withUnit,
  type PlotBand,
  type PlotPoint,
  type TimeSeries,
  type TimeSeriesCurve,
} from '../lib/timeSeries';
import { ChartTooltip } from './ChartTooltip';
import { useTimeCursor, useTimeRange } from './TimeRange';

export type { TimeSeries, TimeSeriesCurve, TimeSeriesPoint } from '../lib/timeSeries';

/** A horizontal line the values should stay under. */
export interface TimeSeriesThreshold {
  /** Where the line sits, in the chart's value units. */
  value: number;
  /** What the line is called — drawn beside it and read in the summary. */
  label: string;
  /** How bad crossing it is. A danger threshold also tints the band above it. */
  intent: 'warning' | 'danger';
}

/** A vertical marker at a moment — a deploy, an incident, a config change. */
export interface TimeSeriesAnnotation {
  /** When, in epoch milliseconds. Outside the x domain it is not drawn. */
  time: number;
  /** Short text drawn at the top of the marker and read in the summary. */
  label: string;
  /** Colour role of the marker. Default `info`. */
  intent?: 'info' | 'warning' | 'danger';
}

/**
 * Every allowed value of each union prop, so a story or a test can iterate
 * them. `yDomain` also takes an explicit `[min, max]` tuple, not listed.
 */
export const TIME_SERIES_VARIANTS = {
  variant: ['line', 'area', 'stacked'],
  curve: ['linear', 'monotone', 'step'],
  points: ['none', 'hover', 'all'],
  grid: ['none', 'horizontal', 'both'],
  yScale: ['linear', 'log'],
  yDomain: ['zero', 'data'],
  legend: ['top', 'bottom', 'none', 'inline'],
  colorStrategy: ['categorical', 'emphasis'],
  density: ['regular', 'compact'],
} as const;

/** How the series are drawn. */
export type TimeSeriesVariant = (typeof TIME_SERIES_VARIANTS.variant)[number];
/** Where point markers are drawn: never, at the cursor, or at every sample. */
export type TimeSeriesPointMarkers = (typeof TIME_SERIES_VARIANTS.points)[number];
/** Which grid lines are drawn. */
export type TimeSeriesGrid = (typeof TIME_SERIES_VARIANTS.grid)[number];
/** The value scale. */
export type TimeSeriesYScale = (typeof TIME_SERIES_VARIANTS.yScale)[number];
/** The value domain: from zero, fitted to the data, or explicit. */
export type TimeSeriesYDomain = (typeof TIME_SERIES_VARIANTS.yDomain)[number] | readonly [min: number, max: number];
/** Where the legend goes; `inline` labels each line at its end instead. */
export type TimeSeriesLegend = (typeof TIME_SERIES_VARIANTS.legend)[number];
/** How series are coloured. */
export type TimeSeriesColorStrategy = (typeof TIME_SERIES_VARIANTS.colorStrategy)[number];
/** Spacing and type size. */
export type TimeSeriesDensity = (typeof TIME_SERIES_VARIANTS.density)[number];

/** Width used until the container is measured (and always, in jsdom). */
const FALLBACK_WIDTH = 640;
/** A drag narrower than this many pixels is a click, not a zoom. */
const MIN_BRUSH = 4;
const TOOLTIP_WIDTH = 196;

/**
 * Series colours, cycling, addressed by role — and only two of them.
 *
 * The roles name fewer distinct colours than they look like: `intent.info`
 * is `accent.primary` on both levels, `intent.success` is `accent.secondary`
 * on sketch and `intent.warning` is on midnight, and `accent.tertiary` is
 * `intent.danger` on both (#398). Only primary and secondary are a pair that
 * differs, and means nothing, on every level. So the cycle is those two and a
 * neutral, and from the fourth series on lines are told apart by dash pattern
 * rather than by a colour that would collide or claim a meaning. A series
 * whose colour does mean something says so with `tone` (a 5xx series is
 * `danger`). Spelled out in full so Tailwind's scanner sees every class.
 */
const SERIES_TONES = [
  { stroke: 'stroke-accent-primary', fill: 'fill-accent-primary', swatch: 'bg-accent-primary' },
  { stroke: 'stroke-accent-secondary', fill: 'fill-accent-secondary', swatch: 'bg-accent-secondary' },
  { stroke: 'stroke-content-secondary', fill: 'fill-content-secondary', swatch: 'bg-content-secondary' },
] as const;
/** Dash patterns for each pass through the cycle after the first. */
const SERIES_DASHES = [undefined, '6 3', '2 3', '8 3 2 3'] as const;
/** The roles a caller may pin a series to, when its colour carries a meaning. */
const NAMED_TONES = {
  primary: SERIES_TONES[0],
  secondary: SERIES_TONES[1],
  neutral: SERIES_TONES[2],
  info: { stroke: 'stroke-intent-info', fill: 'fill-intent-info', swatch: 'bg-intent-info' },
  success: { stroke: 'stroke-intent-success', fill: 'fill-intent-success', swatch: 'bg-intent-success' },
  warning: { stroke: 'stroke-intent-warning', fill: 'fill-intent-warning', swatch: 'bg-intent-warning' },
  danger: { stroke: 'stroke-intent-danger', fill: 'fill-intent-danger', swatch: 'bg-intent-danger' },
} as const;
type Tone = { stroke: string; fill: string; swatch: string; dash?: string };

/** A short line sample of a series' stroke — colour and, past the third series, dash. */
function Swatch({ tone, className }: { tone: Tone; className?: string }) {
  return (
    <svg aria-hidden="true" width={16} height={8} className={cn('shrink-0 overflow-visible', className)}>
      <line x1={0} x2={16} y1={4} y2={4} className={tone.stroke} strokeWidth={3} strokeDasharray={tone.dash} />
    </svg>
  );
}
/** What every series but the emphasised one wears under `colorStrategy="emphasis"`. */
const MUTED_TONE: Tone = { stroke: 'stroke-content-muted', fill: 'fill-content-muted', swatch: 'bg-content-muted' };

const MARK_TONES = {
  info: { stroke: 'stroke-intent-info', fill: 'fill-intent-info' },
  warning: { stroke: 'stroke-intent-warning', fill: 'fill-intent-warning' },
  danger: { stroke: 'stroke-intent-danger', fill: 'fill-intent-danger' },
} as const;

const timeSeriesChart = recipe({
  slots: {
    root: 'flex min-w-0 flex-col gap-2 font-mono text-xs text-content-primary',
    title: 'text-xs font-bold uppercase tracking-wider text-content-secondary',
    frame: 'w-full min-w-0',
    plot: 'relative block w-full touch-pan-y select-none',
    svg: 'block max-w-full overflow-visible',
    tick: 'fill-content-muted font-mono text-[10px] tabular-nums',
    mark: 'font-mono text-[10px] font-bold',
    legend: 'flex flex-wrap gap-1.5',
    toggle: 'inline-flex cursor-pointer items-center gap-1.5 border border-edge-default px-2 py-0.5 text-content-primary transition-colors hover:bg-surface-raised motion-reduce:transition-none aria-[pressed=false]:text-content-muted aria-[pressed=false]:line-through',
    readout: 'flex items-center justify-between gap-3 tabular-nums',
  },
  variants: {
    zoomable: { true: { plot: 'cursor-crosshair' } },
    compact: {
      true: {
        root: 'gap-1 text-[10px]',
        title: 'text-[10px]',
        tick: 'text-[9px]',
        mark: 'text-[9px]',
        legend: 'gap-1',
        toggle: 'gap-1 px-1.5 py-0',
      },
    },
  },
});

/** A value that is controlled when the prop is defined, and owned here otherwise. */
function useControllable<T>(value: T | undefined, initial: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [owned, setOwned] = useState(initial);
  const current = value === undefined ? owned : value;
  const set = useCallback((next: T) => {
    if (value === undefined) setOwned(next);
    onChange?.(next);
  }, [value, onChange]);
  return [current, set];
}

/** Stand-in for environments without `ResizeObserver` (jsdom, old runtimes): never measures. */
class NoResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
const resizeObserverPolyfill = typeof ResizeObserver === 'undefined' ? (NoResizeObserver as unknown as typeof ResizeObserver) : undefined;

/** Plot insets for a density, with room for axes, inline labels and annotation labels as needed. */
function plotMargin(compact: boolean, showAxes: boolean, inline: boolean, annotated: boolean) {
  const margin = showAxes
    ? (compact ? { top: 10, right: 8, bottom: 18, left: 36 } : { top: 14, right: 16, bottom: 26, left: 52 })
    : (compact ? { top: 4, right: 4, bottom: 4, left: 4 } : { top: 8, right: 8, bottom: 8, left: 8 });
  if (inline) margin.right += compact ? 56 : 84;
  if (annotated) margin.top += compact ? 8 : 10;
  return margin;
}

const NO_THRESHOLDS: readonly TimeSeriesThreshold[] = [];
const NO_ANNOTATIONS: readonly TimeSeriesAnnotation[] = [];

const isDecade = (tick: number) => Math.abs(Math.log10(tick) - Math.round(Math.log10(tick))) < 1e-9;

export interface TimeSeriesChartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The series to draw. `null` values are gaps: lines and areas break there. */
  series: readonly TimeSeries[];
  /** `line` (default), `area` (filled to zero), or `stacked` areas. */
  variant?: TimeSeriesVariant;
  /** How a line joins its samples: `linear` (default), `monotone` cubic, or mid-point `step`. */
  curve?: TimeSeriesCurve;
  /** Line width in pixels. Default 1.5. */
  strokeWidth?: number;
  /** Point markers: `none`, `hover` (at the cursor, default) or `all` samples. */
  points?: TimeSeriesPointMarkers;
  /** Opacity of area fills, 0–1. Default 0.2 for `area`, 0.35 for `stacked`. */
  fillOpacity?: number;
  /** Grid lines: `none`, `horizontal` (default) or `both`. */
  grid?: TimeSeriesGrid;
  /**
   * `linear` (default) or `log`. A log scale cannot place zero or a negative
   * value: those samples are drawn as gaps and left out of the domain, and
   * stacked bands and area fills start from the bottom of the plot.
   */
  yScale?: TimeSeriesYScale;
  /**
   * The value domain: `zero` (default) runs from zero — or from the minimum
   * when values go negative — and includes thresholds; `data` fits the visible
   * values; a `[min, max]` tuple is used as given. A log scale always fits the
   * positive data unless given a positive tuple.
   */
  yDomain?: TimeSeriesYDomain;
  /** Legend placement: `top`, `bottom` (default), `none`, or `inline` labels at the end of each line (no toggles). */
  legend?: TimeSeriesLegend;
  /** `categorical` (default) cycles role colours; `emphasis` draws one series in the primary accent and mutes the rest. */
  colorStrategy?: TimeSeriesColorStrategy;
  /** The series `emphasis` highlights. Default: the first series. */
  emphasisSeriesId?: string;
  /** `regular` (default) or `compact` — smaller insets and type, no unit caption — for cards and small multiples. */
  density?: TimeSeriesDensity;
  /** Vertical markers at moments in time, such as deploys. */
  annotations?: readonly TimeSeriesAnnotation[];
  /** Draw the axes and their labels. Default true; false gives a sparkline-like plot. */
  showAxes?: boolean;
  /** Dashed horizontal lines with labels. A danger threshold tints the band above it. */
  thresholds?: readonly TimeSeriesThreshold[];
  /**
   * The x domain. Defaults to the `TimeRangeProvider`'s range, else the data's
   * extent. Points outside it are clipped.
   */
  range?: TimeRange;
  /** Formats values on the axis, readout and summary. Default: compact, three significant digits. */
  formatValue?: (value: number) => string;
  /** Unit for values — on the axis, and for any series without its own. */
  unit?: string;
  /** Ids of hidden series. Controlled when defined. */
  hiddenSeries?: readonly string[];
  /** Ids hidden on mount when uncontrolled. */
  defaultHiddenSeries?: readonly string[];
  /** Called with the new hidden set when a legend toggle is pressed. */
  onHiddenSeriesChange?: (ids: string[]) => void;
  /**
   * Called with the window a drag selects. Inside a `TimeRangeProvider` the
   * provider's range is set as well; outside one this is the only effect.
   */
  onRangeSelect?: (range: TimeRange) => void;
  /** Drag across the plot to select a window. Default true. */
  zoomable?: boolean;
  /** Height of the plot in pixels, axes included. Default 220. */
  height?: number;
  /** The chart's accessible name, and a small heading above it. */
  title?: string;
  /** Draw `title` as a visible heading. Default true; the accessible name stays either way. */
  showTitle?: boolean;
}

/**
 * The metrics chart of an observability dashboard: lines, areas or stacked
 * areas over time, with thresholds, annotations, a legend that hides series, a
 * crosshair readout and drag-to-zoom.
 *
 * Inside a `TimeRangeProvider` it draws the shared window, writes the shared
 * cursor as the pointer moves — so every chart on the page draws the same
 * moment — and a drag zooms them all. Outside one it works from its own
 * `range` and a cursor of its own.
 *
 * The plot is a single tab stop with slider semantics: Left and Right step the
 * cursor sample by sample, Home and End jump to the ends, Escape clears it, and
 * the value text reads every visible series at that moment. Min, max and
 * latest per series are written out for screen readers. Colours are roles,
 * cycling through five; `accent-tertiary` is never used, so danger keeps its
 * meaning. Every design choice — curve, markers, grid, scale, domain, legend,
 * colouring, density — is a prop; `TIME_SERIES_VARIANTS` lists their values.
 */
export const TimeSeriesChart = forwardRef<HTMLDivElement, TimeSeriesChartProps>(function TimeSeriesChart(
  {
    series,
    variant = 'line',
    curve = 'linear',
    strokeWidth = 1.5,
    points: pointMarkers = 'hover',
    fillOpacity,
    grid = 'horizontal',
    yScale: yScaleType = 'linear',
    yDomain = 'zero',
    legend = 'bottom',
    colorStrategy = 'categorical',
    emphasisSeriesId,
    density = 'regular',
    annotations = NO_ANNOTATIONS,
    showAxes = true,
    thresholds = NO_THRESHOLDS,
    range: rangeProp,
    formatValue = formatMetric,
    unit,
    hiddenSeries: hiddenProp,
    defaultHiddenSeries = [],
    onHiddenSeriesChange,
    onRangeSelect,
    zoomable = true,
    height = 220,
    title,
    showTitle = true,
    className,
    ...props
  },
  ref,
) {
  const shared = useTimeRange();
  const sharedCursor = useTimeCursor();
  const [localCursor, setLocalCursor] = useState<number | null>(null);
  const cursor = sharedCursor ? sharedCursor.cursor : localCursor;
  const setCursor = sharedCursor ? sharedCursor.setCursor : setLocalCursor;

  const [hiddenList, setHiddenList] = useControllable<readonly string[]>(hiddenProp, defaultHiddenSeries, onHiddenSeriesChange as ((ids: readonly string[]) => void) | undefined);
  const hidden = useMemo(() => new Set(hiddenList), [hiddenList]);

  const compact = density === 'compact';
  const log = yScaleType === 'log';
  const inline = legend === 'inline';
  const plottable = useCallback((value: number | null): value is number => value !== null && (!log || value > 0), [log]);

  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const clipId = `tsc-clip-${uid}`;
  const summaryId = `tsc-summary-${uid}`;

  // Clean once; every series keeps its colour by position, hidden or not.
  const emphasised = emphasisSeriesId ?? series[0]?.id;
  const all = useMemo(
    () => series.map((entry, index) => {
      const cycled: Tone = { ...SERIES_TONES[index % SERIES_TONES.length]!, dash: SERIES_DASHES[Math.floor(index / SERIES_TONES.length) % SERIES_DASHES.length] };
      const tone: Tone = colorStrategy === 'emphasis'
        ? (entry.id === emphasised ? SERIES_TONES[0] : MUTED_TONE)
        : entry.tone ? NAMED_TONES[entry.tone] : cycled;
      return { ...entry, points: cleanPoints(entry.points), tone };
    }),
    [series, colorStrategy, emphasised],
  );
  const domain = useMemo(() => resolveTimeDomain(rangeProp, shared?.range, all), [rangeProp, shared?.range, all]);

  const visible = useMemo(() => {
    if (!domain) return [];
    return all
      .filter((entry) => !hidden.has(entry.id))
      .map((entry) => ({ ...entry, inRange: pointsInRange(entry.points, domain), drawn: clipPoints(entry.points, domain) }));
  }, [all, hidden, domain]);
  const hasData = visible.some((entry) => entry.inRange.some(([, value]) => plottable(value)));
  const annotationsInDomain = useMemo(
    () => (domain ? annotations.filter((note) => note.time >= domain.from && note.time <= domain.to) : []),
    [annotations, domain],
  );

  const margin = plotMargin(compact, showAxes, inline, annotationsInDomain.length > 0);
  const { parentRef, width: measured } = useParentSize({ debounceTime: 50, ignoreDimensions: ['height', 'top', 'left'], resizeObserverPolyfill });
  const width = measured > 0 ? measured : FALLBACK_WIDTH;
  const innerWidth = Math.max(1, width - margin.left - margin.right);
  const innerHeight = Math.max(1, height - margin.top - margin.bottom);

  const stacked = useMemo(() => (variant === 'stacked' ? stackSeries(visible.map((entry) => entry.drawn)) : null), [variant, visible]);

  const xScale = useMemo(
    () => scaleTime<number>({ domain: domain ? [domain.from, domain.to] : [0, 1], range: [0, innerWidth] }),
    [domain, innerWidth],
  );

  const y = useMemo(() => {
    const values: number[] = [];
    if (stacked && domain) {
      stacked.layers.forEach((layer) => layer.forEach((point) => {
        if (point.value !== null && point.time >= domain.from && point.time <= domain.to) values.push(point.y0, point.y1);
      }));
    } else {
      visible.forEach((entry) => entry.inRange.forEach(([, value]) => { if (value !== null) values.push(value); }));
    }
    const levels = thresholds.map((threshold) => threshold.value);
    const explicit = Array.isArray(yDomain) && Number.isFinite(yDomain[0]) && Number.isFinite(yDomain[1]) && yDomain[0] !== yDomain[1]
      ? ([Math.min(yDomain[0], yDomain[1]), Math.max(yDomain[0], yDomain[1])] as [number, number])
      : null;
    const nTicks = Math.max(2, Math.floor(innerHeight / (compact ? 30 : 40)));
    if (log) {
      const positive = explicit && explicit[0] > 0 ? explicit : null;
      const scale = scaleLog<number>({ domain: positive ?? logDomain(values, levels), range: [innerHeight, 0], nice: !positive });
      const ticksAll = scale.ticks(nTicks);
      const ticks = ticksAll.length > nTicks + 2 ? ticksAll.filter(isDecade) : ticksAll;
      return {
        // Zero and below sit on the plot's floor, where a log axis begins.
        pos: (value: number) => (value <= 0 ? innerHeight : scale(value)),
        ticks,
        baseline: innerHeight,
      };
    }
    const scale = scaleLinear<number>({
      domain: explicit ?? (yDomain === 'data' ? fittedDomain(values) : valueDomain(values, levels)),
      range: [innerHeight, 0],
      nice: !explicit,
    });
    const [low, high] = scale.domain() as [number, number];
    return { pos: (value: number) => scale(value), ticks: scale.ticks(nTicks), baseline: scale(Math.max(low, Math.min(high, 0))) };
  }, [stacked, visible, domain, thresholds, innerHeight, log, yDomain, compact]);

  const xTicks = domain ? timeTicks(domain, Math.max(2, Math.floor(innerWidth / (compact ? 90 : 110)))) : [];
  const span = domain ? domain.to - domain.from : 0;
  const dangerLevel = thresholds.filter((threshold) => threshold.intent === 'danger').reduce((lowest, threshold) => Math.min(lowest, threshold.value), Infinity);

  // Pixel geometry per visible series: line runs, area bands, marker points.
  const geometry = useMemo(() => visible.map((entry, index) => {
    if (stacked) {
      const layer = stacked.layers[index]!;
      const defined = (point: (typeof layer)[number]) => point.value !== null && (!log || point.y1 > 0);
      const runs = splitRuns(layer, defined);
      const bands: PlotBand[][] = runs.map((run) => run.map((point) => ({ x: xScale(point.time), y0: y.pos(point.y0), y1: y.pos(point.y1) })));
      const lines: PlotPoint[][] = bands.map((run) => run.map((band) => ({ x: band.x, y: band.y1 })));
      const marks = layer
        .filter((point) => defined(point) && domain !== null && point.time >= domain.from && point.time <= domain.to)
        .map((point) => ({ time: point.time, value: point.value as number, x: xScale(point.time), y: y.pos(point.y1) }));
      return { entry, bands, lines, marks };
    }
    const runs = splitRuns([...entry.drawn], ([, value]) => plottable(value));
    const lines: PlotPoint[][] = runs.map((run) => run.map(([time, value]) => ({ x: xScale(time), y: y.pos(value as number) })));
    const bands: PlotBand[][] = variant === 'area' ? lines.map((run) => run.map((point) => ({ x: point.x, y0: y.baseline, y1: point.y }))) : [];
    const marks = entry.inRange
      .filter(([, value]) => plottable(value))
      .map(([time, value]) => ({ time, value: value as number, x: xScale(time), y: y.pos(value as number) }));
    return { entry, bands, lines, marks };
  }), [visible, stacked, xScale, y, variant, log, domain, plottable]);
  // The emphasised series is drawn last, so it sits on top.
  const drawOrder = colorStrategy === 'emphasis'
    ? [...geometry.filter((g) => g.entry.id !== emphasised), ...geometry.filter((g) => g.entry.id === emphasised)]
    : geometry;

  // Every sample time on screen: what the keyboard steps through.
  const stepTimes = useMemo(() => unionTimes(visible.map((entry) => entry.inRange)), [visible]);

  const cursorInDomain = cursor !== null && domain !== null && cursor >= domain.from && cursor <= domain.to && hasData;
  const readout = useMemo(() => {
    if (!cursorInDomain || cursor === null) return null;
    if (stacked) {
      const at = stepTimes[nearestTimeIndex(stepTimes, cursor)];
      if (at === undefined) return null;
      const position = stacked.times.indexOf(at);
      return {
        time: at,
        rows: visible.map((entry, index) => {
          const point = stacked.layers[index]![position];
          return { entry, time: at, value: point?.value ?? null, y: point && point.value !== null ? point.y1 : null };
        }),
      };
    }
    // One sample time for the whole readout: the sample nearest the cursor in
    // any series. Each row reads its value at exactly that time, or none, so a
    // sparsely sampled series is never shown under another series' timestamp.
    let at: number | null = null;
    for (const entry of visible) {
      const index = nearestIndex(entry.inRange, cursor);
      const time = index >= 0 ? entry.inRange[index]![0] : null;
      if (time !== null && (at === null || Math.abs(time - cursor) < Math.abs(at - cursor))) at = time;
    }
    if (at === null) return { time: cursor, rows: visible.map((entry) => ({ entry, time: null, value: null, y: null })) };
    const rows = visible.map((entry) => {
      const point = entry.inRange.find(([time]) => time === at);
      return { entry, time: point ? at : null, value: point?.[1] ?? null, y: point?.[1] ?? null };
    });
    return { time: at, rows };
  }, [cursorInDomain, cursor, stacked, stepTimes, visible]);

  const describeValue = (value: number | null, entryUnit: string | undefined) => (value === null ? 'no data' : withUnit(formatValue(value), entryUnit ?? unit));
  const readoutText = readout
    ? `${formatTimestamp(readout.time)} UTC. ${readout.rows.map((row) => `${row.entry.label} ${describeValue(row.value, row.entry.unit)}`).join(', ')}.`
    : '';

  const summary = useMemo(() => {
    if (!hasData) return '';
    const parts = visible.map((entry) => {
      const stats = summarisePoints(entry.inRange);
      if (!stats) return `${entry.label}: no data.`;
      const entryUnit = entry.unit ?? unit;
      const breach = Number.isFinite(dangerLevel) && stats.max > dangerLevel ? ' Crosses the danger threshold.' : '';
      return `${entry.label}: min ${withUnit(formatValue(stats.min), entryUnit)}, max ${withUnit(formatValue(stats.max), entryUnit)}, latest ${withUnit(formatValue(stats.latest), entryUnit)}.${breach}`;
    });
    const lines = thresholds.map((threshold) => `${threshold.intent === 'danger' ? 'Danger' : 'Warning'} threshold ${threshold.label} at ${withUnit(formatValue(threshold.value), unit)}.`);
    const notes = annotationsInDomain.map((note) => `${note.label} at ${formatTimestamp(note.time)} UTC.`);
    return [...parts, ...lines, ...notes].join(' ');
  }, [hasData, visible, thresholds, annotationsInDomain, dangerLevel, formatValue, unit]);

  // ── Pointer: crosshair and brush ────────────────────────────────────────
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ start: number; end: number } | null>(null);
  const plotX = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    const scale = rect && rect.width > 0 ? width / rect.width : 1;
    const x = (clientX - (rect?.left ?? 0)) * scale - margin.left;
    return Math.max(0, Math.min(innerWidth, x));
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!domain) return;
    const x = plotX(event.clientX);
    if (drag) setDrag({ start: drag.start, end: x });
    setCursor(xScale.invert(x).getTime());
  };
  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!zoomable || !domain || event.button !== 0) return;
    const x = plotX(event.clientX);
    setDrag({ start: x, end: x });
    if (typeof event.currentTarget.setPointerCapture === 'function') {
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* not every pointer can be captured */ }
    }
  };
  const onPointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (!drag) return;
    const end = plotX(event.clientX);
    setDrag(null);
    const left = Math.min(drag.start, end);
    const right = Math.max(drag.start, end);
    if (right - left < MIN_BRUSH) return;
    const selected = { from: xScale.invert(left).getTime(), to: xScale.invert(right).getTime() };
    shared?.setRange(selected);
    onRangeSelect?.(selected);
  };
  const onPointerLeave = () => {
    if (!drag) setCursor(null);
  };

  // ── Keyboard: step through samples ──────────────────────────────────────
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!stepTimes.length) return;
    const last = stepTimes.length - 1;
    const current = cursorInDomain && cursor !== null ? nearestTimeIndex(stepTimes, cursor) : null;
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = current === null ? 0 : Math.min(last, current + 1); break;
      case 'ArrowLeft': next = current === null ? last : Math.max(0, current - 1); break;
      case 'Home': next = 0; break;
      case 'End': next = last; break;
      case 'Escape':
        if (cursor === null) return;
        setCursor(null);
        event.preventDefault();
        return;
      default:
        return;
    }
    event.preventDefault();
    setCursor(stepTimes[next]!);
  };

  const toggleSeries = (id: string) => {
    setHiddenList(hidden.has(id) ? hiddenList.filter((candidate) => candidate !== id) : [...hiddenList, id]);
  };

  const styles = timeSeriesChart({ zoomable, compact });
  const label = title ?? 'Time series chart';
  const areaOpacity = fillOpacity ?? (variant === 'stacked' ? 0.35 : 0.2);
  const markerRadius = compact ? 1.75 : 2.25;
  const cursorX = cursorInDomain && cursor !== null ? xScale(cursor) : null;
  const tooltipHeight = readout ? 34 + readout.rows.length * 17 : 0;
  const tooltipX = cursorX === null ? 0 : cursorX + 12 + TOOLTIP_WIDTH > innerWidth ? cursorX - 12 - TOOLTIP_WIDTH : cursorX + 12;
  const brush = drag && Math.abs(drag.end - drag.start) >= 1 ? { x: Math.min(drag.start, drag.end), width: Math.abs(drag.end - drag.start) } : null;
  const breaching = Number.isFinite(dangerLevel) && visible.some((entry) => entry.inRange.some(([, value]) => value !== null && value > dangerLevel));

  // Inline labels: at each line's last sample, spread so none overlap.
  const ends = inline ? geometry.filter((g) => g.marks.length > 0).map((g) => ({ entry: g.entry, y: g.marks[g.marks.length - 1]!.y })) : [];
  const endsPlaced = nudgeLabels(ends.map((end) => end.y), compact ? 10 : 12, 0, innerHeight);
  const inlineLabels = ends.map((end, index) => ({ entry: end.entry, y: endsPlaced[index]! }));

  // Annotation labels drop to a second row where they would collide.
  const charWidth = compact ? 5.4 : 6;
  const sortedNotes = [...annotationsInDomain].sort((a, b) => a.time - b.time);
  const noteRows = labelRows(sortedNotes.map((note) => [xScale(note.time), note.label.length * charWidth + 8] as const));
  const annotationMarks = sortedNotes.map((note, index) => ({ note, x: xScale(note.time), row: noteRows[index]! }));

  const legendButtons = series.length && (legend === 'top' || legend === 'bottom') ? (
    <div role="group" aria-label={`${label} series`} data-part="legend" className={styles.legend()}>
      {all.map((entry) => (
        <button key={entry.id} type="button" aria-pressed={!hidden.has(entry.id)} data-series={entry.id} className={styles.toggle()} onClick={() => toggleSeries(entry.id)}>
          <Swatch tone={entry.tone} className={cn(hidden.has(entry.id) && 'opacity-30')} />
          {entry.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div
      ref={ref}
      data-slot="time-series-chart"
      data-variant={variant}
      data-density={density}
      data-breach={breaching || undefined}
      {...props}
      className={styles.root({ className })}
    >
      {title && showTitle ? <p className={styles.title()}>{title}</p> : null}
      {legend === 'top' ? legendButtons : null}
      <div ref={parentRef} className={styles.frame()}>
        {!hasData || !domain ? (
          <svg role="img" aria-label={`${label}: no data in this range.`} width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={styles.svg()}>
            <rect x={0.5} y={0.5} width={width - 1} height={height - 1} className="fill-none stroke-edge-subtle" strokeDasharray="4 3" />
            <text aria-hidden="true" x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="central" className="fill-content-muted font-mono text-xs">No data in this range.</text>
          </svg>
        ) : (
          <div
            // A slider, honestly: one value (the cursor time) stepped with the
            // arrows, Home and End, and read back as text. The chart itself is
            // described by the summary.
            role="slider"
            aria-label={label}
            aria-describedby={summaryId}
            aria-orientation="horizontal"
            aria-valuemin={domain.from}
            aria-valuemax={domain.to}
            aria-valuenow={readout ? readout.time : domain.from}
            aria-valuetext={readout ? readoutText : 'No time selected. Use the arrow keys to step through samples.'}
            tabIndex={0}
            data-part="plot"
            className={styles.plot()}
            onKeyDown={onKeyDown}
          >
            <svg
              ref={svgRef}
              aria-hidden="true"
              width={width}
              height={height}
              viewBox={`0 0 ${width} ${height}`}
              className={styles.svg()}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => setDrag(null)}
              onPointerLeave={onPointerLeave}
            >
              <defs>
                <clipPath id={clipId}>
                  <rect x={-markerRadius - 1} y={-markerRadius - 1} width={innerWidth + 2 * markerRadius + 2} height={innerHeight + 2 * markerRadius + 2} />
                </clipPath>
              </defs>
              <g transform={`translate(${margin.left} ${margin.top})`}>
                {/* Hit area, so the whole plot answers the pointer, not only the strokes. */}
                <rect x={0} y={0} width={innerWidth} height={innerHeight} className="fill-transparent" />

                {grid !== 'none'
                  ? y.ticks.map((tick) => (
                      <line key={`gy-${tick}`} data-part="grid-row" x1={0} x2={innerWidth} y1={y.pos(tick)} y2={y.pos(tick)} className="stroke-edge-subtle" />
                    ))
                  : null}
                {grid === 'both'
                  ? xTicks.map((tick) => (
                      <line key={`gx-${tick}`} data-part="grid-column" x1={xScale(tick)} x2={xScale(tick)} y1={0} y2={innerHeight} className="stroke-edge-subtle" />
                    ))
                  : null}
                {showAxes
                  ? y.ticks.map((tick) => (
                      <text key={`y-${tick}`} data-part="y-tick" x={-6} y={y.pos(tick)} textAnchor="end" dominantBaseline="central" className={styles.tick()}>{formatValue(tick)}</text>
                    ))
                  : null}
                {showAxes && unit && !compact ? <text data-part="unit" x={-6} y={-6} textAnchor="end" className={styles.tick()}>{unit}</text> : null}

                {thresholds.map((threshold) => {
                  const at = y.pos(threshold.value);
                  if (threshold.intent !== 'danger' || !(at > 0) || at > innerHeight) return null;
                  return <rect key={`band-${threshold.label}`} data-part="danger-band" x={0} y={0} width={innerWidth} height={at} className={MARK_TONES.danger.fill} fillOpacity={0.08} />;
                })}

                <g clipPath={`url(#${clipId})`}>
                  {drawOrder.map(({ entry, bands, lines, marks }) => (
                    <g key={entry.id} data-series={entry.id}>
                      {bands.length ? <path data-part="area" d={areaPath(bands, curve)} className={entry.tone.fill} fillOpacity={areaOpacity} /> : null}
                      <path data-part="line" d={linePath(lines, curve)} className={cn('fill-none', entry.tone.stroke)} strokeDasharray={entry.tone.dash} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
                      {pointMarkers === 'all'
                        ? marks.map((mark) => <circle key={mark.time} data-part="point" cx={mark.x} cy={mark.y} r={markerRadius} className={entry.tone.fill} />)
                        : null}
                      {!stacked && Number.isFinite(dangerLevel)
                        ? marks.map((mark) => (mark.value > dangerLevel ? (
                            <circle key={`b-${mark.time}`} data-part="breach" cx={mark.x} cy={mark.y} r={markerRadius + 0.5} className="fill-intent-danger" />
                          ) : null))
                        : null}
                    </g>
                  ))}
                </g>

                {thresholds.map((threshold) => {
                  const at = y.pos(threshold.value);
                  if (!(at >= 0) || at > innerHeight) return null;
                  const tone = MARK_TONES[threshold.intent];
                  return (
                    <g key={`threshold-${threshold.label}`} data-part="threshold" data-intent={threshold.intent}>
                      <line x1={0} x2={innerWidth} y1={at} y2={at} className={tone.stroke} strokeDasharray="5 4" strokeWidth={1.25} />
                      <text x={innerWidth - 4} y={at - 4} textAnchor="end" className={cn(styles.mark(), tone.fill)}>
                        {threshold.label} · {withUnit(formatValue(threshold.value), unit)}
                      </text>
                    </g>
                  );
                })}

                {annotationMarks.map(({ note, x, row }) => {
                  const tone = MARK_TONES[note.intent ?? 'info'];
                  return (
                    <g key={`note-${note.time}-${note.label}`} data-part="annotation" data-intent={note.intent ?? 'info'}>
                      <line x1={x} x2={x} y1={row === 0 ? -(compact ? 8 : 10) : 0} y2={innerHeight} className={tone.stroke} strokeDasharray="2 3" />
                      <text x={x + 3} y={row === 0 ? -2 : compact ? 9 : 11} className={cn(styles.mark(), tone.fill)}>{note.label}</text>
                    </g>
                  );
                })}

                {showAxes ? (
                  <g data-part="axes">
                    <line x1={0} x2={0} y1={0} y2={innerHeight} className="stroke-edge-strong" />
                    <line x1={0} x2={innerWidth} y1={innerHeight} y2={innerHeight} className="stroke-edge-strong" />
                    {xTicks.map((tick) => (
                      <g key={`x-${tick}`} data-part="x-tick" transform={`translate(${xScale(tick)} ${innerHeight})`}>
                        <line y1={0} y2={4} className="stroke-edge-strong" />
                        <text y={compact ? 13 : 16} textAnchor="middle" className={styles.tick()}>{formatTimeTick(tick, span)}</text>
                      </g>
                    ))}
                  </g>
                ) : null}

                {inlineLabels.map(({ entry, y: at }) => (
                  <text key={`label-${entry.id}`} data-part="inline-label" data-series={entry.id} x={innerWidth + 6} y={at} dominantBaseline="central" className={cn(styles.mark(), entry.tone.fill)}>
                    {entry.label}
                  </text>
                ))}

                {brush ? (
                  <rect data-part="brush" x={brush.x} y={0} width={brush.width} height={innerHeight} className="fill-accent-primary stroke-accent-primary" fillOpacity={0.15} />
                ) : null}

                {cursorX !== null ? (
                  <g data-part="cursor">
                    <line x1={cursorX} x2={cursorX} y1={0} y2={innerHeight} className="stroke-content-primary" strokeWidth={1} />
                    {pointMarkers !== 'none'
                      ? readout?.rows.map((row) => (row.y !== null && row.time !== null && plottable(row.y) ? (
                          <circle key={row.entry.id} data-part="cursor-point" cx={xScale(row.time)} cy={y.pos(row.y)} r={3} className={cn(row.entry.tone.fill, 'stroke-surface-base')} strokeWidth={1.5} />
                        ) : null))
                      : null}
                  </g>
                ) : null}
                {readout && cursorX !== null ? (
                  <foreignObject x={tooltipX} y={0} width={TOOLTIP_WIDTH} height={tooltipHeight} data-part="tooltip" className="pointer-events-none overflow-visible">
                    <ChartTooltip title={`${formatTimestamp(readout.time)} UTC`} className="w-full">
                      {readout.rows.map((row) => (
                        <div key={row.entry.id} className={styles.readout()}>
                          <span className="flex min-w-0 items-center gap-1.5">
                            <Swatch tone={row.entry.tone} />
                            <span className="truncate">{row.entry.label}</span>
                          </span>
                          <span>{describeValue(row.value, row.entry.unit)}</span>
                        </div>
                      ))}
                    </ChartTooltip>
                  </foreignObject>
                ) : null}
              </g>
            </svg>
          </div>
        )}
      </div>
      {legend === 'bottom' ? legendButtons : null}
      {hasData ? <p id={summaryId} className="sr-only">{summary}</p> : null}
    </div>
  );
});

TimeSeriesChart.displayName = 'TimeSeriesChart';
