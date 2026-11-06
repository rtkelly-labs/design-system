import { defineConfig, devices } from '@playwright/test';

/**
 * Config for the screenshot walkthrough (`tests/walkthrough.spec.ts`).
 *
 * Separate from `playwright.config.ts` on purpose. That one is a pass/fail gate
 * with pixel baselines and CI retries; this one asserts nothing and just
 * produces a reviewable artifact. Sharing a config would mean either the
 * walkthrough inherits snapshot machinery it has no use for, or the visual
 * suite loosens to accommodate it.
 *
 * The report goes to `walkthrough-report/` rather than the default
 * `playwright-report/`, which the visual suite already claims in `ci.yml`.
 *
 * Unlike the visual suite this is not pinned to Linux — screenshots are for
 * human review, so platform font differences are cosmetic rather than a
 * correctness problem.
 */
export default defineConfig({
  testDir: './tests',
  testMatch: /walkthrough\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Nothing is asserted, so a retry cannot turn a failure into a pass — it can
  // only paper over a flaky page load, which is exactly what we want here.
  retries: process.env.CI ? 1 : 0,
  // Six on CI, measured. This is the longest step of any workflow in the repo
  // and the one that grows with the system: one test per story, four captures
  // each, so 102 stories is 408 screenshots and every new component adds four.
  //
  // Playwright's default is half the cores — two on a standard runner — which
  // left it taking two minutes at about 40% CPU. It is wait-bound (page load,
  // `document.fonts.ready`, the 300ms settle per capture), so it scales well
  // past the core count:
  //
  // | workers | wall clock |
  // |---|---|
  // | 2 (default) | 120s |
  // | 4 | 67s |
  // | 6 | 54s |
  // | 8 | 52s |
  //
  // Six is the knee. Contention is a non-issue here in a way it is not for
  // `playwright.config.ts`: this suite asserts nothing, so a screenshot taken on
  // a busier machine is still a screenshot of the same rendering, and the
  // per-test timeout above is already 120s with `test.slow()` on top.
  //
  // If the story count doubles again, the next lever is sharding across runners
  // with `--shard` and `merge-reports` — worth roughly another 30s at the cost
  // of a merge job, which is why it is not here yet.
  workers: process.env.CI ? 6 : undefined,
  reporter: [
    ['html', { outputFolder: 'walkthrough-report', open: 'never' }],
    ['list'],
  ],
  outputDir: 'walkthrough-results',
  // Three themes captured per test, each with a reload and a render check.
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:6006',
    viewport: { width: 1440, height: 900 },
    // Fixed DPR keeps the report's size predictable across machines.
    deviceScaleFactor: 1,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    // `--config` is load-bearing: serve rewrites /iframe.html to /iframe by
    // default and drops the query string, so Storybook gets no story id. The
    // path is relative to the served directory, not the repo root.
    command: 'npx serve storybook-static -p 6006 --config ../serve.json',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
