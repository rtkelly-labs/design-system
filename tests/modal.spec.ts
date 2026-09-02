import { expect, test } from '@playwright/test';

// Skip interaction/visual tests on non-Linux platforms (local dev on macOS/Windows)
test.skip(process.platform !== 'linux', 'Interactive tests run on Linux CI');

async function waitForStory(page: import('@playwright/test').Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(600);
}

test.describe('Modal Component & Interactions', () => {
  test('opens default modal and closes via close button', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-modal--default&viewMode=story');
    await waitForStory(page);

    // Initial state: modal should not be present
    await expect(page.getByTestId('modal-container')).not.toBeVisible();

    // Click trigger button
    await page.getByRole('button', { name: /OPEN MODAL/i }).click();

    // Modal dialog should be visible
    const modal = page.getByTestId('modal-container');
    await expect(modal).toBeVisible();
    await expect(page.getByText(/SYSTEM DIAGNOSTICS/i)).toBeVisible();
    await expect(page.getByText(/Core cluster runtime/i)).toBeVisible();

    // Close via close button
    await page.getByTestId('modal-close-button').click();
    await expect(modal).not.toBeVisible();
  });

  test('closes modal via Escape key', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-modal--default&viewMode=story');
    await waitForStory(page);

    await page.getByRole('button', { name: /OPEN MODAL/i }).click();
    await expect(page.getByTestId('modal-container')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('modal-container')).not.toBeVisible();
  });

  test('closes modal on backdrop overlay click', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-modal--default&viewMode=story');
    await waitForStory(page);

    await page.getByRole('button', { name: /OPEN MODAL/i }).click();
    await expect(page.getByTestId('modal-container')).toBeVisible();

    // Click outside modal (backdrop)
    await page.getByTestId('modal-backdrop').click({ position: { x: 10, y: 10 } });
    await expect(page.getByTestId('modal-container')).not.toBeVisible();
  });

  test('traps keyboard focus inside modal', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-modal--compound-modal&viewMode=story');
    await waitForStory(page);

    await page.getByRole('button', { name: /CONFIGURE PIPELINE/i }).click();
    const modal = page.getByTestId('modal-container');
    await expect(modal).toBeVisible();

    // Tab through elements and verify focus remains within modal
    const closeBtn = page.getByTestId('modal-close-button');
    const endpointInput = page.getByLabel(/Mesh Endpoint/i);
    const cancelBtn = page.getByRole('button', { name: /CANCEL/i });
    const deployBtn = page.getByRole('button', { name: /DEPLOY CHANGES/i });

    // Focus close button first or input
    await closeBtn.focus();
    await expect(closeBtn).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(endpointInput).toBeFocused();

    // Tab to last button
    await deployBtn.focus();
    await expect(deployBtn).toBeFocused();

    // Tab from last element should wrap around to first focusable
    await page.keyboard.press('Tab');
    await expect(closeBtn).toBeFocused();

    // Shift+Tab from first element should wrap around to last focusable
    await page.keyboard.press('Shift+Tab');
    await expect(deployBtn).toBeFocused();
  });

  test('handles multi-step wizard progression', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-modal--multi-step-wizard&viewMode=story');
    await waitForStory(page);

    await page.getByRole('button', { name: /START ONBOARDING WIZARD/i }).click();
    await expect(page.getByText(/ONBOARDING: STEP 01/i)).toBeVisible();

    // Go to step 2
    await page.getByRole('button', { name: /NEXT STEP/i }).click();
    await expect(page.getByText(/ONBOARDING: STEP 02/i)).toBeVisible();

    // Go back to step 1
    await page.getByRole('button', { name: /BACK/i }).click();
    await expect(page.getByText(/ONBOARDING: STEP 01/i)).toBeVisible();

    // Go to step 2 then step 3
    await page.getByRole('button', { name: /NEXT STEP/i }).click();
    await page.getByRole('button', { name: /NEXT STEP/i }).click();
    await expect(page.getByText(/ONBOARDING: STEP 03/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /FINISH & LAUNCH/i })).toBeVisible();
  });

  test('handles imperative confirm and alert dialogs via ModalProvider', async ({ page }) => {
    await page.goto('/iframe.html?id=foundations-modal--imperative-with-provider&viewMode=story');
    await waitForStory(page);

    // Trigger confirm
    await page.getByRole('button', { name: /TRIGGER CONFIRM PROMISE/i }).click();
    await expect(page.getByText(/CONFIRM DEPLOYMENT/i)).toBeVisible();

    // Abort
    await page.getByTestId('modal-cancel-btn').click();
    await expect(page.getByText(/User aborted rollout/i)).toBeVisible();

    // Trigger confirm and proceed
    await page.getByRole('button', { name: /TRIGGER CONFIRM PROMISE/i }).click();
    await expect(page.getByText(/CONFIRM DEPLOYMENT/i)).toBeVisible();
    await page.getByTestId('modal-confirm-btn').click();
    await expect(page.getByText(/User approved rollout/i)).toBeVisible();

    // Trigger alert
    await page.getByRole('button', { name: /TRIGGER ALERT PROMISE/i }).click();
    await expect(page.getByText(/STATUS UPDATE/i)).toBeVisible();
    await page.getByTestId('modal-confirm-btn').click();
    await expect(page.getByText(/User acknowledged maintenance alert/i)).toBeVisible();
  });
});
