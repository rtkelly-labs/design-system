'use client';

import { useContext } from 'react';
import { THEME_ATTRIBUTE } from './themeInitScript';
import { ScopedLevelContext } from './themeScope';

// The Level for a surface portalled out of its provider's subtree.
//
// Base UI portals a popup to `body`, outside a `<ThemeProvider scoped>`
// wrapper's `[data-theme]`, so its role colours resolved from the document's
// Level rather than the trigger's. Stamping the scoped provider's Level on the
// portal root puts it back under the right `[data-theme]` selector.
//
// Under an unscoped provider the attribute is omitted: that provider writes
// `documentElement` in an effect, a paint after render, so stamping its state
// would switch the portal early and could override the init script's Level
// during hydration. The portal inherits the document's Level instead. Not
// exported from the package.
export function usePortalThemeAttribute(): Record<string, string> {
  const level = useContext(ScopedLevelContext);
  return level ? { [THEME_ATTRIBUTE]: level } : {};
}
