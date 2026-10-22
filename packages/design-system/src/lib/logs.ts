/**
 * The log model: entries in, the lines a viewer draws out.
 *
 * Pure data, no React, so a caller can filter, order or search a log stream
 * without rendering one — `LogViewer` highlights a query but never filters by
 * it, and this is what the caller filters with.
 *
 * Time is epoch milliseconds, and nothing here reads the clock.
 */

import type { LogSeverity } from './severity';
import { formatTimestamp, type TimeRange } from './timeRange';

/** A log field value, flattened the way OTLP attributes are. */
export type LogFieldValue = string | number | boolean;

/** One log line. */
export interface LogEntry {
  /** Unique within the stream; rows are keyed by it. */
  id: string;
  /** When the line was emitted, in epoch milliseconds. */
  time: number;
  /** OpenTelemetry's severity name, lower case. */
  severity: LogSeverity;
  /** The log body. One line in the list; in full when the row is expanded. */
  message: string;
  /** The emitting service (OTLP `service.name`). */
  service?: string;
  /** The trace this line was written inside, when it was. */
  traceId?: string;
  /** The span this line was written inside, when it was. */
  spanId?: string;
  /** Structured attributes, shown as a key/value list when expanded. */
  fields?: Record<string, LogFieldValue>;
}

/** Severities from least to most severe. */
export const LOG_SEVERITIES: readonly LogSeverity[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

/** What `filterLogEntries` keeps. Every criterion is optional and they combine with AND. */
export interface LogFilter {
  /** Case-insensitive text matched against the message, service, ids and field values. */
  query?: string;
  /** Keep only these severities. An empty list keeps nothing. */
  severities?: readonly LogSeverity[];
  /** Keep only entries inside this closed window. */
  range?: TimeRange | null;
}

/** Whether `entry` contains `query` (already lower-cased) anywhere a reader would look. */
export function matchLogEntry(entry: LogEntry, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (entry.message.toLowerCase().includes(needle)) return true;
  if (entry.service?.toLowerCase().includes(needle)) return true;
  if (entry.traceId?.toLowerCase().includes(needle) || entry.spanId?.toLowerCase().includes(needle)) return true;
  if (!entry.fields) return false;
  return Object.entries(entry.fields).some(
    ([key, value]) => `${key}=${String(value)}`.toLowerCase().includes(needle),
  );
}

/** Whether `time` lies inside `range`, both ends included. */
export function inLogRange(time: number, range: TimeRange): boolean {
  const from = Math.min(range.from, range.to);
  const to = Math.max(range.from, range.to);
  return time >= from && time <= to;
}

/**
 * The entries a filter keeps, in their original order. A pure helper: the
 * caller filters, the viewer only highlights.
 */
export function filterLogEntries(entries: readonly LogEntry[], filter: LogFilter = {}): LogEntry[] {
  const { query, severities, range } = filter;
  const allowed = severities ? new Set(severities) : null;
  return entries.filter(
    (entry) =>
      (!allowed || allowed.has(entry.severity)) &&
      (!range || inLogRange(entry.time, range)) &&
      (!query || matchLogEntry(entry, query)),
  );
}

/**
 * Entries in time order, oldest first (`asc`) or newest first (`desc`).
 * Stable: lines with the same timestamp keep the order they arrived in.
 */
export function sortLogEntries(entries: readonly LogEntry[], order: 'asc' | 'desc' = 'asc'): LogEntry[] {
  const sign = order === 'desc' ? -1 : 1;
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => (a.entry.time - b.entry.time) * sign || a.index - b.index)
    .map(({ entry }) => entry);
}

/** One run of text, and whether it matched the query. */
export interface LogHighlightPart {
  text: string;
  match: boolean;
}

/**
 * Split `text` into runs around every case-insensitive occurrence of `query`.
 * An empty query is one unmatched run.
 */
export function highlightLogText(text: string, query: string | undefined): LogHighlightPart[] {
  const needle = query?.trim().toLowerCase();
  if (!needle) return [{ text, match: false }];
  const haystack = text.toLowerCase();
  const parts: LogHighlightPart[] = [];
  let at = 0;
  for (let hit = haystack.indexOf(needle); hit !== -1; hit = haystack.indexOf(needle, at)) {
    if (hit > at) parts.push({ text: text.slice(at, hit), match: false });
    parts.push({ text: text.slice(hit, hit + needle.length), match: true });
    at = hit + needle.length;
  }
  if (at < text.length) parts.push({ text: text.slice(at), match: false });
  return parts.length ? parts : [{ text, match: false }];
}

/**
 * The index of the entry whose time is nearest `time`, in a list already in
 * time order (either direction). Null when the list is empty or `time` lies
 * outside the span the list covers — a cursor past the last line marks none.
 */
export function nearestLogIndex(entries: readonly LogEntry[], time: number | null | undefined): number | null {
  if (time == null || !Number.isFinite(time) || !entries.length) return null;
  const first = entries[0].time;
  const last = entries[entries.length - 1].time;
  const desc = first > last;
  const lo = Math.min(first, last);
  const hi = Math.max(first, last);
  if (time < lo || time > hi) return null;
  // Binary search for the first index at or past `time` in reading order.
  let low = 0;
  let high = entries.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    const past = desc ? entries[mid].time <= time : entries[mid].time >= time;
    if (past) high = mid;
    else low = mid + 1;
  }
  const prev = low - 1;
  if (prev >= 0 && Math.abs(entries[prev].time - time) <= Math.abs(entries[low].time - time)) return prev;
  return low;
}

/** What a screen reader hears for one line: time, severity, service, message. */
export function describeLogEntry(entry: LogEntry): string {
  return [`${formatTimestamp(entry.time, 'millisecond')} UTC`, entry.severity.toUpperCase(), entry.service, entry.message].filter(Boolean).join(', ');
}
