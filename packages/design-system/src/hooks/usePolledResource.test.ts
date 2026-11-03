import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePolledResource } from './usePolledResource';
import type { UsePolledResourceOptions } from './usePolledResource';

/** A promise the test settles by hand, so the order answers arrive in is under control. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

let visibility: DocumentVisibilityState = 'visible';

function setVisibility(next: DocumentVisibilityState) {
  visibility = next;
  document.dispatchEvent(new Event('visibilitychange'));
}

/** Let settled promises run their callbacks, inside act. */
async function flush() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('usePolledResource', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.UTC(2026, 10, 3, 12, 0));
    visibility = 'visible';
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  });

  afterEach(() => {
    // Delete the own property so the prototype's getter shows through again.
    Reflect.deleteProperty(document, 'visibilityState');
  });

  it('loads once on mount and reports when', async () => {
    const load = vi.fn().mockResolvedValue('first');
    const { result } = renderHook(() => usePolledResource(load));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeUndefined();
    await flush();

    expect(load).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({ data: 'first', error: undefined, loading: false, updatedAt: Date.UTC(2026, 10, 3, 12, 0) });
  });

  it('polls intervalMs after each load settles, while visible', async () => {
    const load = vi.fn().mockResolvedValue('x');
    renderHook(() => usePolledResource(load, { intervalMs: 1000 }));
    await flush();

    await act(async () => {
      vi.advanceTimersByTime(999);
    });
    expect(load).toHaveBeenCalledTimes(1);
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(load).toHaveBeenCalledTimes(2);
    await flush();
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(load).toHaveBeenCalledTimes(3);
  });

  it('loads once and never polls when intervalMs is zero', async () => {
    const load = vi.fn().mockResolvedValue('x');
    renderHook(() => usePolledResource(load, { intervalMs: 0 }));
    await flush();
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('skips ticks while hidden, and loads at once on return if one was missed', async () => {
    const load = vi.fn().mockResolvedValue('x');
    renderHook(() => usePolledResource(load, { intervalMs: 1000 }));
    await flush();

    act(() => setVisibility('hidden'));
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });
    expect(load).toHaveBeenCalledTimes(1);

    act(() => setVisibility('visible'));
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not load on return when no tick fell due while hidden', async () => {
    const load = vi.fn().mockResolvedValue('x');
    renderHook(() => usePolledResource(load, { intervalMs: 1000 }));
    await flush();

    act(() => setVisibility('hidden'));
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    act(() => setVisibility('visible'));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('keeps the last good data when a later load fails, and clears the error on success', async () => {
    const load = vi.fn().mockResolvedValueOnce('good').mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce('again');
    const { result } = renderHook(() => usePolledResource(load, { intervalMs: 0 }));
    await flush();
    const firstUpdate = result.current.updatedAt;

    vi.setSystemTime(Date.UTC(2026, 10, 3, 12, 5));
    act(() => result.current.reload());
    await flush();
    expect(result.current).toMatchObject({ data: 'good', error: 'timeout', loading: false, updatedAt: firstUpdate });

    act(() => result.current.reload());
    await flush();
    expect(result.current).toMatchObject({ data: 'again', error: undefined, updatedAt: Date.UTC(2026, 10, 3, 12, 5) });
  });

  it('normalises a thrown non-Error, and a synchronous throw, to a message', async () => {
    const load = vi.fn(() => {
      throw 'no route';
    });
    const { result } = renderHook(() => usePolledResource(load, { intervalMs: 0 }));
    await flush();
    expect(result.current).toMatchObject({ data: undefined, error: 'no route', loading: false });
  });

  it('discards an answer that arrives after a newer request', async () => {
    const slow = deferred<string>();
    const fast = deferred<string>();
    const load = vi.fn().mockReturnValueOnce(slow.promise).mockReturnValueOnce(fast.promise);
    const { result } = renderHook(() => usePolledResource(load, { intervalMs: 0 }));

    act(() => result.current.reload());
    await act(async () => {
      fast.resolve('fresh');
      await fast.promise;
    });
    await act(async () => {
      slow.resolve('stale');
      await slow.promise;
    });

    expect(result.current.data).toBe('fresh');
  });

  it('clears the previous key’s data in the same render the key changes, then loads the new key', async () => {
    const next = deferred<string>();
    const load = vi.fn<() => Promise<string>>().mockResolvedValueOnce('job 1').mockReturnValueOnce(next.promise);
    const { result, rerender } = renderHook((options: UsePolledResourceOptions) => usePolledResource(load, options), {
      initialProps: { key: 1, intervalMs: 0 },
    });
    await flush();
    expect(result.current.data).toBe('job 1');

    rerender({ key: 2, intervalMs: 0 });
    expect(result.current).toMatchObject({ data: undefined, updatedAt: undefined, loading: true });
    expect(load).toHaveBeenCalledTimes(2);

    await act(async () => {
      next.resolve('job 2');
      await next.promise;
    });
    expect(result.current.data).toBe('job 2');
  });

  it('reads the latest load through a ref: a new closure reloads nothing', async () => {
    const first = vi.fn().mockResolvedValue('a');
    const second = vi.fn().mockResolvedValue('b');
    const { result, rerender } = renderHook(({ load }) => usePolledResource(load, { intervalMs: 0 }), {
      initialProps: { load: first },
    });
    await flush();

    rerender({ load: second });
    await flush();
    expect(second).not.toHaveBeenCalled();

    act(() => result.current.reload());
    await flush();
    expect(second).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe('b');
  });

  it('does nothing while disabled, and loads when enabled', async () => {
    const load = vi.fn().mockResolvedValue('x');
    const { result, rerender } = renderHook(({ enabled }) => usePolledResource(load, { enabled }), {
      initialProps: { enabled: false },
    });
    expect(result.current.loading).toBe(false);
    act(() => result.current.reload());
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(load).not.toHaveBeenCalled();

    rerender({ enabled: true });
    await flush();
    expect(load).toHaveBeenCalledTimes(1);
    expect(result.current.data).toBe('x');
  });

  it('keeps a stable reload across renders', () => {
    const load = vi.fn().mockResolvedValue('x');
    const { result, rerender } = renderHook(() => usePolledResource(load));
    const first = result.current.reload;
    rerender();
    expect(result.current.reload).toBe(first);
  });

  it('stops polling and ignores late answers after unmount', async () => {
    const pending = deferred<string>();
    const load = vi.fn().mockReturnValue(pending.promise);
    const { unmount } = renderHook(() => usePolledResource(load, { intervalMs: 1000 }));
    unmount();
    await act(async () => {
      pending.resolve('late');
      await pending.promise;
      vi.advanceTimersByTime(10_000);
    });
    expect(load).toHaveBeenCalledTimes(1);
  });
});
