/**
 * Adapted from mdxcn by Keshav Bagaade, MIT licensed.
 * Source: https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/graph-activity/graph-activity.tsx
 * The local port removes motion and graph variables in favour of deterministic
 * rendering and the design system's semantic token classes.
 */

import * as React from 'react';
import { cn } from '../../../lib/recipe';

const DAY_MS = 86_400_000;
const MAX_DAYS = 3660;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;
const DEFAULT_GLYPHS = ['·', '░', '▒', '▓', '█'];
type Glyphs = 'shade' | 'ascii' | 'hash' | 'bar' | readonly string[];
type FigurePalette = 'mono' | 'duo' | 'multi';

function glyphsOf(glyphs?: Glyphs): readonly string[] {
  if (Array.isArray(glyphs)) return glyphs.length ? glyphs : DEFAULT_GLYPHS;
  if (glyphs === 'ascii') return ['.', '-', '=', '#', '@'];
  if (glyphs === 'hash') return ['.', ':', '+', '#', '█'];
  if (glyphs === 'bar') return ['▁', '▂', '▃', '▅', '█'];
  return DEFAULT_GLYPHS;
}
function intensity(level: number, max: number): number { return level <= 0 || max <= 0 ? 0 : Math.max(1, Math.round(Math.min(1, level / max) * 4)); }
function colorClass(level: number, palette: FigurePalette = 'mono'): string {
  if (!level) return 'text-content-muted';
  if (palette === 'mono') return level <= 2 ? 'text-content-secondary' : 'text-content-primary';
  return level === 1 ? 'text-accent-secondary' : level === 2 && palette === 'multi' ? 'text-accent-tertiary' : 'text-accent-primary';
}
function renderGlyph(level: number, glyphs: readonly string[]): string { return glyphs[Math.round(Math.max(0, Math.min(4, level)) / 4 * (glyphs.length - 1))] ?? glyphs[0] ?? '·'; }

export interface ActivityDay {
  /** Calendar date in ISO `YYYY-MM-DD` form, interpreted in UTC. */
  date: string;
  /** Non-negative activity count for the date. */
  count: number;
}

export interface ActivityGridProps extends React.HTMLAttributes<HTMLElement> {
  /** Dated counts used to derive the contribution grid. */
  data: ActivityDay[];
  /** First weekday in each column: Sunday (0) or Monday (1). */
  weekStartsOn?: 0 | 1;
  /** Optional upper bound for intensity scaling. */
  max?: number;
  /** Render the less/more glyph legend. */
  legend?: boolean;
  /** Glyph set name or custom glyph sequence. */
  glyphs?: Glyphs;
  /** Accent palette used for intensity levels. */
  palette?: FigurePalette;
  /** Additional classes for the renderer root. */
  className?: string;
}

interface Cell { date: string; count: number; inRange: boolean }

function parseDate(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(Number(y), Number(m) - 1, Number(d));
  return date.getUTCFullYear() === Number(y) && date.getUTCMonth() === Number(m) - 1 && date.getUTCDate() === Number(d) ? date.getTime() : null;
}

function iso(time: number): string { return new Date(time).toISOString().slice(0, 10); }

function dailyCounts(data: ActivityDay[]): ActivityDay[] {
  const counts = new Map<string, number>();
  for (const item of data) {
    if (parseDate(item.date) === null) continue;
    const count = Number.isFinite(item.count) ? Math.max(0, item.count) : 0;
    counts.set(item.date, (counts.get(item.date) ?? 0) + count);
  }
  return Array.from(counts, ([date, count]) => ({ date, count }));
}

function makeWeeks(data: ActivityDay[], weekStartsOn: 0 | 1): Cell[][] {
  const valid = data.map((item) => ({ item, time: parseDate(item.date) })).filter((entry): entry is { item: ActivityDay; time: number } => entry.time !== null);
  if (!valid.length) return [];
  const min = valid.reduce((earliest, entry) => Math.min(earliest, entry.time), Infinity);
  const max = valid.reduce((latest, entry) => Math.max(latest, entry.time), -Infinity);
  const span = Math.floor((max - min) / DAY_MS) + 1;
  if (span > MAX_DAYS) return [];
  const first = min - ((new Date(min).getUTCDay() - weekStartsOn + 7) % 7) * DAY_MS;
  const last = max + ((weekStartsOn + 6 - new Date(max).getUTCDay() + 7) % 7) * DAY_MS;
  const counts = new Map(valid.map(({ item }) => [item.date, Math.max(0, Number.isFinite(item.count) ? item.count : 0)]));
  const weeks: Cell[][] = [];
  for (let time = first; time <= last; time += 7 * DAY_MS) {
    weeks.push(Array.from({ length: 7 }, (_, offset) => {
      const dateTime = time + offset * DAY_MS;
      const date = iso(dateTime);
      const inRange = dateTime >= min && dateTime <= max;
      return { date, count: inRange ? counts.get(date) ?? 0 : 0, inRange };
    }));
  }
  return weeks;
}

