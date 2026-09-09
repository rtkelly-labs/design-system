# Hosted Storybook

**Parent:** [`AGENTS.md`](../AGENTS.md)

The deployed Storybook, its domains, and the build quota that governs it.

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


