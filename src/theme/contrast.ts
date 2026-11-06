/**
 * Contrast arithmetic over the ladder.
 *
 * Every colour in `levels.ts` is a literal, so contrast can be computed as data
 * — no browser, no screenshot, no rendering. `pnpm check:contrast` walks all
 * four levels and fails CI on a violation, which is the thing that makes a
 * four-rung ladder maintainable: 4 levels x ~15 role pairs is 60 combinations,
 * and nobody eyeballs 60 combinations reliably twice.
 *
 * The maths is WCAG 2.1 relative luminance. APCA is the better predictor of
 * perceived contrast, but it is not yet normative and its thresholds are not
 * stable; WCAG ratios are what an audit will be run against.
 */

import type { Emphasis, Hue, HueRef, Intent, TextTone } from '../lib/theme';
import type { LevelDefinition, ThemeLevel } from './levels';

export interface Rgb {
  r: number;
  g: number;
  b: number;
  /** 0–1. Colours without an alpha channel parse as 1. */
  a: number;
}

const HEX = /^#([0-9a-f]{3,8})$/i;
const RGB_FN = /^rgba?\(\s*([0-9.]+)[\s,]+([0-9.]+)[\s,]+([0-9.]+)(?:[\s,/]+([0-9.]+))?\s*\)$/i;

/** Parse `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()` and `rgba()`. */
export function parseColor(value: string): Rgb {
  const input = value.trim();

  const hex = HEX.exec(input);
  if (hex) {
    const digits = hex[1]!;
    const expand = (s: string) => Number.parseInt(s.length === 1 ? s + s : s, 16);
    if (digits.length === 3 || digits.length === 4) {
      return {
        r: expand(digits[0]!),
        g: expand(digits[1]!),
        b: expand(digits[2]!),
        a: digits.length === 4 ? expand(digits[3]!) / 255 : 1,
      };
    }
    if (digits.length === 6 || digits.length === 8) {
      return {
        r: expand(digits.slice(0, 2)),
        g: expand(digits.slice(2, 4)),
        b: expand(digits.slice(4, 6)),
        a: digits.length === 8 ? expand(digits.slice(6, 8)) / 255 : 1,
      };
    }
  }

  const fn = RGB_FN.exec(input);
  if (fn) {
    return {
      r: Number(fn[1]),
      g: Number(fn[2]),
      b: Number(fn[3]),
      a: fn[4] === undefined ? 1 : Number(fn[4]),
    };
  }

  throw new Error(`Unparseable colour: ${value}`);
}

/**
 * Flatten a possibly-translucent colour onto an opaque backdrop.
 *
 * Contrast is a property of what the eye receives, so a token with alpha has to
 * be composited before it can be measured. Without this step a scrim at 70%
 * would score against its own nominal colour and pass regardless of the surface
 * it actually sits on.
 */
export function composite(foreground: Rgb, backdrop: Rgb): Rgb {
  if (foreground.a >= 1) return foreground;
  const a = foreground.a;
  return {
    r: foreground.r * a + backdrop.r * (1 - a),
    g: foreground.g * a + backdrop.g * (1 - a),
    b: foreground.b * a + backdrop.b * (1 - a),
    a: 1,
  };
}

