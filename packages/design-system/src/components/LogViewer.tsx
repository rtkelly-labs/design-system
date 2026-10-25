'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import {
  describeLogEntry,
  highlightLogText,
  inLogRange,
  nearestLogIndex,
  sortLogEntries,
  type LogEntry,
} from '../lib/logs';
import { recipe } from '../lib/recipe';
import { formatTimestamp, normaliseRange, type TimeRange as TimeWindow } from '../lib/timeRange';
import type { LogSeverity } from '../lib/severity';
import { SeverityBadge } from './SeverityBadge';
import { useTimeCursor, useTimeRange } from './TimeRange';

/** Collapsed row height, in px. Fixed (`h-8`) so a windowed list plans exactly. */
const ROW_HEIGHT = 32;
/** The sticky column header's height (`h-8`); rows begin below it. */
const HEADER_HEIGHT = 32;
/** Above this many lines the list is windowed unless `virtualize` says otherwise. */
const VIRTUALIZE_ABOVE = 200;
/** How close to the latest edge, in px, still counts as "at the latest line". */
const EDGE_SLACK = 4;

/** Virtualization geometry is runtime arithmetic; hoisted functions (the
 * `ATTACHED_STYLE` convention from CodeBlock, as in DataTable) keep it off the
 * inline-style sites the contract counts. */
function spacerStyle(height: number) {
  return { height };
}
function scrollBoxStyle(height: number) {
  return { height };
}

const logViewer = recipe({
  slots: {
    root: 'relative flex min-w-0 flex-col border-2 border-edge-strong bg-surface-base font-mono text-xs leading-4 text-content-primary',
    scroll: 'relative w-full overflow-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-primary',
    header: 'sticky top-0 z-10 grid h-8 min-w-[36rem] items-center gap-3 border-b border-edge-default bg-surface-raised px-2 uppercase tracking-wide text-content-muted',
    list: 'flex min-w-[36rem] flex-col',
    row: 'flex flex-col border-l-2 border-l-transparent',
    summary: 'grid h-8 w-full cursor-pointer items-center gap-3 border-b border-edge-subtle px-2 text-left hover:bg-surface-sunken focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent-primary',
    toggle: 'select-none text-center text-content-muted',
    time: 'whitespace-nowrap tabular-nums text-content-secondary',
    severity: 'flex',
    service: 'truncate text-content-secondary',
    message: 'truncate',
    detail: 'flex flex-col gap-2 border-b border-edge-subtle bg-surface-sunken px-2 py-2 pl-8',
    full: 'whitespace-pre-wrap break-words',
    fields: 'grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1',
    key: 'text-content-muted',
    value: 'min-w-0 break-all',
    traceButton: 'ml-3 cursor-pointer border border-accent-primary px-1.5 text-accent-primary hover:bg-accent-primary hover:text-content-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
    mark: 'bg-accent-primary text-content-inverse',
    empty: 'px-3 py-8 text-center text-content-muted',
    jump: 'absolute bottom-3 right-3 z-20 cursor-pointer border-2 border-edge-strong bg-surface-overlay px-2 py-1 text-content-primary shadow-hard-sm hover:bg-accent-primary hover:text-content-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
  },
  variants: {
    // The service column collapses away when no line names one.
    services: {
      true: { header: 'grid-cols-[1rem_19ch_4.5rem_8rem_minmax(0,1fr)]', summary: 'grid-cols-[1rem_19ch_4.5rem_8rem_minmax(0,1fr)]' },
      false: { header: 'grid-cols-[1rem_19ch_4.5rem_minmax(0,1fr)]', summary: 'grid-cols-[1rem_19ch_4.5rem_minmax(0,1fr)]' },
    },
    cursor: { true: { row: 'border-l-accent-primary bg-surface-raised' } },
    expanded: { true: { row: 'bg-surface-raised' } },
  },
});

