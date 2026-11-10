import { test, expect, type Locator, type Page } from '@playwright/test';
import { waitForStoryRendered } from './story-ready';

/**
 * Overlay focus behaviour, driven from the keyboard, in every engine.
 *
 * The unit suite runs Base UI under jsdom, which has no layout, no real focus
 * model and no engine quirks; the Playwright suites run it in Chromium only.
 * What differs between engines is exactly what neither of those sees: whether
 * opening a dialog moves focus into it, whether Tab stays trapped there,
 * whether Escape closes the innermost layer only, and whether focus comes back
 * to the control that opened it. WebKit is where those have historically
 * differed (button focus on click, `inert`, `:focus-visible` heuristics).
 *
 * Only `playwright.cross-browser.config.ts` collects this file: Chromium as the
 * reference, Firefox and WebKit as the subjects. A test that fails in one
 * engine and passes in Chromium is a cross-browser finding; one that fails in
 * all three is a broken test or a broken component.
 *
 * Keyboard only, one Level: nothing here varies by colour. No screenshots —
 * cross-browser baselines would triple the snapshot set for pixels that are
 * expected to differ.
 */

async function open(page: Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await waitForStoryRendered(page, id);
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: '*,*::before,*::after{transition:none!important;animation:none!important}',
  });
}

/** Whether focus is on `el` or inside it. */
async function holdsFocus(el: Locator) {
  return el.evaluate((node) => node.contains(document.activeElement));
}

/**
 * Tab `n` times each way and assert focus is back inside `scope` after each.
 *
 * Polled, not read once: Base UI traps focus with guard elements beside the
 * popup, and a guard hands focus back on its own `focus` event, a task after
 * the key. Read straight after the press, focus is on the guard — outside the
 * dialog — in every engine, so a synchronous check fails on a working trap.
 * What a user can observe is where focus settles.
 */
async function expectTrapped(page: Page, scope: Locator, n = 6) {
  for (const key of ['Tab', 'Shift+Tab']) {
    for (let i = 0; i < n; i++) {
      await page.keyboard.press(key);
      await expect
        .poll(() => holdsFocus(scope), { message: `focus left the dialog after ${i + 1} ${key}`, timeout: 2_000 })
        .toBe(true);
    }
  }
}

const root = (page: Page) => page.locator('#storybook-root');

test.describe('Overlays — focus', () => {
  for (const { name, id, trigger } of [
    { name: 'Modal', id: 'components-overlays-modal--toggleable', trigger: 'OPEN MODAL' },
    { name: 'Drawer', id: 'components-overlays-drawer--toggleable', trigger: 'OPEN DRAWER' },
  ]) {
    test(`${name}: Enter opens, focus moves in and is trapped, Escape returns it`, async ({ page }) => {
      await open(page, id);
      const button = root(page).getByRole('button', { name: trigger });
      await button.focus();
      await page.keyboard.press('Enter');

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect.poll(() => holdsFocus(dialog), { message: 'focus did not move into the dialog' }).toBe(true);
      await expectTrapped(page, dialog);

      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(button).toBeFocused();
    });
  }

  test('AlertDialog over a Modal: Escape closes the top layer only, focus returns inside the Modal', async ({ page }) => {
    await open(page, 'components-overlays-alertdialog--over-a-modal');
    const modal = page.getByRole('dialog', { name: 'Domain settings' });
    await expect(modal).toBeVisible();

    const raise = modal.getByRole('button', { name: 'DELETE DOMAIN' });
    await raise.focus();
    await page.keyboard.press('Enter');

    const alert = page.getByRole('alertdialog');
    await expect(alert).toBeVisible();
    await expect.poll(() => holdsFocus(alert), { message: 'focus did not move into the alert' }).toBe(true);
    await expectTrapped(page, alert, 4);

    await page.keyboard.press('Escape');
    await expect(alert).toBeHidden();
    await expect(modal).toBeVisible();
    await expect(raise).toBeFocused();
  });

  test('Popover: Enter opens a non-modal dialog with focus inside, Escape returns it', async ({ page }) => {
    await open(page, 'components-overlays-popover--interactive');
    const button = root(page).getByRole('button', { name: 'WHAT IS A LEVEL?' });
    await button.focus();
    await page.keyboard.press('Enter');

    const popup = page.getByRole('dialog', { name: 'About levels' });
    await expect(popup).toBeVisible();
    await expect.poll(() => holdsFocus(popup), { message: 'focus did not move into the popover' }).toBe(true);

    await page.keyboard.press('Escape');
    await expect(popup).toBeHidden();
    await expect(button).toBeFocused();
  });

  test('Popover: a press outside dismisses it', async ({ page }) => {
    await open(page, 'components-overlays-popover--interactive');
    const button = root(page).getByRole('button', { name: 'WHAT IS A LEVEL?' });
    await button.click();
    const popup = page.getByRole('dialog', { name: 'About levels' });
    await expect(popup).toBeVisible();

    await page.mouse.click(5, 5);
    await expect(popup).toBeHidden();
  });

  test('Menu: Enter opens with an item focused, arrows move, Escape returns focus', async ({ page }) => {
    await open(page, 'components-overlays-menu--actions');
    const menu = page.getByRole('menu');
    // Open on load; close it so the test can open it the way a keyboard user does.
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();

    const button = root(page).getByRole('button', { name: 'ACTIONS' });
    await button.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toBeVisible();
    await expect.poll(() => holdsFocus(menu), { message: 'focus did not move into the menu' }).toBe(true);

    const active = () => page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
    const first = await active();
    await page.keyboard.press('ArrowDown');
    await expect.poll(active, { message: 'ArrowDown did not move focus' }).not.toBe(first);

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
  });

  test('Select: arrows open and choose, Enter commits, focus stays on the trigger', async ({ page }) => {
    await open(page, 'components-actions-forms-select--default');
    const combobox = root(page).getByRole('combobox');
    const before = (await combobox.textContent())?.trim();
    await combobox.focus();
    await page.keyboard.press('ArrowDown');

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(listbox).toBeHidden();
    await expect(combobox).toBeFocused();
    await expect.poll(async () => (await combobox.textContent())?.trim()).not.toBe(before);
  });

  test('Tooltip: Tab to the control shows it, Escape hides it and keeps focus', async ({ page }) => {
    await open(page, 'components-overlays-tooltip--interactive');
    const button = root(page).getByRole('button', { name: 'Copy' });
    for (let i = 0; i < 10 && !(await button.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(button, 'Tab never reached the first control').toBeFocused();

    const tip = page.locator('[data-slot="tooltip"]');
    await expect(tip).toBeVisible();
    await expect(tip).toContainText('Copy (C)');

    await page.keyboard.press('Escape');
    await expect(tip).toBeHidden();
    await expect(button).toBeFocused();
  });
});
