import { expect, userEvent, waitFor } from 'storybook/test';

/**
 * Helpers for the `play` functions `pnpm test:interactions` runs in Chromium.
 *
 * Each one asks a question jsdom cannot answer, because jsdom has no layout:
 * every rectangle is zero and `elementFromPoint` returns nothing. These are
 * the reason the interaction suite exists beside the unit suite, so a play
 * function should lean on them rather than repeat what a `*.test.tsx` already
 * asserts about roles and keys.
 *
 * A play function runs wherever its story renders, so it goes only on a story
 * the visual, a11y and edges suites do not name. `check:visual-coverage`
 * fails if one does.
 */

/** Every animation under `el` has finished, so its box is where it will rest. */
export async function settled(el: Element): Promise<void> {
  await Promise.all(el.getAnimations({ subtree: true }).map((a) => a.finished));
}

/**
 * `el` is wholly inside the viewport and is what a pointer at its centre
 * would hit — on screen, and painted above everything else there.
 */
export async function expectOnTop(el: HTMLElement): Promise<void> {
  await settled(el);
  await waitFor(() => {
    const box = el.getBoundingClientRect();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.top).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(window.innerWidth);
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    expect(el.contains(hit), 'the element painted at its centre is inside it').toBe(true);
  });
}

/**
 * Press whatever is painted at (`x`, `y`) — the backdrop, the page, another
 * surface — as a pointer would, rather than dispatching on an element chosen
 * by selector. A press "outside" that lands on the popup's own box fails
 * here instead of passing for the wrong reason.
 */
export async function pressAt(x: number, y: number, outside: Element): Promise<void> {
  const hit = document.elementFromPoint(x, y);
  expect(hit, `something is painted at ${x},${y}`).not.toBeNull();
  expect(outside.contains(hit), `${x},${y} lands outside the surface`).toBe(false);
  await userEvent.click(hit as Element);
}

/**
 * `el` is closed: unmounted, or still mounted but not rendered — its exit
 * animation ran to the end either way. `Select` keeps its list mounted.
 */
export async function expectClosed(el: Element): Promise<void> {
  await waitFor(() => expect(el.isConnected && el.checkVisibility()).toBe(false));
}
