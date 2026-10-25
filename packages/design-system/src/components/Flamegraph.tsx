'use client';

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
  type ReactNode,
} from 'react';
import { cn, recipe } from '../lib/recipe';
import { Minimap, type MinimapMark, type MinimapTone } from './Minimap';
import { flameSameSwatch, flameSwatch, type FlamePalette } from '../lib/flamePalette';
import {
  clampFlameDepth,
  clampFlameWindow,
  diffFlame,
  fitFlameDepth,
  fitFlameWindow,
  fitFlameLabel,
  FLAME_FULL_WINDOW,
  flameDeltaTone,
  flamePath,
  flameWindowFrame,
  formatFlameDelta,
  formatFlameShare,
  formatFlameValue,
  panFlameDepth,
  panFlameWindow,
  rankFlameFrames,
  resolveFlameDepth,
  resolveFlameWindow,
  sameFlameWindow,
  searchFlame,
  windowFlame,
  zoomFlameDepth,
  zoomFlameWindow,
  type FlameDeltaTone,
  type FlameDepthSpec,
  type FlameDepthWindow,
  type FlameFrame,
  type FlameFrameDelta,
  type FlameRankedFrame,
  type FlameTree,
  type FlameWindow,
  type FlameWindowFrame,
  type FlameWindowSpec,
} from '../lib/flame';

/** Pixels per character of the `text-xs` monospace label, rounded up so an estimate never overflows. */
const CHAR_WIDTH = 7.4;
/** Inner padding either side of a frame's label, in pixels. */
const LABEL_PAD = 4;
/** Frames narrower than this many pixels are not drawn (nor focusable): they cannot be seen or hit. */
const MIN_FRAME_PX = 0.5;
/** Tooltip line height and padding, in pixels. */
const TIP_LINE = 16;
const TIP_PAD = 6;
/**
 * Below this container width the graph becomes a label-free overview and the
 * frame list carries the detail. Must match the `@max-[560px]` / `@min-[560px]`
 * variants below — Tailwind reads those as source text, so they cannot be built from it.
 */
const NARROW = 560;
/** Row height of the label-free overview in a measured narrow container: a 35-deep profile fits in about 450px. */
const NARROW_ROW = 12;
/** How far, in pixels, a tap in a row's empty space may land from a frame and still pick it. */
const TAP_SLOP = 12;
/** Two taps closer than this, in milliseconds and pixels, are a double tap. */
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 30;
/** A touch that moves this far is a drag, not a tap. */
const DRAG_PX = 8;
/** Height of the minimap strip, in pixels. */
const MINIMAP_HEIGHT = 40;
/** Rows of the frame list shown before "show all". */
const LIST_TOP = 10;

const flamegraph = recipe({
  slots: {
    root: '@container flex min-w-0 flex-col gap-2 font-mono text-xs text-content-primary',
    breadcrumb: 'm-0 flex list-none flex-wrap items-center gap-1 p-0 text-content-secondary',
    crumb: 'cursor-pointer border border-transparent px-1 hover:border-edge-default hover:text-content-primary focus-visible:outline-2 focus-visible:outline-accent-primary @max-[560px]:min-h-11 @max-[560px]:max-w-40 @max-[560px]:truncate',
    current: 'px-1 font-bold break-all text-content-primary',
    controls: 'flex items-center gap-1 @min-[560px]:flex-wrap',
    menu: 'absolute right-0 top-full z-10 mt-1 flex gap-1 border border-edge-strong bg-surface-base p-1 shadow-hard-sm',
    control: 'h-7 min-w-7 cursor-pointer border border-edge-default px-2 text-content-secondary hover:border-edge-strong hover:text-content-primary focus-visible:outline-2 focus-visible:outline-accent-primary disabled:cursor-default disabled:opacity-40 @max-[560px]:min-h-11 @max-[560px]:min-w-11',
    marker: 'flex h-6 w-full cursor-pointer items-center justify-center border border-dashed border-edge-default text-content-secondary hover:text-content-primary focus-visible:outline-2 focus-visible:outline-accent-primary @max-[560px]:min-h-11',
    frame: 'w-full min-w-0',
    chart: 'block w-full touch-pan-y select-none overflow-visible',
    status: 'text-content-secondary',
    details: 'flex flex-col gap-0.5 border border-edge-default bg-surface-raised px-2 py-1.5',
    action: 'min-h-7 cursor-pointer self-start border border-edge-default px-2 text-content-primary hover:border-edge-strong focus-visible:outline-2 focus-visible:outline-accent-primary @max-[560px]:min-h-11',
    list: 'flex-col gap-0',
    rows: 'm-0 flex list-none flex-col p-0',
    row: 'flex min-h-11 w-full cursor-pointer flex-col justify-center gap-1 border-b border-edge-subtle px-1 py-1.5 text-left @max-[560px]:gap-2 @max-[560px]:p-3 hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent-primary aria-[current=true]:bg-surface-raised aria-[current=true]:outline-2 aria-[current=true]:outline-accent-primary',
    more: 'flex min-h-11 cursor-pointer items-center text-content-secondary hover:text-content-primary',
    legend: 'm-0 grid list-none grid-cols-2 items-center gap-x-3 gap-y-1 p-0 text-content-secondary @min-[560px]:flex @min-[560px]:flex-wrap @min-[560px]:gap-x-4',
    removed: 'text-content-secondary',
    empty: 'text-content-muted',
  },
});

/** Rect and label classes per diff tone. Literal strings: Tailwind reads source text, not runtime values. */
const TONE: Record<FlameDeltaTone, { rect: string; text: string; label: string }> = {
  'grew-large': { rect: 'fill-delta-added', text: 'fill-content-inverse', label: 'grew ≥ large' },
  grew: { rect: 'fill-delta-ground-added', text: 'fill-content-primary', label: 'grew' },
  same: { rect: 'fill-surface-raised', text: 'fill-content-primary', label: 'within threshold' },
  shrank: { rect: 'fill-delta-ground-removed', text: 'fill-content-primary', label: 'shrank' },
  'shrank-large': { rect: 'fill-delta-removed', text: 'fill-content-inverse', label: 'shrank ≥ large' },
  new: { rect: 'fill-delta-added', text: 'fill-content-inverse', label: 'new frame' },
  unknown: { rect: 'fill-surface-sunken', text: 'fill-content-secondary', label: 'not computable' },
};
/** The same tones, as the shared minimap names them. */
const MINIMAP_TONE: Record<FlameDeltaTone, MinimapTone> = {
  'grew-large': 'added',
  grew: 'added-ground',
  same: 'neutral',
  shrank: 'removed-ground',
  'shrank-large': 'removed',
  new: 'added',
  unknown: 'muted',
};
const LEGEND_ORDER: FlameDeltaTone[] = ['grew-large', 'grew', 'same', 'shrank', 'shrank-large', 'new'];

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

