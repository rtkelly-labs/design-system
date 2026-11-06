import { useEffect, useState } from 'react';

export interface UseActiveHeadingOptions {
  /**
   * Distance from the top of the viewport, in px, that counts as the "reading
   * line". A heading is active once it scrolls above this line. Defaults to
   * reading the `--docs-header-height` custom property so scroll-spy stays in
   * sync with the sticky header without callers passing the number around.
   */
  offset?: number;
  /** Disable the listener entirely (e.g. when no TOC is rendered). */
  enabled?: boolean;
}

/**
 * Scroll-spy over a list of heading ids. Returns the id of the heading the
 * reader is currently inside — the last one whose top edge has passed the
 * reading line — or `null` above the first heading.
 *
 * Uses measured rects on a rAF-throttled scroll listener rather than an
 * IntersectionObserver. "Last heading above a line" is awkward to express as an
 * observer `rootMargin` (a heading scrolled far past the top stops intersecting
 * and would stop reporting), and doc pages have few enough headings that
 * measuring them is cheap.
 */
export function useActiveHeading(
  ids: readonly string[],
  { offset, enabled = true }: UseActiveHeadingOptions = {},
): string | null {
  const [active, setActive] = useState<string | null>(null);

  // Depend on the joined key rather than the array identity: callers almost
  // always build `ids` inline from a TOC, so a fresh array arrives every render
  // and an identity dep would rebind the listener continuously.
  const key = ids.join('|');

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const headingIds = key ? key.split('|') : [];
    if (headingIds.length === 0) {
      setActive(null);
      return;
    }

    let frame = 0;

    const resolveOffset = (): number => {
      if (typeof offset === 'number') return offset;
      const raw = getComputedStyle(document.documentElement).getPropertyValue(
        '--docs-header-height',
      );
      const parsed = Number.parseFloat(raw);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const measure = () => {
      frame = 0;
      // A little breathing room below the header so a heading counts as "read"
      // just before it tucks underneath it.
      const line = resolveOffset() + 24;

      // Bottom of the page: the final sections may be too short to ever cross
      // the line, so pin to the last heading instead of leaving it unreachable.
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
      if (scrolledToBottom) {
        setActive(headingIds[headingIds.length - 1] ?? null);
        return;
      }

      let current: string | null = null;
      for (const id of headingIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= line) current = id;
        else break;
      }

      setActive(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [key, offset, enabled]);

  return active;
}
