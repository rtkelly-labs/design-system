/**
 * Does every component say what it is for?
 *
 * Two gates already sit either side of this one and neither asks it:
 *
 *   check:visual-coverage   does this component have an *asserted story*
 *   check:docs              do *figures written in prose* match the source
 *   (this)                  is this component documented at all
 *
 * So a component could ship with an asserted story, correct arithmetic in every
 * gate, and no explanation anywhere of what it is for or when to reach for it.
 * #142's manifesto is one system-wide page and does not substitute for
 * per-component documentation, which is the thing a consumer reads at the moment
 * they are choosing between two components.
 *
 * ## A ratchet, not an assertion
 *
 * 19 of 42 are bare today. A gate that cannot pass on the day it lands does not
 * land — PR #58 is the proof, and #149 the argument. So BUDGET is the count now
 * and CI fails only if it rises. Lower it as components are documented; delete
 * the line at zero.
 *
 * ## What counts
 *
 * A JSDoc block immediately above the exported component. Not a line comment,
 * and not a block somewhere else in the file: the point is that it is the thing
 * an editor shows on hover and `react-docgen` reads for the props table, which
 * is #127's complaint one layer up.
 *
 *   node scripts/check-component-docs.mjs           verify
 *   node scripts/check-component-docs.mjs --list    print the census
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS = path.join(ROOT, 'src/components');

/**
 * Files that export no component, so there is nothing for a consumer to read
 * about. Each needs a reason, the same contract `check:visual-coverage` uses for
 * its exclusions.
 */
const EXCLUDED = {
  'docs/mdxComponents.tsx': 'A mapping object handed to MDXProvider, not a component.',
  'docs/DocsLinkProvider.tsx': 'A context provider; its contract is the docs it is documented in.',
};

/** The count of undocumented components on the day this gate landed. */
const BUDGET = 17;

function componentFiles(dir = COMPONENTS) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return componentFiles(full);
    if (!entry.endsWith('.tsx') || entry.includes('.test.')) return [];
    return [full];
  });
}

/** A JSDoc block immediately above an exported component declaration. */
const DOCUMENTED = /\/\*\*[\s\S]*?\*\/\s*\n\s*export (?:function|const) [A-Z]/;

const documented = [];
const bare = [];
const excluded = [];

for (const file of componentFiles().sort()) {
  const rel = path.relative(COMPONENTS, file);
  if (EXCLUDED[rel]) {
    excluded.push(`${rel} — ${EXCLUDED[rel]}`);
    continue;
  }
  (DOCUMENTED.test(readFileSync(file, 'utf8')) ? documented : bare).push(rel);
}

if (process.argv.includes('--list')) {
  console.log(`Documented (${documented.length}):`);
  for (const f of documented) console.log(`  ${f}`);
  console.log(`\nUndocumented (${bare.length}):`);
  for (const f of bare) console.log(`  ${f}`);
  console.log(`\nExcluded (${excluded.length}):`);
  for (const f of excluded) console.log(`  ${f}`);
  console.log('');
}

const total = documented.length + bare.length;
console.log(
  `Component docs — ${documented.length} of ${total} documented, ${excluded.length} excluded with a reason.`,
);

if (bare.length > BUDGET) {
  console.error(`\nComponent docs check failed — ${bare.length} undocumented, budget ${BUDGET}.\n`);
  for (const f of bare.slice(0, 10)) console.error(`  - ${f}`);
  console.error(
    '\nA component with no JSDoc is one a consumer has to read the source to choose.\n' +
      'Document it, or exclude it with a reason in scripts/check-component-docs.mjs.',
  );
  process.exit(1);
}

if (bare.length < BUDGET) {
  console.log(`  ${BUDGET - bare.length} below budget — lower BUDGET to ${bare.length}.`);
}
