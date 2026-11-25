#!/usr/bin/env node
/**
 * What compiling against the package costs a consumer's `tsc` — and so their
 * editor, on every keystroke in a file that imports it.
 *
 * `check:import-cost` weighs what a consumer's *bundle* pays. This weighs what
 * their *type checker* pays: each case is a small file in `type-tests/cost/`
 * that imports the package by name, compiled with a consumer's settings
 * (`type-tests/tsconfig.json`) against the built `dist/index.d.ts`.
 *
 * ## What is gated, and why only that
 *
 * **Instantiations**, from `tsc --extendedDiagnostics`. It is deterministic —
 * the same tree and the same TypeScript give the same count, run after run and
 * machine after machine — and it is the number that moves when a type gets
 * expensive: a conditional type distributed over a wider union, a generic
 * re-inferred per call site, a mapped type over the whole surface.
 * Check time and memory are printed by `--list` and never gated, because they
 * move with the runner, and a gate that can fail on a slow machine is one that
 * gets re-run until it passes.
 *
 * A case also fails on any compile error, which makes `surface` (compiled with
 * `skipLibCheck: false`) a check that the published declarations are valid in
 * a consumer that does check them.
 *
 * ## The ceilings
 *
 * Written in `CASES`, the same shape as `check:import-cost`. Each is the
 * measured count plus 5% (`TOLERANCE`), rounded up to the next hundred. A change that grows a
 * case past its ceiling fails; if the growth is intended, raise the number in
 * the same commit and say why beside it. A case measuring more than twice the
 * tolerance under its ceiling is reported so the ceiling comes down with it.
 *
 * **A TypeScript upgrade moves every count** — the checker's internals are
 * what is being counted. Re-measure with `--list` in the upgrade PR and write
 * the new numbers in; that is the one change where every ceiling moves at once.
 *
 *   node scripts/check-type-cost.mjs              verify (needs `pnpm build`)
 *   node scripts/check-type-cost.mjs --list       every case, with types, memory and time
 *   node scripts/check-type-cost.mjs --package    also measure `tsc` over this
 *                                                 package's own source — what a
 *                                                 contributor pays; printed, never gated
 */

import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { promisify } from 'node:util';

import { PACKAGE_ROOT, REPO_ROOT } from './repo-root.mjs';

const listing = process.argv.includes('--list');
const withPackage = process.argv.includes('--package');

const run = promisify(execFile);
const TSC = createRequire(import.meta.url).resolve('typescript/bin/tsc');
const SCRATCH = path.join(REPO_ROOT, 'temp', 'type-cost');
const TOLERANCE = 0.05;

/**
 * Measured with TypeScript 6.0.3 on the build that added this gate.
 *
 *   blog       11,525. The twelve names the blog imports (`check:import-cost`'s `blog`
 *              set), rendered as a post page renders them.
 *   datatable  10,355. `DataTable<T>` over a row type with both column forms — the
 *              legacy `Column<T>` and TanStack's `ColumnDef<T>` — and every
 *              row callback. The heaviest generic on the surface.
 *   surface    181,137. Every export of the root entry, named once, with
 *              `skipLibCheck: false`: the declarations themselves, and
 *              everything they reference. `@types/react` alone, checked the
 *              same way, is 108,909 of it.
 */
const CASES = [
  { name: 'blog', file: 'type-tests/cost/blog.tsx', maxInstantiations: 12_200 },
  { name: 'datatable', file: 'type-tests/cost/datatable.tsx', maxInstantiations: 10_900 },
  { name: 'surface', file: 'type-tests/cost/surface.ts', skipLibCheck: false, maxInstantiations: 190_200 },
];

const STATS = {
  files: /^Files:\s+(\d+)/m,
  types: /^Types:\s+(\d+)/m,
  instantiations: /^Instantiations:\s+(\d+)/m,
  memoryKb: /^Memory used:\s+(\d+)K/m,
  checkSeconds: /^Check time:\s+([\d.]+)s/m,
  totalSeconds: /^Total time:\s+([\d.]+)s/m,
};

/**
 * Run `tsc --extendedDiagnostics` on one config; the stats, and any errors.
 * Asynchronous so the cases compile side by side: each is a separate `tsc`.
 */
