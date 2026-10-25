import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTraceReplay } from './useTraceReplay';

describe('useTraceReplay', () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'] }));
  afterEach(() => vi.useRealTimers());

  it('rests at the end until played, then advances in real time and stops', () => {
    const { result } = renderHook(() => useTraceReplay(400));
    expect(result.current).toMatchObject({ elapsed: 400, playing: false });
    act(() => result.current.play());
    expect(result.current.elapsed).toBe(0);
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current.elapsed).toBeGreaterThan(150);
    expect(result.current.elapsed).toBeLessThan(250);
    act(() => { vi.advanceTimersByTime(400); });
    expect(result.current).toMatchObject({ elapsed: 400, playing: false });
  });

  it('scales by speed, pauses, seeks within bounds, and restarts', () => {
    const { result } = renderHook(() => useTraceReplay(1000, { autoPlay: true, speed: 2 }));
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current.elapsed).toBeGreaterThan(300);
    act(() => result.current.pause());
    const paused = result.current.elapsed;
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.elapsed).toBe(paused);
    act(() => result.current.seek(5000));
    expect(result.current.elapsed).toBe(1000);
    act(() => result.current.seek(-5));
    expect(result.current.elapsed).toBe(0);
    act(() => result.current.restart());
    expect(result.current).toMatchObject({ elapsed: 0, playing: true });
  });

  it('loops after holding at the end', () => {
    const { result } = renderHook(() => useTraceReplay(100, { autoPlay: true, loop: true, loopDelay: 200 }));
    act(() => { vi.advanceTimersByTime(150); });
    expect(result.current).toMatchObject({ elapsed: 100, playing: true });
    act(() => { vi.advanceTimersByTime(250); });
    expect(result.current.elapsed).toBeLessThan(100);
    expect(result.current.playing).toBe(true);
  });

  it('does nothing for an empty trace', () => {
    const { result } = renderHook(() => useTraceReplay(0, { autoPlay: true }));
    act(() => result.current.play());
    expect(result.current).toMatchObject({ elapsed: 0, playing: false });
  });

  it('follows a trace that grows under it, and clamps one that shrinks', () => {
    // Spans that load after mount: the player rests at the end of nothing, then of 400ms.
    const { result, rerender } = renderHook(({ duration }) => useTraceReplay(duration), { initialProps: { duration: 0 } });
    expect(result.current.elapsed).toBe(0);
    rerender({ duration: 400 });
    expect(result.current).toMatchObject({ elapsed: 400, playing: false });
    act(() => result.current.seek(300));
    rerender({ duration: 100 });
    expect(result.current.elapsed).toBe(100);
    rerender({ duration: 500 });
    expect(result.current.elapsed).toBe(500);
  });
});
