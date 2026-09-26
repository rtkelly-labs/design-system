# AGENTS.md

Foundational brutalist design system for ryankelly.dev and personal web applications (`@rtkelly13/design-system`, published to public npm).

Package manager is **pnpm** (`node >=22`).

## Commands

Everything is a `pnpm` script; these are the ones whose names do not give them away.

| | |
|---|---|
| `pnpm tokens:build` | regenerate `src/theme.css` from `src/theme/levels.ts` — **required after any colour change** |
| `pnpm tokens:check` | fail if that generated file is stale |
| `pnpm tokens:design` | regenerate `tokens/palette.<level>.tokens.json` — the DTCG export |
| `pnpm tokens:design:check` | fail if a token file is stale **or orphaned** |
| `pnpm check:contrast` | every role pair on every level, as arithmetic |
| `pnpm check:docs` | figures written in prose against the source they describe — `--list` for the census |
| `pnpm check:skills` | the agent-facing skills tree (`skills/**/SKILL.md`) parses and its frontmatter is schema-valid |
| `pnpm check:doc-snippets` | props and level names in documentation code fences against `api/index.d.ts` |
| `pnpm check:component-docs` | every component carries a JSDoc — a ratchet, budget **12** |
| `pnpm check:component-contract` | refs, `displayName`, `recipe`, prop spreading — a per-clause ratchet |
| `pnpm check:licences` | every shipped package against `licenses.baseline.json`, default-deny |
| `pnpm check:reference-material` | unlicensed reference artwork stays out of the tree, and its catalogue stays in it |
| `pnpm check:lint-budget` | `react-hooks`, `jsx-a11y` and `no-explicit-any` as a per-rule ratchet |
| `pnpm check:api` | the built type surface against the committed `api/index.d.ts` |
| `pnpm check:dep-cost` | what each runtime dependency costs a consumer, against the recorded baseline — `--list` for the table |
| `pnpm check:governance` | the repo's own rules: pinned SHAs, job ceilings, every gate wired, `rule N` resolving — `--list` for the census |
| `pnpm check:visual-coverage` | every component has an asserted story, or a stated reason |
| `pnpm check:docgen-props` | every documented component publishes its props, and the components manifest carries them |
| `pnpm check:story-conventions` | story title vocabulary, and an autodocs decision per component |
| `pnpm check:story-docs` | what a component page actually tells a reader — docs page, description, three samples, story captions, prop docs. A ratchet, ceiling **41** |
| `pnpm check:deployed` | the live Storybook against this build — deliberately **not** a PR gate |
| `pnpm ci:history` | where CI's minutes go: p50/p90 per job and step over recent runs, from GitHub's own timings — not a gate |
| `pnpm release:train --dry-run` | why the last train did or did not depart — assessment only, moves nothing |
| `pnpm check:tokens` | hue-named call sites, budget **0** — a colour is addressed by its job |
| `pnpm ansi:check` | terminal slot coverage **and** the committed fixture diff |
| `pnpm test:leaks` | the unit suite shuffled with no per-file isolation, N times — the detector `isolate: false` stands on; not a gate |
| `pnpm test:visual` | Playwright snapshots — **Linux only**, see [`docs/visual-regression.md`](./docs/visual-regression.md) |
| `pnpm test:a11y` | axe over every asserted story, on both Levels |
| `pnpm walkthrough` | screenshot every story on every level, for review rather than assertion |

`pnpm lint` reports colour literals at the site that wrote them; in CI its errors are read out of `check:lint-budget`'s pass rather than a second one. `pnpm check:deps`,
`pnpm check:css` and `pnpm check:fonts` are ratchets with stated budgets.

## The five rules that are not discoverable

Everything else here you can find by reading the code. These five you cannot, and each has
cost real time:

1. **`src/theme.css` is generated.** `src/theme/levels.ts` is the only place a level name or a
   level colour is written. Edit that, run `pnpm tokens:build`, commit both.
