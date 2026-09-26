# CI shape and the screenshot walkthrough

**Parent:** [`AGENTS.md`](../AGENTS.md)

Which job runs what and why, and how to review what a change looks like.

---

## ⚙️ CI Shape

`ci.yml` runs **four jobs in parallel**, then a fifth that reports their
combined verdict.

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

Only `visual` installs a browser, so only its ceiling has to clear
`install-playwright`'s retry budget (rule 9). Splitting the job is what let the
others drop to a ceiling sized to their own work, instead of every gate
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
- **`visual` reuses a verdict its inputs already earned.** Its first step hashes
  every tracked file that can reach the job's result (`scripts/render-inputs.mjs`,
  default-deny; `--list` prints what it leaves out and why) and, on a pull request,
  looks that hash up as a cache key. A hit skips everything after checkout, which is
  the whole ~5 minutes; a full pass records one. `main` never looks up and always
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
  repo can least afford. Browsers are **not** here — that is
  `install-playwright`, so only the two jobs that drive a browser pay for it.
- **`.github/actions/install-playwright` now caches the download** as well as
  bounding and retrying it (rule 9). 13 of that step's 25 healthy seconds were
  spent fetching ~300MB that never changes until the lockfile does, which is
  also why the cache keys on `pnpm-lock.yaml`: the browser revision is pinned by
  the Playwright version in there, so a lockfile change is exactly when a cached
  browser stops being the right one. Only the download half is cacheable — the
  `--with-deps` apt half installs outside the cached directory, so a cache hit
  still runs `install-deps`, through the same retry loop, since that reaches the
  network too. Assuming the runner image carries those libraries would trade a
  red required check for ten seconds.
- **`ci.yml` supersedes in-flight PR runs** (`concurrency`), as the walkthrough
  already did. The group includes the event name so rule 8's manual
  `workflow_dispatch` re-run is never cancelled by a push or queued behind one.

Not done, and the largest lever left: **re-run only the stories a change can
reach.** The verdict cache above is all-or-nothing. Replaying the last 100 merged
PRs against the story import graph, 80 touched a rendering input; 27 of those
touched something every story depends on (the lockfile, the theme ladder, the
Storybook preview, a stylesheet), and the other 53 reached a median of **5 of
119** asserted stories (p90 37). Scanning only those would be ~40% of today's
visual and a11y work on rendering PRs, ~32% across all PRs. It needs a per-story
key rather than a per-tree one, with snapshot files and `CASES` rows mapped to
their story, and `main` still running everything as the check on the graph.

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
`Foundations/Theme Ladder → AllLevels` renders all four rungs in one screenshot
and is now a `CASES` row, so a token change that reads fine on `midnight` and is
unusable on `sketch` fails a required check rather than merely showing up in a
report nobody opened.

Two structural choices worth keeping:

- **One test per story, not per story-and-level.** The report lists tests, so a
  row is a component and opening it shows all four levels together — which is
  the comparison worth making. Splitting by level quadruples the rows and
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


