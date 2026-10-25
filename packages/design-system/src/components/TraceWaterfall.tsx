'use client';

import { ChevronDown, ChevronRight, Diamond } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
import { cn, recipe } from '../lib/recipe';
import {
  buildTrace,
  formatTraceDuration,
  matchTraceSpan,
  visibleTraceSpans,
  type TraceModel,
  type TraceSpan,
  type TraceSpanInput,
} from '../lib/trace';
import {
  clampViewportWindow,
  panViewportWindow,
  sameViewportWindow,
  VIEWPORT_FULL_WINDOW,
  zoomViewportWindow,
  type ViewportRows,
  type ViewportWindow,
} from '../lib/viewport';
import { Minimap, type MinimapMark } from './Minimap';

/** The bar's drawing width in SVG user units; the SVG stretches it to the cell. */
const SCALE = 1000;
/** `auto` shows the minimap above this many spans — past it, a trace no longer fits a screen. */
const MINIMAP_DENSE = 40;
/** Two taps closer than this, in milliseconds and pixels, are a double tap. */
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 30;
/** A touch that moves this far is a drag, not a tap. */
const DRAG_PX = 8;

const traceWaterfall = recipe({
  slots: {
    // A container, so the layout follows the waterfall's own width: in a phone
    // or a narrow panel the bar would get no column, so it drops to a line of
    // its own under the name, still aligned with the axis.
    root: '@container flex min-w-0 flex-col font-mono text-sm text-content-primary',
    overview: 'sticky top-0 z-10 flex flex-col gap-1 bg-surface-base pb-1',
    controls: 'flex flex-wrap items-center gap-1',
    control: 'h-7 min-w-7 cursor-pointer border border-edge-default px-2 text-xs text-content-secondary hover:border-edge-strong hover:text-content-primary focus-visible:outline-2 focus-visible:outline-accent-primary disabled:cursor-default disabled:opacity-40 @max-xl:min-h-11 @max-xl:min-w-11',
    axis: 'grid grid-cols-[minmax(0,1fr)_4.5rem] gap-3 border-b border-edge-subtle pb-1 text-xs text-content-muted @xl:grid-cols-[minmax(8rem,16rem)_minmax(0,1fr)_4.5rem]',
    axisLabel: 'hidden @xl:block',
    tree: 'flex flex-col gap-0.5 py-1 @xl:gap-0',
    row: 'grid cursor-pointer grid-cols-[minmax(0,1fr)_4.5rem] min-h-11 items-center gap-x-3 border-l-2 border-transparent px-1 py-2 hover:bg-surface-sunken @xl:min-h-0 @xl:grid-cols-[minmax(8rem,16rem)_minmax(0,1fr)_4.5rem] @xl:py-0.5',
    label: 'col-start-1 row-start-1 flex min-w-0 items-center gap-1',
    guide: 'h-[1.5em] w-3 shrink-0 border-l border-edge-subtle',
    toggle: 'w-3 shrink-0 select-none text-center text-content-muted',
    name: 'truncate',
    bar: 'col-start-1 row-start-2 mt-1.5 h-2.5 w-full overflow-visible @xl:col-start-2 @xl:row-start-1 @xl:mt-0 @xl:h-3',
    duration: 'col-start-2 row-start-1 text-right tabular-nums text-content-secondary @xl:col-start-3',
    empty: 'text-content-muted',
  },
  variants: {
    selected: { true: { row: 'border-accent-primary bg-surface-raised' } },
    // A row fades in from the left as it mounts — `@starting-style`, so no
    // keyframes and no timer. Off by default: a static trace should not move.
    animate: { true: { row: 'transition-[opacity,translate] duration-300 ease-out starting:-translate-x-2 starting:opacity-0 motion-reduce:transition-none' } },
    critical: { true: { name: 'font-bold' } },
    error: { true: { duration: 'text-intent-danger' } },
    // With a sticky minimap above, a row scrolled to by the minimap stops below it.
    overview: { true: { row: 'scroll-mt-32' } },
  },
});

/**
 * Bars are painted by outcome, never by service: on midnight a secondary
 * accent sits too close to the danger role, and an error has to read as one at
 * a glance. The service is in the row's title and in the details.
 */
