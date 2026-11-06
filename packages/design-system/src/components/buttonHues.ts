import { LEVELS, THEME_LEVELS } from '../theme/levels';
import type { ThemeLevel } from '../theme/levels';
import type { Emphasis, HueRef, Intent } from '../lib/theme';

/**
 * The colour a Button speaks in, as a Role rather than a hue.
 *
 * `neutral` is a Button whose colour is ink and edge — `quiet` (its accent
 * border appears on hover only), `secondary` and `inverse`. It resolves to no
 * hue on any Level, so it can never collide with anything.
 */
export type ButtonColourRole =
  | { readonly kind: 'accent'; readonly role: Emphasis }
  | { readonly kind: 'intent'; readonly role: Intent }
  | { readonly kind: 'neutral' };

/** One Level on which a danger Button and another Button resolve to the same hue. */
export interface HueCollision {
  readonly level: ThemeLevel;
  /** The hue both resolve to on `level`. */
  readonly hue: HueRef;
  /** Indices into the input array of the danger Buttons involved. */
  readonly danger: readonly number[];
  /** Indices of the non-danger Buttons sharing that hue. */
  readonly others: readonly number[];
}

/**
 * The hue a Role resolves to on a Level, read from the declared
 * `accentHue` / `intentHue` maps in `src/theme/levels.ts` — never inferred from
 * a hex value (ADR 0001). Neutral Buttons are `'neutral'`.
 */
export function hueOfRole(level: ThemeLevel, role: ButtonColourRole): HueRef {
  const def = LEVELS[level];
  if (role.kind === 'accent') return def.accentHue[role.role];
  if (role.kind === 'intent') return def.intentHue[role.role];
  return 'neutral';
}

function isDanger(role: ButtonColourRole): boolean {
  return role.kind === 'intent' && role.role === 'danger';
}

/**
 * D3's rule, as a function: a danger Button never sits beside a Button of the
 * same hue.
 *
 * Takes the resolved Roles of the Buttons in one group and returns every
 * collision on every Level — not the active one, because a palette that
 * collides on one Level is a layout that is wrong the day somebody switches.
 * Two danger Buttons together are not a collision, and a neutral Button never
 * is: the rule is about colour being the only thing that tells a destructive
 * action from its neighbour (WCAG 1.4.1), and `neutral` carries none.
 *
 * Pure, so a test can run it over a story's args without rendering.
 */
export function findHueCollisions(
  roles: readonly ButtonColourRole[],
  levels: readonly ThemeLevel[] = THEME_LEVELS,
): HueCollision[] {
  const out: HueCollision[] = [];
  for (const level of levels) {
    const dangerHue = hueOfRole(level, { kind: 'intent', role: 'danger' });
    const danger: number[] = [];
    const others: number[] = [];
    roles.forEach((role, index) => {
      if (isDanger(role)) {
        danger.push(index);
      } else if (hueOfRole(level, role) === dangerHue && dangerHue !== 'neutral') {
        others.push(index);
      }
    });
    if (danger.length > 0 && others.length > 0) {
      out.push({ level, hue: dangerHue, danger, others });
    }
  }
  return out;
}

/**
 * The Role a Button variant paints with at rest. Kept beside the rule rather
 * than in `Button.tsx` so the two cannot drift: adding a variant means saying
 * here what colour it is, and a variant missing from this table does not
 * typecheck.
 *
 * `quiet` is neutral because its accent border is hover-only; `secondary` is
 * an `edge-strong` outline with ink text since D2.
 */
export const BUTTON_COLOUR_ROLE = {
  primary: { kind: 'accent', role: 'primary' },
  default: { kind: 'accent', role: 'primary' },
  tertiary: { kind: 'accent', role: 'tertiary' },
  danger: { kind: 'intent', role: 'danger' },
  secondary: { kind: 'neutral' },
  quiet: { kind: 'neutral' },
  inverse: { kind: 'neutral' },
} as const satisfies Record<string, ButtonColourRole>;
