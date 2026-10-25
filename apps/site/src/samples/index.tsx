'use client';

import type { ReactNode } from 'react';
import { FinanceConsole, ContentStudio } from '@/generated/admin';

import { DEFAULT_PULL_REQUEST, DEFAULT_REVIEW_REPORT, ObservabilityConsole, PullRequestPage, ReviewReportPage, SaasLandingPage } from '@rtkelly13/design-system';

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
  observability: () => <ObservabilityConsole />,
  'review-report': () => (
    <main id="main-content" className="bg-surface-base text-content-primary">
      <ReviewReportPage report={DEFAULT_REVIEW_REPORT} />
    </main>
  ),
  'pull-request': () => <PullRequestPage id="main-content" pullRequest={DEFAULT_PULL_REQUEST} />,
};

export function SamplePage({ slug }: { slug: string }) {
  const render = SAMPLE_PAGES[slug];
  if (!render) throw new Error(`No sample page registered for "${slug}" in src/samples/index.tsx`);
  return render();
}
