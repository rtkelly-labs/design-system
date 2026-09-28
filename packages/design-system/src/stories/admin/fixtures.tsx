import { useState } from 'react';
import {
  Database,
  FileText,
  Image,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  PenLine,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sliders,
  Users,
} from 'lucide-react';
import { AppMain, AppShell, AppSidebar, AppSidebarNav, AppTopbar } from '../../components/AppShell';
import type { AppNavItem } from '../../components/AppShell';
import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { DataTable } from '../../components/DataTable';
import { EmptyState } from '../../components/EmptyState';
import { Menu, MenuItem, MenuSeparator } from '../../components/Menu';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { useOptionalTheme } from '../../components/ThemeProvider';
import { useOptionalToast } from '../../components/Toast';
import { LEVELS } from '../../theme/levels';

// The two admin applications issue 249 asks `AppShell` to hold, with no change
// to the shell between them.
//
// Every label, figure, name and action below is a fixture. The finance console
// is what `AdminDashboardLayout` used to ship inside the package — its nav, its
// signed-in user, its KPI values, its bank-ingestion table and its `TRIGGER
// SYNC` action — kept here as demo content. The content studio shares nothing
// with it but the five `AppShell` pieces and the components on the page. Both
// are built from exported components alone. The only classes the fixtures add
// are Tailwind utilities for the stat row's grid, the finance sidebar's header
// type, and keeping a status badge on one line in a narrow topbar.

// ---------------------------------------------------------------------------
// Finance console
// ---------------------------------------------------------------------------

const FINANCE_NAV: AppNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'reconciliation', label: 'Reconciliation', icon: FileText, badge: <Badge accent="primary">3</Badge> },
  { id: 'rules', label: 'Rule engine', icon: Sliders },
  { id: 'cashflow', label: 'Cashflow forecast', icon: LineChart },
  { id: 'backups', label: 'Drive backups', icon: Database },
];

interface Ingestion {
  id: string;
  timestamp: string;
  source: string;
  count: number;
  status: 'ingested' | 'audited';
}

const INGESTIONS: Ingestion[] = [
  { id: 'chase-jul', timestamp: '2026-07-26 21:40', source: 'Chase_Checking_July.csv', count: 142, status: 'ingested' },
  { id: 'amex-jul', timestamp: '2026-07-25 14:15', source: 'Amex_Platinum_Statement.csv', count: 88, status: 'audited' },
];

const INGESTION_ACCENT = { ingested: 'success', audited: 'primary' } as const;

/**
 * The sidebar footer: a Level switch when a `ThemeProvider` is present, and
 * the signed-in user. The shell takes both as one slot — who is signed in is
 * this application's business, not the layout's.
 */
function FinanceAccount() {
  const theme = useOptionalTheme();
  return (
    <div className="flex flex-col gap-3">
      {theme && (
        <Button size="sm" bracketed onClick={theme.cycleLevel}>
          LEVEL: {LEVELS[theme.level].label.toUpperCase()}
        </Button>
      )}
      <div className="flex items-center gap-3">
        <Avatar fallback="RK" size="sm" accent="primary" />
        <div className="flex flex-col">
          <span className="font-display text-sm font-extrabold">Ryan Kelly</span>
          <span className="font-mono text-xs text-content-muted">ADMIN</span>
        </div>
      </div>
    </div>
  );
}

/**
 * `TRIGGER SYNC`. Inside a `ToastProvider` the press is acknowledged with an
 * `info` toast — the request finishes elsewhere, and the page has nothing of
 * its own to show for it yet. Without one the button still works.
 */
function SyncButton({ onSync }: { onSync?: () => void }) {
  const toast = useOptionalToast();
  return (
    <Button
      size="sm"
      variant="tertiary"
      bracketed
      onClick={() => {
        onSync?.();
        toast?.show({
          id: 'finance-sync',
          intent: 'info',
          title: 'SYNC REQUESTED',
          description: 'Records refresh when the sync completes.',
        });
      }}
    >
      <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> TRIGGER SYNC
    </Button>
  );
}

