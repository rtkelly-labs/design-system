'use client';

import NextLink from 'next/link';
import { forwardRef } from 'react';
import type { LinkComponentProps } from '@/ds';

/**
 * `next/link`, in the shape the package's `LinkProvider` asks for. Every
 * internal link the design system renders — sidebar, pager, header brand, nav
 * items — goes through this, so navigation is client-side and prefetched.
 */
export const RouterLink = forwardRef<HTMLAnchorElement, LinkComponentProps>(function RouterLink(
  { href, ...rest },
  ref,
) {
  return <NextLink ref={ref} href={href} {...rest} />;
});
