'use client';

import type { ReactNode } from 'react';
import { FinanceConsole, ContentStudio } from '@/generated/admin';
import KanbanBoard from '@/examples/kanban/board';
import InboxApp from '@/examples/inbox/app';
import RepositorySettings from '@/examples/settings/repository-settings';
import CalendarApp from '@/examples/calendar/app';
import EditorWorkbench from '@/examples/editor/workbench';
import { SaasLandingPage } from '@rtkelly-labs/design-system';

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
  kanban: () => <KanbanBoard />,
  inbox: () => (
    <main id="main-content">
      <InboxApp />
    </main>
  ),
  settings: () => (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 p-4 sm:p-6">
      <RepositorySettings />
    </div>
  ),
  calendar: () => (
    <main id="main-content">
      <CalendarApp />
    </main>
  ),
  editor: () => <EditorWorkbench />,
};

export function SamplePage({ slug }: { slug: string }) {
  const render = SAMPLE_PAGES[slug];
  if (!render) throw new Error(`No sample page registered for "${slug}" in src/samples/index.tsx`);
  return render();
}
