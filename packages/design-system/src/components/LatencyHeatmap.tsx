'use client';

import { scaleLinear } from '@visx/scale';
import { forwardRef, useCallback, useEffect, useId, useMemo, useState, type HTMLAttributes, type KeyboardEvent, type MouseEvent } from 'react';
import { useMeasuredWidth } from '../hooks/useMeasuredWidth';
import { recipe } from '../lib/recipe';
import {
  formatCount,
  formatLatencyRange,
  formatRequests,
  heatmapCells,
  latencyBuckets,
  intensityLevel,
  intensityThresholds,
  latencyExtent,
  latencyRowPosition,
  percentile,
  percentiles as samplePercentiles,
  type IntensityScale,
  type LatencyCell,
  type LatencyPoint,
} from '../lib/latency';
import { bucketTimes, formatClock, formatRange, formatTimeTick, normaliseRange, timeTicks, type TimeRange } from '../lib/timeRange';
import { formatTraceDuration } from '../lib/trace';
import { useTimeCursor, useTimeRange } from './TimeRange';

/** Width used before (or without) a measurement — jsdom, a server render. */
const FALLBACK_WIDTH = 640;
const LAYOUT = {
  regular: { margin: { top: 8, right: 16, bottom: 24, left: 48 }, font: 10, height: 240, tickGap: 16 },
  compact: { margin: { top: 4, right: 8, bottom: 18, left: 38 }, font: 9, height: 160, tickGap: 13 },
} as const;
/** Stroke role per percentile overlay line, in order. */
const OVERLAY_STROKES = ['stroke-content-primary', 'stroke-accent-secondary', 'stroke-accent-tertiary', 'stroke-intent-warning'] as const;

/** Every value each enumerable prop accepts, first the default — for stories and evaluation grids to iterate. */
export const LATENCY_HEATMAP_VARIANTS = {
  colorScale: ['sqrt', 'linear', 'log', 'quantile'],
  colorSteps: [6, 3, 4, 5, 7, 8, 9],
  density: ['regular', 'compact'],
  showLegend: [true, false],
  zoomable: [true, false],
  cellGap: [1, 0, 2, 4],
  percentileOverlay: [[], [50], [50, 99]],
} as const satisfies Record<string, readonly unknown[]>;

/** Fill opacity for an intensity step: empty cells are not painted, the top step is opaque. */
function stepOpacity(level: number, steps: number): number {
  if (level <= 0) return 0;
  if (steps <= 1) return 1;
  return Number((0.14 + (0.86 * (level - 1)) / (steps - 1)).toFixed(3));
}

const latencyHeatmap = recipe({
  slots: {
    root: 'flex min-w-0 flex-col gap-1 font-mono text-xs text-content-primary',
    title: 'text-xs uppercase tracking-wide text-content-secondary',
    frame: 'w-full min-w-0',
    chart: 'block max-w-full cursor-crosshair select-none overflow-visible focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
    footer: 'flex flex-wrap items-center justify-between gap-x-4 gap-y-1',
    readout: 'min-h-[1.5em] tabular-nums text-content-secondary',
    legend: 'flex items-center gap-1.5 text-content-muted',
    empty: 'border border-dashed border-edge-default px-3 py-6 text-center text-content-muted',
  },
});

/** A cell position on the grid. */
interface CellPosition {
  column: number;
  row: number;
}

