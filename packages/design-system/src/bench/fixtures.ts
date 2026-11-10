/**
 * Deterministic data and a jsdom layout stub for the render benchmarks
 * (`*.bench.tsx`, `pnpm bench`) and the render-count tests
 * (`src/render-counts.test.tsx`).
 *
 * Nothing here is random: a benchmark whose input changes between runs
 * measures the input, and a render count over random data is not a count.
 */
import type { BarChartDatum } from '../components/BarChart';
import type { LogEntry } from '../lib/logs';
import type { LogSeverity } from '../lib/severity';
import type { TimeSeries } from '../lib/timeSeries';

export interface BenchRow {
  id: string;
  host: string;
  region: string;
  latency: number;
  errors: number;
}

const REGIONS = ['us-east-1', 'eu-west-1', 'ap-south-1', 'sa-east-1'];

/** `n` rows whose sort order differs per column, so a sort moves rows. */
export function makeRows(n: number): BenchRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `row-${i}`,
    host: `host-${String((i * 7919) % n).padStart(5, '0')}`,
    region: REGIONS[i % REGIONS.length],
    latency: (i * 37) % 997,
    errors: (i * 13) % 101,
  }));
}

export function makeBars(n: number): BarChartDatum[] {
  return Array.from({ length: n }, (_, i) => ({ label: `B${i}`, value: ((i * 37) % 97) + 3 }));
}

const SEVERITIES: LogSeverity[] = ['info', 'info', 'info', 'debug', 'warn', 'error'];
export const LOG_EPOCH = Date.UTC(2026, 9, 22, 14, 0);

export function makeLogs(n: number): LogEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `l${i}`,
    time: LOG_EPOCH + i * 1000,
    severity: SEVERITIES[i % SEVERITIES.length],
    message: `GET /api/orders/${i} ${200 + (i % 3) * 100} in ${(i * 37) % 997}ms`,
    service: i % 2 ? 'api' : 'worker',
  }));
}

/** Three series of `n` samples a minute apart, ending at `LOG_EPOCH`. */
export function makeSeries(n: number): TimeSeries[] {
  return ['p50', 'p90', 'p99'].map((id, s) => ({
    id,
    label: id,
    unit: 'ms',
    points: Array.from({ length: n }, (_, i) => [LOG_EPOCH - (n - i) * 60_000, 20 + s * 40 + ((i * 37) % 50)] as const),
  }));
}

/**
 * jsdom has no layout: every box is 0×0 and a virtualizer windows nothing.
 * Give every element the height a component declares for its scroll box, as
 * the DataTable and LogViewer unit tests do. Returns the restore function.
 */
export function stubLayout(height = 480, width = 800): () => void {
  const proto = HTMLElement.prototype;
  const saved = {
    offsetHeight: Object.getOwnPropertyDescriptor(proto, 'offsetHeight'),
    offsetWidth: Object.getOwnPropertyDescriptor(proto, 'offsetWidth'),
  };
  Object.defineProperty(proto, 'offsetHeight', { configurable: true, get: () => height });
  Object.defineProperty(proto, 'offsetWidth', { configurable: true, get: () => width });
  return () => {
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(proto, key, descriptor);
    }
  };
}
