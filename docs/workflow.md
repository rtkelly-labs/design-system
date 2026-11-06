# Workflow and repository conventions

**Parent:** [`AGENTS.md`](../AGENTS.md)

The rules in `AGENTS.md` § *Conventions*, with the reasoning and the incidents behind each one.

---

## 🛑 Repository Conventions & Workflow Policy

1. **Squash Merge Only**: All pull requests must be merged into `main` using **Squash and Merge** exclusively.
2. **Delete Branch on Merge**: Feature branches must be automatically or manually deleted immediately upon merge into `main`.
3. **Linear History**: Maintain a strictly linear history. Rebase feature branches onto `main` before merging; no merge commits allowed.
4. **Publishing (npm, trusted publishing)**:
   - Stable releases publish automatically from pushes to `main` via `publish-package.yml`, using npm **Trusted Publishing** (OIDC) — no tokens anywhere. Bump `package.json` version in the PR; the workflow skips already-published versions.
   - Dev prereleases: comment **`/publish-dev`** on a PR to publish `<version>-dev.<pr>.<sha>` under the `dev` dist-tag (`publish-dev-command.yml` dispatches the trusted workflow on the PR branch). Consumers test with `pnpm add @rtkelly13/design-system@dev`.
   - The Tailwind contract consumers import is **`theme.css`** (`@theme` tokens, per-level and polarity variants, `@source`) — now **generated** from `src/theme/levels.ts`; `styles.css` layers fonts + global resets on top. There is no JS tailwind preset — do not reintroduce one.
5. **Visual Regression Testing** — the standards, the determinism contract and the operating instructions live in [`docs/visual-regression.md`](./visual-regression.md); these are the rules:
   - Powered by Playwright snapshot testing (`tests/visual.spec.ts`).
   - Runs strictly on **Linux CI** to avoid OS font rendering diffs. Tolerance is `maxDiffPixels: 0` with `threshold: 0.2`, and **this suite does not gate colour**. `maxDiffPixels` bounds how many pixels may count as different; `threshold` decides whether a pixel counts at all. `threshold: 0` was tried and failed 21 snapshots on unchanged code — and no other number works either: catching a brand accent moving `#ec4899` → `#f955a4` needs below 0.0023, absorbing a 10% anti-aliasing shift on a high-contrast edge needs above 0.0042, and those overlap. Arithmetic gates colour (`check:contrast`, including `auditHueAgreement`); this suite gates structure. #125 has the working. It was `maxDiffPixelRatio: 0.05`, which let ~46,000 pixels of a 1280x720 shot differ freely and was only ever exercised against a placeholder image. Raise it only to the smallest number a real run demands, and say which story forced it.
   - **Clean URLs must stay off in the static server.** `serve` enables them by default, which 301s `/iframe.html?id=<story>` to `/iframe` and **drops the query string**. Storybook then has no story to select and renders its "No Preview" placeholder — and because `--update-snapshots` will happily bake that placeholder in as the baseline, the whole suite silently passes while testing nothing. That is exactly what happened up to `0.0.5`: all five baselines were the same error page. Both Playwright configs therefore pass `--config ../serve.json`, which sets `cleanUrls: false`; see "`serve.json` is load-bearing" below. `tests/story-ready.ts` is the second line of defence, asserting on Storybook's `sb-show-main` / `sb-show-nopreview` / `sb-show-errordisplay` body classes so a non-render fails loudly rather than being screenshotted.
   - Run manual snapshot updates via GitHub Actions `Update Visual Regression Snapshots` workflow (dispatch it on your branch; it commits regenerated baselines back to that branch — this repo blocks Actions from creating PRs).
   - **The update runs in `missing` mode by default**, writing only baselines that do not exist. That matters: a bare `--update-snapshots` presets to `changed`, so a run intended to add one new story would also re-record every baseline whose render had drifted — which is exactly how a regression becomes the expectation. Say **`/update-snapshots all`** (or `changed`) when a change is *meant* to alter rendering; the mode is echoed back in the PR comment so a reviewer can tell "two added" from "everything re-recorded".
   - Note that the snapshot workflow pushes as `github-actions[bot]`, and CI runs on bot-authored commits land in **`action_required`** — they need an "Approve and run" click before the PR shows a green check.
