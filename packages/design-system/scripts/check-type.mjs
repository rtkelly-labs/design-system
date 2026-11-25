#!/usr/bin/env node
/**
 * Count the places this repository still writes type as a value rather than a step.
 *
 * ADR 0008 publishes `TYPE_RULES` and holds consumers to them at budget zero.
 * This repository cannot start there: its components were written against
 * Tailwind's default scale before `ui` and `heading` existed. So it holds itself
 * to the same rules as a ratchet, in the family of `check:tokens` and
 * `check:css`. Each rule has its own budget, so migrating `text-sm` cannot buy
 * room for a new `font-size: 13px`.
 *
 *   node scripts/check-type.mjs           fail if any rule's count rises
 *   node scripts/check-type.mjs --list    print every site
 *
 * The budgets live in `type-budget.json`, and a budget can only fall: the
 * script compares the file with the same file on the base branch and fails if
 * any number in it went up. Raising a budget to make a red build green is the
 * edit this check exists to refuse, whoever makes it. The base is
 * `TYPE_BUDGET_BASE`, else `origin/$GITHUB_BASE_REF` on a pull request,
 * else `origin/main`.
 *
 * When every budget is zero, the `@theme` block resets Tailwind's `--text-*` and
 * `--font-weight-*` before declaring ours, and this script's budgets go with it:
 * `text-sm` then fails to compile instead of failing a count.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TYPE_RULES, scanTypeRules, typeExceptions } from '../src/lib/typeRules.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

/**
 * The budgets. Lower one in the same commit that removes its sites; never raise
 * one. A rule absent from the file has a budget of zero.
 */
const BUDGET_FILE = path.join(ROOT, 'type-budget.json');
const BUDGET = JSON.parse(readFileSync(BUDGET_FILE, 'utf8'));

/**
 * The same file on the base branch, or null when the base predates it. A base
 * that cannot be read at all fails in CI, because a ratchet that quietly skips
 * its comparison is one an agent can raise without anyone noticing.
 */
function baseBudget() {
  const base =
    process.env.TYPE_BUDGET_BASE ?? (process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/main');
  const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  try {
    git('rev-parse', '--verify', '--quiet', `${base}^{commit}`);
  } catch {
    const message = `check:type: cannot read the base ${base} to compare type-budget.json against.`;
    if (process.env.CI) {
      console.error(`${message} Fetch it before this step.`);
      process.exit(1);
    }
    console.warn(`${message} Skipping the no-raise check locally.`);
    return null;
  }
  const top = git('rev-parse', '--show-toplevel').trim();
  const rel = path.relative(top, BUDGET_FILE).split(path.sep).join('/');
  try {
    return { base, budget: JSON.parse(git('show', `${base}:${rel}`)) };
  } catch {
    return null; // The base has no budget file yet: this change introduces it.
  }
}

const previous = baseBudget();
const raised = previous
  ? TYPE_RULES.filter((rule) => (BUDGET[rule.id] ?? 0) > (previous.budget[rule.id] ?? 0))
  : [];

/**
 * Files that define the scale rather than use it. `theme.css` is generated from
 * `theme/media.ts`, which is where the sizes are *supposed* to be written down.
 */
const DEFINITIONS = new Set(['theme.css', 'lib/typeRules.ts', 'theme/media.ts']);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const sites = [];
const exceptions = [];
for (const file of walk(SRC)) {
  if (!/\.(?:tsx?|css)$/.test(file)) continue;
  const rel = path.relative(SRC, file).split(path.sep).join('/');
  if (DEFINITIONS.has(rel)) continue;
  // A test asserting what a component renders today is not choosing a size.
  if (/\.(?:test|stories)\.tsx?$/.test(rel)) continue;

  const source = readFileSync(file, 'utf8');
  for (const finding of scanTypeRules(source)) sites.push({ file: rel, ...finding });
  for (const exception of typeExceptions(source)) exceptions.push({ file: rel, ...exception });
}

const counts = Object.fromEntries(TYPE_RULES.map((rule) => [rule.id, 0]));
for (const site of sites) counts[site.ruleId] += 1;

const print = (log, list) => {
  for (const s of list) log(`  ${s.file}:${s.line}  ${s.match.padEnd(28)} [${s.ruleId}]`);
};

if (process.argv.includes('--list')) {
  print(console.log, sites);
  if (exceptions.length) {
    console.log('\nExceptions:');
    for (const e of exceptions) console.log(`  ${e.file}:${e.line}  ${e.reason || '(no reason given)'}`);
  }
  console.log('');
  for (const rule of TYPE_RULES) console.log(`  ${rule.id.padEnd(16)} ${counts[rule.id]}, budget ${BUDGET[rule.id] ?? 0}`);
  process.exit(0);
}

const over = TYPE_RULES.filter((rule) => counts[rule.id] > (BUDGET[rule.id] ?? 0));
const unexplained = exceptions.filter((e) => !e.reason);

if (raised.length) {
  for (const rule of raised) {
    console.error(
      `type-budget.json raises ${rule.id} from ${previous.budget[rule.id] ?? 0} to ${BUDGET[rule.id]} against ${previous.base}.`,
    );
  }
  console.error('A type budget only falls. Put it back and move the new sites onto a step of the scale.');
  for (const rule of raised) console.error(`  ${rule.fix}`);
  process.exit(1);
}

if (over.length || unexplained.length) {
  for (const rule of over) {
    console.error(`${rule.label}: ${counts[rule.id]}, budget ${BUDGET[rule.id] ?? 0}.`);
    print(console.error, sites.filter((s) => s.ruleId === rule.id));
    console.error(`  ${rule.fix}\n`);
  }
  for (const e of unexplained) {
    console.error(`  ${e.file}:${e.line}  ds-allow-type: needs a reason after the colon.`);
  }
  console.error('Type is addressed by step, never by size — see docs/adr/0008-type-is-addressed-by-step.md.');
  console.error('Run `pnpm check:type:list` for the full set.');
  process.exit(1);
}

const total = sites.length;
const lower = TYPE_RULES.filter((rule) => counts[rule.id] < (BUDGET[rule.id] ?? 0));
console.log(total === 0 ? 'No type written as a value.' : `Type written as a value: ${total}, within budget.`);
for (const rule of lower) {
  console.log(`  ${rule.id} is down to ${counts[rule.id]}: lower it in type-budget.json from ${BUDGET[rule.id]}.`);
}
