#!/usr/bin/env node
/**
 * Fail the build when any level's role pair falls below its minimum ratio.
 *
 * This is the gate that makes a four-rung ladder maintainable. Every colour in
 * `levels.ts` is a literal, so the whole matrix — 4 levels x every text, accent,
 * intent and border against every surface — is computable as data, with no
 * browser and no screenshot. The alternative is reviewing sixty combinations by
 * eye on every palette change, which nobody does twice.
 *
 *   node scripts/check-contrast.mjs            fail on violations
 *   node scripts/check-contrast.mjs --report   print the full matrix, always exit 0
 */

import { auditContrast, auditHueAgreement, auditSelectionDevices } from '../src/theme/contrast.ts';
import { LEVELS, THEME_LEVELS } from '../src/theme/levels.ts';
import { CSS_MEDIUM, MEDIA_DEFINITIONS, isMedium } from '../src/theme/media.ts';

const report = process.argv.includes('--report');
// Which Medium's floors to enforce. The gate defaults to `web` — the Medium
// `theme.css` carries — and `--medium=video` audits the stricter frame floors.
// ADR 0004: colour values do not vary by Medium, but the floors they clear do.
const mediumArg = process.argv.find((a) => a.startsWith('--medium='))?.split('=')[1];
const medium = isMedium(mediumArg) ? mediumArg : CSS_MEDIUM;
const floor = MEDIA_DEFINITIONS[medium].contrastFloor;

const results = auditContrast(LEVELS, floor);
const failures = results.filter((r) => !r.passes);

// The state rule: a selected tab is marked with an accent fill or edge, never
// with one surface against another. The devices must clear 3:1 on every level;
// the surface pairs are printed so the reason they are not a device is in the
// output, not in someone's memory.
const devices = auditSelectionDevices(LEVELS);

// Whether each Role holds the value of the Hue it declares itself to be. Not a
// contrast question — both sides clear their own floors — but the drift ADR 0001
// rejects its third option over, and the one this repo actually shipped for a
// commit. See `auditHueAgreement`.
const agreement = auditHueAgreement(LEVELS);
const agreementFailures = agreement.filter((r) => !r.passes);
const deviceFailures = devices.filter((r) => r.device !== 'surface pair' && !r.passes);
const surfacePairs = devices.filter((r) => r.device === 'surface pair');
const surfacePairPasses = surfacePairs.filter((r) => r.passes);

const fmt = (r) =>
  `${r.ratio.toFixed(2).padStart(5)}:1  (min ${r.minimum})  ${r.pair}  ${r.foreground} on ${r.background}`;

if (report) {
  for (const level of THEME_LEVELS) {
    const forLevel = results.filter((r) => r.level === level);
    const worst = Math.min(...forLevel.map((r) => r.ratio));
    console.log(`\n${level}  —  ${forLevel.length} pairs, worst ${worst.toFixed(2)}:1`);
    for (const r of [...forLevel].sort((a, b) => a.ratio - b.ratio)) {
      console.log(`  ${r.passes ? ' ' : '!'} ${fmt(r)}`);
    }
  }
  console.log('\nselection devices — fill / edge must clear 3:1 on every level');
  for (const level of THEME_LEVELS) {
    const forLevel = devices.filter((r) => r.level === level && r.device !== 'surface pair');
    const worst = Math.min(...forLevel.map((r) => r.ratio));
    console.log(`  ${level}  worst ${worst.toFixed(2)}:1`);
  }
  console.log('\nRole -> Hue agreement — a Role must hold its declared Hue\'s value');
  for (const r of agreement) {
    const shown = r.expected === null ? r.detail : `${r.value} vs ${r.expected}`;
    console.log(`  ${r.passes ? ' ' : '!'} ${r.level.padEnd(9)} ${r.role.padEnd(18)} -> ${String(r.declared).padEnd(8)} ${shown}`);
  }
  console.log('\nsurface pairs — NOT a selection device (shown so nobody has to rediscover why)');
  for (const r of surfacePairs) {
    console.log(`  ${r.passes ? '!' : ' '} ${r.level.padEnd(9)} ${fmt(r)}`);
  }
  process.exit(0);
}

if (deviceFailures.length > 0) {
  console.error(
    `Selection-device check failed — ${deviceFailures.length} fill/edge pairs below ${deviceFailures[0].minimum}:1:\n`,
  );
  for (const r of deviceFailures.sort((a, b) => a.ratio - b.ratio)) {
    console.error(`  ${r.level.padEnd(9)} ${fmt(r)}`);
  }
  console.error('\nA selected tab marked with this accent would not read on that level.');
  process.exit(1);
}

if (surfacePairPasses.length > 0) {
  // Not a failure: a wider surface ramp is a legitimate design change. But it is
  // the one condition under which a surface-pair widget passes review on one
  // rung and disappears on another, so it is said out loud.
  console.warn('Note — a surface pair clears 3:1 on some level. Surfaces are for layering, not state;');
  console.warn('a component marking selection with them will read here and vanish on the others:');
  for (const r of surfacePairPasses) console.warn(`  ${r.level.padEnd(9)} ${fmt(r)}`);
}

if (agreementFailures.length > 0) {
  console.error(
    `Role -> Hue agreement failed — ${agreementFailures.length} of ${agreement.length} Roles disagree with the Hue they declare:\n`,
  );
  for (const r of agreementFailures) {
    if (r.expected === null) {
      console.error(`  ${r.level.padEnd(9)} ${r.role} is declared 'neutral' but ${r.detail}`);
    } else {
      console.error(`  ${r.level.padEnd(9)} ${r.role} is ${r.value}, but ${r.detail}`);
    }
  }
  console.error(
    '\nA Role and its Hue must be the same colour. Two values for one colour drift silently —',
  );
  console.error(
    'they can each clear their own floor, and if they are close they are invisible to a screenshot.',
  );
  console.error('Fix the Role in src/theme/levels.ts, or change what its `accentHue`/`intentHue` says.');
  process.exit(1);
}

if (failures.length > 0) {
  console.error(`Contrast check failed — ${failures.length} of ${results.length} pairs below minimum:\n`);
  for (const level of THEME_LEVELS) {
    const forLevel = failures.filter((r) => r.level === level);
    if (forLevel.length === 0) continue;
    console.error(`  ${level}`);
    for (const r of forLevel.sort((a, b) => a.ratio - b.ratio)) {
      console.error(`    ${fmt(r)}`);
    }
  }
  console.error('\nAdjust the level in src/theme/levels.ts, then run `pnpm tokens:build`.');
  process.exit(1);
}

console.log(
  `Contrast OK (${medium}) — ${results.length} pairs across ${THEME_LEVELS.length} levels, all at or above minimum; ` +
    `${devices.length - surfacePairs.length} selection devices clear ${devices[0].minimum}:1; ` +
    `${agreement.length} Roles agree with their declared Hue.`,
);
