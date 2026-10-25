import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServiceMap } from '../components/ServiceMap';
import type { ServiceGraph } from '../lib/serviceGraph';
import type { TraceSpanInput } from '../lib/trace';
import { checkoutTrace } from './traceFixtures';

/**
 * `count` checkout requests, each a separate trace of nine spans. Every eighth
 * charge fails at the card network and is retried successfully, so one edge
 * carries errors and the payment service itself stays healthy. Deterministic:
 * timings vary by request index, never by chance or clock.
 */
function checkoutTraces(count: number): TraceSpanInput[][] {
  return Array.from({ length: count }, (_, i): TraceSpanInput[] => {
    const jitter = (i % 5) * 12;
    const failed = i % 8 === 0;
    return [
      { id: 'root', name: 'GET /checkout', service: 'storefront', kind: 'server', start: 0, end: 420 + jitter },
      { id: 'auth', parentId: 'root', name: 'auth.verify', service: 'auth', kind: 'server', start: 4, end: 30 + (i % 3) * 4 },
      { id: 'co', parentId: 'root', name: 'POST /checkout', service: 'checkout', kind: 'server', start: 34, end: 400 + jitter },
      { id: 'cart', parentId: 'co', name: 'cart.load', service: 'cart', kind: 'server', start: 40, end: 150 + jitter },
      { id: 'sql', parentId: 'cart', name: 'SELECT cart_items', service: 'postgres', kind: 'client', start: 48, end: 130 + jitter, attributes: { 'db.system': 'postgresql' } },
      { id: 'pay', parentId: 'co', name: 'payment.authorize', service: 'payments', kind: 'server', start: 156, end: 330 + jitter },
      { id: 'charge', parentId: 'pay', name: 'POST /v1/charges', service: 'payments', kind: 'client', start: 160, end: 300 + jitter, status: failed ? 'error' : 'ok', attributes: { 'peer.service': 'card-network' } },
      { id: 'pub', parentId: 'co', name: 'publish order.created', service: 'orders', kind: 'producer', start: 334, end: 346, attributes: { 'messaging.system': 'kafka' } },
      { id: 'ful', parentId: 'pub', name: 'fulfil order', service: 'fulfilment', kind: 'server', start: 350, end: 390 + jitter },
    ];
  });
}

const checkoutSpans = checkoutTraces(40);

/** Fourteen services in five layers, with a cycle (`search` ↔ `catalog`) and a hot path. */
const wideGraph: ServiceGraph = {
  nodes: [
    { id: 'edge-proxy', requests: 48_200, errors: 96, avgDuration: 210, p95Duration: 640 },
    { id: 'web-bff', requests: 31_000, errors: 62, avgDuration: 180, p95Duration: 520 },
    { id: 'mobile-bff', requests: 17_100, errors: 51, avgDuration: 160, p95Duration: 480 },
    { id: 'identity', requests: 48_000, errors: 12, avgDuration: 14, p95Duration: 40 },
    { id: 'catalog', requests: 22_400, errors: 22, avgDuration: 46, p95Duration: 130 },
    { id: 'search', requests: 9_800, errors: 880, avgDuration: 120, p95Duration: 900 },
    { id: 'pricing', requests: 22_400, errors: 0, avgDuration: 9, p95Duration: 22 },
    { id: 'orders', requests: 4_100, errors: 41, avgDuration: 95, p95Duration: 260 },
    { id: 'payments', requests: 3_900, errors: 39, avgDuration: 240, p95Duration: 700 },
    { id: 'postgres', requests: 30_500, errors: 3, avgDuration: 6, p95Duration: 18, kind: 'database' },
    { id: 'redis', requests: 52_000, errors: 0, avgDuration: 1, p95Duration: 3, kind: 'database' },
    { id: 'events', requests: 4_100, errors: 0, avgDuration: 4, p95Duration: 9, kind: 'queue' },
    { id: 'notifications', requests: 4_100, errors: 12, avgDuration: 70, p95Duration: 210 },
    { id: 'card-network', requests: 3_900, errors: 310, avgDuration: 180, p95Duration: 620, kind: 'external' },
  ],
  edges: [
    { from: 'edge-proxy', to: 'web-bff', calls: 31_000, errors: 62, avgDuration: 180 },
    { from: 'edge-proxy', to: 'mobile-bff', calls: 17_100, errors: 51, avgDuration: 160 },
    { from: 'edge-proxy', to: 'identity', calls: 48_000, errors: 12, avgDuration: 14 },
    { from: 'web-bff', to: 'catalog', calls: 14_000, errors: 0, avgDuration: 46 },
    { from: 'mobile-bff', to: 'catalog', calls: 8_400, errors: 0, avgDuration: 44 },
    { from: 'web-bff', to: 'search', calls: 6_200, errors: 540, avgDuration: 120 },
    { from: 'mobile-bff', to: 'search', calls: 3_600, errors: 340, avgDuration: 118 },
    { from: 'web-bff', to: 'orders', calls: 4_100, errors: 41, avgDuration: 95 },
    { from: 'catalog', to: 'pricing', calls: 22_400, errors: 0, avgDuration: 9 },
    { from: 'catalog', to: 'postgres', calls: 22_400, errors: 0, avgDuration: 6 },
    { from: 'catalog', to: 'search', calls: 900, errors: 0, avgDuration: 30 },
    { from: 'search', to: 'catalog', calls: 1_200, errors: 0, avgDuration: 40 },
    { from: 'pricing', to: 'redis', calls: 22_400, errors: 0, avgDuration: 1 },
    { from: 'identity', to: 'redis', calls: 29_600, errors: 0, avgDuration: 1 },
    { from: 'orders', to: 'postgres', calls: 8_100, errors: 3, avgDuration: 7 },
    { from: 'orders', to: 'payments', calls: 3_900, errors: 39, avgDuration: 240 },
    { from: 'orders', to: 'events', calls: 4_100, errors: 0, avgDuration: 4 },
    { from: 'payments', to: 'card-network', calls: 3_900, errors: 310, avgDuration: 180 },
    { from: 'events', to: 'notifications', calls: 4_100, errors: 12, avgDuration: 70 },
  ],
};

