import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { LogViewer } from '../components/LogViewer';
import type { LogSeverity } from '../components/SeverityBadge';
import { TimeRangePicker, TimeRangeProvider } from '../components/TimeRange';
import type { LogEntry } from '../lib/logs';

/** The fixed clock every static story renders against. */
const NOW = Date.UTC(2026, 9, 22, 14, 0);

/** A seeded PRNG (mulberry32): the same lines on every render. */
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

const SERVICES = ['web', 'checkout', 'payments', 'cart', 'postgres', 'auth'] as const;
const TEMPLATES: Record<LogSeverity, readonly string[]> = {
  trace: ['enter handler {route}', 'span closed in {ms}ms'],
  debug: ['cache hit for {key}', 'pool size {n}', 'retrying with backoff {ms}ms'],
  info: ['GET {route} 200 in {ms}ms', 'session refreshed for user {n}', 'job {key} completed', 'connected to replica {n}'],
  warn: ['slow query took {ms}ms', 'retry {n}/3 for {route}', 'queue depth at {n}'],
  error: ['upstream timeout after {ms}ms on {route}', 'payment declined: card_error', 'connection reset by peer'],
  fatal: ['out of memory: killing worker {n}'],
};
const ROUTES = ['/checkout', '/cart', '/pay', '/login', '/api/orders'];

function pickSeverity(roll: number): LogSeverity {
  if (roll < 0.06) return 'trace';
  if (roll < 0.24) return 'debug';
  if (roll < 0.74) return 'info';
  if (roll < 0.88) return 'warn';
  if (roll < 0.985) return 'error';
  return 'fatal';
}

/** `count` lines ending at `end`, `step` ms apart on average, from `seed`. */
function makeLogs(count: number, end: number, step: number, seed = 7, prefix = 'l'): LogEntry[] {
  const random = seeded(seed);
  const hex = (length: number) => Array.from({ length }, () => Math.floor(random() * 16).toString(16)).join('');
  const lines: LogEntry[] = [];
  let time = end - count * step;
  for (let index = 0; index < count; index += 1) {
    time += Math.max(1, Math.round(step * (0.4 + random() * 1.2)));
    const severity = pickSeverity(random());
    const templates = TEMPLATES[severity];
    const route = ROUTES[Math.floor(random() * ROUTES.length)];
    const ms = Math.round(20 + random() * 4000);
    const n = Math.floor(random() * 64);
    const message = templates[Math.floor(random() * templates.length)]
      .replace('{route}', route)
      .replace('{ms}', String(ms))
      .replace('{n}', String(n))
      .replace('{key}', hex(6));
    const traced = severity === 'error' || severity === 'fatal' || random() < 0.3;
    lines.push({
      id: `${prefix}${index}`,
      time: Math.min(time, end),
      severity,
      message,
      service: SERVICES[Math.floor(random() * SERVICES.length)],
      ...(traced ? { traceId: hex(32), spanId: hex(16) } : {}),
      ...(random() < 0.5 ? { fields: { route, duration_ms: ms, region: random() < 0.5 ? 'eu-west-1' : 'us-east-1', cached: random() < 0.3 } } : {}),
    });
  }
  return lines;
}

const tail = makeLogs(40, NOW, 1500, 11);
const day = makeLogs(400, NOW, 216_000, 23);
const large = makeLogs(5000, NOW, 700, 42);

const meta: Meta<typeof LogViewer> = {
  title: 'Components/Data/LogViewer',
  component: LogViewer,
  tags: ['autodocs', 'preview'],
  parameters: {
    docs: {
      description: {
        component:
          'A log tail: one monospace line per entry — UTC timestamp to the millisecond, `SeverityBadge`, service, message — in time order, newest at the bottom. A line expands to its fields and trace/span ids, with "View trace" when `onTraceSelect` is given. Inside a `TimeRangeProvider` it shows only the shared window, hovering a line moves the shared cursor, and the line nearest a cursor set elsewhere is marked. One tab stop: arrows, Home/End and PageUp/PageDown move, Enter or Space toggles, Right/Left expand and collapse. Above 200 lines it is windowed.',
      },
    },
  },
  args: { onTraceSelect: () => {} },
};
export default meta;
type Story = StoryObj<typeof LogViewer>;

/** Forty lines of mixed severities at a fixed clock — the visual baseline. */
export const Tail: Story = {
  args: { entries: tail, defaultExpanded: [tail.find((entry) => entry.severity === 'error' && entry.fields)?.id ?? 'l0'] },
  parameters: { docs: { description: { story: 'A static, seeded tail ending at 14:00 UTC. One error line is expanded to show its fields, trace and span ids, and the "View trace" button.' } } },
};

function LiveTail() {
  const [entries, setEntries] = useState<LogEntry[]>(() => makeLogs(30, NOW, 400, 5, 'seed'));
  useEffect(() => {
    const random = seeded(99);
    let tick = 0;
    const timer = setInterval(() => {
      tick += 1;
      const [next] = makeLogs(1, NOW + tick * 400, 400, Math.floor(random() * 1e9), `live${tick}-`);
      setEntries((current) => [...current.slice(-500), next]);
    }, 400);
    return () => clearInterval(timer);
  }, []);
  return <LogViewer entries={entries} follow onTraceSelect={() => {}} />;
}

/** A line every 400ms with `follow`. Not snapshotted: it moves. */
export const Live: Story = {
  render: () => <LiveTail />,
  parameters: { docs: { description: { story: 'Tail mode: while you are at the bottom, new lines keep it there. Scroll up and a "Jump to latest (N new)" button counts what arrived since.' } } },
};

/** The shared window decides which lines show. */
export const WithinTimeRange: Story = {
  render: (args) => (
    <TimeRangeProvider now={NOW}>
      <div className="flex flex-col gap-3">
        <TimeRangePicker />
        <LogViewer {...args} entries={day} />
      </div>
    </TimeRangeProvider>
  ),
  parameters: { docs: { description: { story: 'A day of lines under a `TimeRangePicker`: pick 15m, 1h or 24h and the list follows. Hovering a line sets the shared cursor for any chart on the page.' } } },
};

/** `query` highlights; filtering stays the caller’s. */
export const Highlighted: Story = {
  args: { entries: tail, query: 'timeout' },
  parameters: { docs: { description: { story: 'Every case-insensitive match of `timeout` is marked in the message. The list is not filtered — use `filterLogEntries` for that.' } } },
};

/** Five thousand seeded lines, windowed. */
export const Large: Story = {
  args: { entries: large, height: 480 },
  parameters: { docs: { description: { story: '5,000 lines through `@tanstack/react-virtual` at a fixed 32px row: only the visible lines are in the DOM, and each states its true position.' } } },
};
