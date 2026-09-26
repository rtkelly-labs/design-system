#!/usr/bin/env node
/**
 * Per-story selection, in shadow mode. See `story-selection.mjs` for the model.
 *
 *   node scripts/select-stories.mjs shadow     in CI, after both suites: what the
 *                                              change reaches, and whether any
 *                                              failure fell outside it
 *   pnpm stories:replay [--prs 100]            the same selection over merged PRs
 *   pnpm stories:graphs                        where the bundle and source graphs
 *                                              disagree, story by story
 *
 * **Nothing here skips anything.** `shadow` writes its answer to the job
 * summary and `telemetry/story-selection.json` and exits 0 whatever it finds;
 * both suites still run every story. The criteria for letting it decide are
 * in `docs/ci.md`, and they are counted from the `misses` this writes.
 *
 * The graph wants a Storybook build with `--stats-json`, which is what
 * `pnpm build-storybook` does. Without one, `shadow` reports that and stops.
 */

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { PACKAGE_ROOT, REPO_ROOT } from './repo-root.mjs';
import {
  PKG,
  assertedIds,
  compareClosures,
  detect,
  globalFiles,
  graphFromSource,
  graphFromStats,
  mergeGraphs,
  selectStories,
  snapshotMap,
  storyClosures,
} from './story-selection.mjs';

const git = (...args) =>
  execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'pipe'] });
const show = (rev, file) => {
  try {
    return git('show', `${rev}:${file}`);
  } catch {
    return null; // absent on that side
  }
};
const readJson = (file) => JSON.parse(readFileSync(path.join(PACKAGE_ROOT, file), 'utf8'));
const VISUAL = `${PKG}tests/visual.spec.ts`;
const A11Y = `${PKG}tests/a11y.spec.ts`;

/** Both graphs from the tree as checked out, unioned; and each alone. */
function loadGraphs() {
  const files = git('ls-files').trim().split('\n');
  const read = (file) => readFileSync(path.join(REPO_ROOT, file), 'utf8');
  const source = graphFromSource(files, read, { exports: readJson('package.json').exports });
  const statsFile = path.join(PACKAGE_ROOT, 'storybook-static/preview-stats.json');
  const stats = existsSync(statsFile) ? graphFromStats(JSON.parse(readFileSync(statsFile, 'utf8'))) : null;
  return { source, stats, merged: stats ? mergeGraphs(stats, source) : source };
}

function loadIndex() {
  const file = path.join(PACKAGE_ROOT, 'storybook-static/index.json');
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).entries : null;
}

/**
 * A context for `classifyChange`, reading the two sides from git. `unmove`
 * maps a current path to where it lived on that side — only the replay needs
 * it, for PRs from before #257 moved the package under `packages/`.
 */
function context(graph, index, asserted, base, head, unmove = { base: (f) => f, head: (f) => f }) {
  const closures = storyClosures(graph, index, asserted);
  const at = (rev, side) => (file) => show(rev, unmove[side](file));
  return {
    closures,
    graph,
    global: globalFiles(graph),
    snapshots: snapshotMap(at(base, 'base')(VISUAL), at(head, 'head')(VISUAL)),
    base: at(base, 'base'),
    head: at(head, 'head'),
  };
}

/** Repo-root paths a pre-#257 commit kept at the root rather than in the package. */
const ROOT_ONLY = /^(\.github\/|pnpm-lock\.yaml$|pnpm-workspace\.yaml$|reference\/|vercel\.json$|packages\/)/;

/** For a commit, the two-way map between today's layout and the one it had. */
function layoutAt(rev) {
  const moved = show(rev, `${PKG}package.json`) !== null;
  return {
    toNow: (file) => (moved || ROOT_ONLY.test(file) ? file : PKG + file),
    toThen: (file) => (moved || !file.startsWith(PKG) ? file : file.slice(PKG.length)),
  };
}

function changesBetween(base, head) {
  return git('diff', '--name-status', '-M', base, head)
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [status, a, b] = line.split('\t');
      return status.startsWith('R') ? { status: 'R', path: b, oldPath: a } : { status: status[0], path: a };
    });
}

/**
 * The commit this one is judged against. On a pull request the checkout is
 * GitHub's merge commit, whose first parent is the base it was merged onto;
 * on `main` it is the squash commit, whose parent is the previous `main`. A
 * depth-1 checkout has no parent, so deepen by one when it is missing.
 */
function parentOfHead() {
  try {
    return git('rev-parse', '--verify', '-q', 'HEAD^1').trim();
  } catch {
    git('fetch', '-q', '--deepen=1', 'origin');
    return git('rev-parse', '--verify', 'HEAD^1').trim();
  }
}

