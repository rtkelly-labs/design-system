'use client';

import { createContext, useContext } from 'react';
import type { SiteHeaderCollapse } from './SiteHeader';
import type { SiteNavOrientation } from './SiteNav';

// Where a `SiteNavItem` is being rendered, which decides what it renders as.
//
// A module of its own for the reason `dialogPopupRef.ts` is one: `src/index.ts`
// re-exports `SiteNav.tsx` and `MobileNav.tsx` wholesale, and a context in
// either would be published. Nothing exports this file.
//
// - `orientation` — a row in a header, or a column in a drawer or a footer.
// - `inMenu` — inside a group's `Menu`, where an item is a menu link rather
//   than a list item.
// - `onNavigate` — called after any item is followed. `MobileNav` sets it to
//   close its drawer: under a client-side router a followed link does not
//   unload the page, so without it the drawer would stay open over the page
//   it just navigated to.
interface SiteNavContextValue {
  orientation: SiteNavOrientation;
  inMenu: boolean;
  onNavigate?: () => void;
}

export const SiteNavContext = createContext<SiteNavContextValue>({
  orientation: 'horizontal',
  inMenu: false,
});

export function useSiteNavContext(): SiteNavContextValue {
  return useContext(SiteNavContext);
}

// The width at which a `SiteHeader` swaps its `mobileNav` slot out for `nav`,
// given to a `MobileNav` inside that slot. The slot is hidden by CSS there, but
// the drawer is portalled to `body` and outside it, so the `MobileNav` has to
// close itself: the same queries Tailwind's `sm:` / `md:` / `lg:` compile to.
export const COLLAPSE_QUERY: Record<SiteHeaderCollapse, string> = {
  sm: '(min-width: 40rem)',
  md: '(min-width: 48rem)',
  lg: '(min-width: 64rem)',
};

export const SiteHeaderCollapseContext = createContext<SiteHeaderCollapse | undefined>(undefined);
