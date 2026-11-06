import { test, type Page, type TestInfo } from '@playwright/test';
import { THEMES, loadStories, type StoryEntry, type Theme } from './walkthrough.shared';
import { waitForStoryRendered } from './story-ready';

/**
 * Screenshot walkthrough of every Storybook story, in every theme.
 *
 * This is **not** a visual regression suite — it asserts nothing and has no
 * baselines. It produces a reviewable artifact: Playwright's HTML report, with
 * each story's three themes attached side by side, so a change to a shared
 * token can be eyeballed across the whole system rather than inferred from a
 * pixel-diff percentage.
 *
 * Deliberately separate from `visual.spec.ts`, which does have baselines and
 * must stay a pass/fail gate. Mixing them would mean either this suite blocks
 * merges on cosmetic churn, or that one stops gating.
 *
 * One test per *story* rather than per story-and-theme: the report lists tests,
 * so this way a row is a component and opening it shows every level together —
 * which is the comparison worth making. Splitting by level would give four
 * times the rows and scatter the images that need comparing.
 */

const stories = loadStories();

/**
 * Freeze anything that would make two runs of the same story differ: CSS
 * transitions, keyframe animations, caret blink. Without this the walkthrough
 * catches components mid-transition and the report is misleading.
 */
const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
`;

/**
 * Storybook paints the preview frame itself, which is wrong for every level but
 * whichever one it was configured with. Defer to the level's own surface token
 * so the frame always matches the story inside it.
 */
const THEME_SURFACE_CSS = `
  html, body, .sb-show-main {
    background-color: var(--ds-surface-base) !important;
  }
`;

async function captureTheme(
  page: Page,
  testInfo: TestInfo,
  story: StoryEntry,
  theme: Theme,
) {
  // Grouped into one collapsible step per theme. Left ungrouped, each capture
  // contributes ~7 rows to the report's step list, and 21 rows of navigation
  // plumbing push the screenshots — the only thing anyone opens this report to
  // see — below the fold.
  await test.step(`capture ${theme}`, async () => {
    // The level is a Storybook global, so it travels in the URL and the story
    // renders in it directly. The previous approach wrote localStorage and
    // reloaded, which depended on the provider seeding itself from storage on
    // first render — the same thing that made it unsafe to server-render.
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=level:${theme}`, {
      waitUntil: 'load',
    });

    // Verified before anything is captured: a walkthrough that silently
    // screenshots Storybook's error overlay is worse than no walkthrough.
    await waitForStoryRendered(page, story.id);

    await page.addStyleTag({ content: FREEZE_CSS + THEME_SURFACE_CSS });
    await page.waitForTimeout(300);

    // Written into the test's own output dir so Playwright owns the lifecycle;
    // `attach` copies it into the report and cleans up after itself.
    const file = testInfo.outputPath(`${theme}.png`);
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    await testInfo.attach(theme, { path: file, contentType: 'image/png' });
  });
}

test.describe('Storybook walkthrough', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const story of stories) {
    test(`${story.title} / ${story.name}`, async ({ page }, testInfo) => {
      test.slow();

      testInfo.annotations.push({ type: 'story', description: story.id });

      await page.emulateMedia({ reducedMotion: 'reduce' });

      for (const theme of THEMES) {
        await captureTheme(page, testInfo, story, theme);
      }
    });
  }
});
