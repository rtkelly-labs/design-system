/**
 * The theme ladder — the single place a level name or a level's colour is written.
 *
 * Everything else in the system derives from this file: the CSS in
 * `theme.generated.css`, the runtime provider, the Storybook toolbar, the
 * walkthrough matrix, and the contrast gate. Adding a level here is a type
 * error everywhere it has not been handled; adding a *role* is a type error in
 * every level at once. That is the guarantee — not a convention.
 *
 * ## Why a ladder and not a polarity, at two levels
 *
 * The ladder ran to four rungs — `midnight`, `dim`, `bright`, `white` — on the
 * argument that two themes can share a polarity and still want different
 * grounds. That argument was sound; the assumption under it was not. Nothing
 * consumed the fourth rung and nothing reached the second, so three of the four
 * were paid for and never collected. The pair is `midnight` and `light`.
 *
 * Polarity nevertheless stays a *declared property of a level* rather than the
 * axis, and this is worth stating because the collapse is usually assumed to
 * end it. It does not, because **neither level is named for its polarity**:
 * `midnight` has polarity `dark`, `sketch` has polarity `light`. So
 * {@link SYSTEM_LEVEL} still has a real job — mapping two media states onto two
 * names that are neither of them — and a `Record<Polarity, T>` remains a
 * different type from a `Record<ThemeLevel, T>`. Had the levels been called
 * `dark` and `light` the two would have collapsed into one thing and polarity
 * could have gone with them.
 *
 * Both polarity variants therefore survive: `dark:` and `light:` each span a
 * polarity rather than naming a level, so neither collides with a level
 * variant. `midnight` names a ground; `sketch` names a surface and a way of
 * drawing on it. Neither is a synonym for its polarity, which is the property
 * that keeps a third level cheap.
 *
 * ## Why every value is a literal
 *
 * The previous token layer derived surfaces, text and borders from two poles
 * with `color-mix()` percentages. Percentages tuned against near-black do not
 * hold at the light end — `border-subtle` at 28% is a visible hairline on
 * black and invisible on paper. Literals also make the ladder *checkable*:
 * `pnpm check:contrast` can compute every text-on-surface ratio without a
 * browser — 222 pairs, 111 per Level, including every Hue against every
 * ground, which is what makes hand-tuned literals sustainable rather than
 * twenty times the manual review. Stated per Level deliberately: 440 was
 * written here in the commit that collapsed four Levels to two, so the total
 * was stale the moment it was typed.
 *
 * The one exception is `surface.overlay`, which is a scrim and needs alpha.
 */

import type { BorderTone, Emphasis, Hue, HueRef, Intent, Surface, TextTone } from '../lib/theme';

/**
 * The ladder, ordered from darkest to lightest. Order is meaningful: it is what
 * `cycleLevel` steps through and what the Storybook toolbar and walkthrough
 * matrix render in.
 */
export const THEME_LEVELS = ['midnight', 'sketch'] as const;

/** A level of the ladder. */
export type ThemeLevel = (typeof THEME_LEVELS)[number];

/**
 * Whether a level reads as dark-on-light or light-on-dark. Declared per level
 * rather than inferred, because it drives things a luminance calculation should
 * not silently decide: the `color-scheme` property (which controls native form
 * controls, scrollbars and the caret), the `dark:`/`light:` Tailwind variants,
 * and the `prefers-color-scheme` mapping.
 */
export type Polarity = 'dark' | 'light';

/**
 * The three colours that do **not** vary by level.
 *
 * Every other colour in this module is declared once per level and swaps with
 * it. These do not, and that invariance is the whole point: `#ffffff` means
 * *white*, not "whatever this level calls its lightest ground". The
 * `--color-black` / `--color-white` compat aliases are the counter-example —
 * they track `surface.base` and `text.primary`, so `--color-black` resolves to
 * `#ffffff` on the `white` level. A token named for an appearance, holding the
 * opposite appearance.
 *
 * Use these when true black or true white is genuinely meant: a print surface,
 * an SVG fill, a scrim. Not as a page ground — that is `surface.base`.
 */
export const FIXED_COLOURS = {
  black: '#000000',
  white: '#ffffff',
  transparent: 'transparent',
} as const;

export type FixedColour = keyof typeof FIXED_COLOURS;

/**
 * The Hue vocabulary, in wheel order starting at red.
 *
 * Ten is the ceiling, not a comfortable middle: the tightest pair already sits
 * at deltaE 0.049 on the light levels, and an eleventh candidate was dropped
 * during derivation for landing 13 degrees from the measured blue at deltaE
 * 0.024. Adding one means checking the separation gate, not just this array.
 */
