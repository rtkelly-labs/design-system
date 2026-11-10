/**
 * The medians `lighthouserc.json` asserts on, as one Markdown table per run.
 *
 * LHCI's own output names a failing audit but not the number, and its HTML
 * reports are one file per URL per run. This reads the raw results it leaves
 * in `.lighthouseci/` and prints, per page, the median of each budgeted metric
 * across runs — the same aggregation the assertions use — so the job summary
 * says what the page measured, not only whether it passed.
 *
 *   node scripts/lighthouse-summary.mjs [.lighthouseci]
 *
 * Not a gate: it exits 0 whatever it reads, and prints nothing for no results.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const dir = path.resolve(process.argv[2] ?? '.lighthouseci');
const files = existsSync(dir) ? readdirSync(dir).filter((file) => /^lhr-.*\.json$/.test(file)) : [];

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const pages = new Map();
for (const file of files) {
  const lhr = JSON.parse(readFileSync(path.join(dir, file), 'utf8'));
  const audits = lhr.audits;
  const font = audits['resource-summary']?.details?.items?.find((item) => item.resourceType === 'font');
  const page = new URL(lhr.requestedUrl).pathname;
  const runs = pages.get(page) ?? [];
  runs.push({
    score: lhr.categories.performance.score * 100,
    lcp: audits['largest-contentful-paint'].numericValue,
    tbt: audits['total-blocking-time'].numericValue,
    cls: audits['cumulative-layout-shift'].numericValue,
    bytes: audits['total-byte-weight'].numericValue,
    fonts: font?.transferSize ?? 0,
  });
  pages.set(page, runs);
}

if (pages.size > 0) {
  const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
  const runs = Math.max(...[...pages.values()].map((page) => page.length));
  console.log(`### Lighthouse — median of ${runs} runs per page\n`);
  console.log('| Page | Score | LCP | TBT | CLS | Bytes | Font bytes |');
  console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const [page, results] of [...pages].sort(([a], [b]) => a.localeCompare(b))) {
    const m = (key) => median(results.map((result) => result[key]));
    console.log(
      `| \`${page}\` | ${Math.round(m('score'))} | ${Math.round(m('lcp'))} ms | ${Math.round(m('tbt'))} ms | ` +
        `${m('cls').toFixed(3)} | ${kb(m('bytes'))} | ${kb(m('fonts'))} |`,
    );
  }
}
