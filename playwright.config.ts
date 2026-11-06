import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.ts$/,
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Four on CI, measured rather than picked. The suite is wait-bound, not
  // CPU-bound — 38 tests spend their time on page loads, `document.fonts.ready`
  // and the 300ms settle in `visual.spec.ts`, so one worker left three of the
  // runner's four cores idle for 36 seconds:
  //
  // | workers | wall clock |
  // |---|---|
  // | 1 | 36.8s |
  // | 2 | 17.7s |
  // | 4 | 11.5-12.5s |
  //
  // **Parallelism here is a claim about determinism, so it was tested as one.**
  // `maxDiffPixels: 0` means any rendering that varies with how busy the machine
  // is would show up as a failed pixel diff. Baselines were generated at one
  // worker and the suite re-run against them seven times at two, four and six
  // workers on a four-core Linux box: byte-identical every time. That is the
  // expected result and worth stating why — nothing screenshotted here depends
  // on wall-clock time. `animations: 'disabled'` finishes transitions rather
  // than waiting them out, `story-ready.ts` awaits `document.fonts.ready` and a
  // verified render before anything is captured, and the viewport is fixed. A
  // slower worker gets the same pixels, later.
  //
  // Four rather than six — six measured a further second, which is not worth
  // spending the per-test timeout headroom on a gate that blocks merges.
  //
  // If this ever does produce a diff that a re-run does not reproduce, the fix
  // is this line back to 1, and the finding belongs in the determinism contract
  // in `docs/visual-regression.md` — a real non-determinism found here is worth
  // more than the 24 seconds.
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? 'html' : [['list'], ['html', { open: 'never' }]],
  expect: {
    toHaveScreenshot: {
      // No pixel allowance.
      //
      // Rendering is pinned to one Chromium build on one OS, so the honest
      // expectation is an identical screenshot. The previous
      // `maxDiffPixelRatio: 0.05` let 5% of the image differ freely — about
      // 46,000 pixels of a 1280x720 shot, a region roughly 215x215, and
      // proportionally more on the `fullPage` rows. A component could change
      // colour, or a badge disappear, and the required check would pass. That
      // number was set when all five baselines were the same placeholder error
      // page, so it was never exercised against an image that could change.
      //
      // An absolute count rather than a ratio: it means the same thing on a
      // 1280x720 shot and a five-screen `fullPage` one, where a ratio silently
      // grants the tall images a much larger budget — exactly backwards, since
      // the big compositions are where a small regression hides.
      //
      maxDiffPixels: 0,

      // `threshold` is Playwright's default 0.2, written out rather than
      // absent — because the absence read as "no allowance" and there is one,
      // and because the alternative was measured and does not exist.
      //
      // `maxDiffPixels` bounds how many pixels may *count* as different;
      // `threshold` decides whether a pixel counts at all, as a normalised YIQ
      // distance. So the two are not the same knob and 0 on one does not imply
      // 0 on the other.
      //
      // ## Why not `threshold: 0`
      //
      // Tried, on a branch, which is the only way to know. **21 snapshots
      // failed on unchanged code**, from 10 differing pixels to 11,274. So
      // anti-aliasing does produce differing pixels on a pinned Chromium — the
      // comment this replaces was right to be wary of tightening it.
      //
      // ## Why no other number works either
      //
      // The interesting part. To catch a real regression — `midnight`'s
      // accent.tertiary moving #ec4899 -> #f955a4, a brand accent shifting
      // across every component that draws it — the threshold must be below
      // **0.0023**. To absorb a 10% anti-aliasing shift on a high-contrast edge
      // (neon green on near-black, ink on paper) it must be above **0.0042**.
      //
      // Those overlap. **No threshold separates anti-aliasing noise from a
      // small colour change**, because an AA pixel on a high-contrast edge
      // travels further in YIQ than a subtle recolour does. This is not a
      // tuning problem with a better answer somewhere.
      //
      // ## What follows from that
      //
      // The visual suite is structurally unable to police colour, and must not
      // be relied on for it. That is why `auditHueAgreement` in
      // `src/theme/contrast.ts` exists as arithmetic and runs inside
      // `check:contrast`: a Role drifting from its Hue is caught by comparing
      // values, not by comparing pixels.
      //
      // The division of labour, stated so nobody re-litigates it: **arithmetic
      // gates colour; this suite gates structure** — an element moving,
      // disappearing, changing size, or a layout reflowing. It catches a large
      // colour change too (a #00ff00 probe failed four snapshots), but that is
      // a bonus and not the contract. See #125.
      threshold: 0.2,
    },
  },
  use: {
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    /*
     * A narrow viewport, for the behaviour that only exists there: the docs
     * sidebar toggle and its scrim, the admin drawer, and the `sm:` / `md:` /
     * `xl:` steps in `PageHeader`, `SectionContainer` and `Card`. None of it was
     * asserted anywhere — `walkthrough` captures every story on every Level but
     * `AGENTS.md` is explicit that it is not a gate and that its output is
     * "nobody's job to look" at.
     *
     * `snapshotPathTemplate` deliberately carries no `{projectName}`, so the two
     * projects would collide on one set of files. Rather than rename 44 existing
     * baselines to add a segment, the mobile cases carry their own `-mobile`
     * filenames and the desktop set is untouched.
     */
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npx serve storybook-static -p 6006 --config ../serve.json',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
  },
});
