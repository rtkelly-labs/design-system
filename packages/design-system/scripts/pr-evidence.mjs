#!/usr/bin/env node
/**
 * Before and after, on the pull request — Piece 2 of `docs/evidence-pipeline.md`,
 * as stills rather than video.
 *
 * The visual suite already renders every asserted story in the pinned image and
 * compares it with a committed baseline. `pr-evidence.yml` points that machinery
 * at a different question: it checks out the PR head, swaps in the baselines
 * from the PR's *merge base*, and runs the suite once. Every mismatch Playwright
 * writes is then exactly "what this PR changes", and every missing baseline is a
 * story this PR adds. For a stacked PR the merge base is the lower branch, so
 * each PR shows only its own increment.
 *
 *   node scripts/pr-evidence.mjs collect --results test-results --snapshots tests/__snapshots__
 *        --before-list base-snapshots.txt --report evidence-run.json --out <dir>
 *        [--pr N --head SHA --base SHA --base-ref REF]
 *   node scripts/pr-evidence.mjs comment --manifest <dir>/manifest.json --raw <url> [--run-url URL]
 *
 * `collect` copies the images into `<dir>/<case>/{before,after,diff}.png` and
 * writes `manifest.json`. `comment` turns a manifest into the sticky PR comment
 * on stdout, with image URLs under `--raw`.
 *
 * Deliberately standalone — Node built-ins only — because the workflow runs it
 * from its own commit against a PR head that may predate this file.
 *
 * Not a gate. It exits 0 whatever the suite found.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

/** The comment's identity: the workflow edits the comment carrying it rather than adding another. */
export const MARKER = '<!-- pr-evidence -->';

/** Shown open, with images. A theme change can move every baseline; a phone cannot scroll 195 of them. */
const OPEN = 6;
/** Shown with images behind a disclosure. Beyond this, names only — GitHub caps a comment at 65,536 characters. */
const WITH_IMAGES = 40;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const SUFFIX = /-(expected|actual|diff)\.png$/;

/**
 * Playwright's own output for each screenshot it could not match: `<name>-expected.png`
 * (the baseline it was given — here, the merge base's), `-actual.png` and `-diff.png`.
 * A name with an actual and no expected had no baseline: a story this PR adds.
 */
export function pairsFromResults(files) {
  const cases = new Map();
  for (const file of files) {
    const match = SUFFIX.exec(path.basename(file));
    if (!match) continue;
    const name = path.basename(file).replace(SUFFIX, '');
    const entry = cases.get(name) ?? { name };
    entry[match[1]] = file;
    cases.set(name, entry);
  }
  return [...cases.values()];
}

const plain = (message) => String(message ?? '').replace(/\u001b\[[0-9;]*m/g, '');

/**
 * Errors that are not a pixel comparison: a story that would not render is evidence too.
 * Top-level errors — Storybook's server never started, a config would not load — come
 * first: they mean nothing was compared at all.
 */
export function renderFailures(report) {
  const out = (report?.errors ?? []).map((error) => ({
    title: 'run',
    message: plain(error.message ?? error.value).split('\n')[0].slice(0, 240),
  }));
  const visit = (suite, trail) => {
    for (const child of suite.suites ?? []) visit(child, [...trail, child.title]);
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests ?? []) {
        for (const result of t.results ?? []) {
          for (const error of result.errors ?? []) {
            const message = plain(error.message);
            if (/screenshot|snapshot/i.test(message)) continue;
            out.push({ title: [t.projectName, ...trail, spec.title].filter(Boolean).join(' › '), message: message.split('\n')[0].slice(0, 240) });
          }
        }
      }
    }
  };
  for (const suite of report?.suites ?? []) visit(suite, []);
  return out;
}

/** Mobile first — the owner reviews on a phone — then by name. */
export function order(names) {
  const mobile = (n) => (/mobile/.test(n) ? 0 : 1);
  return [...names].sort((a, b) => mobile(a) - mobile(b) || a.localeCompare(b));
}

