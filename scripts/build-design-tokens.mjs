/**
 * Emit Design Tokens Format Module files from `src/theme/levels.ts`.
 *
 * One file per Level, with identical token paths. That shape is not a
 * preference: the DTCG specification deliberately says nothing about themes or
 * modes, so per-Level files with matching paths are the conventional answer —
 * and it is what `docs/adr/0003-two-levels-independently-authored.md` requires
 * anyway, two independently authored sets sharing a vocabulary but not values.
 *
 * Values are written in **OKLCH with an sRGB `hex` fallback**. Confirmed
 * against the 2025.10 Color module: `oklch` is a permitted `colorSpace`, its
 * components are `[L, chroma, hue]` with L in [0,1], chroma in [0,inf) and hue
 * in [0,360), and `hex` is optional and described as a fallback. Storing OKLCH
 * keeps the artifact in the space the palette was derived in, so the hue angle
 * — the part anchored on six years of authored colour — survives as a
 * first-class number instead of something a consumer recovers from three
 * bytes. See `docs/palette-provenance.md`.
 *
 * Roles reference Hues by name rather than restating hex, which is ADR 0001
 * expressed in the format's own alias syntax:
 *
 *   "primary": { "$value": "{palette.cyan}" }
 *
 *   node scripts/build-design-tokens.mjs           write the files
 *   node scripts/build-design-tokens.mjs --check   fail if any file is stale
 *
 * No build dependency: Node 22 strips TypeScript types natively.
 */

import { mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FIXED_COLOURS, LEVELS, PALETTE_HUES, THEME_LEVELS } from '../src/theme/levels.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'tokens');

/** DTCG version this emitter targets. The spec's first stable release. */
const SPEC = '2025.10';

const srgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
const decode = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);

