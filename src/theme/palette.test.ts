import { describe, expect, it } from 'vitest';

import type { Hue } from '../lib/theme';
import { auditContrast, auditHueAgreement, MAXIMUM_NEUTRAL_CHROMA, MINIMUM_RATIO } from './contrast';
import { FIXED_COLOURS, LEVELS, PALETTE_HUES, THEME_LEVELS } from './levels';

describe('the Hue vocabulary', () => {
  it('declares the same ten hues on every level', () => {
    for (const level of THEME_LEVELS) {
      expect(Object.keys(LEVELS[level].palette).sort()).toEqual([...PALETTE_HUES].sort());
      expect(Object.keys(LEVELS[level].paletteBright).sort()).toEqual([...PALETTE_HUES].sort());
    }
  });

  // `contrast.ts` inlines its own copy of the hue list so that the gate stays
  // runnable from a plain .mjs script. That is a deliberate duplication, so it
  // needs a test — the gate silently skipping a hue is exactly the failure the
  // generated-CSS gate exists to prevent one layer up.
  it('gates every declared hue — the audit covers all ten, on every level', () => {
    const results = auditContrast(LEVELS);
    for (const level of THEME_LEVELS) {
      for (const hue of PALETTE_HUES) {
        const seen = results.filter((r) => r.level === level && r.pair.startsWith(`palette.${hue} on `));
        expect(seen, `palette.${hue} ungated on ${level}`).toHaveLength(3);
        const bright = results.filter(
          (r) => r.level === level && r.pair.startsWith(`palette.bright.${hue} on `),
        );
        expect(bright, `palette.bright.${hue} ungated on ${level}`).toHaveLength(3);
      }
    }
  });

  it('clears 5.5:1 for every hue and 4.5:1 for every bright variant', () => {
    const failures = auditContrast(LEVELS)
      .filter((r) => r.pair.startsWith('palette.') && !r.passes)
      .map((r) => `${r.level} ${r.pair} ${r.ratio.toFixed(2)}:1 < ${r.minimum}`);
    expect(failures).toEqual([]);
  });

  it('holds the palette floor above WCAG AA, so an editor has room to tint the ground', () => {
    expect(MINIMUM_RATIO.palette).toBeGreaterThan(MINIMUM_RATIO.text);
    expect(MINIMUM_RATIO.palette).toBe(5.5);
    expect(MINIMUM_RATIO.paletteBright).toBe(4.5);
  });
});

describe('fixed colours', () => {
  it('are genuinely invariant — no level may redeclare them', () => {
    expect(FIXED_COLOURS.black).toBe('#000000');
    expect(FIXED_COLOURS.white).toBe('#ffffff');
    for (const level of THEME_LEVELS) {
      const def = LEVELS[level];
      // A level is free to *use* pure white as a ground; what it may not do is
      // hold a different opinion about what white is.
      expect(Object.keys(def)).not.toContain('fixed');
    }
  });

  it('is what `--color-black` is not', () => {
    // The compat alias tracks `surface.base`, so on `sketch` it resolves to
    // #f5f3ec — `--color-black` holding warm paper. The `white` level, which
    // held pure white in `surface.base` and made the inversion starkest, is
    // gone with the collapse; the alias is still the wrong shape.
    expect(LEVELS.sketch.surface.base).not.toBe(FIXED_COLOURS.black);
    // And the sketch level does use pure white — legitimately now, as a
    // reference to the fixed group rather than a literal nobody declared.
    expect(LEVELS.sketch.surface.raised).toBe(FIXED_COLOURS.white);
  });
});

describe('hue separation', () => {
  const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const oklab = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => decode(Number.parseInt(hex.slice(i, i + 2), 16) / 255));
    const l = Math.cbrt(0.4122214708 * r! + 0.5363325363 * g! + 0.0514459929 * b!);
    const m = Math.cbrt(0.2119034982 * r! + 0.6806995451 * g! + 0.1073969566 * b!);
    const s = Math.cbrt(0.0883024619 * r! + 0.2817188376 * g! + 0.6299787005 * b!);
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    ] as const;
  };
  const deltaE = (a: string, b: string) => {
    const x = oklab(a);
    const y = oklab(b);
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
  };

  // Luma cannot do this job. Solving a set of hues to the same contrast against
  // one ground equalises their luma by construction — the measured spread across
  // these ten is 1.000-1.009, so a luma test rates the whole palette identical.
  // See `docs/palette-provenance.md`.
  it('keeps every pair perceptually distinct', () => {
    for (const level of THEME_LEVELS) {
      const pal = LEVELS[level].palette;
      const tight: string[] = [];
      for (let i = 0; i < PALETTE_HUES.length; i += 1) {
        for (let j = i + 1; j < PALETTE_HUES.length; j += 1) {
          const a = PALETTE_HUES[i] as Hue;
          const b = PALETTE_HUES[j] as Hue;
          const d = deltaE(pal[a], pal[b]);
          if (d < 0.04) tight.push(`${level} ${a}/${b} deltaE ${d.toFixed(3)}`);
        }
      }
      expect(tight).toEqual([]);
    }
  });
});

describe('Role -> Hue agreement', () => {
  // This is the arithmetic ADR 0001 rejects its third option for lacking. The
  // repo shipped without it for one commit and immediately grew the fault:
  // midnight's accent.tertiary was #ec4899 while palette.pink was #f955a4 —
  // both clearing their own floors, 0.036 apart in OKLab, so invisible to a
  // screenshot as well as to both gates.
  it('has every Role holding the value of the Hue it declares', () => {
    const failures = auditHueAgreement(LEVELS)
      .filter((r) => !r.passes)
      .map((r) => `${r.level} ${r.role} = ${r.value}, ${r.detail}`);
    expect(failures).toEqual([]);
  });

  it('declares a Hue or `neutral` for every accent and intent Role, on every level', () => {
    for (const level of THEME_LEVELS) {
      const def = LEVELS[level];
      expect(Object.keys(def.accentHue).sort()).toEqual(Object.keys(def.accent).sort());
      expect(Object.keys(def.intentHue).sort()).toEqual(Object.keys(def.intent).sort());
      for (const ref of [...Object.values(def.accentHue), ...Object.values(def.intentHue)]) {
        if (ref === 'neutral') continue;
        expect(PALETTE_HUES).toContain(ref);
      }
    }
  });

  it('proves a `neutral` Role really is neutral rather than skipping it', () => {
    const neutrals = auditHueAgreement(LEVELS).filter((r) => r.declared === 'neutral');
    // Both levels declare exactly one: accent.quiet.
    expect(neutrals).toHaveLength(THEME_LEVELS.length);
    for (const r of neutrals) {
      expect(r.expected).toBeNull();
      expect(r.passes, `${r.level} ${r.role}: ${r.detail}`).toBe(true);
    }
    expect(MAXIMUM_NEUTRAL_CHROMA).toBeLessThan(0.05);
  });

  it('catches a Role that drifts from its Hue', () => {
    // The regression test for the shipped fault. Reintroduce it against a copy
    // and assert the audit names it, so nobody can quietly widen the check.
    const drifted = {
      ...LEVELS,
      midnight: {
        ...LEVELS.midnight,
        accent: { ...LEVELS.midnight.accent, tertiary: '#ec4899' },
      },
    };
    const failures = auditHueAgreement(drifted).filter((r) => !r.passes);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.role).toBe('accent.tertiary');
    expect(failures[0]?.value).toBe('#ec4899');
    expect(failures[0]?.expected).toBe(LEVELS.midnight.palette.pink);
  });
});
