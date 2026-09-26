'use client';

import { createContext, forwardRef, useContext, useMemo } from 'react';
import type { AnchorHTMLAttributes, ElementType, ReactNode } from 'react';
import { cn } from '../lib/recipe';

/** What a consumer's link component is handed: an `href` and the usual anchor props. */
export type LinkComponentProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

interface LinkContextValue {
  component: ElementType<LinkComponentProps>;
  isCurrent?: (href: string) => boolean;
}

// One context for every chrome in the package. `DocsLinkProvider` writes to it
// too, so a site that mounts both the docs chrome and the site chrome injects
// its router once rather than once per family (issue 246).
const LinkContext = createContext<LinkContextValue>({ component: 'a' });

export interface LinkProviderProps {
  /**
   * Any component accepting `href` and the usual anchor props — `next/link`,
   * `react-router`'s `Link`, a TanStack Router `Link`. Omit it to keep the
   * enclosing provider's, or the plain `<a>` when there is none.
   */
  component?: ElementType<LinkComponentProps>;
  /**
   * Whether `href` is the page being shown — the consumer's route, asked
   * rather than guessed. `SiteNavItem` and `SiteLink` mark the matching link
   * `aria-current="page"`. Omit it to keep the enclosing provider's; with none
   * anywhere, nothing is current unless an item says so itself.
   */
  isCurrent?: (href: string) => boolean;
  children: ReactNode;
}

/**
 * The link adapter: how this package's chrome renders an internal link, and
 * how it learns which page is current, without depending on a router.
 *
 * The default is a plain `<a>` and no current page, which is right for
 * Storybook, static output and a server-rendered page that marks its own
 * items. An app with a client-side router supplies its `Link` so navigation
 * stops being a full page load, and an `isCurrent` built from its own
 * location so the active item follows the route. Nothing in the package reads
 * `window.location`: the route is the router's to know.
 *
 * Nested providers inherit what they do not set, so a subtree can swap the
 * link component and keep the current-page test, or the reverse.
 *
 * ```tsx
 * <LinkProvider component={Link} isCurrent={(href) => href === pathname}>
 *   <SiteHeader … />
 * </LinkProvider>
 * ```
 */
export function LinkProvider({ component, isCurrent, children }: LinkProviderProps) {
  const parent = useContext(LinkContext);
  const resolvedComponent = component ?? parent.component;
  const resolvedIsCurrent = isCurrent ?? parent.isCurrent;
  const value = useMemo(
    () => ({ component: resolvedComponent, isCurrent: resolvedIsCurrent }),
    [resolvedComponent, resolvedIsCurrent],
  );
  return <LinkContext.Provider value={value}>{children}</LinkContext.Provider>;
}

/** The injected link component, or `'a'` when nothing was injected. */
export function useLinkComponent(): ElementType<LinkComponentProps> {
  return useContext(LinkContext).component;
}

const EXTERNAL = /^([a-z][a-z0-9+.-]*:)?\/\//i;
const NON_ROUTED = /^(mailto:|tel:|#)/i;

/** True for links that must stay plain anchors regardless of the injected router. */
export function isExternalHref(href: string): boolean {
  return EXTERNAL.test(href) || NON_ROUTED.test(href);
}

/**
 * Whether `href` is the current page, by the provider's `isCurrent`.
 *
 * An external or in-page href is never current: it is not a route, so there is
 * nothing for the consumer's router to match it against.
 */
export function useIsCurrentHref(href: string): boolean {
  const { isCurrent } = useContext(LinkContext);
  if (!isCurrent || isExternalHref(href)) return false;
  return isCurrent(href);
}

// The shared body of `SiteLink` and `DocsLink`: an internal link through the
// injected component, an external one through a plain `<a>` opening a new tab
// with `rel="noopener noreferrer"`. Pure in-page hashes stay plain too —
// routers tend to treat `#section` as a route change and scroll to the top
// instead of to the anchor. The caller's own props are spread last, so an
// explicit `target` or `rel` wins.
//
// A component rather than a helper taking a ref, so the ref is forwarded the
// way React expects rather than handed to a function during render.
const ProvidedAnchor = forwardRef<
  HTMLAnchorElement,
  LinkComponentProps & { component: ElementType<LinkComponentProps> }
>(function ProvidedAnchor({ component: Component, href, children, ...rest }, ref) {
  if (isExternalHref(href)) {
    const external = EXTERNAL.test(href);
    return (
      <a
        ref={ref}
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Component ref={ref} href={href} {...rest}>
      {children}
    </Component>
  );
});

// `DocsLink`'s entry point. Not exported from the package: `src/index.ts`
// names this file's exports one by one.
export function renderProvidedLink(
  component: ElementType<LinkComponentProps>,
  props: LinkComponentProps,
) {
  return <ProvidedAnchor component={component} {...props} />;
}

export interface SiteLinkProps extends LinkComponentProps {
  /**
   * Marks the link as the current page. Leave it unset and the provider's
   * `isCurrent` decides; set it to override that for this one link.
   */
  current?: boolean;
  /** Merged into the anchor's classes. */
  className?: string;
}

/**
 * A link rendered through the {@link LinkProvider} — the router's `Link` for an
 * internal href, a plain `<a>` for an external one — carrying
 * `aria-current="page"` when it is the current page.
 *
 * The attribute is the whole of the current state: `SiteNavItem` styles it with
 * an `aria-[current=page]:` variant rather than a second flag, so what a screen
 * reader is told and what a sighted reader sees cannot disagree.
 */
export const SiteLink = forwardRef<HTMLAnchorElement, SiteLinkProps>(function SiteLink(
  { href, current, className, 'aria-current': ariaCurrent, ...props },
  ref,
) {
  const Component = useLinkComponent();
  const matched = useIsCurrentHref(href);
  const isCurrent = current ?? matched;
  // `cn` so a caller's conflicting utilities resolve rather than both
  // emitting; `undefined` rather than an empty `class=""` when there are none.
  const merged = cn(className) || undefined;
  return (
    <ProvidedAnchor
      ref={ref}
      component={Component}
      href={href}
      {...props}
      className={merged}
      aria-current={isCurrent ? 'page' : ariaCurrent}
    />
  );
});
