#!/usr/bin/env node
/**
 * Emit terminal colour schemes from `src/theme/ansi.ts`.
 *
 * Four encodings of the same sixteen values, which is the whole argument for
 * doing terminal first: iTerm2, Windows Terminal, Alacritty and Ghostty are one
 * fan-out written four ways, and none of them needs chrome, scopes or a
 * semantic map.
 *
 *   node scripts/build-ansi.mjs           write the schemes
 *   node scripts/build-ansi.mjs --check   fail on drift or an orphan
 *
 * ## The two gates ADR 0001 requires
 *
 * That ADR says a fan-out map "needs two Gates the repo does not have — slot
 * coverage, and a committed fixture diff — because a wrong fan-out emits
 * confidently rather than failing". Both are here, and both earned their place
 * on the first run: the coverage gate caught the achromatic slots being
 * polarity-blind, which gave the light Level a terminal `black` of `#efeadf`
 * and collided `brightBlack` with `brightWhite`.
 *
 * Coverage asserts, per Level: every slot filled with a real colour, all
 * sixteen distinct, the ramp monotonic in luminance, and every foreground
 * readable on the scheme's own background. The fixture diff is `--check`
 * against the committed output, so a fan-out edit shows up as a reviewable
 * text diff rather than as a colour nobody looked at.
 */

import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ANSI_SLOTS, ansiScheme } from '../src/theme/ansi.ts';
import { THEME_LEVELS } from '../src/theme/levels.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'terminal');

