#!/usr/bin/env node
/**
 * One hash for everything the `visual` job's verdict depends on.
 *
 *   node scripts/render-inputs.mjs          print the hash
 *   node scripts/render-inputs.mjs --list   print what was left out, and why
 *
 * `ci.yml` looks this hash up before the `visual` job does any work. If a run
 * with the same hash has already passed, the Storybook build, both browser
 * suites and the three index gates would re-derive a verdict that is already
 * known, and on a pull request the job skips them. Twenty of the last hundred
 * merged PRs touched no rendering input at all — release-train fixes, docs,
 * governance scripts — and each paid ~5 minutes of browser time to re-confirm
 * a result nothing could have changed.
 *
 * ## Why inputs, not the build output
 *
 * Hashing `storybook-static/` would be the exact answer, and it does not
 * exist: two builds of one tree differ in 79 of 313 files, because
 * `react-docgen-typescript` emits a component's props in a different order
 * each run and every chunk hash downstream moves with it.
 *
 * ## Default-deny
 *
 * Every tracked file counts unless a rule below says otherwise and gives the
 * reason. A file this forgets is therefore an unnecessary re-run, never a
 * skipped one. The reverse mistake — counting something out that matters —
 * is what `main` is for: it never skips, so a wrong exclusion fails the push
 * run after merge, and the fix is deleting the rule.
 *
 * Not obvious, and measured: Tailwind scans the package's own `docs/` and
 * `scripts/` for class names, so a class written in prose *is* emitted into
 * Storybook's CSS. It is excluded anyway, because a utility generated only by
 * prose matches no element any story renders — it adds an unused rule and
 * cannot move a pixel or an axe result.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PKG = 'packages/design-system/';

/** Paths that cannot reach the `visual` job's verdict, each with the reason. */
export const EXCLUDED = [
  [/^packages\/design-system\/docs\//, 'prose; its classes match no rendered element'],
  [/^packages\/design-system\/[^/]+\.md$/, 'prose at the package root — AGENTS.md, DESIGN.md, CHANGELOG.md'],
  [/^packages\/design-system-report\//, 'the second package depends on this one, not the reverse'],
  [/^(README\.md|LICENSE|vercel\.json)$/, 'repository metadata and hosting config'],
  [/^reference\//, 'third-party reference material, never imported'],
];

const SCRIPT = /^packages\/design-system\/scripts\/[^/]+\.m?js$/;

/** Local `.mjs`/`.js` modules a source file imports, as repo paths. */
function localImports(file, text) {
  const out = [];
  for (const [, spec] of text.matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
    out.push(path.posix.normalize(path.posix.join(path.posix.dirname(file), spec)));
  }
  return out;
}

/**
 * The scripts the verdict depends on: the ones the `visual` job runs, this
 * file, and everything those import, followed transitively. The rest of
 * `scripts/` is gates that run elsewhere and release tooling.
 */
export function reachableScripts({ files, read, visualCommands, packageScripts, jobText = '' }) {
  const tracked = new Set(files);
  const queue = [`${PKG}scripts/render-inputs.mjs`];
  const named = (text) => [...text.matchAll(/(?:packages\/design-system\/)?(scripts\/[\w.-]+\.m?js)/g)].map((m) => PKG + m[1]);
  for (const name of visualCommands) queue.push(...named(packageScripts[name] ?? ''));
  // Named in the job itself or in an action it uses: the lockfile guard in
  // `setup`, the telemetry summariser. Counted whether or not they judge
  // anything — the rule is default-deny, not "only what decides".
  queue.push(...named(jobText));
  // Anything outside `scripts/` that counts and imports into it — a story, a
  // test, a config — pulls that script in too.
  for (const file of files) {
    if (SCRIPT.test(file) || !/\.(m?js|tsx?)$/.test(file) || EXCLUDED.some(([re]) => re.test(file))) continue;
    for (const dep of localImports(file, read(file))) if (SCRIPT.test(dep)) queue.push(dep);
  }
  const seen = new Set();
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || !tracked.has(file)) continue;
    seen.add(file);
    for (const dep of localImports(file, read(file))) queue.push(dep);
  }
  return seen;
}

/** Split `git ls-files -s` rows into what counts and what does not, with why. */
export function classify(rows, reachable) {
  const counted = [];
  const skipped = [];
  for (const row of rows) {
    const file = row.slice(row.indexOf('\t') + 1);
    const rule = EXCLUDED.find(([re]) => re.test(file));
    if (rule) skipped.push([file, rule[1]]);
    else if (SCRIPT.test(file) && !reachable.has(file)) skipped.push([file, 'a script the visual job neither runs nor imports']);
    else counted.push(row);
  }
  return { counted, skipped };
}

/** A job's lines in a workflow file, up to the next job. */
export function jobBody(workflow, job) {
  const lines = workflow.split('\n');
  const start = lines.findIndex((line) => line === `  ${job}:`);
  if (start < 0) throw new Error(`no job \`${job}\` in the workflow`);
  const end = lines.findIndex((line, i) => i > start && /^ {2}\S/.test(line));
  return lines.slice(start, end < 0 ? undefined : end).join('\n');
}

/** The pnpm scripts a job runs, read the way `check:governance` reads them. */
export function jobCommands(body) {
  return [...body.matchAll(/^\s*(?:-\s+)?run:\s*pnpm\s+([\w:-]+)\s*$/gm)].map((m) => m[1]);
}

function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: here, encoding: 'utf8' }).trim();
  const read = (file) => readFileSync(path.join(root, file), 'utf8');
  // Stage entries carry the blob id, so a file is hashed by git's own content
  // hash and nothing is read twice. Mode is kept: an executable bit is content.
  const rows = execFileSync('git', ['ls-files', '-s'], { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 })
    .trim()
    .split('\n')
    .map((row) => row.replace(/^(\d+) ([0-9a-f]+) \d+\t/, '$1 $2\t'));
  const files = rows.map((row) => row.slice(row.indexOf('\t') + 1));

  const visual = jobBody(read('.github/workflows/ci.yml'), 'visual');
  const actions = files.filter((file) => /^\.github\/actions\/.+\.ya?ml$/.test(file)).map(read);
  const reachable = reachableScripts({
    files,
    read,
    visualCommands: jobCommands(visual),
    packageScripts: JSON.parse(read(`${PKG}package.json`)).scripts,
    jobText: [visual, ...actions].join('\n'),
  });
  const { counted, skipped } = classify(rows, reachable);

  if (process.argv.includes('--list')) {
    console.log(`${counted.length} files count, ${skipped.length} do not:\n`);
    for (const [file, why] of skipped) console.log(`  ${file}  — ${why}`);
    console.log('');
  }
  console.log(createHash('sha256').update(counted.sort().join('\n')).digest('hex'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
