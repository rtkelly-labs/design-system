import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRef } from 'react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppMain, AppShell, AppSidebar, AppSidebarNav, AppTopbar } from './AppShell';
import type { AppNavItem } from './AppShell';
import { Button } from './Button';
import { Menu, MenuItem } from './Menu';
import { ThemeProvider } from './ThemeProvider';

const NAV: AppNavItem[] = [
  { id: 'overview', label: 'Overview', href: '/overview' },
  {
    id: 'projects',
    label: 'Projects',
    items: [
      { id: 'active', label: 'Active', href: '/projects/active', badge: <span>4</span> },
      { id: 'archived', label: 'Archived', href: '/projects/archived' },
    ],
  },
  { id: 'settings', label: 'Settings', href: '/settings' },
];

// A controllable `matchMedia`: jsdom ships none, so without this the shell
// reads every test as narrow. `set` flips the width and fires the listeners
// the way a resize past the breakpoint does.
function mockWidth(wide: boolean) {
  const listeners = new Set<() => void>();
  let matches = wide;
  const query = {
    get matches() {
      return matches;
    },
    media: '(min-width: 64rem)',
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  };
  const spy = vi.fn(() => query);
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: spy });
  return {
    spy,
    set(next: boolean) {
      matches = next;
      act(() => listeners.forEach((fn) => fn()));
    },
  };
}

function Shell({
  children,
  ...props
}: Partial<React.ComponentProps<typeof AppShell>> & { children?: ReactNode }) {
  return (
    <AppShell
      sidebar={
        <AppSidebar label="Workspace" header={<strong>ACME</strong>} footer={<span>Account slot</span>}>
          <AppSidebarNav label="Primary" items={NAV} activeId="active" />
        </AppSidebar>
      }
      topbar={<AppTopbar actions={<Button size="sm">NEW</Button>}>Projects</AppTopbar>}
      {...props}
    >
      {children ?? <AppMain>Page body</AppMain>}
    </AppShell>
  );
}

