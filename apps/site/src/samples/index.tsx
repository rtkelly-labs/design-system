'use client';

import type { ReactNode } from 'react';
import { FinanceConsole, ContentStudio } from '@/generated/admin';
import { SaasLandingPage } from '@rtkelly13/design-system';

/**
 * The sample pages, keyed by the slug in `src/content/samples.ts`. Each is a
 * composition the package exports, rendered with its own defaults and under
 * the site's providers, so it follows the reader's level and the toast queue
 * is live.
 *
 */
const SAMPLE_PAGES: Record<string, () => ReactNode> = {
  'landing-page': () => (
    <main id="main-content" className="bg-surface-base text-content-primary">
      <SaasLandingPage />
    </main>
  ),
  'admin-dashboard': () => <FinanceConsole />,
  'content-studio': () => <ContentStudio />,
};

export function SamplePage({ slug }: { slug: string }) {
  const render = SAMPLE_PAGES[slug];
  if (!render) throw new Error(`No sample page registered for "${slug}" in src/samples/index.tsx`);
  return render();
}
