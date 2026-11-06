# Dependencies

**Parent:** [`AGENTS.md`](../AGENTS.md)

How a dependency earns its place, and the ones held back on purpose.

---

## Licences

`pnpm check:licences` gates every **shipped** package — `dependencies` and what they pull in —
against `licenses.baseline.json`.

**Default-deny by construction.** The baseline lists every package and the licence it had when it
was recorded, so a package that is not in it fails whatever its licence says. That is the failure
mode worth guarding: not any particular licence being wrong, but a dependency arriving unrecorded
and a later bump changing it silently.

The gate landed because `@base-ui/react` put nine packages into the shipped scope in one commit.
They were resolved by hand and found to be MIT, which was the right answer by the wrong mechanism.

| Licence | Why it is allowed |
|---|---|
| MIT | Permissive, no attribution burden at runtime |
| ISC | Functionally MIT; the OSI treats them as equivalent |
| OFL-1.1 | The SIL Open Font Licence — fonts only, and self-hosting is what it is for |
| Apache-2.0 | Permissive with a patent grant. Depending on it is not redistributing it, and this repo has depended on TypeScript under exactly these terms since day one |
| 0BSD, BSD-*| Permissive |
| Unlicense | Public-domain-equivalent dedication; no conditions at all |
| MIT and ISC | Permissive dual-licence combining MIT and ISC |

When the change is intended: `pnpm licences:update`, and commit the baseline — **the diff is the
licence change under review**, which is the same contract `check:api` uses for the type surface.

devDependencies are out of scope: they are not redistributed. The other half of the licence
question — third-party material that is *vendored* rather than depended on — is
[`reference-material.md`](./reference-material.md).


## 📦 Dependencies

Dependencies are fine. **Undocumented ones are not.** Every entry in
`package.json` must have a reason recorded in `MANIFEST` in
`scripts/check-deps.mjs`, and `pnpm deps:list` prints the table.

`pnpm check:deps` runs two things, because no single tool covers this:

- **`knip`** answers *is it used* — unused packages, unlisted imports,
  unresolved specifiers. It is the standard tool for that and worth more than
  anything hand-rolled.
- **`scripts/check-deps.mjs`** answers *is it justified, and in the right
  place*: a package with no `MANIFEST` entry fails, a `MANIFEST` entry with no
  package fails, and the declared section must match the reason's `kind`.

Three things it catches that knip structurally cannot:

1. **Shipped source importing a devDependency.** That publishes a package which
   breaks on install. `src/stories/**` and `src/**/*.test.ts(x)` are excluded
   from "shipped", since those files sit under `src/` but are unreachable from
   `src/index.ts` — which is why Storybook and Vitest are legitimately
   devDependencies despite being imported from inside `src/`.
2. **The CSS contract.** `styles.css` does `@import "tailwindcss"` and
   `prose.css` does `@plugin "@tailwindcss/typography"`. Both resolve from the
   *consumer's* `node_modules` at their build time, so both are real
   dependencies — but knip does not parse at-rules and reported the typography
   plugin as unused. It is in `ignoreDependencies` for that reason, and this
   check covers it instead. Adding a package to `ignoreDependencies` without a
   corresponding CSS reference is how that exemption gets abused.
3. **Shipped CSS missing from the `exports` map.** `prose.css` was built into
   `dist/`, its own header told consumers to import it, and the map never
   declared it — so following the documentation produced a resolution error. The
   check found that on its first run.

### Duplicate exports, gated

`pnpm knip` used to report duplicate exports: every component had both a named
and a `default` export, while `src/index.ts` uses `export *`, which does not
forward defaults, and the `exports` map has no deep paths — so every one of them
was unreachable from any consumer. There were **27**, not the 28 recorded here
before; no component ever imported another's default either.

All 27 are deleted, and the emitted `dist/index.d.ts` came out byte-identical
before and after, which is the proof they were dead rather than an argument that
they should have been. `duplicates` is now part of the gated `knip` run in
`check:deps`, so a `default` export cannot come back alongside a named one
without failing CI.

If a deep import path is ever wanted, that is an `exports` map change and a
deliberate API decision — not a reason to reintroduce a default nothing can
reach.

---

## 📌 Dependencies Held Back on Purpose

### Chart rendering engines

The chart layer deliberately has two rendering engines with non-overlapping jobs. `@visx/*`
handles composed/responsive SVG geometry; `@microcharts/react` handles fixed-size, word-sized KPI
indicators such as `BulletChart`. Neither is an interaction primitive: Base UI remains the only
library that owns focus, popup, or keyboard behavior. See [ADR 0005](./adr/0005-chart-rendering-engines.md)
before adding another chart engine or moving a component between them.

Anything here is **pinned below latest for a reason**. Check this list before
"just bumping it", and delete the row if you clear the blocker.

| Package      | Held at  | Latest | Why, and what unblocks it |
| ------------ | -------- | ------ | ------------------------- |
| `typescript` | `^6.0.3` | 7.0.2  | TS 7 breaks `pnpm build` — see below. Also keeps this package aligned with the blog, which consumes it. |

### The TypeScript 7 blocker

TS 7 does two things this repo cannot yet absorb:

1. **`baseUrl` was removed** (`error TS5102`). Our own `tsconfig.json` no longer
   sets it — the `@/*` mapping is tsconfig-relative — but `tsup`'s dts worker
   *injects* `baseUrl` itself, which is why `ignoreDeprecations: "6.0"` is
   currently required just to build on TS 6. Remove that escape hatch only when
   tsup stops injecting it.
2. **`tsup`'s DTS step crashes outright.** `tsup` vendors `rollup-plugin-dts`,
   which reads TS internals that TS 7 removed:

   ```
   TypeError: Cannot read properties of undefined (reading 'useCaseSensitiveFileNames')
       at rollup-plugin-dts.cjs
   ```

   This is upstream, not a config mistake: `rollup-plugin-dts@6.4.1` (latest)
   still declares `typescript: ^4.5 || ^5.0 || ^6.0`. Note the failure is
   **`pnpm build` only** — `pnpm typecheck` passes fine on TS 7, so a green
   typecheck is not evidence the upgrade works. Always run `pnpm build`.

**Unblocked when** `rollup-plugin-dts` supports TS 7, or this package moves off
`tsup` for bundling (`tsdown`, the rolldown-era successor, is the likely
candidate). Because the blog consumes this package, move both repos together.

