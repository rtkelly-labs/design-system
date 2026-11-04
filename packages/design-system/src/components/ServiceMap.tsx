'use client';

import { forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent } from 'react';
import { cn, recipe } from '../lib/recipe';
import {
  formatServiceCount,
  formatServiceErrorRate,
  layoutServiceGraph,
  serviceEdgeMidpoint,
  serviceEdgePath,
  serviceGraph,
  type ServiceEdge,
  type ServiceGraph,
  type ServiceGraphLayoutNode,
  type ServiceNode,
  type ServiceNodeKind,
} from '../lib/serviceGraph';
import { formatTraceDuration, type TraceSpanInput } from '../lib/trace';

/** Geometry in SVG user units. The SVG scales uniformly, so these are proportions. */
const NODE_WIDTH = 176;
const NODE_HEIGHT = 64;
const COLUMN_GAP = 136;
const ROW_GAP = 28;
const PAD = 16;
/** Edge label: 10-unit monospace, so a character is about 6 units wide. */
const LABEL_CHAR = 6.1;
const LABEL_HEIGHT = 14;
const DIM = 0.25;

const serviceMap = recipe({
  slots: {
    root: 'flex min-w-0 flex-col gap-3 font-mono text-sm text-content-primary lg:flex-row lg:items-start',
    canvas: 'block h-auto w-full min-w-0 flex-1 overflow-visible',
    node: 'cursor-pointer',
    name: 'fill-content-primary text-[13px] font-bold',
    kind: 'fill-content-muted text-[10px] uppercase tracking-wider',
    stats: 'fill-content-secondary text-[11px]',
    latency: 'fill-content-muted text-[10px]',
    label: 'fill-content-secondary text-[10px]',
    details: 'flex w-full shrink-0 flex-col gap-3 border-2 border-edge-strong bg-surface-raised p-3 lg:w-72',
    heading: 'flex items-baseline justify-between gap-2 font-bold',
    stat: 'grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs',
    term: 'text-content-muted',
    value: 'text-right tabular-nums',
    group: 'flex flex-col gap-1 text-xs',
    groupTitle: 'text-content-muted uppercase tracking-wider',
    link: 'flex w-full cursor-pointer items-baseline justify-between gap-2 border border-edge-subtle bg-surface-base px-2 py-1 text-left hover:border-edge-strong hover:bg-surface-sunken',
    clear: 'cursor-pointer self-start border border-edge-default px-2 py-1 text-xs hover:bg-surface-sunken',
    empty: 'text-content-muted',
  },
  variants: {
    danger: { true: { value: 'text-intent-danger' } },
  },
});

const KIND_LABEL: Record<ServiceNodeKind, string> = { service: 'svc', database: 'db', queue: 'queue', external: 'ext' };
const KIND_WORD: Record<ServiceNodeKind, string> = { service: 'service', database: 'database', queue: 'queue', external: 'external service' };

function plural(count: number, one: string, many = `${one}s`): string {
  return `${formatServiceCount(count)} ${count === 1 ? one : many}`;
}

function rate(errors: number, total: number): number {
  return total > 0 ? errors / total : 0;
}

/** Thicker for more traffic, by order of magnitude: 1–9, 10–99, 100–999, 1k+. */
function edgeWeight(calls: number): number {
  return 1.5 + Math.min(3, Math.max(0, Math.floor(Math.log10(Math.max(1, calls)))));
}

