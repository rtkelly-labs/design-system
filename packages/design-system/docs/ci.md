# CI shape and the screenshot walkthrough

**Parent:** [`AGENTS.md`](../AGENTS.md)

Which job runs what and why, and how to review what a change looks like.

---

## ⚙️ CI Shape

`ci.yml` runs **four jobs in parallel**, then a fifth that reports their
combined verdict. `visual` is itself three runners — a matrix of shards, each
taking a third of both browser suites — and `record` saves its verdict once all
three have passed.

**Shards are cut by test count, so a test must not exist where it would only
skip.** Playwright slices the collected list in declaration order, chromium
first, and a runtime `test.skip` still counts. With the a11y suite's ~190
out-of-scope mobile scans skipping at runtime, three shards measured 94s, 62s and
15s of work. They are tagged instead — `@chromium-only`, `@mobile-only` — and each
project's `grepInvert` leaves the other's out at collection, which split the same
work 103 / 102 / 102 a11y and 44 / 44 / 43 visual tests. A new test that belongs
to one project takes its tag, not only a `test.skip`.

A reused verdict skips on **every** shard: each leg does its own lookup, so the
three `visual` jobs each finish in seconds, and `record` does not run.

**It runs on every pull request, whatever the base branch.** `pull_request` used
to carry `branches: [main]`, which filters on the PR's *base* — so a PR aimed at
another branch got no CI at all. Not a failure, not a pending check: nothing.
A stacked PR showed only the Vercel comment check and read as "no gates to run",
which is worse than a red one. `push` keeps its `main` filter, because that
trigger is the post-merge signal for the default branch specifically.

| Job | What it runs | Roughly | Ceiling |
| --- | --- | --- | --- |
| `gates` | `tokens:check`, `tokens:design:check`, `check:contrast`, `check:docs`, `check:doc-snippets`, `check:skills`, `check:component-docs`, `check:story-docs`, `check:component-contract`, `check:licences`, `check:reference-material`, `check:lint-budget`, `check:css`, `check:tokens`, `ansi:check`, `check:fonts`, `check:deps`, `check:governance` | 55s | 10m |
| `unit` | `typecheck`, `test:coverage` | 95s | 10m |
| `package` | `build`, `check:bundle-size`, `check:dep-cost`, `check:api`, and the report generator | 85s | 10m |
| `visual` | `build-storybook`, `check:visual-coverage`, `check:docgen-props`, `check:story-conventions`, `test:visual`, `test:a11y` | 430s | 25m |
| `record` | nothing — saves the verdict key once every `visual` shard passed; not in `verify`'s `needs` | 5s | 5m |
| `verify` | nothing — fails unless the four above succeeded | 10s | 5m |

**Check names are lowercase, snake_case, and at most two words**, taken from the
shared lexicon in `shared-utilities` (`ci`, `build`, `test`, `lint`, `visual`,
`publish`, `format`, ...) — so the five jobs report as `lint`, `test`, `build`,
`visual` and `ci`. Names that describe their contents cannot also be stable contracts:
the required check used to be `Build, Typecheck, Storybook & Visual Regression`,
splitting the job silently made it `Build, Typecheck, Unit Tests, Storybook &
Visual Regression`, and the governance map went on requiring the old string.
`repo-governance check-names` now fails on a required check no job declares, and
warns on names that drift from the lexicon.

Only `visual` drives a browser, so only its ceiling has to allow for one — it
used to clear `install-playwright`'s two-attempt retry budget, and now runs in
the pinned image with nothing to install (rule 9). Splitting the job is what let
the other jobs drop to a ceiling sized to their own work, instead of every gate
waiting out a browser-shaped timeout.

**This table is checked.** It is a copy of the roster in `ci.yml`, and it had
drifted in two rows — `check:tokens` and `ansi:check` had been running in
`gates` for some time, `check:api` in `unit`, and none of the three appeared
here. `pnpm check:governance` now fails when a job runs a gate this table omits,
or claims one it does not run, and asks the same of rule 6 in
[`docs/workflow.md`](./workflow.md). It also asks the reverse question, which is
the more dangerous direction: `tokens:design:check` shipped a staleness gate for
the DTCG export and ran in **no workflow at all**, so a stale `tokens/*.json`
could reach npm with every check green. A gate in `package.json` now has to be
wired into a workflow or exempted in the script with a stated reason.

**Add a new gate to `gates`, `unit` or `package`, not to `visual`.** The visual
job is the critical path; the others have headroom, and putting a check behind a browser
install and a screenshot suite is what made this slow in the first place. It was
one job of nineteen serial steps, and nothing in it needed to be serial — so
`lint`, the fastest and most frequently-failing check in the repo, reported after
everything else had also run.

**Where the time actually goes**, so the next person optimising this starts from
measurements rather than a guess:

- **`lint` lints only what changed.** `check:lint-budget` runs ESLint with
  `--cache --cache-strategy content` when `ESLINT_CACHE_DIR` is set, which only
  CI does. ESLint's cache notices a changed file or config, not a changed input
  the rules read — `tailwindcss/no-custom-classname` loads the stylesheets and
  `no-colour-literals` lives in `src/lib/tokenRules.ts` — so
  `scripts/eslint-cache.mjs` fingerprints those and empties the cache when they
  move. A pnpm store cache was measured and not added: the whole install is
  ~5s, the download ~3.6s of it, and restoring a ~380 MB store is no faster.
- **Measure first: `pnpm ci:history`.** It reads the job and step timings GitHub
  already keeps for every run and prints p50/p90 per job and step, queue time,
  runner minutes, the critical path and a per-step trend (`--workflow`,
  `--runs`, `--branch`, `--json`). The "Roughly" column above is its p50 over
  20 runs in September 2026. It had said `visual` took 60s when its median was
  over five minutes, because nothing read those timings.
- **The a11y suite's narrow viewport is scoped on pull requests.** `mobile` scans
  only components with a narrow-viewport case in `visual.spec.ts` (58 scans, not
  233); every push to `main` runs the full matrix with `A11Y_FULL_MATRIX=1`, so the
  claim that the rest agree with desktop is re-checked after every merge rather
  than trusted. The evidence and the rule are in `scannedIn`, `tests/a11y.spec.ts`.
- **The a11y suite reaches its second Level without a second page load** on pull
  requests: the story is loaded once and the Level switched through Storybook's
  preview channel (`LEVEL_SWITCH` in `tests/a11y.spec.ts`). Each story is one test
  with a step per Level, since Playwright gives every test a fresh page. `main`
  runs `A11Y_LEVEL_SWITCH=compare`, which also loads the Level fresh and fails
  if the two violation sets differ in any rule, impact or node.
- **`visual` reuses a verdict its inputs already earned.** Its first step hashes
  every tracked file that can reach the job's result (`scripts/render-inputs.mjs`,
  default-deny; `--list` prints what it leaves out and why) and, on a pull request,
  looks that hash up as a cache key. A hit skips everything after checkout, which is
  the whole ~5 minutes, on every shard; a pass of every shard records one. `main` never looks up and always
  records, so it is both the source most PRs hit and the run where a wrong
  exclusion would show. The key is inputs rather than `storybook-static/` because
  the build is not reproducible: `react-docgen-typescript` reorders props between
  runs of one tree, moving 79 of 313 files.
  A reused run is visible: the job's summary opens with *Visual verdict reused*
  and names the key, and every step after the lookup reports skipped.
- **The walkthrough reuses a report the same way.** Same hash, keyed
  `walkthrough-report-*`: on a pull request whose inputs already rendered one, the
  ~9 MB report is restored from cache and attached again instead of re-captured.
- **Below the step, the `Telemetry` step.** `test` and `visual` end with
  `scripts/ci-telemetry.mjs tests`, which reads the JSON reports Vitest and
  Playwright write under `CI`. It puts the slowest tests, retries, worker
  utilisation and cache hits in the job summary, and uploads them as
  `ci-telemetry-<job>`. It is not a gate and cannot fail one.

- **The walkthrough is the long pole of the whole PR**, not `ci.yml` — one test
  per story, four captures each, and it grows by four screenshots per component.
- **Both Playwright suites are wait-bound, not CPU-bound.** They spend their time
  on page loads, `document.fonts.ready` and per-capture settle waits, so they
  scale past the core count. Worker counts in both configs are measured, with the
  tables in the config comments; the gated suite's is also a determinism claim
  and is evidenced in [`docs/visual-regression.md`](./visual-regression.md).
- **`.github/actions/setup`** is Node + pnpm + install, and nothing else. Use it
  rather than repeating the steps: a `pnpm install` that differs between the job
  that writes a baseline and the job that checks it is the one difference this
  repo can least afford. Browsers are **not** here: the jobs that drive one run
  in the pinned image, which carries them.
- **Browser jobs run in the pinned Playwright image** and install nothing.
  `install-playwright` used to fetch Chromium and `apt-get` its libraries on
  every run (~20s with a cached download), bounded and retried because both
  halves had hung or failed upstream. The image carries all of it; the cost
  moved to pulling ~900MB compressed at job start, so this is a determinism
  change first and a speed change only if the pull is quicker than the install
  was. The verdict and walkthrough keys name the image digest instead of the
  runner's `ImageOS`/`ImageVersion`, which moved weekly.
- **`ci.yml` supersedes in-flight PR runs** (`concurrency`), as the walkthrough
  already did. The group includes the event name so rule 8's manual
  `workflow_dispatch` re-run is never cancelled by a push or queued behind one.