/**
 * As `useControllable`, but an uncontrolled value that has never been set
 * follows `fallback` — so a default that depends on the measured width (the
 * phone's depth cap) keeps tracking it until someone pans or zooms.
 */
function useWindowState<T>(value: T | undefined, fallback: T, onChange?: (next: T) => void): [T, (next: T) => void, () => void] {
  const [owned, setOwned] = useState<T | null>(null);
  const current = value !== undefined ? value : (owned ?? fallback);
  const set = useCallback((next: T) => {
    if (value === undefined) setOwned(next);
    onChange?.(next);
  }, [value, onChange]);
  const reset = useCallback(() => {
    if (value === undefined) setOwned(null);
    onChange?.(fallback);
  }, [value, onChange, fallback]);
  return [current, set, reset];
}

const noSubscribe = () => () => {};
/** False in a server or static render, true once running in a browser — without an effect, so hydration agrees. */
function useEnhanced(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}

/** Track an element's content width: 0 until it reports one, and always in a static render. */
function useMeasuredWidth(): [(node: HTMLDivElement | null) => void, number] {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!node) return undefined;
    const measure = () => setWidth(Math.floor(node.getBoundingClientRect().width));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return [setNode, width];
}

/** A frame name with break opportunities after each `.` and before each `(`, so `Namespace.Type.Method(args)` wraps where a reader would. */
function breakable(name: string): ReactNode[] {
  return name.split(/(?<=\.)|(?=\()/).flatMap((part, index) => (index ? [<wbr key={index} />, part] : [part]));
}

/** What a screen reader hears for one frame — its numbers, said in words. */
export function describeFlameFrame(frame: FlameFrame, tree: FlameTree, change?: FlameFrameDelta, metric: 'self' | 'total' = 'self'): string {
  const parts = [
    frame.name,
    `total ${formatFlameValue(frame.total, tree.unit)}, ${formatFlameShare(tree.total > 0 ? frame.total / tree.total : null)} of all`,
    `self ${formatFlameValue(frame.self, tree.unit)}`,
  ];
  if (change) parts.push(change.status === 'new' ? 'new since the baseline' : `${metric} ${formatFlameDelta(change, metric, tree.unit)} against the baseline`);
  return parts.join(', ');
}

export interface FlamegraphProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * The profile to draw: `buildFlame(parseFoldedStacks(text))` for a sampled
   * profile, `flameFromTrace(spans)` for a trace. In `diff` mode this is the
   * **candidate**, and frame widths come from it.
   */
  profile: FlameTree;
  /** `single` draws one profile; `diff` paints each frame by its change against `baseline`. Default `single`. */
  mode?: 'single' | 'diff';
  /** The profile `diff` mode compares against. Must share `profile`'s unit and order. */
  baseline?: FlameTree;
  /** Which number a diff colours and ranks by: `self` pinpoints where time moved, `total` lights the whole path above it. Default `self`. */
  diffMetric?: 'self' | 'total';
  /** Relative changes smaller than this are drawn as unchanged. Default `0.05`. */
  threshold?: number;
  /** Relative changes at least this large take the solid delta fill. Default `0.25`. */
  large?: number;
  /** Compare each frame's share of its profile instead of raw values — for profiles of different lengths. Default false. */
  normalize?: boolean;
  /**
   * How frames are filled. `warm` (default) hashes each name into a red →
   * yellow ramp built from the danger and warning roles, the classic look;
   * `package` gives each namespace its own role; `theme` uses the surfaces.
   * A diff always paints on the delta roles. Every fill's label is tested to
   * 4.5:1 on every Level.
   */
  palette?: FlamePalette;
  /**
   * `flame` grows up from the root at the bottom; `icicle` hangs down from it
   * at the top. Default `flame`, at every width.
   */
  orientation?: 'flame' | 'icicle';
  /**
   * The frame list: the hottest frames by self time — or, in a diff, by the
   * size of their change — one per row with the full name, shares, a bar and
   * the delta. `auto` shows it only in a container narrower than 560px, where
   * the overview draws no labels; `always` and `never` do what they say.
   * Default `auto`.
   */
  list?: 'auto' | 'always' | 'never';
  /**
   * Where the horizontal window opens, and where Reset returns: `[start, end]`
   * as fractions of the root; `{ frameId }` to fit a frame; `'hottest'` to fit
   * the grandparent of the hottest leaf — in a diff, the leaf that changed most
   * (see `hottestFlameFrame`); `'all'`.
   * Default: `defaultZoomedId`'s frame when given, else the whole profile.
   */
  defaultWindow?: FlameWindowSpec;
  /** The horizontal window, as fractions of the root. Controlled when defined. */
  window?: FlameWindow;
  /** Called with the new horizontal window after a pinch, drag, wheel, button, fit or reset. */
  onWindowChange?: (window: FlameWindow) => void;
  /**
   * Where the depth window opens, and where Reset returns: `[min, max]`
   * levels, or a number of levels from the root. Default: the stack of the
   * frame the window fits; otherwise every level the window reaches — the
   * whole profile, zoomed out, on a phone too.
   */
  defaultDepth?: FlameDepthSpec;
  /** The depth window, in levels (the root is 0). Controlled when defined. */
  depth?: FlameDepthWindow;
  /** Called with the new depth window after a pinch, wheel, marker, button, fit or reset. */
  onDepthChange?: (depth: FlameDepthWindow) => void;
  /** The frame last fitted — what the breadcrumb leads to. Controlled when defined; `null` is the root. */
  zoomedId?: string | null;
  /** The frame fitted on mount when uncontrolled — and the fit a static render shows. */
  defaultZoomedId?: string | null;
  /** Called with the frame id Enter, "Zoom to frame", Escape or the breadcrumb fits. */
  onZoomedChange?: (id: string | null) => void;
  /**
   * The selected frame: outlined in the accent, its stack (ancestors and
   * descendants) at full strength and everything else dimmed, its row
   * highlighted in the list and its numbers in the details panel. Controlled
   * when defined; `null` selects nothing.
   */
  selectedId?: string | null;
  /** The frame selected on mount when uncontrolled — and the selection a static render shows. */
  defaultSelectedId?: string | null;
  /** Called with the frame id a tap, click, Space or list row selects, or `null` when the selection clears. */
  onSelectedChange?: (id: string | null) => void;
  /** Highlight frames whose name contains this text, and report the share of the profile beneath them. */
  search?: string;
  /**
   * The width, in pixels, labels are fitted to before the component can
   * measure itself — and for good in a static render. The graph always fills
   * its container; this only decides how much of each label is printed.
   * Default 960.
   */
  width?: number;
  /** Height of one frame row, in pixels. Default 20; a measured narrow container uses 22, a tap target. */
  rowHeight?: number;
  /** Accessible name for the frame tree. Default `Flame graph`. */
  label?: string;
}

