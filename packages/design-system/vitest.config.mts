import { defineConfig } from 'vitest/config';

/**
 * Unit tests live beside the code as `src/**\/*.test.ts(x)`.
 *
 * The Playwright suites in `tests/` are `*.spec.ts` and are matched there by
 * `testDir`, so the two runners never see each other's files. Keeping the
 * extensions distinct is what makes that true — a unit test named `.spec.ts`
 * would be collected by Playwright and fail without a browser.
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    /*
     * `scripts/**` is included for the release train, which had no test at
     * all and two deadlocks. Both reported success and exited 0 while doing
     * nothing — a CI script whose failure mode is silence is exactly the thing
     * worth asserting, and its logic is plain `.mjs`, so it costs no build
     * step to cover.
     */
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    // Testing Library only registers its own `afterEach(cleanup)` under
    // `globals: true`, which this project does not use. See src/test-setup.ts.
    setupFiles: ['src/test-setup.ts'],
    /*
     * One jsdom per worker, not one per file.
     *
     * Building a fresh jsdom and module graph for each of ~90 files was most of
     * the suite's time: `environment` summed 78–133s against 42–72s of tests.
     * Sharing them is only honest if no file can see what another left behind,
     * so this was switched off after `src/test-setup.ts` learnt to restore the
     * shared globals and `pnpm test:leaks` — shuffled file order, no isolation,
     * the seed printed so a failure replays — ran clean. It had failed seven
     * orderings in eight before. If a unit test fails here and passes alone,
     * that is a leak: run `pnpm test:leaks` and fix the hook, not the test.
     */
    isolate: false,
    // A JSON report on CI for `scripts/ci-telemetry.mjs` — which files are
    // slow to run. The default reporter stays, so the log reads as before.
    reporters: process.env.CI ? ['default', 'json'] : ['default'],
    outputFile: { json: 'telemetry/vitest.json' },
    coverage: {
      provider: 'v8',
      /*
       * Components are in scope, and were not.
       *
       * `include` was `['src/lib/**', 'src/hooks/**']`, so coverage reported a
       * healthy number for the two directories that were tested and said nothing
       * about the 32 of 43 components that had no test at all. A measurement
       * scoped to exclude the gap is worse than no measurement: it reads as
       * reassurance.
       */
      include: ['src/lib/**', 'src/hooks/**', 'src/components/**'],
      exclude: ['**/*.test.{ts,tsx}', 'src/components/**/*.stories.tsx'],
      reporter: ['text', 'lcov'],
      // Ratchet the measured surface from the first component-inclusive run.
      // These are floors, not an aspirational target: raise them when
      // behavioural tests grow, never lower them to make a regression green.
      thresholds: {
        statements: 70,
        branches: 58,
        functions: 65,
        lines: 71,
      },
    },
  },
});
