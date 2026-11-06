/**
 * The general-purpose lint ruleset, as a ratchet.
 *
 * `pnpm lint` reports two rules as **errors**, both at zero: a colour named by
 * its value instead of its role, and a class that names nothing. Those stay
 * errors, and `pnpm lint` stays a gate that means something.
 *
 * Everything else — `react-hooks`, `jsx-a11y`, `no-explicit-any` — reports as a
 * **warning**, because 25 of them exist today and a rule set that cannot pass on
 * the day it lands does not land. PR #58 is the proof: it added these as errors
 * together with the fixes they demand, failed its own `lint` job on a run of
 * `no-explicit-any` it had not reached, and never merged.
 *
 * So this counts the warnings and fails if the number rises. Same shape as
 * `check:css`, `check:deps` and `check:fonts`; the same shape `check:tokens` used
 * until it reached zero and lost its budget line.
 *
 * ## Per rule, not one total
 *
 * A single number lets one rule's improvement pay for another's regression. The
 * budget is per rule so that a new `rules-of-hooks` violation fails even in a
 * week when six `no-explicit-any` were removed.
 *
 *   node scripts/check-lint-budget.mjs           verify
 *   node scripts/check-lint-budget.mjs --list    print the census with locations
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Counts on the day this landed. Lower a line as the violations go; delete it at
 * zero. A rule absent from here is budgeted at zero and fails on first sight.
 */
const BUDGET = {
  '@typescript-eslint/no-explicit-any': 10,
  'react-hooks/rules-of-hooks': 4,
  'react-hooks/set-state-in-effect': 3,
  'jsx-a11y/no-static-element-interactions': 3,
  'jsx-a11y/click-events-have-key-events': 2,
  'react-hooks/incompatible-library': 1,
  'react-hooks/static-components': 1,
  'jsx-a11y/anchor-ambiguous-text': 1,
};

const raw = execFileSync('npx', ['eslint', 'src', '--format', 'json'], {
  cwd: ROOT,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});

const files = JSON.parse(raw);
const counts = {};
const where = {};

for (const file of files) {
  for (const m of file.messages) {
    if (m.severity !== 1 || !m.ruleId) continue;
    counts[m.ruleId] = (counts[m.ruleId] ?? 0) + 1;
    (where[m.ruleId] ??= []).push(`${path.relative(ROOT, file.filePath)}:${m.line}`);
  }
}

if (process.argv.includes('--list')) {
  for (const rule of Object.keys({ ...BUDGET, ...counts }).sort()) {
    const n = counts[rule] ?? 0;
    console.log(`  ${String(n).padStart(3)} / ${String(BUDGET[rule] ?? 0).padEnd(3)} ${rule}`);
    for (const site of where[rule] ?? []) console.log(`        ${site}`);
  }
  console.log('');
}

const problems = [];
for (const [rule, n] of Object.entries(counts)) {
  const budget = BUDGET[rule] ?? 0;
  if (n > budget) problems.push(`${rule}: ${n}, budget ${budget}`);
}
const slack = Object.entries(BUDGET).filter(([rule, b]) => (counts[rule] ?? 0) < b);

const total = Object.values(counts).reduce((a, b) => a + b, 0);
console.log(`Lint budget OK — ${total} warnings across ${Object.keys(counts).length} rules.`);

if (problems.length) {
  console.error(`\nLint budget exceeded — ${problems.length} rule(s):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nFix it, or raise the line in scripts/check-lint-budget.mjs with a reason.');
  process.exit(1);
}

for (const [rule, b] of slack) {
  console.log(`  ${rule}: ${counts[rule] ?? 0} of ${b} — lower the budget.`);
}