export interface LatencyHeatmapProps extends HTMLAttributes<HTMLDivElement> {
  /** Requests as `{ time, value }`: epoch milliseconds and latency in milliseconds. */
  points: readonly LatencyPoint[];
  /** The time window. Default the nearest `TimeRangeProvider`'s range, else the data's extent. */
  range?: TimeRange;
  /** Time buckets across the window. Default 60. */
  columns?: number;
  /** Log-spaced latency buckets. Default 16. */
  rows?: number;
  /** Lower latency bound, in milliseconds. Default the fastest point in the window. */
  min?: number;
  /** Upper latency bound, in milliseconds. Default the slowest point in the window. */
  max?: number;
  /** Height of the chart in pixels. Default 240. */
  height?: number;
  /** The chart's accessible name, also shown above it. Default `Latency heatmap` (not shown). */
  title?: string;
  /** Called with the cell a click, Enter or Space selects — "show traces in this bucket". Selection is outlined only when this is given. */
  onCellSelect?: (cell: LatencyCell) => void;
  /** Called with the window dragged across. Inside a provider the provider's range is zoomed as well. */
  onRangeSelect?: (range: TimeRange) => void;
  /** Whether dragging across columns zooms. Default true. */
  zoomable?: boolean;
  /** Format a latency for labels. Default `formatTraceDuration` (`412ms`, `1.24s`). */
  formatValue?: (ms: number) => string;
  /** How many opacity steps the count scale has, 3–9. Default 6. */
  colorSteps?: number;
  /** How a count maps to a step: `sqrt` (default), `linear`, `log`, or `quantile` (equal cells per step). */
  colorScale?: IntensityScale;
  /** Pixels between cells. Default 1; never more than half a cell. */
  cellGap?: number;
  /** Show the count-scale legend under the chart. Default true. */
  showLegend?: boolean;
  /** `compact` tightens margins and type and lowers the default height to 160. Default `regular`. */
  density?: 'regular' | 'compact';
  /** Percentiles drawn as lines through each column's own percentile, e.g. `[50, 99]`. Default none. */
  percentileOverlay?: readonly number[];
}

/**
 * A latency heatmap: time across, log-spaced latency up, and each cell shaded
 * by how many requests landed in it — one role, six stepped opacities on a
 * square-root scale, so a faint slow mode still shows beside a busy fast one.
 *
 * It follows the nearest `TimeRangeProvider`: the window comes from it,
 * hovering sets the shared cursor to the column's centre and draws wherever
 * the cursor is set from, and dragging across columns zooms every view on the
 * page. Standalone it takes `range` and reports drags through `onRangeSelect`.
 *
 * The grid is one tab stop. Arrow keys move a focus cell (Up is slower), Home
 * and End jump along the row, and Enter or Space selects it.
 */