/** `1.2k calls · 2% err`. */
function edgeLabel(edge: ServiceEdge): string {
  return `${plural(edge.calls, 'call')} · ${formatServiceErrorRate(edge.errors, edge.calls)} err`;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(1, max - 1))}…`;
}

/** What a screen reader hears for one node — its box, said in words. */
function describeNode(node: ServiceNode, inbound: number, outbound: number, overThreshold: boolean): string {
  const kind = node.kind ?? 'service';
  return [
    node.id,
    KIND_WORD[kind],
    plural(node.requests, 'request'),
    plural(node.errors, 'error'),
    `${formatServiceErrorRate(node.errors, node.requests)} error rate`,
    `average ${formatTraceDuration(node.avgDuration)}`,
    ...(node.p95Duration !== undefined ? [`p95 ${formatTraceDuration(node.p95Duration)}`] : []),
    ...(overThreshold ? ['over the error threshold'] : []),
    `called by ${plural(inbound, 'service')}`,
    `calls ${plural(outbound, 'service')}`,
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

interface Box { x: number; y: number; width: number; height: number }
function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

export interface ServiceMapProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The graph to draw. Takes precedence over `spans`. */
  graph?: ServiceGraph;
  /**
   * Spans folded into a graph with `serviceGraph`: one flat list (ids unique
   * across it), or a list of traces whose ids may repeat. Ignored when `graph`
   * is given.
   */
  spans?: readonly TraceSpanInput[] | readonly (readonly TraceSpanInput[])[];
  /** The selected service id. Controlled when defined; `null` selects nothing. */
  selectedId?: string | null;
  /** The service selected on mount when uncontrolled. */
  defaultSelectedId?: string | null;
  /** Called with the id a click, Enter or Space selects, or `null` when Escape clears it. */
  onSelectedChange?: (id: string | null) => void;
  /**
   * Error rate (0–1) above which a service is flagged: outlined in the danger
   * role and badged. Default `0.05`.
   */
  errorThreshold?: number;
  /** Accessible name for the map. Default `Service map`. */
  title?: string;
  /**
   * Height of the drawing, as an SVG length (`320`, `"20rem"`). The graph is
   * fitted inside it without stretching. Default: as tall as its width implies.
   */
  height?: number | string;
  /**
   * When edge labels (`1.2k calls · 2% err`) show. `auto` (default) shows every
   * label that fits without overlapping a node or another label, and the rest
   * on hover or when an end is focused or selected; `interactive` shows them
   * only then; `always` shows all of them.
   */
  edgeLabels?: 'auto' | 'always' | 'interactive';
}

/**
 * A service dependency map: one box per service, one arrow per caller →
 * callee pair, laid out in layers from the services nothing calls.
 *
 * Feed it a `graph`, or `spans` from any number of traces and it folds them
 * with `serviceGraph`. Boxes carry request count and error rate; a service
 * over `errorThreshold` is outlined and badged in the danger role, and an
 * edge that carried errors is drawn in it. Selecting a service dims all but
 * its neighbourhood and opens a details panel whose inbound and outbound
 * calls are buttons to the neighbour.
 *
 * The boxes are a roving tab stop in layer order — Left and Right cross
 * layers, Up and Down move within one, Enter or Space selects, Escape clears —
 * hand-rolled per the one-interaction-library rule. Everything is placed with
 * SVG attributes, so no inline style.
 */
export const ServiceMap = forwardRef<HTMLDivElement, ServiceMapProps>(function ServiceMap(
  {
    graph: graphProp,
    spans,
    selectedId: selectedProp,
    defaultSelectedId = null,
    onSelectedChange,
    errorThreshold = 0.05,
    title = 'Service map',
    height,
    edgeLabels = 'auto',
    className,
    ...props
  },
  ref,
) {
  const graph = useMemo(() => graphProp ?? serviceGraph(spans ?? []), [graphProp, spans]);
  const layout = useMemo(
    () => layoutServiceGraph(graph, { nodeWidth: NODE_WIDTH, nodeHeight: NODE_HEIGHT, columnGap: COLUMN_GAP, rowGap: ROW_GAP }),
    [graph],
  );
  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph]);
  const placedById = useMemo(() => new Map(layout.nodes.map((node) => [node.id, node])), [layout]);
  const edgeByKey = useMemo(() => new Map(graph.edges.map((edge) => [`${edge.from}\u0000${edge.to}`, edge])), [graph]);
  const inboundOf = useCallback((id: string) => graph.edges.filter((edge) => edge.to === id && edge.from !== id), [graph]);
  const outboundOf = useCallback((id: string) => graph.edges.filter((edge) => edge.from === id && edge.to !== id), [graph]);
  const over = useCallback((node: ServiceNode) => rate(node.errors, node.requests) > errorThreshold, [errorThreshold]);

  const [selectedRaw, setSelectedId] = useControllable<string | null>(selectedProp, defaultSelectedId, onSelectedChange);
  const selectedId = selectedRaw !== null && placedById.has(selectedRaw) ? selectedRaw : null;
  const neighbourhood = useMemo(() => {
    if (!selectedId) return null;
    const ids = new Set([selectedId]);
    for (const edge of graph.edges) {
      if (edge.from === selectedId) ids.add(edge.to);
      if (edge.to === selectedId) ids.add(edge.from);
    }
    return ids;
  }, [graph, selectedId]);

  // Roving tabindex over the boxes, in layer order.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const focusId = activeId && placedById.has(activeId) ? activeId : (selectedId ?? layout.nodes[0]?.id ?? null);
  const nodeRefs = useRef(new Map<string, SVGGElement>());
  const pendingFocus = useRef(false);
  useEffect(() => {
    if (!pendingFocus.current || !focusId) return;
    pendingFocus.current = false;
    nodeRefs.current.get(focusId)?.focus();
  }, [focusId]);
  const moveTo = (id: string | undefined) => {
    if (!id) return;
    pendingFocus.current = true;
    setActiveId(id);
  };

  const layerNodes = useMemo(() => {
    const layers: ServiceGraphLayoutNode[][] = Array.from({ length: layout.layers }, () => []);
    for (const node of layout.nodes) layers[node.layer]!.push(node);
    return layers;
  }, [layout]);
  const nearestIn = (layer: number, y: number) => {
    const candidates = layerNodes[layer];
    if (!candidates?.length) return undefined;
    return candidates.reduce((best, node) => (Math.abs(node.y - y) < Math.abs(best.y - y) ? node : best)).id;
  };

  const onKeyDown = (event: KeyboardEvent<SVGGElement>, node: ServiceGraphLayoutNode) => {
    switch (event.key) {
      case 'ArrowRight': moveTo(nearestIn(node.layer + 1, node.y)); break;
      case 'ArrowLeft': moveTo(nearestIn(node.layer - 1, node.y)); break;
      case 'ArrowDown': moveTo(layerNodes[node.layer]?.[node.index + 1]?.id); break;
      case 'ArrowUp': moveTo(layerNodes[node.layer]?.[node.index - 1]?.id); break;
      case 'Home': moveTo(layout.nodes[0]?.id); break;
      case 'End': moveTo(layout.nodes[layout.nodes.length - 1]?.id); break;
      case 'Enter':
      case ' ':
        setSelectedId(node.id);
        break;
      case 'Escape':
        if (selectedId === null) return;
        setSelectedId(null);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  // Labels that fit: greedily, in edge order, clear of every box and of each other.
  const fitting = useMemo(() => {
    const fits = new Set<string>();
    const taken: Box[] = layout.nodes.map((node) => ({ x: node.x, y: node.y, width: NODE_WIDTH, height: NODE_HEIGHT }));
    for (const placed of layout.edges) {
      const edge = edgeByKey.get(`${placed.from}\u0000${placed.to}`);
      if (!edge) continue;
      const mid = serviceEdgeMidpoint(placed);
      const width = edgeLabel(edge).length * LABEL_CHAR + 8;
      const box = { x: mid.x - width / 2, y: mid.y - LABEL_HEIGHT / 2, width, height: LABEL_HEIGHT };
      if (taken.some((other) => overlaps(box, other))) continue;
      taken.push(box);
      fits.add(`${placed.from}\u0000${placed.to}`);
    }
    return fits;
  }, [layout, edgeByKey]);

  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const summaryId = `${uid}-summary`;
  const styles = serviceMap();

  if (!layout.nodes.length) {
    return (
      <div ref={ref} data-slot="service-map" {...props} className={styles.root({ className })}>
        <p className={styles.empty()}>No services to map.</p>
      </div>
    );
  }

  const hasBack = layout.edges.some((edge) => edge.back);
  const viewWidth = layout.width + PAD * 2;
  const viewHeight = layout.height + PAD * 2 + (hasBack ? ROW_GAP : 0);
  const flagged = graph.nodes.filter(over);
  const thresholdText = `${Number((errorThreshold * 100).toFixed(2))}%`;
  const summary = `${plural(graph.nodes.length, 'service')}, ${plural(layout.edges.length, 'connection')}. ${
    flagged.length
      ? `${plural(flagged.length, 'service')} over the ${thresholdText} error threshold: ${flagged.map((node) => node.id).join(', ')}.`
      : `None over the ${thresholdText} error threshold.`
  }`;

  const selected = selectedId ? nodeById.get(selectedId) : undefined;
  const nameChars = Math.floor((NODE_WIDTH - 20 - 40) / 7.8);

  const edgeLink = (edge: ServiceEdge, neighbour: string, arrow: string) => (
    <li key={`${edge.from}-${edge.to}`}>
      <button type="button" data-slot="service-map-details-link" className={styles.link()} onClick={() => setSelectedId(neighbour)}>
        <span className="truncate">{arrow} {neighbour}</span>
        <span className={cn('shrink-0 tabular-nums', edge.errors > 0 ? 'text-intent-danger' : 'text-content-secondary')}>{edgeLabel(edge)}</span>
      </button>
    </li>
  );

  return (
    <div ref={ref} data-slot="service-map" {...props} className={styles.root({ className })}>
      <p id={summaryId} className="sr-only">{summary}</p>
      <svg
        data-slot="service-map-canvas"
        role="group"
        aria-label={title}
        aria-describedby={summaryId}
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        width="100%"
        height={height}
        preserveAspectRatio="xMidYMid meet"
        className={styles.canvas()}
      >
        <defs>
          <marker id={`${uid}-arrow`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={9} markerHeight={9} markerUnits="userSpaceOnUse" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-edge-default" />
          </marker>
          <marker id={`${uid}-arrow-danger`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={9} markerHeight={9} markerUnits="userSpaceOnUse" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-intent-danger" />
          </marker>
          <marker id={`${uid}-arrow-active`} viewBox="0 0 10 10" refX={9} refY={5} markerWidth={9} markerHeight={9} markerUnits="userSpaceOnUse" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" className="fill-accent-primary" />
          </marker>
        </defs>
        <g transform={`translate(${PAD} ${PAD})`}>
          <g data-part="edges">
            {layout.edges.map((placed) => {
              const key = `${placed.from}\u0000${placed.to}`;
              const edge = edgeByKey.get(key);
              if (!edge) return null;
              const failing = edge.errors > 0;
              const touchesSelected = selectedId !== null && (placed.from === selectedId || placed.to === selectedId);
              const active = touchesSelected && !failing;
              const d = serviceEdgePath(placed);
              return (
                <g
                  key={key}
                  data-slot="service-map-edge"
                  data-from={placed.from}
                  data-to={placed.to}
                  data-error={failing || undefined}
                  opacity={selectedId !== null && !touchesSelected ? DIM : undefined}
                  onMouseEnter={() => setHoveredEdge(key)}
                  onMouseLeave={() => setHoveredEdge((current) => (current === key ? null : current))}
                >
                  <path d={d} fill="none" className="stroke-transparent" strokeWidth={12} />
                  <path
                    d={d}
                    fill="none"
                    strokeWidth={edgeWeight(edge.calls)}
                    strokeDasharray={placed.back ? '6 4' : undefined}
                    markerEnd={`url(#${uid}-arrow${failing ? '-danger' : active ? '-active' : ''})`}
                    className={failing ? 'stroke-intent-danger' : active ? 'stroke-accent-primary' : 'stroke-edge-default'}
                  />
                </g>
              );
            })}
          </g>
          <g data-part="nodes">
            {layout.nodes.map((placed) => {
              const node = nodeById.get(placed.id)!;
              const kind = node.kind ?? 'service';
              const flaggedNode = over(node);
              const isSelected = placed.id === selectedId;
              const dimmed = neighbourhood !== null && !neighbourhood.has(placed.id);
              const inbound = inboundOf(placed.id).length;
              const outbound = outboundOf(placed.id).length;
              return (
                <g
                  key={placed.id}
                  ref={(element) => { if (element) nodeRefs.current.set(placed.id, element); else nodeRefs.current.delete(placed.id); }}
                  data-slot="service-map-node"
                  data-service={placed.id}
                  data-kind={kind}
                  data-over-threshold={flaggedNode || undefined}
                  data-selected={isSelected || undefined}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={describeNode(node, inbound, outbound, flaggedNode)}
                  tabIndex={placed.id === focusId ? 0 : -1}
                  transform={`translate(${placed.x} ${placed.y})`}
                  opacity={dimmed ? DIM : undefined}
                  className={styles.node()}
                  onFocus={() => { setActiveId(placed.id); setFocusedId(placed.id); }}
                  onBlur={() => setFocusedId((current) => (current === placed.id ? null : current))}
                  onClick={() => setSelectedId(placed.id)}
                  onKeyDown={(event) => onKeyDown(event, placed)}
                >
                  <title>{placed.id}</title>
                  {focusedId === placed.id ? (
                    <rect data-part="focus-ring" x={-5} y={-5} width={NODE_WIDTH + 10} height={NODE_HEIGHT + 10} rx={6} fill="none" strokeWidth={2} strokeDasharray="4 3" className="stroke-accent-primary" />
                  ) : null}
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={4}
                    strokeWidth={isSelected ? 3 : 2}
                    className={cn('fill-surface-raised', isSelected ? 'stroke-accent-primary' : flaggedNode ? 'stroke-intent-danger' : 'stroke-edge-strong')}
                  />
                  <text x={10} y={22} className={styles.name()}>{truncate(placed.id, nameChars)}</text>
                  <text x={NODE_WIDTH - 10} y={21} textAnchor="end" className={styles.kind()}>{KIND_LABEL[kind]}</text>
                  <text x={10} y={41} className={styles.stats()}>
                    {plural(node.requests, 'req', 'req')} · <tspan className={flaggedNode ? 'fill-intent-danger' : undefined}>{formatServiceErrorRate(node.errors, node.requests)} err</tspan>
                  </text>
                  <text x={10} y={56} className={styles.latency()}>
                    avg {formatTraceDuration(node.avgDuration)}{node.p95Duration !== undefined ? ` · p95 ${formatTraceDuration(node.p95Duration)}` : ''}
                  </text>
                  {flaggedNode ? (
                    <g data-part="danger-badge" transform={`translate(${NODE_WIDTH} 0)`}>
                      <circle r={9} className="fill-intent-danger" />
                      <text y={4} textAnchor="middle" className="fill-content-inverse text-[12px] font-bold">!</text>
                    </g>
                  ) : null}
                </g>
              );
            })}
          </g>
          <g data-part="edge-labels" aria-hidden="true">
            {layout.edges.map((placed) => {
              const key = `${placed.from}\u0000${placed.to}`;
              const edge = edgeByKey.get(key);
              if (!edge) return null;
              const touches = (id: string | null) => id !== null && (placed.from === id || placed.to === id);
              const shown = edgeLabels === 'always'
                || (edgeLabels === 'auto' && fitting.has(key))
                || hoveredEdge === key
                || touches(focusedId)
                || touches(selectedId);
              if (!shown) return null;
              const text = edgeLabel(edge);
              const mid = serviceEdgeMidpoint(placed);
              const width = text.length * LABEL_CHAR + 8;
              return (
                <g key={key} data-slot="service-map-edge-label" transform={`translate(${mid.x} ${mid.y})`} opacity={selectedId !== null && !touches(selectedId) ? DIM : undefined}>
                  <rect x={-width / 2} y={-LABEL_HEIGHT / 2} width={width} height={LABEL_HEIGHT} rx={2} className="fill-surface-base" />
                  <text y={3.5} textAnchor="middle" className={cn(styles.label(), edge.errors > 0 && 'fill-intent-danger')}>{text}</text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      {selected ? (
        <section data-slot="service-map-details" aria-label={`${selected.id} details`} className={styles.details()}>
          <div className={styles.heading()}>
            <span className="truncate">{selected.id}</span>
            <span className="shrink-0 text-xs font-normal text-content-muted">{KIND_WORD[selected.kind ?? 'service']}</span>
          </div>
          <dl className={styles.stat()}>
            <dt className={styles.term()}>Requests</dt>
            <dd className={styles.value()}>{formatServiceCount(selected.requests)}</dd>
            <dt className={styles.term()}>Errors</dt>
            <dd className={styles.value({ danger: selected.errors > 0 })}>{formatServiceCount(selected.errors)}</dd>
            <dt className={styles.term()}>Error rate</dt>
            <dd className={styles.value({ danger: over(selected) })}>{formatServiceErrorRate(selected.errors, selected.requests)}</dd>
            <dt className={styles.term()}>Avg latency</dt>
            <dd className={styles.value()}>{formatTraceDuration(selected.avgDuration)}</dd>
            <dt className={styles.term()}>p95 latency</dt>
            <dd className={styles.value()}>{selected.p95Duration !== undefined ? formatTraceDuration(selected.p95Duration) : '—'}</dd>
          </dl>
          <div className={styles.group()}>
            <span className={styles.groupTitle()}>Inbound</span>
            {inboundOf(selected.id).length ? <ul className="flex flex-col gap-1">{inboundOf(selected.id).map((edge) => edgeLink(edge, edge.from, '←'))}</ul> : <span className="text-content-muted">Nothing calls this service.</span>}
          </div>
          <div className={styles.group()}>
            <span className={styles.groupTitle()}>Outbound</span>
            {outboundOf(selected.id).length ? <ul className="flex flex-col gap-1">{outboundOf(selected.id).map((edge) => edgeLink(edge, edge.to, '→'))}</ul> : <span className="text-content-muted">Calls no other service.</span>}
          </div>
          <button type="button" className={styles.clear()} onClick={() => setSelectedId(null)}>Clear selection</button>
        </section>
      ) : null}
    </div>
  );
});

ServiceMap.displayName = 'ServiceMap';
