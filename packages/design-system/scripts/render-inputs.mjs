#!/usr/bin/env node
/**
 * One hash for everything the `visual` job's verdict depends on — and the
 * path rules story selection judges a change by, so the two cannot disagree.
 *
 *   node scripts/render-inputs.mjs                  print the hash
 *   node scripts/render-inputs.mjs --list           print what was left out, and why
 *   node scripts/render-inputs.mjs --also <path>    count a path the rules leave out
 *
 * `ci.yml` looks this hash up before the `visual` job does any work. If a run
 * with the same hash has already passed, the Storybook build, both browser
 * suites and the three index gates would re-derive a verdict that is already
 * known, and on a pull request the job skips them.
 *
 * ## One set of rules
 *
 * This file and `story-selection.mjs` used to classify paths separately, and
 * disagreed: a PR that edited only the publish workflow was told by selection
 * that it reached 0 of 137 stories, and by this hash — which counted every
 * workflow — that the verdict had to be re-derived. The rules now live here,
 * and selection imports them. This file carries no dependencies because the
 * key is taken before `pnpm install`.
 *
 * The verdict asks a wider question than selection does, in one place: the
 * index gates read every story and every component's props, so every non-test
 * file under `src/` and `.storybook/` counts here, not only the closures of the
 * asserted stories.
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
 * A tracked file counts unless a rule says otherwise and gives the reason, so
 * a file this forgets costs a re-run, never a skip. The reverse mistake is what
 * `main` is for: it never looks a verdict up, so a wrong exclusion fails the
 * push run after merge, and the fix is deleting the rule.
 *
 * Measured, and not obvious: Tailwind scans the package's `docs/` and
 * `scripts/` for class names, so a class written in prose *is* emitted into
 * Storybook's CSS. Prose is excluded anyway: a utility generated only by prose
 * matches no element any story renders, so it cannot move a pixel or an axe
 * result.
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const PKG = 'packages/design-system/';
const CI = '.github/workflows/ci.yml';
const SCRIPT = /^packages\/design-system\/scripts\/[^/]+\.m?js$/;
const SOURCE = new RegExp(`^${PKG}(src|\\.storybook)/`);
const UNIT_TEST = new RegExp(`^${PKG}src/(.*\\.test\\.tsx?|test-setup\\.ts)$`);

/* ------------------------------------------------------------------ *
 * The path rules, shared with story selection
 * ------------------------------------------------------------------ */

