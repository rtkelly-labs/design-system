import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { IS_STORY_SURFACE, waitForStoryRendered } from './story-ready';

/**
 * An axe pass over every asserted story, on both Levels.
 *
 * Nine gates could measure colour to two decimal places and none could observe
 * an accessibility regression. #44 is the instance: `focus:outline-none` at
 * specificity (0,2,0) beat the global `:focus-visible` at (0,1,0) on three
 * components, and nothing saw it — `check:contrast` audits *declared role pairs*,
 * not a ring as rendered.
 *
 * ## Scope is the visual suite's own list
 *
 * This reads `tests/visual.spec.ts`'s asserted-story ids rather than every story
 * in the index. Those are already the one-representative-per-component set that
 * `check:visual-coverage` keeps honest at budget 0, so the two suites cover the
 * same surface and adding a component extends both at once.
 *
 * ## Both Levels, because half the rules are about colour
 *
 * `color-contrast` is the rule most likely to catch something here, and it can
 * only be true of a rendered Level. `midnight` and `sketch` are authored
 * independently (ADR 0003), so passing on one says nothing about the other.
 *
 * ## A ratchet, with the violations listed
 *
 * Serious and critical only, to start. `KNOWN` carries what exists today with
 * the component it is in, so a new violation fails while the backlog is paid
 * down — the same shape as every other budgeted gate here, and the reason PR #58
 * never merged when it tried to land its rules and their fixes together.
 */

/* `process.cwd()` rather than `import.meta` — Playwright loads specs through a
 * CJS-compatible path here, and `import.meta` is a syntax error in that context. */
const ROOT = process.cwd();

/** The asserted-story ids, read from the visual suite so the two cannot drift. */
function assertedStoryIds(): string[] {
  const spec = readFileSync(path.join(ROOT, 'tests/visual.spec.ts'), 'utf8');
  const ids = [...spec.matchAll(/id: '([a-z0-9-]+--[a-z0-9-]+)'/g)].map((m) => m[1]);
  return [...new Set(ids)];
}

/**
 * Violations that exist today, by rule. Lower a number as they are fixed; delete
 * the line at zero. A rule absent here is budgeted at zero and fails on sight.
 */
const KNOWN: Record<string, number> = {};

const LEVELS = ['midnight', 'sketch'] as const;

/**
 * The components the visual suite asserts at a narrow viewport, read from its
 * `MOBILE_CASES` the same way `assertedStoryIds` reads the rest.
 */
