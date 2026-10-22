import type { TraceSpanInput } from '../../lib/trace';

/**
 * Sample data for `ObservabilityConsole`: six hours of a checkout service,
 * with one incident — a payment-broker outage from 13:20 to 13:38 UTC — that
 * every view tells the same story about. Latency spikes, 5xx rises, the
 * heatmap grows a second band, error logs carry the failing trace ids, the
 * alert fires, and the incident timeline records it.
 *
 * Deterministic: a fixed epoch and a seeded generator, so the static site
 * export, Storybook and a screenshot all draw the same page. Nothing here
 * reads the clock.
 */

/** The console's "now": 14:00 UTC on a fixed day. */
export const OBSERVABILITY_NOW = Date.UTC(2026, 9, 22, 14, 0);

const MINUTE = 60_000;
const HOURS = 6;
const START = OBSERVABILITY_NOW - HOURS * 60 * MINUTE;
const INCIDENT_FROM = Date.UTC(2026, 9, 22, 13, 20);
const INCIDENT_TO = Date.UTC(2026, 9, 22, 13, 38);

/** mulberry32: small, fast, and the same sequence on every machine. */
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A standard normal from two uniforms (Box–Muller). */
function normal(random: () => number): number {
  const u = Math.max(1e-12, random());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

const inIncident = (time: number) => time >= INCIDENT_FROM && time < INCIDENT_TO;
/** 0 → 1 → 0 across the incident, so the spike ramps rather than steps. */
function severity(time: number): number {
  if (!inIncident(time)) return 0;
  const t = (time - INCIDENT_FROM) / (INCIDENT_TO - INCIDENT_FROM);
  return Math.sin(Math.PI * Math.min(1, t * 1.4));
}
/** A gentle daily swell in traffic. */
const traffic = (time: number) => 1 + 0.25 * Math.sin(((time - START) / (HOURS * 60 * MINUTE)) * Math.PI * 1.3);

function round(value: number, places = 1) {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

export interface ObservabilitySample {
  time: number;
  value: number;
}

function buildMinuteSeries() {
  const random = seeded(7);
  const minutes = HOURS * 60;
  const p50: Array<[number, number]> = [];
  const p95: Array<[number, number]> = [];
  const p99: Array<[number, number]> = [];
  const ok: Array<[number, number]> = [];
  const clientErr: Array<[number, number]> = [];
  const serverErr: Array<[number, number]> = [];
  const samples: ObservabilitySample[] = [];
  for (let m = 0; m <= minutes; m += 1) {
    const time = START + m * MINUTE;
    const s = severity(time);
    const base = 82 + 6 * normal(random);
    p50.push([time, round(base + 40 * s)]);
    p95.push([time, round(base * 2.4 + 18 * normal(random) + 520 * s)]);
    p99.push([time, round(base * 3.6 + 30 * Math.abs(normal(random)) + 1900 * s)]);
    const rps = 420 * traffic(time) + 18 * normal(random);
    const errRate = 0.004 + 0.002 * random() + 0.11 * s;
    ok.push([time, round(rps * (1 - errRate - 0.012))]);
    clientErr.push([time, round(rps * 0.012)]);
    serverErr.push([time, round(rps * errRate)]);
    // Latency samples for the heatmap: a log-normal body, plus a slow band of
    // broker timeouts during the incident.
    for (let i = 0; i < 24; i += 1) {
      const slow = random() < 0.35 * s;
      const value = slow ? 2400 * Math.exp(0.25 * normal(random)) : 85 * Math.exp(0.55 * normal(random));
      samples.push({ time: time + Math.floor(random() * MINUTE), value: round(value, 0) });
    }
  }
  return { p50, p95, p99, ok, clientErr, serverErr, samples };
}

const minute = buildMinuteSeries();

/** Latency percentiles, one point a minute, in milliseconds. */
export const LATENCY_SERIES = [
  { id: 'p50', label: 'p50', unit: 'ms', points: minute.p50 },
  { id: 'p95', label: 'p95', unit: 'ms', points: minute.p95 },
  { id: 'p99', label: 'p99', unit: 'ms', points: minute.p99 },
];

/** Requests per second by status class, for a stacked chart. */
export const THROUGHPUT_SERIES = [
  { id: '2xx', label: '2xx', unit: 'req/s', points: minute.ok },
  { id: '4xx', label: '4xx', unit: 'req/s', points: minute.clientErr },
  { id: '5xx', label: '5xx', unit: 'req/s', points: minute.serverErr },
];

/** Individual request latencies, for the heatmap and histogram. */
export const LATENCY_SAMPLES: readonly ObservabilitySample[] = minute.samples;

/** The headline numbers over the last hour. */
export const OBSERVABILITY_STATS = (() => {
  const lastHour = (points: Array<[number, number]>) => points.filter(([time]) => time > OBSERVABILITY_NOW - 60 * MINUTE).map(([, value]) => value);
  const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
  const p99 = lastHour(minute.p99);
  const ok = mean(lastHour(minute.ok));
  const c = mean(lastHour(minute.clientErr));
  const s = mean(lastHour(minute.serverErr));
  return {
    p99: Math.round(Math.max(...p99)),
    errorRate: round(((s) / (ok + c + s)) * 100, 2),
    rps: Math.round(ok + c + s),
    trend: lastHour(minute.p99).filter((_, index) => index % 4 === 0),
  };
})();

// ---------------------------------------------------------------------------
// Traces
// ---------------------------------------------------------------------------

const hex = (random: () => number, length: number) => Array.from({ length }, () => Math.floor(random() * 16).toString(16)).join('');

export interface ObservabilityTrace {
  traceId: string;
  start: number;
  failed: boolean;
  spans: TraceSpanInput[];
}

/** One checkout request as spans. A failing one times out at the payment broker. */
function checkoutTrace(random: () => number, start: number, failed: boolean): ObservabilityTrace {
  const traceId = hex(random, 32);
  const id = () => hex(random, 16);
  const jitter = (ms: number) => Math.max(1, Math.round(ms * Math.exp(0.3 * normal(random))));
  const root = id();
  const spans: TraceSpanInput[] = [];
  let t = start;
  const auth = { id: id(), parentId: root, name: 'auth.verify', service: 'auth', kind: 'client', start: t + 2, end: 0 } as TraceSpanInput;
  auth.end = auth.start + jitter(14);
  spans.push(auth);
  t = auth.end!;
  const cart = { id: id(), parentId: root, name: 'cart.load', service: 'cart', kind: 'client', start: t + 1, end: 0 } as TraceSpanInput;
  const query = { id: id(), parentId: cart.id, name: 'SELECT cart_items', service: 'postgres', kind: 'client', start: cart.start + 3, end: 0, attributes: { 'db.system': 'postgresql', 'db.rows': 4 + Math.floor(random() * 9) } } as TraceSpanInput;
  query.end = query.start + jitter(22);
  const cache = { id: id(), parentId: cart.id, name: 'GET pricing', service: 'redis', kind: 'client', start: cart.start + 1, end: 0, attributes: { 'db.system': 'redis', 'cache.hit': random() > 0.2 } } as TraceSpanInput;
  cache.end = cache.start + jitter(2);
  cart.end = query.end! + 2;
  spans.push(cart, query, cache);
  t = cart.end!;
  const stock = { id: id(), parentId: root, name: 'inventory.reserve', service: 'inventory', kind: 'client', start: t + 1, end: 0 } as TraceSpanInput;
  stock.end = stock.start + jitter(18);
  spans.push(stock);
  t = stock.end!;
  const pay = { id: id(), parentId: root, name: 'payment.authorize', service: 'payments', kind: 'client', start: t + 1, end: 0, attributes: { 'payment.provider': 'acquirer' } } as TraceSpanInput;
  const charge = { id: id(), parentId: pay.id, name: 'POST /v1/charges', service: 'acquirer', kind: 'client', start: pay.start + 2, end: 0 } as TraceSpanInput;
  if (failed) {
    charge.end = charge.start + 2000;
    charge.status = 'error';
    charge.attributes = { 'http.status_code': 504, 'error.type': 'timeout' };
    pay.status = 'error';
  } else {
    charge.end = charge.start + jitter(48);
    charge.attributes = { 'http.status_code': 201 };
  }
  pay.end = charge.end! + 3;
  spans.push(pay, charge);
  t = pay.end!;
  const publish = { id: id(), parentId: root, name: 'publish order.created', service: 'events', kind: 'producer', start: t + 1, end: 0, attributes: { 'messaging.system': 'kafka' } } as TraceSpanInput;
  publish.end = publish.start + jitter(6);
  if (!failed) spans.push(publish);
  const end = (failed ? pay.end! : publish.end!) + 2;
  spans.unshift({
    id: root, name: 'POST /checkout', service: 'checkout-api', kind: 'server', start, end,
    status: failed ? 'error' : 'ok',
    attributes: { 'http.method': 'POST', 'http.route': '/checkout', 'http.status_code': failed ? 502 : 200 },
  });
  return { traceId, start, failed, spans: spans.map((span) => ({ ...span, attributes: { ...span.attributes, 'trace.id': traceId } })) };
}

function buildTraces(): ObservabilityTrace[] {
  const random = seeded(42);
  const traces: ObservabilityTrace[] = [];
  for (let m = 0; m < HOURS * 60; m += 3) {
    const time = START + m * MINUTE + Math.floor(random() * MINUTE);
    traces.push(checkoutTrace(random, time, inIncident(time) ? random() < 0.6 : random() < 0.01));
  }
  // Sampling is denser while the error rate is up, as tail-based samplers keep errors.
  for (let time = INCIDENT_FROM; time < INCIDENT_TO; time += 30_000) {
    const at = time + Math.floor(random() * 30_000);
    traces.push(checkoutTrace(random, at, random() < 0.25 + 0.6 * severity(at)));
  }
  return traces.sort((a, b) => a.start - b.start);
}

/** A checkout trace every three minutes, and every 30s during the incident, when most fail. */
export const OBSERVABILITY_TRACES: readonly ObservabilityTrace[] = buildTraces();

/** Every span of every sample trace, for a service map. */
export const OBSERVABILITY_SPANS: readonly TraceSpanInput[] = OBSERVABILITY_TRACES.flatMap((trace) => trace.spans);

// ---------------------------------------------------------------------------
// Logs
// ---------------------------------------------------------------------------

export interface ObservabilityLog {
  id: string;
  time: number;
  severity: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  service?: string;
  traceId?: string;
  spanId?: string;
  fields?: Record<string, string | number | boolean>;
}

function buildLogs(): ObservabilityLog[] {
  const random = seeded(99);
  const logs: ObservabilityLog[] = [];
  let n = 0;
  for (const trace of OBSERVABILITY_TRACES) {
    const root = trace.spans[0]!;
    const duration = (root.end ?? root.start) - root.start;
    logs.push({
      id: `log-${n++}`, time: root.start, severity: 'info', service: 'checkout-api', traceId: trace.traceId, spanId: root.id,
      message: `POST /checkout ${trace.failed ? 502 : 200} ${duration}ms`,
      fields: { 'http.route': '/checkout', 'http.status_code': trace.failed ? 502 : 200, duration_ms: duration },
    });
    if (trace.failed) {
      const charge = trace.spans.find((span) => span.name === 'POST /v1/charges')!;
      logs.push({
        id: `log-${n++}`, time: charge.end ?? charge.start, severity: 'error', service: 'payments', traceId: trace.traceId, spanId: charge.id,
        message: 'acquirer request timed out after 2000ms; authorisation abandoned',
        fields: { 'error.type': 'timeout', 'payment.provider': 'acquirer', retry: false },
      });
    }
    if (random() < 0.25) {
      logs.push({
        id: `log-${n++}`, time: root.start + 5, severity: 'debug', service: 'cart', traceId: trace.traceId,
        message: `cart loaded with ${2 + Math.floor(random() * 6)} items, pricing cache ${random() > 0.2 ? 'hit' : 'miss'}`,
      });
    }
  }
  // Background noise and the incident's own lines.
  for (let m = 0; m < HOURS * 60; m += 7) {
    const time = START + m * MINUTE + Math.floor(random() * MINUTE);
    logs.push({ id: `log-${n++}`, time, severity: 'info', service: 'inventory', message: `stock sync completed: ${120 + Math.floor(random() * 40)} SKUs updated` });
  }
  logs.push(
    { id: `log-${n++}`, time: INCIDENT_FROM + 40_000, severity: 'warn', service: 'payments', message: 'acquirer p99 above 1500ms for 2m; circuit breaker half-open', fields: { breaker: 'acquirer', state: 'half-open' } },
    { id: `log-${n++}`, time: INCIDENT_FROM + 9 * MINUTE, severity: 'warn', service: 'deploy', message: 'rollback started: payments v2.14.0 → v2.13.2', fields: { actor: 'r.kelly', change: 'CHG-2291' } },
    { id: `log-${n++}`, time: INCIDENT_TO - 2 * MINUTE, severity: 'info', service: 'payments', message: 'acquirer latency recovered; circuit breaker closed', fields: { breaker: 'acquirer', state: 'closed' } },
  );
  return logs.sort((a, b) => a.time - b.time || a.id.localeCompare(b.id));
}

/** Log lines that point back at the sample traces by id. */
export const OBSERVABILITY_LOGS: readonly ObservabilityLog[] = buildLogs();

// ---------------------------------------------------------------------------
// Alerts and the incident
// ---------------------------------------------------------------------------

export const OBSERVABILITY_ALERTS = [
  { id: 'a1', name: 'Checkout error rate > 2%', state: 'resolved' as const, severity: 'critical' as const, since: INCIDENT_TO + 3 * MINUTE, service: 'checkout-api', summary: '5xx rate on POST /checkout', value: '0.6%', threshold: '2%', trend: OBSERVABILITY_STATS.trend.slice(-10) },
  { id: 'a2', name: 'Acquirer p99 > 1.5s', state: 'resolved' as const, severity: 'warning' as const, since: INCIDENT_TO, service: 'payments', summary: 'Upstream latency on POST /v1/charges', value: '212ms', threshold: '1.5s' },
  { id: 'a3', name: 'Inventory sync lag > 10m', state: 'firing' as const, severity: 'warning' as const, since: OBSERVABILITY_NOW - 14 * MINUTE, service: 'inventory', summary: 'Stock sync behind the warehouse feed', value: '14m', threshold: '10m', trend: [3, 4, 6, 7, 9, 11, 12, 14] },
  { id: 'a4', name: 'Postgres connection pool > 80%', state: 'pending' as const, severity: 'info' as const, since: OBSERVABILITY_NOW - 3 * MINUTE, service: 'postgres', summary: 'checkout pool at 83% of 50', value: '83%', threshold: '80%' },
  { id: 'a5', name: 'Kafka consumer lag', state: 'silenced' as const, severity: 'info' as const, since: OBSERVABILITY_NOW - 2 * 60 * MINUTE, service: 'events', summary: 'Silenced during broker maintenance', value: '1.2k', threshold: '1k' },
];

export const OBSERVABILITY_INCIDENT = {
  title: 'INC-482 · Checkout payments failing',
  severity: 'critical' as const,
  events: [
    { id: 'e1', time: INCIDENT_FROM + 60_000, kind: 'alert' as const, title: 'Checkout error rate > 2% fired', detail: '5xx at 7.8% on POST /checkout', author: 'alertmanager' },
    { id: 'e2', time: INCIDENT_FROM + 3 * MINUTE, kind: 'acknowledged' as const, title: 'Acknowledged by on-call', author: 'r.kelly' },
    { id: 'e3', time: INCIDENT_FROM + 6 * MINUTE, kind: 'update' as const, title: 'Acquirer timeouts after payments v2.14.0', detail: 'Errors start 4 minutes after the deploy; traces show POST /v1/charges at 2s.', author: 'r.kelly' },
    { id: 'e4', time: INCIDENT_FROM + 9 * MINUTE, kind: 'deploy' as const, title: 'Rollback: payments v2.14.0 → v2.13.2', author: 'deploy-bot' },
    { id: 'e5', time: INCIDENT_TO - 2 * MINUTE, kind: 'mitigated' as const, title: 'Error rate back under 1%', author: 'alertmanager' },
    { id: 'e6', time: INCIDENT_TO + 3 * MINUTE, kind: 'resolved' as const, title: 'Resolved; postmortem scheduled', author: 'r.kelly' },
  ],
};

/** Where the sample's own window should open: the incident, with context either side. */
export const INCIDENT_WINDOW = { from: INCIDENT_FROM - 25 * MINUTE, to: INCIDENT_TO + 15 * MINUTE };

/** Filter suggestions for the log filter bar. */
export const OBSERVABILITY_FILTER_FIELDS = [
  { key: 'service', values: ['checkout-api', 'payments', 'cart', 'inventory', 'deploy'] },
  { key: 'severity', values: ['debug', 'info', 'warn', 'error'] },
  { key: 'traceId' },
];
