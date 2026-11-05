import { defineConfig } from 'vitest/config';
import base from './vitest.config.mts';

/**
 * The unit suite's config, minus what Stryker cannot use.
 *
 * `CI` is set on every Actions runner, so the base config would also write the
 * JSON telemetry report on each of the hundreds of runs Stryker makes, and
 * coverage thresholds would judge a run that only executes the related files.
 * Spread rather than `mergeConfig`, which concatenates arrays and would keep
 * the `json` reporter.
 *
 * `stryker-setup.ts` runs after the usual setup and pins the fast-check seed.
 */
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    reporters: ['default'],
    outputFile: undefined,
    coverage: { enabled: false },
    setupFiles: [base.test?.setupFiles ?? [], 'stryker-setup.ts'].flat(),
  },
});