const meta: Meta<typeof ServiceMap> = {
  title: 'Components/Data/ServiceMap',
  component: ServiceMap,
  tags: ['autodocs', 'preview'],
  parameters: {
    docs: {
      description: {
        component:
          'A service dependency map folded from trace spans: one box per service, one arrow per caller → callee pair, laid out in layers from the services nothing calls. A service over `errorThreshold` is outlined and badged in the danger role, and an edge that carried errors is drawn in it. Select a box — click, or Enter on a focused one — to dim everything outside its neighbourhood and open its details. Arrows move between boxes spatially; Escape clears.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof ServiceMap>;

/** Forty checkout requests across nine services, one edge failing. The visual baseline. */
export const Checkout: Story = {
  args: { spans: checkoutSpans },
  parameters: { docs: { description: { story: 'Forty traces of the same checkout: a Postgres database, a Kafka queue, and a card network that only appears as a `peer.service` — so it is drawn as external. Every eighth charge fails at the card network, so that one edge is drawn in the danger role and the card network is badged.' } } },
};

/** The single failing trace from the waterfall stories, as a map. */
export const FromTraceFixtures: Story = {
  args: { spans: checkoutTrace },
  parameters: { docs: { description: { story: 'The same `checkoutTrace` the waterfall draws, folded into services. With one request per service, the storefront and payments — whose one request failed — are both over the threshold.' } } },
};

/** A selected service: its neighbourhood stays lit and its details open. */
export const Selected: Story = {
  args: { spans: checkoutSpans, defaultSelectedId: 'checkout' },
  parameters: { docs: { description: { story: '`defaultSelectedId="checkout"`: the services it calls and the one that calls it stay at full strength, their edge labels show, and the panel lists inbound and outbound calls as buttons to the neighbour.' } } },
};

/** Fourteen services, a cycle, and five layers. */
export const Wide: Story = {
  args: { graph: wideGraph, title: 'Production service map' },
  parameters: { docs: { description: { story: 'A hand-written graph of fourteen services. `search ↔ catalog` is a cycle; the edge that closes it loops underneath, dashed. Labels show where they fit and on hover or focus otherwise.' } } },
};

/** Labels on every edge, whether or not they fit. */
export const AllEdgeLabels: Story = {
  args: { spans: checkoutTrace, edgeLabels: 'always', errorThreshold: 0.5 },
  parameters: { docs: { description: { story: '`edgeLabels="always"` and a 50% threshold: every edge carries its calls and error rate.' } } },
};

/** Nothing to draw. */
export const Empty: Story = {
  args: { spans: [] },
  parameters: { docs: { description: { story: 'No spans, so no services: the map says so in words.' } } },
};
