import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

/**
 * Story files with no `play` function, left out before they are imported.
 *
 * The `play-fn` tag filter below acts per story, after the file has loaded in
 * the browser, so with it alone every one of the ~130 story files was still
 * transformed and imported: 32s to run one test. The plugin ignores
 * `test.include` (it takes the `stories` globs from `main.ts`) but honours
 * `test.exclude`, so the files that cannot hold a test are excluded here,
 * read from source so a new `play` is picked up with no list to edit.
 */
const STORIES = 'src/stories';
const withoutPlay = readdirSync(STORIES, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.stories.tsx'))
  .map((file) => path.join(STORIES, file))
  .filter((file) => !/\bplay\s*[:(]/.test(readFileSync(file, 'utf8')));

/**
 * Behaviour tests in a real browser: the `play` functions in `src/stories/`,
 * run by `@storybook/addon-vitest` in Vitest browser mode on Chromium.
 *
 * A separate config, not a project in `vitest.config.mts`, so `pnpm test` and
 * `pnpm test:coverage` stay the jsdom unit suite they were: no browser, no
 * Storybook transform, the same run time. `pnpm test:interactions` runs this.
 *
 * **Only stories with a `play` function run** (`play-fn`, the tag Storybook
 * gives every such story). The plugin's default is every story as a render
 * smoke test, which is ~400 browser renders the visual suite and the
 * walkthrough already make.
 *
 * **A `play` function runs wherever the story renders**, including the
 * `iframe.html?id=` loads `tests/visual.spec.ts`, `a11y.spec.ts` and
 * `edges.spec.ts` make. One that opens a popup would rewrite a baseline. So
 * plays go only on stories those suites do not name, and
 * `pnpm check:visual-coverage` fails if a named story carries one.
 *
 * What these add over the unit suite is what jsdom cannot do: layout (is the
 * popup on screen, on top, under the pointer), real focus and `:focus-visible`,
 * exit animations that must finish before a popup unmounts, and hit-testing
 * through a backdrop. Logic with a right answer independent of layout stays in
 * the co-located `*.test.tsx` files.
 */
export default defineConfig({
  plugins: [
    storybookTest({
      configDir: '.storybook',
      tags: { include: ['play-fn'] },
    }),
  ],
  test: {
    name: 'interactions',
    exclude: withoutPlay,
    // The `Telemetry` step reads JSON reports under `CI`, as for the unit job.
    reporters: process.env.CI ? ['default', 'json'] : ['default'],
    outputFile: { json: 'telemetry/interactions.json' },
    // One file at a time. Browser mode runs files in parallel iframes of one
    // page, and only one of them can hold focus: in parallel, a play's
    // `toHaveFocus` found focus on `<body>` because another file had it.
    fileParallelism: false,
    browser: {
      enabled: true,
      headless: true,
      // The pinned Playwright image carries this Chromium (rule 9); nothing is
      // installed. `PW_CHROMIUM_PATH` is for a machine whose Chromium lives
      // somewhere Playwright does not look, never for CI.
      provider: playwright({
        launchOptions: process.env.PW_CHROMIUM_PATH
          ? { executablePath: process.env.PW_CHROMIUM_PATH }
          : {},
      }),
      // The desktop project's viewport in `playwright.config.ts`, so a popup
      // placed on screen here is placed on screen there.
      viewport: { width: 1280, height: 720 },
      instances: [{ browser: 'chromium' }],
    },
  },
});
