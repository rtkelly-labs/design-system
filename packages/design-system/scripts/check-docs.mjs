#!/usr/bin/env node
/**
 * Do the figures written in prose still match the source they describe?
 *
 * `DESIGN.md` said the contrast gate audits **440 pairs** for four months. The
 * gate reported 220. Nothing was wrong with the gate, the palette or the docs
 * pipeline — the number was typed in the commit that collapsed four Levels to
 * two, was stale the moment it was written, and survived every review since
 * because nothing compares prose to arithmetic. It was found by accident, by
 * rendering the figure next to a live `auditContrast` call and seeing the two
 * disagree.
 *
 * This is that comparison, as a gate. Every claim below names a figure, how to
 * compute it from the source, and the phrasings that carry it. A number that
 * drifts now fails CI at the line that states it.
 *
 * ## What this does not do
 *
 * It checks **declared** figures at **declared** phrasings. It is not a promise
 * that every number in every document is verified — that would need prose to be
 * parsed rather than matched, and a gate that claims more than it checks is
 * worse than none. Two things keep it honest:
 *
 *   1. A claim whose patterns match nothing anywhere is reported as a failure,
 *      not skipped. So rewording a sentence out from under a pattern surfaces as
 *      "declared but not found" rather than as a silent pass — the failure mode
 *      that would otherwise turn this file into decoration.
 *   2. Every site is reported with its file and line, so `--list` is a census of
 *      exactly which sentences are covered.
 *
 * Adding a claim is the cost of writing a new figure into prose, and it is meant
 * to be: a number in a document is an assertion, and this is where it is made.
 *
 * ## Not yet covered, and why
 *
 * The OKLab ΔE figures — the 0.049 tightest pair, the 0.04 separation floor, the
 * 0.024 that dropped an eleventh Hue, and the hue angles in `ansi.ts` — are the
 * obvious next claims. `deltaE` currently exists only as a local helper inside
 * `src/theme/palette.test.ts`, so gating them here means either a third
 * implementation of OKLab in this repo, which is exactly the drift ADR 0001
 * rejects, or lifting that helper into `contrast.ts` as an export — an
 * API-surface change that belongs in its own commit with its own `check:api`
 * update. Left undone deliberately rather than done twice.
 *
 *   node scripts/check-docs.mjs           fail if a figure disagrees
 *   node scripts/check-docs.mjs --list    show every site, including the ones that agree
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { auditContrast, auditHueAgreement, auditSelectionDevices, MINIMUM_RATIO } from '../src/theme/contrast.ts';
import { LEVELS, PALETTE_HUES, THEME_LEVELS } from '../src/theme/levels.ts';
import { ANSI_SLOTS } from '../src/theme/ansi.ts';
import { MEDIA, MEDIA_DEFINITIONS } from '../src/theme/media.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Every file that may state a figure. Prose and the comments beside the data. */
function sources() {
  const files = ['DESIGN.md', 'README.md', 'AGENTS.md', 'CONTEXT.md'];
  const walk = (dir) => {
    for (const entry of readdirSync(path.join(ROOT, dir))) {
      const rel = path.join(dir, entry);
      if (statSync(path.join(ROOT, rel)).isDirectory()) walk(rel);
      else if (/\.(md|ts)$/.test(entry)) files.push(rel);
    }
  };
  walk('docs');
  walk(path.join('src', 'theme'));
  return files.filter((file) => {
    try {
      statSync(path.join(ROOT, file));
      return true;
    } catch {
      return false;
    }
  });
}

/**
 * Numbers written as words, because most of these figures are small enough that
 * the prose spells them — "a terminal has sixteen positions". A count that grows
 * past twenty will want digits anyway.
 */
const WORDS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen', 'twenty',
];

/** A captured token to a number: `"16"`, `"5.5"` or `"sixteen"`. */
function toNumber(token) {
  const word = WORDS.indexOf(token.toLowerCase());
  if (word !== -1) return word;
  const parsed = Number(token);
  return Number.isNaN(parsed) ? null : parsed;
}

const AUDIT = auditContrast(LEVELS);
const FRAME_FLOOR = MEDIA_DEFINITIONS.video.contrastFloor;

