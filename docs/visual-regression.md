# Visual regression

How this repo screenshots itself, what those screenshots are allowed to mean,
and how to operate the thing without quietly turning it off.

`AGENTS.md` rules 5–8 are the short version and remain the rules. This is the
reference behind them: the reasoning, the failure modes, and the parts that are
not yet good enough.

---

## What we run, and what each thing is for

Three mechanisms, and confusing them is the most common way to draw a wrong
conclusion from a green run.

| | `pnpm test:visual` | `pnpm walkthrough` | `pnpm check:visual-coverage` |
|---|---|---|---|
| **Question** | did rendering change? | what does it look like? | is anything unwatched? |
| **Asserts** | yes — pixel diff vs committed baseline | **nothing** | yes — component coverage |
| **Scope** | one representative story per component, one level | every story × every level | every component in the index |
| **Gate** | required check | artifact on every PR | required check |
| **Output** | pass/fail + diff triad | HTML report you browse | count + names |

The walkthrough is the one people misread. It captures far more than the gated
suite — all four rungs of the ladder, every story — and asserts **none** of it.
It exists so a human can *look*; it will never fail because something broke. A
component that appears in the walkthrough and nowhere else is photographed, not
tested.

Unit tests (`pnpm test`) are the other half of the split, and the line between
them matters: **anything whose correctness *is* its appearance belongs in
`test:visual`.** Asserting on class strings in a unit test is a worse screenshot
that also breaks on every harmless refactor. Conversely, logic with a right
answer independent of pixels — token resolution, slug generation, hook state —
belongs in Vitest, where a failure names the cause instead of showing you a
picture of the symptom.

---

## The determinism contract

A pixel diff only means something if everything except your change is held
still. Each item below is load-bearing; if one drifts, the suite reports noise,
and a suite that reports noise gets ignored within a month. That is the normal
way visual testing dies — not by being switched off, but by being disbelieved.

**Pinned by the toolchain**

- **Playwright version pins the browser build.** `playwright@1.62.1` resolves to
  one Chromium revision. Baselines are only comparable across runs that share
  it, which is why the version is exact in `package.json` and why bumping
  Playwright is a re-baselining event, not a routine dependency bump.
- **Linux only.** `tests/visual.spec.ts` opens with
  `test.skip(process.platform !== 'linux')`. macOS and Windows render text
  differently enough to fail every baseline, so local runs are skipped rather
  than misleading.
- **Fixed viewport and pixel density.** The `chromium` project uses
  `devices['Desktop Chrome']`: 1280×720 at `deviceScaleFactor: 1`. Nothing
  should set a viewport per test without a reason, because that reason then has
  to be re-established every time the baseline is questioned.

**Pinned by Playwright's defaults — verified, not assumed**

These come from the installed `playwright/types/test.d.ts`, so they are facts
about the version in the lockfile rather than blog-post folklore:

| Option | Default | Why it matters |
|---|---|---|
| `animations` | `"disabled"` | CSS animations and transitions are stopped and finished, so a transition mid-flight cannot be captured |
| `caret` | `"hide"` | a blinking text cursor would differ between otherwise identical runs |
| `scale` | `"css"` | one CSS pixel to one image pixel, independent of the display |

There is deliberately **no configuration for these** — writing a default back
into the config file makes it look like a decision and invites someone to
"tune" it. `threshold: 0.2` in `playwright.config.ts` is exactly that mistake
and is noted below.

**Pinned by this repo**

- **`document.fonts.ready` is awaited** in `tests/story-ready.ts` before any
  screenshot. Web fonts load asynchronously and change text metrics enough to
  reflow a page *after* first paint, so a screenshot taken before they settle is
  a different rendering of the same markup.
- **The render is verified before it is photographed.** Storybook always paints
  *something* — a "No Preview" panel or a red error overlay — so a screenshot
  taken after a fixed delay succeeds whether the story rendered or the entire
  preview bundle failed to load. Every baseline in this repo was once a
  screenshot of the "No Preview" panel, and the suite passed for as long as it
  kept being one. `story-ready.ts` asserts on Storybook's own
  `sb-show-main` / `sb-show-nopreview` / `sb-show-errordisplay` body classes.
- **Portals count as rendering.** The same guard accepts a portal mounted to
  `document.body` as well as content in `#storybook-root`. `Modal` portals so
  that `position: fixed` resolves against the viewport rather than the nearest
  transformed ancestor, which leaves its root legitimately empty; `Drawer`,
  `Toast` and `Tooltip` will all do the same.
