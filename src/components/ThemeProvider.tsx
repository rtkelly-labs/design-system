import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LEVEL,
  isThemeLevel,
  LEVELS,
  nextLevel,
  SYSTEM_LEVEL,
  THEME_LEVELS,
} from '../theme/levels';
import type { Polarity, ThemeLevel } from '../theme/levels';

/** Where the chosen level is persisted. Shared with {@link getThemeInitScript}. */
export const THEME_STORAGE_KEY = 'ds-theme-level';

/** The attribute the CSS keys off. Shared with {@link getThemeInitScript}. */
export const THEME_ATTRIBUTE = 'data-theme';

export interface ThemeContextValue {
  level: ThemeLevel;
  /** `LEVELS[level].polarity`, lifted out because call sites ask for it constantly. */
  polarity: Polarity;
  setLevel: (level: ThemeLevel) => void;
  /** Step to the next level on the ladder, wrapping at the end. */
  cycleLevel: () => void;
  /** The ladder, in order — for building pickers without re-listing it. */
  levels: readonly ThemeLevel[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  /**
   * Level to use before anything persisted is read, and on the server. Must
   * match whatever {@link getThemeInitScript} was given, or the first paint
   * disagrees with the markup.
   */
  defaultLevel?: ThemeLevel;
  /**
   * Persist the choice to `localStorage`. Turn off for a preview surface — a
   * Storybook decorator, an embedded demo — that should not write to the host
   * page's storage.
   */
  persist?: boolean;
  /**
   * Fall back to the OS `prefers-color-scheme` when nothing is persisted. The
   * ladder has four rungs and the media query has two, so the mapping is the
   * explicit {@link SYSTEM_LEVEL} constant rather than an inference.
   */
  followSystem?: boolean;
  /**
   * Theme a subtree instead of the document.
   *
   * The token layer resolves by ordinary CSS inheritance, so a `bright` panel
   * inside a `midnight` page works at any depth — this is the React API for it.
   * A scoped provider never touches `documentElement` and never persists.
   */
  scoped?: boolean;
  /** Class applied to the wrapper element when `scoped`. */
  className?: string;
}

function readStoredLevel(): ThemeLevel | undefined {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeLevel(stored) ? stored : undefined;
  } catch {
    // Safari in private mode throws on localStorage access rather than
    // returning null. A theme preference is not worth breaking the render for.
    return undefined;
  }
}

function readSystemLevel(): ThemeLevel | undefined {
  if (typeof window.matchMedia !== 'function') return undefined;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? SYSTEM_LEVEL.dark
    : SYSTEM_LEVEL.light;
}

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

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultLevel = DEFAULT_LEVEL,
  persist = true,
  followSystem = true,
  scoped = false,
  className,
}) => {
  // Deliberately not seeded from storage. Server and first client render must
  // agree, so both start at `defaultLevel` and the effect below reconciles.
  const [level, setLevelState] = useState<ThemeLevel>(defaultLevel);

  useEffect(() => {
    if (scoped) return;
    const applied = document.documentElement.getAttribute(THEME_ATTRIBUTE);
    // The init script has usually already resolved this before paint; trust it
    // over re-deriving, so the two can never disagree.
    if (isThemeLevel(applied)) {
      setLevelState(applied);
      return;
    }
    const resolved =
      (persist ? readStoredLevel() : undefined) ??
      (followSystem ? readSystemLevel() : undefined) ??
      defaultLevel;
    setLevelState(resolved);
  }, [scoped, persist, followSystem, defaultLevel]);

  useEffect(() => {
    if (scoped) return;
    document.documentElement.setAttribute(THEME_ATTRIBUTE, level);
    // The class mirrors the attribute for consumers whose own CSS still selects
    // on it. Removing every level first keeps switching idempotent.
    document.documentElement.classList.remove(...THEME_LEVELS);
    document.documentElement.classList.add(level);
    if (!persist) return;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, level);
    } catch {
      // See readStoredLevel.
    }
  }, [level, persist, scoped]);

  const setLevel = useCallback((next: ThemeLevel) => setLevelState(next), []);
  const cycleLevel = useCallback(() => setLevelState((current) => nextLevel(current)), []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      level,
      polarity: LEVELS[level].polarity,
      setLevel,
      cycleLevel,
      levels: THEME_LEVELS,
    }),
    [level, setLevel, cycleLevel],
  );

  const content = scoped ? (
    <div {...{ [THEME_ATTRIBUTE]: level }} className={className}>
      {children}
    </div>
  ) : (
    children
  );

  return <ThemeContext.Provider value={value}>{content}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * The level, if there is a provider, without throwing when there is not.
 *
 * For components that *adapt* to the level rather than requiring it — a divider
 * whose glyph differs by polarity, say. Those must still render standalone: in
 * a Storybook story with no decorator, an MDX preview, or a consumer that
 * themes with the attribute alone and never mounts a provider.
 */
export const useOptionalTheme = (): ThemeContextValue | undefined =>
  useContext(ThemeContext);