/**
 * The claims.
 *
 * `actual` is computed from the source on every run — never a literal, or this
 * file becomes another place a number goes stale. `patterns` are anchored to the
 * sentence rather than to the bare number, so `(\d+) pairs` does not start
 * matching an unrelated count that happens to appear later.
 */
/** Count regex hits under a set of paths, skipping tests. `sources()` is the doc
 *  census and deliberately does not reach `src/components`, so these read the
 *  tree directly. */
function countIn(roots, filePattern, needle) {
  let n = 0;
  const visit = (rel) => {
    const abs = path.join(ROOT, rel);
    if (statSync(abs).isDirectory()) {
      for (const e of readdirSync(abs)) visit(path.join(rel, e));
      return;
    }
    if (!filePattern.test(rel) || rel.includes('.test.')) return;
    n += (readFileSync(abs, 'utf8').match(needle) ?? []).length;
  };
  for (const r of roots) visit(r);
  return n;
}

const CLAIMS = [
  {
    /*
     * Both figures below are stated in `docs/deterministic-rendering.md`, which
     * tells a consumer what to suppress before capturing. A transition that
     * arrives after the doc is written is one the consumer is not told about,
     * and `@keyframes` appearing at all would invalidate the doc's claim that
     * the one-line suppression is enough.
     */
    key: 'motion.transitions',
    what: 'CSS transitions across components and prose.css',
    actual: () => countIn(['src/components', 'src/prose.css'], /\.(tsx?|css)$/, /transition/g),
    patterns: [/(\d+) CSS transitions\b/g],
  },
  {
    key: 'motion.keyframes',
    what: '@keyframes rules in the package',
    actual: () => countIn(['src'], /\.css$/, /@keyframes/g),
    patterns: [/and \*\*(zero|\d+)\*\* `@keyframes`/g],
  },
  {
    key: 'contrast.pairs',
    what: 'contrast pairs audited, both Levels',
    actual: () => AUDIT.length,
    patterns: [/(\d+) pairs\b/g],
  },
  {
    key: 'contrast.pairsPerLevel',
    what: 'contrast pairs per Level',
    actual: () => AUDIT.length / THEME_LEVELS.length,
    patterns: [/(\d+) per (?:theme|Level)\b/g],
  },
  {
    key: 'contrast.selectionDevices',
    what: 'selection devices checked',
    /*
     * `auditSelectionDevices` returns 30 rows, and the sentence does not mean 30.
     * Six of them are `surface pair` — audited and printed precisely so nobody
     * rediscovers why a ground against a ground is *not* a selection device. The
     * figure in prose is the fills and edges, which is what `check:contrast`
     * reports as `devices.length - surfacePairs.length`.
     *
     * This was the gate's first finding, and it was wrong: it read 30 against the
     * documented 24 and blamed the document. A claim has to compute the thing the
     * sentence means, not the nearest array length.
     */
    actual: () =>
      auditSelectionDevices(LEVELS).filter((device) => device.device !== 'surface pair').length,
    patterns: [/(\d+) selection devices/g],
  },
  {
    key: 'contrast.hueAgreement',
    what: 'Role→Hue agreement checks',
    actual: () => auditHueAgreement(LEVELS).length,
    patterns: [/(\d+) Role→Hue agreement/g, /(\d+) Roles agree/g],
  },
  {
    key: 'floor.text',
    what: 'the text / accent / intent floor',
    actual: () => MINIMUM_RATIO.text,
    patterns: [/\| text, `accent`, `intent` \| ([\d.]+):1/g],
  },
  {
    key: 'floor.palette',
    what: 'the Hue floor',
    actual: () => MINIMUM_RATIO.palette,
    patterns: [/\*\*`palette`\*\* \| \*\*([\d.]+):1\*\*/g, /contrast ≥ ([\d.]+), separation/g],
  },
  {
    key: 'floor.paletteBright',
    what: 'the bright-Hue floor',
    actual: () => MINIMUM_RATIO.paletteBright,
    patterns: [/\| `palette\.bright` \| ([\d.]+):1/g],
  },
  {
    key: 'floor.border',
    what: 'the non-text UI floor',
    actual: () => MINIMUM_RATIO.borderStrong,
    patterns: [/\| `border\.strong`, `border\.default` \| ([\d.]+):1/g],
  },
  {
    key: 'floor.borderSubtle',
    what: 'the decorative hairline floor',
    actual: () => MINIMUM_RATIO.borderSubtle,
    patterns: [/\| `border\.subtle` \| ([\d.]+):1/g],
  },
  {
    key: 'frame.hueFloor',
    what: 'the frame Media Hue floor',
    actual: () => FRAME_FLOOR.hue,
    patterns: [/stricter ([\d.]+):1 frame floors/g],
  },
  {
    key: 'frame.failures',
    what: 'pairs below the frame floor',
    actual: () => auditContrast(LEVELS, FRAME_FLOOR).filter((check) => !check.passes).length,
    patterns: [/(\d+) of \d+ pairs below minimum/g, /those (\d+) are the number/g],
  },
  {
    key: 'ladder.levels',
    what: 'Levels on the ladder',
    actual: () => THEME_LEVELS.length,
    patterns: [/There are exactly (\w+), and \*\*neither/g],
  },
  {
    key: 'palette.hues',
    what: 'declared Hues',
    actual: () => PALETTE_HUES.length,
    patterns: [/fills them from (\w+) Hues/g, /fan out .{0,20}(\w+) Hues/g],
  },
  {
    key: 'ansi.slots',
    what: 'ANSI slots',
    actual: () => ANSI_SLOTS.length,
    patterns: [
      /has (\w+) positions named by colour/g,
      /terminal's (\w+) ANSI (?:slots|positions)/g,
      /The (\w+) slots, in the order/g,
      /a complete (\w+)-colour scheme/g,
      /The (\w+) ANSI slots, and the fan-out/g,
    ],
  },
  {
    key: 'media.count',
    what: 'declared Media',
    actual: () => MEDIA.length,
    patterns: [/There are (\w+) — `web`/g],
  },
  {
    key: 'surface.grounds',
    what: 'grounds per Level',
    actual: () => Object.keys(LEVELS[THEME_LEVELS[0]].surface).length,
    patterns: [/(\w+) grounds per (?:theme|Level)/gi],
  },
];