function FinanceOverview() {
  return (
    <>
      <PageHeader title="System overview" subtitle="Statements, reconciliation and backups at a glance." icon={LayoutDashboard} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard title="Net cashflow" value="+$4,280.00" change="+12.4%" changeType="positive" subtitle="vs last month" accent="primary" />
        <StatCard title="Unreconciled audits" value="3 variances" subtitle="Action required" accent="tertiary" />
        <StatCard title="Drive backup" value="Synced 10m ago" subtitle="~/Google Drive/Backup/" accent="secondary" />
      </div>
      <DataTable
        caption="Recent bank statement ingestions"
        data={INGESTIONS}
        keyExtractor={(row) => row.id}
        columns={[
          { header: 'TIMESTAMP', accessor: 'timestamp' },
          { header: 'STATEMENT SOURCE', accessor: 'source' },
          { header: 'COUNT', accessor: (row) => `${row.count} items` },
          {
            header: 'STATUS',
            accessor: (row) => <Badge accent={INGESTION_ACCENT[row.status]}>{row.status.toUpperCase()}</Badge>,
          },
          {
            header: 'ACTION',
            accessor: (row) => (
              <Button size="sm" bracketed aria-label={`View ${row.source}`}>
                VIEW
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}

export interface FinanceConsoleProps {
  /** Called when `TRIGGER SYNC` is pressed. */
  onSync?: () => void;
}

/**
 * A single-player finance admin: statement ingestion, reconciliation and
 * backups. The dashboard view carries content; every other entry is a view
 * the fixture has not built, and says so.
 */
export function FinanceConsole({ onSync }: FinanceConsoleProps) {
  const [activeId, setActiveId] = useState('dashboard');
  const current = FINANCE_NAV.find((item) => item.id === activeId);
  return (
    <AppShell
      sidebar={
        <AppSidebar
          label="Admin console"
          header={
            <div className="flex flex-col gap-1">
              <span className="font-display text-lg font-black uppercase text-accent-primary">[ ADMIN CONSOLE ]</span>
              <span className="font-mono text-xs text-content-muted">v1.2.0 • SINGLE-PLAYER</span>
            </div>
          }
          footer={<FinanceAccount />}
        >
          <AppSidebarNav label="Admin" items={FINANCE_NAV} activeId={activeId} onNavigate={setActiveId} />
        </AppSidebar>
      }
      topbar={
        <AppTopbar label="Admin console" actions={<SyncButton onSync={onSync} />}>
          <Badge accent="success" className="whitespace-nowrap">
            <ShieldCheck className="mr-1 inline h-3.5 w-3.5 align-middle" aria-hidden="true" />
            SYSTEM HEALTH: 100%
          </Badge>
          <Badge accent="primary" className="whitespace-nowrap">
            API: CONNECTED
          </Badge>
        </AppTopbar>
      }
    >
      <AppMain label={String(current?.label ?? 'Content')}>
        {activeId === 'dashboard' ? (
          <FinanceOverview />
        ) : (
          <>
            <PageHeader title={String(current?.label ?? '')} />
            <EmptyState title="Nothing here yet" description="This view is not part of the fixture." />
          </>
        )}
      </AppMain>
    </AppShell>
  );
}

// ---------------------------------------------------------------------------
// Content studio
// ---------------------------------------------------------------------------

const STUDIO_NAV: AppNavItem[] = [
  {
    id: 'content',
    label: 'Content',
    icon: PenLine,
    items: [
      { id: 'posts', label: 'Posts', badge: <Badge accent="secondary">12</Badge> },
      { id: 'pages', label: 'Pages' },
      { id: 'drafts', label: 'Drafts', badge: <Badge accent="tertiary">3</Badge> },
    ],
  },
  { id: 'media', label: 'Media library', icon: Image },
  { id: 'comments', label: 'Comments', icon: MessageSquare, badge: <Badge accent="danger">5</Badge> },
  { id: 'authors', label: 'Authors', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

interface Post {
  id: string;
  title: string;
  author: string;
  updated: string;
  state: 'published' | 'draft' | 'scheduled';
}

const POSTS: Post[] = [
  { id: 'p1', title: 'Designing for two Levels', author: 'M. Hopper', updated: '2026-09-24', state: 'published' },
  { id: 'p2', title: 'A field guide to landmarks', author: 'A. Lovelace', updated: '2026-09-23', state: 'scheduled' },
  { id: 'p3', title: 'Why the sidebar is a drawer', author: 'M. Hopper', updated: '2026-09-21', state: 'draft' },
  { id: 'p4', title: 'Release notes, week 38', author: 'K. Johnson', updated: '2026-09-19', state: 'published' },
];

const POST_ACCENT = { published: 'success', draft: 'tertiary', scheduled: 'info' } as const;

/** The account area as a `Menu` behind the signed-in editor. */
function StudioAccount() {
  return (
    <Menu
      side="top"
      trigger={
        <Button size="sm" variant="secondary">
          M. HOPPER · EDITOR
        </Button>
      }
    >
      <MenuItem>Profile</MenuItem>
      <MenuItem>Switch site</MenuItem>
      <MenuSeparator />
      <MenuItem intent="danger">Sign out</MenuItem>
    </Menu>
  );
}

function StudioPosts() {
  return (
    <>
      <PageHeader title="Posts" subtitle="Twelve posts, three drafts waiting on review." icon={FileText}>
        <Button size="sm" bracketed>
          NEW POST
        </Button>
      </PageHeader>
      <DataTable
        caption="Posts"
        data={POSTS}
        keyExtractor={(row) => row.id}
        columns={[
          { header: 'TITLE', accessor: 'title' },
          { header: 'AUTHOR', accessor: 'author' },
          { header: 'UPDATED', accessor: 'updated' },
          { header: 'STATE', accessor: (row) => <Badge accent={POST_ACCENT[row.state]}>{row.state.toUpperCase()}</Badge> },
        ]}
      />
    </>
  );
}

/**
 * A publishing CMS: a nested content tree, a media library, moderation and
 * authors. Unrelated to the finance console by construction — different nav
 * shape (a group with children), a menu for the account, a site switcher in
 * the topbar's leading slot, two actions instead of one.
 */
export function ContentStudio() {
  const [activeId, setActiveId] = useState('posts');
  const current = STUDIO_NAV.flatMap((item) => [item, ...(item.items ?? [])]).find((item) => item.id === activeId);
  return (
    <AppShell
      sidebar={
        <AppSidebar
          label="Content studio"
          header={<Badge accent="secondary">FIELD NOTES · STUDIO</Badge>}
          footer={<StudioAccount />}
        >
          <AppSidebarNav label="Content" items={STUDIO_NAV} activeId={activeId} onNavigate={setActiveId} />
        </AppSidebar>
      }
      topbar={
        <AppTopbar
          label="Content studio"
          actions={
            <>
              <Button size="sm" variant="secondary">
                PREVIEW SITE
              </Button>
              <Button size="sm" bracketed>
                PUBLISH
              </Button>
            </>
          }
        >
          <span className="font-mono text-sm font-bold uppercase">fieldnotes.example</span>
          <Badge accent="tertiary" className="whitespace-nowrap">
            3 DRAFTS
          </Badge>
        </AppTopbar>
      }
    >
      <AppMain label={String(current?.label ?? 'Content')}>
        {activeId === 'posts' ? (
          <StudioPosts />
        ) : (
          <>
            <PageHeader title={String(current?.label ?? '')} />
            <EmptyState title="Nothing here yet" description="This view is not part of the fixture." />
          </>
        )}
      </AppMain>
    </AppShell>
  );
}
