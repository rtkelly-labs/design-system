/**
 * Contrast arithmetic over the ladder.
 *
 * Every colour in `levels.ts` is a literal, so contrast can be computed as data
 * — no browser, no screenshot, no rendering. `pnpm check:contrast` walks every
 * level and fails CI on a violation, which is the thing that makes the ladder
 * maintainable: every level times every role pair is a matrix nobody eyeballs
 * reliably twice.
 *
 * The gate is WCAG 2.1 relative luminance. APCA is the better predictor of
 * perceived contrast, but it is not yet normative and its thresholds are not
 * stable; WCAG ratios are what an audit will be run against. So APCA is
 * computed alongside and reported, never gated. It is reported because WCAG 2
 * overrates light text on a dark ground: midnight's `text.muted` passed at
 * 5.90:1 while scoring Lc -41, the weakest text pair in the system (#372).
 */

import type { Emphasis, Hue, HueRef, Intent, RoleRef, TextTone } from '../lib/theme';
import type { EditorRole, LevelDefinition, SyntaxRole, ThemeLevel } from './levels';

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
 * APCA lightness contrast (Lc), per APCA-W3 0.0.98G — roughly -108 to 106.
 *
 * Signed by polarity: positive is dark text on a light ground, negative is
 * light on dark, and the magnitude is what compares across the two. Unlike a
 * WCAG ratio it is not symmetric, which is the point: the same pair of colours
 * reads differently depending on which one is the text.
 *
 * Constants are the published 0.0.98G set; the luminance is APCA's own simple
 * 2.4 power curve, not WCAG's piecewise one. Reported, not gated — see the
 * module comment.
 */
