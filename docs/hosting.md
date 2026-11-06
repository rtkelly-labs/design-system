# Hosted Storybook

**Parent:** [`AGENTS.md`](../AGENTS.md)

The deployed Storybook, its domains, and the build quota that governs them.

---

## 🌐 Hosted Storybook

| URL | Serves | Vercel mechanism |
| --- | --- | --- |
| [design-system.ryankelly.dev](https://design-system.ryankelly.dev) | `main` | Production domain |
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

`pnpm check:deployed` compares the live `index.json` with this build, and
`.github/workflows/deployment-drift.yml` runs it on pushes to `main` and daily. That
turns silence into a red mark someone owns, and catches drift within one merge instead
of thirty.

### Why the Vercel check is not, and cannot be, a required check

The obvious guard is to make `Vercel – design-system-storybook` required. It would lock
the repository, for two independent reasons:

1. **Feature branches do not deploy at all, and that is two gates, not one.**
   `git.deploymentEnabled` in `vercel.json` refuses to *create* a deployment for any
   branch outside `main`, `preview` and `slot/N`; `ignoreCommand` is the same list
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