export const PALETTE_HUES = [
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

/**
 * Every colour a level must define. Adding a field here is a compile error in
 * all four levels until each one answers it — the property that a bare string
 * union cannot provide.
 */
export interface LevelDefinition {
  /** Human-facing name, used in the Storybook toolbar and the sandbox. */
  readonly label: string;
  /** One line on what the level is for. Rendered in the sandbox. */
  readonly description: string;
  readonly polarity: Polarity;
  readonly surface: Readonly<Record<Surface, string>>;
  readonly text: Readonly<Record<TextTone, string>>;
  readonly border: Readonly<Record<BorderTone, string>>;
  readonly accent: Readonly<Record<Emphasis, string>>;
  readonly intent: Readonly<Record<Intent, string>>;
  /**
   * The Hue vocabulary — appearance, not job. Declared *below* the Roles above
   * and referenced by them, never derived from them. Only a Target with no
   * notion of jobs addresses these: a terminal's sixteen ANSI slots, half a
   * JetBrains scheme, a generated diagram needing N distinguishable colours.
   *
   * Every entry clears 5.5:1 against the tightest of this level's three
   * grounds — above WCAG AA, so an editor still has room to tint the ground
   * behind it. `bright` fills the upper eight ANSI slots at a 4.5:1 floor,
   * since those carry emphasis rather than body text.
   */
  readonly palette: Readonly<Record<Hue, string>>;
  /** The `bright` half of each Hue. ANSI's upper eight, and nothing else yet. */
  readonly paletteBright: Readonly<Record<Hue, string>>;
  /**
   * Which Hue each Role is. **The declared lookup ADR 0001 requires.**
   *
   * The ADR rejects deriving this by inspecting hex — ambiguous when two Roles
   * share a value, lossy when no Hue sits on a Role's. So it is declared, and
   * `check:contrast` asserts the Role's value actually equals the Hue's. That
   * assertion is the point: without it the two vocabularies drift silently,
   * which is the failure the ADR's rejected "both, independently declared"
   * option was rejected for — and which this repo shipped for exactly one
   * commit, with two pinks on `midnight` 0.036 apart.
   */
  readonly accentHue: Readonly<Record<Emphasis, HueRef>>;
  /** As `accentHue`, for the meaning Roles. */
  readonly intentHue: Readonly<Record<Intent, HueRef>>;
  /** Colour of the hard offset shadows. Normally tracks `border.strong`. */
  readonly shadow: string;
}

/**
 * Surfaces do not move in the same direction on every level, and that is the
 * point of declaring them.
 *
 * On the dark levels a raised card sits *above* the page and so lightens. On
 * `bright` — a warm desk with paper on it — a raised card is a fresh white
 * sheet, so it also lightens, but past the ground rather than away from black.
 * On `white` there is nowhere lighter to go, so elevation is carried by the
 * hard border and shadow while the panel itself takes a faint cool grey. A
 * single derived formula cannot express those three behaviours; four literal
 * ramps can.
 */
export const LEVELS: Readonly<Record<ThemeLevel, LevelDefinition>> = {
  midnight: {
    label: 'Midnight',
    description: 'Neon on blue-black. The maximal end of the ladder.',
    polarity: 'dark',
    surface: {
      base: '#0a0a1a',
      raised: '#14142a',
      sunken: '#050510',
      overlay: 'rgba(5, 5, 16, 0.82)',
    },
    text: {
      primary: '#ffffff',
      secondary: '#c3c3d4',
      muted: '#8b8ba3',
      inverse: '#0a0a1a',
    },
    border: {
      strong: '#ffffff',
      default: '#9d9db4',
      subtle: '#33334d',
    },
    accent: {
      primary: '#22d3ee',
      secondary: '#facc15',
      // Was #ec4899 — the brand pink, and 5.12:1, which cleared the 4.5 Role
      // floor while `palette.pink` sat at 5.90:1. Two pinks 0.036 apart in one
      // level, invisibly different and therefore worse than visibly. Now the
      // Hue's value, per `accentHue` below.
      tertiary: '#f955a4',
      quiet: '#8b8ba3',
    },
    intent: {
      info: '#22d3ee',
      success: '#39ff14',
      warning: '#facc15',
      danger: '#f955a4',
    },
    accentHue: {
      primary: 'cyan',
      secondary: 'yellow',
      tertiary: 'pink',
      quiet: 'neutral',
    },
    intentHue: {
      info: 'cyan',
      success: 'green',
      warning: 'yellow',
      danger: 'pink',
    },
    palette: {
      red: '#ff586e', // 16deg — lifted from #f43f5e (dim accent.tertiary), 4.59:1
      orange: '#ff8c00', // 58deg — kept — 410 commits
      yellow: '#facc15', // 92deg — kept — 533 commits, brand
      green: '#39ff14', // 142deg — kept — 533 commits, brand
      teal: '#34d399', // 163deg — kept — 364 commits
      cyan: '#22d3ee', // 212deg — kept — 534 commits, brand
      blue: '#38bdf8', // 233deg — kept — dim accent.primary, 233deg (a sky blue by heritage)
      violet: '#c3afff', // 295deg — new — 57 tried across six years, none canonical
      magenta: '#ff1cff', // 328deg — lifted from #ff00ff, 5.37:1
      pink: '#f955a4', // 354deg — lifted from #ec4899 (brand), 4.77:1 — deltaE 0.036
    },
    paletteBright: {
      red: '#ff939b',
      orange: '#ffba85',
      yellow: '#ffeaab',
      green: '#c0ffb8',
      teal: '#00f7ae',
      cyan: '#88ebff',
      blue: '#8cd7ff',
      violet: '#ddd4ff',
      magenta: '#ff88fd',
      pink: '#ff8ebe',
    },
    shadow: '#ffffff',
  },

  sketch: {
    label: 'Sketch',
    description: 'Warm paper and pen ink. The light half of the pair.',
    polarity: 'light',
    surface: {
      base: '#f5f3ec', // sketch paper
      raised: '#ffffff', // FIXED_COLOURS.white — a fresh sheet on the desk
      sunken: '#efeadf', // the binding ground: every value below is solved against this
      overlay: 'rgba(35, 38, 46, 0.72)',
    },
    text: {
      primary: '#23262e', // sketch ink
      secondary: '#33373f',
      muted: '#6a6252',
      inverse: '#f5f3ec',
    },
    border: {
      strong: '#23262e',
      default: '#8f8672',
      subtle: '#c8c3b4', // darker than sketch's #d8d3c4, which was 1.25:1 on a pure-white `raised`
    },
    accent: {
      primary: '#1450d7', // palette.blue
      secondary: '#006b2e', // palette.green
      tertiary: '#bd0010', // palette.red
      quiet: '#6a6252',
    },
    intent: {
      info: '#1450d7',
      success: '#006b2e',
      warning: '#974503',
      danger: '#bd0010',
    },
    accentHue: {
      primary: 'blue',
      secondary: 'green',
      tertiary: 'red',
      quiet: 'neutral',
    },
    intentHue: {
      info: 'blue',
      success: 'green',
      warning: 'orange',
      danger: 'red',
    },
    palette: {
      red: '#bd0010', // 16deg — was #dc2626, 4.03:1 — failed WCAG AA
      orange: '#974503', // 58deg — was #9a4708, 5.34:1
      yellow: '#705a00', // 92deg — new — no light yellow was ever authored
      green: '#006b2e', // 142deg — was #15803d, 4.18:1 — failed
      teal: '#006859', // 163deg — new
      cyan: '#006675', // 212deg — new
      blue: '#1450d7', // 233deg — was #2563eb, 4.31:1 — failed
      violet: '#7d00f4', // 295deg — new
      magenta: '#a300ad', // 328deg — new
      pink: '#b4006c', // 354deg — new
    },
    paletteBright: {
      red: '#8f002a',
      orange: '#6c3700',
      yellow: '#534200',
      green: '#024f00',
      teal: '#004d34',
      cyan: '#004b56',
      blue: '#004e6d',
      violet: '#6000bd',
      magenta: '#7f0080',
      pink: '#8a0052',
    },
    shadow: '#23262e',
  },
};

/** The level applied when nothing else has been chosen or persisted. */
export const DEFAULT_LEVEL: ThemeLevel = 'midnight';

/**
 * Which level each OS colour-scheme preference maps to. `prefers-color-scheme`
 * is binary, so the ladder has to nominate a representative at each end; making
 * that an explicit constant means it can be changed in one place rather than
 * being an accident of ordering.
 */
export const SYSTEM_LEVEL: Readonly<Record<Polarity, ThemeLevel>> = {
  dark: 'midnight',
  light: 'sketch',
};

/** Type guard for values arriving from `localStorage`, URLs, or props. */
export function isThemeLevel(value: unknown): value is ThemeLevel {
  return typeof value === 'string' && (THEME_LEVELS as readonly string[]).includes(value);
}

/** The next level on the ladder, wrapping from the lightest back to the darkest. */
export function nextLevel(level: ThemeLevel): ThemeLevel {
  const index = THEME_LEVELS.indexOf(level);
  return THEME_LEVELS[(index + 1) % THEME_LEVELS.length]!;
}

/**
 * Exhaustiveness guard for `switch` statements over a level.
 *
 * Prefer a `Record<ThemeLevel, T>` where the branches are values — it is
 * checked without any call site remembering to add a default. Where control
 * flow genuinely has to branch, end the switch with `assertNever(level)` so
 * adding a fifth level fails the build instead of falling through.
 */
export function assertNever(value: never, message = 'Unhandled theme level'): never {
  throw new Error(`${message}: ${String(value)}`);
}
