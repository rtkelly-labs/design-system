import { describe, expect, it } from 'vitest';
import {
  apcaContrast,
  auditContrast,
  auditSelectionDevices,
  auditTextHierarchy,
  contrastRatio,
  MINIMUM_RATIO,
} from './contrast';
import { LEVELS, THEME_LEVELS } from './levels';

/**
 * The state rule — selected state is an accent fill or edge, never a surface
 * pair — rests on two facts about the ladder. Both are asserted here so a
 * palette change that broke either would say so, rather than letting the rule
 * quietly become wrong.
 */
describe('selection devices', () => {
  const results = auditSelectionDevices(LEVELS);

  it('audits every level', () => {
    for (const level of THEME_LEVELS) {
      expect(results.some((r) => r.level === level)).toBe(true);
    }
  });

  it('fill and edge clear the non-text bar on every level and every surface', () => {
    const devices = results.filter((r) => r.device !== 'surface pair');
    const failing = devices.filter((r) => !r.passes).map((r) => `${r.level}: ${r.pair} ${r.ratio.toFixed(2)}`);
    expect(failing).toEqual([]);
    expect(devices.every((r) => r.minimum === MINIMUM_RATIO.stateDevice)).toBe(true);
  });

  it('no surface pair is a selection device on any level', () => {
    // This is the fact the rule is built on. If a wider surface ramp ever makes
    // it false on one rung, the rule needs re-stating before the ramp ships:
    // a surface-pair widget would pass review there and vanish on the others.
    const pairs = results.filter((r) => r.device === 'surface pair');
    expect(pairs.length).toBe(THEME_LEVELS.length * 3);
    const usable = pairs.filter((r) => r.passes).map((r) => `${r.level}: ${r.pair} ${r.ratio.toFixed(2)}`);
    expect(usable).toEqual([]);
  });

  it('measures the light level where the trap actually bites', () => {
    // The concrete number behind the rule: on a light level the raised surface
    // is barely off the page, so elevation cannot be carried by the ground.
    // `sketch` goes base #f5f3ec -> raised #ffffff, which is the whole available
    // headroom above warm paper — and it is still only a 1.11:1 step. That is
    // why the offset shadow and the 2px border do the work; see DESIGN.md § 5.
    const ratio = contrastRatio(LEVELS.sketch.surface.raised, LEVELS.sketch.surface.base);
    expect(ratio).toBeLessThan(1.3);
  });
});

/**
 * APCA is reported, not gated, but a reported number that is wrong is worse
 * than none. Pinned to the reference values the APCA-W3 0.0.98G README
 * publishes for its own implementation.
 */
describe('apcaContrast', () => {
  it('matches the published reference values', () => {
    expect(apcaContrast('#888888', '#ffffff')).toBeCloseTo(63.056, 2);
    expect(apcaContrast('#ffffff', '#888888')).toBeCloseTo(-68.541, 2);
    expect(apcaContrast('#000000', '#aaaaaa')).toBeCloseTo(58.146, 2);
    expect(apcaContrast('#aaaaaa', '#000000')).toBeCloseTo(-56.241, 2);
  });

  it('is signed by polarity and not symmetric, unlike a WCAG ratio', () => {
    expect(contrastRatio('#888888', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#888888'), 6);
    expect(Math.abs(apcaContrast('#888888', '#ffffff'))).not.toBeCloseTo(
      Math.abs(apcaContrast('#ffffff', '#888888')),
      0,
    );
  });

  it('rides along on every text pair the gate audits', () => {
    const text = auditContrast(LEVELS).filter((r) => r.pair.startsWith('text.'));
    expect(text.length).toBeGreaterThan(0);
    expect(text.every((r) => typeof r.apca === 'number' && r.apca !== 0)).toBe(true);
  });
});

describe('text hierarchy', () => {
  it('keeps muted clearly below secondary on every ground', () => {
    // The trade #372 made: muted was darkened for legibility, but not so far that
    // it reads as a second secondary. 10 Lc is a floor for the regression, not a
    // standard; the shipped values sit at 12 or more.
    const tight = auditTextHierarchy(LEVELS)
      .filter((s) => s.mutedStep < 10)
      .map((s) => `${s.level} ${s.ground}: ${s.mutedStep.toFixed(1)}`);
    expect(tight).toEqual([]);
  });
});
