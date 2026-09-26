'use client';

import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { LinkProvider, ThemeProvider, ToastProvider } from '@/ds';
import type { SearchEntry } from '@/lib/search';
import { RouterLink } from './RouterLink';
import { SearchProvider } from './Search';

/**
 * The providers every page shares: the level, the router, the toast queue and
 * the search dialog. One client boundary at the root; pages under it stay
 * Server Components and hand their client islands serialisable props.
 */
export function Providers({ children, search }: { children: ReactNode; search: readonly SearchEntry[] }) {
  const pathname = usePathname();
  const isCurrent = useCallback(
    (href: string) => href.replace(/\/$/, '') === pathname.replace(/\/$/, ''),
    [pathname],
  );
  return (
    <ThemeProvider defaultLevel="midnight">
      <LinkProvider component={RouterLink} isCurrent={isCurrent}>
        <ToastProvider>
          <SearchProvider entries={search}>{children}</SearchProvider>
        </ToastProvider>
      </LinkProvider>
    </ThemeProvider>
  );
}
