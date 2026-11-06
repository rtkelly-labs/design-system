/**
 * Index every colour ever authored across a set of repos, from git history.
 *
 * This is an *audit*, not a source and not a Gate. It answers one question that
 * no file in the tree can: which colours have actually been chosen and kept,
 * as opposed to tried once and abandoned. That distinction is what the base
 * palette's hue angles are derived from — see `docs/palette-provenance.md`.
 *
 * It deliberately reports rather than fails. A colour count is not a contract,
 * and a check that failed on it would fail on every blog post that mentions a
 * hex code.
 *
 *   node scripts/audit-colour-history.mjs [--since 2026] [--out <path>] [repo…]
 *
 * Defaults to this repo plus a sibling `../blog` when one exists.
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync } from 'node:fs';
import { resolve, basename } from 'node:path';

/** Files where a hex literal is plausibly a *decision*. */
const INCLUDE = ['*.css', '*.scss', '*.ts', '*.tsx', '*.js', '*.jsx', '*.mjs', '*.svg', '*.md', '*.mdx', '*.json', '*.yml', '*.yaml'];

/** Imported artwork and generated documents. Their colours are someone else's. */
const VENDORED = /public\/static\/|\.drawio\.|node_modules|\/og\/|\bcv\.|\.pdf$/i;

/** Where a colour that is genuinely part of the system tends to live. */
const AUTHORED = /theme|token|tailwind\.css|levels\.ts|palette|globals|\.tsx?$|\.css$/i;

const HEX = /(?<![\w&])#([0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})(?![\w])/g;

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const since = flag('since', '2026');
const out = flag('out', 'docs/data/colour-audit.tsv');
const repos = args.filter((a) => !a.startsWith('--') && a !== since && a !== out);
if (repos.length === 0) {
  repos.push(process.cwd());
  if (existsSync(resolve(process.cwd(), '../blog/.git'))) repos.push(resolve(process.cwd(), '../blog'));
}

const git = (cwd, ...a) => {
  try {
    return execFileSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
};

/** sRGB hex → OKLCH. Hue is what the palette is anchored on; L and C explain the value. */
const decode = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function oklch(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => decode(parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C: Math.hypot(A, B), h };
}

/** Hue families. Boundaries are conventional; `pink` wraps past 360. */
const FAMILIES = [['red', 15, 40], ['orange', 40, 75], ['yellow', 75, 115], ['green', 115, 160],
  ['teal', 160, 190], ['cyan', 190, 230], ['blue', 230, 275], ['violet', 275, 310],
  ['magenta', 310, 335], ['pink', 335, 375]];
function family(c) {
  if (c.C < 0.035) return 'neutral';
  for (const [name, lo, hi] of FAMILIES) {
    if (hi > 360 ? c.h >= lo || c.h < hi - 360 : c.h >= lo && c.h < hi) return name;
  }
  return 'red';
}

const normalise = (raw) => {
  let h = raw.toLowerCase();
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6); // alpha is a surface question, not a palette one
  return h.length === 6 ? `#${h}` : null;
};

const colours = new Map();
for (const repo of repos) {
  const label = basename(repo);
  const log = git(repo, 'rev-list', '--all', '--reverse', '--pretty=format:%H\t%ai');
  const commits = log.split('\n').filter((l) => !l.startsWith('commit ') && l.includes('\t'))
    .map((l) => l.split('\t'));
  process.stderr.write(`${label}: ${commits.length} commits\n`);

  for (const [sha, date] of commits) {
    const text = git(repo, 'grep', '-I', '-h', '--no-color', '-E', '#[0-9A-Fa-f]{3,8}', sha, '--',
      ...INCLUDE.map((g) => `:(glob)**/${g}`));
    if (!text) continue;
    const found = new Set();
    for (const m of text.matchAll(HEX)) {
      const hex = normalise(m[1]);
      if (hex) found.add(hex);
    }
    for (const hex of found) {
      const seen = colours.get(hex) ?? { hex, commits: 0, first: date, last: date, repos: new Set(), files: new Set() };
      seen.commits += 1;
      if (date < seen.first) seen.first = date;
      if (date > seen.last) seen.last = date;
      seen.repos.add(label);
      colours.set(hex, seen);
    }
  }

  // File sites at HEAD only. Which colours are *live* is the question that matters;
  // resolving it per commit would multiply the cost for no extra answer.
  const head = git(repo, 'grep', '-I', '-n', '--no-color', '-E', '#[0-9A-Fa-f]{3,8}', 'HEAD', '--',
    ...INCLUDE.map((g) => `:(glob)**/${g}`));
  for (const line of head.split('\n')) {
    const [, path, ...rest] = line.split(':');
    if (!path) continue;
    for (const m of rest.join(':').matchAll(HEX)) {
      const hex = normalise(m[1]);
      if (hex && colours.has(hex)) colours.get(hex).files.add(`${label}/${path}`);
    }
  }
}

const tag = (c) => {
  if (c.files.size === 0) return 'RETIRED';
  const files = [...c.files];
  if (files.every((f) => VENDORED.test(f))) return 'VENDORED';
  return files.some((f) => AUTHORED.test(f) && !VENDORED.test(f)) ? 'AUTHORED' : 'INCIDENTAL';
};

const rows = [...colours.values()]
  .filter((c) => c.last >= since)
  .map((c) => ({ ...c, ...oklch(c.hex), tag: tag(c) }))
  .sort((a, b) => b.commits - a.commits || a.hex.localeCompare(b.hex));

const counts = rows.reduce((acc, r) => ({ ...acc, [r.tag]: (acc[r.tag] ?? 0) + 1 }), {});
const lines = [
  `# Colour audit — ${repos.map((r) => basename(r)).join(', ')}`,
  `# Generated by scripts/audit-colour-history.mjs. Evidence, not a source: every value here`,
  `# already originates somewhere, and nothing may read this file to obtain a colour.`,
  `# Regenerate with: node scripts/audit-colour-history.mjs`,
  `#`,
  `# ${rows.length} distinct values authored on or after ${since}. ` +
    Object.entries(counts).sort().map(([k, v]) => `${k}=${v}`).join(' '),
  `# AUTHORED live in a theme/token/component file · INCIDENTAL live only in one-off surfaces`,
  `# VENDORED live only in imported artwork · RETIRED present in history, gone at HEAD`,
  `#`,
  ['hex', 'tag', 'family', 'hue', 'L', 'C', 'commits', 'first', 'last', 'repos', 'site'].join('\t'),
  ...rows.map((r) => [r.hex, r.tag, r.family ?? family(r), Math.round(r.h), r.L.toFixed(3),
    r.C.toFixed(3), r.commits, r.first.slice(0, 10), r.last.slice(0, 10),
    [...r.repos].sort().join('+'), [...r.files][0] ?? ''].join('\t')),
];
for (const r of rows) r.family = family(r);
writeFileSync(out, `${lines.join('\n')}\n`);
process.stderr.write(`\n${rows.length} values → ${out}\n${JSON.stringify(counts)}\n`);
