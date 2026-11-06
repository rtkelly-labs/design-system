#!/usr/bin/env node
/**
 * Count the call sites still addressing a colour by hue rather than by role.
 *
 * `scripts/build-tokens.mjs` has referenced this command since the compat
 * aliases were written — *"`pnpm check:tokens` counts the remaining call sites;
 * this block comes out when that reaches zero"* — and it did not exist. The exit
 * condition for deleting ~30 emitted aliases was therefore unmeasurable, so the
 * block sat there indefinitely. This is that command.
 *
 * A ratchet, not a ban, in the same family as `check:css` and `check:deps`. The
 * budget only ever goes down; a new hue-named call site fails the build with the
 * role it should have used.
 *
 *   node scripts/check-tokens.mjs           fail if the count rises
 *   node scripts/check-tokens.mjs --list    print every site
 *
 * ## What counts, and why the mapping is what it is
 *
 * `LegacyAccent` is `'cyan' | 'pink' | 'yellow' | 'green'`, and `LEGACY_VARS`
 * resolves each onto a *role* variable rather than onto its own hue. That is
 * not an accident to be corrected: when those call sites were written there was
 * no hue vocabulary, so `accent="cyan"` could only have meant "the primary
 * accent, which happens to be cyan". Repointing them at `palette.cyan` would
 * change what they render.
 *
 * It matters because the names are already lying on the light level. `palette`
 * exists now, and on `sketch`:
 *
 *   accent="cyan"    renders #1450d7   palette.cyan   is #006675
 *   accent="yellow"  renders #006b2e   palette.yellow is #705a00
 *   accent="pink"    renders #bd0010   palette.pink   is #b4006c
 *
 * So a component asking for cyan gets blue, one asking for yellow gets green,
 * and one asking for pink gets red. Migrating to the role name makes the code
 * say what it does; migrating to the hue token would make it render something
 * else. Both are defensible and only one is a refactor.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

/**
 * The budget. Lower it in the same commit that removes a site; never raise it.
 * At zero, `compatAliases()` in build-tokens.mjs comes out and so does this
 * file.
 */
const BUDGET = 0;

/** Hue name -> the role that name already resolves to, per `LEGACY_VARS`. */
const REPLACEMENT = {
  cyan: 'primary',
  yellow: 'secondary',
  pink: 'tertiary',
  green: 'success',
};

/** A hue name used as a prop value: accent="cyan", variant="pink", … */
const PROP = /\b(accent|variant|tone)=(?:"|')(cyan|pink|yellow|green)(?:"|')/g;
/** The same, in an object or array literal: accent: 'cyan', ['cyan', …] */
const LITERAL = /(?:accent|variant|tone)\s*:\s*'(cyan|pink|yellow|green)'/g;
/** A Tailwind utility naming the compat palette. */
const UTILITY = /\b(?:bg|text|border|shadow)-brutalist-[a-zA-Z]+/g;
/**
 * A hue name in a *comparison* rather than a value.
 *
 * Added because the first version of this gate missed one and the visual suite
 * caught it instead. `SaasLandingPage` had:
 *
 *     variant={tier.accent === 'pink' ? 'pink' : tier.accent === 'yellow' ? 'yellow' : 'cyan'}
 *
 * The prop-value patterns above match `variant="pink"`, so they rewrote every
 * declaration — and left the comparisons. Once `tier.accent` held `'tertiary'`,
 * both tests were false and all three pricing CTAs fell through to cyan. 26,980
 * pixels, and `check:tokens` reported zero sites while it happened.
 *
 * A gate that only sees one syntactic form of a thing gives a false all-clear
 * on the others, which is worse than not existing — it is the reason the
 * migration looked finished.
 */
const COMPARISON = /===?\s*(?:"|')(cyan|pink|yellow|green)(?:"|')/g;

/**
 * Files that define the deprecation rather than use it. `theme.ts` declares
 * `LegacyAccent` and `LEGACY_VARS`; `contrast.ts` and the generator name the
 * hues structurally. Excluding them keeps the count a measure of *callers*.
 */
const DEFINITIONS = new Set([
  'lib/theme.ts',
  'theme/contrast.ts',
  'theme/levels.ts',
  'lib/accentClasses.ts',
]);

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const sites = [];
for (const file of walk(SRC)) {
  if (!/\.tsx?$/.test(file)) continue;
  const rel = path.relative(SRC, file);
  if (DEFINITIONS.has(rel)) continue;
  // Tests asserting the deprecated behaviour are keeping a promise, not making
  // one. They come out with the alias, not before it.
  if (/\.test\.tsx?$/.test(rel)) continue;

  const text = readFileSync(file, 'utf8');
  // Blank out comments before matching.
  //
  // The first run of this checker flagged its own explanation: the JSDoc on
  // `Avatar.accent` says `accent="cyan"` in order to describe what is
  // deprecated, and the regex read that as a call site. Documenting a
  // deprecation must not count as committing it — the same mistake, and the
  // same fix, as `strip_code` in shared-utilities' AGENTS.md auditor, where a
  // markdown link inside a code span was being read as a live pointer.
  const stripped = text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));

  stripped.split('\n').forEach((line, i) => {
    for (const re of [PROP, LITERAL, UTILITY, COMPARISON]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(line)) !== null) {
        const hue = m[2] ?? m[1];
        sites.push({
          file: rel,
          line: i + 1,
          match: m[0].trim(),
          fix: REPLACEMENT[hue] ? `use "${REPLACEMENT[hue]}"` : 'use a role token',
        });
      }
    }
  });
}

if (process.argv.includes('--list')) {
  for (const s of sites) {
    console.log(`  ${s.file}:${s.line}  ${s.match.padEnd(28)} ${s.fix}`);
  }
  console.log(`\n${sites.length} site(s), budget ${BUDGET}.`);
  process.exit(0);
}

if (sites.length > BUDGET) {
  console.error(`Hue-named call sites: ${sites.length}, budget ${BUDGET}.\n`);
  for (const s of sites) {
    console.error(`  ${s.file}:${s.line}  ${s.match.padEnd(28)} ${s.fix}`);
  }
  console.error(
    '\nA colour is addressed by its job, not its appearance — see docs/adr/0001-hues-declared-below-roles.md.',
  );
  console.error('These names also mislead: on `sketch`, "cyan" renders blue and "pink" renders red.');
  console.error('Run `pnpm check:tokens --list` for the full set.');
  process.exit(1);
}

console.log(
  sites.length === 0
    ? 'No hue-named call sites.'
    : `Hue-named call sites: ${sites.length}, within budget ${BUDGET}.`,
);
