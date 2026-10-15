'use client';

import { createContext, useContext } from 'react';

/**
 * How a label (`Badge`, `Tag`) is drawn. `default` is the filled, bordered look;
 * `hairline` is a 1px subtle outline with no fill, secondary text, the small
 * size, the label's own case and no `#` prefix (D11).
 */
export type LabelAppearance = 'default' | 'hairline';

/**
 * What a label uses when its own `appearance` is unset. `Table` provides
 * `hairline`, so labels inside a table cell are quiet without each caller
 * asking; everywhere else the context is `default` and nothing changes.
 */
export const LabelAppearanceContext = createContext<LabelAppearance>('default');

/** The resolved appearance: an explicit prop wins, then the nearest provider. */
export function useLabelAppearance(explicit?: LabelAppearance): LabelAppearance {
  const inherited = useContext(LabelAppearanceContext);
  return explicit ?? inherited;
}
