/**
 * The pre-paint accessibility-preference script, and the names and resolution
 * rules it shares with `A11yPreferencesProvider` (D9, ADR 0007).
 *
 * A module of its own for the reason `themeInitScript.ts` is: the provider is a
 * client module, and a root layout that is a server component cannot call a
 * value it exports. Everything here is server-safe and has no React in it.
 *
 * The resolution is written once, as {@link resolveA11yAttributes}, and the
 * script is generated from the same table. `a11yPreferences.test.tsx` runs the
 * generated script and the function against each other, so the two cannot
 * drift while only one of them is the one that paints.
 */

/** The four axes of the Preference axis, in the order the menu lists them. */
export const A11Y_AXES = ['motion', 'contrast', 'cvd', 'links'] as const;

export type A11yAxis = (typeof A11Y_AXES)[number];

/**
 * What a user chose for one axis. `system` follows the operating system where it
 * has a signal (motion, contrast) and is the same as `off` where it has none
 * (colour vision, links).
 */
export type A11yChoice = 'system' | 'on' | 'off';

/** One choice per axis. */
export type A11yState = Readonly<Record<A11yAxis, A11yChoice>>;

/** Nothing chosen: every axis follows the system. */
export const A11Y_DEFAULT: A11yState = {
  motion: 'system',
  contrast: 'system',
  cvd: 'system',
  links: 'system',
};

/** Where the choices are persisted, as one JSON object. Shared with {@link getA11yInitScript}. */
export const A11Y_STORAGE_KEY = 'ds-a11y';

/**
 * The attribute each axis sets on `documentElement`, and the value it takes when
 * the axis is on or off. `null` means the attribute is absent, which is the
 * default and what the CSS expects: no rule matches an axis that is not active.
 *
 * Only `motion` has an `off` value, because only `motion` has a default that
 * lives in CSS. The OS asks for reduced motion in a media query, so absence
 * cannot defeat it; `full` is the explicit opt-out that the stylesheet honours.
 */
export const A11Y_ATTRIBUTES: Readonly<
  Record<A11yAxis, { attribute: string; on: string; off: string | null }>
> = {
  motion: { attribute: 'data-a11y-motion', on: 'reduce', off: 'full' },
  contrast: { attribute: 'data-a11y-contrast', on: 'more', off: null },
  cvd: { attribute: 'data-a11y-cvd', on: 'patterns', off: null },
  links: { attribute: 'data-a11y-links', on: 'underline', off: null },
};

/** The operating-system signals the script reads. Only contrast has one that sets an attribute. */
export interface A11ySystemSignals {
  /** `prefers-contrast: more` */
  readonly contrastMore: boolean;
}

/** The media query behind {@link A11ySystemSignals.contrastMore}. */
export const CONTRAST_MORE_QUERY = '(prefers-contrast: more)';

export function isA11yChoice(value: unknown): value is A11yChoice {
  return value === 'system' || value === 'on' || value === 'off';
}

/**
 * A stored value, defensively. Anything that is not a JSON object of known
 * choices reads as `system` for the axes it does not name, so a corrupt or
 * foreign value costs a preference and never a render.
 */
export function parseA11yState(raw: string | null | undefined): A11yState {
  if (!raw) return A11Y_DEFAULT;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return A11Y_DEFAULT;
    const record = parsed as Record<string, unknown>;
    const pick = (axis: A11yAxis): A11yChoice => {
      const value = record[axis];
      return isA11yChoice(value) ? value : 'system';
    };
    return { motion: pick('motion'), contrast: pick('contrast'), cvd: pick('cvd'), links: pick('links') };
  } catch {
    return A11Y_DEFAULT;
  }
}

/** The JSON to persist: only the axes that are not `system`, so the default stores nothing. */
export function serialiseA11yState(state: A11yState): string | null {
  const chosen = A11Y_AXES.filter((axis) => state[axis] !== 'system');
  if (chosen.length === 0) return null;
  return JSON.stringify(Object.fromEntries(chosen.map((axis) => [axis, state[axis]])));
}

/**
 * The attribute value for every axis: the stored choice, else the OS signal,
 * else absent (`null`).
 */
export function resolveA11yAttributes(
  state: A11yState,
  system: A11ySystemSignals,
): Readonly<Record<A11yAxis, string | null>> {
  const resolve = (axis: A11yAxis): string | null => {
    const choice = state[axis];
    const { on, off } = A11Y_ATTRIBUTES[axis];
    if (choice === 'on') return on;
    if (choice === 'off') return off;
    // `system`. Only contrast carries an OS signal into an attribute; motion's
    // lives in the stylesheet's media query, where absence is the right answer.
    return axis === 'contrast' && system.contrastMore ? on : null;
  };
  return {
    motion: resolve('motion'),
    contrast: resolve('contrast'),
    cvd: resolve('cvd'),
    links: resolve('links'),
  };
}

/**
 * The script to run before first paint, so a stored choice or an OS signal is
 * already an attribute when the page is first drawn and nothing flashes.
 *
 * Drop the returned string into an inline `<script>` in the document head, next
 * to {@link getThemeInitScript}'s:
 *
 * ```tsx
 * <script dangerouslySetInnerHTML={{ __html: getA11yInitScript() }} />
 * ```
 *
 * It reads one `localStorage` key, `ds-a11y`, inside a `try`, and sets an
 * attribute only when the axis is active: a stored choice first, then the
 * `prefers-contrast` media query, then nothing.
 */
export function getA11yInitScript(options: { followSystem?: boolean } = {}): string {
  const { followSystem = true } = options;
  const table = JSON.stringify(A11Y_ATTRIBUTES);
  const key = JSON.stringify(A11Y_STORAGE_KEY);
  const query = JSON.stringify(CONTRAST_MORE_QUERY);
  const osContrast = followSystem
    ? `else if(a==="contrast"&&window.matchMedia&&window.matchMedia(${query}).matches)v=t[a].on;`
    : '';
  return `(function(){try{var t=${table},s={};try{s=JSON.parse(localStorage.getItem(${key})||"{}")||{}}catch(e){}for(var a in t){var c=s[a],v=null;if(c==="on")v=t[a].on;else if(c==="off")v=t[a].off;${osContrast}if(v)document.documentElement.setAttribute(t[a].attribute,v)}}catch(e){}})();`;
}