/** sRGB hex -> OKLCH. Rounded to the precision a colour actually carries. */
function toOklch(hex) {
  const [r, g, b] = srgb(hex).map(decode);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  let hue = (Math.atan2(B, A) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  const chroma = Math.hypot(A, B);
  // A hue angle is meaningless once chroma reaches zero, and emitting the
  // arctangent of two rounding errors would make a grey look like it had an
  // opinion. Normalise it away instead.
  return [round(L, 4), round(chroma, 4), chroma < 0.0005 ? 0 : round(hue, 2)];
}

const round = (n, places) => Number(n.toFixed(places));

/**
 * A colour token: OKLCH components with hex as the declared fallback.
 *
 * Two inputs are not opaque hex and must not be forced through the OKLCH path.
 * `surface.overlay` is `rgba(...)`, and `transparent` is a keyword. Both are
 * emitted in sRGB with an explicit `alpha`, because a hue angle derived from a
 * scrim's premultiplied channels would be fiction — and because writing the
 * original string into `hex` would produce a `hex` that is not hex.
 */
function colour(value, description) {
  if (value === 'transparent') {
    return { $value: { colorSpace: 'srgb', components: [0, 0, 0], alpha: 0 }, ...desc(description) };
  }

  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(value);
  if (rgba) {
    const [, r, g, b, a] = rgba;
    return {
      $value: {
        colorSpace: 'srgb',
        components: [round(Number(r) / 255, 4), round(Number(g) / 255, 4), round(Number(b) / 255, 4)],
        alpha: a === undefined ? 1 : Number(a),
      },
      ...desc(description),
    };
  }

  if (!/^#[0-9a-f]{6}$/i.test(value)) {
    throw new Error(
      `Cannot emit \`${value}\` as a DTCG colour. Expected #rrggbb, rgba(), or transparent.`,
    );
  }

  return {
    $value: { colorSpace: 'oklch', components: toOklch(value), hex: value.toLowerCase() },
    ...desc(description),
  };
}

const desc = (description) => (description ? { $description: description } : {});

/**
 * A Role emits as an alias to its Hue — `{palette.cyan}` — which is ADR 0001
 * expressed in the format's own syntax.
 *
 * Read from `accentHue` / `intentHue` in `levels.ts`, never inferred by
 * matching hex. That distinction is the ADR: hex-matching is ambiguous when two
 * Roles share a value (`midnight`'s `accent.secondary` and `intent.warning` are
 * both yellow) and lossy when no Hue sits on a Role's value. `check:contrast`
 * asserts the declared map agrees with the values, so the alias is guaranteed
 * to resolve to the same colour the literal would have carried.
 *
 * A Role declared `'neutral'` emits its literal, because there is no Hue to
 * point at — `accent.quiet` is a grey by design.
 */
const alias = (hue) => ({ $value: `{palette.${hue}}` });

const HUE_NOTES = {
  red: 'Danger and ANSI red.',
  orange: 'Warning, and the ANSI slot between red and yellow.',
  yellow: 'Brand. Attention without alarm.',
  green: 'Brand. Success and ANSI green.',
  teal: 'The cool half of green; ANSI has no slot for it.',
  cyan: 'Brand, and the most-used hue in the estate.',
  blue: 'Information. A sky blue at 233 degrees by heritage rather than a true blue.',
  violet: 'Added by this work — no canonical violet existed. Fills ANSI magenta-adjacent space.',
  magenta: 'ANSI magenta, which no Role previously reached.',
  pink: 'Brand. Emphasis, and the neon-terminal signature.',
};

function levelDocument(level) {
  const def = LEVELS[level];

  const palette = { $type: 'color', $description: 'Hues — appearance, not job. Never addressed by a component.' };
  for (const hue of PALETTE_HUES) palette[hue] = colour(def.palette[hue], HUE_NOTES[hue]);
  palette.bright = { $description: "The `bright` half of each Hue. ANSI's upper eight." };
  for (const hue of PALETTE_HUES) palette.bright[hue] = colour(def.paletteBright[hue]);

  return {
    $schema: 'https://www.designtokens.org/schema.json',
    $description:
      `${def.label} — ${def.description} Generated from src/theme/levels.ts; ` +
      `do not edit. DTCG ${SPEC}. Token paths are identical across every level file.`,
    $extensions: {
      'dev.ryankelly.design-system': {
        level,
        polarity: def.polarity,
        specVersion: SPEC,
        generatedFrom: 'src/theme/levels.ts',
        contrastFloor: { palette: 5.5, paletteBright: 4.5, role: 4.5 },
      },
    },
    palette,
    fixed: {
      $type: 'color',
      $description:
        'Level-invariant. These three do not swap with the level, which is the point — ' +
        '`white` means white, not "this level\'s lightest ground".',
      ...Object.fromEntries(
        Object.entries(FIXED_COLOURS).map(([key, value]) => [key, colour(value)]),
      ),
    },
    surface: {
      $type: 'color',
      $description:
        'Grounds, in elevation order. `base` is the page, `raised` sits above it, ' +
        '`sunken` is recessed into it, `overlay` is the modal scrim and the only value with alpha.',
      ...Object.fromEntries(Object.entries(def.surface).map(([key, value]) => [key, colour(value)])),
    },
    text: {
      $type: 'color',
      ...Object.fromEntries(Object.entries(def.text).map(([key, value]) => [key, colour(value)])),
    },
    border: {
      $type: 'color',
      ...Object.fromEntries(Object.entries(def.border).map(([key, value]) => [key, colour(value)])),
    },
    accent: {
      $type: 'color',
      $description: 'Emphasis Roles, aliased onto Hues by the declared `accentHue` map.',
      ...Object.fromEntries(
        Object.entries(def.accent).map(([key, value]) => {
          const ref = def.accentHue[key];
          return [key, ref === 'neutral' ? colour(value) : alias(ref)];
        }),
      ),
    },
    intent: {
      $type: 'color',
      $description: 'Meaning Roles, aliased onto Hues by the declared `intentHue` map.',
      ...Object.fromEntries(
        Object.entries(def.intent).map(([key, value]) => {
          const ref = def.intentHue[key];
          return [key, ref === 'neutral' ? colour(value) : alias(ref)];
        }),
      ),
    },
    shadow: { $type: 'color', color: colour(def.shadow, 'Colour of the hard offset shadows.') },
  };
}

const check = process.argv.includes('--check');
mkdirSync(OUT_DIR, { recursive: true });

let stale = 0;
const written = [];
for (const level of THEME_LEVELS) {
  const file = path.join(OUT_DIR, `palette.${level}.tokens.json`);
  const body = `${JSON.stringify(levelDocument(level), null, 2)}\n`;
  if (check) {
    let current = '';
    try {
      current = readFileSync(file, 'utf8');
    } catch {
      current = '';
    }
    if (current !== body) {
      console.error(`stale: tokens/palette.${level}.tokens.json`);
      stale += 1;
    }
  } else {
    writeFileSync(file, body);
  }
  written.push(`palette.${level}.tokens.json`);
}

/**
 * Remove files for levels that no longer exist.
 *
 * Writing without pruning is a silent failure mode with teeth here: a deleted
 * level leaves its token file on disk, `--check` passes because every *current*
 * level matches, and the dead file keeps shipping through `exports` in
 * package.json. A consumer then installs a palette for a theme the package no
 * longer has.
 */
const expected = new Set(THEME_LEVELS.map((level) => `palette.${level}.tokens.json`));
const orphans = readdirSync(OUT_DIR).filter(
  (name) => name.endsWith('.tokens.json') && !expected.has(name),
);

if (check) {
  for (const name of orphans) {
    console.error(`orphaned: tokens/${name} — no such level`);
    stale += 1;
  }
  if (stale > 0) {
    console.error(
      `\n${stale} token file(s) do not match src/theme/levels.ts. Run \`pnpm tokens:design\`.`,
    );
    process.exit(1);
  }
  console.log(`Design tokens up to date — ${written.length} files, DTCG ${SPEC}.`);
} else {
  for (const name of orphans) unlinkSync(path.join(OUT_DIR, name));
  const pruned = orphans.length > 0 ? `; pruned ${orphans.join(', ')}` : '';
  console.log(`Wrote tokens/ — ${written.join(', ')} (DTCG ${SPEC})${pruned}.`);
}
