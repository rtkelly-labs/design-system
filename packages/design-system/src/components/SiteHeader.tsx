'use client';

import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { recipe } from '../lib/recipe';
import { SiteLink } from './LinkProvider';
import { SiteHeaderCollapseContext } from './siteNavContext';

/**
 * The breakpoint at which a `SiteHeader` swaps its `mobileNav` for its `nav`.
 * Tailwind's own names, and only the three a header plausibly collapses at.
 */
export type SiteHeaderCollapse = 'sm' | 'md' | 'lg';

export interface SiteHeaderProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'> {
  /**
   * The site's name or mark, rendered as the link home. Text, a logo, or both —
   * a logo image needs its own `alt`, since it becomes the link's name.
   */
  brand: ReactNode;
  /** Where the brand links to. The site root by default. */
  brandHref?: string;
  /**
   * The desktop navigation — normally a `SiteNav`. Shown at `collapseAt` and
   * wider; not rendered into the accessibility tree below it.
   */
  nav?: ReactNode;
  /**
   * The narrow-viewport navigation — normally a `MobileNav` with the same items
   * as `nav`. Shown below `collapseAt` only.
   */
  mobileNav?: ReactNode;
  /**
   * Trailing controls shown at every width — a CTA `Button`, a theme control, a
   * repository link. Keep it short: on a phone it shares the bar with the brand
   * and the menu trigger.
   */
  actions?: ReactNode;
  /**
   * Where `nav` gives way to `mobileNav`. `md` (768px) by default; a site with
   * many top-level items wants `lg`, one with three short ones may keep its row
   * down to `sm`.
   */
  collapseAt?: SiteHeaderCollapse;
  /**
   * The `id` of the page's main content, which the skip link jumps to. A
   * leading `#` is accepted and ignored. Pass `false` to omit the skip link —
   * only when the page already renders one of its own.
   */
  skipTo?: string | false;
  /** The skip link's text. `Skip to content` by default. */
  skipLabel?: string;
  /** Stick the bar to the top of the viewport as the page scrolls. Off by default. */
  sticky?: boolean;
  /** Merged into the `<header>`'s classes. */
  className?: string;
}

// The class strings are written out in full, per breakpoint, because
// Tailwind's scanner reads source text: a template literal such as
// `${at}:flex` would generate no CSS at all.
const siteHeader = recipe({
  slots: {
    root: 'relative border-b-4 border-edge-strong bg-surface-raised font-mono text-content-primary',
    skip: 'sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-top '
      + 'focus:border-2 focus:border-edge-strong focus:bg-surface-base focus:px-4 focus:py-2 '
      + 'focus:font-bold focus:uppercase focus:text-content-primary',
    bar: 'mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6',
    brand: 'mr-auto inline-flex items-center gap-2 font-display text-lg font-bold uppercase '
      + 'tracking-wider text-content-primary no-underline hover:text-accent-primary',
    nav: 'hidden',
    mobile: '',
    actions: 'flex items-center gap-2',
  },
  variants: {
    collapseAt: {
      sm: { nav: 'sm:block', mobile: 'sm:hidden' },
      md: { nav: 'md:block', mobile: 'md:hidden' },
      lg: { nav: 'lg:block', mobile: 'lg:hidden' },
    },
    sticky: {
      true: { root: 'sticky top-0 z-raised' },
    },
  },
  defaultVariants: { collapseAt: 'md' },
});

/**
 * The site's banner: skip link, brand, navigation and trailing actions, with
 * the navigation swapping to a {@link MobileNav} below a breakpoint.
 *
 * It is a layout and a landmark, not a menu. The `<header>` is the banner; the
 * navigation is whatever `SiteNav` and `MobileNav` the caller passes, so the
 * header holds no items, no labels and no current-page logic of its own. The
 * same four parts — this, `SiteNav`, `MobileNav`, `SiteFooter` — build a
 * portfolio, a blog, a marketing site and a project site without a prop
 * between them changing; the stories are those four.
 *
 * ## The breakpoint is the point
 *
 * Below `collapseAt` the `nav` slot is `display: none` and the `mobileNav`
 * slot is shown; at `collapseAt` and wider, the reverse. `display: none` rather
 * than `aria-hidden`, so the hidden one leaves the accessibility tree and the
 * tab order together — a screen reader never meets two copies of one nav.
 *
 * ## The skip link
 *
 * The first focusable element on the page, visually hidden until it takes
 * focus. It jumps to `#main-content` unless `skipTo` names another `id`; the
 * page's `<main>` must carry that `id`, which is the one thing this component
 * asks of the page around it.
 *
 * @example
 * ```tsx
 * const items = (
 *   <>
 *     <SiteNavItem href="/writing">Writing</SiteNavItem>
 *     <SiteNavItem href="/projects">Projects</SiteNavItem>
 *   </>
 * );
 *
 * <SiteHeader
 *   brand="Site name"
 *   nav={<SiteNav label="Primary">{items}</SiteNav>}
 *   mobileNav={<MobileNav label="Primary">{items}</MobileNav>}
 * />
 * <main id="main-content">…</main>
 * ```
 */
export const SiteHeader = forwardRef<HTMLElement, SiteHeaderProps>(function SiteHeader(
  {
    brand,
    brandHref = '/',
    nav,
    mobileNav,
    actions,
    collapseAt = 'md',
    skipTo = 'main-content',
    skipLabel = 'Skip to content',
    sticky = false,
    className,
    ...props
  },
  ref,
) {
  const styles = siteHeader({ collapseAt, sticky });
  const skipId = skipTo === false ? null : skipTo.replace(/^#/, '');

  return (
    <header ref={ref} data-slot="site-header" {...props} className={styles.root({ class: className })}>
      {skipId ? (
        <a href={`#${skipId}`} data-slot="site-header-skip" className={styles.skip()}>
          {skipLabel}
        </a>
      ) : null}
      <div data-slot="site-header-bar" className={styles.bar()}>
        <SiteLink href={brandHref} current={false} data-slot="site-header-brand" className={styles.brand()}>
          {brand}
        </SiteLink>
        {nav ? (
          <div data-slot="site-header-nav" className={styles.nav()}>
            {nav}
          </div>
        ) : null}
        {actions ? (
          <div data-slot="site-header-actions" className={styles.actions()}>
            {actions}
          </div>
        ) : null}
        {mobileNav ? (
          <div data-slot="site-header-mobile-nav" className={styles.mobile()}>
            <SiteHeaderCollapseContext.Provider value={collapseAt}>
              {mobileNav}
            </SiteHeaderCollapseContext.Provider>
          </div>
        ) : null}
      </div>
    </header>
  );
});
