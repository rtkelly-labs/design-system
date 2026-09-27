import type { ReactNode } from 'react';
import { Button } from '../../components/Button';
import { LinkProvider } from '../../components/LinkProvider';
import { MobileNav } from '../../components/MobileNav';
import { SiteFooter } from '../../components/SiteFooter';
import { SiteHeader } from '../../components/SiteHeader';
import type { SiteHeaderCollapse } from '../../components/SiteHeader';
import { SiteNav, SiteNavItem } from '../../components/SiteNav';

// The four sites issue 246 says the site chrome must build, as data.
//
// Every name, link and line of copy below is a fixture: the components hold
// none of it, and the stories import it from here rather than the components
// defaulting to it. That is the rule the issue sets — "no navigation items and
// no Ryan-specific content in the component implementations" — and this file
// is where that content lives instead.

/** One top-level entry: a link, or a group whose links open in a menu. */
export type NavFixture =
  | { label: string; href: string }
  | { label: string; items: readonly { label: string; href: string }[] };

export interface FooterColumnFixture {
  label: string;
  items: readonly { label: string; href: string }[];
}

export interface SiteFixture {
  brand: string;
  /** The route the story pretends to be on — what a router would report. */
  currentPath: string;
  nav: readonly NavFixture[];
  collapseAt?: SiteHeaderCollapse;
  actions?: ReactNode;
  headline: string;
  body: string;
  footerLead?: ReactNode;
  footerColumns?: readonly FooterColumnFixture[];
  footerMeta: ReactNode;
}

/** A simple portfolio: four links and a one-line footer. */
export const portfolio: SiteFixture = {
  brand: 'Ryan Kelly',
  currentPath: '/work',
  nav: [
    { label: 'Work', href: '/work' },
    { label: 'Writing', href: '/writing' },
    { label: 'About', href: '/about' },
    { label: 'GitHub', href: 'https://github.com/rtkelly13' },
  ],
  headline: 'Selected work',
  body: 'Design systems, developer tooling and the occasional terminal theme.',
  footerMeta: '© 2026 Ryan Kelly',
};

/** A blog: the posts index is current, and the footer carries a licence line. */
export const blog: SiteFixture = {
  brand: 'RTK / Notes',
  currentPath: '/posts',
  nav: [
    { label: 'Posts', href: '/posts' },
    { label: 'Tags', href: '/tags' },
    { label: 'Archive', href: '/archive' },
    { label: 'About', href: '/about' },
  ],
  headline: 'Posts',
  body: 'Notes on building a brutalist design system in public, one gate at a time.',
  footerColumns: [
    {
      label: 'Elsewhere',
      items: [
        { label: 'RSS', href: '/rss.xml' },
        { label: 'GitHub', href: 'https://github.com/rtkelly13' },
      ],
    },
  ],
  footerMeta: '© 2026 Ryan Kelly · Text CC BY 4.0',
};

/** A marketing site: a group in the nav, a CTA, a lead line and three footer columns. */
export const marketing: SiteFixture = {
  brand: 'Ladder',
  currentPath: '/pricing',
  collapseAt: 'lg',
  nav: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    {
      label: 'Resources',
      items: [
        { label: 'Guides', href: '/guides' },
        { label: 'Changelog', href: '/changelog' },
        { label: 'Status', href: '/status' },
      ],
    },
    { label: 'Company', href: '/company' },
  ],
  actions: (
    <Button href="/signup" size="sm" variant="primary">
      START FREE
    </Button>
  ),
  headline: 'Pricing',
  body: 'One plan, every level of the ladder, and no seat maths.',
  footerLead: 'Ladder — contrast you can audit, themes you can ship.',
  footerColumns: [
    {
      label: 'Product',
      items: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    {
      label: 'Company',
      items: [
        { label: 'About', href: '/company' },
        { label: 'Careers', href: '/careers' },
      ],
    },
    {
      label: 'Legal',
      items: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
      ],
    },
  ],
  footerMeta: '© 2026 Ladder Ltd.',
};