/** WCAG 2.1 relative luminance. */
export function relativeLuminance(color: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

/**
 * WCAG contrast ratio between two colours, 1–21.
 *
 * The foreground is composited onto the background first, so translucent
 * tokens are measured as they render.
 */
export function contrastRatio(foreground: string, background: string): number {
  const bg = parseColor(background);
  const fg = composite(parseColor(foreground), bg);
  const lighter = Math.max(relativeLuminance(fg), relativeLuminance(bg));
  const darker = Math.min(relativeLuminance(fg), relativeLuminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The bar each role has to clear, and why it differs.
 *
 * `text` and the accents clear WCAG AA for body copy, because they are read.
 * `borderStrong` and `borderDefault` clear the 3:1 non-text bar of WCAG 1.4.11,
 * because they are the load-bearing edges this system draws components with.
 * `borderSubtle` is a decorative divider — 1.4.11 does not cover it, so the bar
 * is only that it must be *visible* rather than accessible as a control.
 * Setting it to AA would force every hairline in the system to read as a rule.
 */
/**
 * The Hue vocabulary, in wheel order. Declared here rather than imported so the
 * gate stays runnable by `scripts/check-contrast.mjs` without a `.ts` import
 * extension — and `satisfies` still makes a missing or misspelled Hue a
 * compile error, which is the property that matters.
 */
/**
 * Above this, a colour declared `'neutral'` is not one. `accent.quiet` measures
 * 0.036 on `midnight` and 0.027 on `sketch` — both warm or cool greys with a
 * deliberate tint, which is why the bar is not zero.
 */
export const MAXIMUM_NEUTRAL_CHROMA = 0.045;

export interface HueAgreementCheck {
  readonly level: ThemeLevel;
  readonly role: string;
  readonly declared: HueRef;
  readonly value: string;
  /** The Hue's value, or null when the Role is declared `'neutral'`. */
  readonly expected: string | null;
  readonly passes: boolean;
  readonly detail: string;
}

/** OKLab chroma. Only used to prove a `'neutral'` really is one. */
function oklabChroma(hex: string): number {
  const decode = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [1, 3, 5].map((i) => decode(Number.parseInt(hex.slice(i, i + 2), 16) / 255));
  const l = Math.cbrt(0.4122214708 * r! + 0.5363325363 * g! + 0.0514459929 * b!);
  const m = Math.cbrt(0.2119034982 * r! + 0.6806995451 * g! + 0.1073969566 * b!);
  const s = Math.cbrt(0.0883024619 * r! + 0.2817188376 * g! + 0.6299787005 * b!);
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return Math.hypot(a, bb);
}

const PALETTE_HUES_ORDER = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'cyan',
  'blue',
  'violet',
  'magenta',
  'pink',
] as const satisfies readonly Hue[];

export const MINIMUM_RATIO = {
  text: 4.5,
  /** `text.inverse` sits on an accent fill, not on a surface. */
  textInverse: 4.5,
  accent: 4.5,
  intent: 4.5,
  /**
   * A Hue, above WCAG AA deliberately. An editor draws selection, current-line,
   * find-match and diff backgrounds *behind* the same tokens, so a palette
   * solved to exactly 4.5:1 has no room left to tint the ground. At 4.5 the
   * light palette has one sRGB step of headroom; at 5.5 it has twenty-two.
   * See `docs/palette-provenance.md` and #78.
   */
  palette: 5.5,
  /**
   * These numbers are the **web** Medium's, and that indexing is the point.
   *
   * ADR 0004 names this the asymmetry most likely to be got wrong later:
   * *colour values do not vary by Medium, but the floors they must clear do.* A
   * projected 1080p frame, a compression-damaged video and an unantialiased
   * terminal cell are not the browser's legibility problem, and until now this
   * was one set of numbers for every surface the system emits to.
   *
   * `MEDIA_DEFINITIONS[medium].contrastFloor` carries the per-Medium values;
   * `auditContrast` takes a Medium and reads them. The constants here remain as
   * the web Medium's, so nothing moves on merge and a caller that does not care
   * about Media keeps working.
   */
  /** `bright` Hues carry emphasis, not body text, so AA is the right bar. */
  paletteBright: 4.5,
  borderStrong: 3,
  borderDefault: 3,
  borderSubtle: 1.4,
  /**
   * A modal's dialog against the scrimmed page behind it. Not an accessibility
   * threshold — an assertion that the scrim does the one job it exists for.
   */
  overlaySeparation: 3,
  /**
   * A selection device — the accent `fill` behind a chosen tab, or the 4px
   * accent `edge` beside it — against the surface it sits on. WCAG 1.4.11's
   * non-text bar: the device is a UI component boundary, not text.
   */
  stateDevice: 3,
} as const;

export interface ContrastCheck {
  level: ThemeLevel;
  /** e.g. `text.muted on surface.raised`. */
  pair: string;
  foreground: string;
  background: string;
  ratio: number;
  minimum: number;
  passes: boolean;
}

/**
 * Every pair worth asserting, for every level.
 *
 * Text, accents and intents are checked against `base`, `raised` *and*
 * `sunken`, because a component is free to sit on any of the three and a token
 * that only works on the page ground is a bug waiting for the first card.
 *
 * The ladder is passed in rather than imported so this module is pure colour
 * arithmetic over data — it can audit a consumer's own overrides, and it stays
 * runnable from a plain Node script with no bundler in the path.
 */
/**
 * Does every Role actually hold the value of the Hue it says it is?
 *
 * `check:contrast` cannot answer this, and that is not an oversight in it — a
 * Role and a Hue are both foregrounds, both clear their own floors, and a
 * mismatch between them is not a contrast fault. It is a *drift* fault, and it
 * is the one ADR 0001 rejects its third option over:
 *
 *   > the two sets then drift silently, and there is no arithmetic that can
 *   > catch a `palette.cyan` that no longer matches the `accent.primary` it is
 *   > supposed to be.
 *
 * This is that arithmetic. It exists because the repo shipped the fault: after
 * `palette` landed, `midnight`'s `accent.tertiary` sat at `#ec4899` (5.12:1,
 * clearing the 4.5 Role floor) while `palette.pink` sat at `#f955a4` (5.90:1,
 * clearing the 5.5 Hue floor). Both gates passed. The two values are 0.036
 * apart in OKLab — indistinguishable, so no screenshot would have caught it
 * either.
 *
 * A Role declared `'neutral'` is asserted to *be* neutral rather than skipped,
 * because "declared as not-a-hue" and "quietly wrong" must not look the same.
 */
export function auditHueAgreement(
  ladder: Readonly<Record<ThemeLevel, LevelDefinition>>,
): HueAgreementCheck[] {
  const results: HueAgreementCheck[] = [];

  for (const level of Object.keys(ladder) as ThemeLevel[]) {
    const def = ladder[level];

    const check = (role: string, value: string, ref: HueRef) => {
      if (ref === 'neutral') {
        const chroma = oklabChroma(value);
        results.push({
          level,
          role,
          declared: ref,
          value,
          expected: null,
          passes: chroma <= MAXIMUM_NEUTRAL_CHROMA,
          detail: `chroma ${chroma.toFixed(3)} (max ${MAXIMUM_NEUTRAL_CHROMA})`,
        });
        return;
      }
      const expected = def.palette[ref];
      results.push({
        level,
        role,
        declared: ref,
        value,
        expected,
        passes: value.toLowerCase() === expected.toLowerCase(),
        detail: `palette.${ref} is ${expected}`,
      });
    };

    for (const [role, ref] of Object.entries(def.accentHue)) {
      check(`accent.${role}`, def.accent[role as Emphasis], ref);
    }
    for (const [role, ref] of Object.entries(def.intentHue)) {
      check(`intent.${role}`, def.intent[role as Intent], ref);
    }
  }

  return results;
}

/** The three floors a Medium supplies. See `MediumDefinition.contrastFloor`. */
export interface ContrastFloor {
  readonly role: number;
  readonly hue: number;
  readonly hueBright: number;
}

/** The web Medium's floors, restated so the default call is unchanged. */
export const WEB_FLOOR: ContrastFloor = {
  role: MINIMUM_RATIO.text,
  hue: MINIMUM_RATIO.palette,
  hueBright: MINIMUM_RATIO.paletteBright,
};

export function auditContrast(
  ladder: Readonly<Record<ThemeLevel, LevelDefinition>>,
  /**
   * The Medium's floors. Passed in rather than read from `media.ts`, because
   * this module has to stay importable by `scripts/check-contrast.mjs`, and a
   * runtime import there needs a `.ts` extension that `tsc` rejects. The script
   * owns the Medium; this module owns the arithmetic.
   */
  floor: ContrastFloor = WEB_FLOOR,
): ContrastCheck[] {
  const results: ContrastCheck[] = [];

  for (const [level, def] of Object.entries(ladder) as [ThemeLevel, LevelDefinition][]) {
    const grounds = [
      ['surface.base', def.surface.base],
      ['surface.raised', def.surface.raised],
      ['surface.sunken', def.surface.sunken],
    ] as const;

    const check = (pair: string, foreground: string, background: string, minimum: number) => {
      const ratio = contrastRatio(foreground, background);
      results.push({
        level,
        pair,
        foreground,
        background,
        ratio,
        minimum,
        passes: ratio >= minimum,
      });
    };

    for (const [groundName, ground] of grounds) {
      for (const tone of ['primary', 'secondary', 'muted'] as const satisfies readonly TextTone[]) {
        check(`text.${tone} on ${groundName}`, def.text[tone], ground, floor.role);
      }
      for (const tone of ['primary', 'secondary', 'tertiary', 'quiet'] as const satisfies readonly Emphasis[]) {
        check(`accent.${tone} on ${groundName}`, def.accent[tone], ground, floor.role);
      }
      for (const tone of ['info', 'success', 'warning', 'danger'] as const satisfies readonly Intent[]) {
        check(`intent.${tone} on ${groundName}`, def.intent[tone], ground, floor.role);
      }
      // ADR 0001: gate `palette` once per Hue rather than once per Role that
      // consumes it. Separate the palette, not each of its consumers.
      for (const hue of PALETTE_HUES_ORDER) {
        check(`palette.${hue} on ${groundName}`, def.palette[hue], ground, floor.hue);
        check(
          `palette.bright.${hue} on ${groundName}`,
          def.paletteBright[hue],
          ground,
          floor.hueBright,
        );
      }
      check(`border.strong on ${groundName}`, def.border.strong, ground, MINIMUM_RATIO.borderStrong);
      check(`border.default on ${groundName}`, def.border.default, ground, MINIMUM_RATIO.borderDefault);
      check(`border.subtle on ${groundName}`, def.border.subtle, ground, MINIMUM_RATIO.borderSubtle);
    }

    // `text.inverse` is what a filled accent button prints in, so it is measured
    // against the accents rather than against a surface.
    // `quiet` is in this list because `Tag` ships `bg-accent-quiet
    // text-content-inverse`. It was omitted while the other three were checked,
    // so a palette edit to `quiet` would have gone unmeasured — a coverage gap
    // rather than a live defect, but the README claims every pair is audited.
    for (const tone of ['primary', 'secondary', 'tertiary', 'quiet'] as const satisfies readonly Emphasis[]) {
      check(
        `text.inverse on accent.${tone}`,
        def.text.inverse,
        def.accent[tone],
        floor.role,
      );
    }
    for (const tone of ['info', 'success', 'warning', 'danger'] as const satisfies readonly Intent[]) {
      check(
        `text.inverse on intent.${tone}`,
        def.text.inverse,
        def.intent[tone],
        floor.role,
      );
    }
    // A scrim's job is to separate the dialog from the page behind it. Nothing
    // renders text on the scrim, so the assertion is about separation — and it
    // can be satisfied by either edge of the dialog, because this system draws
    // components with a load-bearing 2px border as often as with a fill. On a
    // dark level the fill barely differs from the scrim and the white border
    // does the work; on a light level the white fill does it and the dark
    // border is the one that disappears. Requiring both would fail every level.
    const scrimOverBase = composite(
      parseColor(def.surface.overlay),
      parseColor(def.surface.base),
    );
    const scrim = `rgb(${Math.round(scrimOverBase.r)}, ${Math.round(scrimOverBase.g)}, ${Math.round(scrimOverBase.b)})`;
    const separation = Math.max(
      contrastRatio(def.surface.raised, scrim),
      contrastRatio(def.border.strong, scrim),
    );
    results.push({
      level,
      pair: 'dialog (fill or border) against scrimmed page',
      foreground: `${def.surface.raised} / ${def.border.strong}`,
      background: scrim,
      ratio: separation,
      minimum: MINIMUM_RATIO.overlaySeparation,
      passes: separation >= MINIMUM_RATIO.overlaySeparation,
    });
  }

  return results;
}

/** How a component may mark a selected item. */
export type SelectionDevice = 'fill' | 'edge' | 'surface pair';

export interface SelectionDeviceCheck {
  level: ThemeLevel;
  device: SelectionDevice;
  /** e.g. `accent.primary on surface.raised`. */
  pair: string;
  foreground: string;
  background: string;
  ratio: number;
  minimum: number;
  /** For `fill` and `edge`: the device is usable. For `surface pair`: it would be, and that is the trap. */
  passes: boolean;
}

/**
 * The state rule, as arithmetic.
 *
 * Selected state is carried by an accent **fill** or an accent **edge**, never
 * by swapping one surface for another. The reason is not taste: the surfaces
 * exist to *layer* — a strip behind its tabs, a panel over a page — so they
 * are deliberately close in lightness, and on the light rungs they are a few
 * percent apart. A widget that marks its chosen tab `surface.base` among
 * `surface.raised` siblings reads acceptably on `midnight` and is invisible on
 * `bright`. That is how the bug ships: it passes review on the dark rung the
 * reviewer happens to be on.
 *
 * So this audits both halves. The fill and edge devices — the accent against
 * every surface a tab can sit on — must clear the non-text bar on every level,
 * which is what makes the rule safe to follow. The surface pairs are measured
 * too, and reported, so the number that makes them unusable is in the gate's
 * output rather than in someone's memory. They are not expected to pass; a
 * level on which they *did* would be the one where a surface-pair widget
 * slips through.
 */
export function auditSelectionDevices(
  ladder: Readonly<Record<ThemeLevel, LevelDefinition>>,
): SelectionDeviceCheck[] {
  const results: SelectionDeviceCheck[] = [];

  for (const [level, def] of Object.entries(ladder) as [ThemeLevel, LevelDefinition][]) {
    const grounds = [
      ['surface.base', def.surface.base],
      ['surface.raised', def.surface.raised],
    ] as const;

    const check = (
      device: SelectionDevice,
      pair: string,
      foreground: string,
      background: string,
    ) => {
      const ratio = contrastRatio(foreground, background);
      results.push({
        level,
        device,
        pair,
        foreground,
        background,
        ratio,
        minimum: MINIMUM_RATIO.stateDevice,
        passes: ratio >= MINIMUM_RATIO.stateDevice,
      });
    };

    for (const [groundName, ground] of grounds) {
      // `quiet` is the de-emphasised step, not a fifth colour — a tab it
      // marks is meant to recede, so it is not a selection device.
      for (const tone of ['primary', 'secondary', 'tertiary'] as const satisfies readonly Emphasis[]) {
        check('fill', `accent.${tone} fill on ${groundName}`, def.accent[tone], ground);
        check('edge', `accent.${tone} edge on ${groundName}`, def.accent[tone], ground);
      }
    }

    check('surface pair', 'surface.raised against surface.base', def.surface.raised, def.surface.base);
    check('surface pair', 'surface.sunken against surface.base', def.surface.sunken, def.surface.base);
    check('surface pair', 'surface.sunken against surface.raised', def.surface.sunken, def.surface.raised);
  }

  return results;
}