function collect(argv) {
  const { values: o } = parseArgs({
    args: argv,
    options: {
      results: { type: 'string', default: 'test-results' },
      snapshots: { type: 'string', default: 'tests/__snapshots__' },
      'before-list': { type: 'string' },
      report: { type: 'string' },
      out: { type: 'string' },
      pr: { type: 'string', default: '' },
      head: { type: 'string', default: '' },
      base: { type: 'string', default: '' },
      'base-ref': { type: 'string', default: '' },
      status: { type: 'string', default: 'rendered' },
    },
  });
  if (!o.out) throw new Error('collect needs --out');
  mkdirSync(o.out, { recursive: true });

  const changed = [];
  const added = [];
  for (const entry of pairsFromResults(walk(o.results))) {
    const dir = path.join(o.out, entry.name);
    mkdirSync(dir, { recursive: true });
    if (entry.expected && entry.actual) {
      copyFileSync(entry.expected, path.join(dir, 'before.png'));
      copyFileSync(entry.actual, path.join(dir, 'after.png'));
      if (entry.diff) copyFileSync(entry.diff, path.join(dir, 'diff.png'));
      changed.push(entry.name);
    } else if (entry.actual) {
      copyFileSync(entry.actual, path.join(dir, 'after.png'));
      added.push(entry.name);
    }
  }

  // A new baseline Playwright wrote without leaving an `-actual` behind still counts.
  const before = new Set(
    o['before-list'] && existsSync(o['before-list'])
      ? readFileSync(o['before-list'], 'utf8').split('\n').map((l) => path.basename(l.trim())).filter(Boolean)
      : [],
  );
  for (const file of walk(o.snapshots).filter((f) => f.endsWith('.png'))) {
    const name = path.basename(file, '.png');
    if (before.size && !before.has(`${name}.png`) && !added.includes(name) && !changed.includes(name)) {
      mkdirSync(path.join(o.out, name), { recursive: true });
      copyFileSync(file, path.join(o.out, name, 'after.png'));
      added.push(name);
    }
  }

  const report = o.report && existsSync(o.report) ? JSON.parse(readFileSync(o.report, 'utf8')) : null;
  const manifest = {
    pr: o.pr,
    head: o.head,
    base: o.base,
    baseRef: o['base-ref'],
    status: o.status !== 'rendered' ? o.status : report ? 'rendered' : 'no-report',
    total: report?.stats ? report.stats.expected + report.stats.unexpected + report.stats.flaky : null,
    changed: order(changed),
    added: order(added),
    failures: renderFailures(report),
  };
  writeFileSync(path.join(o.out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`changed ${changed.length}, added ${added.length}, failures ${manifest.failures.length}`);
}

const short = (sha) => (sha || '').slice(0, 7);

function images(raw, name, kinds, dir) {
  const has = (k) => !dir || existsSync(path.join(dir, name, `${k}.png`));
  return kinds
    .filter(has)
    .map((k) => `**${k === 'before' ? 'Before' : k === 'after' ? 'After' : 'Diff'}**<br><img src="${raw}/${encodeURIComponent(name)}/${k}.png" alt="${name}, ${k}" width="100%">`)
    .join('<br>\n');
}

export function renderComment(manifest, { raw, runUrl = '', dir = null } = {}) {
  const { changed = [], added = [], failures = [] } = manifest;
  const lines = [MARKER, '### Before / after'];
  const range = `\`${manifest.baseRef || 'base'}\` @ \`${short(manifest.base)}\` → \`${short(manifest.head)}\``;

  if (manifest.status === 'build-failed') {
    lines.push('', `Storybook did not build at ${range}, so nothing could be rendered.`);
  } else if (manifest.status === 'no-report') {
    lines.push('', `The visual suite produced no report at ${range}.`);
  } else if (!manifest.total && !changed.length && !added.length) {
    // An all-clear needs something to have been compared.
    lines.push('', `The visual suite compared nothing at ${range}${failures.length ? '; the errors are below' : ''}.`);
  } else if (!changed.length && !added.length) {
    lines.push('', `No asserted story renders differently: ${range}${manifest.total ? `, ${manifest.total} captures compared` : ''}.`);
  } else {
    lines.push('', `${range}: **${changed.length}** changed, **${added.length}** new${manifest.total ? `, of ${manifest.total} captures` : ''}. Rendered in the pinned image against the merge base's baselines.`);
  }

  const entries = [
    ...changed.map((name) => ({ name, kinds: ['before', 'after'], extra: true })),
    ...added.map((name) => ({ name, kinds: ['after'], label: 'new' })),
  ];
  entries.forEach((entry, i) => {
    const title = `\`${entry.name}\`${entry.label ? ` · ${entry.label}` : ''}`;
    if (i >= WITH_IMAGES) return;
    const body = images(raw, entry.name, entry.kinds, dir);
    const diff = entry.extra && (!dir || existsSync(path.join(dir, entry.name, 'diff.png')))
      ? `\n\n<details><summary>Diff</summary>\n\n${images(raw, entry.name, ['diff'], dir)}\n\n</details>`
      : '';
    lines.push('', i < OPEN ? `#### ${title}\n\n${body}${diff}` : `<details><summary>${title}</summary>\n\n${body}${diff}\n\n</details>`);
  });
  if (entries.length > WITH_IMAGES) {
    lines.push('', `<details><summary>${entries.length - WITH_IMAGES} more, names only</summary>\n\n${entries.slice(WITH_IMAGES).map((e) => `- \`${e.name}\``).join('\n')}\n\n</details>`);
  }

  if (failures.length) {
    lines.push('', `<details><summary>${failures.length} failed to render</summary>\n\n${failures.slice(0, 30).map((f) => `- ${f.title}: ${f.message.replace(/[<>]/g, '')}`).join('\n')}\n\n</details>`);
  }

  lines.push('', `<sub>Not a gate. Re-run with \`/evidence\`.${runUrl ? ` [Run](${runUrl})` : ''}</sub>`);
  return lines.join('\n');
}

function comment(argv) {
  const { values: o } = parseArgs({
    args: argv,
    options: { manifest: { type: 'string' }, raw: { type: 'string', default: '' }, 'run-url': { type: 'string', default: '' } },
  });
  const manifest = JSON.parse(readFileSync(o.manifest, 'utf8'));
  process.stdout.write(renderComment(manifest, { raw: o.raw, runUrl: o['run-url'], dir: path.dirname(o.manifest) }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, ...rest] = process.argv.slice(2);
  if (command === 'collect') collect(rest);
  else if (command === 'comment') comment(rest);
  else {
    console.error('usage: pr-evidence.mjs collect|comment …');
    process.exit(2);
  }
}