const decode = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const luminance = (hex) => {
  const [r, g, b] = rgb(hex).map((v) => decode(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/**
 * Slot coverage.
 *
 * A terminal renders an unfilled slot as *something* — usually the foreground —
 * so nothing errors and the scheme looks finished in whatever the author
 * happened to run. This is the same failure `check:visual-coverage` exists for,
 * one Target over.
 */
function coverage(scheme) {
  const problems = [];
  const { slots, chrome, level } = scheme;

  for (const slot of ANSI_SLOTS) {
    if (!/^#[0-9a-f]{6}$/i.test(slots[slot] ?? '')) {
      problems.push(`${level}: ${slot} is not a colour (${slots[slot]})`);
    }
  }

  // Two slots holding one value is a slot a user cannot address. It is how the
  // polarity-blind first draft failed, and it fails silently in every terminal.
  const seen = new Map();
  for (const slot of ANSI_SLOTS) {
    const value = (slots[slot] ?? '').toLowerCase();
    if (seen.has(value)) problems.push(`${level}: ${slot} duplicates ${seen.get(value)} (${value})`);
    else seen.set(value, slot);
  }

  // The ramp runs dark to light whichever way the theme runs. A terminal's
  // `black` is its darkest cell, not the Group named `surface`.
  const ramp = ['black', 'brightBlack', 'white', 'brightWhite'];
  for (let i = 1; i < ramp.length; i += 1) {
    const prev = slots[ramp[i - 1]];
    const next = slots[ramp[i]];
    if (luminance(next) <= luminance(prev)) {
      problems.push(
        `${level}: ${ramp[i]} (${next}) is not lighter than ${ramp[i - 1]} (${prev}) — the ramp is not monotonic`,
      );
    }
  }

  // The twelve chromatic slots must be distinguishable from the background they
  // will be drawn on. 4.5 is the wrong bar — a terminal cell is not body text —
  // so this asks only that a user can tell the colour from the ground.
  //
  // The four achromatic slots are deliberately exempt, and working out why was
  // the useful part. They *are* the ramp, so two of them sit near the
  // background by construction: on `midnight` that is `black` and
  // `brightBlack`, and on `sketch` it is `white` and `brightWhite`. A first
  // version excluded only the dark pair and duly failed the light Level at
  // 1.08:1 — which is not a defect in the scheme, it is a light terminal theme
  // behaving correctly. `white` there is a reverse-video ground, not a
  // foreground.
  const ACHROMATIC = new Set(['black', 'brightBlack', 'white', 'brightWhite']);
  for (const slot of ANSI_SLOTS) {
    if (ACHROMATIC.has(slot)) continue;
    const ratio = contrast(slots[slot], chrome.background);
    if (ratio < 2) {
      problems.push(
        `${level}: ${slot} (${slots[slot]}) is ${ratio.toFixed(2)}:1 on the background — indistinguishable`,
      );
    }
  }

  // What the ramp owes instead: a useful span end to end. Exempting the four
  // slots above would otherwise let the whole ramp collapse unnoticed.
  const span = contrast(slots.black, slots.brightWhite);
  if (span < 7) {
    problems.push(
      `${level}: the achromatic ramp spans only ${span.toFixed(2)}:1 (black ${slots.black} to brightWhite ${slots.brightWhite})`,
    );
  }

  if (contrast(chrome.foreground, chrome.background) < 4.5) {
    problems.push(`${level}: foreground on background is below 4.5:1`);
  }
  if (contrast(chrome.foreground, chrome.selectionBackground) < 3) {
    problems.push(`${level}: foreground on selection is below 3:1 — a terminal has no alpha`);
  }

  return problems;
}

/* ---------------------------------------------------------------- encodings */

const hexToRgbFloat = (hex) => rgb(hex).map((v) => (v / 255).toFixed(9));

/** iTerm2 `.itermcolors` — an Apple plist of float components. */
function iterm(scheme) {
  const entry = (key, hex) => {
    const [r, g, b] = hexToRgbFloat(hex);
    return `\t<key>${key}</key>
\t<dict>
\t\t<key>Alpha Component</key><real>1</real>
\t\t<key>Blue Component</key><real>${b}</real>
\t\t<key>Color Space</key><string>sRGB</string>
\t\t<key>Green Component</key><real>${g}</real>
\t\t<key>Red Component</key><real>${r}</real>
\t</dict>`;
  };
  const body = [
    ...ANSI_SLOTS.map((slot, i) => entry(`Ansi ${i} Color`, scheme.slots[slot])),
    entry('Background Color', scheme.chrome.background),
    entry('Foreground Color', scheme.chrome.foreground),
    entry('Cursor Color', scheme.chrome.cursor),
    entry('Selection Color', scheme.chrome.selectionBackground),
  ].join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- GENERATED from src/theme/ansi.ts — do not edit. Regenerate: pnpm ansi:build -->
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${body}
</dict>
</plist>
`;
}

/** Windows Terminal — one object from its `schemes` array. */
function windowsTerminal(scheme) {
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const out = {
    name: `RTK ${cap(scheme.level)}`,
    background: scheme.chrome.background,
    foreground: scheme.chrome.foreground,
    cursorColor: scheme.chrome.cursor,
    selectionBackground: scheme.chrome.selectionBackground,
  };
  for (const slot of ANSI_SLOTS) out[slot] = scheme.slots[slot];
  return `${JSON.stringify(out, null, 2)}\n`;
}

/** Alacritty — TOML, since 0.13. */
function alacritty(scheme) {
  const block = (name, pairs) =>
    `[colors.${name}]\n${pairs.map(([k, v]) => `${k} = "${v}"`).join('\n')}`;
  const normal = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  return `# GENERATED from src/theme/ansi.ts — do not edit. Regenerate: pnpm ansi:build

${block('primary', [
  ['background', scheme.chrome.background],
  ['foreground', scheme.chrome.foreground],
])}

${block('cursor', [
  ['text', scheme.chrome.background],
  ['cursor', scheme.chrome.cursor],
])}

${block('selection', [
  ['text', scheme.chrome.foreground],
  ['background', scheme.chrome.selectionBackground],
])}

${block(
  'normal',
  normal.map((s) => [s, scheme.slots[s]]),
)}

${block(
  'bright',
  normal.map((s) => [s, scheme.slots[`bright${s[0].toUpperCase()}${s.slice(1)}`]]),
)}
`;
}

/** Ghostty — its own flat key=value config, with palette entries by index. */
function ghostty(scheme) {
  const lines = [
    '# GENERATED from src/theme/ansi.ts — do not edit. Regenerate: pnpm ansi:build',
    '',
    ...ANSI_SLOTS.map((slot, i) => `palette = ${i}=${scheme.slots[slot]}`),
    '',
    `background = ${scheme.chrome.background}`,
    `foreground = ${scheme.chrome.foreground}`,
    `cursor-color = ${scheme.chrome.cursor}`,
    `selection-background = ${scheme.chrome.selectionBackground}`,
    `selection-foreground = ${scheme.chrome.foreground}`,
  ];
  return `${lines.join('\n')}\n`;
}

const ENCODINGS = [
  { ext: 'itermcolors', render: iterm },
  { ext: 'windows-terminal.json', render: windowsTerminal },
  { ext: 'alacritty.toml', render: alacritty },
  { ext: 'ghostty.conf', render: ghostty },
];

/* -------------------------------------------------------------------- main */

const check = process.argv.includes('--check');
mkdirSync(OUT, { recursive: true });

const schemes = THEME_LEVELS.map((level) => ansiScheme(level));

const problems = schemes.flatMap(coverage);
if (problems.length > 0) {
  console.error(`Slot coverage failed — ${problems.length} problem(s):\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error('\nThe fan-out map is `SLOTS` in src/theme/ansi.ts. A wrong map emits');
  console.error('confidently — a terminal renders an unfilled slot as the foreground.');
  process.exit(1);
}

const expected = new Set();
let stale = 0;
for (const scheme of schemes) {
  for (const { ext, render } of ENCODINGS) {
    const name = `rtk-${scheme.level}.${ext}`;
    expected.add(name);
    const body = render(scheme);
    const file = path.join(OUT, name);
    if (check) {
      let current = '';
      try {
        current = readFileSync(file, 'utf8');
      } catch {
        current = '';
      }
      if (current !== body) {
        console.error(`stale: terminal/${name}`);
        stale += 1;
      }
    } else {
      writeFileSync(file, body);
    }
  }
}

// Prune, for the reason `build-design-tokens.mjs` learned the hard way: a
// deleted Level leaves its scheme on disk, `--check` passes because every
// current Level matches, and the dead file keeps shipping.
const orphans = readdirSync(OUT).filter((f) => f.startsWith('rtk-') && !expected.has(f));

if (check) {
  for (const name of orphans) {
    console.error(`orphaned: terminal/${name} — no such level`);
    stale += 1;
  }
  if (stale > 0) {
    console.error(`\n${stale} file(s) do not match src/theme/ansi.ts. Run \`pnpm ansi:build\`.`);
    process.exit(1);
  }
  console.log(
    `Terminal schemes up to date — ${expected.size} files, ${THEME_LEVELS.length} levels x ${ENCODINGS.length} encodings; ${ANSI_SLOTS.length} slots each, all distinct.`,
  );
} else {
  for (const name of orphans) unlinkSync(path.join(OUT, name));
  const pruned = orphans.length > 0 ? `; pruned ${orphans.length}` : '';
  console.log(`Wrote terminal/ — ${expected.size} files${pruned}.`);
}
