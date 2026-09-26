'use client';

import type { ElementType, ReactNode } from 'react';
import {
  LinkProvider,
  renderProvidedLink,
  useLinkComponent,
} from '../LinkProvider';
import type { LinkComponentProps } from '../LinkProvider';

export type DocsLinkProps = LinkComponentProps;

// The docs chrome's name for the package's one link adapter.
//
// This file used to own the context. Since issue 246 it lives in
// `components/LinkProvider.tsx`, shared with the site chrome, and these are
// the docs-family names for it: a `DocsLinkProvider` and a `LinkProvider`
// write to the same context, so either one reaches `DocsHeader`, `SiteHeader`
// and everything else that renders a link.

export interface DocsLinkProviderProps {
  /** Any component accepting `href` and the usual anchor props. */
  component: ElementType<DocsLinkProps>;
  children: ReactNode;
}

/**
 * Injects the component every docs chrome element uses to render an internal
 * link.
 *
 * Defaults to a plain `<a>`, which is correct for Storybook, MDX previews, and
 * statically-rendered output. Apps with a client-side router inject their own
 * (`react-router`'s `Link`, `next/link`, …) so sidebar, breadcrumb, pager, and
 * TOC navigation stops triggering full page loads. Without this the docs chrome
 * would hard-navigate on every click and lose scroll position, focus, and any
 * client state on each hop.
 *
 * The same context as {@link LinkProvider}, which also takes `isCurrent`.
 */
export function DocsLinkProvider({ component, children }: DocsLinkProviderProps) {
  return <LinkProvider component={component}>{children}</LinkProvider>;
}

export function useDocsLinkComponent(): ElementType<DocsLinkProps> {
  return useLinkComponent();
}

/**
 * Renders an internal link through the injected component and an external one
 * through a plain `<a>` with `rel="noopener noreferrer"`. Pure in-page hashes
 * stay plain too — routers tend to treat `#section` as a route change and
 * scroll to the top instead of to the anchor.
 */
export function DocsLink(props: DocsLinkProps) {
  const Component = useLinkComponent();
  return renderProvidedLink(Component, props);
}