function narrowViewportComponents(): Set<string> {
  const spec = readFileSync(path.join(ROOT, 'tests/visual.spec.ts'), 'utf8');
  const start = spec.indexOf('const MOBILE_CASES');
  const block = spec.slice(start, spec.indexOf('];', start));
  return new Set([...block.matchAll(/id: '([a-z0-9-]+)--/g)].map((m) => m[1]));
}

/**
 * Whether this story is scanned in this project.
 *
 * `chromium` scans everything. `mobile` scans only the components that have a
 * narrow-viewport case in the visual suite — every story of them, so a sibling
 * story like `--sketch-mode` stays in scope beside the `--dark-mode` one that
 * the visual suite names. It used to scan every story, which doubled the
 * slowest step in CI for answers that were already known.
 *
 * Measured, not assumed. The full matrix was run once with every violation
 * recorded (all impacts, every node target): 114 stories, both Levels, both
 * viewports. At the serious-and-critical bar this suite gates on, exactly one
 * result differed between the viewports — the `KNOWN` contrast node on
 * `saas-admindashboardlayout--sketch-mode` — and it is a component this scope
 * keeps. The rest are the same DOM laid out wider. Mobile went from 233 scans
 * to 58.
 *
 * The claim is kept honest rather than trusted: `A11Y_FULL_MATRIX=1` restores
 * every story in both projects, and `ci.yml` sets it on every push to `main`.
 * A story that starts differing at the narrow viewport fails there, the run
 * after it merges, and the fix is adding its component to `MOBILE_CASES` —
 * which it then needs anyway, since a layout that breaks narrow wants a
 * narrow baseline.
 */
const FULL_MATRIX = process.env.A11Y_FULL_MATRIX === '1';
const NARROW = narrowViewportComponents();
function scannedIn(project: string, id: string): boolean {
  return FULL_MATRIX || project !== 'mobile' || NARROW.has(id.split('--')[0]);
}

/**
 * The same decision, taken when the test is declared rather than when it runs.
 *
 * A test skipped at runtime still counts when Playwright shards the suite, and
 * shards are cut by count in declaration order — chromium first, then mobile.
 * With ~190 mobile tests skipping, three shards measured 94s, 62s and 15s of
 * work. Tagged `@chromium-only`, the mobile project's `grepInvert` never
 * collects them, so there is nothing to mis-count. `scannedIn` stays as the
 * runtime guard for any project that does not filter on the tag.
 */
function projectTag(id: string): { tag?: string } {
  return scannedIn('mobile', id) ? {} : { tag: '@chromium-only' };
}

/**
 * Stories that pin their own Level, and must not be forced onto the other one.
 *
 * A story named `--dark-mode` or `--sketch-mode` wraps itself in a provider for
 * that Level. Overriding the toolbar global on top renders *sketch's* accent on
 * *midnight's* ground — `#1450d7` on `#0a0a1a`, 2.94:1 — which axe reports as a
 * contrast failure and which is not one: no consumer can reach that combination,
 * because the component never chooses a ground and a Level never mixes.
 *
 * That cost an hour of chasing five "violations" on `SaasLandingPage` whose
 * measured colours matched no declared value on either Level. The real defect
 * from the same run — a `<pre>` that scrolls and cannot be focused — was
 * genuine, and is fixed.
 */
function pinsItsOwnLevel(id: string): boolean {
  return /--(dark|sketch|midnight)-mode$|--all-levels$/.test(id);
}

/**
 * Base UI's focus guards, and nothing else.
 *
 * Every Base UI popup (Menu, Popover, the dialogs) plants these beside its
 * trigger and around its popup: `aria-hidden="true"` `tabindex="0"` spans
 * whose only job is to catch Tab and redirect focus into or out of the popup
 * on the same event. Focus never rests on one, and a screen reader's virtual
 * cursor never lands on one because it is hidden. axe cannot see the
 * redirect, so it reports `aria-hidden-focus` whenever no dialog is open —
 * an open `Menu`, say. With a dialog open it marks the same spans
 * needs-review instead, which is why `Modal` and `Popover` never tripped it.
 *
 * Excluded by the attribute Base UI stamps on them rather than budgeted in
 * `KNOWN`, because a count would also hide a real `aria-hidden-focus`, like
 * the dismiss control #272 fixed. The test below plants one of those inside
 * an open menu and asserts it is still reported.
 */
const FOCUS_GUARD = '[data-base-ui-focus-guard]';

/** The asserted scope, minus Base UI's focus guards, serious or not. */
async function scan(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .include('[data-a11y-scope]')
    // Focus guards only: see `FOCUS_GUARD` above.
    .exclude(FOCUS_GUARD)
    .options({ resultTypes: ['violations'] })
    .analyze();
  return violations;
}

/**
 * Mark the story root and every surface the story portalled to `body` as the
 * scope `scan` reads.
 */
async function markScope(page: Page) {
  await page.evaluate(`(() => {
    const isStorySurface = ${IS_STORY_SURFACE};
    document.getElementById('storybook-root')?.setAttribute('data-a11y-scope', '');
    for (const el of Array.from(document.body.children)) {
      if (el.id !== 'storybook-root' && isStorySurface(el)) {
        el.setAttribute('data-a11y-scope', '');
      }
    }
  })()`);
}

test.describe('Accessibility', () => {
  for (const level of LEVELS) {
    for (const id of assertedStoryIds()) {
      test(`${id} — ${level}`, projectTag(id), async ({ page }, testInfo) => {
        test.skip(
          !scannedIn(testInfo.project.name, id),
          'No narrow-viewport case for this component; see `scannedIn`',
        );
        test.skip(
          pinsItsOwnLevel(id) && level !== LEVELS[0],
          'Story pins its own Level; forcing the other one mixes two palettes',
        );

        const global = pinsItsOwnLevel(id) ? '' : `&globals=level:${level}`;
        await page.goto(`/iframe.html?id=${id}&viewMode=story${global}`);
        await waitForStoryRendered(page, id);

        /*
         * Wait for the fonts, then suppress motion.
         *
         * `color-contrast` is the rule most likely to fire here and it measures
         * *rendered* text: a run that lands before the faces register measures
         * the fallback, at a different size and sometimes a different colour.
         * `docs/deterministic-rendering.md` names this as the second of the
         * three switches, and an accessibility gate that is a race is worse than
         * no gate — it teaches people to re-run it.
         */
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({
          content: '*,*::before,*::after{transition:none!important;animation:none!important}',
        });

        // The root, plus anything the story portalled to `body`: `Modal`,
        // `AlertDialog`, `Drawer` and `Toast` all render outside the root by
        // design, and a scope of `#storybook-root` alone scanned an empty box
        // for every one of them (#273). The portal test is `IS_STORY_SURFACE`,
        // the one `waitForStoryRendered` uses, so the two cannot disagree about
        // what the story rendered. Page-level rules an isolated story trips —
        // no `main`, no `h1` — are moderate, below the serious bar this counts.
        await markScope(page);

        const violations = await scan(page);

        const serious = violations.filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        );

        const overBudget = serious.filter(
          (v) => v.nodes.length > (KNOWN[v.id] ?? 0),
        );

        expect(
          overBudget.map((v) => `${v.id} (${v.impact}, ${v.nodes.length}): ${v.help}`),
        ).toEqual([]);
      });
    }
  }
});

/**
 * `DataTable`'s semantics (#245), in a real browser rather than jsdom.
 *
 * The loop above axes a story at rest, and a table at rest is unsorted. These
 * drive the sort from the keyboard — Tab to the header's button, Enter, then
 * Space — and read the result back through role locators, which resolve
 * against the browser's accessibility tree rather than the DOM. Chromium's
 * CDP tree does not surface `aria-sort` or `aria-rowcount` as properties, so
 * the attribute is read off the node that tree says is the column header or
 * the table — the element carrying the role, which is where both must land.
 *
 * Axe runs twice per case, unsorted and sorted, on both Levels, on a table
 * that renders every row and on one that windows ten thousand.
 */
const DATATABLE_CASES = [
  { id: 'components-data-datatable--default', rowcount: null },
  { id: 'components-data-datatable--virtualized', rowcount: '10001' },
] as const;

test.describe('DataTable semantics', () => {
  for (const level of LEVELS) {
    for (const { id, rowcount } of DATATABLE_CASES) {
      test(`${id} — keyboard sort — ${level}`, projectTag(id), async ({ page }, testInfo) => {
        test.skip(!scannedIn(testInfo.project.name, id), 'No narrow-viewport case for this component; see `scannedIn`');
        await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=level:${level}`);
        await waitForStoryRendered(page, id);
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({
          content: '*,*::before,*::after{transition:none!important;animation:none!important}',
        });

        const axe = async () => {
          const { violations } = await new AxeBuilder({ page })
            .include('#storybook-root')
            .options({ resultTypes: ['violations'] })
            .analyze();
          return violations
            .filter((v) => v.impact === 'serious' || v.impact === 'critical')
            .map((v) => `${v.id} (${v.impact}, ${v.nodes.length}): ${v.help}`);
        };

        const root = page.locator('#storybook-root');
        const table = root.getByRole('table');
        const branch = root.getByRole('columnheader', { name: 'BRANCH' });
        const button = branch.getByRole('button', { name: 'BRANCH' });

        // Unsorted: no header claims an order.
        await expect(root.locator('th[aria-sort]')).toHaveCount(0);
        expect(await axe()).toEqual([]);

        // The keyboard path: Tab until the sort button has focus. The scroll
        // regions come first, so a bounded number of presses, not one.
        for (let i = 0; i < 6 && !(await button.evaluate((el) => el === document.activeElement)); i++) {
          await page.keyboard.press('Tab');
        }
        await expect(button).toBeFocused();

        await page.keyboard.press('Enter');
        await expect(branch).toHaveAttribute('aria-sort', 'ascending');
        await expect(root.locator('th[aria-sort]')).toHaveCount(1);
        await expect(button).toBeFocused();

        await page.keyboard.press('Space');
        await expect(branch).toHaveAttribute('aria-sort', 'descending');
        await expect(root.locator('th[aria-sort]')).toHaveCount(1);

        if (rowcount) {
          // The window is a few dozen rows; the table reports all of them.
          await expect(table).toHaveAttribute('aria-rowcount', rowcount);
          await expect(root.getByRole('row').nth(1)).toHaveAttribute('aria-rowindex', '2');
        } else {
          await expect(table).not.toHaveAttribute('aria-rowcount');
        }

        expect(await axe()).toEqual([]);
      });
    }
  }
});

/**
 * The exclusion is narrow: it removes Base UI's focus guards and nothing else.
 *
 * An open menu carries six guards, which is what the exclusion exists for.
 * Planted beside them are the two shapes of the real defect — a focusable
 * element that is itself `aria-hidden`, and a button under an `aria-hidden`
 * ancestor — and both must still be reported, while no guard is.
 */
test('the focus-guard exclusion still reports a real aria-hidden-focus', { tag: '@chromium-only' }, async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One project is enough to prove the scope');
  const id = 'components-overlays-menu--actions';
  await page.goto(`/iframe.html?id=${id}&viewMode=story`);
  await waitForStoryRendered(page, id);
  await expect(page.locator('[data-slot="menu"]')).toBeVisible();
  expect(await page.locator(FOCUS_GUARD).count()).toBeGreaterThan(0);

  await page.evaluate(() => {
    const menu = document.querySelector('[data-slot="menu"]');
    const span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.tabIndex = 0;
    span.id = 'planted-span';
    const wrapper = document.createElement('div');
    wrapper.setAttribute('aria-hidden', 'true');
    wrapper.id = 'planted-wrapper';
    const button = document.createElement('button');
    button.id = 'planted-button';
    button.textContent = 'Hidden';
    wrapper.append(button);
    menu?.append(span, wrapper);
  });
  await markScope(page);

  const hidden = (await scan(page)).find((v) => v.id === 'aria-hidden-focus');
  const targets = (hidden?.nodes ?? []).map((n) => n.html);
  expect(targets.some((html) => html.includes('planted-span'))).toBe(true);
  expect(targets.some((html) => html.includes('planted-wrapper'))).toBe(true);
  expect(targets.some((html) => html.includes('data-base-ui-focus-guard'))).toBe(false);
});

/**
 * Popups, open.
 *
 * The pass above scans each asserted story at rest, and a `Select` at rest is
 * a closed trigger: its listbox exists only once opened, portalled to `body`.
 * So the one surface #164 moved from the operating system to this palette
 * would be the one surface axe never saw. This opens it the way a keyboard
 * user does, then scans the same scope as above — the root plus every portal
 * surface (`markScope`), without Base UI's focus guards (`scan`). No `KNOWN`
 * budget: this is new, and starts at zero.
 */
const OPEN_POPUPS = [
  { id: 'components-actions-forms-select--disabled-option', trigger: '#storybook-root [role="combobox"]', popup: 'listbox' },
] as const;

test.describe('Accessibility — open popups', () => {
  for (const level of LEVELS) {
    for (const { id, trigger, popup } of OPEN_POPUPS) {
      test(`${id} open — ${level}`, projectTag(id), async ({ page }, testInfo) => {
        test.skip(!scannedIn(testInfo.project.name, id), 'No narrow-viewport case for this component; see `scannedIn`');
        await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=level:${level}`);
        await waitForStoryRendered(page, id);
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({
          content: '*,*::before,*::after{transition:none!important;animation:none!important}',
        });

        await page.locator(trigger).focus();
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole(popup)).toBeVisible();
        await page.keyboard.press('ArrowDown');

        await markScope(page);
        const serious = (await scan(page)).filter(
          (v) => v.impact === 'serious' || v.impact === 'critical',
        );
        expect(serious.map((v) => `${v.id} (${v.impact}, ${v.nodes.length}): ${v.help}`)).toEqual([]);
      });
    }
  }
});