export function apcaContrast(foreground: string, background: string): number {
  const bg = parseColor(background);
  const fg = composite(parseColor(foreground), bg);
  const y = (c: Rgb) =>
    0.2126729 * (c.r / 255) ** 2.4 + 0.7151522 * (c.g / 255) ** 2.4 + 0.072175 * (c.b / 255) ** 2.4;
  const clamp = (lum: number) => (lum > 0.022 ? lum : lum + (0.022 - lum) ** 1.414);
  const text = clamp(y(fg));
  const ground = clamp(y(bg));
  if (Math.abs(ground - text) < 0.0005) return 0;
  if (ground > text) {
    const sapc = (ground ** 0.56 - text ** 0.57) * 1.14;
    return sapc < 0.1 ? 0 : (sapc - 0.027) * 100;
  }
  const sapc = (ground ** 0.65 - text ** 0.62) * 1.14;
  return sapc > -0.1 ? 0 : (sapc + 0.027) * 100;
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
  /** APCA Lc for the same pair, reported alongside the ratio and never gated. Null where the pair is a separation rather than a foreground on a ground. */
  apca: number | null;
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
    def.seriesHue.forEach((ref, i) => check(`series.${i + 1}`, def.series[i]!, ref));
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
        apca: apcaContrast(foreground, background),
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
    // `Button variant="danger"` (D3-B) prints `text.inverse` on `intent.danger` when
    // hovered or focused, so the pair is measured here rather than assumed.
    for (const tone of ['info', 'success', 'warning', 'danger'] as const satisfies readonly Intent[]) {
      check(
        `text.inverse on intent.${tone}`,
        def.text.inverse,
        def.intent[tone],
        floor.role,
      );
    }
    // D8 tints: a role tints a surface that prints the role as text (the time on
    // an event) and `text.primary` as ink (its title). Both must hold on the
    // tint, at this level's own declared strength. The edge-only alternative
    // (D8-C) prints on `surface.raised`, which the grounds loop above covers.
    for (const [name, role, tint] of [
      ...(['primary', 'secondary', 'tertiary', 'quiet'] as const satisfies readonly Emphasis[]).map(
        (tone) => [`accent.${tone}`, def.accent[tone], def.tint.accent[tone]] as const,
      ),
      ...(['info', 'success', 'warning', 'danger'] as const satisfies readonly Intent[]).map(
        (tone) => [`intent.${tone}`, def.intent[tone], def.tint.intent[tone]] as const,
      ),
    ]) {
      check(`tint.${name}: ${name} on tint`, role, tint, floor.role);
      check(`tint.${name}: text.primary on tint`, def.text.primary, tint, floor.role);
    }
    // D6-B: a selected row in a multi-select collection prints `text.primary`
    // on `selection.multi`, and only that. `text.secondary` is 3.45:1 / 3.58:1
    // there, which is why a row's other cells do not step down on selection.
    check('selection.multi: text.primary on selection.multi', def.text.primary, def.selection.multi, floor.role);
    // `Select`'s open list (#164), named for the component because it used to
    // be the one surface the palette did not reach: the operating system
    // painted it. The rows are `text.primary` on `surface.raised`; a disabled
    // row is `text.muted`; the highlighted row is `text.inverse` on the field's
    // accent fill, and the chosen row's mark is that accent on the list. The
    // accent is whichever the caller passes, so every Emphasis and Intent is
    // measured rather than only the default. The values repeat pairs above —
    // the point is that removing one of those cannot silently un-gate the list.
    check('select.option: text.primary on surface.raised', def.text.primary, def.surface.raised, floor.role);
    check('select.option disabled: text.muted on surface.raised', def.text.muted, def.surface.raised, floor.role);
    check('select.placeholder: text.muted on surface.base', def.text.muted, def.surface.base, floor.role);
    const listAccents = [
      ...(['primary', 'secondary', 'tertiary', 'quiet'] as const satisfies readonly Emphasis[]).map(
        (tone) => [`accent.${tone}`, def.accent[tone]] as const,
      ),
      ...(['info', 'success', 'warning', 'danger'] as const satisfies readonly Intent[]).map(
        (tone) => [`intent.${tone}`, def.intent[tone]] as const,
      ),
    ];
    for (const [name, fill] of listAccents) {
      check(`select.option highlighted: text.inverse on ${name}`, def.text.inverse, fill, floor.role);
      check(`select.option selected mark: ${name} on surface.raised`, fill, def.surface.raised, floor.role);
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
      apca: null,
      minimum: MINIMUM_RATIO.overlaySeparation,
      passes: separation >= MINIMUM_RATIO.overlaySeparation,
    });
  }

  return results;
}

/**
 * How far apart the text tones sit, in APCA Lc, on each ground.
 *
 * Reported, not gated. It is the other half of tuning `text.muted`: darkening it
 * for legibility is free until it lands so close to `text.secondary` that the
 * two stop reading as two tones. #372 measured `#4f4a3d` on sketch at 7 Lc from
 * secondary, which is why `#5c5546` was chosen instead.
 */
export interface TextHierarchyStep {
  level: ThemeLevel;
  ground: string;
  /** Lc magnitude of primary, secondary and muted on this ground. */
  lc: Readonly<Record<'primary' | 'secondary' | 'muted', number>>;
  /** secondary minus muted, in Lc magnitude. */
  mutedStep: number;
}

export function auditTextHierarchy(
  ladder: Readonly<Record<ThemeLevel, LevelDefinition>>,
): TextHierarchyStep[] {
  const steps: TextHierarchyStep[] = [];
  for (const [level, def] of Object.entries(ladder) as [ThemeLevel, LevelDefinition][]) {
    for (const ground of ['base', 'raised', 'sunken'] as const) {
      const lc = (tone: 'primary' | 'secondary' | 'muted') =>
        Math.abs(apcaContrast(def.text[tone], def.surface[ground]));
      const tones = { primary: lc('primary'), secondary: lc('secondary'), muted: lc('muted') };
      steps.push({ level, ground: `surface.${ground}`, lc: tones, mutedStep: tones.secondary - tones.muted });
    }
  }
  return steps;
}