- **Clean URLs must stay off.** `serve` rewrites `/iframe.html` to `/iframe` by
  default and **drops the query string**, so Storybook gets no story to select
  and renders its placeholder. Both Playwright configs therefore pass
  `--config ../serve.json` (path relative to the *served* directory), and
  `vercel.json` sets the same flag for the hosted build.
- **Nothing captured here depends on wall-clock time**, which is why the suite
  can run in parallel. It runs at **four workers** on CI, not one. That is a
  claim about determinism, so it was tested as one: baselines generated at one
  worker were re-checked against them seven times at two, four and six workers,
  and the committed CI baselines — generated on a GitHub runner at one worker —
  were re-checked on a different four-core Linux machine at four workers.
  Byte-identical every time, under `maxDiffPixels: 0`.

  The reason it holds is the three items above rather than luck.
  `animations: "disabled"` *finishes* transitions instead of waiting them out,
  `story-ready.ts` awaits `document.fonts.ready` and a verified render before
  anything is photographed, and the viewport is fixed. A worker competing for a
  core gets the same pixels, later. Contrast a fixed `waitForTimeout` as the only
  wait, which is precisely the thing that does break under load — and is how
  every baseline in this repo once became a screenshot of the "No Preview" panel.

  **If a diff ever appears that a re-run does not reproduce, suspect this
  first**: set `workers` back to `1` in `playwright.config.ts`, confirm the diff
  goes away, and record the story here. A real non-determinism found that way is
  worth more than the 24 seconds parallelism buys.

**Not yet pinned — known gaps**

- **Web fonts come from a third party.** `src/styles.css` `@import`s
  `fonts.googleapis.com`, and that `@import` survives into the built Storybook —
  it is present in both `iframe.html` and the compiled `iframe-*.css` — so the
  browser fetches it on **every screenshot**.

  They do load. This was an open question, because an earlier note reasoned from
  pixel agreement with a sandbox that cannot reach Google that CI probably could
  not either. Two pieces of evidence say otherwise: Playwright's own call log
  reports `waiting for fonts to load... fonts loaded`, and blocking the requests
  in the harness changed **nearly all 38 screenshots** where blocking a resource
  nobody was fetching would have changed none.

  So the baselines are not ambiguous — they record real webfont rendering. The
  hazard is narrower and worse: **a third party decides what our baselines look
  like.** Google can ship a new font binary with no commit here, and both
  consumer rendering and all 38 baselines move with nothing to explain why.

  **Fixed as of 0.3.0** by self-hosting via `@fontsource`, so the font binaries
  are in the lockfile and pinned by the same mechanism as every other
  dependency. Blocking the requests in the harness was tried first and rejected:
  it makes the baselines deterministic on a rendering **no user ever sees**.

  Google Fonts was not a stable base for a published package for reasons beyond
  determinism, and they are worth keeping written down: the Munich Regional Court
  held that transmitting visitor IPs to Google without consent breaches the GDPR
  precisely because self-hosting was available; cache partitioning ended the
  shared-cache performance argument years ago; and `@import` of a remote
  stylesheet is the slowest delivery available, serialising three round trips of
  render-blocking work before text can paint.
- **CI and local render in different environments.** CI is `ubuntu-latest` plus
  the Chromium that `.github/actions/install-playwright` installs (`playwright
  install --with-deps chromium`, cached on the lockfile). The industry-standard fix is to
  run both CI and local baselining inside the same official image
  (`mcr.microsoft.com/playwright:v1.62.1-noble`), which is what makes "just
  re-record it locally" possible at all. Until then, **CI is the only place a
  baseline can legitimately be produced**, which is why `/update-snapshots`
  exists.

---

## Tolerance

Two knobs, and they do different things. Confusing them is how a suite ends up
unable to see a real regression.

- **`threshold`** — how different one pixel may be before it counts as changed.
  Perceived colour distance in YIQ space, `0` strict to `1` lax. **Playwright's
  default is `0.2`.**
- **`maxDiffPixelRatio`** — how many changed pixels are tolerated, as a fraction
  of the image. **Playwright leaves this unset**, i.e. zero tolerance.

Current configuration:

```ts
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 0,
  },
}
```

It used to be `maxDiffPixelRatio: 0.05` with `threshold: 0.2`, and both lines
were wrong in different ways.

`threshold: 0.2` **was the default**, written out. A default restated in config
reads as a tuned value, so the next person to see a flaky diff reaches for it.
It is gone; the default still applies.

