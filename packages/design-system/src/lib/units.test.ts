import { describe, expect, it } from 'vitest';
import { formatBytes } from './units';

const KiB = 1024;
const MiB = KiB ** 2;
const GiB = KiB ** 3;
const TiB = KiB ** 4;
const PiB = KiB ** 5;

describe('formatBytes', () => {
  it('writes zero as 0 B', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-0)).toBe('0 B');
    expect(formatBytes(0, { base: 1000 })).toBe('0 B');
  });

  it('writes bytes whole', () => {
    expect(formatBytes(1)).toBe('1 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1023)).toBe('1023 B');
    expect(formatBytes(12.4)).toBe('12 B');
    expect(formatBytes(0.4)).toBe('0 B');
  });

  it('defaults to base 1024 with IEC labels', () => {
    expect(formatBytes(KiB)).toBe('1 KiB');
    expect(formatBytes(1536)).toBe('1.5 KiB');
    expect(formatBytes(20 * MiB)).toBe('20 MiB');
    expect(formatBytes(1.25 * GiB)).toBe('1.3 GiB');
    expect(formatBytes(3.2 * TiB)).toBe('3.2 TiB');
    expect(formatBytes(PiB)).toBe('1 PiB');
  });

  it('uses SI labels at base 1000', () => {
    expect(formatBytes(999, { base: 1000 })).toBe('999 B');
    expect(formatBytes(1000, { base: 1000 })).toBe('1 kB');
    expect(formatBytes(1024, { base: 1000 })).toBe('1 kB');
    expect(formatBytes(1500, { base: 1000 })).toBe('1.5 kB');
    expect(formatBytes(2.5e6, { base: 1000 })).toBe('2.5 MB');
    expect(formatBytes(7e9, { base: 1000 })).toBe('7 GB');
    expect(formatBytes(4.2e12, { base: 1000 })).toBe('4.2 TB');
    expect(formatBytes(1e15, { base: 1000 })).toBe('1 PB');
  });

  it('keeps one decimal above bytes and drops a trailing .0', () => {
    expect(formatBytes(1100)).toBe('1.1 KiB');
    expect(formatBytes(1.04 * KiB)).toBe('1 KiB');
    expect(formatBytes(1.06 * MiB)).toBe('1.1 MiB');
    expect(formatBytes(999.9 * KiB)).toBe('999.9 KiB');
  });

  it('moves up a unit when rounding would reach the base', () => {
    expect(formatBytes(1023.4)).toBe('1023 B');
    expect(formatBytes(1023.6)).toBe('1 KiB');
    expect(formatBytes(1023.94 * KiB)).toBe('1023.9 KiB');
    expect(formatBytes(1023.96 * KiB)).toBe('1 MiB');
    expect(formatBytes(1023.96 * MiB)).toBe('1 GiB');
    expect(formatBytes(1023.96 * TiB)).toBe('1 PiB');
    expect(formatBytes(MiB - 1)).toBe('1 MiB');
    expect(formatBytes(999.96e3, { base: 1000 })).toBe('1 MB');
    expect(formatBytes(999.4, { base: 1000 })).toBe('999 B');
    expect(formatBytes(999.6, { base: 1000 })).toBe('1 kB');
  });

  it('stops at petabytes', () => {
    expect(formatBytes(2048 * PiB)).toBe('2048 PiB');
    expect(formatBytes(5e18, { base: 1000 })).toBe('5000 PB');
    expect(formatBytes(Number.MAX_SAFE_INTEGER)).toBe('8 PiB');
  });

  it('keeps the sign of a negative count', () => {
    expect(formatBytes(-512)).toBe('-512 B');
    expect(formatBytes(-1536)).toBe('-1.5 KiB');
    expect(formatBytes(-1023.96 * KiB)).toBe('-1 MiB');
    expect(formatBytes(-2e6, { base: 1000 })).toBe('-2 MB');
  });

  it('drops the sign when the value rounds to zero', () => {
    expect(formatBytes(-0.4)).toBe('0 B');
  });

  it('writes a value it cannot as an em dash', () => {
    expect(formatBytes(Number.NaN)).toBe('—');
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('—');
    expect(formatBytes(Number.NEGATIVE_INFINITY)).toBe('—');
    expect(formatBytes(Number.NaN, { base: 1000 })).toBe('—');
  });

  it('treats an unknown base as the default', () => {
    // A JavaScript caller can pass anything; it gets the documented default.
    expect(formatBytes(1536, { base: 10 as 1024 })).toBe('1.5 KiB');
    expect(formatBytes(1536, {})).toBe('1.5 KiB');
  });
});
