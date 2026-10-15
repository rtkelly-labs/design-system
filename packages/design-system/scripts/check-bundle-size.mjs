#!/usr/bin/env node
/**
 * Assert that the theme stylesheet stays within its byte budget, and report the
 * size of the ESM output without gating it.
 *
 * `src/theme.css` is the one asset every consumer ships whole: it is imported
 * as a stylesheet, so nothing shakes it. Its raw and gzipped sizes are a hard
 * ceiling.
 *
 * The ESM output under `dist/` used to carry a ceiling too, on all of its
 * modules concatenated. It was retired in #379. That sum grows with every
 * component the package adds, whether or not any consumer imports it, so it
 * failed on feature work rather than on bloat, and was raised in nearly every
 * feature PR (368 KB to 430 KB raw in three weeks). Since #316 the build is one
 * file per module, so what a consumer pays is the subset it imports, and that
 * is `check:import-cost`; what each runtime dependency costs is
 * `check:dep-cost`. The total is still printed here, so growth stays visible.
 *
 *   node scripts/check-bundle-size.mjs           verify theme.css, report dist
 *   node scripts/check-bundle-size.mjs --list    print current sizes and ceilings
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Ceilings in bytes (raw and gzip). gzip differs by a few bytes between zlib
 * builds, so record from a CI run and keep a small cushion.
 */
const BUDGETS = {
  'src/theme.css': {
    // #339 adds shipped symbol faces to all four role stacks and explains
    // their fallback order: 27,295 B raw, 5,127 B gzip on Node 22 in CI.
    // Local zlib emits 5,138 B. Keep the existing ~2% headroom for tooling.
    // D6/D8: per-level opaque role tints and the multi-select selection device:
    // 29,788 B raw, 5,440 B gzip locally. ~2% headroom kept.
    maxRaw: 30_400,
    // The reduced-motion block that collapses the duration tokens, and the
    // --transition-duration-* names Tailwind reads: 5,636 B gzip.
    maxGzip: 5_760,
    desc: 'Design token CSS',
  },
};

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(2).padStart(6)} KB (${bytes.toLocaleString('en-US')} B)`;
}

/** Every emitted `.js` file under `dist/`, in path order. */
function distFiles() {
  const walk = (dir) =>
    readdirSync(dir).flatMap((entry) => {
      const full = path.join(dir, entry);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
  const dist = path.join(ROOT, 'dist');
  return existsSync(dist) ? walk(dist).filter((file) => file.endsWith('.js')).sort() : [];
}

const problems = [];
const rows = [];

for (const [rel, budget] of Object.entries(BUDGETS)) {
  const full = path.join(ROOT, rel);
  if (!existsSync(full)) {
    problems.push(`${rel} does not exist. Run 'pnpm tokens:build' first.`);
    continue;
  }
  const content = readFileSync(full);
  const raw = content.length;
  const gzip = gzipSync(content).length;
  rows.push({ file: rel, desc: budget.desc, raw, maxRaw: budget.maxRaw, gzip, maxGzip: budget.maxGzip });

  if (raw > budget.maxRaw) {
    problems.push(`${rel} raw size ${formatBytes(raw)} exceeds budget ${formatBytes(budget.maxRaw)} (+${raw - budget.maxRaw} B)`);
  }
  if (gzip > budget.maxGzip) {
    problems.push(`${rel} gzip size ${formatBytes(gzip)} exceeds budget ${formatBytes(budget.maxGzip)} (+${gzip - budget.maxGzip} B)`);
  }
}

// Reported, never gated (#379).
const files = distFiles();
const dist = files.length ? Buffer.concat(files.map((file) => readFileSync(file))) : null;

if (process.argv.includes('--list')) {
  console.log('Bundle Size Census:');
  for (const r of rows) {
    console.log(`\n  ${r.file} (${r.desc}):`);
    console.log(`    raw:  ${formatBytes(r.raw)} / max ${formatBytes(r.maxRaw)}`);
    console.log(`    gzip: ${formatBytes(r.gzip)} / max ${formatBytes(r.maxGzip)}`);
  }
  console.log('');
}

if (problems.length) {
  console.error(`\nBundle size budget exceeded — ${problems.length} violation(s):\n`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error(
    '\nEvery consumer ships theme.css whole. If this increase was intentional, ' +
      'justify it and update BUDGETS in scripts/check-bundle-size.mjs.',
  );
  process.exit(1);
}

console.log(`Bundle size OK — ${rows.length} asset within its raw and gzip budget.`);
if (dist) {
  console.log(
    `  dist/**/*.js (reported, not gated): ${formatBytes(dist.length)} raw, ` +
      `${formatBytes(gzipSync(dist).length)} gzip across ${files.length} modules.`,
  );
}