function Highlighted({ text, query, className }: { text: string; query?: string; className?: string }) {
  const parts = highlightLogText(text, query);
  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.match ? (
          <mark key={index} className={logViewer().mark()}>{part.text}</mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </span>
  );
}

export interface LogViewerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The log lines, in any order; they are drawn in time order. */
  entries: readonly LogEntry[];
  /** `asc` (default) puts the newest line at the bottom, like a terminal tail; `desc` puts it at the top. */
  order?: 'asc' | 'desc';
  /** Highlight case-insensitive matches of this text in each message. Highlights only — filter with `filterLogEntries`. */
  query?: string;
  /** Show only these severities. Omit to show every line. */
  severities?: readonly LogSeverity[];
  /** Show only lines inside this window. Overrides the shared range. */
  range?: TimeWindow;
  /** Inside a `TimeRangeProvider`, show only lines inside the shared window. Default true. */
  followRange?: boolean;
  /**
   * Tail mode. While the reader is at the latest line, new lines keep it
   * there; once they scroll away, a "Jump to latest" button counts what
   * arrived since. Default false.
   */
  follow?: boolean;
  /** Called with the trace id when a line's "View trace" button is pressed. The button only renders when this is given. */
  onTraceSelect?: (traceId: string, entry: LogEntry) => void;
  /** Height of the scroll box, in px. Default 360. */
  height?: number;
  /** Window the list to the visible rows. Default: only above 200 lines. */
  virtualize?: boolean;
  /** Draw the column labels above the lines. Default true. */
  showHeader?: boolean;
  /** Announce new lines politely to screen readers. Off by default: a flood announced line by line is hostile. */
  announce?: boolean;
  /** Ids of the lines expanded on mount. */
  defaultExpanded?: readonly string[];
  /** Replaces the empty-state text. */
  emptyText?: ReactNode;
  /** Accessible name for the list. Default `Log lines`. */
  label?: string;
}

/**
 * A log tail: one monospace line per entry — timestamp, severity, service,
 * message — in time order, each expanding to its fields and trace ids.
 *
 * It follows the page's `TimeRangeProvider` when there is one — only lines in
 * the shared window are shown, hovering a line moves the shared cursor to it,
 * and the line nearest a cursor set elsewhere is marked. Large streams are
 * windowed with `@tanstack/react-virtual` at a fixed row height.
 *
 * The list is one tab stop. Up/Down, Home/End and PageUp/PageDown move
 * through the lines, Enter or Space toggles one, Right expands and Left
 * collapses — hand-rolled, per the one-interaction-library rule.
 */
