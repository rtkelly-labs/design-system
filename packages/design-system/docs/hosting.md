# Hosted Storybook

**Parent:** [`AGENTS.md`](../AGENTS.md)

The deployed Storybook, its domains, and the build quota that governs them.

---

## 🌐 Hosted Storybook

| URL | Serves | Vercel mechanism |
| --- | --- | --- |
| [design-system.ryankelly.dev](https://design-system.ryankelly.dev) | the `production` branch | Production domain |
| [preview.design-system.ryankelly.dev](https://preview.design-system.ryankelly.dev) | the `preview` branch | Branch domain (`gitBranch`) |

Both domains are declared **outside this repo**, in `rtkelly13/shared-utilities` at
[`infra/vercel/`](https://github.com/rtkelly13/shared-utilities/tree/main/infra/vercel) —
one Pulumi stack covering every ryankelly.dev site rather than a per-repo copy. Add or
change a domain in that repo's `sites.ts` (site key `design-system-storybook`).

Build settings stay here in `vercel.json`, and that split is deliberate: Vercel reads
`vercel.json` from the repo at build time and it **overrides** project settings, so the
shared stack declares only identity, domains and env vars. Repos own how they build.

`vercel.json` sets **`"cleanUrls": false`**. This is load-bearing for the same reason
`serve.json` is (see below): clean URLs rewrite `/iframe.html` to `/iframe`, breaking
Storybook's asset preloading and yielding an empty preview pane. Storybook is one of
the few static sites where clean URLs are actively wrong.

### Drift — production stopped updating for three days and nothing said so

`Docs/CodeTabs` landed on 8 September in #113 and was still absent from
`design-system.ryankelly.dev` three days and about thirty merged pull requests later,
along with the whole Manifesto, `Swatch`, `Card` and `DataTable`. **136 stories served
against 168 built.**

The Vercel checks were red the whole time, reading `build-rate-limit` — an account
quota, which is not a code problem and does not look like one. That turned out to be
only a third of the story: with the quota arithmetic fixed (#212), *one push* built
fine on the docs project and was still canceled on this one, second for second, on
the same commit. `Auto-expose system environment variables` had been switched off on
the storybook project, so `ignoreCommand` ran with no `$VERCEL_GIT_COMMIT_REF` and
compared `""` against `main` — skipping **every branch, production included**. Turned
back on, the next build to `main` served 174 stories again. A quiet project setting
is indistinguishable from quota from the outside, and this repo cannot see project
settings: nothing here was watching then except the tree. Nothing here is watching
now either — the estate audit (`repo-governance vercel-gating`, in `shared-utilities`)
counts what Vercel *did*: deployments created off the allowed refs, and whether the
latest Ready production build matches `origin/main`.

`pnpm check:deployed` compares the live `index.json` with a Storybook build, and
`.github/workflows/deployment-drift.yml` runs it against the `production` branch after every
release train and daily. That turns silence into a red mark someone owns, and catches a stuck
deploy within one train instead of thirty merges.

### The production domain tracks `production`, and the release train moves it

The table above said `main` until 21 September. It was wrong, and the correction has two
halves — the second of which was missed on the first pass and is the one that matters.

`shared-utilities` declares this project with **`productionBranch: 'production'`**
([`infra/vercel/sites.ts`](https://github.com/rtkelly13/shared-utilities/blob/main/infra/vercel/sites.ts)),
and `design-system.ryankelly.dev` is that project's production domain. A merge to `main`
therefore produces a *preview* deployment — which is why the GitHub deployment list shows
`Preview – design-system-storybook` for commits on `main`, all green, while the domain does not
move.

**That is deliberate.** `.github/workflows/release-train.yml` advances `production` on a
schedule, at 08:00 and 16:00 UTC, so a day of merges becomes two production builds rather than
one per merge. The Vercel account is on a build quota; this is what protects it. `production`
sitting behind `main` between trains is the design working.

### Why it was nine days behind anyway

The train had never run. The workflow and its script were written on 12 September and left
**uncommitted** on a working copy — so GitHub had no such workflow, no schedule fired, and the
pointer stayed where it was. `production` was last advanced to `583e08a`, which is, with some
irony, the commit documenting the *previous* stale-production incident.

A second fault was waiting behind the first. The train consults CI on `main` and refuses to
depart when a check has failed — and `deployment-drift` fails precisely *because* production is
behind `main`. Left in the blocking set it is a deadlock: the first train to find the site stale
refuses to move, so the site stays stale, so every later train refuses for the same reason. The
assessment said so in as many words:

```
CI Status:  failed (deployment-drift, deployment-drift)
Decision:   ⏸️ SKIP
Reason:     CI checks failed for 4bb0717. Release blocked.
```

`deployment-drift` now sits with `backup-main` in the set the train ignores: both observe the
deployment rather than judge the code.

### And a third fault behind the second

The fix above was correct and still did not move the pointer. The train held on every run, with
every other check green:

```
CI Status:  in progress (Assess & Release)
Decision:   ⏸️ SKIP
Reason:     CI checks still running for 5d46be8. Holding release train.
```

The name in that list is the train's own job. The ignore set matched on a check run's `name`,
which is the **job** name — this workflow is `Release Train` but its check reports as
`Assess & Release`, so the `release-train` entry matched nothing and the train counted itself as
a check it was waiting for. Not a timing problem: it was permanent, on every schedule, and the
run still exited 0 and reported success, which is why two green runs left production nine days
stale.

The train now excludes its own run by `GITHUB_RUN_ID` rather than by name, so a job rename
cannot silently restore the deadlock. The selection is a pure function in
`scripts/release-train-checks.mjs` with tests covering both deadlocks — the train's failure mode
is a green run that did nothing, which no other gate could see.

### And a fourth: `production` was never allowed to deploy

With all three fixed, the train departed on 23 September — `production` moved from `f7cefd3` to
`157cf3d` — and the domain still served the 21 September build. No deployment was created at all:
the GitHub deployment list went on showing only `Preview – design-system-storybook` builds of
`main`.

`vercel.json` gated creation to `main`, `preview` and `slot/*`, with `"**": false` for everything
else, and `ignoreCommand` repeated the same list. Both were written (#212) while the domain still
followed `main`; when `shared-utilities` moved it to `productionBranch: 'production'`, nothing here
added that branch. So the train could advance the pointer forever and Vercel would refuse every
push to it — the pointer moving was never evidence of a deployment.

`production` is now in both lists. Vercel reads `vercel.json` from the commit it is deploying, so
the fix reaches the domain only once a train has carried it onto `production`.

The first attempt at that (#288) broke every deployment instead. Spelling `production` out as one
more `==` took `ignoreCommand` to 279 characters; Vercel caps it at 256 and rejects the whole config
past that, so both projects failed on every commit — previews of `main` included — with nothing but
"Deployment failed". The branch list is now one anchored regex, and
`scripts/vercel-config.test.mjs` pins the length and which refs build.

The train's own health check did not notice either. It read the latest deployment of every
environment whose name contained `production` among the last 15, and the storybook project's had
long fallen out of that window behind previews — so it saw `Production – design-system`, a
different project that deploys `main`, report success, and read that as this site being healthy.

It now reads one environment, `Production – design-system-storybook`, matched exactly and asked
for with the deployments API's `?environment=` filter, so no number of previews can push it out of
view. Finding no deployment for that environment is a reason to deploy, not a quiet `SKIP`. The
selection is a pure function in `scripts/release-train-deployment.mjs`, tested beside
`scripts/release-train-checks.mjs`: another project's deployment is ignored, a missing one departs,
a failed one redeploys.

### Reading a train

`pnpm release:train --dry-run` prints the same assessment the workflow does and moves nothing —
source SHA, pointer SHA, the production deployments and their states, the CI verdict, and the
decision with its reason. It is the fastest answer to "why is the site not updating". Dispatch
the workflow with `force` to advance the pointer when the SHAs already match, which is how to
redeploy without a new commit.

**`deployment-drift` compares the live site against `production`, not `main`.** Until
26 September it compared against `main`, which made it red after nearly every merge until the
next train. That was truthful but useless: *a train is due* is the train's own question, and a
check that is red by design hides the red that is a fault. A red run now means the domain is not
serving what the pointer says: a failed or stuck Vercel build, or the account quota. It runs when
the Release Train workflow completes (`workflow_run`, because the train pushes with
`GITHUB_TOKEN` and GitHub starts no workflow from such a push) and daily.

Run locally, `pnpm check:deployed` compares against whatever you built. On `main` that answers
"what would the next train ship", and it is red between trains for the old reason.

### Why the Vercel check is not, and cannot be, a required check

The obvious guard is to make `Vercel – design-system-storybook` required. It would lock
the repository, for two independent reasons:

1. **Feature branches do not deploy at all, and that is two gates, not one.**
   `git.deploymentEnabled` in `vercel.json` refuses to *create* a deployment for any
   branch outside `main`, `production`, `preview` and `slot/N`; `ignoreCommand` is the same list
   again, as a skip for anything that reaches the build step anyway. Only the first
   one saves the quota: a skipped deployment is still created, still shows as
   canceled, and still spends one of the 100 deployments per day. Before the creation
   gate, one session of ordinary PR traffic created **83 deployments in a day, 79 of
   them canceled**.
   A required Vercel check would therefore never turn green on an ordinary branch —
   there is no check at all — and **every pull request would block forever**.
2. **A deployment happens after a merge.** There is nothing for a pull request to check:
   the deployed site cannot contain the commit under review.

Previews on every push are what broke the *quota* — 100/day is the ceiling — and the
creation gate retires them. What broke *production* was the blind `ignoreCommand`
above, which no amount of quota would have explained. Neither failure looked like the
other, and both looked like Vercel being grumpy.

So the guard sits where the answer exists: after the merge, and on a schedule.


### The components manifest

`features.componentsManifest` in `.storybook/main.ts` emits
`manifests/components.json` — every component, its props, its stories and the import line a
consumer would write:

```json
"foundations-button": {
  "name": "Button",
  "import": "import { Button } from \"@rtkelly13/design-system\";",
  "reactDocgenTypescript": { "props": { "variant": …, "size": …, "bracketed": …, "href": … } }
}
```

It was **not being produced**. Storybook 10.4 renamed the flag and defaults it to `true`; this
repo is on 10.5.5 and a real build emitted no `manifests/` directory at all. So the flag is
declared rather than relied on, and `check:docgen-props` asserts the file exists and that most
entries carry props — a manifest from an extractor that emits nothing would describe the
catalogue as propless and look authoritative doing it.

It resolves more than the docs pages do: `Button`'s union yields five props here and two on
its own page, so this is the surface worth pointing a tool at.

`@storybook/addon-mcp` would expose it over MCP. Not added — that is a decision about
exposing an endpoint, not a build setting, and belongs with whoever wants the integration.


### Cache policy — `immutable` needs a content hash in the name

`vercel.json` marks `/assets/` immutable for a year, and that is right: Vite writes
content hashes into those filenames, so `CodeBlock.stories-C4dJhlws.js` either is the
byte-for-byte file the build produced or does not exist.

`/sb-manager/` and `/sb-addons/` were marked the same way and must not be. Storybook
writes those unhashed — `sb-manager/runtime.js`, `sb-addons/docs-1/manager-bundle.js` —
so a year of `immutable` pins a visitor to whichever manager build they happened to load
first, with no revalidation and no way to shift it. They are now
`max-age=0, must-revalidate`: one conditional request each, a 304 in the ordinary case.

Three things are deliberately left alone:

- **`/assets/` stays immutable.** Hashed names, and this is where the bytes are.
- **HTML needs nothing.** Vercel already serves `/` and `/iframe.html` as
  `public, max-age=0, must-revalidate`, so the files that map story ids onto hashed
  chunk names revalidate on their own. Worth checking rather than assuming — it is what
  decides whether a stale chunk name can survive a reload.
- **`/sb-common-assets/` stays immutable** even though those names carry no hash. It is
  the Nunito Sans woff2 files and the favicon; a font's bytes do not change under a
  fixed filename, and revalidating six of them on every load buys nothing.

The failure this produces is worth recognising, because it reads as a broken build: a
client holding an old chunk map asks for an `/assets/` filename that the current
deployment never wrote, and Storybook reports `Failed to fetch dynamically imported
module` with a configuration hint. Hashes differ per build, so any stale mapping 404s. A hard
reload clears it. Note that a branch alias — `preview`, or a PR's own URL — repoints to
each new deployment, so a tab left open across two pushes can hit this with no cache
misconfiguration involved at all.

`preview` is a long-lived branch, not a per-PR URL. A Vercel branch domain maps to
exactly one branch; individual PRs still get their own generated `*.vercel.app` URLs.
To promote work to the preview site, merge it into `preview`.

### Composition

The blog's Storybook is composed into this one's sidebar as **`ryankelly.dev (site)`**,
so one URL answers both "what does the system provide" and "what does the site do with
it". It is driven by `STORYBOOK_REF_BLOG_URL` in `.storybook/main.ts`, not hardcoded:
the URL differs per environment, and an unreachable ref renders as a permanently
erroring sidebar entry. Unset — the default for `pnpm storybook` locally — composes
nothing.

Composition is resolved **in the browser**, which has two consequences worth knowing
before debugging it:

- The composed Storybook must send `Access-Control-Allow-Origin` on `/index.json`;
  the manager fetches it cross-origin. It also probes `stories.json` and
  `metadata.json`, which no longer exist in Storybook 10. Those failures are
  harmless — composition works from `index.json` alone — but they surface as
  **CORS errors, not 404s**, if the composed origin scopes its
  `Access-Control-Allow-Origin` to `/index.json`: the browser blocks the response
  before the status is readable. The blog's `storybook-site/vercel.json`
  therefore sets the header on all paths, which keeps the console clean.
- The ref URL is baked into the manager bundle at **build** time, so changing
  `STORYBOOK_REF_BLOG_URL` requires a redeploy, not just a reload.

The blog's Storybook is deployed by a second Vercel project reading
`storybook-site/vercel.json` in the blog repo, declared in the shared stack as
`blog-storybook`. That project needs **"Include source files outside of the Root
Directory in the Build Step"** ticked by hand — the Vercel provider does not expose it.

Both repos are on Storybook 10 — this one on 10.5, the blog on 10.4 — so host and
ref agree on the `index.json` v5 format the manager reads. That was not true when
this was written: #23 aligned them precisely so composition would not depend on
cross-major tolerance. Keep them on the same major; see
[`docs/evaluation.md`](./evaluation.md).