function barFill(span: TraceSpan): string {
  if (span.status === 'error') return 'fill-intent-danger';
  if (span.inFlight) return 'fill-intent-info';
  return 'fill-accent-primary';
}

/** The minimap tone for a span — the same outcome `barFill` paints. */
function markTone(span: TraceSpan): MinimapMark['tone'] {
  if (span.status === 'error') return 'danger';
  if (span.inFlight) return 'info';
  return 'accent';
}

/** What a screen reader hears for one row — the bar's geometry, said in words. */
export function describeTraceSpan(span: TraceSpan): string {
  return [
    span.name,
    span.service,
    `starts at ${formatTraceDuration(span.offset)}`,
    span.inFlight ? `running for ${formatTraceDuration(span.duration)}` : `takes ${formatTraceDuration(span.duration)}`,
    ...(span.status === 'error' ? ['error'] : []),
    ...(span.critical ? ['on the critical path'] : []),
  ].join(', ');
}

/** A value that is controlled when the prop is defined, and owned here otherwise. */
function useControllable<T>(value: T | undefined, initial: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [owned, setOwned] = useState(initial);
  const current = value === undefined ? owned : value;
  const set = useCallback((next: T) => {
    if (value === undefined) setOwned(next);
    onChange?.(next);
  }, [value, onChange]);
  return [current, set];
}

const noSubscribe = () => () => {};
/** False in a server or static render, true once running in a browser — without an effect, so hydration agrees. */
function useEnhanced(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}

/** The nearest ancestor that scrolls vertically, or `null` for the page. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let at = node.parentElement; at; at = at.parentElement) {
    const { overflowY } = getComputedStyle(at);
    if ((overflowY === 'auto' || overflowY === 'scroll') && at.scrollHeight > at.clientHeight) return at;
  }
  return null;
}

/** A time window over a trace, in milliseconds from its start. */
export interface TraceWindow {
  start: number;
  end: number;
}

export interface TraceWaterfallProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** The spans, or a model already built with `buildTrace`. */
  spans: readonly TraceSpanInput[] | TraceModel;
  /**
   * Where in-flight spans end, in the spans' own epoch. Advance it — see
   * `useTraceClock` — and in-flight bars grow. Ignored when `spans` is a model.
   */
  now?: number;
  /** The selected span id. Controlled when defined; `null` selects nothing. */
  selectedId?: string | null;
  /** The span selected on mount when uncontrolled. */
  defaultSelectedId?: string | null;
  /** Called with the id a click, Enter or Space selects. */
  onSelectedChange?: (id: string | null) => void;
  /** Ids of collapsed spans. Controlled when defined. */
  collapsed?: readonly string[];
  /** Ids collapsed on mount when uncontrolled. */
  defaultCollapsed?: readonly string[];
  /** Called with the new collapsed set when a row is expanded or collapsed. */
  onCollapsedChange?: (ids: string[]) => void;
  /** Show only spans matching this text (name, service or `key=value`), with their ancestors. */
  filter?: string;
  /** Roughly how many axis intervals to draw. Default 4. */
  ticks?: number;
  /**
   * Fix the axis to this many milliseconds instead of fitting the spans — so a
   * replay's bars grow across a still axis rather than the axis shrinking
   * under them. Never shorter than the spans themselves. A time window zooms
   * within it.
   */
  range?: number;
  /** Draw a playhead at this offset, in milliseconds from the trace start. */
  playhead?: number;
  /**
   * The time window, in milliseconds from the trace start: bars, ticks and the
   * playhead are drawn inside it, and a span crossing an edge is clipped with
   * an edge mark. Controlled when defined; `null` is the whole trace.
   */
  window?: TraceWindow | null;
  /** The window on mount when uncontrolled — and where Reset returns. Default: the whole trace. */
  defaultWindow?: TraceWindow | null;
  /** Called with the new window after a pinch, drag, wheel, double-tap, button or minimap drag. */
  onWindowChange?: (window: TraceWindow) => void;
  /**
   * The minimap above the axis: every visible row as a thin line, toned by
   * outcome, with the time window and the rows in view drawn over it. Drag it
   * to pan the window and scroll the tree. `auto` shows it for a trace of more
   * than 40 spans, and in a narrow container. Default `auto`.
   */
  minimap?: 'auto' | 'always' | 'never';
  /** Fade rows in as they appear. For replays and streams. Default false. */
  animate?: boolean;
  /** Accessible name for the span tree. Default `Trace waterfall`. */
  label?: string;
}