/**
 * A flame graph: every call stack in a profile stacked root to leaf, each frame
 * as wide as the time beneath it. Reads Brendan Gregg's folded stacks, or a
 * trace weighted by self time, through `lib/flame`.
 *
 * **Static first.** Frames, labels and a native `<title>` tooltip are plain SVG
 * computed from the opening window, so a report rendered with no script still
 * draws — pre-zoomed, clipped and explained. Labels are fitted by a monospace
 * estimate rather than measured. With script it measures itself, draws a mouse
 * tooltip, and adds selection, zoom and pan.
 *
 * **Two windows.** The view is a horizontal window over the root and a depth
 * window over the levels. Frames crossing a side edge are clipped, labels
 * pinned to the visible part; hidden levels are counted on `▲`/`▼` markers that
 * pan when pressed. When zoomed, a minimap shows the whole profile with the
 * window marked, and dragging it pans both axes. Reset returns to the default
 * windows, Fit all shows everything.
 *
 * **Gestures.** Tap or click selects a frame (again, or empty space, clears);
 * a tap a few pixels from a thin frame still finds it. Double-tap or
 * double-click zooms in ×2 about the point. On touch: pinch zooms about its
 * centre — horizontally or in depth, whichever axis the fingers spread along
 * — and a horizontal drag pans; vertical drags scroll the page. With a mouse:
 * Ctrl/⌘+wheel (or a trackpad pinch) zooms, Shift+wheel or a horizontal wheel
 * pans, Alt+wheel changes depth.
 *
 * **Keyboard.** One roving tab stop over the frame tree. Up and Down move
 * toward the leaves or the root as drawn, Left and Right along the row, Home
 * to the root. Space selects, Enter fits the frame, Escape fits its parent;
 * `+`, `-` and `0` zoom in, out and reset.
 *
 * **Zoomed out by default.** It opens on the whole profile at every depth,
 * root at the bottom, each frame filled from the `warm` palette — the stacked
 * towers a flame graph is read by.
 *
 * **Narrow.** Below 560px of *container* width (a container query, so it works
 * without script) the graph draws bars only, 12px rows once measured so a
 * 35-deep profile fits a phone screen, and a frame list beneath carries the names.
 *
 * **Diff.** With `mode="diff"` frames are painted on the delta roles by the
 * sign and size of their change against `baseline` — change, not verdict. New
 * frames have a dashed edge; removed frames cannot be drawn at candidate
 * widths, so the legend and the list name them. A zero baseline reads `n/a`.
 */
