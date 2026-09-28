/**
 * Which pages a `Pagination` strip shows, and where the gaps go.
 *
 * The one property worth specifying rather than discovering: **the number of
 * items is a function of `totalPages` alone.** It never depends on where the
 * current page is. A strip that grows and shrinks as the reader clicks moves
 * the control they are about to press out from under the pointer, which is
 * worse than having no numbers at all.
 *
 * The shape is first page, last page, a window of `siblings` either side of the
 * current page, and at most two ellipses:
 *
 * ```
 * 1 2 3 4 5 … 20      current near the start
 * 1 … 6 7 8 … 20      current in the middle
 * 1 … 16 17 18 19 20  current near the end
 * ```
 *
 * Seven slots with the default single sibling. When the window touches an end
 * the slot an ellipsis would have taken is given to a page instead, which is
 * what keeps the count fixed. An ellipsis therefore always stands for **two or
 * more** pages: hiding exactly one page behind `…` costs the same slot as
 * showing it.
 *
 * With `totalPages` at or under the slot count every page is shown and there is
 * no ellipsis — `1 2 3 4 5 6 7` is shorter to read than any abbreviation of it.
 */

/** A page number, or one of the two gaps. Each gap has its own key. */
export type PaginationRangeItem = number | 'ellipsis-start' | 'ellipsis-end';

/** The fixed item count for a strip with `siblings` pages either side of current. */
export function paginationSlots(siblings = 1): number {
  // first + last + two gaps + current + the window either side of it
  return 5 + siblings * 2;
}

function range(from: number, to: number): number[] {
  return Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
}

/**
 * The items to render, in order.
 *
 * `currentPage` is clamped into `1..totalPages`, so an out-of-range value
 * renders the nearest real page rather than a strip with no current item.
 * A `totalPages` below 1 has no pages and returns an empty list.
 */
export function paginationRange(
  totalPages: number,
  currentPage: number,
  siblings = 1,
): PaginationRangeItem[] {
  const total = Math.floor(totalPages);
  if (!(total >= 1)) return [];

  const slots = paginationSlots(siblings);
  if (total <= slots) return range(1, total);

  const current = Math.min(Math.max(Math.floor(currentPage) || 1, 1), total);

  // The window, slid so it never runs into the first or last page. Pushing it
  // inward at the ends is what hands the unused ellipsis slot to a page.
  const windowStart = Math.max(Math.min(current - siblings, total - 2 - siblings * 2), 3);
  const windowEnd = Math.min(Math.max(current + siblings, 3 + siblings * 2), total - 2);

  return [
    1,
    windowStart > 3 ? 'ellipsis-start' : 2,
    ...range(windowStart, windowEnd),
    windowEnd < total - 2 ? 'ellipsis-end' : total - 1,
    total,
  ];
}
