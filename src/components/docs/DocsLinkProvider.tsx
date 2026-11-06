import { createContext, useContext } from 'react';
import type { AnchorHTMLAttributes, ElementType, ReactNode } from 'react';

export type DocsLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

/**
 * The component every docs chrome element uses to render an internal link.
 *
 * Defaults to a plain `<a>`, which is correct for Storybook, MDX previews, and
 * statically-rendered output. Apps with a client-side router inject their own
 * (`react-router`'s `Link`, `next/link`, …) via {@link DocsLinkProvider} so
 * sidebar, breadcrumb, pager, and TOC navigation stops triggering full page
 * loads. Without this the docs chrome would hard-navigate on every click and
 * lose scroll position, focus, and any client state on each hop.
 */
const DocsLinkContext = createContext<ElementType<DocsLinkProps>>('a');

export interface DocsLinkProviderProps {
  /** Any component accepting `href` and the usual anchor props. */
  component: ElementType<DocsLinkProps>;
  children: ReactNode;
}

export function DocsLinkProvider({ component, children }: DocsLinkProviderProps) {
  return (
    <DocsLinkContext.Provider value={component}>{children}</DocsLinkContext.Provider>
  );
}

export function useDocsLinkComponent(): ElementType<DocsLinkProps> {
  return useContext(DocsLinkContext);
}

const EXTERNAL = /^([a-z][a-z0-9+.-]*:)?\/\//i;
const NON_ROUTED = /^(mailto:|tel:|#)/i;

/** True for links that must stay plain anchors regardless of the injected router. */
export function isExternalHref(href: string): boolean {
  return EXTERNAL.test(href) || NON_ROUTED.test(href);
}

/**
 * Renders an internal link through the injected component and an external one
 * through a plain `<a>` with `rel="noopener noreferrer"`. Pure in-page hashes
 * stay plain too — routers tend to treat `#section` as a route change and
 * scroll to the top instead of to the anchor.
 */
export function DocsLink({ href, children, ...rest }: DocsLinkProps) {
  const Component = useDocsLinkComponent();

  if (isExternalHref(href)) {
    const external = EXTERNAL.test(href);
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Component href={href} {...rest}>
      {children}
    </Component>
  );
}
