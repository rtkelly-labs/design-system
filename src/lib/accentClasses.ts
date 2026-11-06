/**
 * Accent tokens as Tailwind utility classes.
 *
 * `accentVar()` in `./theme` covers inline styles. Components built from
 * utility classes need the same mapping as literal class strings, because
 * Tailwind's scanner reads source text — a template literal like
 * `text-${role}` produces no CSS at all. Every class below is therefore
 * spelled out, and the 12 accepted tokens collapse onto 8 canonical roles
 * first so each map stays one entry per role rather than one per alias.
 */

import type { AccentToken } from './theme';

/** The role an accent token names, as it appears in Tailwind class names. */
export type CanonicalAccent =
  | 'accent-primary'
  | 'accent-secondary'
  | 'accent-tertiary'
  | 'accent-quiet'
  | 'intent-info'
  | 'intent-success'
  | 'intent-warning'
  | 'intent-danger';

/** Every accepted token mapped to its role. */
const CANONICAL: Record<AccentToken, CanonicalAccent> = {
  primary: 'accent-primary',
  secondary: 'accent-secondary',
  tertiary: 'accent-tertiary',
  quiet: 'accent-quiet',
  info: 'intent-info',
  success: 'intent-success',
  warning: 'intent-warning',
  danger: 'intent-danger',
};

/**
 * Resolve any accent token to its role. Mirrors `accentVar()`: an unrecognised
 * token degrades to the primary accent rather than throwing, so a mistyped prop
 * renders something legible instead of dropping the class entirely.
 */
export function canonicalAccent(
  token: AccentToken | undefined,
  fallback: AccentToken = 'primary',
): CanonicalAccent {
  return CANONICAL[token ?? fallback] ?? CANONICAL.primary;
}

const TEXT: Record<CanonicalAccent, string> = {
  'accent-primary': 'text-accent-primary',
  'accent-secondary': 'text-accent-secondary',
  'accent-tertiary': 'text-accent-tertiary',
  'accent-quiet': 'text-accent-quiet',
  'intent-info': 'text-intent-info',
  'intent-success': 'text-intent-success',
  'intent-warning': 'text-intent-warning',
  'intent-danger': 'text-intent-danger',
};

const FOCUS_RING: Record<CanonicalAccent, string> = {
  'accent-primary': 'focus:border-accent-primary focus:ring-accent-primary',
  'accent-secondary': 'focus:border-accent-secondary focus:ring-accent-secondary',
  'accent-tertiary': 'focus:border-accent-tertiary focus:ring-accent-tertiary',
  'accent-quiet': 'focus:border-accent-quiet focus:ring-accent-quiet',
  'intent-info': 'focus:border-intent-info focus:ring-intent-info',
  'intent-success': 'focus:border-intent-success focus:ring-intent-success',
  'intent-warning': 'focus:border-intent-warning focus:ring-intent-warning',
  'intent-danger': 'focus:border-intent-danger focus:ring-intent-danger',
};

/**
 * A filled chip: the role as a background, with `text.inverse` on it.
 *
 * `text.inverse` is why this is a map and not a template — `check:contrast`
 * measures `text.inverse` against every accent and intent precisely because
 * this pairing exists, so the two must not be able to disagree.
 */
const FILL: Record<CanonicalAccent, string> = {
  'accent-primary': 'bg-accent-primary text-content-inverse',
  'accent-secondary': 'bg-accent-secondary text-content-inverse',
  'accent-tertiary': 'bg-accent-tertiary text-content-inverse',
  'accent-quiet': 'bg-accent-quiet text-content-inverse',
  'intent-info': 'bg-intent-info text-content-inverse',
  'intent-success': 'bg-intent-success text-content-inverse',
  'intent-warning': 'bg-intent-warning text-content-inverse',
  'intent-danger': 'bg-intent-danger text-content-inverse',
};

/**
 * The hover fill, which deliberately names a *different* role from the one it
 * hovers off — `Tag` rotates through the emphasis accents so a row of chips
 * animates rather than merely dimming.
 *
 * Kept separate from {@link FILL} for that reason: every other map here emits
 * one role per token and is tested for it, and folding the rotation in would
 * have to relax that test for all of them. This is the one map where naming a
 * second role is the point rather than a bug.
 *
 * The rotation itself is a visual choice with no deeper rationale, which is
 * worth stating — it came from `Tag`, was the only table in the repo that had
 * it, and is now written once instead of being re-derived.
 */
const FILL_HOVER: Record<CanonicalAccent, string> = {
  'accent-primary': 'hover:bg-accent-secondary',
  'accent-secondary': 'hover:bg-accent-tertiary',
  'accent-tertiary': 'hover:bg-accent-primary',
  'accent-quiet': 'hover:bg-accent-primary',
  'intent-info': 'hover:bg-accent-secondary',
  'intent-success': 'hover:bg-accent-secondary',
  'intent-warning': 'hover:bg-accent-tertiary',
  'intent-danger': 'hover:bg-accent-primary',
};

const HOVER_EDGE: Record<CanonicalAccent, string> = {
  'accent-primary': 'hover:border-accent-primary hover:shadow-hard-accent-primary',
  'accent-secondary': 'hover:border-accent-secondary hover:shadow-hard-accent-secondary',
  'accent-tertiary': 'hover:border-accent-tertiary hover:shadow-hard-accent-tertiary',
  'accent-quiet': 'hover:border-accent-quiet hover:shadow-hard-accent-quiet',
  'intent-info': 'hover:border-intent-info hover:shadow-hard-intent-info',
  'intent-success': 'hover:border-intent-success hover:shadow-hard-intent-success',
  'intent-warning': 'hover:border-intent-warning hover:shadow-hard-intent-warning',
  'intent-danger': 'hover:border-intent-danger hover:shadow-hard-intent-danger',
};

/** Foreground colour for an accent token. */
export function accentTextClass(token: AccentToken | undefined, fallback?: AccentToken): string {
  return TEXT[canonicalAccent(token, fallback)];
}

/** Focus border + ring for form controls. */
export function accentFocusClass(token: AccentToken | undefined, fallback?: AccentToken): string {
  return FOCUS_RING[canonicalAccent(token, fallback)];
}

/** Hover border + hard offset shadow, for cards that lift on hover. */
export function accentHoverEdgeClass(
  token: AccentToken | undefined,
  fallback?: AccentToken,
): string {
  return HOVER_EDGE[canonicalAccent(token, fallback)];
}

/** Exposed for tests, which assert every role is spelled out in every map. */
/** Filled chip, with the hover rotation. */
export function accentFillClass(token: AccentToken | undefined, fallback?: AccentToken): string {
  const role = canonicalAccent(token, fallback);
  return `${FILL[role]} ${FILL_HOVER[role]}`;
}

export const ACCENT_CLASS_MAPS = { TEXT, FOCUS_RING, HOVER_EDGE, FILL, FILL_HOVER } as const;
