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

The suite covers `src/lib/`, `src/hooks/`, the generated `theme.css`, and component
behaviour under `src/components/`. `Modal` and `ThemeProvider` are covered because
their portal, focus, persistence, and theme-resolution logic has a right answer
independent of pixels. Prefer asserting behaviour (is the label wired to the
control? does the error replace the helper text?) over markup.

**Files share one environment per worker (`isolate: false`).** A fresh jsdom and
module graph per file was most of the suite's time — `environment` summed over a
minute against well under that in `tests` — so Vitest now reuses them across the
files a worker runs. That is only honest while no file can see what another left
behind, and the guarantee lives in `src/test-setup.ts`, not in each test: after
every test it unmounts, unstubs, drains and restores the fake clock, lets one real
macrotask pass, restores the timer, frame, observer and storage globals by value,
and resets `<html>`, `<body>` and focus to what the first file in the worker saw.
Each of those closed a leak that had been failing a shuffled run:

| Leak | What it broke |
| --- | --- |
| `ThemeProvider`'s `matchMedia` stub, never removed | `SiteHeader`: `list.addEventListener is not a function` |
| Real timers restored *before* unstubbing a rAF stubbed over fake timers | an orphaned fake `requestAnimationFrame`; Base UI moves Menu and Drawer focus in a frame, so focus stopped moving in every later file |
| Base UI's module-level scroll lock releasing on a `setTimeout(0)` that outlived the test | the next `Modal` never locked `<body>` |
| A portal `cleanup()` did not own | `Input` found a second textbox |
| A baseline captured per file, after the previous file's leaks | all of the above, re-accepted as normal |

`pnpm test:leaks` is the detector: the whole suite with files shuffled and no
isolation, N times, the seed printed with every failure and `--seed` replaying
it. Seven orderings in eight failed before the hook; fifteen in fifteen pass
after. It is not wired into CI on purpose — a shuffled required check would turn
one PR's leak into a red build on an unrelated one — so CI runs the files in
Vitest's stable order and this is the first thing to run when a unit test fails
in the suite and passes alone. `--workers 2` and file filters keep it affordable
on a shared machine.

`pnpm test:coverage` runs the same suite with V8 coverage over the library, hooks,
and components. Its thresholds are ratchets set from the first
component-inclusive measurement; raise them as behavioural tests are added rather
than treating the number as an aspirational claim. CI runs this command in the
unit job.

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

