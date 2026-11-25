#!/usr/bin/env node
/**
 * The render benchmarks' JSON (`pnpm bench` with `BENCH_JSON` set) as one
 * Markdown table, for the `experiment:bench` job's summary.
 *
 *   node scripts/bench-summary.mjs telemetry/bench.json >> "$GITHUB_STEP_SUMMARY"
 *
 * Median rather than mean: a shared runner's stalls land in the tail, and one
 * 200 ms pause in ten samples moves the mean by 20 ms. `rme` is printed so a
 * reader can see which rows are noise. Not a gate, and exits 0 on a missing
 * or unreadable file: an instrument that can fail a build gets deleted.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

const file = process.argv[2];
let report;
try {
  report = JSON.parse(readFileSync(file, 'utf8'));
} catch (error) {
  console.log(`> Bench report unreadable (${file}): ${error.message}`);
  process.exit(0);
}

const ms = (value) => (value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2));
const out = [
  '### Render benchmarks (jsdom)',
  '',
  'Times in ms per operation. Comparable only with another run on the same runner.',
  '',
  '| Component, size | Operation | median | p75 | ± rme | samples |',
  '| --- | --- | ---: | ---: | ---: | ---: |',
];
for (const { filepath, groups } of report.files ?? []) {
  const prefix = `${path.basename(filepath)} > `;
  for (const group of groups ?? []) {
    const name = group.fullName.split(' > ').slice(1).join(' > ') || group.fullName.replace(prefix, '');
    for (const b of group.benchmarks ?? []) {
      out.push(`| ${name} | ${b.name} | ${ms(b.median)} | ${ms(b.p75)} | ${b.rme.toFixed(0)}% | ${b.sampleCount} |`);
    }
  }
}
console.log(out.join('\n'));
