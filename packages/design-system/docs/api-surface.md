# The published API surface

**Parent:** [`AGENTS.md`](../AGENTS.md)

How a breaking type change is detected, and where it gets reviewed.

---

## 🔒 The Published API Surface

`api/index.d.ts` is the committed shape of what consumers compile against.
`pnpm check:api` regenerates it from `dist/index.d.ts` and fails when the two
disagree; `pnpm api:update` accepts the new surface, and **the diff in that file
is the API change** — reviewing it in the PR is the entire point of the gate.

It exists because nothing else here could see a breaking type change. `pnpm
typecheck` proves the source is internally consistent, which it remains right up
to the moment you delete an export; `knip` answers a different question; the
visual suite is three layers away. For a package whose value proposition is that
consumers build against it, that was the missing check with the most leverage.

Deliberately no `api-extractor`: a plain diff of the emitted `.d.ts` needs no
second toolchain kept aligned with `tsup`. What it gives up is the ability to say
*why* a change is breaking.

**Comments are stripped before comparing, and that is the load-bearing choice.**
The doc comments here are long and edited often, and they are documentation
rather than API — a reworded paragraph is not something a consumer can observe
through the type system. Baselining verbatim would move the file on nearly every
PR, and a gate that always fails is one everybody learns to update without
reading. The cost, stated plainly: a doc comment that lies is invisible to this
check. That is a review problem, not a gate problem.

The entrypoint's `export { … }` is exploded to one name per line, because
`tsup` emits all 200-odd names on a single line and diffing it as a line reports
the whole list as changed when one export moves. Exploded, a deleted export is
three lines naming it.



---

## 📦 The Output Layout, and What It Promises

`dist/` is **one file per source module** — `dist/components/Button.js`,
`dist/theme/levels.js` and so on — with `dist/index.js` a barrel over them.
The root import is the only entry point, and there are no deep paths.

It was one flat file until #301, and that made the package effectively
un-tree-shakeable. `sideEffects` works per module, the whole library was one
module, and 131 of its module-level statements were calls a bundler cannot
prove pure — `forwardRef`, `recipe`, `createContext`, `displayName`
assignments. So `import { Button }` bundled Base UI, visx and d3, and every
subset measured about 515 KB minified. Per module, a bundler drops every file
the consumer's imports do not reach, and needs to prove nothing.

`/* @__PURE__ */` annotations were the other candidate, and were measured
rather than argued: on the flat file they brought the blog's twelve imports
from 516 KB to 152 KB, with visx still in it; on top of the per-module
output they save nothing on that set and 1.1 KB of 186 KB on `Select`.
Per-module output alone is the fix, and 131 annotations to keep correct by
hand are not worth one kilobyte.

`scripts/module-graph.mjs` decides what is emitted: every module
`src/index.ts` reaches, asked of esbuild, so a file only a story imports never
ships. `tsup.config.ts` keeps each import between two of those modules an
import between their output files, with the extension Node's own resolver
needs. `pnpm check:import-cost` holds the result in bytes.

### ESM only

The package is `"type": "module"` and ships one format. `exports["."]` is
`{ types, default }` → `dist/index.js`; there is no `main`, no `module` and no
`require` condition. `types` stays at the top level for a consumer on
`moduleResolution: "node"` (node10), which never reads `exports` and would
otherwise find no declarations.

There was a CommonJS build beside the ESM one until the per-module layout, and
it was dropped rather than kept per module:

- **It was the bigger half.** esbuild writes its interop helpers
  (`__defProp`, `__export`, `__toCommonJS`, `__toESM`) into every CommonJS
  file, so 117 modules carried 117 copies: 565,563 B against the ESM output's
  387,723 B.
- **Nothing used it, and it could not stand alone.** `engines.node` is
  `>=22`, and Node 22.12 and later `require()` an ES module without a flag.
  Before 22.12 the CommonJS build failed anyway: it `require()`s
  `@microcharts/react`, which is ESM only (`ERR_REQUIRE_ESM` on Node 22.11,
  for 0.12.0 as for the per-module build). The blog, Vite and Next
  resolve the `import` condition. The one `require('@rtkelly13/design-system')`
  in the estate is generated: `design-system-report`'s own CommonJS build,
  which Node 22.12+ serves from this ESM output.
- **Two copies was a bug waiting.** Where one part of an app imported the
  package and another required it, both builds loaded, each with its own
  `createContext` — so a `ThemeProvider` from one copy was invisible to a
  `useTheme` from the other. One format has one module instance, however it is
  reached: `require()` and `import()` now return the same `Button`.

`require('@rtkelly13/design-system')` still works on Node 22.12+; it returns
the ES module's namespace. What no longer works is a CommonJS toolchain that
wants a `.js` file to be CommonJS — Jest without ESM support, for one.

**`verbatimModuleSyntax` is on**, and matters more here than in a flat bundle.
An import is emitted exactly as written, so an import between two modules is
an import between two output files. A value imported only for its type
(`import React from 'react'` for `React.FC`) survives as a bare `import
"react"`, and between two of this package's modules the same thing is a real
edge — enough to put a `'use client'` module in a server component's graph.
`import type` is the fix; the `design-system/type-imports` lint rule catches
the mistake in source, and `check:import-cost` fails on any side-effect-only
import left in `dist/`.

### `'use client'`, per module

Before #301 there was no directive anywhere, and React's server build has no
`createContext` — so importing anything from the package in a Next App Router
server component failed with `createContext is not a function`, `Card` and
`LEVELS` included. Per-module output lets the directive sit on exactly the
modules that need it:

- **Server-safe** — `Card`, `Button`, `Tag`, `PageTitle`, `NoteBlock`,
  `Progress`, the marketing sections, the documentation figures, and every
  token, level and `cn` export — render as server components.
- **Client** — anything with state, effects, context or an event handler of
  its own (`Select`, `Pagination`, `Tabs`, `ThemeProvider`, the dialogs) —
  arrives as a client reference from the same root import.

`scripts/client-boundary.mjs` holds the rule, and its test fails in both
directions: a module that needs the directive and lacks it would crash a
server render, and one that carries it without needing it silently costs every
App Router consumer its server rendering. `node scripts/client-boundary.mjs`
prints the census, with the reason for each client module.

**A client module's non-component exports are client references on the
server.** A server component can render `Select` but cannot call a function
exported beside a client component. That is why `getThemeInitScript`,
`THEME_ATTRIBUTE` and `THEME_STORAGE_KEY` live in their own server-safe module
rather than in `ThemeProvider.tsx`: the root layout that calls them is a server
component. `mdxComponents` and `createAnchorHeading` are still client-side
only — pass them to MDX from a client component.

### The barrel is written out by name

`src/index.ts` re-exports with `export *`, and the build rewrites every one of
those in the ESM output as the named list it stands for
(`scripts/expand-star-exports.mjs`). The client graph shakes either form; a
server graph does not. Measured in a Next 16 App Router build, a server
component importing the blog's twelve names from a star barrel shipped every
client module in the package to the browser under Turbopack, +699 KB of
client JavaScript. Named, it ships +46 KB. `check:import-cost` fails if a
star re-export survives.

**webpack needs one line of consumer config.** `next build --webpack`
collects client references before it tree-shakes, so a server component
importing from the root still ships every client module (+629 KB in the same
measurement). Next's `optimizePackageImports` is the fix it documents for
barrels, and it brings that to +46 KB:

```js
// next.config.mjs
export default { experimental: { optimizePackageImports: ['@rtkelly13/design-system'] } };
```

Turbopack, Next 16's default, needs nothing. Importing from a client
component needs nothing under either bundler.