describe('AppShell', () => {
  afterEach(() => {
    // Leave jsdom as it was found: no matchMedia.
    delete (window as { matchMedia?: unknown }).matchMedia;
    document.documentElement.removeAttribute('data-theme');
  });

  describe('landmarks', () => {
    it('renders one main, a labelled complementary sidebar, a labelled banner and a labelled nav', () => {
      render(<Shell />);

      expect(screen.getAllByRole('main')).toHaveLength(1);
      expect(screen.getByRole('main', { name: 'Content' })).toBeDefined();
      // `hidden: true`: the persistent column is `display: none` below `lg`
      // in the real stylesheet, which jsdom does not load, but the landmark
      // and its name are what is being asserted.
      const aside = screen.getByRole('complementary', { name: 'Workspace', hidden: true });
      expect(aside.tagName).toBe('ASIDE');
      const header = screen.getByRole('banner', { name: 'Application' });
      expect(header.tagName).toBe('HEADER');
      expect(within(aside).getByRole('navigation', { name: 'Primary' }).tagName).toBe('NAV');
    });

    it('puts every accessible name on the element carrying the role', () => {
      render(<Shell />);

      expect(document.querySelector('aside')?.getAttribute('aria-label')).toBe('Workspace');
      expect(document.querySelector('header')?.getAttribute('aria-label')).toBe('Application');
      expect(document.querySelector('main')?.getAttribute('aria-label')).toBe('Content');
      expect(document.querySelector('nav')?.getAttribute('aria-label')).toBe('Primary');
    });

    it('takes a caller label for the topbar and main', () => {
      render(
        <AppShell topbar={<AppTopbar label="Console">x</AppTopbar>}>
          <AppMain label="Deployments">y</AppMain>
        </AppShell>,
      );
      expect(screen.getByRole('banner', { name: 'Console' })).toBeDefined();
      expect(screen.getByRole('main', { name: 'Deployments' })).toBeDefined();
    });

    it('keeps one main with the drawer open, since the drawer holds only the sidebar', async () => {
      render(<Shell defaultSidebarOpen />);
      await screen.findByRole('dialog');
      expect(document.querySelectorAll('main')).toHaveLength(1);
    });
  });

  describe('navigation tree', () => {
    it('renders the consumer tree to any depth, links as links', () => {
      render(<Shell />);
      const nav = screen.getByRole('navigation', { name: 'Primary', hidden: true });

      expect(within(nav).getByRole('link', { name: 'Overview', hidden: true }).getAttribute('href')).toBe('/overview');
      // A group with no href and no handler is a heading, not a dead control.
      expect(within(nav).queryByRole('button', { name: 'Projects', hidden: true })).toBeNull();
      expect(within(nav).getByText('Projects')).toBeDefined();
      // Its children are a nested list inside its own list item.
      const active = within(nav).getByRole('link', { name: /^Active/, hidden: true });
      expect(active.closest('ul')?.parentElement?.closest('ul')).not.toBeNull();
    });

    it('marks the active entry aria-current="page" on the link itself, and no other', () => {
      render(<Shell />);
      const current = document.querySelectorAll('aside [aria-current]');
      expect(current).toHaveLength(1);
      expect(current[0].tagName).toBe('A');
      expect(current[0].getAttribute('aria-current')).toBe('page');
      expect(current[0].textContent).toContain('Active');
    });

    it('renders an entry without an href as a button that reports its id', () => {
      const onNavigate = vi.fn();
      render(
        <AppSidebarNav
          label="Views"
          onNavigate={onNavigate}
          items={[
            { id: 'board', label: 'Board' },
            { id: 'list', label: 'List' },
          ]}
          activeId="board"
        />,
      );
      const board = screen.getByRole('button', { name: 'Board' });
      expect(board.getAttribute('type')).toBe('button');
      expect(board.getAttribute('aria-current')).toBe('page');
      fireEvent.click(screen.getByRole('button', { name: 'List' }));
      expect(onNavigate).toHaveBeenCalledWith('list');
    });

    it('treats an empty href as present: a same-document link, not a button', () => {
      render(<AppSidebarNav label="Views" items={[{ id: 'top', label: 'Top', href: '' }]} />);
      // Queried by element rather than role: the testing library's role map
      // does not count `<a href="">` as a link, though browsers do.
      const entry = screen.getByText('Top').closest('a, button');
      expect(entry?.tagName).toBe('A');
      expect(entry?.getAttribute('href')).toBe('');
    });

    it('renders an icon component beside the label, hidden from assistive technology', () => {
      const Icon = ({ className }: { className?: string }) => <svg data-testid="icon" className={className} />;
      render(<AppSidebarNav label="Views" items={[{ id: 'a', label: 'Alpha', href: '/a', icon: Icon }]} />);
      // Hidden by a wrapper the nav owns, so it holds for an icon component
      // that drops unknown props as well as for one that forwards them.
      const icon = screen.getByTestId('icon');
      expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
      expect(screen.getByRole('link', { name: 'Alpha' })).toBeDefined();
    });

    it('shows an optional heading without it replacing the landmark name', () => {
      render(<AppSidebarNav label="Primary" heading="WORKSPACE" items={NAV} />);
      expect(screen.getByRole('navigation', { name: 'Primary' })).toBeDefined();
      expect(screen.getByText('WORKSPACE')).toBeDefined();
    });
  });

  describe('the off-canvas sidebar below desktop width', () => {
    it('offers a labelled toggle that reports its state', () => {
      render(<Shell />);
      const toggle = screen.getByRole('button', { name: 'Open navigation' });
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(toggle.getAttribute('aria-haspopup')).toBe('dialog');
      expect(toggle.className).toContain('lg:hidden');
      // Reachable: a real button in the tab order.
      expect(toggle.tagName).toBe('BUTTON');
      expect(toggle.tabIndex).toBe(0);
    });

    it('takes a caller name for the toggle', () => {
      render(
        <AppShell
          sidebar={<AppSidebar label="Menu">x</AppSidebar>}
          topbar={<AppTopbar sidebarToggleLabel="Open menu">x</AppTopbar>}
        >
          <AppMain>y</AppMain>
        </AppShell>,
      );
      expect(screen.getByRole('button', { name: 'Open menu' })).toBeDefined();
    });

    it('omits the toggle when the shell has no sidebar', () => {
      render(
        <AppShell topbar={<AppTopbar>Title</AppTopbar>}>
          <AppMain>y</AppMain>
        </AppShell>,
      );
      expect(screen.queryByRole('button', { name: 'Open navigation' })).toBeNull();
    });

    it('opens the sidebar in a left drawer titled by the sidebar label, moving focus in and back on close', async () => {
      render(<Shell />);
      const toggle = screen.getByRole('button', { name: 'Open navigation' });
      toggle.focus();
      fireEvent.click(toggle);

      const drawer = await screen.findByRole('dialog', { name: '[ Workspace ]' });
      expect(drawer.getAttribute('data-placement')).toBe('left');
      await waitFor(() => expect(drawer.contains(document.activeElement)).toBe(true));
      expect(toggle.getAttribute('aria-expanded')).toBe('true');

      // The same tree, header and account slot, inside the drawer.
      expect(within(drawer).getByRole('navigation', { name: 'Primary' })).toBeDefined();
      expect(within(drawer).getByText('ACME')).toBeDefined();
      expect(within(drawer).getByText('Account slot')).toBeDefined();

      fireEvent.keyDown(drawer, { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(toggle));
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
    });

    it('keeps the drawer close control when the account slot takes the footer', async () => {
      render(<Shell defaultSidebarOpen />);
      const drawer = await screen.findByRole('dialog');
      expect(within(drawer).getByRole('button', { name: 'Close drawer' })).toBeDefined();
      expect(within(drawer).queryByRole('button', { name: 'CLOSE' })).toBeNull();
    });

    it('closes the drawer when an entry inside it is chosen', async () => {
      const onNavigate = vi.fn();
      const onSidebarOpenChange = vi.fn();
      render(
        <AppShell
          defaultSidebarOpen
          onSidebarOpenChange={onSidebarOpenChange}
          sidebar={
            <AppSidebar label="Workspace">
              <AppSidebarNav
                label="Primary"
                items={[{ id: 'board', label: 'Board' }, { id: 'settings', label: 'Settings' }]}
                onNavigate={onNavigate}
              />
            </AppSidebar>
          }
          topbar={<AppTopbar>t</AppTopbar>}
        >
          <AppMain>y</AppMain>
        </AppShell>,
      );
      const drawer = await screen.findByRole('dialog');
      fireEvent.click(within(drawer).getByRole('button', { name: 'Settings' }));

      expect(onNavigate).toHaveBeenCalledWith('settings');
      expect(onSidebarOpenChange).toHaveBeenCalledWith(false);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    });

    it('can be controlled', async () => {
      const onSidebarOpenChange = vi.fn();
      const { rerender } = render(<Shell sidebarOpen={false} onSidebarOpenChange={onSidebarOpenChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
      expect(onSidebarOpenChange).toHaveBeenCalledWith(true);
      // Controlled: nothing opens until the caller says so.
      expect(screen.queryByRole('dialog')).toBeNull();

      rerender(<Shell sidebarOpen onSidebarOpenChange={onSidebarOpenChange} />);
      expect(await screen.findByRole('dialog')).toBeDefined();
    });
  });

  describe('at desktop width', () => {
    it('never opens the drawer, even when asked to', () => {
      mockWidth(true);
      render(<Shell defaultSidebarOpen />);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByRole('button', { name: 'Open navigation' }).getAttribute('aria-expanded')).toBe('false');
      expect(screen.getByRole('complementary', { name: 'Workspace' })).toBeDefined();
    });

    it('shows the persistent column from lg up and hides it below', () => {
      render(<Shell />);
      const aside = document.querySelector('aside') as HTMLElement;
      expect(aside.className).toMatch(/(^|\s)hidden(\s|$)/);
      expect(aside.className).toContain('lg:flex');
    });

    it('closes an open drawer when the viewport widens past the breakpoint, and keeps it closed on narrowing', async () => {
      const width = mockWidth(false);
      const onSidebarOpenChange = vi.fn();
      render(<Shell defaultSidebarOpen onSidebarOpenChange={onSidebarOpenChange} />);
      await screen.findByRole('dialog');

      width.set(true);
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(onSidebarOpenChange).toHaveBeenCalledWith(false);

      width.set(false);
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('reads the same breakpoint the stylesheet shows the column at', () => {
      const { spy } = mockWidth(true);
      render(<Shell />);
      // Tailwind v4's `lg` is 64rem; a different number here leaves a band of
      // widths with both a persistent sidebar and an open drawer, or neither.
      expect(spy).toHaveBeenCalledWith('(min-width: 64rem)');
    });
  });

  describe('outside a shell', () => {
    it('renders the persistent column alone, with no drawer and no toggle', () => {
      render(
        <AppSidebar label="Workspace">
          <AppSidebarNav label="Primary" items={NAV} />
        </AppSidebar>,
      );
      expect(screen.getByRole('complementary', { name: 'Workspace', hidden: true })).toBeDefined();
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('renders a topbar with no toggle', () => {
      render(<AppTopbar>Title</AppTopbar>);
      expect(screen.queryByRole('button')).toBeNull();
    });
  });

  describe('the scoped Level', () => {
    it('carries a scoped provider Level into the portalled drawer', async () => {
      document.documentElement.setAttribute('data-theme', 'midnight');
      render(
        <ThemeProvider scoped defaultLevel="sketch">
          <Shell defaultSidebarOpen />
        </ThemeProvider>,
      );
      const drawer = await screen.findByRole('dialog');
      expect(drawer.closest('[data-theme]')?.getAttribute('data-theme')).toBe('sketch');
    });

    it('carries it into an account menu opened from inside the drawer', async () => {
      document.documentElement.setAttribute('data-theme', 'midnight');
      render(
        <ThemeProvider scoped defaultLevel="sketch">
          <AppShell
            defaultSidebarOpen
            sidebar={
              <AppSidebar
                label="Workspace"
                footer={
                  <Menu defaultOpen trigger={<Button size="sm">ACCOUNT</Button>}>
                    <MenuItem>Sign out</MenuItem>
                  </Menu>
                }
              >
                <AppSidebarNav label="Primary" items={NAV} />
              </AppSidebar>
            }
          >
            <AppMain>y</AppMain>
          </AppShell>
        </ThemeProvider>,
      );
      await screen.findByRole('dialog');
      // Found at all is part of the assertion: the menu is open on load, so
      // an empty result is a failure, not a pass.
      const items = await screen.findAllByText('Sign out');
      expect(items.length).toBeGreaterThan(0);
      for (const item of items) {
        expect(item.closest('[data-theme]')?.getAttribute('data-theme')).toBe('sketch');
      }
    });
  });

  describe('component contract', () => {
    it('forwards refs to the element each piece renders', () => {
      const shell = createRef<HTMLDivElement>();
      const aside = createRef<HTMLElement>();
      const nav = createRef<HTMLElement>();
      const header = createRef<HTMLElement>();
      const main = createRef<HTMLElement>();
      render(
        <AppShell
          ref={shell}
          sidebar={
            <AppSidebar ref={aside} label="S">
              <AppSidebarNav ref={nav} label="N" items={NAV} />
            </AppSidebar>
          }
          topbar={<AppTopbar ref={header}>t</AppTopbar>}
        >
          <AppMain ref={main}>m</AppMain>
        </AppShell>,
      );
      expect(shell.current?.getAttribute('data-slot')).toBe('app-shell');
      expect(aside.current?.tagName).toBe('ASIDE');
      expect(nav.current?.tagName).toBe('NAV');
      expect(header.current?.tagName).toBe('HEADER');
      expect(main.current?.tagName).toBe('MAIN');
    });

    it('merges a caller class and style, and spreads other props, on every piece', () => {
      render(
        <AppShell
          className="opacity-90"
          style={{ outline: '1px solid' }}
          data-testid="shell"
          sidebar={
            <AppSidebar label="S" className="opacity-80" style={{ outline: '2px solid' }} data-testid="aside">
              <AppSidebarNav label="N" items={NAV} className="opacity-70" data-testid="nav" />
            </AppSidebar>
          }
          topbar={<AppTopbar className="opacity-60" style={{ outline: '3px solid' }} data-testid="bar">t</AppTopbar>}
        >
          <AppMain className="opacity-50" style={{ outline: '4px solid' }} data-testid="main">m</AppMain>
        </AppShell>,
      );
      const shell = screen.getByTestId('shell');
      expect(shell.className).toContain('opacity-90');
      expect(shell.className).toContain('min-h-screen');
      expect(shell.style.outline).toBe('1px solid');

      const aside = screen.getByTestId('aside');
      expect(aside.className).toContain('opacity-80');
      expect(aside.className).toContain('border-r-4');
      expect(aside.style.outline).toBe('2px solid');

      expect(screen.getByTestId('nav').className).toContain('opacity-70');
      expect(screen.getByTestId('bar').className).toContain('opacity-60');
      expect(screen.getByTestId('bar').style.outline).toBe('3px solid');
      expect(screen.getByTestId('main').className).toContain('opacity-50');
      expect(screen.getByTestId('main').style.outline).toBe('4px solid');
    });

    it('lets a caller aria-label win over the default landmark name', () => {
      render(<AppMain aria-label="Override">m</AppMain>);
      expect(screen.getByRole('main', { name: 'Override' })).toBeDefined();
    });
  });

  // The rule the issue is written around: if a domain word appears in the
  // reusable implementation, the extraction has not happened.
  it('names no domain and no signed-in user in its implementation', () => {
    const source = readFileSync(path.join(__dirname, 'AppShell.tsx'), 'utf8').toLowerCase();
    for (const word of ['transaction', 'finance', 'ynab', 'reconcil', 'ryan', 'kelly', 'bank', 'cashflow']) {
      expect(source).not.toContain(word);
    }
  });
});
