import { expect, type Page } from '@playwright/test';

/**
 * Wait until a Storybook story has genuinely rendered, and fail loudly if it
 * has not.
 *
 * Storybook always paints *something* — a "No Preview" panel, or a red error
 * overlay — so a screenshot taken after a fixed delay succeeds whether the
 * story rendered or the whole preview bundle failed to load. Both the visual
 * regression baselines and the walkthrough report are therefore only meaningful
 * if the render is verified first; without this check a broken Storybook
 * produces a full set of confident-looking screenshots of an error message.
 *
 * Storybook signals its state through classes on `<body>`:
 *   sb-show-main            story rendered
 *   sb-show-nopreview       no story resolved for the id
 *   sb-show-errordisplay    the story or the preview bundle threw
 */
export async function waitForStoryRendered(page: Page, storyId: string): Promise<void> {
  const body = page.locator('body');

  // The failure guidance is raised on catch rather than passed as expect()'s
  // message argument: Playwright uses that message as the *step title*, so it
  // would appear in the HTML report next to a green tick on every successful
  // run, which reads as a failure at a glance.
  try {
    await expect(body).toHaveClass(/sb-show-main/, { timeout: 30_000 });
  } catch {
    throw new Error(
      `Story "${storyId}" never reached a rendered state. ` +
        'Check that the Storybook build is current and that the static server ' +
        'is not rewriting /iframe.html (see serve.json).',
    );
  }

  const classes = (await body.getAttribute('class')) ?? '';

  if (classes.includes('sb-show-errordisplay')) {
    const detail = await page.locator('#error-message').textContent().catch(() => null);
    throw new Error(`Story "${storyId}" rendered an error overlay: ${detail ?? 'unknown'}`);
  }

  if (classes.includes('sb-show-nopreview')) {
    throw new Error(
      `Story "${storyId}" resolved to "No Preview" — the id is missing from the build.`,
    );
  }

  // The root can be present but empty while the story is still mounting — and,
  // for one class of component, permanently.
  //
  // A portalled component renders *outside* `#storybook-root` by design:
  // `Modal` portals to `document.body` so that `position: fixed` resolves
  // against the viewport rather than the nearest transformed ancestor. Its root
  // is therefore legitimately empty, and asserting on the root alone fails it
  // for doing the right thing. `Drawer`, `Toast` and `Tooltip` are all headed
  // the same way, so this accepts either: content in the root, or a portal
  // mounted to the body.
  const mounted = await page
    .waitForFunction(
      () => {
        const root = document.getElementById('storybook-root');
        if (root && (root.childElementCount > 0 || (root.textContent ?? '').trim() !== '')) {
          return true;
        }
        // Storybook's own scaffolding and the tags it injects are not a render.
        const ignored = new Set(['SCRIPT', 'STYLE', 'LINK', 'TEMPLATE', 'NOSCRIPT']);
        return Array.from(document.body.children).some(
          (el) =>
            el.id !== 'storybook-root' &&
            el.id !== 'storybook-docs' &&
            !ignored.has(el.tagName) &&
            el.childElementCount > 0,
        );
      },
      undefined,
      { timeout: 15_000 },
    )
    .then(() => true)
    .catch(() => false);

  if (!mounted) {
    throw new Error(
      `Story "${storyId}" rendered nothing: #storybook-root is empty and no portal ` +
        'was mounted to the body.',
    );
  }

  // Web fonts change text metrics enough to reflow a page after paint.
  await page.evaluate(() => document.fonts.ready);
}
