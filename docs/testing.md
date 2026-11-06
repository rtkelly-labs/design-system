# Unit tests

**Parent:** [`AGENTS.md`](../AGENTS.md)

What the unit suite covers, and what it deliberately does not.

---

## 🧪 Unit Tests

Vitest, jsdom environment, tests co-located with the code as `src/**/*.test.ts(x)`.

**The extension is load-bearing.** Playwright's `testDir: './tests'` matches
`*.spec.ts`, so the two runners are kept apart by naming alone:

| Path | Extension | Runner |
| --- | --- | --- |
| `src/**` | `.test.ts` / `.test.tsx` | Vitest |
| `tests/**` | `.spec.ts` | Playwright |

A unit test named `.spec.ts` under `tests/` gets collected by Playwright and fails
without a browser. Keep new unit tests in `src/`, beside what they cover.

Tests are invisible to the published package — `tsup` bundles from `src/index.ts`
only, and `files` ships `dist/` — so co-locating them costs consumers nothing.

**What belongs here vs. in visual regression.** Unit tests cover logic that has a
right answer independent of pixels: token resolution, slug generation, hook state
machines. Anything whose correctness *is* its appearance stays in `test:visual` —
asserting on class strings is a worse version of a screenshot and breaks on every
harmless refactor.

The suite covers `src/lib/`, `src/hooks/`, the generated `theme.css`, and — so far —
`Input` and `StatCard` under `src/components/`. Prefer asserting behaviour (is the
label wired to the control? does the error replace the helper text?) over markup.

Two tests are cross-cutting rather than co-located, because what they cover is a
property of the package and not of one file: `src/lint.test.ts` pins the two lint
rules, and `src/focus-ring.test.ts` rejects any `outline-none` / `outline-hidden`
/ `outline-0` utility in a component. The second guards the global
`:focus-visible` rule in `styles.css`, which a utility silently outranks — a
class plus a pseudo-class is (0,2,0) against that rule's (0,1,0), so
`focus:outline-none` removes the outline on precisely the keyboard focus it
exists for. Writing it `focus-visible:` does not help; it is the same
specificity aimed at the same case. `Input`, `Modal`, `Tag` and `CodeTabs` all
had it.

**Where a runtime value is involved, assert the value and not the class.** `Input`
takes its accent as a prop, so it cannot be a utility — Tailwind's scanner reads
source text and would generate nothing for `border-${role}`. The accent travels as
`--field-accent` instead. Every accent therefore produces the *same* class string,
which means a class assertion there cannot tell a working accent from a broken one:
it passes either way. Read the custom property.

**The published shape is tested too.** `src/package-shape.test.ts` asserts the
fields and files a consumer meets before any code runs — the licence text the
`license` field claims, every checked-in `files` entry existing, `sideEffects`,
`engines`, and each stylesheet the README tells a consumer to import being
resolvable through the `exports` map. Nothing else here can see those: `tsup`
does not read them and `typecheck` cannot. The failure it guards is one that
already shipped twice — `files` listed `LICENSE` and `license` said MIT while no
such file existed. Note it runs before `pnpm build`, so `dist/` is asserted to be
*declared*, not to be present.


