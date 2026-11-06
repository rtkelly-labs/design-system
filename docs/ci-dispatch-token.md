# CI dispatch token — design

**Status:** proposed, not implemented. Nothing in the repo reads `CI_DISPATCH_TOKEN`
yet; this describes what to build and the token to create for it.

The whole thing hangs off a PR comment — `/update-snapshots` — so the flow it
plugs into is the one already used by hand today. That is the point: the PAT does
not introduce a new mechanism, it removes the two clicks at the end of an existing
one. See *The comment-based flow, hop by hop* below.

## The problem

`/update-snapshots` already does almost everything: it regenerates the Playwright
baselines on Linux, verifies the suite passes against them, commits them back to
the PR branch, and comments a summary. One step is missing at the end — **the
PR's own visual check keeps its previous, failing result.**

That is not a bug in the workflow. GitHub deliberately does not start workflow
runs from pushes made with `GITHUB_TOKEN`:

> When you use the repository's `GITHUB_TOKEN` to perform tasks, events triggered
> by the `GITHUB_TOKEN` will not create a new workflow run.

It exists to stop a workflow that pushes from triggering itself forever. The
consequence here is a manual "re-run" click on every re-baseline, plus — because
the commit is authored by `github-actions[bot]` — an "Approve and run" click when
the run lands in `action_required`.

Two clicks per re-baseline is not much. It is worth fixing because it is the kind
of friction that trains people to skip the step, and skipping it means merging a
PR whose visual check never actually ran against the baselines it ships.

## Why raising permissions does not help

Worth stating plainly, because it is the first thing everyone tries: this is
**not** a permissions problem. Adding `actions: write` or `contents: write` to the
workflow's `permissions:` block changes nothing. The suppression is keyed on the
*identity* of the token, not on what that identity is allowed to do. The only fix
is to push as something other than `GITHUB_TOKEN`.

## The options

| Identity | Triggers runs on push | Tied to a person | Expires | Setup |
|---|---|---|---|---|
| `GITHUB_TOKEN` | **No** — by design | No | Per job | None; already in use |
| Fine-grained PAT | Yes | Yes — yours | Yes, and silently | ~5 minutes |
| Classic PAT | Yes | Yes — yours | Optional | ~5 minutes, but scopes are coarse |
| GitHub App installation token | Yes | No | 1 hour, minted per run | ~20 minutes |

