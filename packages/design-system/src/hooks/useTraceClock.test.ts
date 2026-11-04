import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTraceClock } from './useTraceClock';

describe('useTraceClock', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('ticks while running and holds its last value once stopped', () => {
    let time = 1000;
    const read = () => time;
    const { result, rerender } = renderHook(({ running }) => useTraceClock({ running, interval: 50, read }), { initialProps: { running: true } });
    expect(result.current).toBe(1000);
    time = 1050;
    act(() => { vi.advanceTimersByTime(50); });
    expect(result.current).toBe(1050);
    rerender({ running: false });
    time = 2000;
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current).toBe(1050);
  });
});
