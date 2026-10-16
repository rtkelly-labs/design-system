'use client';

import type { ReactNode } from 'react';
import { FinanceConsole, ContentStudio } from '@/generated/admin';
import KanbanBoard from '@/examples/kanban/board';
import InboxApp from '@/examples/inbox/app';
import ApiKeys from '@/examples/settings/api-keys';
import DangerZone from '@/examples/settings/danger-zone';
import RepositorySettings from '@/examples/settings/repository-settings';
import CalendarApp from '@/examples/calendar/app';
import EditorWorkbench from '@/examples/editor/workbench';
import { SaasLandingPage } from '@rtkelly13/design-system';

/**
 * The sample pages, keyed by the slug in `src/content/samples.ts`. Each is a
 * composition the package exports, rendered with its own defaults and under
 * the site's providers, so it follows the reader's level and the toast queue
 * is live.
 *
 * **None of these renders a `<main>`.** The route
 * (`app/examples/[slug]/page.tsx`) owns the page's one
 * `<main id="main-content">` and puts every sample inside it, so a sample is a
 * composition and never a document. A sample built on `AppShell` passes
 * `mainAs="div"` so its `AppMain` hands that landmark back.
 */
const SAMPLE_PAGES: Record<string, () => ReactNode> = {
  'landing-page': () => <SaasLandingPage />,
  'admin-dashboard': () => <FinanceConsole mainAs="div" />,
  'content-studio': () => <ContentStudio mainAs="div" />,
  kanban: () => <KanbanBoard />,
  inbox: () => <InboxApp />,
  settings: () => (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 p-4 sm:p-6">
      <RepositorySettings />
      <ApiKeys />
      <DangerZone />
    </div>
  ),
  calendar: () => <CalendarApp />,
  editor: () => <EditorWorkbench />,
};

export function SamplePage({ slug }: { slug: string }) {
  const render = SAMPLE_PAGES[slug];
  if (!render) throw new Error(`No sample page registered for "${slug}" in src/samples/index.tsx`);
  return render();
}