/** A documentation-adjacent project site: docs, components, a changelog, the repo. */
export const projectSite: SiteFixture = {
  brand: 'Design System',
  currentPath: '/docs',
  nav: [
    { label: 'Docs', href: '/docs' },
    { label: 'Components', href: '/components' },
    { label: 'Changelog', href: '/changelog' },
    { label: 'GitHub', href: 'https://github.com/rtkelly13/design-system' },
  ],
  actions: (
    <Button href="/docs/install" size="sm" variant="inverse" className="hidden sm:inline-flex">
      INSTALL
    </Button>
  ),
  headline: 'Documentation',
  body: 'Tokens, components and the gates that hold them — install, theme, compose.',
  footerColumns: [
    {
      label: 'Project',
      items: [
        { label: 'Releases', href: '/changelog' },
        { label: 'Licence', href: '/licence' },
      ],
    },
  ],
  footerMeta: 'MIT licensed · v0.9.0',
};

/** The fixture's top-level entries as `SiteNavItem`s — the one list both navs get. */
export function navItems(nav: readonly NavFixture[]) {
  return nav.map((item) =>
    'items' in item ? (
      <SiteNavItem key={item.label} label={item.label}>
        {item.items.map((child) => (
          <SiteNavItem key={child.href} href={child.href}>
            {child.label}
          </SiteNavItem>
        ))}
      </SiteNavItem>
    ) : (
      <SiteNavItem key={item.href} href={item.href}>
        {item.label}
      </SiteNavItem>
    ),
  );
}

/**
 * Footer link columns: a visible heading over a vertical `SiteNav` named the
 * same, so each column is a navigation landmark a screen reader can tell apart.
 */
export function footerNav(columns: readonly FooterColumnFixture[]) {
  return columns.map((column) => (
    <div key={column.label} className="min-w-32">
      <h2 className="mb-2 pl-4 text-xs font-bold uppercase tracking-widest text-content-muted">
        {column.label}
      </h2>
      <SiteNav label={column.label} orientation="vertical">
        {column.items.map((item) => (
          <SiteNavItem key={item.href} href={item.href}>
            {item.label}
          </SiteNavItem>
        ))}
      </SiteNav>
    </div>
  ));
}

export interface SitePageProps {
  site: SiteFixture;
  /** Open the mobile drawer on load — for the narrow-viewport baselines. */
  mobileNavOpen?: boolean;
  /**
   * The page's content, in place of the fixture's headline and body — for a
   * story that is about what goes inside the chrome (a `NotFoundPage`, say).
   */
  children?: ReactNode;
}

/**
 * A whole page from the four components: `SiteHeader` with a `SiteNav` and a
 * `MobileNav` over one list of items, a `<main>` the skip link targets, and a
 * `SiteFooter`. The current page comes from `LinkProvider`'s `isCurrent`,
 * standing in for a router, rather than from any item saying so.
 */
export function SitePage({ site, mobileNavOpen = false, children }: SitePageProps) {
  const items = navItems(site.nav);
  return (
    <LinkProvider isCurrent={(href) => href === site.currentPath}>
      <div className="flex min-h-screen flex-col bg-surface-base text-content-primary">
        <SiteHeader
          brand={site.brand}
          collapseAt={site.collapseAt}
          nav={<SiteNav label="Primary">{items}</SiteNav>}
          mobileNav={
            <MobileNav label="Primary" defaultOpen={mobileNavOpen}>
              {items}
            </MobileNav>
          }
          actions={site.actions}
        />
        <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 md:px-6">
          {children ?? (
            <>
              <h1 className="font-display text-3xl font-bold uppercase tracking-wider">{site.headline}</h1>
              <p className="mt-4 max-w-prose font-sans text-base leading-relaxed text-content-secondary">
                {site.body}
              </p>
            </>
          )}
        </main>
        <SiteFooter
          nav={site.footerColumns?.length ? footerNav(site.footerColumns) : undefined}
          meta={site.footerMeta}
        >
          {site.footerLead}
        </SiteFooter>
      </div>
    </LinkProvider>
  );
}
