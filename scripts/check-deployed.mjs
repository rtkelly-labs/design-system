/**
 * Is the deployed Storybook the one this repo builds?
 *
 * Production silently stopped updating. `Docs/CodeTabs` landed on 8 September in
 * #113 and was still absent from `design-system.ryankelly.dev` three days and
 * about thirty merged pull requests later — along with the whole Manifesto,
 * `Swatch`, `Card` and `DataTable`. 136 stories deployed against 168 built.
 *
 * Nothing reported it, and nothing could:
 *
 * - Vercel is **not** a required check, deliberately — it must never be able to
 *   block a merge. So its failures are advisory, and advisory red on every PR is
 *   red nobody reads.
 * - The failures were `build-rate-limit` on the account, which is not a code
 *   problem and does not look like one.
 * - Every gate in this repo verifies the tree. None of them looks at what is
 *   actually being served, which is #82's argument about theme artifacts
 *   arriving one layer up: a check that proves the source is right "would be
 *   equally happy with a generator that reproducibly emitted the wrong shape".
 *
 * ## Deliberately not a PR gate
 *
 * Production deploys *after* a merge, so on any PR this would compare a built
 * tree against a deployment that cannot include it yet, and fail every time. A
 * gate that is always red is a gate that gets removed.
 *
 * Run it on a schedule, or by hand when a deploy is in doubt.
 *
 *   node scripts/check-deployed.mjs            compare and report
 *   node scripts/check-deployed.mjs --strict   exit 1 on any drift
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = process.env.DS_SITE ?? 'https://design-system.ryankelly.dev';

let local;
try {
  local = JSON.parse(readFileSync(path.join(ROOT, 'storybook-static/index.json'), 'utf8')).entries;
} catch {
  console.error('No storybook-static/index.json. Run `pnpm build-storybook` first.');
  process.exit(1);
}

let deployed;
let builtAt = null;
try {
  const response = await fetch(`${SITE}/index.json`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  // The single most useful number when this fails: *when* the live build is
  // from. A drift of 38 stories reads very differently at two hours and at two
  // weeks, and the header is the only place that says which.
  builtAt = response.headers.get('last-modified');
  deployed = (await response.json()).entries;
} catch (error) {
  console.error(`Could not read ${SITE}/index.json — ${error.message}`);
  console.error('If the site is down that is the finding; if the network is, this check cannot run.');
  process.exit(1);
}

const localIds = new Set(Object.keys(local));
const deployedIds = new Set(Object.keys(deployed));
const missing = [...localIds].filter((id) => !deployedIds.has(id));
const stale = [...deployedIds].filter((id) => !localIds.has(id));

const titles = (ids, source) => [...new Set(ids.map((id) => source[id].title))].sort();

console.log(`Deployed Storybook — ${SITE}`);
console.log(`  built:    ${localIds.size} stories`);
console.log(`  deployed: ${deployedIds.size} stories`);
if (builtAt) console.log(`  built at: ${builtAt}`);

if (!missing.length && !stale.length) {
  console.log('\nThe deployment matches this build.');
  process.exit(0);
}

if (missing.length) {
  /*
   * Split by whether the *title* is absent or merely behind.
   *
   * Reporting only "11 titles" invites the reader to conclude that eleven
   * components are missing from the site, and it is not what the numbers say:
   * `Card` and `DataTable` are deployed and have newer stories that are not,
   * while `CodeTabs` and the Manifesto are absent entirely. Those are different
   * problems and the second is the alarming one.
   */
  const deployedTitles = new Set(Object.values(deployed).map((e) => e.title));
  const absent = titles(missing, local).filter((t) => !deployedTitles.has(t));
  const behind = titles(missing, local).filter((t) => deployedTitles.has(t));

  console.log(`\n  ${missing.length} stories built and not deployed.`);
  if (absent.length) {
    console.log(`\n  ${absent.length} titles absent from the deployment entirely:`);
    for (const title of absent) console.log(`    ${title}`);
  }
  if (behind.length) {
    console.log(`\n  ${behind.length} titles deployed but missing newer stories:`);
    for (const title of behind) console.log(`    ${title}`);
  }
}
if (stale.length) {
  console.log(`\n  ${stale.length} deployed and no longer built, across ${titles(stale, deployed).length} titles:`);
  for (const title of titles(stale, deployed)) console.log(`    ${title}`);
  console.log('    (a renamed story leaves its old id behind until the next deploy)');
}

console.log(
  '\nA deploy is triggered by a push to `main`. If those are failing, the cause is\n' +
    'usually the Vercel account build quota rather than this repo — see docs/hosting.md.',
);

if (process.argv.includes('--strict')) process.exit(1);
