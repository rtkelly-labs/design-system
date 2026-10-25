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
  type ReactNode,
} from 'react';
import { cn, recipe } from '../lib/recipe';
import {
  diffFlame,
  fitFlameLabel,
  flameDeltaTone,
  flamePath,
  formatFlameDelta,
  formatFlameShare,
  formatFlameValue,
  rankFlameFrames,
  searchFlame,
  zoomFlame,
  type FlameDeltaTone,
  type FlameFrame,
  type FlameFrameDelta,
  type FlameRankedFrame,
  type FlameTree,
  type FlameViewFrame,
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
 * Below this container width the graph becomes an overview and the frame list
 * carries the detail. Must match the `@max-[560px]` / `@min-[560px]` variants
 * below — Tailwind reads those as source text, so they cannot be built from it.
 */
const NARROW = 560;
/** Row height of the overview in a measured narrow container. */
const NARROW_ROW = 16;
/** The width labels are fitted to for a narrow container before it can be measured: a 390px phone less two 16px gutters. */
const NARROW_ASSUMED = 358;
/** Rows of the frame list shown before "show all". */
const LIST_TOP = 10;

const flamegraph = recipe({
  slots: {
    root: '@container flex min-w-0 flex-col gap-2 font-mono text-xs text-content-primary',
    breadcrumb: 'm-0 flex list-none flex-wrap items-center gap-1 p-0 text-content-secondary',
    crumb: 'cursor-pointer border border-transparent px-1 hover:border-edge-default hover:text-content-primary focus-visible:outline-2 focus-visible:outline-accent-primary @max-[560px]:min-h-11 @max-[560px]:max-w-40 @max-[560px]:truncate',
    current: 'px-1 font-bold break-all text-content-primary',
    frame: 'w-full min-w-0',
    chart: 'block w-full select-none overflow-visible',
    status: 'text-content-secondary',
    details: 'flex flex-col gap-0.5 border border-edge-default bg-surface-raised px-2 py-1.5',
    list: 'flex-col gap-0',
    rows: 'm-0 flex list-none flex-col p-0',
    row: 'flex min-h-11 w-full cursor-pointer flex-col justify-center gap-1 border-b border-edge-subtle px-1 py-1.5 text-left hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-accent-primary aria-[current=true]:bg-surface-raised',
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
   * `flame` grows up from the root at the bottom; `icicle` hangs down from it
   * at the top. Unset, it is `flame`, turning to `icicle` in a container
   * narrower than 560px — a phone reads downward. Set, it is honoured at every width.
   */
  orientation?: 'flame' | 'icicle';
  /**
   * The frame list: the hottest frames by self time — or, in a diff, by the
   * size of their change — one per row with the full name, shares, a bar and
   * the delta. `auto` shows it only in a container narrower than 560px, where
   * frame labels cannot be read; `always` and `never` do what they say.
   * Default `auto`.
   */
  list?: 'auto' | 'always' | 'never';
  /** The frame id zoomed into. Controlled when defined; `null` is the whole profile. */
  zoomedId?: string | null;
  /** The frame zoomed into on mount when uncontrolled — and the zoom a static render shows. */
  defaultZoomedId?: string | null;
  /** Called with the frame id a click, tap, Enter or Space zooms into, or the breadcrumb zooms out to. */
  onZoomedChange?: (id: string | null) => void;
  /** Highlight frames whose name contains this text, and report the share of the profile beneath them. */
  search?: string;
  /**
   * The width, in pixels, labels are fitted to before the component can
   * measure itself — and for good in a static render, where a narrow container
   * is fitted to a 358px phone instead. The graph always fills its container;
   * this only decides how much of each label is printed. Default 960.
   */
  width?: number;
  /** Height of one frame row, in pixels. Default 20; a measured narrow container caps it at 16. */
  rowHeight?: number;
  /** Accessible name for the frame tree. Default `Flame graph`. */
  label?: string;
}

/**
 * A flame graph: every call stack in a profile stacked root to leaf, each frame
 * as wide as the time beneath it. Reads Brendan Gregg's folded stacks, or a
 * trace weighted by self time, through `lib/flame`.
 *
 * **Static first.** The frames, their labels and a native `<title>` tooltip are
 * plain SVG, positioned in percentages, so a report rendered to HTML with no
 * script still draws and explains itself. Labels are truncated by a monospace
 * character-width estimate rather than measured — measuring needs a browser.
 * With script, the component measures its width, swaps the native tooltip for
 * one drawn in the SVG on mouse hover, and adds click-to-zoom with a
 * breadcrumb back out. A click or tap also opens the frame's numbers in a
 * details panel under the graph — the touch equivalent of the tooltip.
 *
 * **Narrow.** Below 560px of *container* width (a container query, so it
 * works without script and inside any column) the graph becomes an overview:
 * root on top unless `orientation` is set, labels only where they fit. A frame
 * list beneath carries the detail — the ten hottest frames, the rest behind a
 * `<details>` disclosure, each row a 44px tap target that zooms the graph.
 *
 * **Keyboard.** The frames are a tree with one roving tab stop. Up and Down
 * move toward the leaves or the root *as drawn* (so they flip with
 * orientation), Left and Right move between neighbours on the same row,
 * Home returns to the root, Enter or Space zooms into a frame and Escape zooms
 * back out one level. Every frame's accessible name carries its numbers.
 *
 * **Diff.** With `mode="diff"` each frame is painted on the delta roles by the
 * sign and size of its change against `baseline`: `delta-added` where the
 * candidate spent more, `delta-removed` where it spent less — change, not
 * verdict. New frames are the solid added fill with a dashed edge; frames the
 * candidate no longer has cannot be drawn at candidate widths, so they are
 * listed under the legend and ranked in the frame list. A change against a
 * zero baseline is coloured by sign only, and its ratio reads `n/a`.
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
    list = 'auto',
    zoomedId: zoomedProp,
    defaultZoomedId = null,
    onZoomedChange,
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
  // Unmeasured — a static render, or the first paint — a default orientation
  // is drawn as `flame` and flipped to `icicle` by the container query; once
  // measured, the orientation is chosen here and drawn directly.
  const cssFlip = orientationProp === undefined && measured === 0;
  const orientation = orientationProp ?? (narrow ? 'icicle' : 'flame');
  const rowHeight = narrow ? Math.min(rowHeightProp, NARROW_ROW) : rowHeightProp;
  const [zoomedId, setZoomedId] = useControllable<string | null>(zoomedProp, defaultZoomedId, onZoomedChange);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const diff = useMemo(() => (mode === 'diff' && baseline ? diffFlame(baseline, profile, { normalize }) : null), [mode, baseline, profile, normalize]);
  const changes = diff?.compatible ? diff.frames : null;
  const focus = (zoomedId ? profile.byId.get(zoomedId) : undefined) ?? profile.root;
  const view = useMemo(() => zoomFlame(profile, focus.id).filter((entry) => entry.width * width >= MIN_FRAME_PX), [profile, focus.id, width]);
  const viewById = useMemo(() => new Map(view.map((entry) => [entry.frame.id, entry])), [view]);
  const found = useMemo(() => searchFlame(profile, search ?? ''), [profile, search]);
  const searching = !!search?.trim();
  const ranked = useMemo(
    () => (list === 'never' ? [] : rankFlameFrames(profile, diff?.compatible ? diff : null, diffMetric)),
    [list, profile, diff, diffMetric],
  );

  const rows = profile.maxDepth + 1;
  const height = rows * rowHeight;
  const yOf = (depth: number) => (orientation === 'flame' ? (rows - 1 - depth) * rowHeight : depth * rowHeight);

  // Roving tabindex: one frame is in the tab order, and the arrow keys move it.
  const [activeId, setActiveId] = useState<string | null>(null);
  const tabId = activeId !== null && viewById.has(activeId) ? activeId : focus.id;
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

  /** Zoom into a frame and open its details — what a click, a tap, Enter and a list row all do. */
  const zoomTo = (id: string) => {
    const frame = profile.byId.get(id);
    if (!frame) return;
    setZoomedId(frame.parentId === null ? null : frame.id);
    setSelectedId(frame.id);
  };

  const neighbour = (entry: FlameViewFrame, step: 1 | -1) => {
    const row = view.filter((other) => other.frame.depth === entry.frame.depth).sort((a, b) => a.x - b.x);
    const index = row.findIndex((other) => other.frame.id === entry.frame.id);
    return row[index + step]?.frame.id;
  };
  const towardLeaves = (frame: FlameFrame) => frame.children.find((child) => viewById.has(child.id))?.id;

  const onKeyDown = (event: KeyboardEvent<SVGGElement>, entry: FlameViewFrame) => {
    const { frame } = entry;
    const up = orientation === 'flame' ? towardLeaves(frame) : frame.parentId;
    const down = orientation === 'flame' ? frame.parentId : towardLeaves(frame);
    switch (event.key) {
      case 'ArrowUp': moveTo(up); break;
      case 'ArrowDown': moveTo(down); break;
      case 'ArrowLeft': moveTo(neighbour(entry, -1)); break;
      case 'ArrowRight': moveTo(neighbour(entry, 1)); break;
      case 'Home': moveTo(profile.root.id); break;
      case 'Enter':
      case ' ':
        zoomTo(frame.id);
        break;
      case 'Escape':
        if (focus.parentId === null) return;
        setZoomedId(focus.parentId === '' ? null : focus.parentId);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const toneOf = (change: FlameFrameDelta | undefined): FlameDeltaTone | null =>
    changes ? flameDeltaTone(change, { metric: diffMetric, threshold, large }) : null;

  const unit = profile.unit;
  const basis = diff?.compatible ? diff.basis : 'absolute';
  const summary = `${profile.frames.length - 1} frames, ${formatFlameValue(profile.total, unit)} in all, ${rows - 1} deep.`;

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

  const path = flamePath(profile, focus.id);
  const tipEntry = tipId !== null && enhanced && !narrow ? viewById.get(tipId) : undefined;
  const selected = selectedId !== null ? profile.byId.get(selectedId) : undefined;
  const share = (value: number) => formatFlameShare(profile.total > 0 ? value / profile.total : null);
  // Ranked largest first, so the first row is the peak every bar is scaled to.
  const peak = ranked.length ? rankedSize(ranked[0], diffMetric) : 0;

  return (
    <div ref={ref} data-slot="flamegraph" data-mode={mode} data-orientation={orientationProp ?? (measured ? orientation : undefined)} {...props} className={styles.root({ className })}>
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
                  <button type="button" title={frame.name} className={styles.crumb()} onClick={() => setZoomedId(frame.parentId === null ? null : frame.id)}>
                    {frame.name}
                  </button>
                )}
                {index === 0 && path.length > 3 ? <span aria-hidden="true" className="hidden text-content-muted @max-[560px]:inline">› …</span> : null}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      {searching ? (
        <p role="status" data-slot="flamegraph-status" className={styles.status()}>
          {found.ids.size
            ? `“${search!.trim()}” matches ${found.ids.size} ${found.ids.size === 1 ? 'frame' : 'frames'}: ${formatFlameValue(found.matched, unit)}, ${formatFlameShare(found.share)} of all.`
            : `“${search!.trim()}” matches no frames.`}
        </p>
      ) : null}
      <div ref={measure} className={styles.frame()}>
        <svg
          role="tree"
          aria-label={label}
          data-slot="flamegraph-chart"
          width="100%"
          height={height}
          className={cn(styles.chart(), cssFlip && '@max-[560px]:-scale-y-100')}
          onMouseLeave={() => setHoverId(null)}
        >
          {view.map((entry) => {
            const { frame, context } = entry;
            const y = yOf(frame.depth);
            const text = fitFlameLabel(frame.name, entry.width * width - LABEL_PAD * 2, CHAR_WIDTH);
            // Unmeasured, a second label fitted to a phone stands in when the container is narrow.
            const narrowText = measured ? text : fitFlameLabel(frame.name, entry.width * NARROW_ASSUMED - LABEL_PAD * 2, CHAR_WIDTH);
            const change = changes?.get(frame.id);
            const tone = toneOf(change);
            const matched = searching && found.ids.has(frame.id);
            const dimmed = searching && !matched;
            const look = tone ? TONE[tone] : matched ? { rect: 'fill-accent-primary', text: 'fill-content-inverse' } : context || frame.parentId === null ? { rect: 'fill-surface-sunken', text: 'fill-content-secondary' } : { rect: 'fill-surface-raised', text: 'fill-content-primary' };
            const x = `${entry.x * 100}%`;
            const w = `${entry.width * 100}%`;
            const textClass = cn(look.text, 'text-xs', cssFlip && 'origin-center [transform-box:fill-box] @max-[560px]:-scale-y-100');
            return (
              <g
                key={frame.id}
                ref={(node) => { if (node) frameRefs.current.set(frame.id, node); else frameRefs.current.delete(frame.id); }}
                role="treeitem"
                aria-level={frame.depth + 1}
                aria-label={describeFlameFrame(frame, profile, change, diffMetric)}
                aria-selected={frame.id === focus.id}
                tabIndex={frame.id === tabId ? 0 : -1}
                data-slot="flamegraph-frame"
                data-frame-id={frame.id}
                data-tone={tone ?? undefined}
                data-match={matched || undefined}
                data-context={context || undefined}
                className={cn('group cursor-pointer outline-none!', dimmed && 'opacity-35')}
                onClick={() => zoomTo(frame.id)}
                onKeyDown={(event) => onKeyDown(event, entry)}
                onFocus={() => { setActiveId(frame.id); setFocusedId(frame.id); }}
                onBlur={() => setFocusedId((current) => (current === frame.id ? null : current))}
                // Mouse only: a tap fires pointerenter too, and a touch reader
                // gets the details panel instead of a tooltip over the rows.
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
                  )}
                />
                {text || narrowText ? (
                  <svg x={x} y={y} width={w} height={rowHeight} overflow="hidden" aria-hidden="true">
                    {text === narrowText ? (
                      <text x={LABEL_PAD} y={rowHeight / 2} dominantBaseline="central" className={textClass}>{text}</text>
                    ) : (
                      <>
                        {text ? <text x={LABEL_PAD} y={rowHeight / 2} dominantBaseline="central" className={cn(textClass, '@max-[560px]:hidden')}>{text}</text> : null}
                        {narrowText ? <text x={LABEL_PAD} y={rowHeight / 2} dominantBaseline="central" className={cn(textClass, 'hidden @max-[560px]:inline')}>{narrowText}</text> : null}
                      </>
                    )}
                  </svg>
                ) : null}
              </g>
            );
          })}
          {tipEntry ? <FlameTooltip entry={tipEntry} profile={profile} change={changes?.get(tipEntry.frame.id)} metric={diffMetric} basis={basis} y={yOf(tipEntry.frame.depth)} rowHeight={rowHeight} height={height} /> : null}
        </svg>
      </div>
      {selected ? (
        <section aria-label="Frame details" aria-live="polite" data-slot="flamegraph-details" className={styles.details()}>
          <span className="font-bold break-words">{breakable(selected.name)}</span>
          <span className="text-content-secondary tabular-nums">
            total {formatFlameValue(selected.total, unit)} · {share(selected.total)} — self {formatFlameValue(selected.self, unit)} · {share(selected.self)}
          </span>
          {changes?.get(selected.id) ? (
            <span className="text-content-secondary tabular-nums">Δ {diffMetric} {formatFlameDelta(changes.get(selected.id)!, diffMetric, unit, basis)}</span>
          ) : null}
        </section>
      ) : null}
      {list !== 'never' && ranked.length ? (
        <section
          aria-label={mode === 'diff' ? 'Largest changes' : 'Hottest frames'}
          data-slot="flamegraph-list"
          className={cn(styles.list(), list === 'always' ? 'flex' : 'hidden @max-[560px]:flex')}
        >
          <p className="m-0 pb-1 text-content-muted">
            {mode === 'diff' ? `Largest changes in ${diffMetric} time` : 'Hottest frames by self time'}
          </p>
          <FrameRows rows={ranked.slice(0, LIST_TOP)} peak={peak} profile={profile} focusId={focus.id} metric={diffMetric} basis={basis} tone={toneOf} onPick={zoomTo} className={styles.rows()} rowClass={styles.row()} />
          {ranked.length > LIST_TOP ? (
            <details>
              <summary className={styles.more()}>Show all {ranked.length}</summary>
              <FrameRows rows={ranked.slice(LIST_TOP)} start={LIST_TOP + 1} peak={peak} profile={profile} focusId={focus.id} metric={diffMetric} basis={basis} tone={toneOf} onPick={zoomTo} className={styles.rows()} rowClass={styles.row()} />
            </details>
          ) : null}
        </section>
      ) : null}
      {mode === 'diff' && diff?.compatible ? (
        <div data-slot="flamegraph-legend" className="flex flex-col gap-1">
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
  focusId: string;
  metric: 'self' | 'total';
  basis: 'absolute' | 'share';
  tone: (change: FlameFrameDelta | undefined) => FlameDeltaTone | null;
  onPick: (id: string) => void;
  className: string;
  rowClass: string;
}

/** Rows of the frame list. Each is a 44px tap target that zooms the graph; a removed frame has nothing to zoom to. */
function FrameRows({ rows, start = 1, peak, profile, focusId, metric, basis, tone, onPick, className, rowClass }: FrameRowsProps) {
  const unit = profile.unit;
  const share = (value: number) => formatFlameShare(profile.total > 0 ? value / profile.total : null);
  const sizeOf = (row: FlameRankedFrame) => rankedSize(row, metric);
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
              {removed ? <span>removed · was {formatFlameValue(row.change!.total.baseline ?? 0, unit)}</span> : <span className="shrink-0">self {share(row.self)} · total {share(row.total)}</span>}
              <svg aria-hidden="true" height="6" className="h-1.5 min-w-8 flex-1">
                <rect x="0" y="0" height="6" width={`${peak > 0 ? (sizeOf(row) / peak) * 100 : 0}%`} className={bar} />
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
              <button type="button" aria-current={row.id === focusId || undefined} className={rowClass} onClick={() => onPick(row.id)}>
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
  entry: FlameViewFrame;
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