`maxDiffPixelRatio: 0.05` was the real problem, and much looser than it looks:
5% of 1280×720 is **~46,000 pixels** — a region roughly 215×215 — free to differ
completely on every screenshot. An entire button could change colour, or a badge
vanish, and the required check would pass. On the `fullPage` rows, proportionally
more.

That number was never chosen for real components. It was set when all five
baselines were the same placeholder error page, so it was only ever exercised
against an image that could not change ([#32](https://github.com/rtkelly13/design-system/issues/32)).

### What `maxDiffPixels: 0` does not mean

It does not mean "no pixel may differ". It means no pixel may differ *by more
than `threshold`*, and `threshold` is still Playwright's default `0.2` — a
perceived YIQ distance, not an exact-match test. The two knobs compose, and the
looser one is the per-pixel one.

That gap is wide enough to hide a change across an entire screenshot, and it
did. `card-default.png` was recorded in #24, before the 0.2.0 ladder existed,
with a page background of pure `#000000`. Since #33 that surface has been
`--ds-surface-base`, which is `#0a0a1a` on `midnight`. So for every run since,
**921,600 of that baseline's pixels have been wrong** — and it passed, first
under the 5% ratio and then under `maxDiffPixels: 0`, because `#000000` versus
`#0a0a1a` is far below `0.2` in YIQ distance. Measured with pixelmatch's own
metric: 909,818 bytes differ, 1,435 clear the threshold.

Two things follow.

**Reading a diff count needs care.** A byte-level comparison of two baselines and
Playwright's reported number can differ by three orders of magnitude on the same
pair of images. When triaging, say which one you measured.

**A small colour change is a blind spot, and a measured one.** `maxDiffPixels: 0` reads as zero allowance and is not: `threshold` stays at Playwright's default `0.2`, so a pixel only counts as different once it moves that far in YIQ. `midnight`'s `accent.tertiary` shifting from `#ec4899` to `#f955a4` scores **0.0023** and is invisible to every asserted case, including one whose baseline holds 36 pixels of the old value. A `#00ff00` probe scored 0.3784 and failed four. Tracked in #125.

**Uniform near-black and near-white shifts are the blind spot.** Exactly where a
four-rung dark-to-light ladder does most of its work. Anti-aliasing is what
`threshold` is for and is a real need, so the fix is not simply `threshold: 0` —
that would make every baseline brittle to sub-pixel text rendering. Candidates,
none yet measured:

- `threshold: 0` on a small set of flat-colour surface stories, kept separate
  from the text-heavy ones.
- A non-pixel assertion for surfaces — read the computed background of a story
  root and compare it to the level's token, which is exact and needs no image.

The second is probably right: it tests the property that actually matters rather
than tightening a number until text starts failing. Tracked as follow-up, not
done here.

**The policy**

1. **No allowance until a real run demands one.** Rendering is pinned to one
   browser build on one OS, so the honest expectation is an identical
   screenshot. `maxDiffPixels: 0` states that, and it holds: on the run that
   introduced it, **37 of 38 baselines matched byte-for-byte.** The one that did
   not was the tall `fullPage` blog post, off by 57 pixels — and *stable* at 57
   across all three attempts, so not noise but a genuinely drifted baseline that
   the old 5% tolerance had been hiding. It was re-recorded with `changed`. That
   is the gate paying for itself on its first run.
2. **An absolute count, never a ratio.** `maxDiffPixels` means the same thing on
   a 1280×720 shot and a five-screen `fullPage` one; a ratio silently grants the
   tall images a much larger budget, which is exactly backwards — the big
   compositions are where a small regression hides.
3. **Never widen the global tolerance to silence one story.** That trades every
   other assertion for the convenience of one. Reach instead for `mask` on the
   offending region, or fix the non-determinism.
4. **Tolerance is not where flake gets fixed.** If a screenshot is unstable, the
   render is unstable. Find it — an unpinned date, a random ordering, an
   animation the defaults did not catch, a font that sometimes loads.

If a genuine sub-pixel wobble does appear, raise `maxDiffPixels` to the smallest
number that covers it and say in the commit which story forced it. `threshold`
is the other lever and a blunter one; tighten or loosen it as its own change,
measured on its own.

---

## Operating it

### Adding a component

Coverage is enforced per **component**, not per story: every component in
Storybook's index needs at least one asserted story, or an `EXCLUDED` entry with
a reason. The budget is `0`.

1. Write the story.
2. Add one row to `CASES` in `tests/visual.spec.ts` — one *representative*
   story, not all of them. Every row is a committed PNG that a human has to
   review whenever it changes, so breadth across components buys more than depth
   within one.
3. Comment **`/update-snapshots`** on the PR.
4. **Look at the images** in the resulting commit before merging.

Adding a second or third story to a component already covered is free and does
not need a row.

### Re-baselining

Comment on the PR. The mode is the whole decision:

| Mode | Writes | Use when |
|---|---|---|
| `/update-snapshots` | only baselines that do not exist | adding a story. Cannot overwrite evidence, which is why it is the default |
| `/update-snapshots changed` | any baseline that no longer matches | a change is *meant* to alter rendering |
| `/update-snapshots all` | every baseline, unconditionally | a global change — a token, a font stack, the render environment |

Say `changed` or `all` **deliberately**. A bare `--update-snapshots` on the CLI
presets to `changed`, which is how a run intended to add one story also
re-records every baseline that had drifted — and a drifted baseline that gets
re-recorded is a regression promoted to the expectation.

The mode is echoed back in the PR comment so a reviewer can tell "two added"
from "everything re-recorded".

### Two behaviours that look like bugs

**A test that creates a baseline is reported as failed.** Deliberately:
Playwright's `missing` mode writes the file and attaches a soft error, so a new
baseline is never silent. Only `all` and `changed` return a clean pass. The
update workflow's *generate* step therefore tolerates a non-zero exit — that is
what success looks like there — and its *verify* step, which re-runs the suite
with no update flag, is the gate that decides whether anything is committed.
Generate produces candidates; verify decides.

**The PR's visual check does not go green by itself.** Baselines are pushed with
`GITHUB_TOKEN`, and GitHub does not start workflow runs from those pushes. The
check keeps its previous result until you re-run it or push again. The verify
step inside the update run is what tells you the new baselines are good in the
meantime. Closing that last gap needs a push identity that is not
`GITHUB_TOKEN` — designed in [`ci-dispatch-token.md`](./ci-dispatch-token.md),
not implemented.

Also note that snapshot commits are authored by `github-actions[bot]`, and CI
runs on bot-authored commits land in `action_required` — they need an "Approve
and run" click before the PR shows a green check.

### Reading a failure

`test:visual` failing means one of three things, and they are easy to tell apart.

1. **A story did not render.** The error names the story and says which
   Storybook state it reached. Not a visual problem — the Storybook build is
   stale, the id is wrong, or the story throws. Nothing to re-baseline.
2. **Pixels moved and you meant it.** Download the `playwright-report` artifact
   and look at the expected / actual / diff triad. If it is the change you
   intended, re-baseline with `changed`.
3. **Pixels moved and you did not.** This is the suite paying for itself. Do not
   re-baseline. If the diff is a few pixels of text position, suspect a font
   metric change before anything else — see below.

### Baselining locally

You cannot, today, and the suite tells you so by skipping on non-Linux. Even on
Linux, a local machine is not `ubuntu-latest`. Until the render environment is
containerised, CI is the only legitimate source of a baseline.

What you *can* do locally is everything except the pixel comparison:
`pnpm build-storybook && pnpm check:visual-coverage` catches an unasserted
component or a row pointing at a story that no longer exists, which is most of
what goes wrong.

---

## Traps that have already cost time

- **Named Tailwind sizes ship a paired line-height.** `text-xs` is `0.75rem`
  *and* a leading; the CSS class it replaced set font-size alone. `Badge` uses
  `text-[0.75rem]` precisely so it keeps inheriting the article's unitless
  `1.5`. When a migration shifts layout by a few pixels, look here first.
- **Fallback font chains change metrics.** Unifying the font stacks silently
  changed the *fallback*, reflowing a blog post by 60px in an environment where
  webfonts do not load. It was diagnosed by fingerprinting every element's
  computed metrics before and after; guessing twice got it wrong. That technique
  is the right tool for unexplained pixel drift.
- **`check:visual-coverage` reads a build artefact.** It only sees the last
  `pnpm build-storybook`. It warns when a story file is newer, but rebuild before
  trusting it.
- **An `issue_comment` workflow always runs the default branch's copy of
  itself.** So a change to `update-snapshots-command.yml` does nothing on the PR
  that makes it. The workflow it *dispatches* runs from the PR branch, so a fix
  to `update-snapshots.yml` does take effect immediately.

---

## Anti-patterns

Worth naming, because each one is a locally reasonable decision that ends with
the suite being ignored.

- **Raising the global tolerance to quiet one story.** Mask the region or fix
  the render.
- **`fullPage` everywhere.** A tall screenshot fails for any reason anywhere in
  it, and localises nothing. Use it where the composition *is* the subject — a
  blog post, a landing page — and not otherwise.
- **A row per story instead of per component.** Multiplies review load without
  adding coverage, and review fatigue is what actually kills these suites.
- **Approving baselines without opening the images.** This converts a regression
  detector into a screenshot recorder that always passes, which is worse than
  having nothing, because it reports confidence.
- **Re-running until green.** If a story is genuinely non-deterministic, the
  retry is hiding a defect in the story.

---

## Tooling: where this sits, and what would justify moving

Playwright's built-in `toHaveScreenshot` with baselines committed to the repo.
The trade-offs are worth stating plainly, because the alternatives are mature and
the reason for staying is not "we already have this".

**What committing baselines buys.** The expectation lives in the repo, versioned
with the code that produces it, reviewable in the diff, and free. There is no
account, no external dependency in the critical path of a merge, and a
five-year-old commit can still be checked out and understood.

**What it costs.** Binary files in git history. Review happens in a commit diff
rather than a purpose-built UI. Only CI can produce a baseline. And no
cross-browser or cross-viewport coverage — one Chromium, one size.

**The alternatives**, all of which solve review UX and storage, and none of which
solve determinism for you:

| | Model | Notes |
|---|---|---|
| **Chromatic** | Storybook-native, cloud capture | Built by the Storybook team; per-story review, and TurboSnap only re-shoots stories affected by a change. The closest fit to a Storybook-first repo, and the most expensive way in |
| **Argos** | diffs screenshots your own tests capture | Open source, cheapest of the hosted three, and works with the Playwright suite that already exists rather than replacing it. The lowest-friction upgrade from here |
| **Percy** | uploads DOM, re-renders in their cloud | Strong cross-browser and cross-viewport story; re-rendering elsewhere means their environment, not yours, decides some pixels |
| **reg-suit** | self-hosted CLI + your own S3 | Keeps everything in your infrastructure, adds a bucket and a GitHub app to operate. The right answer if hosted review is wanted but a third party holding the images is not |

**Recommendation: stay on the built-in comparator for now, and spend the effort
on determinism instead.** None of the above would have caught any of the four
real problems this suite has actually had — placeholder baselines, clean URLs
eating the story id, a portalled component failing the render guard, and a
tolerance wide enough to hide a component. Those are all local to the harness,
and a hosted service would have reported the same wrong pixels more prettily.

Revisit when one of these becomes true:

- **Reviewing diffs in commits is what stops people re-baselining carefully.**
  That is a review-UX problem and hosted tools are genuinely better at it —
  Argos first, being open source and driven by the existing suite.
- **More than one browser or viewport starts to matter.** Responsive behaviour is
  currently asserted nowhere, and the built-in approach makes each new axis
  another full set of committed PNGs.
- **The repository gets heavy with baseline churn.** Roughly 38 PNGs today, which
  is nothing; a per-story, per-level, per-viewport matrix would not be.

---

## Current state

- 37 components, 38 asserted rows, budget `0`. One exclusion
  (`Showcase/DesignSandbox`, with a reason).
- `Foundations/Theme Ladder → AllLevels` is asserted, so all four rungs are
  compared in one screenshot. That closes the gap where a token change could
  read well on `midnight` and be unusable on `sketch` while passing everything.
- Open, in rough priority order:
  1. Containerise the render environment
     (`mcr.microsoft.com/playwright:v1.62.1-noble` for both CI and local), so a
     baseline can be reproduced off CI at all. Forces one full re-record.
  2. Metric-adjusted fallbacks. Self-hosting removed the third party, but the
     fallback stack is still whatever the browser picks while the webfont loads,
     and mismatched fallback metrics are what reflowed a blog post by 60px once
     already. `size-adjust` / `ascent-override` / `descent-override` /
     `line-gap-override` on a local fallback `@font-face` makes the fallback
     occupy the same box as the real face; `fontaine` generates those values
     from the font's own metrics. That removes the class of bug rather than an
     instance of it.
  3. A second viewport, once the shells are decomposed enough to be worth it.
  4. Revisit `threshold`, which is still Playwright's default 0.2.

Closed recently: tolerance ([#32](https://github.com/rtkelly13/design-system/issues/32)),
self-hosted fonts, the portal-aware render guard, and `/update-snapshots` being
unable to create a baseline at all.