function render(selection, detection, extra) {
  const byKind = (kind) => selection.decisions.filter((d) => d.kind === kind);
  const lines = [
    '## Story selection (shadow — nothing was skipped)',
    '',
    selection.all
      ? `**Every story** (${selection.total}): at least one change reaches all of them.`
      : `**${selection.ids.length} of ${selection.total}** asserted stories are reachable from this change.`,
    '',
    `Graph: ${extra.graph}. Runner image: \`${extra.image || 'unknown'}\` (not yet compared with the base's).`,
    '',
  ];
  const global = byKind('global');
  if (global.length) {
    lines.push('Reaches every story:', ...global.slice(0, 20).map((d) => `- \`${d.path}\` — ${d.reason}`));
    if (global.length > 20) lines.push(`- …and ${global.length - 20} more`);
    lines.push('');
  }
  const some = byKind('stories');
  if (some.length) {
    lines.push('Reaches some stories:', ...some.slice(0, 30).map((d) => `- \`${d.path}\` — ${d.reason}: ${d.ids.length}`), '');
  }
  if (!selection.all && selection.ids.length) {
    lines.push('<details><summary>Selected stories</summary>', '', ...selection.ids.map((id) => `- ${id}`), '', '</details>', '');
  }
  if (detection) {
    lines.push(
      detection.misses.length
        ? `**Selection misses: ${detection.misses.length}** — failures enforcement would have skipped:`
        : `Selection misses: **0** (${detection.failures.length} failing or flaky test${detection.failures.length === 1 ? '' : 's'} checked).`,
      ...detection.misses.map((m) => `- ${m.title} (${m.project})${m.id ? '' : ' — names no story id'}`),
    );
  }
  return `${lines.join('\n')}\n`;
}

