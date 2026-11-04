/**
 * Time ranges for observability views: the window every chart, log list and
 * heatmap on a page shares, the presets a picker offers, and axis ticks that
 * land on round clock times.
 *
 * ## Time is epoch milliseconds, and `now` is always passed in
 *
 * Nothing here reads the clock. A page hands its `now` to `TimeRangeProvider`
 * — `Date.now()` in an app, a fixed epoch in a story or a static export — so a
 * render is a pure function of its inputs and a server render hydrates.
 *
 * ## Labels are UTC, formatted by hand
 *
 * `toLocaleString` differs between the server and the browser and between
 * machines, which is a hydration mismatch and an unstable screenshot. The
 * formatters below write UTC digits themselves.
 */

/** A closed window of time, in epoch milliseconds. */
export interface TimeRange {
  from: number;
  to: number;
}

/** A named relative window — "the last hour". */
export interface TimeRangePreset {
  id: string;
  label: string;
  /** Width of the window in milliseconds, ending at `now`. */
  duration: number;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** The windows a picker offers by default. */
export const TIME_RANGE_PRESETS: readonly TimeRangePreset[] = [
  { id: '15m', label: '15m', duration: 15 * MINUTE },
  { id: '1h', label: '1h', duration: HOUR },
  { id: '6h', label: '6h', duration: 6 * HOUR },
  { id: '24h', label: '24h', duration: DAY },
  { id: '7d', label: '7d', duration: 7 * DAY },
];

/** The window a preset names, ending at `now`. */
export function presetRange(preset: TimeRangePreset, now: number): TimeRange {
  return { from: now - preset.duration, to: now };
}

/** A range with `from <= to`, both finite; null when that cannot be made. */
export function normaliseRange(range: TimeRange | null | undefined): TimeRange | null {
  if (!range || !Number.isFinite(range.from) || !Number.isFinite(range.to)) return null;
  return range.from <= range.to ? { from: range.from, to: range.to } : { from: range.to, to: range.from };
}

/** Clamp `time` into `range`. */
export function clampToRange(time: number, range: TimeRange): number {
  return Math.max(range.from, Math.min(range.to, time));
}

const pad = (value: number) => String(value).padStart(2, '0');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `14:05`, `14:05:30` with seconds, in UTC. */
export function formatClock(time: number, seconds = false): string {
  const date = new Date(time);
  const base = `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  return seconds ? `${base}:${pad(date.getUTCSeconds())}` : base;
}

/** `Oct 22`, in UTC. */
export function formatDay(time: number): string {
  const date = new Date(time);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/** `Oct 22 14:05:30.120 UTC`-style stamp for a log line or a tooltip, without the zone. */
export function formatTimestamp(time: number, precision: 'minute' | 'second' | 'millisecond' = 'second'): string {
  const date = new Date(time);
  const clock = formatClock(time, precision !== 'minute');
  const millis = precision === 'millisecond' ? `.${String(date.getUTCMilliseconds()).padStart(3, '0')}` : '';
  return `${formatDay(time)} ${clock}${millis}`;
}

/** A tick label sized to the window: seconds for short ranges, days for long ones. */
export function formatTimeTick(time: number, span: number): string {
  if (span > 2 * DAY) return formatDay(time);
  if (span <= 2 * MINUTE) return formatClock(time, true);
  return formatClock(time);
}

/** `15m`, `1h 30m`, `2d`: a window's width, rounded to its two largest units. */
export function formatRangeDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0m';
  const units: Array<[string, number]> = [['d', DAY], ['h', HOUR], ['m', MINUTE], ['s', 1000]];
  const parts: string[] = [];
  let rest = ms;
  for (const [unit, size] of units) {
    const count = Math.floor(rest / size);
    if (count) { parts.push(`${count}${unit}`); rest -= count * size; }
    if (parts.length === 2) break;
  }
  return parts.join(' ') || `${Math.round(ms)}ms`;
}

/** `14:00 – 15:00`, or with days when the window crosses one. */
export function formatRange(range: TimeRange): string {
  const span = range.to - range.from;
  const sameDay = formatDay(range.from) === formatDay(range.to);
  if (span > 2 * DAY || !sameDay) return `${formatDay(range.from)} ${formatClock(range.from)} – ${formatDay(range.to)} ${formatClock(range.to)}`;
  return `${formatClock(range.from)} – ${formatClock(range.to)}`;
}

const STEPS = [1000, 5000, 15_000, 30_000, MINUTE, 5 * MINUTE, 15 * MINUTE, 30 * MINUTE, HOUR, 3 * HOUR, 6 * HOUR, 12 * HOUR, DAY, 2 * DAY, 7 * DAY];

/**
 * Ticks on round clock times inside `range` — every 5 minutes, every hour —
 * about `target` of them. UTC-aligned, so the same range always ticks alike.
 */
export function timeTicks(range: TimeRange, target = 5): number[] {
  const span = range.to - range.from;
  if (!Number.isFinite(span) || span <= 0) return [range.from];
  const raw = span / Math.max(1, target);
  const step = STEPS.find((candidate) => candidate >= raw) ?? Math.ceil(raw / DAY) * DAY;
  const ticks: number[] = [];
  for (let tick = Math.ceil(range.from / step) * step; tick <= range.to; tick += step) ticks.push(tick);
  return ticks;
}

/**
 * Group timestamps into `count` equal buckets across `range` — the shape a
 * histogram over time, a heatmap column or a log-volume strip needs.
 */
export function bucketTimes(range: TimeRange, count: number): TimeRange[] {
  const n = Math.max(1, Math.floor(count));
  const width = (range.to - range.from) / n;
  return Array.from({ length: n }, (_, index) => ({ from: range.from + index * width, to: index === n - 1 ? range.to : range.from + (index + 1) * width }));
}