**Recommendation: a fine-grained PAT.** This is a single personal repository with
one maintainer, so "tied to a person" costs nothing real, and the fine-grained
permission model keeps the blast radius to two permissions on one repo. Reach for
a GitHub App if this ever needs to outlive your account, span several repos, or be
operated by someone else — the mechanics are in
[`actions/create-github-app-token`](https://github.com/actions/create-github-app-token),
and the rest of this design is unchanged apart from where the token comes from.

Avoid a **classic** PAT. Its narrowest useful scope is `repo`, which grants full
read/write across *every* repository you can reach — for a token whose only job is
to commit PNGs to one of them.

## The comment-based flow, hop by hop

Four hops, three of which already work. Worth drawing out because a different
identity acts at each one, and only one of them is the problem.

1. A maintainer comments **`/update-snapshots`** on the PR.
2. **`update-snapshots-command.yml`** wakes on `issue_comment`, validates the
   request, and dispatches the worker at the PR's branch.
3. **`update-snapshots.yml`** builds Storybook on Linux, writes the baselines,
   re-runs the suite against them, commits and **pushes**.
4. The push is a `pull_request` **`synchronize`** event, `ci.yml` runs, and the
   check the reviewer is looking at updates in place.

| Hop | Trigger | Acting identity | Starts a run? |
|---|---|---|---|
| Comment → command workflow | `issue_comment` | The human commenting | Yes — an ordinary event |
| Command → worker | `workflow_dispatch` via `gh workflow run` | `github.token` | **Yes** — the documented exception |
| Worker → push | `git push` | `GITHUB_TOKEN` today | **No** — this is the hop that breaks |
| Push → CI | `pull_request` `synchronize` | Whoever pushed | Only if the pusher was not `GITHUB_TOKEN` |

**Hop 2 needs no change, and that is not luck.** `workflow_dispatch` and
`repository_dispatch` are explicitly exempt from the anti-recursion rule — GitHub
treats them as deliberate calls rather than accidents, so they *always* create a
run even when fired with `GITHUB_TOKEN`. Every other `GITHUB_TOKEN`-triggered
event is suppressed. That is why the command chain works today at all, and why
this design touches exactly one hop.

**Hop 3 is the whole fix.** Give the worker's checkout the PAT (see *Design A*)
and hop 4 follows for free.

### One asymmetry that will confuse you

An `issue_comment` workflow always runs the copy of itself on the **default
branch** — never the copy on the PR branch. The worker is the opposite: it is
dispatched with `--ref <pr-branch>`, so the PR's own version of it runs.

Three consequences:

- **Editing the command workflow on a branch has no effect until it merges.** You
  cannot test a change to `/update-snapshots`' own parsing from a PR; the comment
  will keep running `main`'s copy.
- **Editing the worker workflow on a branch takes effect immediately** on that
  branch, because that is the ref being dispatched. This is where to iterate.
- That asymmetry is also a **security property**, not just an annoyance: an
  untrusted branch cannot rewrite the guard deciding who may run the command,
  because the guard that executes is always the default branch's.

Concretely right now: the `mode` parsing added in this branch lives in the
*command* workflow, so until it merges, `/update-snapshots all` on this PR
dispatches without `-f mode` and the worker falls back to its own default,
`missing`. Safe degradation — but not what the comment asked for.

## Design A — push as the PAT (recommended)

Hand the token to `actions/checkout`, which leaves it configured as the credential
`git push` uses:

```yaml
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          # Pushing as a real identity is what lets the resulting push event
          # start a CI run. With the default GITHUB_TOKEN, GitHub suppresses it.
          token: ${{ secrets.CI_DISPATCH_TOKEN }}
```

That is the entire change in `update-snapshots.yml`. The existing `git push` step
needs no edit.

**What then happens, precisely.** `ci.yml` triggers on `push` to `main` and on
`pull_request` targeting `main` — so a push to a PR branch does *not* reach it via
`push`; it reaches it as a `pull_request` **`synchronize`** event. A PAT-authored
push generates that event for real, the `pull_request` run starts, and because the
PR's check list is built from `pull_request` runs, the check the reviewer is
looking at updates in place. Both clicks disappear: the commit is attributed to a
repository collaborator rather than to a bot, so it does not land in
`action_required` either.

## Design B — re-dispatch CI explicitly (rejected)

Keep pushing with `GITHUB_TOKEN`, then ask CI to run:

```yaml
      - run: gh workflow run ci.yml --ref "$GITHUB_REF_NAME"
        env:
          GH_TOKEN: ${{ secrets.CI_DISPATCH_TOKEN }}
```

Rejected for two reasons, both worth recording so nobody re-proposes it:

1. **`ci.yml` has no `workflow_dispatch` trigger**, so this needs one added — and
   a `workflow_dispatch` trigger is a permanent invitation to run the suite on any
   ref, which is a wider change than the problem justifies.
2. **A dispatched run does not satisfy the PR's checks.** It is a `workflow_dispatch`
   run against a ref, not a `pull_request` run against the merge commit, so it
   appears in the Actions tab and nowhere near the PR. It would look like it
   worked while changing nothing about the merge gate.

Design A is also strictly less code: one input, no new trigger.

## Creating the token

1. Go to **[github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)**
   (Settings → Developer settings → Personal access tokens → **Fine-grained tokens**).
2. **Token name:** `design-system-ci-dispatch` — name it after the job, so a future
   audit of your tokens says what breaks if you revoke it.
3. **Resource owner:** `rtkelly13`.
4. **Expiration:** 90 days is a reasonable default. Longer trades rotation effort
   for a longer window if it leaks. Whatever you pick, see *Expiry is a silent
   failure* below.
5. **Repository access:** *Only select repositories* → `rtkelly13/design-system`.
   Never *All repositories* for this.
6. **Repository permissions** — only these:

   | Permission | Level | Why |
   |---|---|---|
   | **Contents** | Read and write | Push the baseline commit. This is the one that makes the push event fire. |
   | **Pull requests** | Read and write | Post the summary comment and the reaction on the PR. |
   | **Metadata** | Read-only | Mandatory; GitHub adds it automatically. |

   Leave everything else at *No access*. In particular **Actions** is not needed —
   that would only be for Design B's `workflow run` dispatch, which is rejected.

7. **Generate token** and copy it. It is shown once.
8. In the repo: **Settings → Secrets and variables → Actions → New repository
   secret**, name it exactly `CI_DISPATCH_TOKEN`, paste the value.

Store it as a **secret**, not a variable — variables are readable in logs and by
anyone with read access to the repo settings.

### Confirming it is actually set

A token exported in a shell, a dev container or an agent sandbox does **nothing**
for CI. The only place that counts is the repository's Actions secrets, and
GitHub never reveals a secret's value once saved — not through the UI, not through
the API — so "is it there" is answered by name only:

- **UI:** Settings → Secrets and variables → Actions. `CI_DISPATCH_TOKEN` should
  be listed with a *Last updated* date.
- **CLI:** `gh secret list --repo rtkelly13/design-system` prints names and
  update times.

Neither shows the value, which is the point. If the name is missing, the workflow
resolves `secrets.CI_DISPATCH_TOKEN` to an empty string and `actions/checkout`
silently falls back to `GITHUB_TOKEN` — so the job succeeds, the baselines commit,
and nothing re-runs. That failure is indistinguishable from today's behaviour,
which is why it is worth checking the name rather than inferring from a green run.

## Constraints to know before relying on it

**It cannot push workflow-file changes.** GitHub refuses writes to anything under
`.github/workflows/` from fine-grained PATs and App tokens alike (`refusing to
allow ... to create or update workflow`). Irrelevant to this design — the snapshot job only
touches `tests/__snapshots__` — but it is the reason a future job that needs to
edit a workflow will not work this way. That needs a classic PAT with the
`workflow` scope, or a human.

**Expiry is a silent failure.** When the token lapses, the push step fails with a
403 and the job goes red — recoverable, but confusing if you have forgotten the
token exists. Two mitigations: put the expiry date in a calendar reminder, and
note that GitHub emails you before a fine-grained token expires. An App token
sidesteps this entirely, being minted per run.

**Fine-grained PATs have had rough edges with the dispatch API.** Several reports
describe `workflow_dispatch` failing with *Resource not accessible by personal
access token* even with Actions write granted. Design A does not use that API, so
this does not apply — but it is another reason not to drift toward Design B.

## Security posture

The command workflow already has the two guards that make handing it a PAT
defensible, and they should not be weakened:

- **`author_association` is checked** against `OWNER`/`MEMBER`/`COLLABORATOR`, so
  an arbitrary commenter cannot trigger it. This matters more than it looks:
  `issue_comment` workflows run in the **base** repository with access to its
  secrets, so without this guard anyone able to comment could reach a job holding
  the token.
- **Fork PRs are refused** — the workflow errors out unless the PR branch is in
  this repository. A fork push target would be both useless and a way to get the
  token near untrusted code.

Beyond those:

- **Do not reuse the publishing identity.** npm releases go through Trusted
  Publishing (OIDC, no token), which is a strictly better posture. Keep it that
  way; this token must not acquire any publish capability.
- **The token can push to `main`** as far as its permissions go — branch protection
  is what stops it, not the token. Worth confirming direct-push protection covers
  your own account before adding a credential that could otherwise bypass review.
- **Rotate on suspicion, not on schedule alone.** Revoking is instant from the
  token settings page, and the only cost is one red job until it is replaced.

## Verifying it works

Do not trust this document — one run tells you:

1. On a PR, change something that alters rendering (a colour in
   `src/theme/levels.ts` is enough), and let the visual check go red.
2. Comment `/update-snapshots all` — `all` because the change is *meant* to alter
   rendering.
3. Expect: baselines committed, and **a new CI run appearing on its own**,
   attributed to you rather than `github-actions[bot]`, with the PR's visual check
   flipping to green without a click.

If the baselines commit but no run appears, the token was not used for the push —
check that `token:` is on the `checkout` step, not on the push step.

## Rolling back

Delete the `token:` line from the checkout step. Behaviour returns to exactly what
it is today: the commit lands, the check keeps its old result, and you click
re-run. Then revoke the token. Nothing else in the repo depends on it.

## References

- [GITHUB_TOKEN — GitHub Docs](https://docs.github.com/en/actions/concepts/security/github_token)
- [Triggering a workflow — GitHub Docs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- [Permissions required for fine-grained personal access tokens](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)
- [Use GITHUB_TOKEN with workflow_dispatch and repository_dispatch — GitHub Changelog](https://github.blog/changelog/2022-09-08-github-actions-use-github_token-with-workflow_dispatch-and-repository_dispatch/) — the exception hop 2 relies on
- [`actions/create-github-app-token`](https://github.com/actions/create-github-app-token) — the App-token route
- [Push from Action does not trigger subsequent action (community discussion)](https://github.com/orgs/community/discussions/25702)
- [Resource not accessible by personal access token for dispatch (community discussion)](https://github.com/orgs/community/discussions/58868)
