'use client';

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react';
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

/** The bar's drawing width in SVG user units; the SVG stretches it to the cell. */
const SCALE = 1000;

const traceWaterfall = recipe({
  slots: {
    root: 'flex min-w-0 flex-col font-mono text-sm text-content-primary',
    axis: 'grid grid-cols-[minmax(8rem,16rem)_minmax(0,1fr)_4.5rem] gap-3 border-b border-edge-subtle pb-1 text-xs text-content-muted',
    tree: 'flex flex-col py-1',
    row: 'grid cursor-pointer grid-cols-[minmax(8rem,16rem)_minmax(0,1fr)_4.5rem] items-center gap-3 border-l-2 border-transparent px-1 py-0.5 hover:bg-surface-sunken',
    label: 'flex min-w-0 items-center gap-1',
    guide: 'h-[1.5em] w-3 shrink-0 border-l border-edge-subtle',
    toggle: 'w-3 shrink-0 select-none text-center text-content-muted',
    name: 'truncate',
    bar: 'h-3 w-full overflow-visible',
    duration: 'text-right tabular-nums text-content-secondary',
    empty: 'text-content-muted',
  },
  variants: {
    selected: { true: { row: 'border-accent-primary bg-surface-raised' } },
    // A row fades in from the left as it mounts — `@starting-style`, so no
    // keyframes and no timer. Off by default: a static trace should not move.
    animate: { true: { row: 'transition-[opacity,translate] duration-300 ease-out starting:-translate-x-2 starting:opacity-0 motion-reduce:transition-none' } },
    critical: { true: { name: 'font-bold' } },
    error: { true: { duration: 'text-intent-danger' } },
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
   * under them. Never shorter than the spans themselves.
   */
  range?: number;
  /** Draw a playhead at this offset, in milliseconds from the trace start. */
  playhead?: number;
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
 * expand, Enter or Space selects — hand-rolled rather than borrowed, per the
 * one-interaction-library rule. Bars are SVG, so placing them takes no inline
 * style. In-flight spans (no end) are drawn to `now`; feed it a clock and the
 * waterfall is live. `◆` marks the critical path.
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
    animate = false,
    label = 'Trace waterfall',
    className,
    ...props
  },
  ref,
) {
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
  const axis = useMemo(() => Array.from({ length: intervals }, (_, index) => (extent * index) / intervals), [extent, intervals]);
  const playheadX = playhead !== undefined && Number.isFinite(playhead) && extent > 0 ? Math.max(0, Math.min(SCALE, (playhead / extent) * SCALE)) : null;

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

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, span: TraceSpan) => {
    const index = rows.findIndex((row) => row.id === span.id);
    const open = span.children.length > 0 && !collapsed.has(span.id);
    switch (event.key) {
      case 'ArrowDown': moveTo(rows[index + 1]?.id); break;
      case 'ArrowUp': moveTo(rows[index - 1]?.id); break;
      case 'Home': moveTo(rows[0]?.id); break;
      case 'End': moveTo(rows[rows.length - 1]?.id); break;
      case 'ArrowRight':
        if (span.children.length && !open) toggle(span, true);
        else if (open) moveTo(rows[index + 1]?.id);
        else return;
        break;
      case 'ArrowLeft':
        if (open) toggle(span, false);
        else if (span.parentId) moveTo(span.parentId);
        else return;
        break;
      case 'Enter':
      case ' ':
        setSelectedId(span.id);
        break;
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
    <div ref={ref} data-slot="trace-waterfall" data-live={model.inFlightCount > 0 || undefined} {...props} className={styles.root({ className })}>
      <p className="sr-only">{summary}</p>
      <div aria-hidden="true" data-part="axis" className={styles.axis()}>
        <span>Span</span>
        <span className="flex min-w-0">
          {axis.map((tick, index) => (
            // Keyed by position: a zero-length trace has every tick at 0.
            <span key={index} className="min-w-0 flex-1 truncate border-l border-edge-subtle pl-1">
              {formatTraceDuration(tick)}
            </span>
          ))}
        </span>
        <span className="text-right">{formatTraceDuration(extent)}</span>
      </div>
      {rows.length ? null : <p className={styles.empty()}>No spans match the filter.</p>}
      <div role="tree" aria-label={label} className={styles.tree()}>
        {rows.map((span) => {
          const selected = span.id === selectedId;
          const hasChildren = span.children.length > 0;
          const open = hasChildren && !collapsed.has(span.id);
          const x = extent > 0 ? (span.offset / extent) * SCALE : 0;
          const width = extent > 0 ? Math.max(2, (span.duration / extent) * SCALE) : SCALE;
          return (
            <div
              key={span.id}
              ref={(node) => { if (node) rowRefs.current.set(span.id, node); else rowRefs.current.delete(span.id); }}
              role="treeitem"
              aria-level={span.depth + 1}
              aria-expanded={hasChildren ? open : undefined}
              aria-selected={selected}
              aria-label={describeTraceSpan(span)}
              tabIndex={span.id === focusId ? 0 : -1}
              data-span-id={span.id}
              data-status={span.status}
              data-critical={span.critical || undefined}
              data-in-flight={span.inFlight || undefined}
              className={styles.row({ selected, animate })}
              onFocus={() => setActiveId(span.id)}
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('[data-part="toggle"]')) toggle(span);
                else setSelectedId(span.id);
              }}
              onKeyDown={(event) => onKeyDown(event, span)}
            >
              <span className={styles.label()}>
                {Array.from({ length: span.depth }, (_, index) => <span key={index} aria-hidden="true" className={styles.guide()} />)}
                <span aria-hidden="true" data-part="toggle" className={styles.toggle()}>{hasChildren ? (open ? '▾' : '▸') : ''}</span>
                {span.critical ? <span aria-hidden="true" className="text-accent-primary">◆</span> : null}
                <span className={styles.name({ critical: span.critical })} title={`${span.name} · ${span.service}`}>{span.name}</span>
              </span>
              <svg aria-hidden="true" viewBox={`0 0 ${SCALE} 12`} preserveAspectRatio="none" className={styles.bar()}>
                {axis.slice(1).map((tick, index) => {
                  const at = extent > 0 ? (tick / extent) * SCALE : 0;
                  return <line key={index} x1={at} x2={at} y1={0} y2={12} vectorEffect="non-scaling-stroke" className="stroke-edge-subtle" strokeDasharray="2 2" />;
                })}
                <rect x={Math.min(x, SCALE - width)} y={1} width={width} height={10} className={cn(barFill(span), span.inFlight && 'opacity-70')} />
                {playheadX === null ? null : <line data-part="playhead" x1={playheadX} x2={playheadX} y1={-2} y2={14} vectorEffect="non-scaling-stroke" className="stroke-content-primary" strokeWidth={1.5} />}
              </svg>
              <span className={styles.duration({ error: span.status === 'error' })}>
                {formatTraceDuration(span.duration)}{span.inFlight ? '…' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

TraceWaterfall.displayName = 'TraceWaterfall';
