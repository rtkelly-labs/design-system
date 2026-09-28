/**
 * Adapted from mdxcn by Keshav Bagaade, MIT licensed.
 * Source: https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/graph-gantt/graph-gantt.tsx
 * The local port uses calendar dates, bounded deterministic rendering, and
 * the design system's semantic token classes.
 */

import * as React from 'react';
import { cn } from '../../../lib/recipe';

const DAY_MS = 86_400_000;
const MAX_RANGE_DAYS = 3660;
const MAX_COLUMNS = 120;

export interface GanttItem {
  label: string;
  /** Inclusive calendar start date in ISO `YYYY-MM-DD` form. */
  start: string;
  /** Inclusive calendar end date in ISO `YYYY-MM-DD` form. */
  end: string;
  /** Fraction completed, from 0 to 1. */
  complete?: number;
}

export interface GanttChartProps extends React.HTMLAttributes<HTMLElement> {
  /** Dated work items. Invalid or out-of-range items are omitted. */
  items: GanttItem[];
  /** Explicit displayed bounds. Defaults to the earliest start and latest end. */
  range?: { start: string; end: string };
  /** Number of character cells used to draw each bar. Clamped to 1–120. */
  columns?: number;
  /** Additional classes for the renderer root. */
  className?: string;
}

function parseDate(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]); const m = Number(match[2]); const d = Number(match[3]);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(y, m - 1, d);
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date.getTime() : null;
}
function iso(time: number): string { return new Date(time).toISOString().slice(0, 10); }
function shortDate(time: number): string { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(time)); }

/** Renders a dated schedule on a bounded, fixed-cell calendar scale. */
export const GanttChart = React.forwardRef<HTMLElement, GanttChartProps>(function GanttChart({ items, range, columns = 48, className, ...rest }, ref) {
  const valid = items.map((item) => ({ ...item, startTime: parseDate(item.start), endTime: parseDate(item.end) }))
    .filter((item): item is GanttItem & { startTime: number; endTime: number } => item.startTime !== null && item.endTime !== null && item.startTime <= item.endTime);
  const rangeStart = range ? parseDate(range.start) : (valid.length ? Math.min(...valid.map((item) => item.startTime)) : null);
  const rangeEnd = range ? parseDate(range.end) : (valid.length ? Math.max(...valid.map((item) => item.endTime)) : null);
  const days = rangeStart == null || rangeEnd == null ? 0 : Math.floor((rangeEnd - rangeStart) / DAY_MS) + 1;
  const visible = rangeStart == null || rangeEnd == null ? [] : valid.filter((item) => item.endTime >= rangeStart && item.startTime <= rangeEnd);
  const empty = !visible.length || rangeStart == null || rangeEnd == null || rangeStart > rangeEnd || days > MAX_RANGE_DAYS;
  const cells = Math.max(1, Math.min(MAX_COLUMNS, Math.round(Number.isFinite(columns) ? columns : 48)));

  if (empty) return <section ref={ref} aria-label="Gantt chart" {...rest} className={cn('font-mono text-sm text-content-primary', className)}><p className="text-content-muted">{items.length ? 'No valid schedule in the selected date range.' : 'No schedule items to display.'}</p><p className="sr-only">Empty schedule.</p></section>;

  const span = rangeEnd! - rangeStart! + DAY_MS;
  const summary = `Schedule date range: ${iso(rangeStart!)} through ${iso(rangeEnd!)}.`;
  const ticks = Array.from({ length: days }, (_, i) => rangeStart! + i * DAY_MS)
    .filter((time) => { const day = new Date(time).getUTCDate(); return day === 1 || (days <= 42 && new Date(time).getUTCDay() === 1); });
  if (!ticks.includes(rangeStart!)) ticks.unshift(rangeStart!);
  const tickLabels = new Map<number, string>();
  for (const time of ticks) {
    const cell = Math.min(cells - 1, Math.floor((time - rangeStart!) / span * cells));
    const label = new Date(time).getUTCDate() === 1
      ? new Intl.DateTimeFormat('en', { month: 'short', timeZone: 'UTC' }).format(new Date(time))
      : shortDate(time);
    tickLabels.set(cell, label);
  }

  return <section ref={ref} aria-label="Gantt chart" {...rest} className={cn('flex min-w-0 flex-col gap-3 font-mono text-sm text-content-primary', className)}>
    <p className="sr-only">{summary}</p>
    <ul aria-label="Scheduled items" className="flex flex-col gap-2">
      {visible.map((item, row) => {
        const start = Math.max(rangeStart!, item.startTime);
        const end = Math.min(rangeEnd! + DAY_MS, item.endTime + DAY_MS);
        const from = Math.max(0, Math.floor((start - rangeStart!) / span * cells));
        const to = Math.min(cells, Math.max(from + 1, Math.ceil((end - rangeStart!) / span * cells)));
        const width = Math.max(1, to - from);
        const hasProgress = item.complete != null && Number.isFinite(item.complete);
        const progress = hasProgress ? Math.max(0, Math.min(1, item.complete!)) : 1;
        const done = Math.round(width * progress);
        return <li aria-label={`${item.label}, ${item.start} through ${item.end}${hasProgress ? `, ${Math.round(progress * 100)}% complete` : ''}`} className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] items-center gap-3" key={`${item.label}-${item.start}-${row}`}>
          <span className="truncate">{item.label}</span><span aria-hidden="true" className="flex min-w-0 select-none">{Array.from({ length: cells }, (_, index) => { const inside = index >= from && index < to; const completed = inside && index < from + done; return <span className={cn('min-w-0 flex-1 overflow-hidden text-center', completed ? 'text-accent-primary' : inside ? 'text-content-secondary' : 'text-content-muted')} key={index}>{completed ? '█' : inside ? '░' : '·'}</span>; })}</span>
        </li>;
      })}
    </ul>
    <div aria-hidden="true" className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-3"><span />
      <div className="flex h-[2.5em] border-t border-dashed border-edge-subtle">{Array.from({ length: cells }, (_, index) => <span className="relative min-w-0 flex-1" key={index}>{tickLabels.has(index) ? <span className={cn('absolute top-1 whitespace-nowrap text-[0.75em] text-content-muted', index > cells * 0.84 ? 'right-0' : 'left-0')}>{tickLabels.get(index)}</span> : null}</span>)}</div>
    </div>
  </section>;
});
