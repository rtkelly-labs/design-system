import { describe, expect, it } from 'vitest';

import { auditContrast, WEB_FLOOR } from './contrast';
import { LEVELS } from './levels';
import { CSS_MEDIUM, MEDIA, MEDIA_DEFINITIONS, isMedium } from './media';
import type { Medium } from './media';

describe('the Medium axis', () => {
  it('declares every field on every Medium', () => {
    const fields = Object.keys(MEDIA_DEFINITIONS[CSS_MEDIUM]).sort();
    for (const medium of MEDIA) {
      expect(Object.keys(MEDIA_DEFINITIONS[medium]).sort(), medium).toEqual(fields);
    }
  });

  it('exposes exactly one Medium to CSS', () => {
    // ADR 0004: `theme.css` carries exactly one Medium, and a Medium must never
    // be selectable by an attribute the way a Level is. If a second one ever
    // needs to reach a stylesheet that is a new decision, not a wider record.
    expect(CSS_MEDIUM).toBe('web');
    expect(MEDIA).toContain(CSS_MEDIUM);
  });

  it('guards a Medium arriving from an emitter flag', () => {
    expect(isMedium('video')).toBe(true);
    expect(isMedium('editor')).toBe(false);
    expect(isMedium(undefined)).toBe(false);
  });
});

describe('the two axes do not overlap', () => {
  // The load-bearing claim of ADR 0004. A Level varies colour; a Medium varies
  // geometry and time; neither varies on the other's axis. Asserted structurally
  // rather than trusted, because the failure mode is a value drifting onto the
  // wrong axis and nothing noticing.
  it('has no Medium declaring a colour', () => {
    const looksLikeColour = /^#|^rgb|^oklch|^hsl/;
    for (const medium of MEDIA) {
      const def = MEDIA_DEFINITIONS[medium];
      const strings = JSON.stringify(def).match(/"[^"]*"/g) ?? [];
      const colours = strings.filter((s) => looksLikeColour.test(s.slice(1, -1)));
      expect(colours, `${medium} declares a colour`).toEqual([]);
    }
  });

  it('has no Level declaring a geometry or a duration', () => {
    for (const level of Object.keys(LEVELS)) {
      const def = LEVELS[level as keyof typeof LEVELS];
      // Every leaf on a Level is a colour string or a label. A number would be
      // a spacing, a weight or a duration that had drifted onto this axis.
      const numbers = JSON.stringify(def).match(/:\s*-?\d+(\.\d+)?[,}]/g) ?? [];
      expect(numbers, `${level} declares a bare number`).toEqual([]);
    }
  });
});

describe('the contrast floor is Medium-keyed', () => {
  it('restates the web floors, so the default audit is unchanged', () => {
    const web = MEDIA_DEFINITIONS.web.contrastFloor;
    expect(web.role).toBe(WEB_FLOOR.role);
    expect(web.hue).toBe(WEB_FLOOR.hue);
    expect(web.hueBright).toBe(WEB_FLOOR.hueBright);
  });

  it('holds every non-web Medium to a stricter floor than the browser', () => {
    // The asymmetry ADR 0004 flags as most likely to be got wrong later:
    // colour values do not vary by Medium, but the floors they clear do. A
    // projected frame and a compression-damaged video lose local contrast the
    // browser at 1x does not.
    const web = MEDIA_DEFINITIONS.web.contrastFloor;
    for (const medium of MEDIA.filter((m) => m !== 'web') as Medium[]) {
      const floor = MEDIA_DEFINITIONS[medium].contrastFloor;
      expect(floor.role, medium).toBeGreaterThan(web.role);
      expect(floor.hue, medium).toBeGreaterThan(web.hue);
    }
  });

  it('audits against the Medium it is given, not a constant', () => {
    const web = auditContrast(LEVELS, MEDIA_DEFINITIONS.web.contrastFloor);
    const video = auditContrast(LEVELS, MEDIA_DEFINITIONS.video.contrastFloor);
    expect(web.filter((r) => !r.passes)).toEqual([]);
    // The palette is solved for the web floor, so the video floor is a target
    // and not yet met. Asserted rather than left implicit: if this ever passes,
    // the palette got stricter and that is worth noticing.
    expect(video.filter((r) => !r.passes).length).toBeGreaterThan(0);
  });
});

describe('video is not the web scaled', () => {
  it('has a type scale of its own', () => {
    // `remotion-evaluation.md`: "the type scale a 1080p frame needs and a 16px
    // web page does not". If one were a multiple of the other, a single scale
    // with a factor would have done and this axis would not be needed.
    const web = MEDIA_DEFINITIONS.web.type;
    const video = MEDIA_DEFINITIONS.video.type;
    const ratios = (Object.keys(web) as Array<keyof typeof web>).map(
      (step) => video[step].size / web[step].size,
    );
    const spread = Math.max(...ratios) - Math.min(...ratios);
    expect(spread).toBeGreaterThan(1);
  });

  it('measures motion in whole frames', () => {
    // A fractional frame lands a render mid-transition and the still is a
    // smear, which is the failure the evaluation measured for wall-clock CSS.
    const { instant, quick, considered } = MEDIA_DEFINITIONS.video.motion;
    for (const d of [instant, quick, considered]) expect(Number.isInteger(d)).toBe(true);
  });

  it('gives the graphic Medium no time base at all', () => {
    const { instant, quick, considered, easing } = MEDIA_DEFINITIONS.graphic.motion;
    expect([instant, quick, considered]).toEqual([0, 0, 0]);
    expect(easing).toBe('none');
  });
});
