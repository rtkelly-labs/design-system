# design-system — workspace

The published packages live under [`packages/`](./packages). This root holds only what
belongs to the repository rather than to any one package: the workflows, the single
`pnpm-lock.yaml` a workspace install writes, `vercel.json`, and the unlicensed
[`reference/`](./reference) material that no package ships.

| Package | |
|---|---|
| [`@rtkelly13/design-system`](./packages/design-system) | The design system itself — components, the two-level theme ladder, the tokens, and the gates that hold them. Start at its [`AGENTS.md`](./packages/design-system/AGENTS.md). |

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
```

Anything narrower is a package concern: `cd packages/design-system` and use the scripts
documented in its `AGENTS.md`. CI does the same — every job sets
`working-directory: packages/design-system`, so each step reads as it did when the
package was the repository.
