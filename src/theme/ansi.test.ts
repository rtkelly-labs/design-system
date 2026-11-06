import { describe, expect, it } from 'vitest';

import { ANSI_SLOTS, SLOTS, ansiScheme } from './ansi';
import { LEVELS, PALETTE_HUES, THEME_LEVELS } from './levels';

const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => decode(Number.parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};

describe('the ANSI fan-out', () => {
  // ADR 0001: "a fan-out map lives in the Emitter … It is data, so it is
  // unit-testable, and keeping it out of the Levels means adding a Target can
  // never change a colour." These are that test.
  it('fills all sixteen slots on every Level', () => {
    for (const level of THEME_LEVELS) {
      const { slots } = ansiScheme(level);
      for (const slot of ANSI_SLOTS) {
        expect(slots[slot], `${level} ${slot}`).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });

  it('keeps all sixteen distinct — a duplicate is a slot nobody can address', () => {
    for (const level of THEME_LEVELS) {
      const { slots } = ansiScheme(level);
      const values = ANSI_SLOTS.map((s) => slots[s].toLowerCase());
      expect(new Set(values).size, level).toBe(ANSI_SLOTS.length);
    }
  });

  it('runs the achromatic ramp dark to light on both polarities', () => {
    // The bug the coverage gate caught on its first run. Reading
    // `surface.sunken` for `black` is correct on a dark Level and gives the
    // light one a terminal `black` of #efeadf — nearly white — while colliding
    // `brightBlack` with `brightWhite`. A terminal's ramp runs one way
    // regardless of which way the theme runs.
    for (const level of THEME_LEVELS) {
      const { slots } = ansiScheme(level);
      const ramp = ['black', 'brightBlack', 'white', 'brightWhite'] as const;
      const lums = ramp.map((s) => luminance(slots[s]));
      for (let i = 1; i < lums.length; i += 1) {
        expect(lums[i]!, `${level} ${ramp[i]} vs ${ramp[i - 1]}`).toBeGreaterThan(lums[i - 1]!);
      }
    }
  });

  it('reads every chromatic slot from `palette`, never from a literal', () => {
    // A literal here would be a second origin, which ADR 0002 forbids. Asserted
    // structurally: each chromatic slot's value must appear in the Level's own
    // palette or paletteBright.
    for (const level of THEME_LEVELS) {
      const def = LEVELS[level];
      const { slots } = ansiScheme(level);
      const known = new Set([
        ...PALETTE_HUES.map((h) => def.palette[h].toLowerCase()),
        ...PALETTE_HUES.map((h) => def.paletteBright[h].toLowerCase()),
      ]);
      for (const slot of ANSI_SLOTS) {
        if (SLOTS[slot].kind !== 'hue') continue;
        expect(known, `${level} ${slot}`).toContain(slots[slot].toLowerCase());
      }
    }
  });

  it('pairs each bright slot with its base hue', () => {
    for (const level of THEME_LEVELS) {
      const def = LEVELS[level];
      const { slots } = ansiScheme(level);
      for (const hue of ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'] as const) {
        const bright = `bright${hue[0]!.toUpperCase()}${hue.slice(1)}` as (typeof ANSI_SLOTS)[number];
        expect(slots[hue], `${level} ${hue}`).toBe(def.palette[hue]);
        expect(slots[bright], `${level} ${bright}`).toBe(def.paletteBright[hue]);
      }
    }
  });

  it('does not let a Target change a colour', () => {
    // The property the fan-out living in the Emitter buys. Every value the
    // scheme emits already exists in the Level; nothing is computed.
    for (const level of THEME_LEVELS) {
      const def = LEVELS[level];
      const scheme = ansiScheme(level);
      const declared = new Set(
        JSON.stringify(def)
          .match(/#[0-9a-f]{6}/gi)
          ?.map((h) => h.toLowerCase()) ?? [],
      );
      for (const slot of ANSI_SLOTS) {
        expect(declared, `${level} ${slot} is not a declared value`).toContain(
          scheme.slots[slot].toLowerCase(),
        );
      }
    }
  });
});

describe('the terminal chrome', () => {
  it('reads the foreground on the background, and on the selection', () => {
    // A terminal has no alpha, so a selection band is an opaque colour every
    // foreground must still read against — composited contrast resolved at
    // declaration time because the Target cannot resolve it at paint time.
    const contrast = (a: string, b: string) => {
      const [x, y] = [luminance(a), luminance(b)];
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    };
    for (const level of THEME_LEVELS) {
      const { chrome } = ansiScheme(level);
      expect(contrast(chrome.foreground, chrome.background), level).toBeGreaterThanOrEqual(4.5);
      expect(contrast(chrome.foreground, chrome.selectionBackground), level).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('the 62-degree gap', () => {
  it('fills ANSI blue with a sky blue, and says so', () => {
    // Recorded rather than papered over. `palette.blue` sits at 233 degrees on
    // the dark Level because that is where six years of authored colour put the
    // primary accent, so ANSI `blue` is a cyan-blue by heritage. Closing the gap
    // needs an eleventh Hue, and ten is already the ceiling.
    const hue = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) =>
        decode(Number.parseInt(hex.slice(i, i + 2), 16) / 255),
      );
      const l = Math.cbrt(0.4122214708 * r! + 0.5363325363 * g! + 0.0514459929 * b!);
      const m = Math.cbrt(0.2119034982 * r! + 0.6806995451 * g! + 0.1073969566 * b!);
      const s = Math.cbrt(0.0883024619 * r! + 0.2817188376 * g! + 0.6299787005 * b!);
      const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
      const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
      const deg = (Math.atan2(B, A) * 180) / Math.PI;
      return deg < 0 ? deg + 360 : deg;
    };
    // If this ever moves toward 260, an eleventh hue was added and the note in
    // `ansi.ts` needs deleting.
    expect(Math.round(hue(LEVELS.midnight.palette.blue))).toBeLessThan(245);
  });
});
