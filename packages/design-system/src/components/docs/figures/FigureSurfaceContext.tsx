'use client';

import * as React from 'react';

export type FigureSurface = 'base' | 'sheet';

/**
 * Context communicating the enclosing figure container surface to child sections.
 *
 * When nested inside a `DrawingSheet`, child `IndexedSection` elements step up to
 * `bg-surface-raised` to provide crisp contrast against the sheet's `bg-surface-base`
 * grid canvas, preventing the "same-surface sandwich" effect.
 */
export const FigureSurfaceContext = React.createContext<FigureSurface | null>(null);
