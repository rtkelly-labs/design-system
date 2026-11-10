import { defineConfig } from 'vitest/config';

/**
 * Render benchmarks: `pnpm bench`, `src/bench/*.bench.tsx`.
 *
 * Not a gate and not part of `vitest.config.mts`: a timing on a shared runner
 * moves by tens of percent between identical runs, so it is evidence to read,
 * not a threshold to fail. CI runs it only on a PR labelled `experiment:bench`
 * (`.github/workflows/experiments.yml`) and uploads the JSON.
 *
 * jsdom, like the unit suite, so these measure React's and the component's
 * work — reconciliation, TanStack row models, visx scales — and not layout or
 * paint, which jsdom does not do. A number here is comparable with another
 * number from this file on the same machine, and with nothing else.
 *
 * No `setupFiles`: `src/test-setup.ts` restores globals after each *test*;
 * a bench mounts and unmounts its own tree inside each iteration.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    benchmark: {
      include: ['src/bench/**/*.bench.{ts,tsx}'],
      outputJson: process.env.BENCH_JSON || undefined,
    },
  },
});
