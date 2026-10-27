#!/usr/bin/env node
/**
 * Fold an edge census into `tests/edges.baseline.json`.
 *
 *   EDGES_CENSUS=1 pnpm test:edges     measure every asserted story into temp/edges/
 *   node scripts/edges-baseline.mjs     record heavy panels and depth per story
 *
 * Re-record on purpose, in the PR that changes a story's edges, the way `/update-snapshots`
 * re-baselines pixels: the diff of the JSON is the change under review. A story the census did
 * not reach keeps its old entry, so a partial run cannot quietly loosen the ratchet.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CENSUS = path.join(ROOT, '..', '..', 'temp', 'edges');
const FILE = path.join(ROOT, 'tests', 'edges.baseline.json');

const baseline = JSON.parse(readFileSync(FILE, 'utf8'));
let changed = 0;
for (const name of readdirSync(CENSUS).filter((f) => f.endsWith('.json'))) {
  const { heavyPanels, maxDepth } = JSON.parse(readFileSync(path.join(CENSUS, name), 'utf8'));
  const id = name.slice(0, -'.json'.length);
  const before = baseline[id];
  if (!before || before.heavyPanels !== heavyPanels || before.maxDepth !== maxDepth) changed += 1;
  baseline[id] = { heavyPanels, maxDepth };
}
const sorted = Object.fromEntries(Object.keys(baseline).sort().map((id) => [id, baseline[id]]));
writeFileSync(FILE, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`edges.baseline.json — ${Object.keys(sorted).length} stories, ${changed} recorded or changed.`);
