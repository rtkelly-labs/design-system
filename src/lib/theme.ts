/**
 * Semantic theming layer.
 *
 * Components should describe *what a thing is* — a primary accent, a danger
 * state, a raised surface — never which colour it happens to be. The brutalist
 * palette (cyan/pink/yellow/green) is one mapping of those roles; `.dim` and
 * `.sketch` are others, and a future mode is a third. Referencing
 * `var(--brutalist-cyan)` directly hard-codes today's mapping into every
 * component and makes retheming a find-and-replace across the package.
 *
 * The CSS variables below are declared in `theme.css` and resolve through the
 * raw palette, so they follow every mode swap automatically.
 */

/**
 * Visual weight within a hierarchy. Use for decorative and navigational
 * emphasis — which of several things should draw the eye first — not for
 * meaning. `quiet` is the de-emphasised step, not a fifth colour.
 */
export type Emphasis = 'primary' | 'secondary' | 'tertiary' | 'quiet';

/**
 * Communicated meaning. Use when the colour carries information the reader
 * must act on; these survive retheming because their semantics are fixed even
 * when their hues are not.
 */
export type Intent = 'info' | 'success' | 'warning' | 'danger';

/**
 * Background elevation. `base` is the page, `raised` sits above it (cards,
 * header, drawers), `sunken` is inset (code wells), `overlay` is modal.
 */
export type Surface = 'base' | 'raised' | 'sunken' | 'overlay';

/** Text prominence, coarsest to faintest. */
export type TextTone = 'primary' | 'secondary' | 'muted' | 'inverse';

/** Rule weight. `strong` is the full-contrast brutalist border. */
export type BorderTone = 'strong' | 'default' | 'subtle';

/**
 * Palette names accepted by components predating the semantic layer.
 *
 * @deprecated Pass an {@link Emphasis} or {@link Intent} instead. These remain
 * accepted so existing consumers keep compiling, and they resolve to the same
 * values, but they defeat the point of the abstraction.
 */
/**
 * A colour's *appearance*, independent of any job — the vocabulary a Target
 * addresses when it has no notion of jobs. A terminal has sixteen positions
 * named by colour and no concept of a keyword.
 *
 * Declared below the Role vocabulary and referenced by it, never the reverse:
 * Hue -> Role is a declared lookup, Role -> Hue is a guess. See
 * `docs/adr/0001-hues-declared-below-roles.md`.
 *
 * **A Hue in component code is a defect.** Components address Roles only.
 * Ten is the ceiling rather than a comfortable middle — the tightest pair
 * already sits at deltaE 0.049. See `docs/palette-provenance.md`.
 */
export type Hue =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'cyan'
  | 'blue'
  | 'violet'
  | 'magenta'
  | 'pink';

/**
 * The eight ANSI base slots a terminal needs, beyond which `bright` variants
 * fill the upper eight. `black` and `white` come from `FIXED_COLOURS`.
 */
export type AnsiHue = Extract<Hue, 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan'>;

/**
 * What a Role points at in the Hue vocabulary.
 *
 * `'neutral'` is not a cop-out: some Roles genuinely are not hues.
 * `accent.quiet` is a warm or cool grey by design, and the palette has no
 * neutral ramp to point it at. Saying so explicitly keeps the map exhaustive —
 * a new Emphasis is still a compile error — while letting the gate distinguish
 * "declared as not-a-hue" from "forgot to wire it up", which a `Partial` could
 * not.
 */
export type HueRef = Hue | 'neutral';


/** Anything a component's `accent`-style prop will take. */
export type AccentToken = Emphasis | Intent;

const EMPHASIS_VARS: Record<Emphasis, string> = {
  primary: 'var(--ds-accent-primary)',
  secondary: 'var(--ds-accent-secondary)',
  tertiary: 'var(--ds-accent-tertiary)',
  quiet: 'var(--ds-accent-quiet)',
};

const INTENT_VARS: Record<Intent, string> = {
  info: 'var(--ds-intent-info)',
  success: 'var(--ds-intent-success)',
  warning: 'var(--ds-intent-warning)',
  danger: 'var(--ds-intent-danger)',
};

const SURFACE_VARS: Record<Surface, string> = {
  base: 'var(--ds-surface-base)',
  raised: 'var(--ds-surface-raised)',
  sunken: 'var(--ds-surface-sunken)',
  overlay: 'var(--ds-surface-overlay)',
};

const TEXT_VARS: Record<TextTone, string> = {
  primary: 'var(--ds-text-primary)',
  secondary: 'var(--ds-text-secondary)',
  muted: 'var(--ds-text-muted)',
  inverse: 'var(--ds-text-inverse)',
};

const BORDER_VARS: Record<BorderTone, string> = {
  strong: 'var(--ds-border-strong)',
  default: 'var(--ds-border-default)',
  subtle: 'var(--ds-border-subtle)',
};

/**
 * Resolve any accent token to the CSS variable expression that renders it.
 *
 * Unknown values fall back to the primary accent rather than throwing —
 * a mistyped prop should degrade to something legible, not blank out a
 * component's colour and leave `color: undefined` on the element.
 */
export function accentVar(token: AccentToken | undefined, fallback: AccentToken = 'primary'): string {
  const resolved = token ?? fallback;
  return (
    EMPHASIS_VARS[resolved as Emphasis] ??
    INTENT_VARS[resolved as Intent] ??
    EMPHASIS_VARS.primary
  );
}

export function surfaceVar(token: Surface = 'base'): string {
  return SURFACE_VARS[token] ?? SURFACE_VARS.base;
}

export function textVar(token: TextTone = 'primary'): string {
  return TEXT_VARS[token] ?? TEXT_VARS.primary;
}

export function borderVar(token: BorderTone = 'strong'): string {
  return BORDER_VARS[token] ?? BORDER_VARS.strong;
}

/** Semantic font roles. */
export const fontVar = {
  display: 'var(--ds-font-display)',
  body: 'var(--ds-font-body)',
  mono: 'var(--ds-font-mono)',
  pixel: 'var(--ds-font-pixel)',
} as const;

/**
 * Default emphasis per heading level, so a document's colour hierarchy follows
 * its structural hierarchy without every call site restating it.
 */
export const HEADING_EMPHASIS: Record<1 | 2 | 3 | 4 | 5 | 6, Emphasis> = {
  1: 'primary',
  2: 'primary',
  3: 'secondary',
  4: 'tertiary',
  5: 'quiet',
  6: 'quiet',
};

/**
 * The full semantic token surface, as CSS variable expressions. Useful for
 * inline styles and for consumers building their own components on the system.
 */
export const semanticTokens = {
  accent: EMPHASIS_VARS,
  intent: INTENT_VARS,
  surface: SURFACE_VARS,
  text: TEXT_VARS,
  border: BORDER_VARS,
  font: fontVar,
  shadowColor: 'var(--ds-shadow-color)',
} as const;
