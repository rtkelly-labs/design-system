/**
 * Fake data, deterministic by construction.
 *
 * A seeded PRNG and a fixed epoch, so the server render, the client hydration,
 * every rebuild and every screenshot see the same rows. No `Math.random`, no
 * `Date.now`, and no locale-dependent formatting — `toLocaleString` differs
 * between a build machine and a reader's browser, which is a hydration
 * mismatch waiting for the first reader in another timezone.
 *
 * The domain is a deploy dashboard for a small platform team: plausible enough
 * that a table of it reads as a real table rather than as lorem ipsum.
 */

/** mulberry32 — small, fast, and good enough for fixtures. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)] as T,
    hex: (length: number) =>
      Array.from({ length }, () => Math.floor(next() * 16).toString(16)).join(''),
  };
}

/** Monday 14 September 2026, 08:00 UTC. Everything is an offset from here. */
export const EPOCH = Date.UTC(2026, 8, 14, 8, 0, 0);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

/** `14 Sep 09:42` — UTC, by hand, so it cannot vary by locale or zone. */
export function formatStamp(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** `4m 07s`. */
export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}m ${pad(seconds % 60)}s`;
}

export const SERVICES = [
  'edge-router',
  'billing-api',
  'auth-gateway',
  'search-indexer',
  'media-transcoder',
  'ledger-sync',
  'notify-worker',
  'docs-site',
] as const;

export const REGIONS = ['lhr1', 'fra1', 'iad1', 'sfo1', 'hnd1', 'syd1', 'gru1'] as const;

const AUTHORS = ['akovacs', 'mbello', 'tnakamura', 'jfischer', 'oadeyemi', 'lpereira', 'swu', 'dmoreau'];
const BRANCHES = ['main', 'main', 'main', 'release/2026.38', 'fix/cold-start', 'feat/usage-caps'];

export type DeployStatus = 'LIVE' | 'FAILED' | 'ROLLED BACK' | 'BUILDING';

export interface Deployment {
  id: string;
  service: (typeof SERVICES)[number];
  region: (typeof REGIONS)[number];
  environment: 'production' | 'preview';
  branch: string;
  commit: string;
  author: string;
  status: DeployStatus;
  /** Seconds. */
  duration: number;
  /** Epoch milliseconds. */
  startedAt: number;
}

function buildDeployments(count: number): Deployment[] {
  const rng = seeded(0x5eed);
  const rows: Deployment[] = [];
  let at = EPOCH;
  for (let i = 0; i < count; i++) {
    at += rng.int(6, 95) * 60_000;
    const roll = rng.next();
    const status: DeployStatus =
      i === count - 1 ? 'BUILDING' : roll < 0.78 ? 'LIVE' : roll < 0.92 ? 'FAILED' : 'ROLLED BACK';
    const branch = rng.pick(BRANCHES);
    rows.push({
      id: `dpl_${rng.hex(8)}`,
      service: rng.pick(SERVICES),
      region: rng.pick(REGIONS),
      environment: branch === 'main' || branch.startsWith('release/') ? 'production' : 'preview',
      branch,
      commit: rng.hex(7),
      author: rng.pick(AUTHORS),
      status,
      duration: status === 'BUILDING' ? 0 : rng.int(38, 540),
      startedAt: at,
    });
  }
  // Newest first, the way a deploy log reads.
  return rows.reverse();
}

export const DEPLOYMENTS: readonly Deployment[] = buildDeployments(64);

/** p95 latency in ms per region for the last 7 days — the BarChart's data. */
export const REGION_LATENCY: readonly { label: string; value: number }[] = (() => {
  const rng = seeded(0x1a7e);
  return REGIONS.map((region) => ({ label: region.toUpperCase(), value: rng.int(38, 220) }));
})();

/** Requests (thousands) per region, per window, for the tabbed chart. */
export const REGION_TRAFFIC: Record<'24h' | '7d' | '30d', readonly { label: string; value: number }[]> =
  (() => {
    const rng = seeded(0x7a5f);
    const scale = { '24h': 1, '7d': 6.4, '30d': 27 } as const;
    const base = REGIONS.map(() => rng.int(40, 180));
    const out = {} as Record<'24h' | '7d' | '30d', { label: string; value: number }[]>;
    for (const window of Object.keys(scale) as (keyof typeof scale)[]) {
      out[window] = REGIONS.map((region, i) => ({
        label: region.toUpperCase(),
        value: Math.round((base[i] as number) * scale[window] * (0.85 + rng.next() * 0.3)),
      }));
    }
    return out;
  })();

/** Hourly error rate (per mille) for the last 24 hours — a Sparkline. */
export const ERROR_RATE_24H: readonly number[] = (() => {
  const rng = seeded(0xe44);
  return Array.from({ length: 24 }, (_, h) => Math.round((2 + Math.sin(h / 3) * 1.4 + rng.next()) * 10) / 10);
})();

/** Deploys per day for the last 14 days — a Sparkline. */
export const DEPLOYS_14D: readonly number[] = (() => {
  const rng = seeded(0xd14);
  return Array.from({ length: 14 }, (_, d) => (d % 7 >= 5 ? rng.int(1, 4) : rng.int(8, 21)));
})();

/** Headline figures derived from the rows above, so the cards and the table agree. */
export const SUMMARY = (() => {
  const finished = DEPLOYMENTS.filter((d) => d.status !== 'BUILDING');
  const live = finished.filter((d) => d.status === 'LIVE').length;
  const median = [...finished].map((d) => d.duration).sort((a, b) => a - b)[Math.floor(finished.length / 2)] ?? 0;
  return {
    deploys: DEPLOYMENTS.length,
    successRate: `${((live / finished.length) * 100).toFixed(1)}%`,
    medianDuration: formatDuration(median),
    failed: finished.length - live,
  };
})();