const list = process.argv.includes('--list');
const FILES = sources();
const problems = [];
const rows = [];

for (const claim of CLAIMS) {
  const expected = claim.actual();
  let found = 0;

  for (const file of FILES) {
    const text = readFileSync(path.join(ROOT, file), 'utf8');
    const lines = text.split('\n');

    for (const pattern of claim.patterns) {
      // A fresh regex per file: a `g` regex carries `lastIndex` between uses.
      const re = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = re.exec(text)) !== null) {
        found += 1;
        const line = text.slice(0, match.index).split('\n').length;
        const claimed = toNumber(match[1]);
        const agrees = claimed === expected;
        rows.push({ file, line, claim, claimed: match[1], expected, agrees });
        if (!agrees) {
          problems.push(
            `${file}:${line}  ${claim.key} — states ${match[1]}, source says ${expected}` +
              `\n    ${lines[line - 1].trim().slice(0, 110)}`,
          );
        }
      }
    }
  }

  if (found === 0) {
    problems.push(
      `${claim.key}: declared but no phrasing matched in any source file.\n` +
        `    Either the sentence was reworded — update the pattern — or the claim is gone and should be deleted.`,
    );
  }
}

console.log('Documented figures vs the source they describe\n');
console.log(`  ${CLAIMS.length} claims, ${rows.length} sites across ${FILES.length} files.`);
console.log(`  ${rows.filter((r) => r.agrees).length} agree, ${rows.filter((r) => !r.agrees).length} disagree.\n`);

if (list) {
  for (const claim of CLAIMS) {
    const mine = rows.filter((r) => r.claim === claim);
    console.log(`  ${claim.key} = ${claim.actual()}  (${claim.what})`);
    if (mine.length === 0) console.log('    (no site matched)');
    for (const row of mine) {
      console.log(`    ${row.agrees ? '[ OK ]' : '[FAIL]'} ${row.file}:${row.line}  states ${row.claimed}`);
    }
  }
  console.log('');
}

if (problems.length > 0) {
  console.error('Documented figures check failed:\n');
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    '\nThe source is the authority. Correct the prose, or if the source moved on purpose, correct it there too.',
  );
  process.exit(1);
}

console.log('Every documented figure agrees with the source.');
