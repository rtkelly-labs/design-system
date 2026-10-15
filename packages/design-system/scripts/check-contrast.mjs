#!/usr/bin/env node
/**
 * Fail the build when any level's role pair falls below its minimum ratio.
 *
 * This is the gate that makes the ladder maintainable. Every colour in
 * `levels.ts` is a literal, so the whole matrix — every level x every text,
 * accent, intent and border against every surface — is computable as data, with
 * no browser and no screenshot. The alternative is reviewing that matrix by eye
 * on every palette change, which nobody does twice.
 *
 *   node scripts/check-contrast.mjs            fail on violations
 *   node scripts/check-contrast.mjs --report   print the full matrix, always exit 0
 */

import {
  auditContrast,
  auditHueAgreement,
  auditSelectionDevices,
  auditSeriesSeparation,
  auditTextHierarchy,
  contrastMoreLadder,
} from '../src/theme/contrast.ts';
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

// D9: the `contrast: more` preference is a delta over each Level, so it is held
// to the same arithmetic as the Level it modifies: every pair, every floor.
const moreLadder = contrastMoreLadder(LEVELS);
const moreResults = auditContrast(moreLadder, floor);
const moreFailures = moreResults.filter((r) => !r.passes);
const moreDevices = auditSelectionDevices(moreLadder).filter((r) => r.device !== 'surface pair');
const moreDeviceFailures = moreDevices.filter((r) => !r.passes);

// D9: the categorical series group. Normal vision is gated; the colour-vision
// simulations are reported, because they are the case the glyphs cover.
const separation = auditSeriesSeparation(LEVELS);
const separationFailures = separation.filter((r) => !r.passes);

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

// APCA alongside the WCAG ratio, reported and never gated: WCAG 2 overrates light
// text on dark, so a pair can pass here and still be the weakest on the page (#372).
// Selection devices and the scrim are not text, and carry no Lc.
const lc = (r) => (r.apca == null ? '       ' : `Lc ${r.apca.toFixed(0).padStart(4)}`);
const fmt = (r) =>
  `${r.ratio.toFixed(2).padStart(5)}:1  ${lc(r)}  (min ${r.minimum})  ${r.pair}  ${r.foreground} on ${r.background}`;

const hierarchy = auditTextHierarchy(LEVELS);
const textPairs = results.filter((r) => r.apca != null && r.pair.startsWith('text.'));
const weakestText = textPairs.reduce((a, b) => (Math.abs(b.apca) < Math.abs(a.apca) ? b : a));

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
  console.log('\ncontrast: more — every pair of the delta ladder, same floors');
  for (const level of THEME_LEVELS) {
    const forLevel = moreResults.filter((r) => r.level === level);
    const worst = Math.min(...forLevel.map((r) => r.ratio));
    console.log(`  ${level}  ${forLevel.length} pairs, worst ${worst.toFixed(2)}:1`);
  }
  console.log('\nseries separation — closest pair, OKLab deltaE (normal vision gated at 0.04; simulations reported)');
  for (const r of separation) {
    console.log(
      `  ${r.passes ? ' ' : '!'} ${r.level.padEnd(9)} ${r.vision.padEnd(13)} ${r.min.toFixed(4)}  series ${r.pair[0]}/${r.pair[1]}${r.gated ? '' : '  (reported)'}`,
    );
  }
  console.log('\nRole -> Hue agreement — a Role must hold its declared Hue\'s value');
  for (const r of agreement) {
    const shown = r.expected === null ? r.detail : `${r.value} vs ${r.expected}`;
    console.log(`  ${r.passes ? ' ' : '!'} ${r.level.padEnd(9)} ${r.role.padEnd(18)} -> ${String(r.declared).padEnd(8)} ${shown}`);
  }
  console.log('\ntext hierarchy — APCA Lc of each tone, and the step from secondary down to muted (reported)');
  for (const s of hierarchy) {
    const { primary, secondary, muted } = s.lc;
    console.log(
      `    ${s.level.padEnd(9)} ${s.ground.padEnd(15)} primary ${primary.toFixed(0).padStart(3)}  ` +
        `secondary ${secondary.toFixed(0).padStart(3)}  muted ${muted.toFixed(0).padStart(3)}  step ${s.mutedStep.toFixed(0).padStart(3)}`,
    );
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

if (separationFailures.length > 0) {
  console.error(`Series separation failed — ${separationFailures.length} level(s) with a pair under 0.04 deltaE:\n`);
  for (const r of separationFailures) {
    console.error(`  ${r.level.padEnd(9)} ${r.min.toFixed(4)}  series ${r.pair[0]}/${r.pair[1]}`);
  }
  console.error('\nTwo series members a reader cannot tell apart are one member. Change a seriesHue in src/theme/levels.ts.');
  process.exit(1);
}

if (moreFailures.length > 0 || moreDeviceFailures.length > 0) {
  console.error(
    `contrast: more failed — ${moreFailures.length} pairs and ${moreDeviceFailures.length} devices below minimum on the delta ladder:\n`,
  );
  for (const r of [...moreFailures, ...moreDeviceFailures].sort((a, b) => a.ratio - b.ratio)) {
    console.error(`  ${r.level.padEnd(9)} ${fmt(r)}`);
  }
  console.error('\nThe preference is a delta over each Level (applyContrastDelta in src/theme/contrast.ts); it may not weaken any pair.');
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
const normalSep = separation.filter((r) => r.gated).map((r) => `${r.level} ${r.min.toFixed(3)}`).join(', ');
console.log(
  `contrast: more — ${moreResults.length} pairs and ${moreDevices.length} devices clear the same floors on the delta ladder. ` +
    `Series (${LEVELS[THEME_LEVELS[0]].series.length}) closest pair under normal vision: ${normalSep} (floor 0.04).`,
);
console.log(
  `APCA (reported, not gated) — weakest text pair Lc ${weakestText.apca.toFixed(0)}: ` +
    `${weakestText.level} ${weakestText.pair}. \`--report\` for the full matrix and the text hierarchy.`,
);