/** How a component may mark a selected item. */
export type SelectionDevice = 'fill' | 'edge' | 'tint' | 'outline' | 'surface pair';

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

    // D6-B, the multi-select row. Two devices, both 1.4.11: the tint that marks
    // a selected row against either ground the row can sit on, and the 2px
    // outline that marks the cursor row against both ground and tint — the
    // cursor can land on a selected row, so it must read on the tint too.
    // Hover is supplemental under 1.4.11 and is not gated here.
    for (const [groundName, ground] of grounds) {
      check('tint', `selection.multi tint on ${groundName}`, def.selection.multi, ground);
      check('outline', `border.strong cursor outline on ${groundName}`, def.border.strong, ground);
    }
    check('outline', 'border.strong cursor outline on selection.multi', def.border.strong, def.selection.multi);

    check('surface pair', 'surface.raised against surface.base', def.surface.raised, def.surface.base);
    check('surface pair', 'surface.sunken against surface.base', def.surface.sunken, def.surface.base);
    check('surface pair', 'surface.sunken against surface.raised', def.surface.sunken, def.surface.raised);
  }

  return results;
}

// ---------------------------------------------------------------------------
// D9: the series group, and the `more` contrast preference
// ---------------------------------------------------------------------------

type V3 = readonly [number, number, number];

const srgbToLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const linearToSrgb = (l: number) => {
  const c = Math.min(1, Math.max(0, l));
  return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
};

/** The two colour-vision deficiencies the series group is simulated under. */
export const CVD_SIMULATIONS = ['deuteranopia', 'protanopia'] as const;
export type CvdSimulation = (typeof CVD_SIMULATIONS)[number];
export type Vision = 'normal' | CvdSimulation;

/** Machado, Oliveira and Fernandes 2009, severity 1.0, applied in linear RGB. */
const CVD_MATRIX: Readonly<Record<CvdSimulation, readonly [V3, V3, V3]>> = {
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
};

