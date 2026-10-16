import { describe, expect, it } from 'vitest';
import { auditContrast, contrastRatio } from './contrast';
import { LEVELS, THEME_LEVELS } from './levels';
import { mixOklab } from './mix';

/**
 * D8: a tint is a literal in `levels.ts`, and the strength it was mixed at is a
 * declared property of the level. These tests are what let a literal stand in
 * for an arithmetic: change a role or a strength and forget to re-derive, and
 * this fails with the value to paste.
 */
describe('tint', () => {
  it('declares a strength per level, and Levels differ (ADR 0003)', () => {
    expect(LEVELS.midnight.tintStrength).toBe(20);
    expect(LEVELS.sketch.tintStrength).toBe(12);
  });

  for (const level of THEME_LEVELS) {
    it(`${level}: every tint is its role mixed into surface.base at the declared strength`, () => {
      const def = LEVELS[level];
      const derive = (role: string) => mixOklab(role, def.surface.base, def.tintStrength);
      for (const [key, role] of Object.entries(def.accent)) {
        expect(def.tint.accent[key as keyof typeof def.accent]).toBe(derive(role));
      }
      for (const [key, role] of Object.entries(def.intent)) {
        expect(def.tint.intent[key as keyof typeof def.intent]).toBe(derive(role));
      }
    });

    it(`${level}: tints are opaque literals`, () => {
      const def = LEVELS[level];
      const all = [...Object.values(def.tint.accent), ...Object.values(def.tint.intent)];
      expect(all.every((v) => /^#[0-9a-f]{6}$/.test(v))).toBe(true);
    });
  }

  for (const level of THEME_LEVELS) {
    it(`${level}: selection.multi is accent.primary at the declared strength, and the smallest that is 3:1`, () => {
      const def = LEVELS[level];
      const at = (pct: number) => mixOklab(def.accent.primary, def.surface.base, pct);
      expect(def.selection.multi).toBe(at(def.selectionStrength));
      const reads = (pct: number) =>
        contrastRatio(at(pct), def.surface.base) >= 3 && contrastRatio(at(pct), def.surface.raised) >= 3;
      expect(reads(def.selectionStrength)).toBe(true);
      expect(reads(def.selectionStrength - 1)).toBe(false);
      // Text on a selected row is primary ink: it clears 4.5:1; secondary does not.
      expect(contrastRatio(def.text.primary, def.selection.multi)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(def.text.secondary, def.selection.multi)).toBeLessThan(4.5);
    });
  }

  it('gates every role on its tint, and text.primary on it, on every level', () => {
    const pairs = auditContrast(LEVELS).filter((r) => r.pair.startsWith('tint.'));
    expect(pairs).toHaveLength(THEME_LEVELS.length * 8 * 2);
    expect(pairs.filter((r) => !r.passes).map((r) => `${r.level} ${r.pair} ${r.ratio.toFixed(2)}`)).toEqual([]);
  });
});
