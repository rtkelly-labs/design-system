import { describe, expect, it } from 'vitest';
import {
  formatServiceCount,
  formatServiceErrorRate,
  layoutServiceGraph,
  serviceEdgeMidpoint,
  serviceEdgePath,
  serviceGraph,
  type ServiceGraph,
} from './serviceGraph';
import type { TraceSpanInput } from './trace';

const spans: TraceSpanInput[] = [
  { id: 'a', name: 'GET /checkout', service: 'web', kind: 'server', start: 0, end: 400 },
  { id: 'b', parentId: 'a', name: 'cart.load', service: 'cart', start: 10, end: 150 },
  { id: 'b2', parentId: 'b', name: 'cart.price', service: 'cart', start: 12, end: 40 },
  { id: 'c', parentId: 'b', name: 'SELECT cart_items', service: 'postgres', kind: 'client', start: 20, end: 140, attributes: { 'db.system': 'postgresql' } },
  { id: 'd', parentId: 'a', name: 'payment.authorize', service: 'payments', start: 160, end: 390, status: 'error' },
  { id: 'e', parentId: 'd', name: 'POST /charges', service: 'payments', kind: 'client', start: 170, end: 380, status: 'error', attributes: { 'peer.service': 'acquirer' } },
  { id: 'f', parentId: 'a', name: 'publish order', service: 'events', kind: 'producer', start: 391, end: 399 },
];

const byId = (graph: ServiceGraph) => new Map(graph.nodes.map((node) => [node.id, node]));

describe('serviceGraph', () => {
  it('makes a node per service from the spans that entered it', () => {
    const graph = serviceGraph(spans);
    expect(graph.nodes.map((node) => node.id)).toEqual(['acquirer', 'cart', 'events', 'payments', 'postgres', 'web']);
    const nodes = byId(graph);
    // `b2` is a child inside the same service: not a request.
    expect(nodes.get('cart')).toMatchObject({ requests: 1, errors: 0, avgDuration: 140, p95Duration: 140, kind: 'service' });
    expect(nodes.get('payments')).toMatchObject({ requests: 1, errors: 1, avgDuration: 230 });
    expect(nodes.get('web')).toMatchObject({ requests: 1, kind: 'service' });
  });

  it('infers database, queue and external kinds', () => {
    const nodes = byId(serviceGraph(spans));
    expect(nodes.get('postgres')!.kind).toBe('database');
    expect(nodes.get('events')!.kind).toBe('queue');
    expect(nodes.get('acquirer')).toMatchObject({ kind: 'external', requests: 1, errors: 1, avgDuration: 210 });
  });

  it('makes an edge per service crossing, counting the child spans', () => {
    const graph = serviceGraph(spans);
    expect(graph.edges.map((edge) => `${edge.from}>${edge.to}`)).toEqual(['cart>postgres', 'payments>acquirer', 'web>cart', 'web>events', 'web>payments']);
    expect(graph.edges.find((edge) => edge.to === 'payments')).toEqual({ from: 'web', to: 'payments', calls: 1, errors: 1, avgDuration: 230 });
  });

  it('accumulates across traces, whose span ids may repeat', () => {
    const second: TraceSpanInput[] = [
      { id: 'a', name: 'GET /checkout', service: 'web', start: 1000, end: 1100 },
      { id: 'b', parentId: 'a', name: 'cart.load', service: 'cart', start: 1010, end: 1070, status: 'error' },
    ];
    const graph = serviceGraph([spans, second]);
    const edge = graph.edges.find((item) => item.from === 'web' && item.to === 'cart')!;
    expect(edge).toMatchObject({ calls: 2, errors: 1, avgDuration: 100 });
    expect(byId(graph).get('web')).toMatchObject({ requests: 2, avgDuration: 250, p95Duration: 400 });
  });

  it('does not invent an external node for a peer that has spans of its own', () => {
    const graph = serviceGraph([
      { id: 'x', name: 'call', service: 'web', kind: 'client', start: 0, end: 5, attributes: { 'peer.service': 'cart' } },
      { id: 'y', parentId: 'x', name: 'serve', service: 'cart', start: 1, end: 4 },
    ]);
    expect(graph.edges).toHaveLength(1);
    expect(byId(graph).get('cart')!.kind).toBe('service');
  });

  it('is empty for no spans and names a service-less span unknown', () => {
    expect(serviceGraph([])).toEqual({ nodes: [], edges: [] });
    expect(serviceGraph([{ id: 'a', name: 'x', start: 0 }]).nodes).toEqual([{ id: 'unknown', requests: 1, errors: 0, avgDuration: 0, kind: 'service' }]);
  });
});