/** Files that change what every story renders or how every story is judged. */
export const GLOBAL_PATHS = [
  [/^pnpm-(lock|workspace)\.yaml$/, 'the dependency tree'],
  [/^\.gitignore$/, "Tailwind's source detection honours .gitignore"],
  [/^\.github\/actions\//, 'an action the suites run under'],
  [new RegExp(`^${PKG}src/.*\\.css$`), 'a stylesheet: Tailwind compiles one sheet for every story'],
  [new RegExp(`^${PKG}\\.storybook/`), 'Storybook configuration'],
  [new RegExp(`^${PKG}tests/(?!__snapshots__/)(?!(visual|a11y)\\.spec\\.ts$)`), 'the test harness'],
  [new RegExp(`^${PKG}(playwright\\.config\\.ts|serve\\.json|tsconfig\\.json)$`), 'suite or server configuration'],
];

/** Files that reach no gated story, each with the reason. */
export const INERT_PATHS = [
  [new RegExp(`^${PKG}docs/`), 'prose'],
  [UNIT_TEST, 'a unit test or its set-up; Vitest runs it, no story imports it'],
  [new RegExp(`^${PKG}[^/]+\\.md$`), 'prose'],
  [new RegExp(`^${PKG}scripts/`), 'tooling; the index gates run in full whatever is selected'],
  [new RegExp(`^${PKG}(api|skills|terminal)/`), 'published artefacts no story imports'],
  [new RegExp(`^${PKG}(vitest\\.config\\.mts|eslint\\.config\\.mjs|knip\\.json|licenses\\.baseline\\.json|tsup\\.config\\.ts|LICENSE)$`), 'unit, lint or package-build configuration'],
  [new RegExp(`^${PKG}playwright\\.walkthrough\\.config\\.ts$`), 'the walkthrough, which is not a gate'],
  [/^packages\/design-system-report\//, 'the second package, which depends on this one'],
  [/^(README\.md|LICENSE|vercel\.json|reference\/|docs\/)/, 'repository metadata and prose'],
  // Release train, drift, walkthrough, snapshot commands: none runs the gated
  // suites, so none can change their verdict. `ci.yml` is judged by its text.
  [/^\.github\//, 'a workflow that does not run the gated suites'],
];

/** The `package.json` fields that change what is installed or resolved. */
export const RESOLUTION_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'pnpm', 'overrides', 'exports', 'type'];

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

/** The `pnpm` scripts `ci.yml`'s `visual` job runs; none when it has no such job. */
export function visualScripts(workflow) {
  try {
    return workflow ? jobCommands(jobBody(workflow, 'visual')) : [];
  } catch {
    return [];
  }
}

/**
 * The package scripts a job reaches: the ones it runs, and every `pnpm <name>`
 * those invoke in turn. `build-storybook` calling `tokens:build` makes the
 * second as much a part of the job as the first.
 */
export function scriptClosure(scripts, roots) {
  const seen = new Set();
  const queue = [...roots];
  while (queue.length) {
    const name = queue.pop();
    if (seen.has(name) || !(name in scripts)) continue;
    seen.add(name);
    for (const [, next] of String(scripts[name]).matchAll(/\bpnpm\s+(?:run\s+)?([\w:-]+)/g)) queue.push(next);
  }
  return seen;
}

/**
 * `ci.yml` with the `jobs:` block cut out and comment-only lines dropped.
 * Top-level `env`, `defaults`, `permissions` and `concurrency` are inherited
 * by every job, `visual` included, so a change here reaches it.
 */
export function workflowOutsideJobs(text) {
  const out = [];
  let inJobs = false;
  for (const line of (text ?? '').split('\n')) {
    if (/^jobs:\s*$/.test(line)) { inJobs = true; continue; }
    if (inJobs && /^\S/.test(line) && !/^#/.test(line)) inJobs = false;
    if (inJobs || /^\s*(#.*)?$/.test(line)) continue;
    out.push(line.replace(/\s+#.*$/, '').trimEnd());
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * The key
 * ------------------------------------------------------------------ */

/**
 * The scripts the verdict depends on: the ones the `visual` job runs (with the
 * `pnpm` scripts those call), the ones its steps and actions name, this file,
 * anything a counted non-script file imports, and everything those import.
 */
export function reachableScripts({ files, read, visualCommands, packageScripts, jobText = '' }) {
  const tracked = new Set(files);
  const imports = (file) =>
    [...read(file).matchAll(/(?:from|import)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)]
      .map(([, spec]) => path.posix.normalize(path.posix.join(path.posix.dirname(file), spec)));
  const named = (text) => [...text.matchAll(/(?:packages\/design-system\/)?(scripts\/[\w.-]+\.m?js)/g)].map((m) => PKG + m[1]);
  const queue = [`${PKG}scripts/render-inputs.mjs`, ...named(jobText)];
  for (const name of scriptClosure(packageScripts, visualCommands)) queue.push(...named(packageScripts[name] ?? ''));
  for (const file of files) {
    if (SCRIPT.test(file) || !/\.(m?js|tsx?)$/.test(file) || INERT_PATHS.some(([re]) => re.test(file))) continue;
    for (const dep of imports(file)) if (SCRIPT.test(dep)) queue.push(dep);
  }
  const seen = new Set();
  while (queue.length) {
    const file = queue.pop();
    if (seen.has(file) || !tracked.has(file)) continue;
    seen.add(file);
    queue.push(...imports(file));
  }
  return seen;
}

/**
 * What one tracked file puts into the key: `null` for nothing, otherwise the
 * text hashed for it. Most files are their blob. `package.json` and `ci.yml`
 * are the parts story selection judges them by — the resolution fields and the
 * `visual` job's scripts; the workflow-level keys and the `visual` job — so a
 * version bump or an edit to another job leaves the verdict standing.
 */
export function verdictEntry(file, blob, { read, reachable }) {
  if (file === `${PKG}package.json` || file === 'package.json') {
    const json = JSON.parse(read(file));
    const scripts = json.scripts ?? {};
    const reach = [...scriptClosure(scripts, visualScripts(read(CI)))].sort();
    return JSON.stringify([RESOLUTION_FIELDS.map((field) => json[field] ?? null), reach.map((name) => [name, scripts[name]])]);
  }
  if (file === CI) {
    const text = read(file);
    return `${workflowOutsideJobs(text)}\n${jobBody(text, 'visual')}`;
  }
  if (SCRIPT.test(file)) return reachable.has(file) ? blob : null;
  if (GLOBAL_PATHS.some(([re]) => re.test(file))) return blob;
  if (SOURCE.test(file) && !UNIT_TEST.test(file)) return blob;
  if (INERT_PATHS.some(([re]) => re.test(file))) return null;
  return blob;
}

function main() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: here, encoding: 'utf8' }).trim();
  const read = (file) => readFileSync(path.join(root, file), 'utf8');
  const also = new Set(process.argv.flatMap((arg, i) => (process.argv[i - 1] === '--also' ? [arg] : [])));
  // Stage entries carry the blob id, so a file is hashed by git's own content
  // hash and nothing is read twice. Mode is kept: an executable bit is content.
  const rows = execFileSync('git', ['ls-files', '-s'], { cwd: root, encoding: 'utf8', maxBuffer: 64 << 20 })
    .trim()
    .split('\n')
    .map((row) => /^(\d+) ([0-9a-f]+) \d+\t(.*)$/.exec(row))
    .map(([, mode, sha, file]) => ({ file, blob: `${mode} ${sha}` }));
  const files = rows.map((row) => row.file);
  const visual = jobBody(read(CI), 'visual');
  const reachable = reachableScripts({
    files,
    read,
    visualCommands: jobCommands(visual),
    packageScripts: JSON.parse(read(`${PKG}package.json`)).scripts,
    jobText: [visual, ...files.filter((file) => /^\.github\/actions\/.+\.ya?ml$/.test(file)).map(read)].join('\n'),
  });

  const counted = [];
  const skipped = [];
  for (const { file, blob } of rows) {
    const entry = also.has(file) ? blob : verdictEntry(file, blob, { read, reachable });
    if (entry === null) skipped.push(file);
    else counted.push(`${file}\t${entry}`);
  }
  if (process.argv.includes('--list')) {
    console.log(`${counted.length} files count, ${skipped.length} do not:\n`);
    for (const file of skipped) console.log(`  ${file}`);
    console.log('');
  }
  console.log(createHash('sha256').update(counted.sort().join('\n')).digest('hex'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
