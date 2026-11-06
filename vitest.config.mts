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
    include: ['src/**/*.test.{ts,tsx}'],
    // Testing Library only registers its own `afterEach(cleanup)` under
    // `globals: true`, which this project does not use. See src/test-setup.ts.
    setupFiles: ['src/test-setup.ts'],
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
    },
  },
});