export const LatencyHeatmap = forwardRef<HTMLDivElement, LatencyHeatmapProps>(function LatencyHeatmap(
  {
    points,
    range: rangeProp,
    columns: columnsProp = 60,
    rows: rowsProp = 16,
    min,
    max,
    height: heightProp,
    title,
    onCellSelect,
    onRangeSelect,
    zoomable = true,
    formatValue = formatTraceDuration,
    colorSteps = 6,
    colorScale = 'sqrt',
    cellGap = 1,
    showLegend = true,
    density = 'regular',
    percentileOverlay,
    className,
    ...props
  },
  ref,
) {
  const id = useId();
  const layout = LAYOUT[density] ?? LAYOUT.regular;
  const MARGIN = layout.margin;
  const height = heightProp ?? layout.height;
  const steps = Math.max(3, Math.min(9, Math.round(Number.isFinite(colorSteps) ? colorSteps : 6)));
  const styles = latencyHeatmap();
  const [measureRef, width] = useMeasuredWidth(FALLBACK_WIDTH);
  const shared = useTimeRange();
  const sharedCursor = useTimeCursor();

  const range = useMemo<TimeRange | null>(() => {
    const explicit = normaliseRange(rangeProp) ?? shared?.range ?? null;
    if (explicit) return explicit;
    let from = Number.POSITIVE_INFINITY;
    let to = Number.NEGATIVE_INFINITY;
    for (const point of points) {
      if (!Number.isFinite(point.time)) continue;
      if (point.time < from) from = point.time;
      if (point.time > to) to = point.time;
    }
    if (to < from) return null;
    return to === from ? { from: from - 30_000, to: to + 30_000 } : { from, to };
  }, [rangeProp, shared?.range, points]);

  const columns = Math.max(1, Math.floor(columnsProp));
  const rows = Math.max(1, Math.floor(rowsProp));
  const inRange = useMemo(() => (range ? points.filter((point) => point.time >= range.from && point.time <= range.to && Number.isFinite(point.value)) : []), [points, range]);
  const grid = useMemo(() => {
    if (!range) return null;
    const extent = latencyExtent(inRange.map((point) => point.value));
    const edges = latencyBuckets(min ?? extent?.min ?? 1, max ?? extent?.max ?? 1000, rows);
    return { ...heatmapCells(inRange, bucketTimes(range, columns), edges), edges };
  }, [range, inRange, min, max, rows, columns]);
  const p99 = useMemo(() => percentile(inRange.map((point) => point.value), 99), [inRange]);
  const thresholds = useMemo(() => (grid ? intensityThresholds(grid.cells.map((cell) => cell.count), steps, colorScale) : []), [grid, steps, colorScale]);
  const overlayKey = (percentileOverlay ?? []).join(',');
  const overlays = useMemo(() => {
    const ps = overlayKey ? overlayKey.split(',').map(Number).filter((p) => Number.isFinite(p)) : [];
    if (!range || !grid || !ps.length) return [];
    const byColumn: number[][] = Array.from({ length: columns }, () => []);
    const span = range.to - range.from;
    for (const point of inRange) {
      const column = span > 0 ? Math.min(columns - 1, Math.floor(((point.time - range.from) / span) * columns)) : 0;
      byColumn[column]!.push(point.value);
    }
    const perColumn = byColumn.map((values) => samplePercentiles(values, ps));
    return ps.map((p, index) => ({ p, rows: perColumn.map((values) => latencyRowPosition(values[index]!, grid.edges)) }));
  }, [overlayKey, range, grid, columns, inRange]);
  const busiest = useMemo(() => grid?.cells.reduce<LatencyCell | null>((best, cell) => (cell.count > (best?.count ?? 0) ? cell : best), null) ?? null, [grid]);

  // Room on the right for the overlay labels.
  const innerWidth = Math.max(10, width - MARGIN.left - MARGIN.right - (overlayKey ? 22 : 0));
  const innerHeight = Math.max(10, height - MARGIN.top - MARGIN.bottom);
  const cellWidth = innerWidth / columns;
  const cellHeight = innerHeight / rows;
  const gap = Math.max(0, Number.isFinite(cellGap) ? cellGap : 1);
  // The default gap of 1 drops away on cells too small to spare it.
  const gapX = Math.min(gap, cellWidth / 2, gap === 1 && cellWidth <= 4 ? 0 : Number.POSITIVE_INFINITY);
  const gapY = Math.min(gap, cellHeight / 2, gap === 1 && cellHeight <= 4 ? 0 : Number.POSITIVE_INFINITY);
  const xScale = useMemo(() => scaleLinear<number>({ domain: range ? [range.from, range.to] : [0, 1], range: [0, innerWidth] }), [range, innerWidth]);

  const [hover, setHover] = useState<CellPosition | null>(null);
  const [focusCell, setFocusCell] = useState<CellPosition | null>(null);
  const [focused, setFocused] = useState(false);
  const [selected, setSelected] = useState<CellPosition | null>(null);
  const [drag, setDrag] = useState<{ start: number; end: number } | null>(null);
  const brushable = zoomable && Boolean(shared || onRangeSelect);

  // A drag released outside the chart is abandoned rather than applied.
  useEffect(() => {
    if (!drag) return undefined;
    const cancel = () => setDrag(null);
    window.addEventListener('mouseup', cancel);
    return () => window.removeEventListener('mouseup', cancel);
  }, [drag]);

  const cellOf = (position: CellPosition | null) => (grid && position ? grid.cells[position.column * grid.rows + position.row] ?? null : null);
  const centre = (column: number) => (grid ? (grid.cells[column * grid.rows]!.timeRange.from + grid.cells[column * grid.rows]!.timeRange.to) / 2 : 0);
  const setCursor = sharedCursor?.setCursor;

  const positionAt = useCallback((event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) * (box.width > 0 ? width / box.width : 1) - MARGIN.left;
    const y = (event.clientY - box.top) * (box.height > 0 ? height / box.height : 1) - MARGIN.top;
    const column = Math.max(0, Math.min(columns - 1, Math.floor(x / cellWidth)));
    const row = rows - 1 - Math.floor(y / cellHeight);
    return { column, row, inside: x >= 0 && x <= innerWidth && y >= 0 && y <= innerHeight && row >= 0 && row < rows };
  }, [width, height, columns, rows, cellWidth, cellHeight, innerWidth, innerHeight, MARGIN]);

  const select = (position: CellPosition) => {
    const cell = cellOf(position);
    if (!cell || !onCellSelect) return;
    setSelected(position);
    onCellSelect(cell);
  };

  const onMouseDown = (event: MouseEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    const at = positionAt(event);
    if (!at.inside) return;
    setDrag({ start: at.column, end: at.column });
  };
  const onMouseMove = (event: MouseEvent<SVGSVGElement>) => {
    const at = positionAt(event);
    if (drag) setDrag({ ...drag, end: at.column });
    if (!at.inside) { setHover(null); setCursor?.(null); return; }
    setHover({ column: at.column, row: at.row });
    setCursor?.(centre(at.column));
  };
  const onMouseUp = (event: MouseEvent<SVGSVGElement>) => {
    const at = positionAt(event);
    const current = drag;
    setDrag(null);
    if (current && brushable && grid && Math.abs(at.column - current.start) >= 1) {
      const first = Math.min(at.column, current.start);
      const last = Math.max(at.column, current.start);
      const zoomed = { from: grid.cells[first * grid.rows]!.timeRange.from, to: grid.cells[last * grid.rows]!.timeRange.to };
      if (zoomable && shared) shared.setRange(zoomed);
      onRangeSelect?.(zoomed);
      return;
    }
    if (at.inside) { setFocusCell({ column: at.column, row: at.row }); select({ column: at.column, row: at.row }); }
  };
  const onMouseLeave = () => { setHover(null); setCursor?.(null); };

  const onKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const current = focusCell ?? (busiest ? { column: busiest.column, row: busiest.row } : { column: 0, row: 0 });
    let next = current;
    switch (event.key) {
      case 'ArrowRight': next = { ...current, column: Math.min(columns - 1, current.column + 1) }; break;
      case 'ArrowLeft': next = { ...current, column: Math.max(0, current.column - 1) }; break;
      case 'ArrowUp': next = { ...current, row: Math.min(rows - 1, current.row + 1) }; break;
      case 'ArrowDown': next = { ...current, row: Math.max(0, current.row - 1) }; break;
      case 'Home': next = { ...current, column: 0 }; break;
      case 'End': next = { ...current, column: columns - 1 }; break;
      case 'PageUp': next = { ...current, row: rows - 1 }; break;
      case 'PageDown': next = { ...current, row: 0 }; break;
      case 'Enter':
      case ' ':
        select(current);
        break;
      default:
        return;
    }
    event.preventDefault();
    setHover(null);
    setFocusCell(next);
    setCursor?.(centre(next.column));
  };

  const timeSpan = range ? range.to - range.from : 0;
  const columnSpan = timeSpan / columns;
  const describeCell = useCallback((cell: LatencyCell) => {
    // Seconds only when a column is not a whole number of minutes.
    const seconds = columnSpan < 60_000 || Math.abs(columnSpan / 60_000 - Math.round(columnSpan / 60_000)) > 1e-6;
    return `${formatClock(cell.timeRange.from, seconds)}–${formatClock(cell.timeRange.to, seconds)} · ${formatLatencyRange(cell.latencyRange.from, cell.latencyRange.to, formatValue)} · ${formatRequests(cell.count)}`;
  }, [columnSpan, formatValue]);

  // The cell layer is the expensive part — hundreds of rects — so it is built
  // once per grid and geometry, not on every hover.
  const cellLayer = useMemo(() => {
    if (!grid) return null;
    return Array.from({ length: grid.rows }, (_, offset) => {
      const row = grid.rows - 1 - offset;
      return (
        <g key={row} role="row">
          {Array.from({ length: grid.columns }, (_, column) => {
            const cell = grid.cells[column * grid.rows + row]!;
            const level = intensityLevel(cell.count, thresholds);
            return (
              <rect
                key={column}
                id={`${id}-c${column}-${row}`}
                role="gridcell"
                aria-label={`${describeCell(cell)} UTC`}
                data-level={level}
                x={column * cellWidth}
                y={offset * cellHeight}
                width={Math.max(0.5, cellWidth - gapX)}
                height={Math.max(0.5, cellHeight - gapY)}
                fillOpacity={stepOpacity(level, thresholds.length)}
                className="fill-accent-primary"
              />
            );
          })}
        </g>
      );
    });
  }, [grid, id, cellWidth, cellHeight, gapX, gapY, thresholds, describeCell]);

  if (!range || !grid || !grid.total) {
    return (
      <div ref={ref} data-slot="latency-heatmap" data-empty="" {...props} className={styles.root({ className })}>
        {title ? <p className={styles.title()}>{title}</p> : null}
        <p className={styles.empty()}>No samples.</p>
      </div>
    );
  }

  const label = title ?? 'Latency heatmap';
  const summary = [
    `${formatRequests(grid.total)} between ${formatRange(range)} UTC.`,
    busiest ? `Busiest cell: ${describeCell(busiest)}.` : '',
    Number.isFinite(p99) ? `Overall p99 ${formatValue(p99)}.` : '',
  ].filter(Boolean).join(' ');

  const rectFor = (position: CellPosition) => ({ x: position.column * cellWidth, y: (rows - 1 - position.row) * cellHeight, width: cellWidth, height: cellHeight });
  const activeFocus = focused ? focusCell : null;
  const shown = cellOf(hover ?? activeFocus ?? (onCellSelect ? selected : null));
  const cursorTime = sharedCursor ? sharedCursor.cursor : hover ? centre(hover.column) : null;
  const cursorX = cursorTime !== null && cursorTime >= range.from && cursorTime <= range.to ? xScale(cursorTime) : null;
  const ticks = timeTicks(range, Math.max(2, Math.floor(innerWidth / 90)));
  const labelEvery = Math.max(1, Math.ceil(rows / Math.max(1, Math.floor(innerHeight / 24))));
  const brush = drag && brushable && drag.end !== drag.start ? { from: Math.min(drag.start, drag.end), to: Math.max(drag.start, drag.end) } : null;

  return (
    <div ref={ref} data-slot="latency-heatmap" {...props} className={styles.root({ className })}>
      {title ? <p aria-hidden="true" className={styles.title()}>{title}</p> : null}
      <p id={`${id}-summary`} className="sr-only">{summary}</p>
      <div ref={measureRef} className={styles.frame()}>
        <svg
          role="grid"
          tabIndex={0}
          aria-label={label}
          aria-describedby={`${id}-summary`}
          aria-activedescendant={activeFocus ? `${id}-c${activeFocus.column}-${activeFocus.row}` : undefined}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className={styles.chart()}
          onKeyDown={onKeyDown}
          onFocus={() => {
            setFocused(true);
            if (!focusCell && busiest) setFocusCell({ column: busiest.column, row: busiest.row });
          }}
          onBlur={() => { setFocused(false); setCursor?.(null); }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          <g aria-hidden="true" transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            <rect x={0} y={0} width={innerWidth} height={innerHeight} fill="none" className="stroke-edge-subtle" />
            {grid.edges.map((edge, index) => (index % labelEvery === 0 || index === rows ? (
              <g key={index} transform={`translate(0,${innerHeight - index * cellHeight})`}>
                <line x1={-4} x2={0} className="stroke-edge-default" />
                <text x={-6} textAnchor="end" dominantBaseline="central" fontSize={layout.font} className="fill-content-muted">{formatValue(edge)}</text>
              </g>
            ) : null))}
            {ticks.map((tick) => (
              <g key={tick} transform={`translate(${xScale(tick)},${innerHeight})`}>
                <line y1={0} y2={4} className="stroke-edge-default" />
                <text y={layout.tickGap} textAnchor="middle" fontSize={layout.font} className="fill-content-muted">{formatTimeTick(tick, timeSpan)}</text>
              </g>
            ))}
          </g>
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>{cellLayer}</g>
          <g aria-hidden="true" transform={`translate(${MARGIN.left},${MARGIN.top})`} pointerEvents="none">
            {brush ? (
              <rect data-part="brush" x={brush.from * cellWidth} y={0} width={(brush.to - brush.from + 1) * cellWidth} height={innerHeight} fillOpacity={0.12} className="fill-accent-primary stroke-accent-primary" />
            ) : null}
            {overlays.map((overlay, index) => {
              let d = '';
              let open = false;
              overlay.rows.forEach((row, column) => {
                if (!Number.isFinite(row)) { open = false; return; }
                const x = (column + 0.5) * cellWidth;
                const y = innerHeight - row * cellHeight;
                d += `${open ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
                open = true;
              });
              let lastColumn = overlay.rows.length - 1;
              while (lastColumn >= 0 && !Number.isFinite(overlay.rows[lastColumn])) lastColumn -= 1;
              return (
                <g key={overlay.p} data-part="percentile-overlay" data-percentile={overlay.p}>
                  <path d={d} fill="none" strokeWidth={1.5} strokeLinejoin="round" className={OVERLAY_STROKES[index % OVERLAY_STROKES.length]} />
                  {lastColumn >= 0 ? (
                    <text x={innerWidth + 2} y={innerHeight - overlay.rows[lastColumn]! * cellHeight} dominantBaseline="central" fontSize={layout.font} className="fill-content-secondary">{`p${overlay.p}`}</text>
                  ) : null}
                </g>
              );
            })}
            {cursorX !== null ? <line data-part="cursor" x1={cursorX} x2={cursorX} y1={0} y2={innerHeight} strokeWidth={1} className="stroke-content-secondary" /> : null}
            {hover ? <rect data-part="hover" {...rectFor(hover)} fill="none" strokeWidth={1} className="stroke-content-secondary" /> : null}
            {onCellSelect && selected ? <rect data-part="selected" {...rectFor(selected)} fill="none" strokeWidth={2} className="stroke-content-primary" /> : null}
            {activeFocus ? <rect data-part="focus" {...rectFor(activeFocus)} fill="none" strokeWidth={1.5} strokeDasharray="3 2" className="stroke-content-primary" /> : null}
          </g>
        </svg>
      </div>
      <div className={styles.footer()}>
        <p aria-hidden="true" data-part="readout" className={styles.readout()}>
          {shown ? describeCell(shown) : `${formatRequests(grid.total)}${Number.isFinite(p99) ? ` · p99 ${formatValue(p99)}` : ''}${brushable ? ' · drag to zoom' : ''}`}
        </p>
        {showLegend ? (
          <div aria-hidden="true" data-part="legend" className={styles.legend()}>
            <span>{formatCount(thresholds[0] ?? 1)}</span>
            <svg width={thresholds.length * 14} height={10} viewBox={`0 0 ${thresholds.length * 14} 10`}>
              {thresholds.map((threshold, index) => (
                <rect key={index} data-threshold={threshold} x={index * 14} y={0} width={13} height={10} fillOpacity={stepOpacity(index + 1, thresholds.length)} className="fill-accent-primary" />
              ))}
            </svg>
            <span>{formatCount(grid.max)} per cell</span>
          </div>
        ) : null}
      </div>
    </div>
  );
});

LatencyHeatmap.displayName = 'LatencyHeatmap';