2. **A token varies by Level or by Medium, never both.** Colour varies by Level and is picked at
   runtime; geometry and time vary by Medium and are picked at build time. `src/theme/media.ts`
   is the second axis, `theme.css` carries only the `web` Medium, and the prefixes do not
   overlap — `--ds-text-primary` is an ink, `--ds-type-body` is a size. See
   [`docs/adr/0004-two-axes-level-and-medium.md`](./docs/adr/0004-two-axes-level-and-medium.md).
3. **Colours are addressed by role, never by hue.** A component says `bg-surface-raised` or
   `text-intent-danger`, not `cyan`. See
   [`docs/adr/0001-hues-declared-below-roles.md`](./docs/adr/0001-hues-declared-below-roles.md)
   for why a hue layer exists anyway, and why components still may not touch it.
4. **There is exactly one interaction-primitive library, and it is `@base-ui/react`.** Adopt no
   second focus, popup, or keyboard-management library — two focus-management implementations in
   one tree is worse than either alone, and this rule bounds the churn the choice accepts. A
   component that needs interaction primitives reaches for Base UI or hand-rolls them; it never
   brings in a package that carries its own focus model. That bars `radix-ui` and anything
   depending on it, which includes `cmdk` (16 `@radix-ui/*` packages transitively).
   Headless state engines (`@tanstack/react-table`, `@tanstack/react-virtual`) and rendering-only
   chart engines (`@visx/*`, `@microcharts/react`) are separate concerns: they may compute or emit
   chart geometry, but they must not own focus, popups, keyboard handling, or chart interactions.
   Components own the accessible wrapper and interaction contract. The chart boundary and package
   rationale live in [`docs/adr/0005-chart-rendering-engines.md`](./adr/0005-chart-rendering-engines.md).
   Measured comparison of the interaction layer remains in [`docs/radix-vs-base-ui.md`](./radix-vs-base-ui.md).

5. **Merging to `main` does not deploy. The release train does.** The production domain follows
   the `production` branch, and only `.github/workflows/release-train.yml` advances it — on a
   schedule, at **08:00 and 16:00 UTC**, batching the day's merges into two deployments instead
   of one per merge. That is the whole point of it: the Vercel account is on a build quota, and
   merging ten times before lunch used to mean ten production builds.

   So `production` being behind `main` is the normal state between trains, not a fault. What
   *is* a fault is it being days behind — that means no train has departed, and the run log is
   where to look.

   The train holds rather than deploys when a deployment is already in progress, when CI on
   `main` failed, or when CI is still running. It departs when the pointer has drifted, when the
   deployed SHA is behind `main`, or when the last production deployment failed. To send one
   early, dispatch the workflow; `dry_run` prints the assessment and moves nothing, `force`
   advances the pointer even when the SHAs already match. `pnpm release:train --dry-run` runs
   the same assessment locally and is the fastest way to find out why a train did not depart.

   Two checks are deliberately excluded from the CI it consults — `deployment-drift` and
   `backup-main` — because they observe the deployment rather than judge the code. Leaving
   `deployment-drift` in could deadlock: it fails when the live site is behind the pointer, and
   a redeploy is what fixes that.

## Where things are written down

Load these when the task is in them, not before.