function shadow(opts) {
  const index = loadIndex();
  if (!index) {
    console.log('select-stories: no storybook-static/index.json — the build did not run; nothing to report.');
    return;
  }
  const { stats, merged } = loadGraphs();
  const head = 'HEAD';
  const base = opts.base ?? parentOfHead();
  const asserted = assertedIds(show(head, VISUAL) ?? '', show(head, A11Y) ?? '');
  const ctx = context(merged, index, asserted, base, head);
  const image = process.env.ImageOS && process.env.ImageVersion ? `${process.env.ImageOS}-${process.env.ImageVersion}` : null;
  const selection = selectStories(changesBetween(base, head), ctx, { asserted, image: { current: image } });

  const reports = (opts.playwright ?? [])
    .map((file) => path.join(PACKAGE_ROOT, file))
    .filter(existsSync)
    .map((file) => JSON.parse(readFileSync(file, 'utf8')));
  const detection = reports.length ? detect(selection, reports) : null;

  const record = {
    sha: process.env.GITHUB_SHA ?? git('rev-parse', 'HEAD').trim(),
    base,
    event: process.env.GITHUB_EVENT_NAME ?? 'local',
    graph: stats ? 'bundle ∪ source' : 'source only',
    image,
    all: selection.all,
    selected: selection.ids.length,
    total: selection.total,
    ids: selection.ids,
    decisions: selection.decisions,
    failures: detection?.failures ?? null,
    misses: detection?.misses ?? null,
  };
  const out = path.join(PACKAGE_ROOT, opts.out ?? 'telemetry/story-selection.json');
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(record, null, 2)}\n`);

  const markdown = render(selection, detection, { graph: record.graph, image });
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  else console.log(markdown);
}

/** The same selection over merged PRs, against the graph of the tree checked out now. */
function replay(opts) {
  const index = loadIndex();
  if (!index) throw new Error('replay needs storybook-static/ — run `pnpm build-storybook` first');
  const { stats, merged } = loadGraphs();
  const count = Number(opts.prs ?? 100);
  const prs = JSON.parse(
    execFileSync('gh', ['pr', 'list', '--state', 'merged', '-L', String(count), '--json', 'number,title,mergeCommit'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }),
  );
  const asserted = assertedIds(show('HEAD', VISUAL) ?? '', show('HEAD', A11Y) ?? '');
  const rows = [];
  for (const pr of prs) {
    const sha = pr.mergeCommit?.oid;
    if (!sha) continue;
    try {
      git('cat-file', '-e', `${sha}^`);
    } catch {
      continue; // not in this clone
    }
    const then = { base: layoutAt(`${sha}^`), head: layoutAt(sha) };
    const ctx = context(merged, index, asserted, `${sha}^`, sha, { base: then.base.toThen, head: then.head.toThen });
    const changes = changesBetween(`${sha}^`, sha).map((c) => ({
      ...c,
      path: then.head.toNow(c.path),
      oldPath: c.oldPath && then.base.toNow(c.oldPath),
    }));
    const selection = selectStories(changes, ctx, { asserted });
    const touched = selection.decisions.some((d) => d.kind !== 'none');
    rows.push({ pr: pr.number, title: pr.title, touched, all: selection.all, selected: selection.ids.length, why: selection.decisions.filter((d) => d.kind === 'global').map((d) => d.reason), global: selection.decisions.filter((d) => d.kind === 'global').map((d) => d.path) });
  }
  const total = asserted.size;
  const render_ = rows.filter((r) => r.touched);
  const partial = render_.filter((r) => !r.all).map((r) => r.selected).sort((a, b) => a - b);
  const scans = render_.reduce((sum, r) => sum + (r.all ? total : r.selected), 0);
  const causes = {};
  for (const r of render_.filter((x) => x.all)) for (const why of new Set(r.why)) causes[why] = (causes[why] ?? 0) + 1;
  const summary = {
    graph: stats ? 'bundle ∪ source' : 'source only',
    prs: rows.length,
    reachNothing: rows.length - render_.length,
    reachEverything: render_.filter((r) => r.all).length,
    reachSome: partial.length,
    medianSelected: partial[partial.length >> 1] ?? null,
    p90Selected: partial[Math.floor(partial.length * 0.9)] ?? null,
    scansVsToday: render_.length ? scans / (render_.length * total) : null,
    scansVsTodayAllPrs: rows.length ? scans / (rows.length * total) : null,
    globalCauses: causes,
  };
  if (opts.json) console.log(JSON.stringify({ summary, rows }, null, 2));
  else {
    console.log(`Replayed ${summary.prs} merged PRs against ${total} asserted stories (${summary.graph}).\n`);
    console.log(`  reach no story        ${summary.reachNothing}`);
    console.log(`  reach every story     ${summary.reachEverything}`);
    console.log(`  reach some            ${summary.reachSome}  (median ${summary.medianSelected}, p90 ${summary.p90Selected})`);
    console.log(`  scans vs today        ${(100 * summary.scansVsToday).toFixed(0)}% of rendering PRs, ${(100 * summary.scansVsTodayAllPrs).toFixed(0)}% of all\n`);
    console.log('  why a PR reached every story:');
    for (const [why, n] of Object.entries(causes).sort((a, b) => b[1] - a[1])) console.log(`    ${String(n).padStart(3)}  ${why}`);
  }
}

function graphs() {
  const index = loadIndex();
  const { stats, source } = loadGraphs();
  if (!index || !stats) throw new Error('graphs needs a `pnpm build-storybook` with --stats-json first');
  const asserted = assertedIds(show('HEAD', VISUAL) ?? '', show('HEAD', A11Y) ?? '');
  const a = storyClosures(stats, index, asserted);
  const b = storyClosures(source, index, asserted);
  const diff = compareClosures(a, b);
  console.log(`${Object.keys(a).length} stories; closures differ for ${diff.length}.\n`);
  const tally = (key) => {
    const counts = {};
    for (const d of diff) for (const f of d[key]) counts[f] = (counts[f] ?? 0) + 1;
    return Object.entries(counts).sort((x, y) => y[1] - x[1]);
  };
  console.log('Only the bundle graph sees (file — stories):');
  for (const [f, n] of tally('onlyA').slice(0, 25)) console.log(`  ${n}  ${f}`);
  console.log('\nOnly the source graph sees:');
  for (const [f, n] of tally('onlyB').slice(0, 25)) console.log(`  ${n}  ${f}`);
}

function parse(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    if (key === 'playwright') (opts.playwright ??= []).push(value);
    else opts[key] = value;
  }
  return opts;
}

const [command, ...rest] = process.argv.slice(2);
const opts = parse(rest);
if (command === 'shadow') {
  try {
    shadow(opts);
  } catch (error) {
    // Shadow mode never decides a build.
    console.log(`::warning::story selection failed and was skipped: ${error.stack ?? error}`);
  }
} else if (command === 'replay') replay(opts);
else if (command === 'graphs') graphs();
else {
  console.error('usage: select-stories.mjs shadow [--base <rev>] [--playwright <report.json>]... [--out <file>]\n' +
    '       select-stories.mjs replay [--prs 100] [--json]\n' +
    '       select-stories.mjs graphs');
  process.exit(2);
}
