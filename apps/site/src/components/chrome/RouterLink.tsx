'use client';

import NextLink from 'next/link';
import { forwardRef } from 'react';
import type { LinkComponentProps } from '@rtkelly13/design-system';
import { isStorybookHref } from '@/lib/links';

/**
 * `next/link`, in the shape the package's `LinkProvider` asks for. Every
 * internal link the design system renders — sidebar, pager, header brand, nav
 * items — goes through this, so navigation is client-side and prefetched, and
 * `next/link` adds the `/site` basePath.
 *
 * Storybook links are the exception. They are root-relative (`/?path=…`)
 * because Storybook is served from the same deployment, one level up, so they
 * must reach the browser exactly as written: through `next/link` they would
 * gain the basePath and route to a page this app does not have.
 */
export const RouterLink = forwardRef<HTMLAnchorElement, LinkComponentProps>(function RouterLink(
  { href, children, ...rest },
  ref,
) {
  if (isStorybookHref(href)) {
    return (
      <a ref={ref} href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <NextLink ref={ref} href={href} {...rest}>
      {children}
    </NextLink>
  );
});