**Per-story selection runs in shadow mode.** `visual` ends with
`scripts/select-stories.mjs shadow`, which says which asserted stories the change
can reach and why, in the job summary and `telemetry/story-selection.json`. It skips
nothing. Its graph is the union of what Vite bundled (`preview-stats.json` — `pnpm
build-storybook` passes `--stats-json` for it; `vercel.json` deletes the 2.4 MB file
after the build, because the published Storybook has no use for it) and the source imports: the bundle
graph has no CSS `@import` or JSON edges, the source graph cannot see what a plugin
adds, and with type-only imports left out the two agree on 118 of 120 stories. Files
outside any graph — the lockfile, `ci.yml`'s `visual` job, a snapshot, a `CASES` row,
`package.json`'s dependency fields — have rules in `story-selection.mjs`, and a path
no rule names reaches every story.

`pnpm stories:replay` runs the same code over the last 100 merged PRs: 34 reached no
asserted story, 35 reached all of them, and 31 reached a median of 6 (p90 28) —
**39% of today's story scans across all PRs**. It uses today's graph for old PRs, so
it is an estimate; `pnpm stories:graphs` prints where the two graphs disagree.
Three rules added after review — a `package.json` edit to a script the `visual` job
runs (read from `ci.yml`, followed through the scripts it calls), a workflow-level key
`visual` inherits, and default-deny inside `src/` for a file neither graph holds
(the source graph now follows CSS `url()`, so the self-hosted font is reached
through `styles.css`) — left these figures unchanged: the three PRs that trip them
already reached every story for another reason.

**What would let it decide.** The detector is the point of shadow mode: every
failing visual or a11y test is checked against the selection, and one outside it is
a **selection miss**. Enforcement — running only the selected stories on a pull
request — is justified when all of these hold:

- **at least 50 pull-request runs** with a partial selection, and **zero misses**
  across them and across every `main` run in the same period;
- every miss ever recorded has a rule or graph fix and a test in
  `story-selection.test.mjs` that pins it;
- the runner image is compared with the one `main` last verified (the key
  `visual` already records) and a change selects everything — today it is only
  reported.

Even then **`main` keeps running everything**: it is what checks the graph, and a red
`main` holds the release train (rule 5), so a miss cannot reach production.

Not done, and the next lever if the story count doubles again: sharding the
walkthrough across runners with `--shard` and `merge-reports`. Worth roughly
another 30s, at the cost of a merge job and three times the runner minutes.


## 📸 Screenshot Walkthrough

`pnpm walkthrough` captures every Storybook story on **every level**
(derived from `THEME_LEVELS`, so a new rung widens the matrix automatically)
and publishes Playwright's own HTML report to
`walkthrough-report/`. CI attaches it as `storybook-walkthrough-<sha>` on every PR.

Download it, unzip, open `index.html` — it works straight from `file://`, no
server needed. `pnpm walkthrough:show` serves it locally.

It is **not** a gate. It asserts nothing about how things should look; it makes
what they *do* look like reviewable. Visual regression stays in `ci.yml`.

Its real value is breadth per level: it captures *every* story on every rung,
where the gated suite captures one representative per component.

The cross-level gap the gated suite used to have is closed —
`Foundations/Theme Ladder → AllLevels` renders every rung in one screenshot
and is now a `CASES` row, so a token change that reads fine on `midnight` and is
unusable on `sketch` fails a required check rather than merely showing up in a
report nobody opened.

Two structural choices worth keeping:

- **One test per story, not per story-and-level.** The report lists tests, so a
  row is a component and opening it shows every level together — which is
  the comparison worth making. Splitting by level multiplies the rows and
  scatters the images that need comparing.
- **Each theme's capture is wrapped in a `test.step`.** Ungrouped, the
  navigation plumbing contributes ~21 rows to the step list and pushes the
  screenshots below the fold.

Note that `expect()`'s message argument becomes the *step title* in the report,
shown next to a green tick on success. `story-ready.ts` therefore raises its
guidance on catch instead — otherwise every passing run reads as a failure.

### Both suites verify the render first

`tests/story-ready.ts` asserts Storybook actually mounted the story before any
screenshot is taken, by checking the `sb-show-main` / `sb-show-errordisplay` /
`sb-show-nopreview` classes Storybook puts on `<body>`.

This is not optional defensiveness. Storybook always paints *something* — a
"No Preview" panel or a red error overlay — so a screenshot taken after a fixed
delay succeeds whether the story rendered or the entire preview bundle failed
to load. Every baseline in this repo was once a screenshot of the "No Preview"
panel, and the suite passed for as long as it kept being one.

### `serve.json` is load-bearing

`serve` rewrites `/iframe.html` to `/iframe` by default (`cleanUrls`), which
breaks Storybook's asset preloading and yields exactly that empty preview. Both
Playwright configs therefore start it as:

```
npx serve storybook-static -p 6006 --config ../serve.json
```

The path is relative to the **served directory**, not the repo root. Do not drop
the `--config` flag.

