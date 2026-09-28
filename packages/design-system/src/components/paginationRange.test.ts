import { describe, expect, it } from 'vitest';
import { paginationRange, paginationSlots } from './paginationRange';

/**
 * The ellipsis algorithm, over the page counts where it changes shape: one
 * page, two, exactly the slot count (7), one past it (8, the first count that
 * needs an ellipsis and the easiest to get wrong), and a long run (100).
 *
 * The property that matters is asserted for **every** current page, not a
 * sample: the item count depends on `totalPages` and never on where the reader
 * is. A strip that changes width as you click it moves the next target.
 */
const COUNTS = [1, 2, 7, 8, 100] as const;

function pagesOf(items: ReturnType<typeof paginationRange>): number[] {
  return items.filter((i): i is number => typeof i === 'number');
}

describe('paginationRange', () => {
  it('has seven slots with one sibling either side', () => {
    expect(paginationSlots()).toBe(7);
    expect(paginationSlots(2)).toBe(9);
  });

  it.each(COUNTS)('holds a stable item count across every current page — %i pages', (total) => {
    const expected = Math.min(total, paginationSlots());
    for (let current = 1; current <= total; current++) {
      expect(paginationRange(total, current)).toHaveLength(expected);
    }
  });

  it.each(COUNTS)('always shows first, last and current, in order — %i pages', (total) => {
    for (let current = 1; current <= total; current++) {
      const pages = pagesOf(paginationRange(total, current));
      expect(pages[0]).toBe(1);
      expect(pages.at(-1)).toBe(total);
      expect(pages).toContain(current);
      expect([...pages].sort((a, b) => a - b)).toEqual(pages);
      expect(new Set(pages).size).toBe(pages.length);
    }
  });

  it.each(COUNTS)('shows the neighbours of the current page — %i pages', (total) => {
    for (let current = 1; current <= total; current++) {
      const pages = pagesOf(paginationRange(total, current));
      if (current > 1) expect(pages).toContain(current - 1);
      if (current < total) expect(pages).toContain(current + 1);
    }
  });

  it.each(COUNTS)('uses at most two ellipses, each hiding two or more pages — %i pages', (total) => {
    for (let current = 1; current <= total; current++) {
      const items = paginationRange(total, current);
      const gaps = items.filter((i) => typeof i === 'string');
      expect(gaps.length).toBeLessThanOrEqual(2);
      expect(new Set(gaps).size).toBe(gaps.length);
      items.forEach((item, i) => {
        if (typeof item !== 'string') return;
        const before = items[i - 1] as number;
        const after = items[i + 1] as number;
        expect(after - before - 1).toBeGreaterThanOrEqual(2);
      });
    }
  });

  it('lists every page with no ellipsis up to the slot count', () => {
    expect(paginationRange(1, 1)).toEqual([1]);
    expect(paginationRange(2, 2)).toEqual([1, 2]);
    expect(paginationRange(7, 4)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('gives the unused ellipsis slot to a page near either end — 8 pages', () => {
    expect(paginationRange(8, 1)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 8]);
    expect(paginationRange(8, 4)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 8]);
    expect(paginationRange(8, 5)).toEqual([1, 'ellipsis-start', 4, 5, 6, 7, 8]);
    expect(paginationRange(8, 8)).toEqual([1, 'ellipsis-start', 4, 5, 6, 7, 8]);
  });

  it('windows the middle with two ellipses — 100 pages', () => {
    expect(paginationRange(100, 1)).toEqual([1, 2, 3, 4, 5, 'ellipsis-end', 100]);
    expect(paginationRange(100, 50)).toEqual([1, 'ellipsis-start', 49, 50, 51, 'ellipsis-end', 100]);
    expect(paginationRange(100, 100)).toEqual([1, 'ellipsis-start', 96, 97, 98, 99, 100]);
  });

  it('keeps the count stable with a wider window too', () => {
    for (let current = 1; current <= 100; current++) {
      expect(paginationRange(100, current, 2)).toHaveLength(9);
    }
  });

  it('clamps an out-of-range current page, and has nothing to show for no pages', () => {
    expect(paginationRange(100, 0)).toEqual(paginationRange(100, 1));
    expect(paginationRange(100, 500)).toEqual(paginationRange(100, 100));
    expect(paginationRange(0, 1)).toEqual([]);
  });
});
