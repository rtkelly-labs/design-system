/**
 * The viewport model: what part of a dense chart a view shows, on two axes.
 *
 * A **window** is a horizontal range over a chart's whole extent, as fractions
 * `0 ≤ start < end ≤ 1` — of a flame graph's root, of a trace's duration. A
 * **row range** is a vertical range over whole rows, inclusive — a flame
 * graph's levels, a waterfall's rows. Pure data, no React, so `Flamegraph`,
 * `TraceWaterfall` and `Minimap` agree about clamping, zooming and panning,
 * and a static renderer can draw a pre-zoomed view without running any of them.
 *
 * Two rules hold everywhere: a range pushed past an edge **slides back rather
 * than shrinking**, so a pan never zooms; and a window is never narrower than
 * `minWidth` (a thousandth of the extent by default), so a zoom always has
 * something left to show.
 */

/** A horizontal window, as fractions of the whole: `0 ≤ start < end ≤ 1`. */
export interface ViewportWindow {
  start: number;
  end: number;
}

/** A vertical range of whole rows, inclusive. Row 0 is the first. */
export interface ViewportRows {
  min: number;
  max: number;
}

/** The narrowest window by default: a thousandth of the whole. */
export const VIEWPORT_MIN_WINDOW = 0.001;

/** The whole extent. */
export const VIEWPORT_FULL_WINDOW: ViewportWindow = Object.freeze({ start: 0, end: 1 });

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Keep a window inside `[0, 1]` and at least `minWidth` wide, sliding it back from an edge. */
export function clampViewportWindow(window: ViewportWindow, minWidth = VIEWPORT_MIN_WINDOW): ViewportWindow {
  const start = finite(window.start) ? window.start : 0;
  const end = finite(window.end) ? window.end : 1;
  const width = Math.min(1, Math.max(minWidth, Math.abs(end - start)));
  let from = Math.min(start, end);
  if (from < 0) from = 0;
  if (from + width > 1) from = 1 - width;
  return { start: from, end: from + width };
}

/**
 * Zoom by `factor` (2 is in ×2, 0.5 is out) about `anchor`, a fraction of the
 * whole that stays put on screen — the pinch centre, the pointer, the tap.
 */
export function zoomViewportWindow(window: ViewportWindow, factor: number, anchor = (window.start + window.end) / 2, minWidth = VIEWPORT_MIN_WINDOW): ViewportWindow {
  if (!(factor > 0)) return clampViewportWindow(window, minWidth);
  const width = window.end - window.start;
  const next = Math.min(1, Math.max(minWidth, width / factor));
  const at = width > 0 ? (anchor - window.start) / width : 0.5;
  const start = anchor - at * next;
  return clampViewportWindow({ start, end: start + next }, minWidth);
}

/** Slide a window by `delta`, a fraction of the whole. */
export function panViewportWindow(window: ViewportWindow, delta: number, minWidth = VIEWPORT_MIN_WINDOW): ViewportWindow {
  return clampViewportWindow({ start: window.start + delta, end: window.end + delta }, minWidth);
}

/** The window that frames `[x0, x1]`, widened by `pad` of its width on each side. */
export function fitViewportWindow(x0: number, x1: number, pad = 0, minWidth = VIEWPORT_MIN_WINDOW): ViewportWindow {
  const width = Math.abs(x1 - x0);
  const from = Math.min(x0, x1) - width * pad;
  return clampViewportWindow({ start: from, end: from + width * (1 + 2 * pad) }, minWidth);
}

/** True when two windows are the same to within rounding. */
export function sameViewportWindow(a: ViewportWindow, b: ViewportWindow): boolean {
  return Math.abs(a.start - b.start) < 1e-9 && Math.abs(a.end - b.end) < 1e-9;
}

/** Keep a row range inside `[0, last]`, at least one row, sliding rather than shrinking at an edge. */
export function clampViewportRows(rows: ViewportRows, last: number): ViewportRows {
  const top = Math.max(0, Math.floor(last));
  const lo = finite(rows.min) ? Math.round(rows.min) : 0;
  const hi = finite(rows.max) ? Math.round(rows.max) : top;
  const span = Math.min(top, Math.max(0, Math.abs(hi - lo)));
  let min = Math.min(lo, hi);
  if (min < 0) min = 0;
  if (min + span > top) min = top - span;
  return { min, max: min + span };
}

/** Show `factor` times fewer rows (2) or more (0.5), about the middle of the range — always by at least one row. */
export function zoomViewportRows(rows: ViewportRows, factor: number, last: number): ViewportRows {
  if (!(factor > 0)) return clampViewportRows(rows, last);
  const count = rows.max - rows.min + 1;
  let next = Math.round(count / factor);
  if (next === count) next += factor > 1 ? -1 : 1;
  next = Math.max(1, Math.min(Math.floor(last) + 1, next));
  const centre = (rows.min + rows.max) / 2;
  const min = Math.round(centre - (next - 1) / 2);
  return clampViewportRows({ min, max: min + next - 1 }, last);
}

/** Move a row range by `delta` rows. */
export function panViewportRows(rows: ViewportRows, delta: number, last: number): ViewportRows {
  return clampViewportRows({ min: rows.min + delta, max: rows.max + delta }, last);
}

/** Centre a row range of the same size on `row`. */
export function centreViewportRows(rows: ViewportRows, row: number, last: number): ViewportRows {
  const span = rows.max - rows.min;
  const min = Math.round(row - span / 2);
  return clampViewportRows({ min, max: min + span }, last);
}
