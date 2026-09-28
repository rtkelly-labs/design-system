import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { recipe } from '../lib/recipe';

export interface SiteFooterProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'className'> {
  /**
   * The lead block — the site's name, a line about it, a newsletter prompt.
   * Takes the first column at desktop widths and the top of the stack below.
   */
  children?: ReactNode;
  /**
   * Link columns — normally one or more vertical `SiteNav`s, each with its own
   * `label`. A footer nav is a second navigation landmark on the page, so it
   * must be named apart from the header's: `Footer`, `Product`, `Company`.
   */
  nav?: ReactNode;
  /**
   * The bottom strip — copyright, licence, colophon, a build stamp. Set in the
   * secondary ink, below a rule.
   */
  meta?: ReactNode;
  /** Merged into the `<footer>`'s classes. */
  className?: string;
}

const siteFooter = recipe({
  slots: {
    root: 'border-t-4 border-edge-strong bg-surface-raised font-mono text-content-primary',
    body: 'mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 md:flex-row md:justify-between md:px-6',
    lead: 'max-w-sm text-sm leading-relaxed',
    nav: 'flex flex-wrap gap-x-12 gap-y-6',
    meta: 'border-t-2 border-edge-strong',
    metaInner: 'mx-auto max-w-6xl px-4 py-4 text-xs uppercase tracking-wide text-content-secondary md:px-6',
  },
});

/**
 * The site's content-info landmark: a lead block, link columns and a bottom
 * strip.
 *
 * Like {@link SiteHeader} it is a layout and holds no content of its own —
 * no copyright line, no links, no name. Every slot is optional, so a
 * portfolio's one-line footer and a marketing site's four columns are the same
 * component with more or fewer slots filled.
 *
 * Rendered as `<footer>`, which is the `contentinfo` landmark when it is not
 * inside an `<article>`, `<aside>`, `<main>`, `<nav>` or `<section>` — so put
 * it beside `<main>`, not in it.
 *
 * @example
 * ```tsx
 * <SiteFooter
 *   nav={
 *     <SiteNav label="Footer" orientation="vertical">
 *       <SiteNavItem href="/colophon">Colophon</SiteNavItem>
 *     </SiteNav>
 *   }
 *   meta="© 2026 Site name"
 * >
 *   A line about the site.
 * </SiteFooter>
 * ```
 */
export const SiteFooter = forwardRef<HTMLElement, SiteFooterProps>(function SiteFooter(
  { children, nav, meta, className, ...props },
  ref,
) {
  const styles = siteFooter();
  const hasBody = Boolean(children) || Boolean(nav);

  return (
    <footer ref={ref} data-slot="site-footer" {...props} className={styles.root({ class: className })}>
      {hasBody ? (
        <div data-slot="site-footer-body" className={styles.body()}>
          {children ? (
            <div data-slot="site-footer-lead" className={styles.lead()}>
              {children}
            </div>
          ) : null}
          {nav ? (
            <div data-slot="site-footer-nav" className={styles.nav()}>
              {nav}
            </div>
          ) : null}
        </div>
      ) : null}
      {meta ? (
        <div data-slot="site-footer-meta" className={hasBody ? styles.meta() : undefined}>
          <div className={styles.metaInner()}>{meta}</div>
        </div>
      ) : null}
    </footer>
  );
});
