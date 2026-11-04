/**
 * The service graph: spans in, services and the calls between them out.
 *
 * Where `trace.ts` answers "what happened in this request?", this module
 * answers "which services talk to which, how often, and how badly?". It folds
 * any number of spans — one trace or a thousand — into one node per service
 * and one edge per caller → callee pair, then lays that graph out in layers.
 *
 * Pure data, no React, no clock: the same spans always produce the same graph
 * and the same coordinates, so a story or a snapshot is deterministic.
 *
 * Every duration is milliseconds, as in `trace.ts`.
 */

import type { TraceSpanInput } from './trace';

/** What a service is, as far as its spans say. */
export type ServiceNodeKind = 'service' | 'database' | 'queue' | 'external';

/** One service, with the traffic that entered it. */
export interface ServiceNode {
  /** The service name (OTLP `service.name`). */
  id: string;
  /** Spans that entered this service: roots, or spans whose parent is in another service. */
  requests: number;
  /** Of those requests, how many ended in error. */
  errors: number;
  /** Mean duration of the requests, in milliseconds. `0` when none had an end. */
  avgDuration: number;
  /** 95th-percentile (nearest rank) duration of the requests, in milliseconds. */
  p95Duration?: number;
  /** Inferred from span kind and attributes. */
  kind?: ServiceNodeKind;
}

/** Calls from one service into another. */
export interface ServiceEdge {
  /** The calling service. */
  from: string;
  /** The called service. */
  to: string;
  /** How many spans crossed from `from` into `to`. */
  calls: number;
  /** Of those, how many ended in error. */
  errors: number;
  /** Mean duration of the called spans, in milliseconds. */
  avgDuration: number;
}

/** Services and the calls between them. */
export interface ServiceGraph {
  /** Sorted by id. */
  nodes: ServiceNode[];
  /** Sorted by `from`, then `to`. */
  edges: ServiceEdge[];
}

const UNKNOWN_SERVICE = 'unknown';

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function spanDuration(span: TraceSpanInput): number | null {
  if (!finite(span.start)) return null;
  if (finite(span.end)) return Math.max(0, span.end - span.start);
  if (finite(span.duration)) return Math.max(0, span.duration);
  return null;
}

