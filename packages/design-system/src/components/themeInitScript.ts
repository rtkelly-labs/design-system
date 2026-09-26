/**
 * The pre-paint theme script and the two names it shares with `ThemeProvider`.
 *
 * A module of its own rather than a part of `ThemeProvider.tsx` because that
 * file is a client module (`'use client'`), and a server component importing a
 * value from a client module receives a client reference it cannot call. The
 * canonical caller of `getThemeInitScript` is a root layout, which in the Next
 * App Router is a server component — so this has to stay server-safe.
 */
import { DEFAULT_LEVEL, SYSTEM_LEVEL, THEME_LEVELS } from '../theme/levels';
import type { ThemeLevel } from '../theme/levels';

/** Where the chosen level is persisted. Shared with {@link getThemeInitScript}. */
export const THEME_STORAGE_KEY = 'ds-theme-level';

/** The attribute the CSS keys off. Shared with {@link getThemeInitScript}. */
export const THEME_ATTRIBUTE = 'data-theme';

/**
 * The script to run before first paint, so the page never flashes the default
 * level and then corrects itself.
 *
 * Drop the returned string into an inline `<script>` in the document head,
 * ahead of the stylesheet. React cannot do this job: anything it renders runs
 * after hydration, which is already too late — and reading `localStorage` in a
 * `useState` initialiser (what this component used to do) makes the server and
 * client render different markup, which is a hydration mismatch.
 *
 * ```tsx
 * <script dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
 * ```
 */
export function getThemeInitScript(
  options: { defaultLevel?: ThemeLevel; followSystem?: boolean } = {},
): string {
  const { defaultLevel = DEFAULT_LEVEL, followSystem = true } = options;
  // Serialised rather than interpolated loosely, so the level list and the
  // system mapping in this script cannot drift from levels.ts.
  const levels = JSON.stringify(THEME_LEVELS);
  const system = JSON.stringify(SYSTEM_LEVEL);
  return `(function(){try{var l=${levels},s=${system},k=${JSON.stringify(THEME_STORAGE_KEY)};var v=null;try{v=localStorage.getItem(k)}catch(e){}if(l.indexOf(v)===-1){v=${
    followSystem
      ? `(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)?s.dark:s.light`
      : JSON.stringify(defaultLevel)
  }}document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},v)}catch(e){}})();`;
}
