#!/usr/bin/env node
/**
 * The detector for state that leaks between unit-test files.
 *
 *   pnpm test:leaks              15 runs
 *   pnpm test:leaks --runs 30
 *   pnpm test:leaks --seed 4242  replay one ordering
 *   pnpm test:leaks --workers 2 src/components/Menu.test.tsx src/hooks
 *                                a subset, capped — for a shared machine
 *
 * Each run is the whole Vitest suite with files shuffled and **no per-file
 * isolation**, so every file inherits whatever the files before it left in the
 * shared jsdom and module cache. A test that passes alone and fails here is
 * reading something another file wrote. The seed is printed with every
 * failure, and `--seed` replays that exact order — a leak that can be
 * reproduced is a leak that can be fixed, where one that shows up as a flaky
 * retry never is.
 *
 * This is what `isolate: false` in `vitest.config.mts` stands on: it was
 * switched off only after this ran clean, and it is the first thing to run if
 * a unit test starts failing in CI but not on its own. Seven runs in eight
 * failed before `src/test-setup.ts` restored the shared globals.
 *
 * Not a gate — each run is the full suite, and N of them is minutes.
 */

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const VALUED = new Set(['--seed', '--runs', '--workers']);
const filters = args.filter((arg, i) => !arg.startsWith('--') && !VALUED.has(args[i - 1]));
const workers = flag('workers') ? [`--maxWorkers=${flag('workers')}`] : [];
const seeds = flag('seed')
  ? [Number(flag('seed'))]
  : Array.from({ length: Number(flag('runs') ?? 15) }, () => Math.floor(Math.random() * 1e6));

const dir = mkdtempSync(path.join(tmpdir(), 'vitest-leaks-'));
const failures = [];

for (const [i, seed] of seeds.entries()) {
  const out = path.join(dir, `${seed}.json`);
  spawnSync(
    'pnpm',
    [
      'exec', 'vitest', 'run', '--no-isolate',
      '--sequence.shuffle.files', `--sequence.seed=${seed}`,
      '--reporter=json', `--outputFile=${out}`,
      // A leak is state, not speed. Generous ceilings keep a loaded machine's
      // timeouts from reading as leaks; a hang still ends, just later.
      '--testTimeout=60000', '--hookTimeout=60000',
      ...workers,
      ...filters,
    ],
    { cwd: ROOT, stdio: 'ignore', env: { ...process.env, CI: '' } },
  );
  let failed;
  try {
    const report = JSON.parse(readFileSync(out, 'utf8'));
    failed = report.testResults.flatMap((file) =>
      file.status === 'failed' && !file.assertionResults.some((a) => a.status === 'failed')
        ? [`${path.relative(ROOT, file.name)} — ${(file.message ?? 'failed to run').split('\n')[0]}`]
        : file.assertionResults
            .filter((a) => a.status === 'failed')
            .map((a) => `${path.relative(ROOT, file.name)} > ${a.title} — ${(a.failureMessages[0] ?? '').split('\n')[0].slice(0, 160)}`),
    );
  } catch {
    failed = ['the run produced no report — Vitest crashed before reporting'];
  }
  console.log(`run ${i + 1}/${seeds.length} seed ${seed}: ${failed.length ? `${failed.length} failed` : 'clean'}`);
  for (const line of failed) console.log(`    ${line}`);
  if (failed.length) failures.push(seed);
}

if (failures.length) {
  console.error(`\n${failures.length} of ${seeds.length} orderings leaked. Replay one with \`pnpm test:leaks --seed ${failures[0]}\`.`);
  process.exit(1);
}
console.log(`\nNo leaks across ${seeds.length} shuffled, unisolated runs.`);
