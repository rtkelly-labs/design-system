import type { TraceSpanInput } from '../lib/trace';

/** A checkout request fanning out across five services, one of them failing. */
export const checkoutTrace: TraceSpanInput[] = [
  { id: 'a1', name: 'GET /checkout', service: 'web', kind: 'server', start: 0, end: 412, attributes: { 'http.method': 'GET', 'http.route': '/checkout', 'http.status_code': 502 }, status: 'error' },
  { id: 'b1', parentId: 'a1', name: 'auth.verify', service: 'auth', kind: 'client', start: 4, end: 38, attributes: { 'auth.scheme': 'bearer' } },
  { id: 'c1', parentId: 'a1', name: 'cart.load', service: 'cart', start: 40, end: 160 },
  { id: 'c2', parentId: 'c1', name: 'SELECT cart_items', service: 'postgres', kind: 'client', start: 52, end: 141, attributes: { 'db.system': 'postgresql', 'db.rows': 12 } },
  { id: 'c3', parentId: 'c1', name: 'cache.get pricing', service: 'redis', kind: 'client', start: 44, end: 50, attributes: { 'cache.hit': true } },
  { id: 'd1', parentId: 'a1', name: 'inventory.reserve', service: 'inventory', start: 162, end: 214 },
  { id: 'e1', parentId: 'a1', name: 'payment.authorize', service: 'payments', kind: 'client', start: 216, end: 404, status: 'error', attributes: { 'payment.provider': 'acquirer', 'error.type': 'timeout' } },
  { id: 'e2', parentId: 'e1', name: 'POST /v1/charges', service: 'payments', kind: 'client', start: 220, end: 400, status: 'error', attributes: { 'http.status_code': 504 } },
  { id: 'e3', parentId: 'e1', name: 'fraud.score', service: 'risk', start: 222, end: 260 },
];

/** A deploy pipeline whose last two steps have not finished. Times are relative to `start`. */
export function deployTrace(start: number): TraceSpanInput[] {
  return [
    { id: 'p', name: 'deploy web@4f2a', service: 'ci', start },
    { id: 'p1', parentId: 'p', name: 'install', service: 'ci', start, end: start + 1800 },
    { id: 'p2', parentId: 'p', name: 'build', service: 'ci', start: start + 1800, end: start + 5200 },
    { id: 'p3', parentId: 'p', name: 'test', service: 'ci', start: start + 1800, end: start + 6100 },
    { id: 'p4', parentId: 'p', name: 'upload artefacts', service: 'storage', start: start + 6100 },
    { id: 'p5', parentId: 'p', name: 'smoke checks', service: 'edge', start: start + 6400 },
  ];
}
