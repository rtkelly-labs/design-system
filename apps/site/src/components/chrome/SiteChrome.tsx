'use client';

import type { ReactNode } from 'react';
import { MobileNav, SiteFooter, SiteHeader, SiteNav, SiteNavItem } from '@/ds';
import { REPO_URL, STORYBOOK_URL } from '@/lib/links';
import { SearchButton } from './SearchButton';
import { ThemeMenu } from './ThemeMenu';

const items = (
  <>
    <SiteNavItem href="/docs">Docs</SiteNavItem>
    <SiteNavItem href="/docs/components">Components</SiteNavItem>
    <SiteNavItem href={STORYBOOK_URL}>Storybook ↗</SiteNavItem>
    <SiteNavItem href={REPO_URL}>GitHub ↗</SiteNavItem>
  </>
);

/**
 * The marketing chrome: the package's `SiteHeader`, `SiteNav`, `MobileNav` and
 * `SiteFooter`, holding the site's own items. The same items feed both navs;
 * the header shows one or the other by width.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader
        sticky
        // `sticky` alone sits on z-raised, the same layer as a Tabs strip, so
        // scrolled tabs paint over the header (issue 308).
        className="z-top"
        brand={<span>[ RTK / DS ]</span>}
        nav={<SiteNav label="Primary">{items}</SiteNav>}
        mobileNav={<MobileNav label="Primary">{items}</MobileNav>}
        actions={
          <>
            <SearchButton />
            <ThemeMenu />
          </>
        }
      />
      <main id="main-content">{children}</main>
      <SiteFooter
        nav={
          <>
            <SiteNav label="Documentation" orientation="vertical">
              <SiteNavItem href="/docs/installation">Installation</SiteNavItem>
              <SiteNavItem href="/docs/components">All components</SiteNavItem>
              <SiteNavItem href="/docs/components/button">Button</SiteNavItem>
              <SiteNavItem href="/docs/components/data-table">DataTable</SiteNavItem>
            </SiteNav>
            <SiteNav label="Project" orientation="vertical">
              <SiteNavItem href={STORYBOOK_URL}>Storybook ↗</SiteNavItem>
              <SiteNavItem href={REPO_URL}>Source ↗</SiteNavItem>
              <SiteNavItem href="https://www.npmjs.com/package/@rtkelly13/design-system">npm ↗</SiteNavItem>
            </SiteNav>
          </>
        }
        meta="MIT · built with @rtkelly13/design-system · every page static"
      >
        <p className="m-0 font-display text-lg font-bold uppercase">[ RTK / DS ]</p>
        <p className="mt-2 mb-0 text-content-secondary">
          The visual language of ryankelly.dev. Zero radius, hard shadows, colour by role.
        </p>
      </SiteFooter>
    </>
  );
}
