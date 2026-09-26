'use client';

import type { ReactNode } from 'react';
import { AdminDashboardLayout, SaasLandingPage } from '@rtkelly13/design-system';

/**
 * The sample pages, keyed by the slug in `src/content/samples.ts`. Each is a
 * composition the package exports, rendered with its own defaults and under
 * the site's providers, so it follows the reader's level and the toast queue
 * is live.
 *
 * `SaasLandingPage` has no `<main>` of its own and `AdminDashboardLayout`
 * does, so only the first is wrapped.
 */
const SAMPLE_PAGES: Record<string, () => ReactNode> = {
  'landing-page': () => (
    <main id="main-content" className="bg-surface-base text-content-primary">
      <SaasLandingPage />
    </main>
  ),
  // A fixed 280px rail and no narrow layout, so on a phone the page scrolls
  // sideways. Left visible on purpose: issue 249 replaces it with two admins on
  // `AppShell`, and this page should show the package as it is.
  'admin-dashboard': () => <AdminDashboardLayout />,
};

export function SamplePage({ slug }: { slug: string }) {
  const render = SAMPLE_PAGES[slug];
  if (!render) throw new Error(`No sample page registered for "${slug}" in src/samples/index.tsx`);
  return render();
}
