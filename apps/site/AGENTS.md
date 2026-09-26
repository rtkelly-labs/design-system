# AGENTS.md — @rtkelly13/design-system-site

The applied design-system website: a Next.js App Router site built only from
`@rtkelly13/design-system`. It has a homepage of live demos and component docs.
It is private, it is not published, and **nothing deploys it**.

It is also the repo's one real Next.js consumer. It is where Server Components,
client boundaries, SSR and hydration are tested against the package's built
`dist/`, so a change that passes every package gate but breaks a consumer fails the
`site` job in `ci.yml`.

Package manager is **pnpm** (`node >=22`). See the [root README](../../README.md)
for the workspace, and [`packages/design-system/AGENTS.md`](../../packages/design-system/AGENTS.md)
for the rules the site follows as a consumer: Base UI is the only interaction
library, and colour is addressed by role, never by hue.

## Commands

The package must be built first (`pnpm --filter @rtkelly13/design-system build`,
or `pnpm site:build` from the root). The site resolves it through its exports
map, as an npm consumer would.

| | |
|---|---|
| `pnpm dev` | generate docs data, then `next dev` on :3000 |
| `pnpm build` | generate docs data, then the static export to `out/` |
| `pnpm start` | serve `out/` on :3100 with `npx serve` |
| `pnpm generate` | rewrite `src/generated/docs-data.json` from the package (gitignored) |
| `pnpm lint` | typescript-eslint, `react-hooks` and `jsx-a11y`, with zero warnings allowed |
| `pnpm check:tokens` | the package's published `scanTokenRules` over `src/`, budget 0 |
| `pnpm typecheck` | generate, then `tsc --noEmit` |

## Rules that are not discoverable

1. **Server Components import the package through `src/ds.ts`, never directly.**
   The package has no `"use client"` boundary, so any import from a Server
   Component fails the build (issue 305). `ds.ts` is that boundary. Its exports
   are named, because Next rejects `export *` there. Add a name the first time
   you use it. Files starting with `'use client'` (every example) import the
   package directly.
2. **Examples are files, not strings.** A page example is a component under
   `src/examples/<page>/<name>.tsx`, registered in `src/examples/index.ts`. The
   preview mounts it and the code block prints the same file, highlighted at
   build time. Never paste a snippet into page metadata.
3. **Nothing about the package is hand-written.** Props tables, the catalogue,
   the component categories and the nav vocabulary come from
   `scripts/generate-docs-data.mts`. It runs react-docgen-typescript with
   Storybook's options and reads story titles plus `.storybook/sidebar.ts`. When a
   table looks wrong, fix the package's JSDoc or types, not the site. The
   `SHIMS` table there is the one exception, and each entry names its issue.
4. **One registry.** `src/content/registry.ts` builds the sidebar, pager order,
   contents rail and search index from the page definitions in
   `src/content/`. Headings are rendered from the same definitions, so an id
   cannot drift from its anchor.
5. **Fake data is seeded.** `src/data/fixtures.ts` uses a fixed seed and a
   fixed epoch, and formats dates by hand in UTC. No `Math.random`,
   `Date.now` or `toLocaleString` anywhere a render can reach, because each is a
   hydration mismatch and an unstable screenshot.
6. **Do not add `serve` to any workspace `package.json`.** The package's
   Playwright configs start `npx serve`, and once `serve` is in the lockfile
   `npx` stops fetching it and finds no binary in `packages/design-system`, so
   `test:a11y` fails with `serve: command not found`.
7. **When the package can't express something, record it before working
   around it.** Open an issue on `rtkelly13/design-system` with a repro, then
   put the smallest site-local workaround in place with a comment naming the
   issue. The current ones are 305, 306, 308, 309, 310, 311 and 312.

## Adding a component page

1. Write the examples under `src/examples/<slug>/` and add them to `src/examples/index.ts`.
2. Add `src/content/components/<slug>.ts` (a `ComponentPageDef`: lede,
   examples, the components whose props to show, accessibility notes and keys).
3. Add it to `COMPONENT_PAGES` in `src/content/registry.ts`. The nav, pager,
   TOC, search and static params follow from that.