async function compile(project) {
  let output;
  let failed = false;
  try {
    // `--noEmit` always, not only through the consumer config: `--package`
    // compiles this package's own tsconfig, which would otherwise write a
    // `.js` beside every file in `src/`.
    const args = [TSC, '-p', project, '--noEmit', '--extendedDiagnostics', '--pretty', 'false'];
    ({ stdout: output } = await run(process.execPath, args, {
      cwd: PACKAGE_ROOT,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    }));
  } catch (error) {
    // tsc exits non-zero on a type error and still prints the diagnostics.
    output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
    failed = true;
  }
  const stats = Object.fromEntries(
    Object.entries(STATS).map(([key, pattern]) => [key, Number(pattern.exec(output)?.[1] ?? NaN)]),
  );
  const errors = output.split('\n').filter((line) => /error TS\d+/.test(line));
  return { stats, errors: failed && !errors.length ? [output.trim().split('\n')[0]] : errors };
}

/** A throwaway config: the consumer settings, with one file. */
function projectFor({ name, file, skipLibCheck = true }) {
  mkdirSync(SCRATCH, { recursive: true });
  const project = path.join(SCRATCH, `${name}.tsconfig.json`);
  writeFileSync(
    project,
    JSON.stringify(
      {
        extends: path.join(PACKAGE_ROOT, 'type-tests', 'tsconfig.json'),
        compilerOptions: { skipLibCheck },
        include: [],
        files: [path.join(PACKAGE_ROOT, file)],
      },
      null,
      2,
    ),
  );
  return project;
}

const n = (value) => value.toLocaleString('en-US');
const row = (status, name, stats, ceiling) =>
  `${status} ${name.padEnd(10)} ${n(stats.instantiations).padStart(9)} instantiations` +
  (ceiling == null ? ' (not gated)'.padEnd(20) : ` (ceiling ${n(ceiling)})`.padEnd(20)) +
  (listing
    ? `  ${n(stats.types).padStart(7)} types  ${String(Math.round(stats.memoryKb / 1024)).padStart(4)} MB  ` +
      `check ${stats.checkSeconds.toFixed(2)}s  total ${stats.totalSeconds.toFixed(2)}s  ${n(stats.files)} files`
    : '');

if (!existsSync(path.join(PACKAGE_ROOT, 'dist', 'index.d.ts'))) {
  console.error('dist/index.d.ts is missing — run `pnpm build` first.');
  process.exit(1);
}

const problems = [];
const hints = [];
const results = await Promise.all(CASES.map((testCase) => compile(projectFor(testCase))));
for (const [index, testCase] of CASES.entries()) {
  const { stats, errors } = results[index];
  const { instantiations } = stats;
  if (errors.length) {
    problems.push(`${testCase.name}: ${testCase.file} does not compile against dist/ —\n      ${errors.join('\n      ')}`);
  }
  if (!Number.isFinite(instantiations)) {
    problems.push(`${testCase.name}: no instantiation count in tsc's output.`);
    continue;
  }
  const over = instantiations > testCase.maxInstantiations;
  if (over) {
    problems.push(
      `${testCase.name}: ${n(instantiations)} instantiations, over its ${n(testCase.maxInstantiations)} ceiling ` +
        `(+${n(instantiations - testCase.maxInstantiations)}, ` +
        `+${(((instantiations - testCase.maxInstantiations) / testCase.maxInstantiations) * 100).toFixed(1)}%).`,
    );
  } else if (instantiations * (1 + 2 * TOLERANCE) < testCase.maxInstantiations) {
    hints.push(
      `${testCase.name}: ${n(instantiations)} is well under its ${n(testCase.maxInstantiations)} ceiling — ` +
        `lower it to ${n(Math.ceil((instantiations * (1 + TOLERANCE)) / 100) * 100)} in scripts/check-type-cost.mjs.`,
    );
  }
  if (listing || over || errors.length) {
    console.log(row(over || errors.length ? 'FAIL' : 'ok  ', testCase.name, stats, testCase.maxInstantiations));
  }
}

if (withPackage) {
  const { stats, errors } = await compile(path.join(PACKAGE_ROOT, 'tsconfig.json'));
  console.log(row(errors.length ? 'FAIL' : '    ', 'package', stats, null));
}

for (const hint of hints) console.log(`note: ${hint}`);

if (problems.length) {
  console.error(`\nType cost exceeded — ${problems.length} problem(s):\n`);
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    '\nThis is what a consumer\'s type checker pays to compile these files against the package. ' +
      'If the growth is intended, raise the ceiling in scripts/check-type-cost.mjs and say why there. ' +
      '`node scripts/check-type-cost.mjs --list` prints every case.',
  );
  process.exit(1);
}

console.log(`Type cost OK — ${CASES.length} consumer files within their instantiation ceilings, every one compiling against dist/.`);
