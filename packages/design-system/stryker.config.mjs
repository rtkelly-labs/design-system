/**
 * Mutation testing, as a measuring instrument rather than a gate.
 *
 * Coverage says a line ran. A killed mutant says a test noticed the line
 * change. This config exists to put a number on the second for a small,
 * named set of modules, so that a new kind of test (model-based, or written
 * against the survivors) can be scored against the suite that was already
 * there. It runs in `.github/workflows/experiments.yml`, never in `ci.yml`,
 * and nothing fails on the score: `thresholds.break` is unset on purpose.
 *
 * ## Why `StringLiteral` is excluded
 *
 * Most string literals in a component here are Tailwind class lists. Mutating
 * one to `""` survives every unit test, and should: `docs/testing.md` says
 * asserting class strings is a worse version of a screenshot, and the visual
 * suite is where appearance is gated. Left in, the survivor list is dominated
 * by mutants no unit test is supposed to kill, and the score measures the
 * styling surface rather than the logic. The cost: a string that *is* logic —
 * an operator such as `'!='`, an error message — is not mutated either. The
 * remaining mutators (conditionals, equality, arithmetic, boolean, block,
 * array, optional chaining, method expressions) still reach the parser and
 * the state machines, which is what the experiments are about.
 *
 * ## In place
 *
 * The CI checkout is disposable, and mutating it in place sidesteps copying a
 * pnpm workspace's symlinked `node_modules` into Stryker's sandbox. Never run
 * this on a working tree with uncommitted changes; an interrupted run can
 * leave a mutant in a source file.
 *
 *   pnpm test:mutation                     the modules below
 *   pnpm test:mutation --mutate <glob>     another module, same settings
 */

// Options: https://stryker-mutator.io/docs/stryker-js/configuration/
export default {
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.stryker.config.mts',
    // Only the test files that import a mutated module, through Vitest's own
    // module graph — the other ~100 files cannot kill these mutants.
    related: true,
  },
  plugins: ['@stryker-mutator/vitest-runner'],
  coverageAnalysis: 'perTest',
  inPlace: true,
  mutate: [
    // The filter-expression parser and formatter: pure, and the oracle the
    // FilterBar model leans on.
    'src/lib/filters.ts',
    // A hand-written state machine: owned or controlled list, text, edit
    // index, error.
    'src/components/FilterBar.tsx',
    // A thin wrapper; Base UI owns the keyboard model. Included as the
    // control case — mutants here are mostly prop forwarding.
    'src/components/Menu.tsx',
  ],
  mutator: {
    excludedMutations: ['StringLiteral'],
  },
  ignoreStatic: true,
  concurrency: 4,
  timeoutMS: 20000,
  reporters: ['clear-text', 'progress-append-only', 'json', 'html'],
  clearTextReporter: { allowColor: false, reportScoreTable: true, reportMutants: true },
  jsonReporter: { fileName: 'reports/mutation/mutation.json' },
  htmlReporter: { fileName: 'reports/mutation/mutation.html' },
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
};
