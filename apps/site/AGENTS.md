# AGENTS.md — @rtkelly13/design-system-site

The applied design-system website: a Next.js App Router site built only from
`@rtkelly13/design-system`. It has a homepage of live demos, component docs and
full-page examples. It is private and not published. It **is** deployed, but not by a
project of its own: the Storybook Vercel project serves it under `/site/`, beside
Storybook at `/` ([`docs/hosting.md`](../../packages/design-system/docs/hosting.md),
"The applied site, embedded").

It is also the repo's one real Next.js consumer. It is where Server Components,
client boundaries, SSR and hydration are tested against the package's built
`dist/`, so a change that passes every package gate but breaks a consumer fails the
`site` job in `ci.yml`.

Package manager is **pnpm** (`node >=22`). See the [root README](../../README.md)
for the workspace, and [`packages/design-system/AGENTS.md`](../../packages/design-system/AGENTS.md)
for the rules the site follows as a consumer: Base UI is the only interaction
library, and colour is addressed by role, never by hue.

## Commands

From the workspace root, `pnpm site` (dev) and `pnpm site:build` build the package
first. Inside `apps/site` the scripts below assume `packages/design-system/dist`
already exists (`pnpm --filter @rtkelly13/design-system build`), so that CI, which
builds the package once in its own step, does not build it twice. The site resolves it through its exports
map, as an npm consumer would.

| | |
|---|---|
| `pnpm dev` | generate docs data, then `next dev` at http://localhost:3000/site |
| `pnpm build` | generate docs data, then the static export to `out/` |
| `pnpm start` | serve `out/` at http://localhost:3100/site the way Vercel serves it (`scripts/serve-deploy.mjs`) |
| `pnpm generate` | rewrite `src/generated/docs-data.json` from the package (gitignored) |
| `pnpm lint` | typescript-eslint, `react-hooks` and `jsx-a11y`, with zero warnings allowed |
| `pnpm check:tokens` | the package's published `scanTokenRules` over `src/`, budget 0 |
| `pnpm typecheck` | generate, then `tsc --noEmit` |

## Rules that are not discoverable

1. **Import directly from `@rtkelly13/design-system`.** The package's per-module
   build marks interactive components as client references. Server-safe components and
   helpers remain on the server. Put event handlers in client components and pass
   serialisable props across their boundaries. The site build verifies this against `dist/`.
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
   issue. The current ones are 306, 308, 309, 310, 311 and 312.

8. **Everything is under the `/site` basePath, and Storybook is not.** `next/link`,
   `router.push` and the package's links (through `RouterLink`) add the prefix, so
   write internal hrefs as `/docs/...`, never `/site/docs/...`. A plain `<a>` to an
   internal page does not get it and 404s. Storybook links are the reverse: build them
   with `storybookUrl()` from `src/lib/links.ts`, which returns a root-relative
   `/?path=...` that `RouterLink` leaves alone, so one build links correctly on every
   domain. Under `next dev` they point at production, because nothing serves `/`.
9. **Examples are compositions the package exports.** A sample page under
   `/examples/<slug>/` is registered in `src/content/samples.ts` and rendered by
   `src/samples/index.tsx`. Story fixtures in `packages/design-system/src/stories/`
   import components from source by relative path, so importing one here would
   compile a second copy of the library into the site. Move a fixture to where both
   can import it first; do not copy it.

## Adding a component page

1. Write the examples under `src/examples/<slug>/` and add them to `src/examples/index.ts`.
2. Add `src/content/components/<slug>.ts` (a `ComponentPageDef`: lede,
   examples, the components whose props to show, accessibility notes and keys).
3. Add it to `COMPONENT_PAGES` in `src/content/registry.ts`. The nav, pager,
   TOC, search and static params follow from that.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
