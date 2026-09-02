import { expect, test } from '@playwright/test';

/**
 * Visual regression tests for @rtkelly/design-system.
 *
 * These tests run on Linux (CI environment) because Playwright screenshots
 * are platform-specific due to OS font rendering differences.
 *
 * To update snapshots:
 * 1. Run: pnpm test:visual:update
 * 2. Or trigger GitHub Actions workflow with update_snapshots enabled.
 */

// Skip visual tests on non-Linux platforms (local dev on macOS/Windows)
test.skip(process.platform !== 'linux', 'Visual tests run on Linux CI');

async function waitForStoryReady(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

test.describe('Design System Visual Regression - Components', () => {
  test('button component story', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-button--default&viewMode=story');
    await waitForStoryReady(page);
    await expect(page).toHaveScreenshot('button-default.png');
  });

  test('button bracketed story', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-button--bracketed&viewMode=story');
    await waitForStoryReady(page);
    await expect(page).toHaveScreenshot('button-bracketed.png');
  });

  test('card component story', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-card--default&viewMode=story');
    await waitForStoryReady(page);
    await expect(page).toHaveScreenshot('card-default.png');
  });

  test('slide deck story', async ({ page }) => {
    await page.goto('/iframe.html?id=presentation-slidedeck--default-deck&viewMode=story');
    await waitForStoryReady(page);
    await expect(page).toHaveScreenshot('slidedeck-default.png');
  });

  test('lorem ipsum blog post story', async ({ page }) => {
    await page.goto('/iframe.html?id=blog-loremipsumpost--foundational-blog-post&viewMode=story');
    await waitForStoryReady(page);
    await expect(page).toHaveScreenshot('blog-post-foundational.png', { fullPage: true });
  });

  test('modal component default story', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-modal--default&viewMode=story');
    await waitForStoryReady(page);
    await expect(page).toHaveScreenshot('modal-default.png');
  });

  test('modal component compound story', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-modal--compound-modal&viewMode=story');
    await waitForStoryReady(page);
    await expect(page).toHaveScreenshot('modal-compound.png');
  });

  test('modal confirmation dialog story', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-modal--confirmation-dialog&viewMode=story');
    await waitForStoryReady(page);
    await expect(page).toHaveScreenshot('modal-confirmation.png');
  });
});