6. **Required Checks** — all of these run on every PR, spread across three
   parallel jobs in `ci.yml`; see § *CI Shape* for which job runs what and why.
   Branch protection requires the single aggregate check named **`ci`** (the
   `verify` job), which passes only if all three jobs do. That name is
   deliberately content-free, and **must stay that way**: the string is what
   branch protection and `shared-utilities`' governance map match on. It used to
   list what CI did, and splitting the single job into three silently rewrote it
   — the map went on requiring a job that no longer reported, so every PR failed
   `repo-governance verify-pr-checks` with all seven checks green. Rename the
   three jobs below freely; never rename `ci`:
   - `pnpm tokens:check` (theme.css matches `src/theme/levels.ts`)
   - `pnpm tokens:design:check` (the DTCG export in `tokens/` is neither stale nor orphaned)
   - `pnpm check:contrast` (every role pair, every level)
   - `pnpm check:docs` (figures written in prose against the source they describe)
   - `pnpm check:doc-snippets` (props and level names in documentation code fences,
     against `api/index.d.ts`)
   - `pnpm check:skills` (the agent-facing `skills/**/SKILL.md` tree parses, frontmatter
     included — `@tanstack/intent`'s validator)
   - `pnpm check:component-docs` (every component carries a JSDoc — a ratchet)
   - `pnpm check:component-contract` (refs, displayName, recipe, prop spreading — per clause)
   - `pnpm check:licences` (every shipped package against a default-deny baseline)
   - `pnpm check:lint-budget` (the general-purpose ruleset, as a per-rule ratchet)
   - `pnpm test:a11y` (axe over every asserted story, on both Levels)
   - `pnpm lint` (colour-instead-of-role, reported at the site)
   - `pnpm check:css` (styling-in-CSS ratchet)
   - `pnpm check:tokens` (hue-named call sites, budget 0)
   - `pnpm ansi:check` (terminal slot coverage and the committed fixture diff)
   - `pnpm check:fonts` (every self-hosted family reachable from a `--ds-font-*` stack)
   - `pnpm check:deps` (dependency reasons, sections and usage)
   - `pnpm check:governance` (this list, and the rest of the rules on this page)
   - `pnpm check:visual-coverage` (every story asserted or excluded with a reason)
   - `pnpm check:docgen-props` (every documented component publishes its props)
   - `pnpm check:story-conventions` (title vocabulary, and an autodocs decision per component)
   - `pnpm typecheck`
   - `pnpm test` (unit — see "Unit Tests" below)
   - `pnpm build`
   - `pnpm check:api` (the published type surface matches `api/index.d.ts`)
   - `pnpm build-storybook`
   - `pnpm test:visual` (Linux CI)

   This list is a copy of what `ci.yml` runs, introduced with the words "all of
   these run on every PR", and four of thirteen entries were missing when
   `check:governance` was written — `check:tokens`, `ansi:check`, `check:fonts`
   and `tokens:design:check`, the last of which ran nowhere at all. `check:docs`
   made it five: it landed in #146 with a row in `docs/ci.md`'s table and no
   entry here, which is the first thing this gate caught on the change that
   followed it. The gate now
   compares this list, the table in `docs/ci.md` and the workflow itself, in
   both directions. Adding a gate means adding it in three places, and the third
   is a required check rather than a courtesy.
7. **New Components Need Baselines**: adding a story without a snapshot leaves
   `test:visual` unable to assert it. Add the story and its `CASES` row, comment
   **`/update-snapshots`** on the PR to generate the baseline, then push.
   `missing` mode writes only what does not exist, so this cannot re-record an
   existing baseline that has drifted.
   Note that Playwright reports a test that *creates* a baseline as failed, on
   purpose — `missing` mode attaches a soft error so a new baseline is never
   silent. So the update workflow's generate step is expected to exit non-zero
   whenever it does its job, and tolerates it; the **verify** step that follows,
   which re-runs the suite with no update flag, is the gate that decides whether
   the baselines get committed.
   This is not a convention you have to remember: `pnpm check:visual-coverage`
   reads Storybook's own build index and fails when a **component** has no
   asserted story and no `EXCLUDED` entry giving a reason. The budget is **0** and
   should stay there.
   It counts components, not stories, and that distinction is the rule: the suite
   asserts **one representative story per component**, because every row is a
   committed PNG a human reviews whenever it changes, so breadth across
   components is worth more than depth within one. A second story on a covered
   component is therefore free — the old story-counting budget got angrier at it
   while coverage improved not at all. It also catches the reverse: an `id` in the
   spec that Storybook no longer builds, i.e. a test asserting nothing.
   `tests/visual.spec.ts` is a table for this reason — adding a component means
   adding a row, and the id appears exactly once.
8. **Re-baselining Happens In The PR**: any change that legitimately alters
   rendering turns the visual check red. Comment **`/update-snapshots`** on the
   PR — it regenerates on Linux, verifies the suite passes against the new
   baselines, commits them back to the branch, and reports what changed. No
   merge required. `workflow_dispatch` still works for baselining `main`.
   Caveat: the baseline commit is pushed with `GITHUB_TOKEN`, and GitHub does
   not start workflow runs from those pushes, so the PR's own visual check keeps
   its previous result until you re-run it or push again. The verification step
   inside the update run is what tells you the new baselines are good.
   Closing that last gap needs a push identity that is not `GITHUB_TOKEN` —
   designed, with the exact token to create, in
   [`docs/ci-dispatch-token.md`](./ci-dispatch-token.md). Not implemented;
   nothing reads `CI_DISPATCH_TOKEN` yet.
9. **Every CI Job Has A Ceiling, And Browser Installs Retry**: a job with no
   `timeout-minutes` inherits GitHub's six-hour default, and a run killed at
   that limit is reported as **`cancelled`**, not failed — a red mark that
   names no step and suggests someone pressed a button. That is exactly how
   `main` went red on `dafbc1f`: `playwright install --with-deps` hung on both
   `ci.yml` and `storybook-walkthrough.yml`, burned six hours each, and a
   manual re-run of the identical SHA passed in two minutes. So: every job
   carries a `timeout-minutes`, and the browser install goes through
   [`.github/actions/install-playwright`](../.github/actions/install-playwright/action.yml),
   which bounds each attempt with `timeout` and retries once. Use `pnpm exec`,
   never `npx`, for anything Playwright: `npx` falls back to fetching the
   latest published CLI, and a Playwright other than the lockfile's installs a
   different Chromium — which under `maxDiffPixels: 0` moves every baseline
   rather than failing loudly. Related: `if: always()` on an upload step also
   fires on cancellation, so paired with `if-no-files-found: error` it turns
   every cancelled run into a failing step. Use `if: success() || failure()`.


10. **Direct Push Protection**: direct pushes to `main` are blocked; every change
    arrives as a pull request. This is the rule the other nine hang off — squash
    merge, linear history and the required check are all settings on a branch
    nothing can bypass. Note the one legitimate bot push, `update-snapshots.yml`
    committing baselines back to a *feature* branch, which is why rule 8's caveat
    exists rather than an exception here.
11. **Local Temp & Worktree Directory**: temporary files, local databases, scratch
    files and git worktrees go in the root `/temp/` directory, which is gitignored.
    One ignored directory rather than a growing list of patterns: a worktree is a
    full checkout, and the first time one lands somewhere else the diff is the
    entire repository. `/temp/` and `temp/` are both ignored, because a worktree
    created from inside a worktree resolves the path differently.
12. **Gitignored Local TODO File**: a root `TODO.md` MUST exist for local task
    tracking and MUST be gitignored (both `TODO.md` and `todo.md`, for a
    case-insensitive filesystem). It is a scratchpad, not a plan of record —
    anything that outlives a session belongs in an issue, and anything that
    explains a decision belongs in `docs/`. Committing it turns a private working
    list into a document reviewers are entitled to read as intent.
13. **Auto-Merge Enabled**: PRs may enable auto-merge (squash). Safe only because
    rule 6 makes `ci` a single aggregate check that is *required* — auto-merge
    waits on required checks, so an unrequired check going red would be merged
    straight past. That is the load-bearing relationship between these two rules,
    and it is why `verify` runs with `if: always()`: a skipped required check is
    indistinguishable from one still running, and auto-merge would wait forever.
14. **Pinned Action SHAs**: workflows MUST reference third-party actions by
    40-character commit SHA, never a mutable tag, with the version in a trailing
    comment (`uses: actions/checkout@11d5960… # v4.4.0`). A tag is a promise that
    someone else's future commit will run with this repository's `GITHUB_TOKEN`,
    against a tree that can publish to npm through Trusted Publishing — and `v4`
    is a *moving* ref, retagged by its author whenever they choose. This rule was
    written early and honoured in exactly one workflow: when `check:governance`
    was added it found 24 of 25 sites on a mutable tag, four months after the
    rule was recorded. Local actions (`./.github/actions/*`) are this repository
    and need no pin. One action, one SHA, repo-wide — two different SHAs for the
    same action means a bump landed in some workflows and not the rest, which is
    how the pinned one goes stale unnoticed. `check:governance` enforces all of
    it, including the trailing comment: a bare SHA cannot be reviewed or bumped
    without archaeology.
