import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Activity, FolderKanban, LayoutDashboard, Settings, Users } from 'lucide-react';
import {
  AppMain,
  AppShell,
  AppSidebar,
  AppSidebarNav,
  AppTopbar,
} from '../components/AppShell';
import type { AppNavItem } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { Menu, MenuItem, MenuSeparator } from '../components/Menu';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';

const meta: Meta<typeof AppShell> = {
  title: 'Components/Layout/AppShell',
  component: AppShell,
  subcomponents: { AppSidebar, AppSidebarNav, AppTopbar, AppMain },
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    sidebar: { control: false },
    topbar: { control: false },
    children: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof AppShell>;

// The fixtures are an operations console — deliberately unrelated to the
// finance admin the shell was cut from (`SaaS/AdminDashboard`), so nothing
// here can lean on that one's content.
const NAV: AppNavItem[] = [
  { id: 'overview', label: 'Overview', href: '#overview', icon: LayoutDashboard },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderKanban,
    items: [
      { id: 'active', label: 'Active', href: '#active', badge: <Badge accent="primary">4</Badge> },
      { id: 'paused', label: 'Paused', href: '#paused' },
      { id: 'archived', label: 'Archived', href: '#archived' },
    ],
  },
  { id: 'incidents', label: 'Incidents', href: '#incidents', icon: Activity, badge: <Badge accent="danger">2</Badge> },
  { id: 'team', label: 'Team', href: '#team', icon: Users },
  { id: 'settings', label: 'Settings', href: '#settings', icon: Settings },
];

/** The account area: a slot, filled here with a `Menu`. */
function Account() {
  return (
    <Menu side="top" trigger={<Button size="sm" variant="secondary">A. LOVELACE</Button>}>
      <MenuItem>Profile</MenuItem>
      <MenuItem>Preferences</MenuItem>
      <MenuSeparator />
      <MenuItem intent="danger">Sign out</MenuItem>
    </Menu>
  );
}

function Sidebar({ activeId, onNavigate }: { activeId: string; onNavigate?: (id: string) => void }) {
  return (
    <AppSidebar label="Workspace" header={<Badge accent="secondary">OPS CONSOLE</Badge>} footer={<Account />}>
      <AppSidebarNav label="Primary" items={NAV} activeId={activeId} onNavigate={onNavigate} />
    </AppSidebar>
  );
}

function Topbar() {
  return (
    <AppTopbar
      actions={
        <Button size="sm" bracketed>
          NEW PROJECT
        </Button>
      }
    >
      <Badge accent="success">ALL SYSTEMS NORMAL</Badge>
    </AppTopbar>
  );
}

function Page() {
  return (
    <AppMain label="Active projects">
      <PageHeader title="Active projects" subtitle="Four running, one waiting on review." />
      <StatCard title="Deploys this week" value={38} change="+6" changeType="positive" />
      <Card title="Launch checklist" description="Two of five steps are still open." />
    </AppMain>
  );
}

/**
 * The whole composition, at rest: a persistent sidebar at desktop width with
 * a nested navigation tree and an account menu in its footer, a topbar with a
 * status and an action, and a page of existing components — no CSS of the
 * story's own. Below desktop width the sidebar collapses behind the topbar's
 * toggle; `tests/visual.spec.ts` asserts that collapsed state in
 * `MOBILE_CASES`.
 */
export const Default: Story = {
  render: (args) => (
    <AppShell {...args} sidebar={<Sidebar activeId="active" />} topbar={<Topbar />}>
      <Page />
    </AppShell>
  ),
};

/**
 * The same shell asked to open its sidebar on load. At desktop width that
 * changes nothing — the sidebar is already on the page, and the drawer never
 * opens there — and below it the sidebar is a left `Drawer` over the page.
 * `tests/visual.spec.ts` asserts this one story at both widths, which is what
 * shows the two layouts are one component.
 */
export const SidebarOpen: Story = {
  args: { defaultSidebarOpen: true },
  render: (args) => (
    <AppShell {...args} sidebar={<Sidebar activeId="active" />} topbar={<Topbar />}>
      <Page />
    </AppShell>
  ),
};

/**
 * Interactive: the entries are buttons reporting through `onNavigate`, the
 * way a client-side router takes over, and the page follows the choice.
 * Narrow the viewport and choose from the drawer — it closes, and focus
 * returns to the toggle.
 */
export const Navigating: Story = {
  render: () => <NavigatingExample />,
};

/**
 * No sidebar: an application with nothing to navigate between is a topbar
 * and a page, and the toggle goes with the sidebar rather than opening
 * nothing.
 */
export const WithoutSidebar: Story = {
  render: (args) => (
    <AppShell {...args} topbar={<AppTopbar actions={<Button size="sm">HELP</Button>}>SETUP</AppTopbar>}>
      <AppMain label="Setup">
        <EmptyState title="No workspace yet" description="Create one to start adding projects." />
      </AppMain>
    </AppShell>
  ),
};

// Router-style entries: no `href`, so each is a button that reports its id.
const VIEWS: AppNavItem[] = NAV.map(({ href: _href, items, ...item }) => ({
  ...item,
  items: items?.map(({ href: _childHref, ...child }) => child),
}));

function NavigatingExample() {
  const [activeId, setActiveId] = useState('overview');
  const current = VIEWS.flatMap((item) => [item, ...(item.items ?? [])]).find((item) => item.id === activeId);
  return (
    <AppShell
      sidebar={
        <AppSidebar label="Workspace" header={<Badge accent="secondary">OPS CONSOLE</Badge>} footer={<Account />}>
          <AppSidebarNav label="Primary" items={VIEWS} activeId={activeId} onNavigate={setActiveId} />
        </AppSidebar>
      }
      topbar={<Topbar />}
    >
      <AppMain label={String(current?.label ?? 'Content')}>
        <PageHeader title={String(current?.label ?? '')} subtitle="Chosen from the sidebar." />
      </AppMain>
    </AppShell>
  );
}
