'use client';

import { createContext } from 'react';
import type { ThemeLevel } from '../theme/levels';

// The nearest provider's Level when that provider is scoped, `undefined` when
// it is unscoped or absent. Kept out of `ThemeProvider.tsx` because the package
// re-exports that module wholesale, and this is internal.
export const ScopedLevelContext = createContext<ThemeLevel | undefined>(undefined);
