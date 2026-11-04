import { describe, expect, it } from 'vitest';
import {
  describeLogEntry,
  filterLogEntries,
  highlightLogText,
  matchLogEntry,
  nearestLogIndex,
  sortLogEntries,
  type LogEntry,
} from './logs';

const NOW = Date.UTC(2026, 9, 22, 14, 0);
const entries: LogEntry[] = [
  { id: 'a', time: NOW + 2000, severity: 'error', message: 'Upstream TIMEOUT after 3000ms', service: 'checkout', traceId: 'abc123', fields: { route: '/pay', retry: 2 } },
  { id: 'b', time: NOW, severity: 'info', message: 'Request started', service: 'web' },
  { id: 'c', time: NOW + 1000, severity: 'debug', message: 'cache hit', service: 'cart', fields: { hit: true } },
  { id: 'd', time: NOW + 1000, severity: 'warn', message: 'slow query', service: 'postgres' },
];

describe('filterLogEntries', () => {
  it('keeps everything with no criteria', () => {
    expect(filterLogEntries(entries)).toHaveLength(4);
  });

  it('matches the query case-insensitively across message, service, ids and fields', () => {
    expect(filterLogEntries(entries, { query: 'timeout' }).map((e) => e.id)).toEqual(['a']);
    expect(filterLogEntries(entries, { query: 'POSTGRES' }).map((e) => e.id)).toEqual(['d']);
    expect(filterLogEntries(entries, { query: 'abc1' }).map((e) => e.id)).toEqual(['a']);
    expect(filterLogEntries(entries, { query: 'hit=true' }).map((e) => e.id)).toEqual(['c']);
    expect(matchLogEntry(entries[0], '  ')).toBe(true);
  });

  it('filters by severity and range, combined with AND', () => {
    expect(filterLogEntries(entries, { severities: ['warn', 'error'] }).map((e) => e.id)).toEqual(['a', 'd']);
    expect(filterLogEntries(entries, { severities: [] })).toEqual([]);
    expect(filterLogEntries(entries, { range: { from: NOW + 500, to: NOW + 1000 } }).map((e) => e.id)).toEqual(['c', 'd']);
    expect(filterLogEntries(entries, { range: { from: NOW + 1000, to: NOW }, severities: ['info'] }).map((e) => e.id)).toEqual(['b']);
  });
});

describe('sortLogEntries', () => {
  it('orders by time, stably, in either direction', () => {
    expect(sortLogEntries(entries).map((e) => e.id)).toEqual(['b', 'c', 'd', 'a']);
    expect(sortLogEntries(entries, 'desc').map((e) => e.id)).toEqual(['a', 'c', 'd', 'b']);
  });
});

describe('highlightLogText', () => {
  it('splits around every case-insensitive match', () => {
    expect(highlightLogText('Timeout: timeout!', 'TIMEOUT')).toEqual([
      { text: 'Timeout', match: true },
      { text: ': ', match: false },
      { text: 'timeout', match: true },
      { text: '!', match: false },
    ]);
  });

  it('returns one run for an empty query or no match', () => {
    expect(highlightLogText('abc', '')).toEqual([{ text: 'abc', match: false }]);
    expect(highlightLogText('abc', 'z')).toEqual([{ text: 'abc', match: false }]);
  });
});

describe('nearestLogIndex', () => {
  const asc = sortLogEntries(entries);
  it('finds the nearest line in either order', () => {
    expect(nearestLogIndex(asc, NOW + 400)).toBe(0);
    expect(nearestLogIndex(asc, NOW + 900)).toBe(1);
    expect(nearestLogIndex(asc, NOW + 1800)).toBe(3);
    const desc = sortLogEntries(entries, 'desc');
    expect(desc[nearestLogIndex(desc, NOW + 1800) as number].id).toBe('a');
    expect(desc[nearestLogIndex(desc, NOW + 100) as number].id).toBe('b');
  });

  it('marks nothing outside the span or without a cursor', () => {
    expect(nearestLogIndex(asc, NOW - 1)).toBeNull();
    expect(nearestLogIndex(asc, NOW + 2001)).toBeNull();
    expect(nearestLogIndex(asc, null)).toBeNull();
    expect(nearestLogIndex([], NOW)).toBeNull();
  });
});

describe('describeLogEntry', () => {
  it('says time, severity, service and message', () => {
    expect(describeLogEntry(entries[1])).toBe('Oct 22 14:00:00.000 UTC, INFO, web, Request started');
  });
});
