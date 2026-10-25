'use client';

import { forwardRef, useRef, type HTMLAttributes, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from '../lib/recipe';
import {
  centreViewportRows,
  clampViewportWindow,
  panViewportRows,
  panViewportWindow,
  VIEWPORT_MIN_WINDOW,
  type ViewportRows,
  type ViewportWindow,
} from '../lib/viewport';

/** What a mark is painted as. Roles, not hues: a flame diff's delta grounds, a trace's outcomes. */
export type MinimapTone = 'neutral' | 'muted' | 'accent' | 'danger' | 'info' | 'added' | 'added-ground' | 'removed' | 'removed-ground';

/** One mark: a horizontal run `[x0, x1]` in fractions of the whole, on a row. */
export interface MinimapMark {
  x0: number;
  x1: number;
  row: number;
  tone?: MinimapTone;
}

/** Fill classes per tone. Literal strings: Tailwind reads source text, not runtime values. */
const TONE_FILL: Record<MinimapTone, string> = {
  neutral: 'fill-surface-raised',
  muted: 'fill-surface-sunken',
  accent: 'fill-accent-primary',
  danger: 'fill-intent-danger',
  info: 'fill-intent-info',
  added: 'fill-delta-added',
  'added-ground': 'fill-delta-ground-added',
  removed: 'fill-delta-removed',
  'removed-ground': 'fill-delta-ground-removed',
};

export interface MinimapProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> {
  /** The overview: every mark the chart has, in normalised units. Drawn once, as one static SVG. */
  marks: readonly MinimapMark[];
  /** How many rows the whole chart has; marks are placed on `0 … rows − 1`. */
  rows: number;
  /** The horizontal window the chart shows, drawn as the rectangle's sides. */
  window: ViewportWindow;
  /** The rows the chart shows, drawn as the rectangle's top and bottom. Omit for the full height. */
  rowWindow?: ViewportRows | null;
  /** Called with the new window (and rows, when `rowWindow` is given) as the rectangle is dragged or moved with the arrow keys. */
  onWindowChange?: (window: ViewportWindow, rows: ViewportRows | null) => void;
  /** `top-down` puts row 0 at the top (a waterfall, an icicle); `bottom-up` at the bottom (a flame graph). Default `top-down`. */
  rowOrder?: 'top-down' | 'bottom-up';
  /** `fill` paints each mark the full row height (a flame graph's frames); `line` a thin stroke centred in it (a trace's spans). Default `fill`. */
  markStyle?: 'fill' | 'line';
  /** Height of the strip in pixels. Default 40. */
  height?: number;
  /** The narrowest window a drag or key can make, as a fraction. Default a thousandth. */
  minWidth?: number;
  /** Marks narrower than one pixel at this width are left out. Default 960. */
  pixelWidth?: number;
  /** Accessible name. Default `Overview`. */
  label?: string;
  /** What a screen reader hears as the value. Default: the window as percentages, and the rows when given. */
  valueText?: string;
  /** Classes for the inner SVG — for a caller that flips it with a container query. */
  chartClassName?: string;
}

/** `12%–34%` across, and `rows 3–20 of 44` when there is a row window. */
function describeWindow(window: ViewportWindow, rowWindow: ViewportRows | null | undefined, rows: number): string {
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  const across = `Showing ${percent(window.start)} to ${percent(window.end)} across`;
  return rowWindow ? `${across}, rows ${rowWindow.min + 1} to ${rowWindow.max + 1} of ${rows}` : across;
}

/**
 * The whole of a dense chart in a strip, with the part on screen drawn over it
 * as a rectangle — horizontally the window, vertically the rows in view.
 *
 * The marks are whatever the chart supplies (`{ x0, x1, row, tone }` in
 * normalised units), so one component serves a flame graph's frames and a
 * trace's spans. It renders as plain SVG, so a static report still shows the
 * overview with its window; with script the rectangle drags on touch and mouse
 * — grab it to move it, press elsewhere to centre it there — and, focused,
 * the arrow keys pan it (Shift for a whole window), Home and End jump to the
 * edges. It is announced as a slider whose value is the window.
 */
export const Minimap = forwardRef<HTMLDivElement, MinimapProps>(function Minimap(
  {
    marks,
    rows,
    window: win,
    rowWindow,
    onWindowChange,
    rowOrder = 'top-down',
    markStyle = 'fill',
    height = 40,
    minWidth = VIEWPORT_MIN_WINDOW,
    pixelWidth = 960,
    label = 'Overview',
    valueText,
    chartClassName,
    className,
    ...props
  },
  ref,
) {
  const count = Math.max(1, rows);
  const rowHeight = height / count;
  const yOf = (row: number) => (rowOrder === 'bottom-up' ? (count - 1 - row) * rowHeight : row * rowHeight);
  const top = rowWindow ? (rowOrder === 'bottom-up' ? yOf(rowWindow.max) : yOf(rowWindow.min)) : 0;
  const tall = rowWindow ? (rowWindow.max - rowWindow.min + 1) * rowHeight : height;
  const half = (win.end - win.start) / 2;

  const drag = useRef<{ dx: number; dRow: number } | null>(null);
  const locate = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return null;
    const fx = (event.clientX - box.left) / box.width;
    const fy = (event.clientY - box.top) / box.height;
    const row = rowOrder === 'bottom-up' ? (1 - fy) * count - 0.5 : fy * count - 0.5;
    return { fx, row };
  };
  const moveTo = (fx: number, row: number) => {
    if (!onWindowChange || !drag.current) return;
    const centre = fx - drag.current.dx;
    const next = clampViewportWindow({ start: centre - half, end: centre + half }, minWidth);
    const nextRows = rowWindow ? centreViewportRows(rowWindow, row - drag.current.dRow, count - 1) : null;
    onWindowChange(next, nextRows);
  };
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const at = locate(event);
    if (!at || !onWindowChange) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    // Grabbing the rectangle keeps the grip; pressing elsewhere centres it there.
    const inside = at.fx >= win.start && at.fx <= win.end;
    const rowCentre = rowWindow ? (rowWindow.min + rowWindow.max) / 2 : 0;
    const insideRows = rowWindow ? at.row >= rowWindow.min - 0.5 && at.row <= rowWindow.max + 0.5 : true;
    drag.current = { dx: inside ? at.fx - (win.start + win.end) / 2 : 0, dRow: rowWindow && insideRows ? at.row - rowCentre : 0 };
    moveTo(at.fx, at.row);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const at = locate(event);
    if (at) moveTo(at.fx, at.row);
  };
  const end = () => { drag.current = null; };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onWindowChange) return;
    const width = win.end - win.start;
    const step = event.shiftKey ? width : width / 10;
    const rowStep = rowWindow ? (event.shiftKey ? rowWindow.max - rowWindow.min + 1 : 1) : 0;
    // Up is up as drawn: earlier rows top-down, later rows bottom-up.
    const up = rowOrder === 'bottom-up' ? rowStep : -rowStep;
    let next = win;
    let nextRows = rowWindow ?? null;
    switch (event.key) {
      case 'ArrowLeft': next = panViewportWindow(win, -step, minWidth); break;
      case 'ArrowRight': next = panViewportWindow(win, step, minWidth); break;
      case 'ArrowUp': if (!rowWindow) return; nextRows = panViewportRows(rowWindow, up, count - 1); break;
      case 'ArrowDown': if (!rowWindow) return; nextRows = panViewportRows(rowWindow, -up, count - 1); break;
      case 'Home': next = panViewportWindow(win, -1, minWidth); break;
      case 'End': next = panViewportWindow(win, 1, minWidth); break;
      default: return;
    }
    event.preventDefault();
    onWindowChange(next, nextRows);
  };

  const lineHeight = Math.max(1, Math.min(2, rowHeight * 0.6));
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation="horizontal"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(win.start * 100)}
      aria-valuetext={valueText ?? describeWindow(win, rowWindow, count)}
      data-slot="minimap"
      {...props}
      className={cn('block w-full cursor-grab touch-none select-none border border-edge-subtle bg-surface-base focus-visible:outline-2 focus-visible:outline-accent-primary', className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
    >
      <svg aria-hidden="true" width="100%" height={height} className={cn('block', chartClassName)}>
        {marks.map((mark, index) => {
          const x0 = Math.max(0, Math.min(mark.x0, mark.x1));
          const x1 = Math.min(1, Math.max(mark.x0, mark.x1));
          if ((x1 - x0) * pixelWidth < 1 && markStyle === 'fill') return null;
          const y = markStyle === 'line' ? yOf(mark.row) + rowHeight / 2 - lineHeight / 2 : yOf(mark.row);
          return (
            // Keyed by position: marks are a static drawing, never reordered in place.
            <rect
              key={index}
              x={`${x0 * 100}%`}
              y={y}
              // A line is never thinner than a pixel at the assumed width: a short span still shows where it is.
              width={`${(markStyle === 'line' ? Math.max(x1 - x0, 1 / pixelWidth) : x1 - x0) * 100}%`}
              height={markStyle === 'line' ? lineHeight : Math.max(0.5, rowHeight - 0.5)}
              className={TONE_FILL[mark.tone ?? 'neutral']}
            />
          );
        })}
        <rect
          data-slot="minimap-window"
          x={`${win.start * 100}%`}
          y={top}
          width={`${(win.end - win.start) * 100}%`}
          height={tall}
          className="fill-accent-primary/15 stroke-accent-primary stroke-2"
        />
      </svg>
    </div>
  );
});

Minimap.displayName = 'Minimap';