/** A colour as it appears under `vision`, as OKLab. */
function toOklabUnder(hex: string, vision: Vision): V3 {
  const { r, g, b } = parseColor(hex);
  let lin: V3 = [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
  if (vision !== 'normal') {
    const m = CVD_MATRIX[vision];
    const row = (k: 0 | 1 | 2) => m[k][0] * lin[0] + m[k][1] * lin[1] + m[k][2] * lin[2];
    lin = [row(0), row(1), row(2)];
  }
  // Clamp and round-trip through 8-bit sRGB, as a display would.
  const [lr, lg, lb] = lin.map((c) => srgbToLinear(Math.round(linearToSrgb(c))));
  const l = Math.cbrt(0.4122214708 * lr! + 0.5363325363 * lg! + 0.0514459929 * lb!);
  const m = Math.cbrt(0.2119034982 * lr! + 0.6806995451 * lg! + 0.1073969566 * lb!);
  const s = Math.cbrt(0.0883024619 * lr! + 0.2817188376 * lg! + 0.6299787005 * lb!);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Euclidean distance in OKLab, L in 0..1 — the scale `DESIGN.md`'s 0.04 gate is stated in. */
export function deltaE(a: string, b: string, vision: Vision = 'normal'): number {
  const x = toOklabUnder(a, vision);
  const y = toOklabUnder(b, vision);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/** Below this, two colours count as one (`DESIGN.md`). The floor for normal vision. */
export const MINIMUM_SERIES_SEPARATION = 0.04;

export interface SeriesSeparation {
  readonly level: ThemeLevel;
  readonly vision: Vision;
  /** Smallest pairwise deltaE among the six members. */
  readonly min: number;
  /** The closest pair, as 1-based series numbers. */
  readonly pair: readonly [number, number];
  /** Only normal vision is gated: the simulations are what the glyphs are for. */
  readonly gated: boolean;
  readonly passes: boolean;
}

/**
 * The closest pair of series members on every level, under normal vision (gated
 * at {@link MINIMUM_SERIES_SEPARATION}) and under simulated deuteranopia and
 * protanopia (reported). A deficiency collapses hue differences by design, so
 * gating it would only force a palette that hides the case the `patterns`
 * preference exists to cover.
 */
export function auditSeriesSeparation(
  ladder: Readonly<Record<ThemeLevel, LevelDefinition>>,
): SeriesSeparation[] {
  const results: SeriesSeparation[] = [];
  for (const level of Object.keys(ladder) as ThemeLevel[]) {
    const series = ladder[level].series;
    for (const vision of ['normal', ...CVD_SIMULATIONS] as const) {
      let min = Infinity;
      let pair: readonly [number, number] = [1, 2];
      for (let i = 0; i < series.length; i++) {
        for (let j = i + 1; j < series.length; j++) {
          const d = deltaE(series[i]!, series[j]!, vision);
          if (d < min) {
            min = d;
            pair = [i + 1, j + 1];
          }
        }
      }
      const gated = vision === 'normal';
      results.push({ level, vision, min, pair, gated, passes: !gated || min >= MINIMUM_SERIES_SEPARATION });
    }
  }
  return results;
}

/**
 * The `more` contrast preference as a delta over one Level (ADR 0007).
 *
 * Not a third palette: every value is another value the same Level already
 * declares, so the preference authors no colour and cannot disagree with the
 * ladder. Borders step one rung up (subtle to default, default to strong),
 * `text.muted` becomes `text.secondary`, and the role tints become
 * `surface.base`, which is the edge-only treatment D8-C names: the 4px role edge
 * stays and carries the role, and the role-coloured text on it gains contrast.
 *
 * The tints deliberately do **not** take the selection strength, though that is
 * the strongest device available. Measured: a role mixed in at
 * `selectionStrength` is 1.9 to 3.6:1 against the role as text and drops
 * `text.primary` to 4.44:1 on Sketch, so every text-bearing fill would fail the
 * 4.5:1 floor it must hold. `selection.multi` is unchanged: it is already a
 * 3:1 device.
 *
 * `auditContrast` runs over the result, so the preference is gated by the same
 * arithmetic as the Level it modifies.
 */
export function applyContrastDelta(def: LevelDefinition): LevelDefinition {
  const base = def.surface.base;
  const next: LevelDefinition = {
    ...def,
    text: { ...def.text, muted: def.text.secondary },
    border: { ...def.border, subtle: def.border.default, default: def.border.strong },
    tint: {
      accent: { primary: base, secondary: base, tertiary: base, quiet: base },
      intent: { info: base, success: base, warning: base, danger: base },
    },
  };
  // The code Groups read text and border Roles by name, so they follow the delta:
  // a comment stops being a step below the code, and the current-line hairline
  // takes the default border. Re-derived from their declared sources, not patched.
  return { ...next, syntax: deriveSyntax(next), editor: deriveEditor(next) };
}

/** The ladder with {@link applyContrastDelta} applied to every Level. */
export function contrastMoreLadder(
  ladder: Readonly<Record<ThemeLevel, LevelDefinition>>,
): Record<ThemeLevel, LevelDefinition> {
  const out = {} as Record<ThemeLevel, LevelDefinition>;
  for (const level of Object.keys(ladder) as ThemeLevel[]) out[level] = applyContrastDelta(ladder[level]);
  return out;
}

// ---------------------------------------------------------------------------
// #148 / #80: the syntax and editor Groups (Round 6)
// ---------------------------------------------------------------------------

/** The editor roles that carry alpha, and which `editorAlpha` entry sets each. */
export const EDITOR_TRANSLUCENT = {
  selection: 'selection',
  bracketWash: 'bracket',
  diffAddedWash: 'diff',
  diffRemovedWash: 'diff',
} as const satisfies Partial<Record<EditorRole, 'selection' | 'bracket' | 'diff'>>;

/** The target each `editorAlpha` entry is fitted down from, in percent. */
export const EDITOR_ALPHA_TARGET = { selection: 30, bracket: 10, diff: 12 } as const;

/** The lowest each is allowed to fall before the fit gives up and the audit fails. */
const EDITOR_ALPHA_FLOOR = { selection: 5, bracket: 2, diff: 4 } as const;

type Sources = Pick<LevelDefinition, 'accent' | 'intent' | 'text' | 'border' | 'palette'>;

/** What a {@link RoleRef} resolves to on a level. */
export function resolveRef(def: Sources, ref: RoleRef): string {
  const [group, key] = ref.split('.') as ['accent' | 'intent' | 'text' | 'border' | 'palette', string];
  return (def[group] as Readonly<Record<string, string>>)[key]!;
}

const channel2 = (n: number) => Math.round(n).toString(16).padStart(2, '0');

/** `#rrggbb` for an opaque {@link Rgb}. */
export function toHex(c: Rgb): string {
  return `#${channel2(c.r)}${channel2(c.g)}${channel2(c.b)}`;
}

/** `hex` at `percent` alpha as the literal `#rrggbbaa` the ladder carries. */
export function alphaHex(hex: string, percent: number): string {
  return `${hex.toLowerCase()}${channel2((percent / 100) * 255)}`;
}

/** A colour (possibly `#rrggbbaa`) laid over an opaque ground, as `#rrggbb`. */
export function flattenOnto(over: string, ground: string): string {
  return toHex(composite(parseColor(over), parseColor(ground)));
}

/** The `syntax` literals a level's `syntaxSource` resolves to. */
export function deriveSyntax(def: Sources & Pick<LevelDefinition, 'syntaxSource'>): Record<SyntaxRole, string> {
  const out = {} as Record<SyntaxRole, string>;
  for (const role of Object.keys(def.syntaxSource) as SyntaxRole[]) out[role] = resolveRef(def, def.syntaxSource[role]).toLowerCase();
  return out;
}

/** The `editor` literals a level's `editorSource` and `editorAlpha` resolve to. */
export function deriveEditor(
  def: Sources & Pick<LevelDefinition, 'editorSource' | 'editorAlpha'>,
  alpha: LevelDefinition['editorAlpha'] = def.editorAlpha,
): Record<EditorRole, string> {
  const out = {} as Record<EditorRole, string>;
  for (const role of Object.keys(def.editorSource) as EditorRole[]) {
    const base = resolveRef(def, def.editorSource[role]).toLowerCase();
    const key = (EDITOR_TRANSLUCENT as Partial<Record<EditorRole, 'selection' | 'bracket' | 'diff'>>)[role];
    out[role] = key ? alphaHex(base, alpha[key]) : base;
  }
  return out;
}

/** Largest whole percent at or below `target` for which `ok` holds. */
function fitPercent(target: number, floor: number, ok: (percent: number) => boolean): number {
  for (let p = target; p >= floor; p -= 1) if (ok(p)) return p;
  return floor;
}

/** Every text colour an editor draws behind a wash: the syntax tokens and the two line-number inks. */
function codeInks(def: LevelDefinition): string[] {
  return [...Object.values(def.syntax), def.editor.lineNumber, def.editor.lineNumberActive];
}

/**
 * Does `percent` hold for one translucent role: its text reads at 4.5:1 on
 * every surface the wash can sit on, composited. `diff` is the strength the
 * diff bands are drawn at, because a selection or a bracket can land on a
 * changed line.
 */
export function holdsEditorAlpha(
  def: LevelDefinition,
  key: 'selection' | 'bracket' | 'diff',
  percent: number,
  diff: number = def.editorAlpha.diff,
): boolean {
  const grounds = [def.surface.base, def.surface.raised, def.surface.sunken];
  const min = MINIMUM_RATIO.text;
  const add = resolveRef(def, def.editorSource.diffAdded);
  const del = resolveRef(def, def.editorSource.diffRemoved);
  if (key === 'diff') {
    const inks = codeInks(def);
    return grounds.every((g) =>
      [add, del].every((hue) => {
        const wash = flattenOnto(alphaHex(hue, percent), g);
        return inks.every((ink) => contrastRatio(ink, wash) >= min);
      }),
    );
  }
  // Every surface a wash can sit on: a ground, or a ground under a diff band.
  const under = grounds.flatMap((g) => [g, flattenOnto(alphaHex(add, diff), g), flattenOnto(alphaHex(del, diff), g)]);
  const hue = resolveRef(def, key === 'selection' ? def.editorSource.selection : def.editorSource.bracketWash);
  const ink = key === 'selection' ? resolveRef(def, def.editorSource.selectionInk) : def.text.primary;
  return under.every((u) => contrastRatio(ink, flattenOnto(alphaHex(hue, percent), u)) >= min);
}

/**
 * The strengths `editorAlpha` must hold: the largest at or below each target
 * for which its text still reads at 4.5:1 composited on every ground.
 *
 * Fitted in dependency order, diff first. Every ground, not just `base`: the
 * editor sits on `sunken`.
 */
export function fitEditorAlpha(def: LevelDefinition): LevelDefinition['editorAlpha'] {
  const diff = fitPercent(EDITOR_ALPHA_TARGET.diff, EDITOR_ALPHA_FLOOR.diff, (p) => holdsEditorAlpha(def, 'diff', p));
  const selection = fitPercent(EDITOR_ALPHA_TARGET.selection, EDITOR_ALPHA_FLOOR.selection, (p) => holdsEditorAlpha(def, 'selection', p, diff));
  const bracket = fitPercent(EDITOR_ALPHA_TARGET.bracket, EDITOR_ALPHA_FLOOR.bracket, (p) => holdsEditorAlpha(def, 'bracket', p, diff));
  return { selection, bracket, diff };
}

export interface EditorCheck {
  level: ThemeLevel;
  /** e.g. `syntax.keyword on diff added over surface.sunken`. */
  pair: string;
  foreground: string;
  /** The flattened background the pair was measured on. */
  background: string;
  ratio: number;
  minimum: number;
  passes: boolean;
}

/** Text floor: a syntax token, a line number, the selection ink. */
export const EDITOR_TEXT_FLOOR = 4.5;
/** Edge floor: a find, bracket, squiggle or diff edge (WCAG 1.4.11). */
export const EDITOR_EDGE_FLOOR = 3;

/**
 * The syntax and editor gates, as arithmetic.
 *
 *  1. Every syntax token at 4.5:1 on `base`, `raised` and `sunken`.
 *  2. Every syntax token, and the selection ink, at 4.5:1 composited on every
 *     editor band it can sit on: the two diff washes over each ground for a
 *     token; the selection over each ground and over each diff band for the ink
 *     (a selection can cover a changed line), and the bracket wash for the
 *     glyph it matches.
 *  3. The find, bracket, info and diff edges at 3:1 on each ground, and the
 *     bracket edge on its own wash; error and warning at 4.5:1, since the
 *     Terminal figure draws them as text.
 *
 * Kept apart from {@link auditContrast} so the 147-pair figure that the docs
 * quote does not move.
 */
export function auditEditor(ladder: Readonly<Record<ThemeLevel, LevelDefinition>>): EditorCheck[] {
  const results: EditorCheck[] = [];
  for (const [level, def] of Object.entries(ladder) as [ThemeLevel, LevelDefinition][]) {
    const grounds = [
      ['surface.base', def.surface.base],
      ['surface.raised', def.surface.raised],
      ['surface.sunken', def.surface.sunken],
    ] as const;
    const check = (pair: string, fg: string, bg: string, minimum: number) => {
      const ratio = contrastRatio(fg, bg);
      results.push({ level, pair, foreground: fg, background: bg, ratio, minimum, passes: ratio >= minimum });
    };

    for (const [gName, ground] of grounds) {
      for (const [role, value] of Object.entries(def.syntax)) {
        check(`syntax.${role} on ${gName}`, value, ground, EDITOR_TEXT_FLOOR);
      }
      check(`editor.lineNumber on ${gName}`, def.editor.lineNumber, ground, EDITOR_TEXT_FLOOR);
      check(`editor.lineNumberActive on ${gName}`, def.editor.lineNumberActive, ground, EDITOR_TEXT_FLOOR);

      const diffBands = [
        ['diff added', flattenOnto(def.editor.diffAddedWash, ground)],
        ['diff removed', flattenOnto(def.editor.diffRemovedWash, ground)],
      ] as const;
      for (const [bName, band] of diffBands) {
        for (const [role, value] of Object.entries(def.syntax)) {
          check(`syntax.${role} on ${bName} over ${gName}`, value, band, EDITOR_TEXT_FLOOR);
        }
        check(`editor.lineNumber on ${bName} over ${gName}`, def.editor.lineNumber, band, EDITOR_TEXT_FLOOR);
        check(`editor.lineNumberActive on ${bName} over ${gName}`, def.editor.lineNumberActive, band, EDITOR_TEXT_FLOOR);
      }

      const surfaces: (readonly [string, string])[] = [[gName, ground], ...diffBands.map(([n, b]) => [`${n} over ${gName}`, b] as const)];
      for (const [sName, surface] of surfaces) {
        check(`editor.selectionInk on selection over ${sName}`, def.editor.selectionInk, flattenOnto(def.editor.selection, surface), EDITOR_TEXT_FLOOR);
        check(`text.primary on bracketWash over ${sName}`, def.text.primary, flattenOnto(def.editor.bracketWash, surface), EDITOR_TEXT_FLOOR);
      }

      for (const role of ['find', 'findCurrent', 'bracket', 'info', 'diffAdded', 'diffRemoved'] as const) {
        check(`editor.${role} on ${gName}`, def.editor[role], ground, EDITOR_EDGE_FLOOR);
      }
      // Error and warning are also drawn as text (the Terminal figure's line kinds), so they hold 4.5.
      for (const role of ['error', 'warning'] as const) {
        check(`editor.${role} on ${gName}`, def.editor[role], ground, EDITOR_TEXT_FLOOR);
      }
      check(`editor.bracket on bracketWash over ${gName}`, def.editor.bracket, flattenOnto(def.editor.bracketWash, ground), EDITOR_EDGE_FLOOR);
    }
  }
  return results;
}

export interface EditorAgreement {
  level: ThemeLevel;
  role: string;
  value: string;
  expected: string;
  source: string;
  passes: boolean;
}

/** Does every `syntax` and `editor` literal equal what its declared source resolves to, at its declared alpha? */
export function auditEditorAgreement(ladder: Readonly<Record<ThemeLevel, LevelDefinition>>): EditorAgreement[] {
  const out: EditorAgreement[] = [];
  for (const [level, def] of Object.entries(ladder) as [ThemeLevel, LevelDefinition][]) {
    const syntax = deriveSyntax(def);
    for (const role of Object.keys(def.syntaxSource) as SyntaxRole[]) {
      out.push({ level, role: `syntax.${role}`, value: def.syntax[role], expected: syntax[role], source: def.syntaxSource[role], passes: def.syntax[role].toLowerCase() === syntax[role] });
    }
    const editor = deriveEditor(def);
    for (const role of Object.keys(def.editorSource) as EditorRole[]) {
      out.push({ level, role: `editor.${role}`, value: def.editor[role], expected: editor[role], source: def.editorSource[role], passes: def.editor[role].toLowerCase() === editor[role] });
    }
  }
  return out;
}
