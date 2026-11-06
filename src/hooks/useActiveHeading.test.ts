import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useActiveHeading } from './useActiveHeading';

/**
 * jsdom reports `scrollHeight` as 0 and `getBoundingClientRect()` as all-zero,
 * which would make every heading look like it sits exactly on the reading line
 * *and* make the page look permanently scrolled to the bottom. Both have to be
 * stubbed for the hook's real branches to be reachable.
 */
function mountHeadings(tops: Record<string, number>, pageHeight = 5000) {
  document.body.innerHTML = '';

  for (const [id, top] of Object.entries(tops)) {
    const el = document.createElement('h2');
    el.id = id;
    el.getBoundingClientRect = () => ({ top, bottom: top + 40, height: 40 }) as DOMRect;
    document.body.appendChild(el);
  }

  Object.defineProperty(document.body, 'scrollHeight', {
    value: pageHeight,
    configurable: true,
  });
}

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
    vi.runAllTimers();
  });
}

describe('useActiveHeading', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // rAF-throttled listener: run the callback synchronously so a dispatched
    // scroll event settles within the same act().
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('returns null above the first heading', () => {
    mountHeadings({ intro: 500, usage: 900 });

    const { result } = renderHook(() => useActiveHeading(['intro', 'usage'], { offset: 0 }));

    expect(result.current).toBeNull();
  });

  it('activates a heading once it crosses the reading line', () => {
    // The line sits at offset + 24, so a top of 20 is above it and 30 is not.
    mountHeadings({ intro: 20, usage: 900 });

    const { result } = renderHook(() => useActiveHeading(['intro', 'usage'], { offset: 0 }));

    expect(result.current).toBe('intro');
  });

  it('reports the last heading above the line, not the first', () => {
    mountHeadings({ intro: -400, usage: -100, api: 600 });

    const { result } = renderHook(() =>
      useActiveHeading(['intro', 'usage', 'api'], { offset: 0 }),
    );

    expect(result.current).toBe('usage');
  });

  it('keeps a heading active after it scrolls far past the top', () => {
    // The reason this is a measured-rect listener rather than an
    // IntersectionObserver: a heading scrolled well above the viewport stops
    // intersecting, but it is still the section being read.
    mountHeadings({ intro: -9000, usage: 700 });

    const { result } = renderHook(() => useActiveHeading(['intro', 'usage'], { offset: 0 }));

    expect(result.current).toBe('intro');
  });

  it('advances as the reader scrolls', () => {
    mountHeadings({ intro: 20, usage: 900 });

    const { result } = renderHook(() => useActiveHeading(['intro', 'usage'], { offset: 0 }));
    expect(result.current).toBe('intro');

    mountHeadings({ intro: -500, usage: 10 });
    scrollTo(520);

    expect(result.current).toBe('usage');
  });

  it('honours an explicit offset', () => {
    mountHeadings({ intro: 100, usage: 900 });

    // Line is 0 + 24 — the heading at 100 has not reached it.
    const { result: tight } = renderHook(() =>
      useActiveHeading(['intro', 'usage'], { offset: 0 }),
    );
    expect(tight.current).toBeNull();

    // Line is 100 + 24 — now it has.
    const { result: loose } = renderHook(() =>
      useActiveHeading(['intro', 'usage'], { offset: 100 }),
    );
    expect(loose.current).toBe('intro');
  });

  it('falls back to --docs-header-height when no offset is given', () => {
    mountHeadings({ intro: 100, usage: 900 });
    document.documentElement.style.setProperty('--docs-header-height', '120px');

    const { result } = renderHook(() => useActiveHeading(['intro', 'usage']));

    expect(result.current).toBe('intro');
    document.documentElement.style.removeProperty('--docs-header-height');
  });

  it('treats an unparseable header height as zero', () => {
    mountHeadings({ intro: 100, usage: 900 });
    document.documentElement.style.setProperty('--docs-header-height', 'auto');

    const { result } = renderHook(() => useActiveHeading(['intro', 'usage']));

    expect(result.current).toBeNull();
    document.documentElement.style.removeProperty('--docs-header-height');
  });

  // Short trailing sections may never cross the line, which would leave the
  // last entry in the TOC permanently unreachable.
  it('pins to the last heading at the bottom of the page', () => {
    mountHeadings({ intro: -500, usage: -200, api: 700 }, 1000);
    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true });

    const { result } = renderHook(() =>
      useActiveHeading(['intro', 'usage', 'api'], { offset: 0 }),
    );

    expect(result.current).toBe('api');
  });

  it('returns null when disabled', () => {
    mountHeadings({ intro: -100, usage: 900 });

    const { result } = renderHook(() =>
      useActiveHeading(['intro', 'usage'], { offset: 0, enabled: false }),
    );

    expect(result.current).toBeNull();
  });

  it('returns null for an empty id list', () => {
    mountHeadings({});

    const { result } = renderHook(() => useActiveHeading([], { offset: 0 }));

    expect(result.current).toBeNull();
  });

  it('skips ids with no matching element', () => {
    mountHeadings({ intro: -400, api: -100 });

    const { result } = renderHook(() =>
      useActiveHeading(['intro', 'ghost', 'api'], { offset: 0 }),
    );

    expect(result.current).toBe('api');
  });

  it('recomputes on resize', () => {
    mountHeadings({ intro: 500, usage: 900 });

    const { result } = renderHook(() => useActiveHeading(['intro', 'usage'], { offset: 0 }));
    expect(result.current).toBeNull();

    mountHeadings({ intro: -100, usage: 900 });
    act(() => {
      window.dispatchEvent(new Event('resize'));
      vi.runAllTimers();
    });

    expect(result.current).toBe('intro');
  });

  // Callers build `ids` inline from a TOC, so a fresh array arrives every
  // render. Binding on identity would rebind the listener continuously.
  it('does not rebind listeners when an equal ids array is recreated', () => {
    mountHeadings({ intro: -100, usage: 900 });
    const addSpy = vi.spyOn(window, 'addEventListener');

    const { rerender } = renderHook(({ ids }) => useActiveHeading(ids, { offset: 0 }), {
      initialProps: { ids: ['intro', 'usage'] },
    });
    const afterMount = addSpy.mock.calls.length;

    rerender({ ids: ['intro', 'usage'] });

    expect(addSpy.mock.calls.length).toBe(afterMount);
  });

  it('rebinds when the ids actually change', () => {
    mountHeadings({ intro: -100, usage: -50 });

    const { result, rerender } = renderHook(
      ({ ids }) => useActiveHeading(ids, { offset: 0 }),
      { initialProps: { ids: ['intro'] } },
    );
    expect(result.current).toBe('intro');

    rerender({ ids: ['intro', 'usage'] });

    expect(result.current).toBe('usage');
  });

  it('removes its listeners on unmount', () => {
    mountHeadings({ intro: -100, usage: 900 });
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useActiveHeading(['intro', 'usage'], { offset: 0 }));
    unmount();

    const removed = removeSpy.mock.calls.map(([event]) => event);
    expect(removed).toContain('scroll');
    expect(removed).toContain('resize');
  });

  it('registers the scroll listener as passive', () => {
    mountHeadings({ intro: -100 });
    const addSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useActiveHeading(['intro'], { offset: 0 }));

    const scrollCall = addSpy.mock.calls.find(([event]) => event === 'scroll');
    expect(scrollCall?.[2]).toEqual({ passive: true });
  });
});