/**
 * A distributed-trace waterfall: one row per span, nested by parent, each bar
 * placed on a shared time axis.
 *
 * The rows are a keyboard tree — arrows move, Left and Right collapse and
 * expand, Enter or Space selects, `+` `-` `0` zoom — hand-rolled rather than
 * borrowed, per the one-interaction-library rule. Bars are SVG, so placing
 * them takes no inline style. In-flight spans (no end) are drawn to `now`;
 * feed it a clock and the waterfall is live. `◆` marks the critical path.
 *
 * The axis is a **time window** over the trace, zoomed with the Flamegraph's
 * gestures: pinch or double-tap on touch, Ctrl/⌘+wheel or double-click with a
 * mouse, Shift+wheel or a sideways drag to pan, and − / + / Reset / Fit all.
 * A dense trace gets a sticky **minimap** that shows where the window and the
 * scrolled rows sit in the whole run. All of it renders statically at the
 * default window.
 */
export const TraceWaterfall = forwardRef<HTMLDivElement, TraceWaterfallProps>(function TraceWaterfall(
  {
    spans,
    now,
    selectedId: selectedProp,
    defaultSelectedId = null,
    onSelectedChange,
    collapsed: collapsedProp,
    defaultCollapsed = [],
    onCollapsedChange,
    filter,
    ticks = 4,
    range,
    playhead,
    window: windowProp,
    defaultWindow = null,
    onWindowChange,
    minimap = 'auto',
    animate = false,
    label = 'Trace waterfall',
    className,
    ...props
  },
  ref,
) {
  const enhanced = useEnhanced();
  const model = useMemo(() => buildTrace(spans, { now }), [spans, now]);
  const [selectedId, setSelectedId] = useControllable<string | null>(selectedProp, defaultSelectedId, onSelectedChange);
  const [collapsedList, setCollapsedList] = useControllable<readonly string[]>(collapsedProp, defaultCollapsed, onCollapsedChange as ((ids: readonly string[]) => void) | undefined);
  const collapsed = useMemo(() => new Set(collapsedList), [collapsedList]);
  const rows = useMemo(
    () => visibleTraceSpans(model, collapsed, filter?.trim() ? (span) => matchTraceSpan(span, filter) : undefined),
    [model, collapsed, filter],
  );
  // Evenly divided: the labels sit in equal-width cells, and placing them
  // anywhere else would take inline style.
  const intervals = Math.max(1, Math.min(12, Math.round(ticks)));
  const extent = Number.isFinite(range) && (range as number) > model.duration ? (range as number) : model.duration;

  // The time window, held in milliseconds and drawn as fractions of the extent.
  const [rawWindow, setRawWindow] = useControllable<TraceWindow | null>(windowProp, defaultWindow, onWindowChange as ((next: TraceWindow | null) => void) | undefined);
  const win = useMemo<ViewportWindow>(
    () => (rawWindow && extent > 0 ? clampViewportWindow({ start: rawWindow.start / extent, end: rawWindow.end / extent }) : VIEWPORT_FULL_WINDOW),
    [rawWindow, extent],
  );
  const span = win.end - win.start;
  const zoomed = !sameViewportWindow(win, VIEWPORT_FULL_WINDOW);
  const setWindow = (next: ViewportWindow) => {
    const clamped = clampViewportWindow(next);
    setRawWindow({ start: clamped.start * extent, end: clamped.end * extent });
  };
  const fitAll = () => setRawWindow({ start: 0, end: extent });
  const reset = () => setRawWindow(defaultWindow ?? { start: 0, end: extent });

  const windowStart = win.start * extent;
  const windowSpan = span * extent;
  const toX = (ms: number) => (windowSpan > 0 ? ((ms - windowStart) / windowSpan) * SCALE : 0);
  const axis = useMemo(() => Array.from({ length: intervals }, (_, index) => windowStart + (windowSpan * index) / intervals), [windowStart, windowSpan, intervals]);
  const playheadX = playhead !== undefined && Number.isFinite(playhead) && windowSpan > 0 && playhead >= windowStart && playhead <= windowStart + windowSpan ? toX(playhead) : null;

  // Roving tabindex: one row is in the tab order, and arrow keys move it.
  const [activeId, setActiveId] = useState<string | null>(null);
  const focusId = rows.some((row) => row.id === activeId) ? activeId : (rows.find((row) => row.id === selectedId) ?? rows[0])?.id ?? null;
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingFocus = useRef(false);
  useEffect(() => {
    if (!pendingFocus.current || !focusId) return;
    pendingFocus.current = false;
    rowRefs.current.get(focusId)?.focus();
  }, [focusId]);
  const moveTo = (id: string | undefined) => {
    if (!id) return;
    pendingFocus.current = true;
    setActiveId(id);
  };

  const toggle = (span: TraceSpan, open?: boolean) => {
    if (!span.children.length) return;
    const isOpen = !collapsed.has(span.id);
    if (open === isOpen) return;
    setCollapsedList(isOpen ? [...collapsedList, span.id] : collapsedList.filter((id) => id !== span.id));
  };

  // ---- Minimap: shown for a dense trace, or by the container query in a narrow one -----------
  const dense = model.spans.length > MINIMAP_DENSE;
  const showMinimap = minimap === 'always' || (minimap === 'auto' && rows.length > 0);
  const minimapClass = minimap === 'auto' && !dense ? 'hidden @max-xl:flex' : 'flex';
  const marks = useMemo<MinimapMark[]>(
    () => (extent > 0 ? rows.map((row, index) => ({ x0: row.offset / extent, x1: (row.offset + row.duration) / extent, row: index, tone: markTone(row) })) : []),
    [rows, extent],
  );
  const treeRef = useRef<HTMLDivElement | null>(null);
  const overviewRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState<ViewportRows | null>(null);
  useEffect(() => {
    const tree = treeRef.current;
    if (!showMinimap || !tree || typeof window === 'undefined') return undefined;
    const container = scrollParent(tree);
    let frame = 0;
    const measure = () => {
      frame = 0;
      const box = container?.getBoundingClientRect();
      const bottom = box ? box.bottom : window.innerHeight;
      // The sticky overview covers the top of the scroll area; rows under it are not in view.
      const top = Math.max(box ? box.top : 0, overviewRef.current?.getBoundingClientRect().bottom ?? 0);
      let min = -1;
      let max = -1;
      rows.forEach((row, index) => {
        const rect = rowRefs.current.get(row.id)?.getBoundingClientRect();
        if (!rect || rect.height === 0 || rect.bottom <= top || rect.top >= bottom) return;
        if (min < 0) min = index;
        max = index;
      });
      setInView((current) => (min < 0 ? null : current && current.min === min && current.max === max ? current : { min, max }));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    const target: HTMLElement | Window = container ?? window;
    target.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      target.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [showMinimap, rows]);
  const scrollToRow = (index: number) => {
    const row = rows[Math.max(0, Math.min(rows.length - 1, index))];
    rowRefs.current.get(row?.id ?? '')?.scrollIntoView?.({ block: 'start' });
  };

  // ---- Gestures: the Flamegraph's model, horizontal only -----------------------------------
  const trackRef = useRef<HTMLSpanElement | null>(null);
  const suppressClick = useRef(false);
  const gesture = useRef<{ pointers: Map<number, { x: number; y: number }>; pinch: { dx: number; window: ViewportWindow; anchor: number } | null; drag: { x: number; y: number; window: ViewportWindow; panning: boolean } | null; moved: boolean; lastTap: { t: number; x: number; y: number } | null; lastType: string }>({
    pointers: new Map(), pinch: null, drag: null, moved: false, lastTap: null, lastType: 'mouse',
  });
  /** The fraction of the extent under a client x, measured on the axis track the bars share. */
  const fractionAt = (clientX: number, at: ViewportWindow = win): number => {
    const box = trackRef.current?.getBoundingClientRect();
    if (!box || box.width <= 0) return (at.start + at.end) / 2;
    return at.start + ((clientX - box.left) / box.width) * (at.end - at.start);
  };
  const zoomAt = (factor: number, clientX?: number) => setWindow(zoomViewportWindow(win, factor, clientX === undefined ? undefined : fractionAt(clientX)));

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    g.lastType = event.pointerType;
    if (event.pointerType === 'mouse') return;
    if (g.pointers.size === 0) { g.moved = false; suppressClick.current = false; }
    g.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (g.pointers.size === 2) {
      const [a, b] = [...g.pointers.values()];
      g.pinch = { dx: Math.abs(a.x - b.x), window: win, anchor: fractionAt((a.x + b.x) / 2) };
      g.drag = null;
    } else if (g.pointers.size === 1) {
      g.drag = { x: event.clientX, y: event.clientY, window: win, panning: false };
    }
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g.pointers.has(event.pointerId)) return;
    g.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (g.pinch && g.pointers.size >= 2) {
      const [a, b] = [...g.pointers.values()];
      const dx = Math.abs(a.x - b.x);
      if (g.pinch.dx > 0 && Math.abs(dx - g.pinch.dx) > DRAG_PX) {
        setWindow(zoomViewportWindow(g.pinch.window, dx / g.pinch.dx, g.pinch.anchor));
        g.moved = true;
      }
      return;
    }
    const drag = g.drag;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.panning && Math.abs(dx) > DRAG_PX && Math.abs(dx) > Math.abs(dy) && !sameViewportWindow(drag.window, VIEWPORT_FULL_WINDOW)) drag.panning = true;
    if (Math.abs(dx) > DRAG_PX || Math.abs(dy) > DRAG_PX) g.moved = true;
    if (drag.panning) {
      const box = trackRef.current?.getBoundingClientRect();
      if (box && box.width > 0) setWindow(panViewportWindow(drag.window, (-dx / box.width) * (drag.window.end - drag.window.start)));
    }
  };
  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g.pointers.has(event.pointerId)) return;
    const wasSingle = g.pointers.size === 1 && !g.pinch;
    g.pointers.delete(event.pointerId);
    if (g.pointers.size < 2) g.pinch = null;
    if (g.pointers.size === 0) g.drag = null;
    if (g.moved) {
      suppressClick.current = true;
      g.lastTap = null;
      return;
    }
    if (!wasSingle || event.type === 'pointercancel') return;
    const last = g.lastTap;
    if (last && event.timeStamp - last.t < DOUBLE_TAP_MS && Math.hypot(event.clientX - last.x, event.clientY - last.y) < DOUBLE_TAP_PX) {
      zoomAt(2, event.clientX);
      g.lastTap = null;
    } else {
      g.lastTap = { t: event.timeStamp, x: event.clientX, y: event.clientY };
    }
  };
  const onDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (gesture.current.lastType !== 'mouse') return;
    if ((event.target as HTMLElement).closest('[data-part="toggle"]')) return;
    zoomAt(2, event.clientX);
  };

  // Wheel needs a non-passive listener to stop the page scrolling under a zoom. Plain vertical wheel is left to the page.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const latest = useRef({ win, setWindow, fractionAt });
  useEffect(() => {
    latest.current = { win, setWindow, fractionAt };
  });
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;
    const onWheel = (event: WheelEvent) => {
      const now = latest.current;
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        now.setWindow(zoomViewportWindow(now.win, Math.exp(-event.deltaY * 0.01), now.fractionAt(event.clientX)));
      } else if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        if (sameViewportWindow(now.win, VIEWPORT_FULL_WINDOW)) return;
        const box = trackRef.current?.getBoundingClientRect();
        if (!box || box.width <= 0) return;
        event.preventDefault();
        const delta = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
        now.setWindow(panViewportWindow(now.win, (delta / box.width) * (now.win.end - now.win.start)));
      }
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [model.spans.length]);
  const setRootRef = (node: HTMLDivElement | null) => {
    rootRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, row: TraceSpan) => {
    const index = rows.findIndex((other) => other.id === row.id);
    const open = row.children.length > 0 && !collapsed.has(row.id);
    switch (event.key) {
      case 'ArrowDown': moveTo(rows[index + 1]?.id); break;
      case 'ArrowUp': moveTo(rows[index - 1]?.id); break;
      case 'Home': moveTo(rows[0]?.id); break;
      case 'End': moveTo(rows[rows.length - 1]?.id); break;
      case 'ArrowRight':
        if (row.children.length && !open) toggle(row, true);
        else if (open) moveTo(rows[index + 1]?.id);
        else return;
        break;
      case 'ArrowLeft':
        if (open) toggle(row, false);
        else if (row.parentId) moveTo(row.parentId);
        else return;
        break;
      case 'Enter':
      case ' ':
        setSelectedId(row.id);
        break;
      case '+':
      case '=':
        setWindow(zoomViewportWindow(win, 2, extent > 0 ? (row.offset + row.duration / 2) / extent : undefined));
        break;
      case '-': setWindow(zoomViewportWindow(win, 0.5)); break;
      case '0': reset(); break;
      default:
        return;
    }
    event.preventDefault();
  };

  const styles = traceWaterfall();
  const summary = `${model.spans.length} spans across ${model.services.length} services over ${formatTraceDuration(model.duration)}${model.errorCount ? `, ${model.errorCount} with errors` : ''}${model.inFlightCount ? `, ${model.inFlightCount} in flight` : ''}.`;

  if (!model.spans.length) {
    return (
      <div ref={ref} data-slot="trace-waterfall" {...props} className={styles.root({ className })}>
        <p className={styles.empty()}>No spans to display.</p>
      </div>
    );
  }

  return (
    <div
      ref={setRootRef}
      data-slot="trace-waterfall"
      data-live={model.inFlightCount > 0 || undefined}
      data-window={`${Math.round(windowStart)} ${Math.round(windowStart + windowSpan)}`}
      {...props}
      className={styles.root({ className })}
    >
      <p className="sr-only">{summary}</p>
      {showMinimap || enhanced ? (
        <div ref={overviewRef} data-part="overview" className={styles.overview()}>
          {enhanced ? (
            <div role="toolbar" aria-label="Zoom" data-part="controls" className={styles.controls()}>
              <button type="button" aria-label="Zoom out" className={styles.control()} disabled={!zoomed} onClick={() => zoomAt(0.5)}>−</button>
              <button type="button" aria-label="Zoom in" className={styles.control()} disabled={span <= 0.0011} onClick={() => zoomAt(2)}>+</button>
              <button type="button" className={styles.control()} onClick={reset}>Reset</button>
              <button type="button" className={styles.control()} disabled={!zoomed} onClick={fitAll}>Fit all</button>
            </div>
          ) : null}
          {showMinimap ? (
            <Minimap
              label="Trace overview"
              marks={marks}
              rows={rows.length}
              window={win}
              rowWindow={inView}
              markStyle="line"
              height={Math.max(32, Math.min(80, rows.length * 2))}
              valueText={`Showing ${formatTraceDuration(windowStart)} to ${formatTraceDuration(windowStart + windowSpan)}${inView ? `, rows ${inView.min + 1} to ${inView.max + 1} of ${rows.length}` : ''}`}
              className={minimapClass}
              onWindowChange={(next, nextRows) => {
                setWindow(next);
                if (nextRows && (!inView || nextRows.min !== inView.min)) scrollToRow(nextRows.min);
              }}
            />
          ) : null}
        </div>
      ) : null}
      <div aria-hidden="true" data-part="axis" className={styles.axis()}>
        <span className={styles.axisLabel()}>Span</span>
        <span ref={trackRef} data-part="axis-track" className="flex min-w-0">
          {axis.map((tick, index) => (
            // Keyed by position: a zero-length trace has every tick at 0.
            <span key={index} className="min-w-0 flex-1 truncate border-l border-edge-subtle pl-1">
              {formatTraceDuration(tick)}
            </span>
          ))}
        </span>
        <span className="text-right">{formatTraceDuration(windowStart + windowSpan)}</span>
      </div>
      {rows.length ? null : <p className={styles.empty()}>No spans match the filter.</p>}
      {/* Gestures land on a plain wrapper: the tree keeps its keyboard role, the pointer work is presentation. */}
      <div
        role="presentation"
        data-part="gestures"
        className="touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onDoubleClick={onDoubleClick}
      >
      <div ref={treeRef} role="tree" aria-label={label} className={styles.tree()}>
        {rows.map((row) => {
          const selected = row.id === selectedId;
          const hasChildren = row.children.length > 0;
          const open = hasChildren && !collapsed.has(row.id);
          const x0 = toX(row.offset);
          const x1 = toX(row.offset + row.duration);
          const inside = x1 > 0 && x0 < SCALE;
          const clipLeft = inside && x0 < 0;
          const clipRight = inside && x1 > SCALE;
          const left = Math.max(0, x0);
          const width = extent > 0 ? Math.max(2, Math.min(SCALE, x1) - left) : SCALE;
          return (
            <div
              key={row.id}
              ref={(node) => { if (node) rowRefs.current.set(row.id, node); else rowRefs.current.delete(row.id); }}
              role="treeitem"
              aria-level={row.depth + 1}
              aria-expanded={hasChildren ? open : undefined}
              aria-selected={selected}
              aria-label={describeTraceSpan(row)}
              tabIndex={row.id === focusId ? 0 : -1}
              data-span-id={row.id}
              data-status={row.status}
              data-critical={row.critical || undefined}
              data-in-flight={row.inFlight || undefined}
              data-clipped={clipLeft && clipRight ? 'both' : clipLeft ? 'start' : clipRight ? 'end' : inside ? undefined : 'outside'}
              className={styles.row({ selected, animate, overview: showMinimap })}
              onFocus={() => setActiveId(row.id)}
              onClick={(event) => {
                if (suppressClick.current) { suppressClick.current = false; return; }
                if ((event.target as HTMLElement).closest('[data-part="toggle"]')) toggle(row);
                else setSelectedId(row.id);
              }}
              onKeyDown={(event) => onKeyDown(event, row)}
            >
              <span className={styles.label()}>
                {Array.from({ length: row.depth }, (_, index) => <span key={index} aria-hidden="true" className={styles.guide()} />)}
                <span aria-hidden="true" data-part="toggle" className={styles.toggle()}>{hasChildren ? (open ? <ChevronDown size={12} className="inline-block" /> : <ChevronRight size={12} className="inline-block" />) : null}</span>
                {row.critical ? <Diamond aria-hidden="true" size={10} className="shrink-0 fill-current text-accent-primary" /> : null}
                <span className={styles.name({ critical: row.critical })} title={`${row.name} · ${row.service}`}>{row.name}</span>
              </span>
              <svg aria-hidden="true" viewBox={`0 0 ${SCALE} 12`} preserveAspectRatio="none" className={styles.bar()}>
                {axis.slice(1).map((_, index) => {
                  const at = ((index + 1) / intervals) * SCALE;
                  return <line key={index} x1={at} x2={at} y1={0} y2={12} vectorEffect="non-scaling-stroke" className="stroke-edge-subtle" strokeDasharray="2 2" />;
                })}
                {inside ? <rect x={Math.min(left, SCALE - width)} y={1} width={width} height={10} className={cn(barFill(row), row.inFlight && 'opacity-70')} /> : null}
                {/* A span running past an edge of the window says so: a heavy tick on that edge. */}
                {clipLeft ? <line data-part="edge" x1={1} x2={1} y1={-1} y2={13} vectorEffect="non-scaling-stroke" strokeWidth={3} className="stroke-content-primary" /> : null}
                {clipRight ? <line data-part="edge" x1={SCALE - 1} x2={SCALE - 1} y1={-1} y2={13} vectorEffect="non-scaling-stroke" strokeWidth={3} className="stroke-content-primary" /> : null}
                {playheadX === null ? null : <line data-part="playhead" x1={playheadX} x2={playheadX} y1={-2} y2={14} vectorEffect="non-scaling-stroke" className="stroke-content-primary" strokeWidth={1.5} />}
              </svg>
              <span className={styles.duration({ error: row.status === 'error' })}>
                {formatTraceDuration(row.duration)}{row.inFlight ? '…' : ''}
              </span>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
});

TraceWaterfall.displayName = 'TraceWaterfall';
