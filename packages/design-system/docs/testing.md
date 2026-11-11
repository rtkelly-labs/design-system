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


## 🎲 Model-based tests

`*.model.test.tsx` files check an interactive component against a small model
of itself. fast-check generates sequences of user actions (`fc.commands`). Each
action is applied twice: to the rendered component through Testing Library,
and to a plain-data model. After every step the test checks that the DOM says
what the model says. A failure shrinks to the shortest sequence that still
fails and prints it, so it reads as a reproduction rather than a seed.
`FilterBar` and `Menu` have one.

Write one when a component is a state machine the example tests can only
sample: several keys, an edit mode, controlled and uncontrolled ownership.
Writing a model costs more than writing examples. In return it reaches orderings
nobody thought to write.

- **The model must not import its oracle from the module under test.** Restate
  equality and labels locally. A model that borrows `sameFilter` agrees with
  any bug in it. That is also why the first FilterBar model could not kill
  mutants inside `filters.ts`.
- **Run two mixes.** *uniform* offers every command at every step. *swarm*
  draws a random subset per run (`fc.subarray(commands).chain(...)`), which
  reaches the long lists and deep states a uniform mix keeps resetting.
- **Check what a user can observe.** Read the DOM, ARIA state and callbacks,
  never component internals.
- **`FC_NUM_RUNS`** sets sequences per property. The default (30) keeps each
  file to a few seconds in the unit job. Scale the test timeout with it.
  `experiments.yml` runs every model file at 1000 when a PR carries the
  `experiment:properties` label.

`src/public-api.types.test.tsx` is the type-level counterpart. Its
`expectTypeOf` assertions and `@ts-expect-error` negatives pin promises a
consumer builds on: narrowing, ref element types, rejected props. `check:api`
sees the text of the surface; this file sees what that text allows.

## 🔡 Type tests against the build

`type-tests/*.test-d.tsx` asks the same kind of question of the **built**
declarations. It imports `@rtkelly-labs/design-system` by name, so `exports`
sends it to `dist/index.d.ts`, and compiles with `type-tests/tsconfig.json` — a
consumer's settings, without this package's `paths` or
`allowImportingTsExtensions`. `pnpm test:types` runs it in Vitest's typecheck
mode (`vitest.types.config.mts`, `typecheck.only`), which reports a failed
assertion against the `it` it sits in. It needs `pnpm build`, so it runs in the
`build` job, not `test`.

It exists beside `src/public-api.types.test.tsx` because the two can differ:
tsup's declaration bundler rewrites types on the way out — `ButtonProps` leaves
as four distributed `Omit<…, "ref">` members — and a promise that holds in
`src/` and not in `dist/` is broken for every consumer. It covers what a
consumer leans on: closed variant unions (and roles, not hues — rule 3),
required props, the `href` switch on `Button`, forwarded ref types, value-typed
change handlers, and `DataTable`'s row type flowing from `data` into every
callback. Keep it to promises; one assertion per component is not the goal.

Two things to know when writing one:

- **A ref negative only works in one direction.** DOM element types are
  structural, and `HTMLInputElement` satisfies `HTMLDivElement` (both have
  `align`), so `<Card ref={inputRef}>` compiles. A ref can be rejected only
  when its element lacks members the rendered one has — a div ref on a button.
- **Vitest's typecheck mode is a second `tsc`.** Pointed at `src/` it re-checks
  the whole package — 15s measured, the same work `pnpm typecheck` already
  did — which is why the source-level file stays inside `pnpm typecheck` and
  only the consumer-level one runs through Vitest, over 156 files in ~4s.

`pnpm check:type-cost` weighs what the same consumer setup pays.
`type-tests/cost/` holds three files — the blog's twelve imports, `DataTable`
over both column forms, and every export named once under
`skipLibCheck: false` — and the gate compiles each with
`tsc --extendedDiagnostics` and holds its **instantiation count** under a
ceiling written in `scripts/check-type-cost.mjs` (measured + 5%). The count is
deterministic for a given tree and TypeScript; check time and memory are
printed by `--list` and never gated. A TypeScript upgrade moves every count,
so that PR re-measures them all.

## 🧬 Mutation testing

`pnpm test:mutation` runs StrykerJS over the modules named in
`stryker.config.mjs`. Stryker changes one operator or condition at a time and
reports which change no test noticed. It is an instrument, not a gate. It runs
in `experiments.yml` when a PR carries the `experiment:mutation` label, takes
7–9 minutes, and nothing fails on the score. Read the **survivor list**, not
the number.

- **Tests written against survivors** live in `*.mutants.test.*`. Each one names
  the behaviour a survivor exposed, such as a consumed key, focus, or a
  datalist entry, and never names the mutant. One marked *incidental* pins a
  detail rather than a promise, and is the first to drop.
- **Not every survivor deserves a test.** An equivalent mutant (`?.focus()` →
  `.focus()` on a ref that is always set) cannot be killed. A class list
  belongs to the visual suite.
- **The fast-check seed is pinned under Stryker** (`stryker-setup.ts`). An
  unpinned seed let the models kill a different set on each run, about ±1.5
  points of noise. `FC_SEED` or the dispatch `seed` input picks another seed.
- **Comparing two `mutation.json` files:** key each mutant by its start *and*
  end location. Start alone collides (`a && b` and `a` share one) and invents
  status changes.