export const Flamegraph = forwardRef<HTMLDivElement, FlamegraphProps>(function Flamegraph(
  {
    profile,
    mode = 'single',
    baseline,
    diffMetric = 'self',
    threshold = 0.05,
    large = 0.25,
    normalize = false,
    orientation: orientationProp,
    palette = 'warm',
    list = 'auto',
    defaultWindow,
    window: windowProp,
    onWindowChange,
    defaultDepth,
    depth: depthProp,
    onDepthChange,
    zoomedId: zoomedProp,
    defaultZoomedId,
    onZoomedChange,
    selectedId: selectedProp,
    defaultSelectedId = null,
    onSelectedChange,
    search,
    width: assumedWidth = 960,
    rowHeight: rowHeightProp = 20,
    label = 'Flame graph',
    className,
    ...props
  },
  ref,
) {
  const styles = flamegraph();
  const enhanced = useEnhanced();
  const [measure, measured] = useMeasuredWidth();
  const width = measured > 0 ? measured : assumedWidth;
  const narrow = measured > 0 && measured < NARROW;
  // Root at the bottom everywhere, as a flame graph is read; a phone only shortens the rows.
  const orientation = orientationProp ?? 'flame';
  const rowHeight = narrow ? Math.min(rowHeightProp, NARROW_ROW) : rowHeightProp;

  // The opening windows. A spec array is compared by value, so a literal in JSX does not reset the view each render.
  const windowSpec: FlameWindowSpec | undefined = defaultWindow ?? (defaultZoomedId ? { frameId: defaultZoomedId } : undefined);
  const specKey = JSON.stringify(windowSpec ?? null);
  const depthKey = JSON.stringify(defaultDepth ?? null);
  const diff = useMemo(() => (mode === 'diff' && baseline ? diffFlame(baseline, profile, { normalize }) : null), [mode, baseline, profile, normalize]);
  const comparable = diff?.compatible ? diff : null;
  const windowFrame = useMemo(() => flameWindowFrame(profile, JSON.parse(specKey) as FlameWindowSpec | null, comparable, diffMetric), [profile, specKey, comparable, diffMetric]);
  const initialZoom = defaultZoomedId !== undefined ? defaultZoomedId : (windowFrame?.id ?? null);
  const defaultWin = useMemo(() => resolveFlameWindow(profile, JSON.parse(specKey) as FlameWindowSpec | null, comparable, diffMetric), [profile, specKey, comparable, diffMetric]);
  const defaultDepthWin = useMemo(
    () => resolveFlameDepth(profile, JSON.parse(depthKey) as FlameDepthSpec | null, { window: defaultWin, anchorId: windowFrame?.id ?? null }),
    [profile, depthKey, defaultWin, windowFrame],
  );

  const [zoomedId, setZoomedId] = useControllable<string | null>(zoomedProp, initialZoom, onZoomedChange);
  const [selectedId, setSelectedId] = useControllable<string | null>(selectedProp, defaultSelectedId, onSelectedChange);
  const [rawWindow, setRawWindow, resetWindow] = useWindowState<FlameWindow>(windowProp, defaultWin, onWindowChange);
  const [rawDepth, setRawDepth, resetDepth] = useWindowState<FlameDepthWindow>(depthProp, defaultDepthWin, onDepthChange);
  const win = useMemo(() => clampFlameWindow(rawWindow), [rawWindow]);
  const depth = useMemo(() => clampFlameDepth(profile, rawDepth), [profile, rawDepth]);
  const setWindow = (next: FlameWindow) => setRawWindow(clampFlameWindow(next));
  const setDepth = (next: FlameDepthWindow) => setRawDepth(clampFlameDepth(profile, next));
  const span = win.end - win.start;
  const fullDepth = depth.min === 0 && depth.max === profile.maxDepth;
  const zoomed = !sameFlameWindow(win, FLAME_FULL_WINDOW) || !fullDepth;

  const changes = comparable ? comparable.frames : null;
  const fitted = (zoomedId ? profile.byId.get(zoomedId) : undefined) ?? profile.root;
  const view = useMemo(() => windowFlame(profile, win, depth).filter((entry) => entry.width * width >= MIN_FRAME_PX), [profile, win, depth, width]);
  const viewById = useMemo(() => new Map(view.map((entry) => [entry.frame.id, entry])), [view]);
  const contextIds = useMemo(() => new Set(flamePath(profile, fitted.id).slice(0, -1).map((frame) => frame.id)), [profile, fitted.id]);
  const found = useMemo(() => searchFlame(profile, search ?? ''), [profile, search]);
  const searching = !!search?.trim();
  const ranked = useMemo(
    () => (list === 'never' ? [] : rankFlameFrames(profile, diff?.compatible ? diff : null, diffMetric)),
    [list, profile, diff, diffMetric],
  );

  // The minimap's marks: every frame, toned as the graph tones it.
  const minimapMarks = useMemo<MinimapMark[]>(
    () => profile.frames.map((frame) => ({ x0: frame.x, x1: frame.x + frame.width, row: frame.depth, tone: changes ? MINIMAP_TONE[flameDeltaTone(changes.get(frame.id), { metric: diffMetric, threshold, large })] : 'neutral' })),
    [profile, changes, diffMetric, threshold, large],
  );

  const levels = depth.max - depth.min + 1;
  const height = levels * rowHeight;
  const yOf = (level: number) => (orientation === 'flame' ? (depth.max - level) * rowHeight : (level - depth.min) * rowHeight);

  // The stack of the selected frame — itself, its ancestors, its descendants — stays at full strength.
  const stack = useMemo(() => {
    const frame = selectedId !== null ? profile.byId.get(selectedId) : undefined;
    if (!frame) return null;
    const ids = new Set<string>();
    for (let at: FlameFrame | undefined = frame; at; at = at.parentId !== null ? profile.byId.get(at.parentId) : undefined) ids.add(at.id);
    const down = (f: FlameFrame) => { ids.add(f.id); f.children.forEach(down); };
    down(frame);
    return ids;
  }, [selectedId, profile]);

  // Roving tabindex: one frame is in the tab order, and the arrow keys move it.
  const [activeId, setActiveId] = useState<string | null>(null);
  const tabId = activeId !== null && viewById.has(activeId) ? activeId : viewById.has(fitted.id) ? fitted.id : (view[0]?.frame.id ?? '');
  const frameRefs = useRef(new Map<string, SVGGElement>());
  const pendingFocus = useRef(false);
  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    frameRefs.current.get(tabId)?.focus();
  }, [tabId]);
  const moveTo = (id: string | undefined | null) => {
    if (id === undefined || id === null || !viewById.has(id)) return;
    pendingFocus.current = true;
    setActiveId(id);
  };

  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const tipId = hoverId ?? focusedId;

  /** Fit both windows to a frame — its extent across, its stack down — and lead the breadcrumb to it. */
  const fitTo = (id: string) => {
    const frame = profile.byId.get(id);
    if (!frame) return;
    setZoomedId(frame.parentId === null ? null : frame.id);
    setWindow(fitFlameWindow(profile, frame.id));
    setDepth(frame.parentId === null ? { min: 0, max: profile.maxDepth } : fitFlameDepth(profile, frame.id));
  };
  const reset = () => {
    resetWindow();
    resetDepth();
    setZoomedId(initialZoom);
  };
  const fitAll = () => {
    setZoomedId(null);
    setWindow(FLAME_FULL_WINDOW);
    setDepth({ min: 0, max: profile.maxDepth });
  };
  /** Select a frame, or clear the selection when it is already selected. */
  const toggleSelect = (id: string) => setSelectedId(selectedId === id ? null : id);

  // A selection made in the graph brings its list row into view — opening "show all" if it is behind it.
  const listRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (selectedId === null || !listRef.current) return;
    const row = [...listRef.current.querySelectorAll<HTMLElement>('li[data-frame-id]')].find((item) => item.dataset.frameId === selectedId);
    if (!row) return;
    const details = row.closest('details');
    if (details && !details.open) details.open = true;
    row.scrollIntoView?.({ block: 'nearest' });
  }, [selectedId]);

  // ---- Gestures -----------------------------------------------------------
  const chartRef = useRef<SVGSVGElement | null>(null);
  const suppressClick = useRef(false);
  type Pinch = { axis: 'x' | 'y' | null; dx: number; dy: number; window: FlameWindow; depth: FlameDepthWindow; anchor: number };
  type Drag = { x: number; y: number; window: FlameWindow; panning: boolean };
  const gesture = useRef<{ pointers: Map<number, { x: number; y: number }>; pinch: Pinch | null; drag: Drag | null; moved: boolean; lastTap: { t: number; x: number; y: number } | null; lastType: string }>({
    pointers: new Map(), pinch: null, drag: null, moved: false, lastTap: null, lastType: 'mouse',
  });
  /** The fraction of the root under a client x. */
  const rootFractionAt = (clientX: number): number => {
    const box = chartRef.current?.getBoundingClientRect();
    if (!box || box.width <= 0) return (win.start + win.end) / 2;
    return win.start + ((clientX - box.left) / box.width) * span;
  };
  const zoomAt = (factor: number, clientX?: number) => setWindow(zoomFlameWindow(win, factor, clientX === undefined ? undefined : rootFractionAt(clientX)));

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    g.lastType = event.pointerType;
    if (event.pointerType === 'mouse') return;
    if (g.pointers.size === 0) { g.moved = false; suppressClick.current = false; }
    g.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (g.pointers.size === 2) {
      const [a, b] = [...g.pointers.values()];
      g.pinch = { axis: null, dx: Math.abs(a.x - b.x), dy: Math.abs(a.y - b.y), window: win, depth, anchor: rootFractionAt((a.x + b.x) / 2) };
      g.drag = null;
    } else if (g.pointers.size === 1) {
      g.drag = { x: event.clientX, y: event.clientY, window: win, panning: false };
    }
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const g = gesture.current;
    if (!g.pointers.has(event.pointerId)) return;
    g.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (g.pinch && g.pointers.size >= 2) {
      const [a, b] = [...g.pointers.values()];
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);
      // The axis the fingers spread along decides what the pinch zooms, once, for the whole gesture.
      if (!g.pinch.axis && Math.max(Math.abs(dx - g.pinch.dx), Math.abs(dy - g.pinch.dy)) > DRAG_PX) g.pinch.axis = Math.abs(dx - g.pinch.dx) >= Math.abs(dy - g.pinch.dy) ? 'x' : 'y';
      if (g.pinch.axis === 'x' && g.pinch.dx > 0) setWindow(zoomFlameWindow(g.pinch.window, dx / g.pinch.dx, g.pinch.anchor));
      if (g.pinch.axis === 'y' && g.pinch.dy > 0) setDepth(zoomFlameDepth(profile, g.pinch.depth, dy / g.pinch.dy));
      if (g.pinch.axis) g.moved = true;
      return;
    }
    const drag = g.drag;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.panning && Math.abs(dx) > DRAG_PX && Math.abs(dx) > Math.abs(dy) && !sameFlameWindow(drag.window, FLAME_FULL_WINDOW)) drag.panning = true;
    if (Math.abs(dx) > DRAG_PX || Math.abs(dy) > DRAG_PX) g.moved = true;
    if (drag.panning) {
      const box = chartRef.current?.getBoundingClientRect();
      if (box && box.width > 0) setWindow(panFlameWindow(drag.window, (-dx / box.width) * (drag.window.end - drag.window.start)));
    }
  };
  const onPointerEnd = (event: PointerEvent<SVGSVGElement>) => {
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
      suppressClick.current = true;
      g.lastTap = null;
    } else {
      g.lastTap = { t: event.timeStamp, x: event.clientX, y: event.clientY };
    }
  };
  const onDoubleClick = (event: MouseEvent<SVGSVGElement>) => {
    if (gesture.current.lastType !== 'mouse') return;
    zoomAt(2, event.clientX);
  };

  // Wheel needs a non-passive listener to stop the page scrolling under a zoom. Plain vertical wheel is left to the page.
  const latest = useRef({ win, depth, span, profile, setWindow, setDepth });
  useEffect(() => {
    latest.current = { win, depth, span, profile, setWindow, setDepth };
  });
  useEffect(() => {
    const svg = chartRef.current;
    if (!svg) return undefined;
    const onWheel = (event: WheelEvent) => {
      const now = latest.current;
      const box = svg.getBoundingClientRect();
      if (box.width <= 0) return;
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const anchor = now.win.start + ((event.clientX - box.left) / box.width) * now.span;
        now.setWindow(zoomFlameWindow(now.win, Math.exp(-event.deltaY * 0.01), anchor));
      } else if (event.altKey) {
        event.preventDefault();
        now.setDepth(zoomFlameDepth(now.profile, now.depth, event.deltaY < 0 ? 1.25 : 0.8));
      } else if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        if (sameFlameWindow(now.win, FLAME_FULL_WINDOW)) return;
        event.preventDefault();
        const delta = event.shiftKey && !event.deltaX ? event.deltaY : event.deltaX;
        now.setWindow(panFlameWindow(now.win, (delta / box.width) * now.span));
      }
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [measured]);

  /** A click that hit no frame: take the nearest frame in that row within `TAP_SLOP`, or clear the selection. */
  const onChartClick = (event: MouseEvent<SVGSVGElement>) => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    if ((event.target as Element).closest('[data-slot="flamegraph-frame"]')) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width <= 0) return;
    const row = Math.floor((event.clientY - box.top) / rowHeight);
    const level = orientation === 'flame' ? depth.max - row : depth.min + row;
    const px = event.clientX - box.left;
    let best: { id: string; distance: number } | null = null;
    for (const entry of view) {
      if (entry.frame.depth !== level) continue;
      const left = entry.x * box.width;
      const right = left + entry.width * box.width;
      const distance = px < left ? left - px : px > right ? px - right : 0;
      if (distance <= TAP_SLOP && (!best || distance < best.distance)) best = { id: entry.frame.id, distance };
    }
    if (best) toggleSelect(best.id);
    else setSelectedId(null);
  };
  const onFrameClick = (event: MouseEvent<SVGGElement>, id: string) => {
    event.stopPropagation();
    if (suppressClick.current) { suppressClick.current = false; return; }
    toggleSelect(id);
  };

  const neighbour = (entry: FlameWindowFrame, step: 1 | -1) => {
    const row = view.filter((other) => other.frame.depth === entry.frame.depth).sort((a, b) => a.x - b.x);
    const index = row.findIndex((other) => other.frame.id === entry.frame.id);
    return row[index + step]?.frame.id;
  };
  const towardLeaves = (frame: FlameFrame) => frame.children.find((child) => viewById.has(child.id))?.id;

  const onKeyDown = (event: KeyboardEvent<SVGGElement>, entry: FlameWindowFrame) => {
    const { frame } = entry;
    const up = orientation === 'flame' ? towardLeaves(frame) : frame.parentId;
    const down = orientation === 'flame' ? frame.parentId : towardLeaves(frame);
    switch (event.key) {
      case 'ArrowUp': moveTo(up); break;
      case 'ArrowDown': moveTo(down); break;
      case 'ArrowLeft': moveTo(neighbour(entry, -1)); break;
      case 'ArrowRight': moveTo(neighbour(entry, 1)); break;
      case 'Home': moveTo(profile.root.id); break;
      case ' ': toggleSelect(frame.id); break;
      case 'Enter':
        fitTo(frame.id);
        setSelectedId(frame.id);
        break;
      case 'Escape':
        if (fitted.parentId === null) return;
        fitTo(fitted.parentId);
        break;
      case '+':
      case '=':
        setWindow(zoomFlameWindow(win, 2, frame.x + frame.width / 2));
        break;
      case '-':
        setWindow(zoomFlameWindow(win, 0.5, frame.x + frame.width / 2));
        break;
      case '0': reset(); break;
      default:
        return;
    }
    event.preventDefault();
  };

  const toneOf = (change: FlameFrameDelta | undefined): FlameDeltaTone | null =>
    changes ? flameDeltaTone(change, { metric: diffMetric, threshold, large }) : null;

  const unit = profile.unit;
  const basis = diff?.compatible ? diff.basis : 'absolute';
  const summary = `${profile.frames.length - 1} frames, ${formatFlameValue(profile.total, unit)} in all, ${profile.maxDepth} deep.`;

  if (mode === 'diff' && (!baseline || (diff && !diff.compatible))) {
    return (
      <div ref={ref} data-slot="flamegraph" data-mode={mode} {...props} className={styles.root({ className })}>
        <p className={styles.empty()}>
          {baseline && diff && !diff.compatible ? `These profiles cannot be compared: ${diff.reason}.` : 'A diff needs a baseline profile.'}
        </p>
      </div>
    );
  }
  if (profile.total <= 0) {
    return (
      <div ref={ref} data-slot="flamegraph" data-mode={mode} {...props} className={styles.root({ className })}>
        <p className={styles.empty()}>No samples to display.</p>
      </div>
    );
  }

  const path = flamePath(profile, fitted.id);
  const tipEntry = tipId !== null && enhanced && !narrow ? viewById.get(tipId) : undefined;
  const selected = selectedId !== null ? profile.byId.get(selectedId) : undefined;
  const share = (value: number) => formatFlameShare(profile.total > 0 ? value / profile.total : null);
  // Ranked largest first, so the first row is the peak every bar is scaled to.
  const peak = ranked.length ? rankedSize(ranked[0], diffMetric) : 0;
  const hiddenDeeper = profile.maxDepth - depth.max;
  const hiddenShallower = depth.min;
  const step = Math.max(1, Math.ceil(levels / 2));
  const deeper = () => setDepth(panFlameDepth(profile, depth, step));
  const shallower = () => setDepth(panFlameDepth(profile, depth, -step));
  const levelsText = (count: number) => `${count} ${count === 1 ? 'level' : 'levels'}`;

  const depthButtons = (
    <>
      <button type="button" aria-label="Fewer levels" className={styles.control()} disabled={levels <= 1} onClick={() => setDepth(zoomFlameDepth(profile, depth, 2))}>levels −</button>
      <button type="button" aria-label="More levels" className={styles.control()} disabled={fullDepth} onClick={() => setDepth(zoomFlameDepth(profile, depth, 0.5))}>levels +</button>
    </>
  );

  const legend = diff?.compatible ? (
    <ul aria-label="Colour key" className={styles.legend()}>
      <li className="col-span-2 text-content-muted">
        {diffMetric} {diff.basis === 'share' ? 'share' : 'time'} vs baseline, ±{formatFlameShare(threshold)} unchanged, ≥{formatFlameShare(large)} large:
      </li>
      {LEGEND_ORDER.map((tone) => (
        <li key={tone} className="flex items-center gap-1.5">
          <svg aria-hidden="true" width="14" height="10" className="shrink-0">
            <rect x="0.5" y="0.5" width="13" height="9" className={cn(TONE[tone].rect, 'stroke-edge-strong', tone === 'new' && '[stroke-dasharray:3_2]')} />
          </svg>
          {TONE[tone].label}
        </li>
      ))}
    </ul>
  ) : null;

  /**
   * A frame's fill and label. A diff paints on the delta roles, its unchanged
   * frames varied by name so neighbours separate; a search match takes the
   * accent; the root and the fitted frame's ancestors are ground; anything
   * else takes the palette.
   */
  const lookOf = (frame: FlameFrame, tone: FlameDeltaTone | null, matched: boolean, context: boolean): { rect: string; text: string } => {
    if (tone === 'same') {
      const same = flameSameSwatch(frame.name);
      return { rect: same.fill, text: same.label };
    }
    if (tone) return TONE[tone];
    if (matched) return { rect: 'fill-accent-primary', text: 'fill-content-inverse' };
    if (context || frame.parentId === null) return { rect: 'fill-surface-sunken', text: 'fill-content-secondary' };
    const swatch = flameSwatch(palette, frame.name);
    return swatch ? { rect: swatch.fill, text: swatch.label } : { rect: 'fill-surface-raised', text: 'fill-content-primary' };
  };

  /** A ▲/▼ marker for hidden levels. */
  const marker = (edge: 'top' | 'bottom') => {
    const glyph = edge === 'top' ? '▲' : '▼';
    // Flame: deeper levels sit above. Icicle: shallower levels do.
    const wide = edge === 'top' ? hiddenDeeper : hiddenShallower;
    const tall = edge === 'top' ? hiddenShallower : hiddenDeeper;
    const count = orientation === 'flame' ? wide : tall;
    const go = (orientation === 'flame') === (edge === 'top') ? deeper : shallower;
    if (!count) return null;
    return (
      <button type="button" data-slot="flamegraph-marker" data-edge={edge} aria-label={`${levelsText(count)} hidden ${go === deeper ? 'deeper' : 'shallower'}; show them`} className={styles.marker()} onClick={go}>
        {glyph} {levelsText(count)}
      </button>
    );
  };

  return (
    <div
      ref={ref}
      data-slot="flamegraph"
      data-mode={mode}
      data-orientation={orientation}
      data-window={`${win.start.toFixed(4)} ${win.end.toFixed(4)}`}
      data-depth={`${depth.min} ${depth.max}`}
      {...props}
      className={styles.root({ className })}
    >
      <p className="sr-only">{summary}</p>
      {path.length > 1 ? (
        <nav aria-label="Zoom path" data-slot="flamegraph-breadcrumb">
          <ol className={styles.breadcrumb()}>
            {path.map((frame, index) => (
              // Narrow, the middle of a deep path folds to `…`: the root, the
              // parent and the current frame stay, each a full tap target.
              <li key={frame.id} className={cn('flex min-w-0 items-center gap-1', index > 0 && index < path.length - 2 && '@max-[560px]:hidden')}>
                {index > 0 ? <span aria-hidden="true" className="text-content-muted">›</span> : null}
                {index === path.length - 1 ? (
                  <span aria-current="location" className={styles.current()}>{frame.name}</span>
                ) : (
                  <button type="button" title={frame.name} className={styles.crumb()} onClick={() => fitTo(frame.id)}>
                    {frame.name}
                  </button>
                )}
                {index === 0 && path.length > 3 ? <span aria-hidden="true" className="hidden text-content-muted @max-[560px]:inline">› …</span> : null}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      {enhanced ? (
        <div role="toolbar" aria-label="Zoom" data-slot="flamegraph-controls" className={styles.controls()}>
          <button type="button" aria-label="Zoom out" className={styles.control()} disabled={sameFlameWindow(win, FLAME_FULL_WINDOW)} onClick={() => zoomAt(0.5)}>−</button>
          <button type="button" aria-label="Zoom in" className={styles.control()} disabled={span <= 0.0011} onClick={() => zoomAt(2)}>+</button>
          <button type="button" className={styles.control()} onClick={reset}>Reset</button>
          <button type="button" className={styles.control()} disabled={!zoomed} onClick={fitAll}>Fit all</button>
          {/* Wide, the depth controls sit in the row; narrow, they fold into a menu so the row stays one line at 390px. */}
          <span className="contents @max-[560px]:hidden">{depthButtons}</span>
          <details className="relative hidden @max-[560px]:block">
            <summary className={cn(styles.control(), 'flex list-none items-center')}>Levels ▾</summary>
            <div className={styles.menu()}>{depthButtons}</div>
          </details>
        </div>
      ) : null}
      {searching ? (
        <p role="status" data-slot="flamegraph-status" className={styles.status()}>
          {found.ids.size
            ? `“${search!.trim()}” matches ${found.ids.size} ${found.ids.size === 1 ? 'frame' : 'frames'}: ${formatFlameValue(found.matched, unit)}, ${formatFlameShare(found.share)} of all.`
            : `“${search!.trim()}” matches no frames.`}
        </p>
      ) : null}
      {zoomed ? (
        <Minimap
          label="Profile overview"
          marks={minimapMarks}
          rows={profile.maxDepth + 1}
          window={win}
          rowWindow={depth}
          rowOrder={orientation === 'flame' ? 'bottom-up' : 'top-down'}
          pixelWidth={width}
          height={MINIMAP_HEIGHT}
          onWindowChange={(next, nextDepth) => { setWindow(next); if (nextDepth) setDepth(nextDepth); }}
        />
      ) : null}
      {marker('top')}
      <div ref={measure} className={styles.frame()}>
        <svg
          ref={chartRef}
          role="tree"
          aria-label={label}
          data-slot="flamegraph-chart"
          width="100%"
          height={height}
          className={styles.chart()}
          onMouseLeave={() => setHoverId(null)}
          onClick={onChartClick}
          onDoubleClick={onDoubleClick}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          {view.map((entry) => {
            const { frame } = entry;
            const context = contextIds.has(frame.id);
            const y = yOf(frame.depth);
            const text = fitFlameLabel(frame.name, entry.width * width - LABEL_PAD * 2, CHAR_WIDTH);
            // Narrow, the overview is bars only — the frame list carries the names. Unmeasured, the container query hides them.
            const shown = narrow ? '' : text;
            const change = changes?.get(frame.id);
            const tone = toneOf(change);
            const matched = searching && found.ids.has(frame.id);
            const isSelected = frame.id === selectedId;
            const dimmed = (searching && !matched) || (stack !== null && !stack.has(frame.id));
            const look = lookOf(frame, tone, matched, context);
            const x = `${entry.x * 100}%`;
            const w = `${entry.width * 100}%`;
            return (
              <g
                key={frame.id}
                ref={(node) => { if (node) frameRefs.current.set(frame.id, node); else frameRefs.current.delete(frame.id); }}
                role="treeitem"
                aria-level={frame.depth + 1}
                aria-label={describeFlameFrame(frame, profile, change, diffMetric)}
                aria-selected={isSelected}
                tabIndex={frame.id === tabId ? 0 : -1}
                data-slot="flamegraph-frame"
                data-frame-id={frame.id}
                data-tone={tone ?? undefined}
                data-match={matched || undefined}
                data-context={context || undefined}
                data-selected={isSelected || undefined}
                data-clipped={entry.clipped || undefined}
                className={cn('group cursor-pointer outline-none!', dimmed && 'opacity-30')}
                onClick={(event) => onFrameClick(event, frame.id)}
                onKeyDown={(event) => onKeyDown(event, entry)}
                onFocus={() => { setActiveId(frame.id); setFocusedId(frame.id); }}
                onBlur={() => setFocusedId((current) => (current === frame.id ? null : current))}
                // Mouse only: a tap fires pointerenter too, and a touch reader gets the details panel instead.
                onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHoverId(frame.id); }}
              >
                {enhanced ? null : <title>{describeFlameFrame(frame, profile, change, diffMetric)}</title>}
                <rect
                  x={x}
                  y={y + 0.5}
                  width={w}
                  height={rowHeight - 1}
                  className={cn(
                    look.rect,
                    'stroke-surface-base group-hover:stroke-content-primary group-focus-visible:stroke-content-primary group-focus-visible:stroke-2',
                    tone === 'new' && 'stroke-content-primary [stroke-dasharray:4_2]',
                    isSelected && 'stroke-accent-primary stroke-[3] [stroke-dasharray:none] group-hover:stroke-accent-primary group-focus-visible:stroke-accent-primary',
                  )}
                />
                {shown ? (
                  <svg x={x} y={y} width={w} height={rowHeight} overflow="hidden" aria-hidden="true">
                    <text
                      x={LABEL_PAD}
                      y={rowHeight / 2}
                      dominantBaseline="central"
                      className={cn(look.text, 'text-xs', !measured && '@max-[560px]:hidden')}
                    >
                      {shown}
                    </text>
                  </svg>
                ) : null}
              </g>
            );
          })}
          {tipEntry ? <FlameTooltip entry={tipEntry} profile={profile} change={changes?.get(tipEntry.frame.id)} metric={diffMetric} basis={basis} y={yOf(tipEntry.frame.depth)} rowHeight={rowHeight} height={height} /> : null}
        </svg>
      </div>
      {marker('bottom')}
      {selected ? (
        <section aria-label="Frame details" aria-live="polite" data-slot="flamegraph-details" className={styles.details()}>
          <span className="font-bold break-words">{breakable(selected.name)}</span>
          <span className="text-content-secondary tabular-nums">
            total {formatFlameValue(selected.total, unit)} · {share(selected.total)} — self {formatFlameValue(selected.self, unit)} · {share(selected.self)}
          </span>
          {changes?.get(selected.id) ? (
            <span className="text-content-secondary tabular-nums">Δ {diffMetric} {formatFlameDelta(changes.get(selected.id)!, diffMetric, unit, basis)}</span>
          ) : null}
          {enhanced ? (
            <span className="flex flex-wrap gap-1 pt-1">
              <button type="button" className={styles.action()} onClick={() => fitTo(selected.id)}>Zoom to frame</button>
              <button type="button" className={styles.action()} onClick={() => setSelectedId(null)}>Clear</button>
            </span>
          ) : null}
        </section>
      ) : null}
      {list !== 'never' && ranked.length ? (
        <section
          ref={listRef}
          aria-label={mode === 'diff' ? 'Largest changes' : 'Hottest frames'}
          data-slot="flamegraph-list"
          className={cn(styles.list(), list === 'always' ? 'flex' : 'hidden @max-[560px]:flex')}
        >
          <p className="m-0 pb-1 text-content-muted">
            {mode === 'diff' ? `Largest changes in ${diffMetric} time` : 'Hottest frames by self time'}
          </p>
          <FrameRows rows={ranked.slice(0, LIST_TOP)} peak={peak} profile={profile} selectedId={selectedId} metric={diffMetric} basis={basis} tone={toneOf} onPick={toggleSelect} className={styles.rows()} rowClass={styles.row()} />
          {ranked.length > LIST_TOP ? (
            <details>
              <summary className={styles.more()}>Show all {ranked.length}</summary>
              <FrameRows rows={ranked.slice(LIST_TOP)} start={LIST_TOP + 1} peak={peak} profile={profile} selectedId={selectedId} metric={diffMetric} basis={basis} tone={toneOf} onPick={toggleSelect} className={styles.rows()} rowClass={styles.row()} />
            </details>
          ) : null}
        </section>
      ) : null}
      {mode === 'diff' && diff?.compatible ? (
        <div data-slot="flamegraph-legend" className="flex flex-col gap-1">
          <div className="@max-[560px]:hidden">{legend}</div>
          <details className="hidden @max-[560px]:block">
            <summary className={styles.more()}>Key</summary>
            {legend}
          </details>
          {diff.removed.length ? (
            <p className={styles.removed()}>
              Not drawn — gone from the candidate:{' '}
              {diff.removed.map((frame, index) => (
                <span key={frame.id}>
                  {index > 0 ? '; ' : ''}
                  <span className="break-words text-content-primary">{breakable(frame.name)}</span> ({formatFlameValue(frame.total.baseline ?? 0, unit)})
                </span>
              ))}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

Flamegraph.displayName = 'Flamegraph';

/** What a frame-list row's bar measures: self time, or the size of the change in a diff. */
function rankedSize(row: FlameRankedFrame, metric: 'self' | 'total'): number {
  return row.change ? Math.abs(row.change[metric].absolute ?? 0) : row.self;
}

interface FrameRowsProps {
  rows: FlameRankedFrame[];
  start?: number;
  /** The largest size in the whole list, so bars scale alike above and below "show all". */
  peak: number;
  profile: FlameTree;
  selectedId: string | null;
  metric: 'self' | 'total';
  basis: 'absolute' | 'share';
  tone: (change: FlameFrameDelta | undefined) => FlameDeltaTone | null;
  onPick: (id: string) => void;
  className: string;
  rowClass: string;
}

/** Rows of the frame list. Each is a 44px tap target that selects its frame; a removed frame has nothing to select. */
function FrameRows({ rows, start = 1, peak, profile, selectedId, metric, basis, tone, onPick, className, rowClass }: FrameRowsProps) {
  const unit = profile.unit;
  const share = (value: number) => formatFlameShare(profile.total > 0 ? value / profile.total : null);
  return (
    <ol start={start} className={className}>
      {rows.map((row) => {
        const rowTone = row.change ? tone(row.change) : null;
        const removed = row.change?.status === 'removed';
        const bar = rowTone ? TONE[rowTone].rect : removed ? 'fill-delta-removed' : 'fill-accent-primary';
        const body = (
          <>
            <span className="break-words text-content-primary">{breakable(row.name)}</span>
            <span className="flex items-center gap-2 text-content-secondary tabular-nums">
              {removed ? (
                <span>removed · was {formatFlameValue(row.change!.total.baseline ?? 0, unit)}</span>
              ) : (
                // Narrow, one headline number: self share, or — in a diff — the delta below. The rest is in the details panel.
                <span className={cn('shrink-0', row.change && '@max-[560px]:hidden')}>
                  self {share(row.self)}<span className="@max-[560px]:hidden"> · total {share(row.total)}</span>
                </span>
              )}
              <svg aria-hidden="true" height="6" className="h-1.5 min-w-8 flex-1">
                <rect x="0" y="0" height="6" width={`${peak > 0 ? (rankedSize(row, metric) / peak) * 100 : 0}%`} className={bar} />
              </svg>
            </span>
            {row.change && !removed ? (
              <span className="flex items-center gap-1.5 text-content-primary tabular-nums">
                <svg aria-hidden="true" width="10" height="10" className="shrink-0">
                  <rect x="0.5" y="0.5" width="9" height="9" className={cn(bar, 'stroke-edge-strong', rowTone === 'new' && '[stroke-dasharray:3_2]')} />
                </svg>
                {metric} {formatFlameDelta(row.change, metric, unit, basis)}
              </span>
            ) : null}
          </>
        );
        return (
          <li key={row.id} data-frame-id={row.id}>
            {removed ? (
              <div className={cn(rowClass, 'cursor-default hover:bg-transparent')}>{body}</div>
            ) : (
              <button type="button" aria-current={row.id === selectedId || undefined} className={rowClass} onClick={() => onPick(row.id)}>
                {body}
              </button>
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface FlameTooltipProps {
  entry: FlameWindowFrame;
  profile: FlameTree;
  change?: FlameFrameDelta;
  metric: 'self' | 'total';
  basis: 'absolute' | 'share';
  y: number;
  rowHeight: number;
  height: number;
}

/** The enhanced mouse tooltip, drawn inside the SVG beside its frame so placing it needs no inline style. */
function FlameTooltip({ entry, profile, change, metric, basis, y, rowHeight, height }: FlameTooltipProps) {
  const { frame } = entry;
  const unit = profile.unit;
  const name = frame.name.length > 72 ? `${frame.name.slice(0, 71)}…` : frame.name;
  const lines = [
    `total ${formatFlameValue(frame.total, unit)} · ${formatFlameShare(profile.total > 0 ? frame.total / profile.total : null)}`,
    `self  ${formatFlameValue(frame.self, unit)} · ${formatFlameShare(profile.total > 0 ? frame.self / profile.total : null)}`,
    ...(change ? [`Δ ${metric}  ${formatFlameDelta(change, metric, unit, basis)}`] : []),
  ];
  const boxWidth = Math.ceil(Math.max(name.length, ...lines.map((line) => line.length)) * CHAR_WIDTH + TIP_PAD * 2);
  const boxHeight = (lines.length + 1) * TIP_LINE + TIP_PAD * 2;
  // Open toward the side with room: rightward from the frame's left edge, or
  // leftward from its right edge when it sits in the right half.
  const leftward = entry.x + entry.width / 2 > 0.5;
  const anchor = `${(leftward ? entry.x + entry.width : entry.x) * 100}%`;
  const dx = leftward ? -boxWidth : 0;
  const top = y - boxHeight - 2 >= 0 ? y - boxHeight - 2 : Math.min(y + rowHeight + 2, Math.max(0, height - boxHeight));
  return (
    <svg x={anchor} y={top} width="1" height="1" overflow="visible" aria-hidden="true" data-slot="flamegraph-tooltip" className="pointer-events-none">
      <rect x={dx} y={0} width={boxWidth} height={boxHeight} className="fill-surface-base stroke-edge-strong" />
      <text x={dx + TIP_PAD} y={TIP_PAD + TIP_LINE * 0.75} className="fill-content-primary text-xs font-bold">{name}</text>
      {lines.map((line, index) => (
        <text key={index} x={dx + TIP_PAD} y={TIP_PAD + TIP_LINE * (index + 1.75)} className="fill-content-secondary text-xs" xmlSpace="preserve">
          {line}
        </text>
      ))}
    </svg>
  );
}
