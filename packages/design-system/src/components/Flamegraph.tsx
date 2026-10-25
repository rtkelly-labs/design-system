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
  searchFlame,
  zoomFlame,
  type FlameDeltaTone,
  type FlameFrame,
  type FlameFrameDelta,
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

const flamegraph = recipe({
  slots: {
    root: 'flex min-w-0 flex-col gap-2 font-mono text-xs text-content-primary',
    breadcrumb: 'flex flex-wrap items-center gap-1 text-content-secondary',
    crumb: 'cursor-pointer border border-transparent px-1 hover:border-edge-default hover:text-content-primary focus-visible:outline-2 focus-visible:outline-accent-primary',
    current: 'px-1 font-bold text-content-primary',
    frame: 'w-full min-w-0',
    chart: 'block w-full select-none overflow-visible',
    status: 'text-content-secondary',
    legend: 'm-0 flex list-none flex-wrap items-center gap-x-4 gap-y-1 p-0 text-content-secondary',
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

/** Track an element's content width; `fallback` until it reports one, and always in a static render. */
function useMeasuredWidth(fallback: number): [(node: HTMLDivElement | null) => void, number] {
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
  return [setNode, width > 0 ? width : fallback];
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
  /** Which number a diff colours by: `self` pinpoints where time moved, `total` lights the whole path above it. Default `self`. */
  diffMetric?: 'self' | 'total';
  /** Relative changes smaller than this are drawn as unchanged. Default `0.05`. */
  threshold?: number;
  /** Relative changes at least this large take the solid delta fill. Default `0.25`. */
  large?: number;
  /** Compare each frame's share of its profile instead of raw values — for profiles of different lengths. Default false. */
  normalize?: boolean;
  /** `flame` grows up from the root at the bottom; `icicle` hangs down from it at the top. Default `flame`. */
  orientation?: 'flame' | 'icicle';
  /** The frame id zoomed into. Controlled when defined; `null` is the whole profile. */
  zoomedId?: string | null;
  /** The frame zoomed into on mount when uncontrolled — and the zoom a static render shows. */
  defaultZoomedId?: string | null;
  /** Called with the frame id a click, Enter or Space zooms into, or the breadcrumb zooms out to. */
  onZoomedChange?: (id: string | null) => void;
  /** Highlight frames whose name contains this text, and report the share of the profile beneath them. */
  search?: string;
  /**
   * The width, in pixels, labels are fitted to before the component can
   * measure itself — and for good in a static render. The graph always fills
   * its container; this only decides how much of each label is printed.
   * Default 960.
   */
  width?: number;
  /** Height of one frame row, in pixels. Default 20. */
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
 * one drawn in the SVG, and adds click-to-zoom with a breadcrumb back out.
 *
 * **Keyboard.** The frames are a tree with one roving tab stop. Up and Down
 * move toward the leaves or the root *as drawn* (so they flip with
 * `orientation`), Left and Right move between neighbours on the same row,
 * Home returns to the root, Enter or Space zooms into a frame and Escape zooms
 * back out one level. Every frame's accessible name carries its numbers.
 *
 * **Diff.** With `mode="diff"` each frame is painted on the delta roles by the
 * sign and size of its change against `baseline`: `delta-added` where the
 * candidate spent more, `delta-removed` where it spent less — change, not
 * verdict. New frames are the solid added fill with a dashed edge; frames the
 * candidate no longer has cannot be drawn at candidate widths, so they are
 * listed under the legend. A change against a zero baseline is coloured by
 * sign only, and its ratio reads `n/a`.
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
    orientation = 'flame',
    zoomedId: zoomedProp,
    defaultZoomedId = null,
    onZoomedChange,
    search,
    width: assumedWidth = 960,
    rowHeight = 20,
    label = 'Flame graph',
    className,
    ...props
  },
  ref,
) {
  const styles = flamegraph();
  const enhanced = useEnhanced();
  const [measure, width] = useMeasuredWidth(assumedWidth);
  const [zoomedId, setZoomedId] = useControllable<string | null>(zoomedProp, defaultZoomedId, onZoomedChange);

  const diff = useMemo(() => (mode === 'diff' && baseline ? diffFlame(baseline, profile, { normalize }) : null), [mode, baseline, profile, normalize]);
  const changes = diff?.compatible ? diff.frames : null;
  const focus = (zoomedId ? profile.byId.get(zoomedId) : undefined) ?? profile.root;
  const view = useMemo(() => zoomFlame(profile, focus.id).filter((entry) => entry.width * width >= MIN_FRAME_PX), [profile, focus.id, width]);
  const viewById = useMemo(() => new Map(view.map((entry) => [entry.frame.id, entry])), [view]);
  const found = useMemo(() => searchFlame(profile, search ?? ''), [profile, search]);
  const searching = !!search?.trim();

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

  const zoomTo = (frame: FlameFrame) => setZoomedId(frame.parentId === null ? null : frame.id);

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
        zoomTo(frame);
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

  const toneOf = (frame: FlameFrame): FlameDeltaTone | null =>
    changes ? flameDeltaTone(changes.get(frame.id), { metric: diffMetric, threshold, large }) : null;

  const unit = profile.unit;
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
  const tipEntry = tipId !== null && enhanced ? viewById.get(tipId) : undefined;

  return (
    <div ref={ref} data-slot="flamegraph" data-mode={mode} data-orientation={orientation} {...props} className={styles.root({ className })}>
      <p className="sr-only">{summary}</p>
      {path.length > 1 ? (
        <nav aria-label="Zoom path" data-slot="flamegraph-breadcrumb">
          <ol className={cn(styles.breadcrumb(), 'm-0 list-none p-0')}>
            {path.map((frame, index) => (
              <li key={frame.id} className="flex items-center gap-1">
                {index > 0 ? <span aria-hidden="true" className="text-content-muted">›</span> : null}
                {index === path.length - 1 ? (
                  <span aria-current="location" className={styles.current()}>{frame.name}</span>
                ) : (
                  <button type="button" className={styles.crumb()} onClick={() => setZoomedId(frame.parentId === null ? null : frame.id)}>
                    {frame.name}
                  </button>
                )}
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
          className={styles.chart()}
          onMouseLeave={() => setHoverId(null)}
        >
          {view.map((entry) => {
            const { frame, context } = entry;
            const y = yOf(frame.depth);
            const px = entry.width * width;
            const text = fitFlameLabel(frame.name, px - LABEL_PAD * 2, CHAR_WIDTH);
            const tone = toneOf(frame);
            const change = changes?.get(frame.id);
            const matched = searching && found.ids.has(frame.id);
            const dimmed = searching && !matched;
            const look = tone ? TONE[tone] : matched ? { rect: 'fill-accent-primary', text: 'fill-content-inverse' } : context || frame.parentId === null ? { rect: 'fill-surface-sunken', text: 'fill-content-secondary' } : { rect: 'fill-surface-raised', text: 'fill-content-primary' };
            const x = `${entry.x * 100}%`;
            const w = `${entry.width * 100}%`;
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
                onClick={() => zoomTo(frame)}
                onKeyDown={(event) => onKeyDown(event, entry)}
                onFocus={() => { setActiveId(frame.id); setFocusedId(frame.id); }}
                onBlur={() => setFocusedId((current) => (current === frame.id ? null : current))}
                onMouseEnter={() => setHoverId(frame.id)}
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
                {text ? (
                  <svg x={x} y={y} width={w} height={rowHeight} overflow="hidden" aria-hidden="true">
                    <text x={LABEL_PAD} y={rowHeight / 2} dominantBaseline="central" className={cn(look.text, 'text-xs')}>
                      {text}
                    </text>
                  </svg>
                ) : null}
              </g>
            );
          })}
          {tipEntry ? <FlameTooltip entry={tipEntry} profile={profile} change={changes?.get(tipEntry.frame.id)} metric={diffMetric} basis={diff?.compatible ? diff.basis : 'absolute'} y={yOf(tipEntry.frame.depth)} rowHeight={rowHeight} height={height} /> : null}
        </svg>
      </div>
      {mode === 'diff' && diff?.compatible ? (
        <div data-slot="flamegraph-legend" className="flex flex-col gap-1">
          <ul aria-label="Colour key" className={styles.legend()}>
            <li className="text-content-muted">
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
                  <span className="text-content-primary">{frame.name}</span> ({formatFlameValue(frame.total.baseline ?? 0, unit)})
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

/** The enhanced tooltip, drawn inside the SVG beside its frame so placing it needs no inline style. */
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