function mean(values: readonly number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function p95(values: readonly number[]): number | undefined {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

interface NodeTally { requests: number; errors: number; durations: number[]; database: boolean; queue: boolean }
interface EdgeTally { calls: number; errors: number; durations: number[] }

function isTraceList(input: readonly TraceSpanInput[] | readonly (readonly TraceSpanInput[])[]): input is readonly (readonly TraceSpanInput[])[] {
  return input.length > 0 && Array.isArray(input[0]);
}

/**
 * Fold spans into a service graph.
 *
 * Pass one flat list (spans from one or many traces, ids unique across them),
 * or a list of traces — each resolved on its own, so span ids may repeat from
 * one trace to the next.
 *
 * - A **node** per service. Its requests are the spans that *entered* it: a
 *   root, or a span whose parent belongs to another service.
 * - An **edge** per parent service → child service crossing, counting the
 *   child spans.
 * - **Kind**: a span carrying `db.system` makes its service a database; one
 *   carrying `messaging.system`, or of kind `producer`/`consumer`, a queue.
 *   A `client` span naming a `peer.service` that emitted no spans of its own
 *   adds an `external` node, with an edge into it.
 */
export function serviceGraph(input: readonly TraceSpanInput[] | readonly (readonly TraceSpanInput[])[]): ServiceGraph {
  const traces: readonly (readonly TraceSpanInput[])[] = isTraceList(input) ? input : [input as readonly TraceSpanInput[]];
  const nodes = new Map<string, NodeTally>();
  const edges = new Map<string, EdgeTally & { from: string; to: string }>();
  const peers: Array<{ from: string; to: string; span: TraceSpanInput }> = [];

  const nodeOf = (id: string): NodeTally => {
    let tally = nodes.get(id);
    if (!tally) nodes.set(id, (tally = { requests: 0, errors: 0, durations: [], database: false, queue: false }));
    return tally;
  };
  const edgeOf = (from: string, to: string) => {
    const key = `${from}\u0000${to}`;
    let tally = edges.get(key);
    if (!tally) edges.set(key, (tally = { from, to, calls: 0, errors: 0, durations: [] }));
    return tally;
  };

  for (const trace of traces) {
    const byId = new Map<string, TraceSpanInput>();
    for (const span of trace) if (span && typeof span.id === 'string' && finite(span.start) && !byId.has(span.id)) byId.set(span.id, span);
    for (const span of byId.values()) {
      const service = span.service || UNKNOWN_SERVICE;
      const node = nodeOf(service);
      const attributes = span.attributes ?? {};
      if (attributes['db.system'] !== undefined) node.database = true;
      if (attributes['messaging.system'] !== undefined || span.kind === 'producer' || span.kind === 'consumer') node.queue = true;

      const parent = span.parentId && span.parentId !== span.id ? byId.get(span.parentId) : undefined;
      const parentService = parent ? parent.service || UNKNOWN_SERVICE : null;
      const duration = spanDuration(span);
      const error = span.status === 'error';
      if (parentService !== service) {
        node.requests += 1;
        if (error) node.errors += 1;
        if (duration !== null) node.durations.push(duration);
      }
      if (parentService !== null && parentService !== service) {
        const edge = edgeOf(parentService, service);
        edge.calls += 1;
        if (error) edge.errors += 1;
        if (duration !== null) edge.durations.push(duration);
      }
      const peer = attributes['peer.service'];
      if (span.kind === 'client' && typeof peer === 'string' && peer && peer !== service) peers.push({ from: service, to: peer, span });
    }
  }

  // A peer that emitted spans of its own is already on the map, reached by
  // the parent → child crossing; only a silent one becomes an external node.
  const external = new Set<string>();
  for (const { from, to, span } of peers) {
    if (nodes.has(to) && !external.has(to)) continue;
    external.add(to);
    const node = nodeOf(to);
    const edge = edgeOf(from, to);
    const duration = spanDuration(span);
    const error = span.status === 'error';
    node.requests += 1;
    edge.calls += 1;
    if (error) { node.errors += 1; edge.errors += 1; }
    if (duration !== null) { node.durations.push(duration); edge.durations.push(duration); }
  }

  return {
    nodes: [...nodes.entries()]
      .sort(([a], [b]) => compare(a, b))
      .map(([id, tally]) => {
        const node: ServiceNode = {
          id,
          requests: tally.requests,
          errors: tally.errors,
          avgDuration: mean(tally.durations),
          kind: external.has(id) ? 'external' : tally.database ? 'database' : tally.queue ? 'queue' : 'service',
        };
        const percentile = p95(tally.durations);
        if (percentile !== undefined) node.p95Duration = percentile;
        return node;
      }),
    edges: [...edges.values()]
      .sort((a, b) => compare(a.from, b.from) || compare(a.to, b.to))
      .map(({ from, to, calls, errors, durations }) => ({ from, to, calls, errors, avgDuration: mean(durations) })),
  };
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** A point in the layout's coordinate space. */
export interface ServiceGraphPoint { x: number; y: number }

/** A node placed by `layoutServiceGraph`. `x`, `y` is its top-left corner. */
export interface ServiceGraphLayoutNode {
  id: string;
  x: number;
  y: number;
  /** Column, counted from the roots. */
  layer: number;
  /** Row within the layer, top first. */
  index: number;
}

/** An edge placed by `layoutServiceGraph`. */
export interface ServiceGraphLayoutEdge {
  from: string;
  to: string;
  /** Where the edge leaves its source. */
  source: ServiceGraphPoint;
  /** Where the edge meets its target (the arrow's tip). */
  target: ServiceGraphPoint;
  /**
   * The edge does not run left to right — it closes a cycle, or joins two
   * nodes in the same layer — so it leaves and enters from below.
   */
  back: boolean;
  /** For a back edge, the depth its loop's control points sit at — below every node. */
  dip?: number;
}

/** A laid-out service graph. */
export interface ServiceGraphLayout {
  /** In layer order, then top to bottom. */
  nodes: ServiceGraphLayoutNode[];
  /** In the graph's edge order; self-calls are dropped. */
  edges: ServiceGraphLayoutEdge[];
  /** Extent of the nodes, from 0, 0. Back-edge loops dip up to `rowGap` below it. */
  width: number;
  height: number;
  /** Node size used, so a renderer can draw what was placed. */
  nodeWidth: number;
  nodeHeight: number;
  /** How many layers. */
  layers: number;
}

/** Spacing for `layoutServiceGraph`, in layout units. */
export interface ServiceGraphLayoutOptions {
  /** Horizontal space between layers. Default 72. */
  columnGap?: number;
  /** Vertical space between nodes in a layer. Default 24. */
  rowGap?: number;
  /** Default 168. */
  nodeWidth?: number;
  /** Default 64. */
  nodeHeight?: number;
}

function positive(value: number | undefined, fallback: number): number {
  return finite(value) && value >= 0 ? value : fallback;
}

/**
 * Place a service graph in left-to-right layers.
 *
 * 1. Cycles are broken by removing the back edges a depth-first search finds
 *    (roots first, then by name), so every edge left points forward.
 * 2. A node's layer is its longest path from a root.
 * 3. Within a layer, nodes start in name order and are reordered by two
 *    down-and-up sweeps of barycentres (the mean row of their neighbours in
 *    the layer before, then after), ties kept by current row and then name.
 *
 * Deterministic: the same graph always lands on the same coordinates. Edges
 * naming an unknown node are ignored.
 */
export function layoutServiceGraph(graph: ServiceGraph, options: ServiceGraphLayoutOptions = {}): ServiceGraphLayout {
  const columnGap = positive(options.columnGap, 72);
  const rowGap = positive(options.rowGap, 24);
  const nodeWidth = positive(options.nodeWidth, 168);
  const nodeHeight = positive(options.nodeHeight, 64);

  const ids = [...new Set(graph.nodes.map((node) => node.id))].sort(compare);
  const known = new Set(ids);
  const pairs = new Map<string, { from: string; to: string }>();
  for (const edge of graph.edges) {
    if (edge.from === edge.to || !known.has(edge.from) || !known.has(edge.to)) continue;
    pairs.set(`${edge.from}\u0000${edge.to}`, { from: edge.from, to: edge.to });
  }
  const out = new Map<string, string[]>(ids.map((id) => [id, []]));
  const indegree = new Map<string, number>(ids.map((id) => [id, 0]));
  for (const { from, to } of pairs.values()) {
    out.get(from)!.push(to);
    indegree.set(to, indegree.get(to)! + 1);
  }
  for (const list of out.values()) list.sort(compare);

  // 1. Depth-first search; an edge into a node still on the stack closes a cycle.
  const reversed = new Set<string>();
  const state = new Map<string, 'open' | 'done'>();
  const visit = (id: string) => {
    state.set(id, 'open');
    for (const next of out.get(id)!) {
      const seen = state.get(next);
      if (seen === 'open') reversed.add(`${id}\u0000${next}`);
      else if (!seen) visit(next);
    }
    state.set(id, 'done');
  };
  for (const id of ids) if (indegree.get(id) === 0 && !state.has(id)) visit(id);
  for (const id of ids) if (!state.has(id)) visit(id);

  const forward = [...pairs.entries()].filter(([key]) => !reversed.has(key)).map(([, pair]) => pair);
  const preds = new Map<string, string[]>(ids.map((id) => [id, []]));
  const succs = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const { from, to } of forward) {
    succs.get(from)!.push(to);
    preds.get(to)!.push(from);
  }

  // 2. Longest path from the roots, over a topological order (Kahn, by name).
  const layerOf = new Map<string, number>(ids.map((id) => [id, 0]));
  const remaining = new Map<string, number>(ids.map((id) => [id, preds.get(id)!.length]));
  const queue = ids.filter((id) => remaining.get(id) === 0);
  while (queue.length) {
    const id = queue.shift()!;
    for (const next of succs.get(id)!) {
      layerOf.set(next, Math.max(layerOf.get(next)!, layerOf.get(id)! + 1));
      remaining.set(next, remaining.get(next)! - 1);
      if (remaining.get(next) === 0) queue.push(next);
    }
  }
  const layerCount = ids.length ? Math.max(...layerOf.values()) + 1 : 0;
  const layers: string[][] = Array.from({ length: layerCount }, () => []);
  for (const id of ids) layers[layerOf.get(id)!]!.push(id);

  // 3. Barycentre sweeps.
  const row = new Map<string, number>();
  const index = () => { for (const layer of layers) layer.forEach((id, at) => row.set(id, at)); };
  index();
  const reorder = (layer: string[], neighbours: Map<string, string[]>) => {
    const keyed = layer.map((id) => {
      const list = neighbours.get(id)!;
      return { id, key: list.length ? mean(list.map((other) => row.get(other)!)) : row.get(id)!, at: row.get(id)! };
    });
    keyed.sort((a, b) => a.key - b.key || a.at - b.at || compare(a.id, b.id));
    layer.splice(0, layer.length, ...keyed.map((entry) => entry.id));
    layer.forEach((id, at) => row.set(id, at));
  };
  for (let sweep = 0; sweep < 2; sweep += 1) {
    for (let at = 1; at < layers.length; at += 1) reorder(layers[at]!, preds);
    for (let at = layers.length - 2; at >= 0; at -= 1) reorder(layers[at]!, succs);
  }

  // Coordinates: layers left to right, each centred on the tallest.
  const tallest = layers.reduce((max, layer) => Math.max(max, layer.length), 0);
  const pitch = nodeHeight + rowGap;
  const height = tallest ? tallest * nodeHeight + (tallest - 1) * rowGap : 0;
  const width = layerCount ? layerCount * nodeWidth + (layerCount - 1) * columnGap : 0;
  const nodes: ServiceGraphLayoutNode[] = [];
  const placed = new Map<string, ServiceGraphLayoutNode>();
  layers.forEach((layer, at) => {
    const offset = ((tallest - layer.length) * pitch) / 2;
    layer.forEach((id, position) => {
      const node = { id, x: at * (nodeWidth + columnGap), y: offset + position * pitch, layer: at, index: position };
      nodes.push(node);
      placed.set(id, node);
    });
  });

  const edges: ServiceGraphLayoutEdge[] = [...pairs.values()].map(({ from, to }) => {
    const a = placed.get(from)!;
    const b = placed.get(to)!;
    if (b.layer > a.layer) {
      return { from, to, back: false, source: { x: a.x + nodeWidth, y: a.y + nodeHeight / 2 }, target: { x: b.x, y: b.y + nodeHeight / 2 } };
    }
    return { from, to, back: true, dip: height + rowGap, source: { x: a.x + nodeWidth / 2, y: a.y + nodeHeight }, target: { x: b.x + nodeWidth / 2, y: b.y + nodeHeight } };
  });

  return { nodes, edges, width, height, nodeWidth, nodeHeight, layers: layerCount };
}

function dipOf(edge: ServiceGraphLayoutEdge): number {
  return edge.dip ?? Math.max(edge.source.y, edge.target.y) + 24;
}

/**
 * An SVG path for a laid-out edge: a horizontal S-curve for a forward edge,
 * a loop under the nodes for a back edge.
 */
export function serviceEdgePath(edge: ServiceGraphLayoutEdge): string {
  const { source: s, target: t } = edge;
  if (edge.back) {
    const dip = dipOf(edge);
    return `M ${s.x} ${s.y} C ${s.x} ${dip}, ${t.x} ${dip}, ${t.x} ${t.y}`;
  }
  const dx = (t.x - s.x) / 2;
  return `M ${s.x} ${s.y} C ${s.x + dx} ${s.y}, ${t.x - dx} ${t.y}, ${t.x} ${t.y}`;
}

/** The middle of the curve `serviceEdgePath` draws — where its label sits. */
export function serviceEdgeMidpoint(edge: ServiceGraphLayoutEdge): ServiceGraphPoint {
  const { source: s, target: t } = edge;
  if (edge.back) return { x: (s.x + t.x) / 2, y: (s.y + t.y) / 8 + (3 * dipOf(edge)) / 4 };
  return { x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 };
}

/** `950`, `1.2k`, `34k`, `1.5M`. */
export function formatServiceCount(value: number): string {
  if (!finite(value)) return '—';
  const abs = Math.abs(value);
  const short = (n: number, unit: string) => `${n < 10 ? n.toFixed(1).replace(/\.0$/, '') : Math.round(n)}${unit}`;
  if (abs < 1000) return String(Math.round(value));
  if (abs < 1_000_000) return short(value / 1000, 'k');
  return short(value / 1_000_000, 'M');
}

/** An error rate as a percentage: `0%`, `0.4%`, `2%`, `100%`. */
export function formatServiceErrorRate(errors: number, total: number): string {
  if (!finite(errors) || !finite(total) || total <= 0) return '0%';
  const percent = (errors / total) * 100;
  if (percent === 0) return '0%';
  if (percent < 1) return `${percent.toFixed(1)}%`;
  return `${Math.round(percent)}%`;
}
