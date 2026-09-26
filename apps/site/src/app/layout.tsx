import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Providers } from '@/components/chrome/Providers';
import { ThemeInitScript } from '@/components/chrome/ThemeInitScript';
import { searchIndex } from '@/content/registry';

export const metadata: Metadata = {
  title: { default: 'RTK / DS: a brutalist design system', template: '%s · RTK / DS' },
  description:
    'Components, levels and tokens for ryankelly.dev: zero radius, hard offset shadows, colour by role, contrast checked in CI.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

/**
 * The root layout is a Server Component and stays one. Everything interactive
 * enters through `Providers`, the single client boundary at the root, and the
 * search index is built here, at build time, from the page registry.
 *
 * `data-theme="midnight"` is the no-JavaScript default; the init script
 * replaces it before first paint, which is why React is told not to warn when
 * the attribute it hydrates differs from the one it rendered.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="midnight" suppressHydrationWarning>
      <head>
        <ThemeInitScript />
      </head>
      <body className="bg-surface-base text-content-primary">
        <Providers search={searchIndex()}>{children}</Providers>
      </body>
    </html>
  );
}
