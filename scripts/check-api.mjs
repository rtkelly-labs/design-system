#!/usr/bin/env node
/**
 * The published type surface, against a committed baseline.
 *
 * This package's whole value proposition is that consumers build against it, so
 * the change that costs them most is a breaking type change — a prop becoming
 * required, an exported name disappearing, a union losing a member. Nothing here
 * could see one. `pnpm typecheck` proves the *source* is internally consistent,
 * which it stays right up to the moment you delete an export; the visual suite
 * is three layers away; and `knip` answers a different question entirely.
 *
 * So this is deliberately the dumbest thing that works: diff the generated
 * `dist/index.d.ts` against `api/index.d.ts` in the repo. No `api-extractor`,
 * no second toolchain to keep aligned with `tsup`. What it gives up is the
 * ability to say *why* a change is breaking; what it gives is that no change
 * reaches a consumer without a human having read it in a PR diff.
 *
 * ## Comments are stripped, and that is the interesting decision
 *
 * The doc comments in this package are long and are edited often, and they are
 * documentation rather than API — a reworded paragraph is not a change a
 * consumer can observe through the type system. Baselining the file verbatim
 * would move it on nearly every PR, and a gate that always fails is a gate
 * everybody learns to update without reading. Stripping comments means the
 * baseline moves only when the shape moves, which is what makes each diff worth
 * reading.
 *
 * The cost is honest and worth stating: a doc comment that lies is invisible
 * here. That is a review problem, not a gate problem.
 *
 * ## Reading a failure
 *
 * The output is a unified-style diff of the normalised surface. If the change is
 * intended, `pnpm api:update` rewrites the baseline and the diff becomes part of
 * the PR — which is the point. If it is not, something in `src/` changed the
 * public contract by accident, and the diff names it.
 *
 *   node scripts/check-api.mjs            fail if the surface moved
 *   node scripts/check-api.mjs --update   accept the current surface
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GENERATED = path.join(ROOT, 'dist/index.d.ts');
const BASELINE = path.join(ROOT, 'api/index.d.ts');

const update = process.argv.includes('--update');

/**
 * Comments out, blank runs collapsed, trailing whitespace gone.
 *
 * The string-literal guard matters: `'/*'` inside a type would otherwise open a
 * comment that never closes and swallow the rest of the file. Template literals
 * are included because a template literal type is a real thing in a `.d.ts`.
 */
function normalise(source) {
  let out = '';
  let i = 0;
  let quote = null;

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    if (quote) {
      out += c;
      if (c === '\\') {
        out += source[i + 1] ?? '';
        i += 2;
        continue;
      }
      if (c === quote) quote = null;
      i += 1;
      continue;
    }

    if (c === '"' || c === "'" || c === '`') {
      quote = c;
      out += c;
      i += 1;
      continue;
    }

    if (c === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2);
      i = end === -1 ? source.length : end + 2;
      continue;
    }

    if (c === '/' && next === '/') {
      const end = source.indexOf('\n', i);
      i = end === -1 ? source.length : end;
      continue;
    }

    out += c;
    i += 1;
  }

  return (
    explodeExportList(out)
      .split('\n')
      .map((line) => line.replace(/\s+$/, ''))
      .join('\n')
      // A stripped comment leaves the blank line it sat on behind.
      .replace(/\n{3,}/g, '\n\n')
      .trim() + '\n'
  );
}

/**
 * One exported name per line.
 *
 * `tsup` emits the entrypoint's re-exports as a single `export { … };` holding
 * every name in the package — currently over 200 on one line. Diffed as a line,
 * removing one export reports the whole list as removed and the whole list as
 * added, which buries the one name that actually changed. Exploding it means a
 * deleted export is a single `- Badge,` and a renamed one is a pair.
 *
 * The list has no nested braces — an export specifier is a name, optionally
 * `type`-prefixed and optionally `as`-renamed — so splitting on commas is safe
 * here in a way it would not be for a general type position.
 */
function explodeExportList(source) {
  return source.replace(/export \{([^{}]*)\};/g, (_match, body) => {
    const names = body
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    if (names.length < 2) return `export {${body}};`;
    return `export {\n${names.map((name) => `  ${name},`).join('\n')}\n};`;
  });
}

/** Minimal line diff — enough to point at the change without a dependency. */
function report(expected, actual) {
  const a = expected.split('\n');
  const b = actual.split('\n');
  const seen = new Set(a);
  const kept = new Set(b);

  const removed = a.filter((line) => line.trim() && !kept.has(line));
  const added = b.filter((line) => line.trim() && !seen.has(line));

  const lines = [];
  for (const line of removed.slice(0, 40)) lines.push(`  - ${line.trim()}`);
  if (removed.length > 40) lines.push(`  … ${removed.length - 40} more removed`);
  for (const line of added.slice(0, 40)) lines.push(`  + ${line.trim()}`);
  if (added.length > 40) lines.push(`  … ${added.length - 40} more added`);
  return { lines, removed: removed.length, added: added.length };
}

if (!existsSync(GENERATED)) {
  console.error(`Generated types not found at ${path.relative(ROOT, GENERATED)}.`);
  console.error('Run `pnpm build` first — this check reads the real emitted surface.');
  process.exit(1);
}

// A *stale* dist is more dangerous than a missing one, and only in `--update`.
// Missing fails loudly; stale succeeds quietly, and writes a baseline recording
// a surface the package no longer has. Doing that in update mode cements the
// wrong answer behind a green check — the next run compares against it and
// agrees. So refuse when anything under src/ is newer than what was emitted.
if (update) {
  const emitted = statSync(GENERATED).mtimeMs;
  const newer = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (statSync(full).mtimeMs > emitted) newer.push(path.relative(ROOT, full));
    }
  };
  walk(path.join(ROOT, 'src'));
  if (newer.length > 0) {
    console.error(
      `${path.relative(ROOT, GENERATED)} is older than ${newer.length} source file(s), e.g. ${newer[0]}.`,
    );
    console.error('Run `pnpm build` first — a baseline written from a stale build');
    console.error('records a public surface the package does not have.');
    process.exit(1);
  }
}

const actual = normalise(readFileSync(GENERATED, 'utf8'));

if (update) {
  mkdirSync(path.dirname(BASELINE), { recursive: true });
  writeFileSync(BASELINE, actual);
  console.log(`Baseline updated — ${actual.split('\n').length - 1} lines.`);
  console.log('Commit api/index.d.ts; the diff is the API change under review.');
  process.exit(0);
}

if (!existsSync(BASELINE)) {
  console.error('No API baseline committed. Run `pnpm api:update` and commit the result.');
  process.exit(1);
}

const expected = readFileSync(BASELINE, 'utf8');

if (expected === actual) {
  console.log(`Public API surface unchanged — ${actual.split('\n').length - 1} lines.`);
  process.exit(0);
}

const { lines, removed, added } = report(expected, actual);
console.error('Public API surface changed.\n');
console.error(lines.join('\n'));
console.error(`\n  ${removed} line(s) removed, ${added} added.`);
console.error('\nIf this is intended, run `pnpm api:update` and commit api/index.d.ts —');
console.error('that diff is the API change, and reviewing it is the point of this check.');
process.exit(1);