export const LogViewer = forwardRef<HTMLDivElement, LogViewerProps>(function LogViewer(
  {
    entries,
    order = 'asc',
    query,
    severities,
    range: rangeProp,
    followRange = true,
    follow = false,
    onTraceSelect,
    height = 360,
    virtualize,
    showHeader = true,
    announce = false,
    defaultExpanded = [],
    emptyText,
    label = 'Log lines',
    className,
    ...props
  },
  ref,
) {
  const uid = useId();
  const shared = useTimeRange();
  const sharedCursor = useTimeCursor();
  const range = normaliseRange(rangeProp) ?? (followRange ? shared?.range ?? null : null);

  // `range` is a fresh object each render; its endpoints are what matter.
  const from = range?.from;
  const to = range?.to;
  const rows = useMemo(() => {
    const allowed = severities ? new Set(severities) : null;
    const kept = entries.filter(
      (entry) =>
        (!allowed || allowed.has(entry.severity)) &&
        (from === undefined || to === undefined || inLogRange(entry.time, { from, to })),
    );
    return sortLogEntries(kept, order);
  }, [entries, severities, order, from, to]);
  const hasServices = useMemo(() => rows.some((entry) => entry.service), [rows]);
  const latestTime = rows.length ? rows[order === 'asc' ? rows.length - 1 : 0].time : null;

  const virtual = virtualize ?? rows.length > VIRTUALIZE_ABOVE;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(defaultExpanded));

  // eslint-disable-next-line react-hooks/incompatible-library -- the windowing engine DataTable uses; its getters are read during render on purpose
  const virtualizer = useVirtualizer({
    count: virtual ? rows.length : 0,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
    getScrollElement: () => scrollRef.current,
    getItemKey: (index) => rows[index]?.id ?? index,
    scrollMargin: showHeader ? HEADER_HEIGHT : 0,
    initialRect: { width: 0, height },
    // An expanded line is taller than the plan; measure it, but never accept 0
    // (no layout yet), or every line would collapse into the viewport at once.
    measureElement: (element, entry) => {
      const measured = entry?.borderBoxSize?.[0]?.blockSize ?? element.getBoundingClientRect().height;
      return measured > 0 ? Math.round(measured) : ROW_HEIGHT;
    },
  });
  const virtualItems = virtual ? virtualizer.getVirtualItems() : [];
  const margin = showHeader ? HEADER_HEIGHT : 0;
  const firstItem = virtualItems[0];
  const lastItem = virtualItems[virtualItems.length - 1];
  const topGap = virtual && firstItem ? firstItem.start - margin : 0;
  const bottomGap = virtual && lastItem ? virtualizer.getTotalSize() - (lastItem.end - margin) : 0;
  const rendered = virtual ? virtualItems.map((item) => item.index) : rows.map((_, index) => index);

  // ---- Tail mode -------------------------------------------------------
  const [pinned, setPinned] = useState(true);
  const pinnedRef = useRef(true);
  const [anchorTime, setAnchorTime] = useState<number | null>(null);
  const atLatestEdge = (el: HTMLElement) =>
    order === 'asc' ? el.scrollHeight - el.scrollTop - el.clientHeight <= EDGE_SLACK : el.scrollTop <= EDGE_SLACK;
  const scrollToLatest = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = order === 'asc' ? el.scrollHeight : 0;
  }, [order]);
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const at = atLatestEdge(el);
    if (at === pinnedRef.current) return;
    pinnedRef.current = at;
    setPinned(at);
    setAnchorTime(at ? null : latestTime);
  };
  useLayoutEffect(() => {
    if (follow && pinnedRef.current) scrollToLatest();
  }, [follow, rows, scrollToLatest, bottomGap]);
  const newCount = useMemo(
    () => (anchorTime === null ? 0 : rows.reduce((count, entry) => count + (entry.time > anchorTime ? 1 : 0), 0)),
    [rows, anchorTime],
  );
  const jumpToLatest = () => {
    pinnedRef.current = true;
    setPinned(true);
    setAnchorTime(null);
    if (virtual && rows.length) virtualizer.scrollToIndex(order === 'asc' ? rows.length - 1 : 0, { align: order === 'asc' ? 'end' : 'start' });
    scrollToLatest();
  };

  // ---- Shared cursor ---------------------------------------------------
  const cursorIndex = nearestLogIndex(rows, sharedCursor?.cursor);
  const ownCursor = useRef<number | null>(null);
  const hover = (entry: LogEntry) => {
    if (!sharedCursor) return;
    ownCursor.current = entry.time;
    sharedCursor.setCursor(entry.time);
  };
  const leave = () => {
    // Clear only a cursor this list set; one a chart set stays.
    if (sharedCursor && ownCursor.current !== null && sharedCursor.cursor === ownCursor.current) sharedCursor.setCursor(null);
    ownCursor.current = null;
  };

  // ---- Roving focus ----------------------------------------------------
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIndex = (() => {
    const found = activeId === null ? -1 : rows.findIndex((entry) => entry.id === activeId);
    if (found !== -1) return found;
    if (!rows.length) return -1;
    return follow ? (order === 'asc' ? rows.length - 1 : 0) : 0;
  })();
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef<string | null>(null);
  // After every render: a move to a row the window had not yet drawn lands
  // once the virtualizer draws it.
  useEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    const node = rowRefs.current.get(id);
    if (!node) return;
    pendingFocus.current = null;
    node.focus();
  });
  const moveTo = (index: number) => {
    const target = rows[Math.max(0, Math.min(rows.length - 1, index))];
    if (!target) return;
    pendingFocus.current = target.id;
    setActiveId(target.id);
    if (virtual) virtualizer.scrollToIndex(rows.indexOf(target), { align: 'auto' });
    const node = rowRefs.current.get(target.id);
    if (node) {
      pendingFocus.current = null;
      node.focus();
    } else {
      // Not drawn yet: hold focus on the box, which owns the stop until the
      // window reaches the line and the effect above hands it over.
      scrollRef.current?.focus({ preventScroll: true });
    }
  };
  const activeRendered = activeIndex !== -1 && rendered.includes(activeIndex);

  const setOpen = (id: string, open: boolean) => {
    setExpanded((current) => {
      if (current.has(id) === open) return current;
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const page = Math.max(1, Math.floor((height - margin) / ROW_HEIGHT) - 1);
  const onRowKeyDown = (event: KeyboardEvent<HTMLElement>, index: number, entry: LogEntry) => {
    switch (event.key) {
      case 'ArrowDown': moveTo(index + 1); break;
      case 'ArrowUp': moveTo(index - 1); break;
      case 'Home': moveTo(0); break;
      case 'End': moveTo(rows.length - 1); break;
      case 'PageDown': moveTo(index + page); break;
      case 'PageUp': moveTo(index - page); break;
      case 'ArrowRight': setOpen(entry.id, true); break;
      case 'ArrowLeft': setOpen(entry.id, false); break;
      default: return;
    }
    event.preventDefault();
  };

  const styles = logViewer({ services: hasServices });

  const renderRow = (entry: LogEntry, index: number) => {
    const open = expanded.has(entry.id);
    const detailId = `${uid}-detail-${index}`;
    const stamp = formatTimestamp(entry.time, 'millisecond');
    const fields = entry.fields ? Object.entries(entry.fields) : [];
    const marked = index === cursorIndex;
    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- hover only mirrors the shared time cursor; focus on the row's button does the same for keyboards
      <div
        key={entry.id}
        role="listitem"
        data-slot="log-viewer-row"
        data-index={index}
        data-severity={entry.severity}
        data-cursor={marked || undefined}
        data-expanded={open || undefined}
        aria-posinset={virtual ? index + 1 : undefined}
        aria-setsize={virtual ? rows.length : undefined}
        ref={virtual ? virtualizer.measureElement : undefined}
        className={styles.row({ cursor: marked, expanded: open })}
        onMouseEnter={() => hover(entry)}
      >
        <button
          type="button"
          ref={(node) => {
            if (node) rowRefs.current.set(entry.id, node);
            else rowRefs.current.delete(entry.id);
          }}
          tabIndex={index === activeIndex ? 0 : -1}
          aria-expanded={open}
          aria-controls={open ? detailId : undefined}
          aria-label={describeLogEntry(entry)}
          className={styles.summary()}
          onClick={() => {
            setActiveId(entry.id);
            setOpen(entry.id, !open);
          }}
          onFocus={() => {
            setActiveId(entry.id);
            hover(entry);
          }}
          onKeyDown={(event) => onRowKeyDown(event, index, entry)}
        >
          <span aria-hidden="true" className={styles.toggle()}>{open ? <ChevronDown size={12} className="inline-block" /> : <ChevronRight size={12} className="inline-block" />}</span>
          <time dateTime={new Date(entry.time).toISOString()} className={styles.time()}>{stamp}</time>
          <span className={styles.severity()}><SeverityBadge severity={entry.severity} className="px-1 py-0 border" /></span>
          {hasServices ? <span className={styles.service()} title={entry.service}>{entry.service ?? ''}</span> : null}
          <Highlighted text={entry.message} query={query} className={styles.message()} />
        </button>
        {open ? (
          <div id={detailId} data-slot="log-viewer-detail" className={styles.detail()}>
            <Highlighted text={entry.message} query={query} className={styles.full()} />
            {fields.length || entry.traceId || entry.spanId ? (
              <dl className={styles.fields()}>
                {fields.map(([key, value]) => (
                  <div key={key} className="contents">
                    <dt className={styles.key()}>{key}</dt>
                    <dd className={styles.value()}>{String(value)}</dd>
                  </div>
                ))}
                {entry.traceId ? (
                  <div className="contents">
                    <dt className={styles.key()}>trace_id</dt>
                    <dd className={styles.value()}>
                      {entry.traceId}
                      {onTraceSelect ? (
                        <button
                          type="button"
                          data-slot="log-viewer-trace-button"
                          className={styles.traceButton()}
                          onClick={() => onTraceSelect(entry.traceId as string, entry)}
                        >
                          View trace
                        </button>
                      ) : null}
                    </dd>
                  </div>
                ) : null}
                {entry.spanId ? (
                  <div className="contents">
                    <dt className={styles.key()}>span_id</dt>
                    <dd className={styles.value()}>{entry.spanId}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  const filteredOut = Boolean(query?.trim()) || Boolean(severities);
  const empty = emptyText ?? (filteredOut ? 'No log lines match.' : 'No log lines in this range.');

  return (
    <div ref={ref} data-slot="log-viewer" data-follow={follow || undefined} {...props} className={styles.root({ className })}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- scroll tracks tail mode, mouseleave releases the shared cursor, focus and keys stand in for an active line the window has not drawn */}
      <div
        ref={scrollRef}
        data-slot="log-viewer-scroll"
        role="log"
        aria-live={announce ? 'polite' : 'off'}
        aria-label={label}
        // The list is the one tab stop. When the active line has been windowed
        // away, the box itself takes the stop and hands focus back to it.
        tabIndex={activeRendered ? -1 : 0}
        className={styles.scroll()}
        style={scrollBoxStyle(height)}
        onScroll={onScroll}
        onMouseLeave={leave}
        onFocus={(event) => {
          if (event.target === event.currentTarget && activeIndex !== -1 && !pendingFocus.current) moveTo(activeIndex);
        }}
        onKeyDown={(event) => {
          // While the box holds the stop, it steers as the active line would.
          if (event.target === event.currentTarget && activeIndex !== -1) onRowKeyDown(event, activeIndex, rows[activeIndex]);
        }}
      >
        {showHeader ? (
          <div aria-hidden="true" data-slot="log-viewer-header" className={styles.header()}>
            <span />
            <span>Time (UTC)</span>
            <span>Level</span>
            {hasServices ? <span>Service</span> : null}
            <span>Message</span>
          </div>
        ) : null}
        {rows.length === 0 ? (
          <p data-slot="log-viewer-empty" className={styles.empty()}>&gt; {empty}</p>
        ) : (
          <div role="list" className={styles.list()}>
            {virtual ? (
              <>
                {topGap > 0 ? <div aria-hidden="true" style={spacerStyle(topGap)} /> : null}
                {virtualItems.map((item) => renderRow(rows[item.index], item.index))}
                {bottomGap > 0 ? <div aria-hidden="true" style={spacerStyle(bottomGap)} /> : null}
              </>
            ) : (
              rows.map((entry, index) => renderRow(entry, index))
            )}
          </div>
        )}
      </div>
      {follow && !pinned && rows.length ? (
        <button type="button" data-slot="log-viewer-jump" className={styles.jump()} onClick={jumpToLatest}>
          Jump to latest{newCount ? ` (${newCount} new)` : ''}
        </button>
      ) : null}
    </div>
  );
});

LogViewer.displayName = 'LogViewer';
