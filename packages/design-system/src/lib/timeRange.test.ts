import { describe, expect, it } from 'vitest';
import {
  TIME_RANGE_PRESETS,
  bucketTimes,
  clampToRange,
  formatClock,
  formatRange,
  formatRangeDuration,
  formatTimeTick,
  formatTimestamp,
  normaliseRange,
  presetRange,
  timeTicks,
} from './timeRange';

const NOW = Date.UTC(2026, 9, 22, 14, 7, 30, 120);
const HOUR = 3_600_000;

describe('timeRange', () => {
  it('resolves presets against now and normalises ranges', () => {
    expect(presetRange(TIME_RANGE_PRESETS[1]!, NOW)).toEqual({ from: NOW - HOUR, to: NOW });
    expect(normaliseRange({ from: 5, to: 1 })).toEqual({ from: 1, to: 5 });
    expect(normaliseRange({ from: Number.NaN, to: 1 })).toBeNull();
    expect(normaliseRange(null)).toBeNull();
    expect(clampToRange(10, { from: 0, to: 5 })).toBe(5);
  });

  it('formats in UTC by hand', () => {
    expect(formatClock(NOW)).toBe('14:07');
    expect(formatClock(NOW, true)).toBe('14:07:30');
    expect(formatTimestamp(NOW, 'millisecond')).toBe('Oct 22 14:07:30.120');
    expect(formatTimestamp(NOW, 'minute')).toBe('Oct 22 14:07');
    expect(formatTimeTick(NOW, HOUR)).toBe('14:07');
    expect(formatTimeTick(NOW, 60_000)).toBe('14:07:30');
    expect(formatTimeTick(NOW, 7 * 24 * HOUR)).toBe('Oct 22');
    expect(formatRange({ from: NOW - HOUR, to: NOW })).toBe('13:07 – 14:07');
    expect(formatRange({ from: NOW - 3 * 24 * HOUR, to: NOW })).toBe('Oct 19 14:07 – Oct 22 14:07');
    expect([15 * 60_000, 90 * 60_000, 2 * 24 * HOUR + 5 * 60_000, 0].map(formatRangeDuration)).toEqual(['15m', '1h 30m', '2d 5m', '0m']);
  });

  it('ticks on round UTC times', () => {
    const ticks = timeTicks({ from: NOW - HOUR, to: NOW }, 5);
    expect(ticks.map((tick) => formatClock(tick))).toEqual(['13:15', '13:30', '13:45', '14:00']);
    expect(timeTicks({ from: 5, to: 5 })).toEqual([5]);
  });

  it('splits a range into equal buckets that cover it exactly', () => {
    const buckets = bucketTimes({ from: 0, to: 100 }, 4);
    expect(buckets).toEqual([{ from: 0, to: 25 }, { from: 25, to: 50 }, { from: 50, to: 75 }, { from: 75, to: 100 }]);
    expect(bucketTimes({ from: 0, to: 10 }, 0)).toHaveLength(1);
  });
});