const node = (id: string) => ({ id, requests: 1, errors: 0, avgDuration: 1 });
const edge = (from: string, to: string) => ({ from, to, calls: 1, errors: 0, avgDuration: 1 });

describe('layoutServiceGraph', () => {
  it('layers by longest path from the roots', () => {
    const layout = layoutServiceGraph({ nodes: ['a', 'b', 'c', 'd'].map(node), edges: [edge('a', 'b'), edge('b', 'c'), edge('a', 'c'), edge('a', 'd')] });
    const layer = Object.fromEntries(layout.nodes.map((item) => [item.id, item.layer]));
    expect(layer).toEqual({ a: 0, b: 1, d: 1, c: 2 });
    expect(layout.layers).toBe(3);
    expect(layout.width).toBe(3 * 168 + 2 * 72);
    expect(layout.height).toBe(2 * 64 + 24);
  });

  it('breaks cycles and marks the closing edge as a back edge', () => {
    const layout = layoutServiceGraph({ nodes: ['a', 'b', 'c'].map(node), edges: [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')] });
    // No root: the search starts at `a`, so `c → a` closes the cycle.
    expect(layout.nodes.map((item) => [item.id, item.layer])).toEqual([['a', 0], ['b', 1], ['c', 2]]);
    expect(layout.edges.filter((item) => item.back).map((item) => `${item.from}>${item.to}`)).toEqual(['c>a']);
    expect(serviceEdgePath(layout.edges.find((item) => item.back)!)).toMatch(/^M /);
  });

  it('reorders a layer by barycentre to uncross edges', () => {
    // Name order would put x above y while their parents sit b above a.
    const graph = { nodes: ['root', 'a', 'b', 'x', 'y'].map(node), edges: [edge('root', 'a'), edge('root', 'b'), edge('a', 'y'), edge('b', 'x')] };
    const layout = layoutServiceGraph(graph);
    const order = (layer: number) => layout.nodes.filter((item) => item.layer === layer).map((item) => item.id);
    const a = order(1).indexOf('a');
    const b = order(1).indexOf('b');
    expect(order(2).indexOf('y') < order(2).indexOf('x')).toBe(a < b);
    expect(order(2)).toEqual(['y', 'x']);
  });

  it('is deterministic and places edges on the box sides', () => {
    const graph = serviceGraph(spans);
    const first = layoutServiceGraph(graph, { nodeWidth: 100, nodeHeight: 40, columnGap: 50, rowGap: 10 });
    expect(layoutServiceGraph(graph, { nodeWidth: 100, nodeHeight: 40, columnGap: 50, rowGap: 10 })).toEqual(first);
    const web = first.nodes.find((item) => item.id === 'web')!;
    const toCart = first.edges.find((item) => item.from === 'web' && item.to === 'cart')!;
    expect(toCart.source).toEqual({ x: web.x + 100, y: web.y + 20 });
    expect(serviceEdgeMidpoint(toCart)).toEqual({ x: (toCart.source.x + toCart.target.x) / 2, y: (toCart.source.y + toCart.target.y) / 2 });
  });

  it('handles an empty graph and ignores self-calls and unknown ends', () => {
    expect(layoutServiceGraph({ nodes: [], edges: [] })).toMatchObject({ nodes: [], edges: [], width: 0, height: 0, layers: 0 });
    const layout = layoutServiceGraph({ nodes: [node('a')], edges: [edge('a', 'a'), edge('a', 'ghost')] });
    expect(layout.edges).toEqual([]);
  });
});

describe('formatting', () => {
  it('shortens counts and rates', () => {
    expect(formatServiceCount(950)).toBe('950');
    expect(formatServiceCount(1234)).toBe('1.2k');
    expect(formatServiceCount(34_000)).toBe('34k');
    expect(formatServiceCount(1_500_000)).toBe('1.5M');
    expect(formatServiceErrorRate(0, 10)).toBe('0%');
    expect(formatServiceErrorRate(1, 250)).toBe('0.4%');
    expect(formatServiceErrorRate(24, 1200)).toBe('2%');
    expect(formatServiceErrorRate(1, 0)).toBe('0%');
  });
});
