import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToastProvider } from '../components/Toast';
import { ContentStudio as ContentStudioApp, FinanceConsole as FinanceConsoleApp } from './admin/fixtures';

/**
 * Two admin applications on one `AppShell` (issue 249), with no change to the
 * shell between them. There is no admin component: `AdminDashboardLayout`
 * was one application's content wrapped around a layout, and the layout is
 * now `Components/Layout/AppShell`. The content lives in
 * `stories/admin/fixtures.tsx`.
 */
const meta: Meta = {
  title: 'SaaS/AdminDashboard',
  tags: ['experimental'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

/**
 * The finance admin `AdminDashboardLayout` used to ship: its navigation, its
 * signed-in user, its KPI values, its bank-ingestion table and `TRIGGER SYNC`,
 * now fixtures on `AppShell`. Mounted inside a `ToastProvider`, the way an
 * application would, so a sync is acknowledged with an `info` toast. Follows
 * the toolbar's Level, so the accessibility suite axes it on both.
 */
export const FinanceConsole: Story = {
  render: () => (
    <ToastProvider>
      <FinanceConsoleApp />
    </ToastProvider>
  ),
};

/**
 * A publishing CMS on the same shell: a nested content tree, a `Menu` for the
 * account, a site name and draft count in the topbar's leading slot, two
 * actions and a posts table. Nothing it needs was added to `AppShell` for it.
 */
export const ContentStudio: Story = {
  render: () => <ContentStudioApp />,
};