function Legend({ glyphs, palette }: { glyphs: readonly string[]; palette?: FigurePalette }) {
  return <p className="flex items-center gap-2 text-content-muted"><span>Less</span><span aria-hidden="true" className="flex select-none">{glyphs.map((glyph, index) => <span className={cn('w-[1ch] text-center', colorClass(Math.round(index / Math.max(glyphs.length - 1, 1) * 4), palette))} key={`${glyph}-${index}`}>{glyph}</span>)}</span><span>More</span></p>;
}

/** Renders dated counts as a bounded, UTC-stable contribution grid. */
export const ActivityGrid = React.forwardRef<HTMLElement, ActivityGridProps>(function ActivityGrid({ data, weekStartsOn = 0, max, legend = true, glyphs, palette, className, ...rest }, ref) {
  const valid = dailyCounts(data);
  const weeks = makeWeeks(valid, weekStartsOn);
  const total = valid.reduce((sum, item) => sum + item.count, 0);
  const summary = `${total.toLocaleString('en-US')} contributions across ${valid.length} dates`;
  const glyphSet = glyphsOf(glyphs);
  const peak = max == null ? valid.reduce((largest, item) => Math.max(largest, item.count), 0) : Math.max(0, max);
  const weekdayLabels = weekStartsOn === 1 ? ['Mon', '', 'Wed', '', 'Fri', '', ''] : ['', 'Tue', '', 'Thu', '', 'Sat', ''];

  if (!valid.length || !weeks.length) return <section ref={ref} aria-label="Activity grid" {...rest} className={cn('font-mono text-sm text-content-primary', className)}><p className="text-content-muted">{valid.length ? 'Date range is too large to display.' : 'No activity dates to display.'}</p><p className="sr-only">{summary}</p></section>;

  return <section ref={ref} aria-label="Activity grid" {...rest} className={cn('flex w-fit max-w-full min-w-0 flex-col gap-3 font-mono text-sm text-content-primary', className)}>
    <p className="sr-only">{summary}, from {valid.reduce((a, b) => a.date < b.date ? a : b).date} to {valid.reduce((a, b) => a.date > b.date ? a : b).date}.</p>
    <div className="overflow-x-auto" role="img" aria-label={summary}>
      <div className="min-w-max">
        <div className="flex pl-[4ch]" aria-hidden="true">{weeks.map((week, i) => { const firstOfMonth = week.find((cell) => cell.inRange && cell.date.slice(-2) === '01'); return <span className="w-[2ch] shrink-0 text-content-muted" key={i}>{firstOfMonth ? MONTHS[Number(firstOfMonth.date.slice(5, 7)) - 1] : ''}</span>; })}</div>
        <div className="flex gap-1"><div className="flex w-[3ch] shrink-0 flex-col" aria-hidden="true">{weekdayLabels.map((label, i) => <span className="h-[1.2em] text-[0.7em] text-content-muted" key={i}>{label}</span>)}</div><div className="flex gap-1">{weeks.map((week) => <div className="flex flex-col" key={week[0].date}>{week.map((cell) => { const level = cell.inRange ? intensity(cell.count, peak) : 0; return <span aria-hidden="true" title={cell.inRange ? `${cell.date}: ${cell.count} contributions` : undefined} className={cn('flex h-[1.2em] w-[2ch] items-center justify-center leading-none', cell.inRange ? colorClass(level, palette) : 'text-transparent')} key={cell.date}>{cell.inRange ? renderGlyph(level, glyphSet) : (glyphSet[0] ?? '·')}</span>; })}</div>)}</div></div>
      </div>
    </div>
    {legend ? <div className="flex justify-end"><Legend glyphs={glyphSet} palette={palette} /></div> : null}
  </section>;
});
