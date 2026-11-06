import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCopyToClipboard } from './useCopyToClipboard';

/** Install a `navigator.clipboard` stub, or remove the API entirely. */
function stubClipboard(writeText: ((value: string) => Promise<void>) | null) {
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText ? { writeText } : undefined,
    configurable: true,
    writable: true,
  });
}

describe('useCopyToClipboard', () => {
  /*
   * Strict fake timers, with no `shouldAdvanceTime`.
   *
   * It was `vi.useFakeTimers({ shouldAdvanceTime: true })`, which makes the fake
   * clock *also* advance with the real one — reintroducing the race that fake
   * timers exist to remove. Under full-suite parallel load, real time passed
   * between `advanceTimersByTime(1999)` and the assertion after it, the reset
   * timer fired early, and the test failed while passing in isolation every
   * time (#173).
   */
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    stubClipboard(null);
  });

  it('starts idle', () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.copied).toBe(false);
    expect(result.current.failed).toBe(false);
  });

  it('writes through the async Clipboard API and reports success', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await expect(result.current.copy('hello')).resolves.toBe(true);
    });

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(result.current.copied).toBe(true);
    expect(result.current.failed).toBe(false);
  });

  it('clears the copied flag after the reset window', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));

    const { result } = renderHook(() => useCopyToClipboard(2000));

    await act(async () => {
      await result.current.copy('hello');
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.copied).toBe(false);
  });

  it('honours a custom reset window', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));

    const { result } = renderHook(() => useCopyToClipboard(50));

    await act(async () => {
      await result.current.copy('hello');
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current.copied).toBe(false);
  });

  // The reason the fallback exists: the async Clipboard API needs a secure
  // context, so a static docs build previewed over plain http:// on a LAN
  // address has no `navigator.clipboard` at all.
  it('falls back to execCommand when the Clipboard API is absent', async () => {
    stubClipboard(null);
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      value: execCommand,
      configurable: true,
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await expect(result.current.copy('fallback')).resolves.toBe(true);
    });

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(result.current.copied).toBe(true);
  });

  it('falls back to execCommand when the Clipboard API rejects', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      value: execCommand,
      configurable: true,
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await expect(result.current.copy('retry')).resolves.toBe(true);
    });

    expect(execCommand).toHaveBeenCalledWith('copy');
    expect(result.current.failed).toBe(false);
  });

  it('leaves no stray textarea behind after the fallback path', async () => {
    stubClipboard(null);
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(true),
      configurable: true,
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy('tidy');
    });

    expect(document.querySelectorAll('textarea')).toHaveLength(0);
  });

  it('reports failure when both paths fail', async () => {
    stubClipboard(null);
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await expect(result.current.copy('nope')).resolves.toBe(false);
    });

    expect(result.current.copied).toBe(false);
    expect(result.current.failed).toBe(true);
  });

  it('reports failure when execCommand throws', async () => {
    stubClipboard(null);
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockImplementation(() => {
        throw new Error('boom');
      }),
      configurable: true,
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await expect(result.current.copy('nope')).resolves.toBe(false);
    });

    expect(result.current.failed).toBe(true);
  });

  it('clears the failed flag after the reset window too', async () => {
    stubClipboard(null);
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
    });

    const { result } = renderHook(() => useCopyToClipboard(100));

    await act(async () => {
      await result.current.copy('nope');
    });
    expect(result.current.failed).toBe(true);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.failed).toBe(false);
  });

  // A second copy must restart the window rather than inheriting the first
  // copy's remaining time.
  it('restarts the reset window on a rapid second copy', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));

    const { result } = renderHook(() => useCopyToClipboard(100));

    await act(async () => {
      await result.current.copy('first');
    });

    act(() => {
      vi.advanceTimersByTime(80);
    });

    await act(async () => {
      await result.current.copy('second');
    });

    act(() => {
      vi.advanceTimersByTime(80);
    });
    expect(result.current.copied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(result.current.copied).toBe(false);
  });

  it('does not fire its reset timer after unmount', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));

    const { result, unmount } = renderHook(() => useCopyToClipboard(100));

    await act(async () => {
      await result.current.copy('hello');
    });

    unmount();

    // Would warn about setting state on an unmounted component if the effect
    // cleanup were not clearing the timer.
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(200);
      });
    }).not.toThrow();
  });

  it('keeps a stable copy callback across renders', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));

    const { result, rerender } = renderHook(() => useCopyToClipboard(100));
    const first = result.current.copy;

    rerender();

    expect(result.current.copy).toBe(first);
  });

  /*
   * The one test that wants a real clock: `waitFor` polls on real timers, so
   * under the fake clock above it would never re-check and would time out. This
   * asserts that the transition is observable to an awaiting consumer, not when
   * it happens, so there is no window to control and nothing to make flaky.
   */
  it('exposes the state transition to consumers awaiting it', async () => {
    vi.useRealTimers();
    stubClipboard(vi.fn().mockResolvedValue(undefined));

    const { result } = renderHook(() => useCopyToClipboard());

    act(() => {
      void result.current.copy('async');
    });

    await waitFor(() => expect(result.current.copied).toBe(true));
  });
});