| Topic | |
|---|---|
| **The brand outline — start here** | [`DESIGN.md`](./DESIGN.md) |
| **Is the system complete? The 1.0 capability matrix** | [`docs/capability-readiness.md`](./docs/capability-readiness.md) |
| The vocabulary in plain terms, if the glossary reads as jargon | [`docs/orientation.md`](./docs/orientation.md) |
| Domain vocabulary | [`CONTEXT.md`](./CONTEXT.md) |
| Architectural decisions | [`docs/adr/`](./docs/adr/) |
| Theming — the ladder, semantic roles, selection state | [`docs/theming.md`](./docs/theming.md) |
| What a theme declares, and what it can emit | [`docs/theme-taxonomy.md`](./docs/theme-taxonomy.md) |
| Where the base palette came from, and how it was solved | [`docs/palette-provenance.md`](./docs/palette-provenance.md) |
| Retired colours, and the five design eras | [`docs/colour-heritage.md`](./docs/colour-heritage.md) |
| Styling in TSX, and the CSS ratchet | [`docs/styling.md`](./docs/styling.md) |
| Rendering deterministically — for capture, print, video | [`docs/deterministic-rendering.md`](./docs/deterministic-rendering.md) |
| Visual regression — determinism contract, operating instructions | [`docs/visual-regression.md`](./docs/visual-regression.md) |
| CI shape, and the screenshot walkthrough | [`docs/ci.md`](./docs/ci.md) |
| Evidence on a PR — design, not yet built | [`docs/evidence-pipeline.md`](./docs/evidence-pipeline.md) |
| Unit tests | [`docs/testing.md`](./docs/testing.md) |
| The published API surface | [`docs/api-surface.md`](./docs/api-surface.md) |
| Dependencies, and the ones held back | [`docs/dependencies.md`](./docs/dependencies.md) |
| Hosted Storybook, its domains, and the release train | [`docs/hosting.md`](./docs/hosting.md) |
| Workflow conventions, with the incidents behind them | [`docs/workflow.md`](./docs/workflow.md) |
| Outside reading, and what each idea changed here | [`docs/research.md`](./docs/research.md) |
| **Third-party reference material — licensing** | [`docs/reference-material.md`](./docs/reference-material.md) |

Standing analysis, written once and still true:
[`docs/surface-readiness.md`](./docs/surface-readiness.md),
[`docs/evaluation.md`](./docs/evaluation.md),
[`docs/gap-analysis.md`](./docs/gap-analysis.md) and
[`docs/storybook-benchmarks.md`](./docs/storybook-benchmarks.md) — the published
Storybook measured against seven public design systems, with the plan it produced.

---

## 🛑 Repository Conventions & Workflow Policy

Rule statements only. The reasoning, and the incidents that produced each one, are in
[`docs/workflow.md`](./docs/workflow.md) — read that before changing any of them.

**The numbering is shared.** Rule *n* here is rule *n* there, and workflow comments cite rules
by number. The two lists had drifted to eleven rules and nine, which silently re-pointed every
citation — nine sites cited "rule 9" for the timeout ceiling while rule 9 here was *Publishing*.
`pnpm check:governance` now fails if the numbers or the titles disagree, or if a `rule N`
citation names a rule that does not exist.

1. **Squash Merge Only**: all pull requests merge into `main` using **Squash and Merge**.
2. **Delete Branch on Merge**: feature branches are deleted immediately on merge.
3. **Linear History**: rebase onto `main` before merging; no merge commits.
4. **Publishing**: stable releases publish from `main` via npm Trusted Publishing — no tokens. Bump `package.json` in the PR. Comment `/publish-dev` for a prerelease.
5. **Visual Regression Testing**: Playwright snapshots, **Linux CI only**, `maxDiffPixels: 0` — and this suite does **not** gate colour; arithmetic does.
6. **Required Checks**: branch protection requires the single aggregate check named **`ci`**. That name is content-free and **must stay that way** — `shared-utilities` governance matches on the string.
7. **New Components Need Baselines**: a story without a snapshot asserts nothing. `pnpm check:visual-coverage` is the gate, and its budget is **0**.
8. **Re-baselining Happens In The PR**: comment `/update-snapshots` — say `all` when the change is *meant* to alter rendering, and name the story that forced it.
9. **Every CI Job Has A Ceiling**: every job carries `timeout-minutes`, browser installs go through `./.github/actions/install-playwright`, and an upload step uses `if: success() || failure()`, never `always()`.
10. **Direct Push Protection**: direct pushes to `main` are blocked; PRs required.
11. **Local Temp & Worktree Directory**: temporary files, local databases, scratch files and git worktrees go in the root `/temp/` directory (gitignored).
12. **Gitignored Local TODO File**: a root `TODO.md` file MUST exist for local task tracking and be gitignored.
13. **Auto-Merge Enabled**: PRs may enable auto-merge (squash).
14. **Pinned Action SHAs**: workflows MUST use 40-character commit SHAs with the version in a trailing comment, not mutable tags. `pnpm check:governance` enforces it.
