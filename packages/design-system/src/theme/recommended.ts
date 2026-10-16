/**
 * Recommended colours and semantic tokens for consumers of @rtkelly-labs/design-system.
 *
 * ## Why this exists
 *
 * Rule 3 (AGENTS.md) requires that colours are addressed by role, never by hue:
 * `bg-surface-raised` or `text-intent-danger`, not `cyan`.
 *
 * Consumers (such as the blog, talk presentation platforms, canvas/SVG renderers,
 * and AI agent linters) need to depend on these roles as structured, typed data:
 *
 * 1. Runtime hex/rgba values per level for graphics, canvas, and charts (`RECOMMENDED_COLOURS`)
 * 2. CSS custom property expressions for inline styles and styled components (`RECOMMENDED_COLOUR_VARS`)
 * 3. The canonical Tailwind utility classnames for linters and validation (`RECOMMENDED_COLOUR_CLASSES`)
 */

import type { BorderTone, Emphasis, Intent, Surface, TextTone } from '../lib/theme';
import { DEFAULT_LEVEL, LEVELS, type ThemeLevel } from './levels';

/**
 * The five semantic namespaces that make up the recommended colour surface.
 */
export const RECOMMENDED_COLOUR_NAMESPACES = [
  'surface',
  'content',
  'edge',
  'accent',
  'intent',
] as const;

export type RecommendedColourNamespace = (typeof RECOMMENDED_COLOUR_NAMESPACES)[number];

/**
 * The roles defined in each recommended namespace.
 */
export const RECOMMENDED_COLOUR_ROLES = {
  surface: ['base', 'raised', 'sunken', 'overlay'],
  content: ['primary', 'secondary', 'muted', 'inverse'],
  edge: ['strong', 'default', 'subtle'],
  accent: ['primary', 'secondary', 'tertiary', 'quiet'],
  intent: ['info', 'success', 'warning', 'danger'],
} as const;

/**
 * Resolved colour literals (hex/rgba) for each recommended role on a single theme level.
 */
export interface RecommendedThemeColours {
  readonly surface: Readonly<Record<Surface, string>>;
  readonly content: Readonly<Record<TextTone, string>>;
  readonly edge: Readonly<Record<BorderTone, string>>;
  readonly accent: Readonly<Record<Emphasis, string>>;
  readonly intent: Readonly<Record<Intent, string>>;
}

/**
 * The recommended colour values for each level of the theme ladder.
 *
 * Use this in non-CSS environments (canvas, SVG generation, email templates, charts)
 * where CSS custom properties cannot resolve.
 */
export const RECOMMENDED_COLOURS: Readonly<Record<ThemeLevel, RecommendedThemeColours>> = {
  midnight: {
    surface: LEVELS.midnight.surface,
    content: LEVELS.midnight.text,
    edge: LEVELS.midnight.border,
    accent: LEVELS.midnight.accent,
    intent: LEVELS.midnight.intent,
  },
  sketch: {
    surface: LEVELS.sketch.surface,
    content: LEVELS.sketch.text,
    edge: LEVELS.sketch.border,
    accent: LEVELS.sketch.accent,
    intent: LEVELS.sketch.intent,
  },
};

/**
 * Return the recommended colours for a given theme level, defaulting to the
 * ladder's own default — read from `levels.ts`, never restated here, so the
 * two cannot drift.
 */
export function getRecommendedColours(level: ThemeLevel = DEFAULT_LEVEL): RecommendedThemeColours {
  return RECOMMENDED_COLOURS[level] ?? RECOMMENDED_COLOURS[DEFAULT_LEVEL];
}

/**
 * CSS custom property expressions for every recommended role, aligned with the
 * public Tailwind utility namespaces (`surface`, `content`, `edge`, `accent`, `intent`).
 */
export const RECOMMENDED_COLOUR_VARS = {
  surface: {
    base: 'var(--ds-surface-base)',
    raised: 'var(--ds-surface-raised)',
    sunken: 'var(--ds-surface-sunken)',
    overlay: 'var(--ds-surface-overlay)',
  },
  content: {
    primary: 'var(--ds-text-primary)',
    secondary: 'var(--ds-text-secondary)',
    muted: 'var(--ds-text-muted)',
    inverse: 'var(--ds-text-inverse)',
  },
  edge: {
    strong: 'var(--ds-border-strong)',
    default: 'var(--ds-border-default)',
    subtle: 'var(--ds-border-subtle)',
  },
  accent: {
    primary: 'var(--ds-accent-primary)',
    secondary: 'var(--ds-accent-secondary)',
    tertiary: 'var(--ds-accent-tertiary)',
    quiet: 'var(--ds-accent-quiet)',
  },
  intent: {
    info: 'var(--ds-intent-info)',
    success: 'var(--ds-intent-success)',
    warning: 'var(--ds-intent-warning)',
    danger: 'var(--ds-intent-danger)',
  },
} as const;

/**
 * The colour-bearing utility families, taken from the same list
 * `scripts/token-rules.mjs` treats as colours. A hand-picked subset would be
 * the thing the next new component trips over: `border-intent-danger`,
 * `ring-accent-primary` and `divide-edge-strong` are already in the package.
 */
export const RECOMMENDED_COLOUR_PROPERTIES = [
  'bg',
  'text',
  'border',
  'ring',
  'divide',
  'placeholder',
  'from',
  'via',
  'to',
] as const;

export type RecommendedColourProperty = (typeof RECOMMENDED_COLOUR_PROPERTIES)[number];

/**
 * Canonical Tailwind utility classes for recommended colours: every supported
 * colour property × namespace × role. Derived from {@link RECOMMENDED_COLOUR_ROLES}
 * rather than enumerated, so a new role appears here the moment it appears
 * there — the hand-maintained list this replaced was already missing the
 * `ring`, `divide` and colour-edged `border` utilities the package itself uses.
 */
export type RecommendedColourClass = {
  [N in RecommendedColourNamespace]: `${RecommendedColourProperty}-${N}-${(typeof RECOMMENDED_COLOUR_ROLES)[N][number]}`;
}[RecommendedColourNamespace];

export const RECOMMENDED_COLOUR_CLASSES: readonly RecommendedColourClass[] = Object.freeze(
  RECOMMENDED_COLOUR_PROPERTIES.flatMap((property) =>
    RECOMMENDED_COLOUR_NAMESPACES.flatMap((namespace) =>
      RECOMMENDED_COLOUR_ROLES[namespace].map(
        (role) => `${property}-${namespace}-${role}` as RecommendedColourClass,
      ),
    ),
  ),
);

const CLASS_SET: ReadonlySet<string> = new Set<string>(RECOMMENDED_COLOUR_CLASSES);

/**
 * Test whether a Tailwind class addresses a recommended role utility.
 * Non-colour variants (`hover:`, `md:`) are stripped; polarity variants
 * (`dark:`, `light:`) are rejected outright — role tokens already switch per
 * level, and `dark:` now means "midnight or dim", not "not sketch", so a
 * polarity-prefixed colour utility is the bug this validator exists to catch.
 */
export function isRecommendedColourClass(className: string): boolean {
  if (!className) return false;
  const segments = className.split(':');
  const base = segments.pop() ?? '';
  if (segments.includes('dark') || segments.includes('light')) return false;
  return CLASS_SET.has(base);
}