/**
 * The account flows (#252), completed from the keyboard.
 *
 * The loop above axes each flow's stories at rest and in the error state. What
 * it cannot see is whether the flow can be *finished* without a pointer: that
 * a failed submit puts focus on the summary, that the summary's links land on
 * the fields, that a step change or a success moves focus somewhere rather
 * than dropping it with an unmounted button. These drive each flow with Tab,
 * Enter, Space and the arrows only — no clicks, no `.focus()` — through a
 * failure and out the other side, and axe the states the loop never reaches:
 * a server rejection mid-flow, the finished step with its toast, and the
 * delete confirmation open over the settings page.
 *
 * One Level: nothing here varies by colour, and the loop already covers both.
 * Both projects, because the settings page is a different tab order once the
 * sidebar collapses behind the topbar's toggle.
 */
test.describe('Account flows — keyboard', () => {
  const root = (page: Page) => page.locator('#storybook-root');
  const summary = (page: Page) => root(page).locator('[data-slot="error-summary"]');

  async function open(page: Page, id: string) {
    await page.goto(`/iframe.html?id=${id}&viewMode=story`);
    await waitForStoryRendered(page, id);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content: '*,*::before,*::after{transition:none!important;animation:none!important}',
    });
  }

  /** Tab forward until `target` has focus. Bounded, so a trap fails rather than hangs. */
  async function tabTo(page: Page, target: ReturnType<Page['locator']>, max = 40) {
    for (let i = 0; i < max; i++) {
      if (await target.evaluate((el) => el === document.activeElement)) return;
      await page.keyboard.press('Tab');
    }
    await expect(target).toBeFocused();
  }

  /** Replace a text field's value from the keyboard. */
  async function retype(page: Page, value: string) {
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type(value);
  }

  async function axe(page: Page) {
    await markScope(page);
    const serious = (await scan(page)).filter((v) => v.impact === 'serious' || v.impact === 'critical');
    return serious.map((v) => `${v.id} (${v.impact}, ${v.nodes.length}): ${v.help}`);
  }

  /**
   * After a failed submit, the summary is the one thing announced (#299).
   *
   * It announces by taking focus. No live region on the page may be carrying
   * text at the same moment. Field errors used to be `role="alert"`, so every
   * invalid field was read out on top of the summary. Each field error must
   * still describe its control, so it is read when a summary link lands there.
   */
  async function expectSummaryAloneAnnounced(page: Page) {
    await expect(summary(page)).toBeFocused();
    const speaking = await page.evaluate(() =>
      [...document.querySelectorAll('[role="alert"], [role="status"], [role="log"], [aria-live]')]
        .filter((el) => el.getAttribute('aria-live') !== 'off')
        .filter((el) => (el.textContent ?? '').trim() !== '')
        .map((el) => el.outerHTML.slice(0, 120)),
    );
    expect(speaking).toEqual([]);

    const orphaned = await root(page).evaluate((scope) =>
      [...scope.querySelectorAll('[data-slot="field-error"], [data-slot="fieldset-error"]')]
        .filter((error) => !scope.querySelector(`[aria-describedby~="${error.id}"]`))
        .map((error) => error.textContent),
    );
    expect(orphaned).toEqual([]);
  }

  /**
   * Count the story form's `submit` events from here on. A pending submit
   * cancels the click that would send one, so this is the direct evidence
   * that a second Enter did not submit twice — the fixtures no longer guard
   * against it themselves.
   */
  async function countSubmits(page: Page) {
    await root(page)
      .locator('form')
      .first()
      .evaluate((form) => {
        const w = window as unknown as { __submits: number };
        w.__submits = 0;
        form.addEventListener('submit', () => {
          w.__submits += 1;
        });
      });
    return () => page.evaluate(() => (window as unknown as { __submits: number }).__submits);
  }

  /** Enter on the summary's first link, which should land on `field`. */
  async function followFirstError(page: Page, field: ReturnType<Page['locator']>) {
    await expect(summary(page)).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(summary(page).getByRole('link').first()).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(field).toBeFocused();
  }

  test('sign in — empty, rejected, then signed in', async ({ page }) => {
    await open(page, 'saas-account-flows--sign-in');
    const email = root(page).getByLabel('Email address');
    const password = root(page).getByLabel('Password', { exact: true });

    await tabTo(page, email);
    await page.keyboard.press('Enter');
    await expect(summary(page).getByRole('link')).toHaveCount(2);
    await expectSummaryAloneAnnounced(page);
    await followFirstError(page, email);

    await page.keyboard.type('ada@example.com');
    await page.keyboard.press('Tab');
    await expect(password).toBeFocused();
    await page.keyboard.type('difference-engine');
    const submits = await countSubmits(page);
    const signIn = root(page).getByRole('button', { name: 'SIGN IN' });
    await page.keyboard.press('Enter');

    // Pending: Enter in a field again is an implicit submit through the same
    // button, and the button refuses it.
    await expect(signIn).toHaveAttribute('aria-disabled', 'true');
    await page.keyboard.press('Enter');
    expect(await submits()).toBe(1);

    // The server's refusal: one entry, no field to blame, the password cleared.
    await expect(summary(page)).toContainText('We could not sign you in');
    await expect(summary(page).getByRole('link')).toHaveCount(1);
    await expect(password).toHaveValue('');
    expect(await axe(page)).toEqual([]);

    await followFirstError(page, email);
    await tabTo(page, password);
    await page.keyboard.type('analytical-engine');
    const remember = root(page).getByRole('checkbox', { name: 'Keep me signed in on this device' });
    await tabTo(page, remember);
    await page.keyboard.press('Space');
    await expect(remember).toBeChecked();
    await tabTo(page, signIn);
    await page.keyboard.press('Enter');

    // Pending on the button itself: focus stays on it — `disabled` would have
    // dropped it to <body> — and neither Enter nor Space sends the form again.
    await expect(signIn).toHaveAttribute('aria-disabled', 'true');
    await expect(signIn).toBeFocused();
    await expect(root(page).getByRole('status').filter({ hasText: 'Signing in' })).toHaveCount(1);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await expect(signIn).toBeFocused();
    expect(await submits()).toBe(2);

    await expect(root(page).getByRole('heading', { name: 'Signed in' })).toBeFocused();
    await expect(root(page)).toContainText('stay signed in for 30 days');
  });

  test('create account — four errors, a server refusal, then created', async ({ page }) => {
    await open(page, 'saas-account-flows--create-account');
    const name = root(page).getByLabel('Full name');
    const email = root(page).getByLabel('Email address');

    await tabTo(page, name);
    await page.keyboard.press('Enter');
    await expect(summary(page).getByRole('link')).toHaveCount(4);
    await expectSummaryAloneAnnounced(page);
    await followFirstError(page, name);

    await page.keyboard.type('Ada Lovelace');
    await page.keyboard.press('Tab');
    await expect(email).toBeFocused();
    await page.keyboard.type('taken@example.com');
    await page.keyboard.press('Tab');
    await page.keyboard.type('notes-on-the-engine');
    const terms = root(page).getByRole('checkbox', { name: 'I agree to the terms of service' });
    await tabTo(page, terms);
    await page.keyboard.press('Space');
    await expect(terms).toBeChecked();
    await tabTo(page, root(page).getByRole('button', { name: 'CREATE ACCOUNT' }));
    await page.keyboard.press('Enter');

    await expect(summary(page)).toContainText('An account already exists for this email address');
    await expect(summary(page).getByRole('link')).toHaveCount(1);
    expect(await axe(page)).toEqual([]);

    await followFirstError(page, email);
    await retype(page, 'ada@example.com');
    const create = root(page).getByRole('button', { name: 'CREATE ACCOUNT' });
    const submits = await countSubmits(page);
    await tabTo(page, create);
    await page.keyboard.press('Enter');

    await expect(create).toHaveAttribute('aria-disabled', 'true');
    await expect(create).toBeFocused();
    await page.keyboard.press('Enter');
    expect(await submits()).toBe(1);

    await expect(root(page).getByRole('heading', { name: 'Account created' })).toBeFocused();
  });

  test('reset password — every step, a mismatch, and the toast', async ({ page }) => {
    await open(page, 'saas-account-flows--reset-password');
    const email = root(page).getByLabel('Email address');

    await tabTo(page, email);
    await page.keyboard.press('Enter');
    await followFirstError(page, email);
    await page.keyboard.type('ada@example.com');
    await page.keyboard.press('Enter');

    await expect(root(page).getByRole('heading', { name: 'Check your email' })).toBeFocused();
    await tabTo(page, root(page).getByRole('button', { name: 'OPEN THE RESET LINK' }));
    await page.keyboard.press('Enter');

    const password = root(page).getByLabel('New password', { exact: true });
    const confirm = root(page).getByLabel('Confirm new password');
    await expect(root(page).getByRole('heading', { name: 'Choose a new password' })).toBeFocused();
    await tabTo(page, password);
    await page.keyboard.type('engine');
    await page.keyboard.press('Tab');
    await expect(confirm).toBeFocused();
    await page.keyboard.type('engines');
    await page.keyboard.press('Enter');
    await expect(summary(page).getByRole('link')).toHaveCount(2);
    await expectSummaryAloneAnnounced(page);

    await followFirstError(page, password);
    await retype(page, 'notes-on-the-engine');
    await page.keyboard.press('Tab');
    await retype(page, 'notes-on-the-engine');
    await page.keyboard.press('Enter');

    await expect(root(page).getByRole('heading', { name: 'Password changed' })).toBeFocused();
    await expect(page.locator('[data-slot="toast"]')).toContainText('Password changed');
    expect(await axe(page)).toEqual([]);
  });

  test('account settings — fix five errors, save, then delete and cancel', async ({ page }) => {
    await open(page, 'saas-account-flows--account-settings');
    const save = root(page).getByRole('button', { name: 'SAVE CHANGES' });

    await tabTo(page, save, 80);
    await page.keyboard.press('Enter');
    await expect(summary(page).getByRole('link')).toHaveCount(5);
    await expectSummaryAloneAnnounced(page);
    await followFirstError(page, root(page).getByLabel('Display name'));

    // Down the form in tab order, fixing each field on the way.
    await page.keyboard.type('Ada');
    await tabTo(page, root(page).getByLabel('Email address'));
    await retype(page, 'ada@example.com');
    await page.keyboard.press('Tab');
    await expect(root(page).getByLabel('Bio (optional)')).toBeFocused();
    await retype(page, 'Analyst of engines.');
    const firstRadio = root(page).getByRole('radio', { name: 'Public' });
    await tabTo(page, firstRadio);
    await page.keyboard.press('Space');
    await expect(firstRadio).toBeChecked();
    const terms = root(page).getByRole('checkbox', { name: 'I accept the updated terms of service' });
    await tabTo(page, terms);
    await page.keyboard.press('Space');
    await expect(terms).toBeChecked();
    await tabTo(page, save);
    await page.keyboard.press('Enter');

    await expect(summary(page)).toHaveCount(0);
    await expect(root(page).getByText('> Settings saved')).toBeVisible();

    // The destructive half: into the confirmation, and back out with focus intact.
    const del = root(page).getByRole('button', { name: 'DELETE ACCOUNT' });
    await tabTo(page, del);
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('alertdialog', { name: /Delete account/ });
    await expect(dialog).toBeVisible();
    expect(await axe(page)).toEqual([]);

    const confirmDelete = dialog.getByRole('button', { name: 'DELETE ACCOUNT' });
    await tabTo(page, confirmDelete, 5);
    await page.keyboard.press('Enter');
    await expect(dialog).toBeHidden();
    const cancel = root(page).getByRole('button', { name: 'CANCEL DELETION' });
    await expect(cancel).toBeFocused();
    await expect(page.locator('[data-slot="toast"]')).toContainText('Account scheduled for deletion');

    await page.keyboard.press('Enter');
    await expect(root(page).getByRole('button', { name: 'DELETE ACCOUNT' })).toBeFocused();
  });
});
