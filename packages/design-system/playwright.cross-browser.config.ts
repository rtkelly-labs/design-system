import { defineConfig, devices } from '@playwright/test';

/**
 * Cross-browser behaviour: Firefox and WebKit, on a deliberately small subset.
 *
 * Separate from `playwright.config.ts` on purpose, as the walkthrough's is.
 * That config's projects are what `pnpm test:visual` / `test:a11y` /
 * `test:edges` run on every push and what `ci.yml` shards by count; a project
 * added there is paid for on every push and cut into every shard. This one runs
 * only when asked (`experiments.yml`, label `experiment:cross-browser`).
 *
 * ## What runs, and what does not
 *
 * - **`tests/a11y.spec.ts`, one Level, desktop viewport.** axe over every
 *   asserted story, the DataTable keyboard sort, the open Select and the
 *   keyboard-only account flows. The rules are DOM and ARIA, so they mostly
 *   agree across engines; what can differ is computed style (contrast as
 *   rendered, `:focus-visible`) and focus order, which is the point. `sketch`
 *   is left out: Level is a colour axis, and colour is the part Chromium
 *   already answers on both Levels. Stories that pin `sketch` themselves still
 *   run, because they skip only on a non-default Level.
 * - **`tests/overlays.spec.ts`**, keyboard focus through Base UI's dialogs,
 *   popovers, menus, select and tooltip — the behaviour most likely to differ
 *   in WebKit, and asserted nowhere in a real browser before this. It also
 *   runs in a `chromium` project here, as the reference: a test red in WebKit
 *   and green in Chromium is a finding, red in all three is a broken test.
 * - **No screenshots.** `visual.spec.ts` is not collected: Firefox and WebKit
 *   baselines would triple the snapshot set and every `/update-snapshots`, for
 *   pixels that are expected to differ between engines. `edges.spec.ts` is a
 *   DOM census, the same in every engine, so it is not collected either.
 *
 * Both browsers ship in the pinned Playwright image; nothing is installed.
 */
const ONE_LEVEL = / — sketch\b/;

export default defineConfig({
  testDir: './tests',
  testMatch: /(a11y|overlays)\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  // HTML for a person, JSON for `scripts/ci-telemetry.mjs` — its path from
  // `PLAYWRIGHT_JSON_OUTPUT_FILE`, as in the main config.
  reporter: process.env.CI
    ? [['html', { outputFolder: 'cross-browser-report', open: 'never' }], ['json'], ['github']]
    : [['list'], ['html', { outputFolder: 'cross-browser-report', open: 'never' }]],
  outputDir: 'cross-browser-results',
  use: {
    baseURL: 'http://localhost:8103',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      grepInvert: [/@mobile-only/, ONE_LEVEL],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      grepInvert: [/@mobile-only/, ONE_LEVEL],
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /overlays\.spec\.ts$/,
    },
  ],
  webServer: {
    command: 'npx serve storybook-static -p 8103 --config ../serve.json',
    url: 'http://localhost:8103',
    reuseExistingServer: !process.env.CI,
  },
});
