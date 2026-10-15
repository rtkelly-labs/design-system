'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  A11Y_ATTRIBUTES,
  A11Y_AXES,
  A11Y_DEFAULT,
  A11Y_STORAGE_KEY,
  CONTRAST_MORE_QUERY,
  parseA11yState,
  resolveA11yAttributes,
  serialiseA11yState,
} from './a11yInitScript';
import type { A11yAxis, A11yChoice, A11yState } from './a11yInitScript';

/**
 * Where choices are kept. The default writes one `localStorage` key, per device;
 * pass your own to sync to an account. Both calls are synchronous, so a stored
 * choice is known before first paint, which is the property the init script
 * depends on. Sync an account store by loading it before render and handing the
 * result back from `read`, and by forwarding `write` to your API.
 */
export interface A11yStorage {
  /** The stored choices, or `undefined` when there are none. Must not throw. */
  read: () => Partial<A11yState> | undefined;
  /** Persist the full state. Must not throw. */
  write: (state: A11yState) => void;
}

/** The per-device default: one `ds-a11y` key holding only the axes that are not `system`. */
export const localStorageA11yStorage: A11yStorage = {
  read() {
    try {
      const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
      return raw ? parseA11yState(raw) : undefined;
    } catch {
      // Safari in private mode throws on access rather than returning null.
      return undefined;
    }
  },
  write(state) {
    try {
      const serialised = serialiseA11yState(state);
      if (serialised === null) window.localStorage.removeItem(A11Y_STORAGE_KEY);
      else window.localStorage.setItem(A11Y_STORAGE_KEY, serialised);
    } catch {
      // See read.
    }
  },
};

export interface A11yPreferencesContextValue extends A11yState {
  /** Choose `system`, `on` or `off` for one axis. */
  set: (axis: A11yAxis, value: A11yChoice) => void;
  /** Every axis back to `system`, and the stored choices cleared. */
  reset: () => void;
}

const A11yPreferencesContext = createContext<A11yPreferencesContextValue | undefined>(undefined);

export interface A11yPreferencesProviderProps {
  children: React.ReactNode;
  /**
   * Persist to storage. Turn off for a preview surface (a Storybook decorator, an
   * embedded demo) that should not write to the host page's storage.
   */
  persist?: boolean;
  /** Follow `prefers-contrast: more` where the user has not chosen. On by default. */
  followSystem?: boolean;
  /**
   * Replace the per-device `localStorage` store, to sync preferences to an
   * account. Ignored when `persist` is off.
   */
  storage?: A11yStorage;
  /** Called with the full state after every change a user makes, for account sync or analytics. */
  onChange?: (state: A11yState) => void;
  /** Choices to start from before anything is read, and on the server. */
  defaultValue?: Partial<A11yState>;
}

function readSystem(): { contrastMore: boolean } {
  if (typeof window.matchMedia !== 'function') return { contrastMore: false };
  return { contrastMore: window.matchMedia(CONTRAST_MORE_QUERY).matches };
}

/** Write the resolved attributes onto `documentElement`: set when active, removed when not. */
function applyAttributes(state: A11yState, followSystem: boolean): void {
  const system = followSystem ? readSystem() : { contrastMore: false };
  const resolved = resolveA11yAttributes(state, system);
  const root = document.documentElement;
  for (const axis of A11Y_AXES) {
    const { attribute } = A11Y_ATTRIBUTES[axis];
    const value = resolved[axis];
    if (value === null) root.removeAttribute(attribute);
    else root.setAttribute(attribute, value);
  }
}

/**
 * Holds the user's accessibility preferences and applies them, as `data-a11y-*`
 * attributes on `documentElement`. Read it with {@link useA11yPreferences}.
 *
 * Pair it with `getA11yInitScript()` in the document head, so the first paint is
 * already correct; this component only takes over after hydration. The provider
 * is document-level by design and has no `scoped` mode: a preference is about the
 * person reading, not about a subtree, and the stylesheet's selectors key off
 * the document element.
 *
 * Each axis is `system`, `on` or `off`. The state is the user's *choice*, not the
 * applied attribute, because an attribute of `more` cannot say whether the user
 * chose it or the operating system did.
 */
export const A11yPreferencesProvider: React.FC<A11yPreferencesProviderProps> = ({
  children,
  persist = true,
  followSystem = true,
  storage = localStorageA11yStorage,
  onChange,
  defaultValue,
}) => {
  // Not seeded from storage: server and first client render must agree, so both
  // start from the default and the effect below reconciles.
  const [state, setState] = useState<A11yState>({ ...A11Y_DEFAULT, ...defaultValue });
  // The state the setters build on, kept current by `commit` and the mount read
  // rather than by render, so two quick changes in one tick do not drop the first.
  const latest = useRef(state);

  useEffect(() => {
    const stored = persist ? storage.read() : undefined;
    const next: A11yState = stored ? { ...A11Y_DEFAULT, ...defaultValue, ...stored } : latest.current;
    latest.current = next;
    setState(next);
    // Idempotent with the init script when it ran; self-sufficient when it did not.
    applyAttributes(next, followSystem);
    // Mount-only on purpose: storage and defaults are read once, like ThemeProvider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The OS can change under a live page. Re-resolve only when contrast follows it.
  useEffect(() => {
    if (!followSystem || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(CONTRAST_MORE_QUERY);
    const onSystemChange = () => applyAttributes(latest.current, followSystem);
    query.addEventListener?.('change', onSystemChange);
    return () => query.removeEventListener?.('change', onSystemChange);
  }, [followSystem]);

  const commit = useCallback(
    (next: A11yState) => {
      latest.current = next;
      setState(next);
      // Applied here rather than in an effect on `state`: an effect would run on
      // mount with the default and overwrite what the init script resolved.
      applyAttributes(next, followSystem);
      if (persist) storage.write(next);
      onChange?.(next);
    },
    [followSystem, persist, storage, onChange],
  );

  const set = useCallback(
    (axis: A11yAxis, value: A11yChoice) => commit({ ...latest.current, [axis]: value }),
    [commit],
  );
  const reset = useCallback(() => commit(A11Y_DEFAULT), [commit]);

  const value = useMemo<A11yPreferencesContextValue>(
    () => ({ ...state, set, reset }),
    [state, set, reset],
  );

  return <A11yPreferencesContext.Provider value={value}>{children}</A11yPreferencesContext.Provider>;
};

/** The preferences and their setters. Throws without an {@link A11yPreferencesProvider}. */
export const useA11yPreferences = (): A11yPreferencesContextValue => {
  const context = useContext(A11yPreferencesContext);
  if (!context) {
    throw new Error('useA11yPreferences must be used within an A11yPreferencesProvider');
  }
  return context;
};

/**
 * The preferences, if there is a provider, without throwing when there is not.
 *
 * For chrome that *adapts* to them rather than requiring them: `DocsHeader`
 * shows the menu when a provider is present and renders without it otherwise,
 * the same arrangement `useOptionalTheme` makes for the level picker.
 */
export const useOptionalA11yPreferences = (): A11yPreferencesContextValue | undefined =>
  useContext(A11yPreferencesContext);
