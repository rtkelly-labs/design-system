# design-system — workspace

The published packages live under [`packages/`](./packages), and private applications that
consume them under [`apps/`](./apps). This root holds only what
belongs to the repository rather than to any one package: the workflows, the single
`pnpm-lock.yaml` a workspace install writes, `vercel.json`, and the unlicensed
[`reference/`](./reference) material that no package ships.

| Package | |
|---|---|
| [`@rtkelly13/design-system`](./packages/design-system) | The design system itself — components, the two-level theme ladder, the tokens, and the gates that hold them. Start at its [`AGENTS.md`](./packages/design-system/AGENTS.md). |

| App | |
|---|---|
| [`@rtkelly13/design-system-site`](./apps/site) | Private. The applied site: a Next.js App Router website built only from the package — a live homepage, the component documentation and full-page examples. Served under `/site/` of the Storybook deployment. See its [`AGENTS.md`](./apps/site/AGENTS.md). |

One package, for now. The layout is what makes a second one a normal addition rather than a
restructure — which is why it landed before there was a second package to justify it. The
report generator that prompted this is parked on its own branch: it needs public exports the
design system does not have yet, and adding them is a separate decision from moving files.

## Working in here

```sh
pnpm install                 # one install, both packages
pnpm build                   # build every package, in dependency order
pnpm -r test                 # every package's unit suite
pnpm storybook               # the design system's Storybook
pnpm site                    # build the package, then the applied site on :3000/site
pnpm build:deploy            # what Vercel builds: Storybook at /, the site at /site/, in deploy-output/
pnpm serve:deploy            # serve deploy-output/ as Vercel does (cleanUrls, trailing slash, headers) on :3200
```

Anything narrower is a package concern: `cd packages/design-system` and use the scripts
documented in its `AGENTS.md`. CI does the same — every job sets
`working-directory: packages/design-system`, so each step reads as it did when the
package was the repository.
