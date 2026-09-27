import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { Menu as MenuIcon } from 'lucide-react';
import { recipe } from '../lib/recipe';
import { Button } from './Button';
import { Drawer } from './Drawer';

// The width at which the sidebar stops being off-canvas and stays on the page.
// Tailwind's `lg` step, written as the same query so the CSS that shows the
// persistent sidebar and the script that suppresses the drawer agree on one
// number — a gap between them would leave a band of widths with both, or
// neither.
const WIDE_QUERY = '(min-width: 64rem)';

function canMatchMedia(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

function subscribeToWidth(onChange: () => void): () => void {
  if (!canMatchMedia()) return () => {};
  const query = window.matchMedia(WIDE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function isWide(): boolean {
  return canMatchMedia() && window.matchMedia(WIDE_QUERY).matches;
}

// The server renders narrow: the persistent sidebar is shown by CSS alone, so
// the only thing a narrow first paint decides is that no drawer is open yet.
function isWideOnServer(): boolean {
  return false;
}

interface AppShellContextValue {
  /** Whether `AppShell` was given a sidebar, so the topbar knows to offer a toggle. */
  hasSidebar: boolean;
  /** The off-canvas sidebar is open. Always false at desktop width. */
  drawerOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

const shell = recipe({
  slots: {
    root: 'flex min-h-screen bg-surface-base font-sans text-content-primary',
    column: 'flex min-w-0 flex-1 flex-col',
  },
});

export interface AppShellProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  /**
   * The navigation column — an `AppSidebar`. Persistent at desktop width;
   * below it, the same content opens off-canvas in a `Drawer` from the
   * topbar's toggle. Omit it for an application with no navigation, and the
   * toggle goes with it.
   */
  sidebar?: ReactNode;
  /** The bar above the content — an `AppTopbar`. */
  topbar?: ReactNode;
  /**
   * The page — an `AppMain`, which is the one `<main>` landmark. The shell
   * does not render `<main>` itself, so a page never ends up with two.
   */
  children: ReactNode;
  /**
   * Whether the off-canvas sidebar is open, controlled. Only means anything
   * below desktop width, where the sidebar is off-canvas; leave it unset and
   * the shell keeps its own state.
   */
  sidebarOpen?: boolean;
  /** Open the off-canvas sidebar on first render, uncontrolled — for a story or a walkthrough. */
  defaultSidebarOpen?: boolean;
  /**
   * Called with the next open state: the toggle, a dismissal, a navigation
   * from inside the drawer, or the viewport widening past the breakpoint.
   */
  onSidebarOpenChange?: (open: boolean) => void;
  /** Merged into the root's classes. */
  className?: string;
}

/**
 * The application layout: a navigation column, a bar, and the page.
 *
 * The *Application layout* capability (#247). Five pieces that compose into a
 * working app with no CSS of the consumer's own:
 *
 * - `AppShell` — the frame, and the owner of the sidebar's open state.
 * - `AppSidebar` — a labelled `<aside>` at desktop width; below it, the same
 *   content in a left `Drawer`, which brings focus in on open, traps it, and
 *   returns it to the toggle on close.
 * - `AppSidebarNav` — a labelled `<nav>` over a navigation tree the consumer
 *   supplies, of any depth.
 * - `AppTopbar` — the `<header>`, with the sidebar toggle below desktop width,
 *   a leading slot for a title or status, and an `actions` slot.
 * - `AppMain` — the single `<main>`.
 *
 * The account area is a slot — `AppSidebar`'s `footer` — rather than a user
 * prop with a name and an avatar: what an application shows about who is
 * signed in, if anyone is, is the application's business. The shell makes no
 * assumption about the domain it is holding either; the navigation, the
 * status, the actions and the content are all supplied.
 *
 * @example
 * ```tsx
 * <AppShell
 *   sidebar={
 *     <AppSidebar label="Workspace" header={<strong>ACME</strong>} footer={<AccountMenu />}>
 *       <AppSidebarNav label="Primary" items={nav} activeId="projects" />
 *     </AppSidebar>
 *   }
 *   topbar={<AppTopbar actions={<Button size="sm">NEW</Button>}>PROJECTS</AppTopbar>}
 * >
 *   <AppMain>…</AppMain>
 * </AppShell>
 * ```
 */
export const AppShell = forwardRef<HTMLDivElement, AppShellProps>(function AppShell(
  {
    sidebar,
    topbar,
    children,
    sidebarOpen,
    defaultSidebarOpen = false,
    onSidebarOpenChange,
    className,
    ...props
  },
  ref,
) {
  const styles = shell();
  const [ownOpen, setOwnOpen] = useState(defaultSidebarOpen);
  const open = sidebarOpen ?? ownOpen;
  const wide = useSyncExternalStore(subscribeToWidth, isWide, isWideOnServer);
  const hasSidebar = sidebar != null && sidebar !== false;
  // One derived value, read everywhere: the drawer, the toggle's
  // `aria-expanded` and the context all ask the same question of the same
  // inputs, so they cannot disagree about whether the drawer is showing.
  const drawerOpen = hasSidebar && open && !wide;

  // The latest callback, read at call time, so `setSidebarOpen` keeps one
  // identity for as long as the shell is controlled the same way — a caller
  // passing an inline arrow would otherwise re-run the effect below on every
  // render and report the same close over and over.
  const onChange = useRef(onSidebarOpenChange);
  useEffect(() => {
    onChange.current = onSidebarOpenChange;
  });
  const controlled = sidebarOpen !== undefined;

  const setSidebarOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setOwnOpen(next);
      onChange.current?.(next);
    },
    [controlled],
  );

  // Widening past the breakpoint with the drawer open closes it, rather than
  // leaving it to reappear the next time the window narrows.
  useEffect(() => {
    if (wide && open) setSidebarOpen(false);
  }, [wide, open, setSidebarOpen]);

  const context = useMemo(
    () => ({ hasSidebar, drawerOpen, setSidebarOpen }),
    [hasSidebar, drawerOpen, setSidebarOpen],
  );

  return (
    <AppShellContext.Provider value={context}>
      <div ref={ref} data-slot="app-shell" className={styles.root({ class: className })} {...props}>
        {sidebar}
        <div data-slot="app-shell-column" className={styles.column()}>
          {topbar}
          {children}
        </div>
      </div>
    </AppShellContext.Provider>
  );
});

const sidebarStyles = recipe({
  slots: {
    aside:
      'hidden w-72 shrink-0 flex-col border-r-4 border-edge-strong bg-surface-base '
      + 'lg:sticky lg:top-0 lg:flex lg:h-screen',
    header: 'border-b-2 border-edge-strong px-6 py-5',
    body: 'flex-1 overflow-y-auto px-4 py-5',
    footer: 'border-t-2 border-edge-strong px-4 py-4',
    drawerHeader: 'mb-5 border-b-2 border-edge-strong pb-4',
  },
});

export interface AppSidebarProps extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> {
  /**
   * The sidebar's accessible name — the `<aside>` landmark's label at
   * desktop width, and the drawer's title below it. Required: an unlabelled
   * complementary region and a dialog announced as "dialog" both leave a
   * screen reader user guessing.
   */
  label: string;
  /** Above the navigation: the application's name or mark. */
  header?: ReactNode;
  /** The navigation — normally one or more `AppSidebarNav`. */
  children: ReactNode;
  /**
   * Below the navigation: the account area, as a slot. A `Menu` behind an
   * `Avatar`, a sign-in link, or nothing. In the drawer it takes the place of
   * the default close button; the drawer's own close control stays.
   */
  footer?: ReactNode;
  /** Merged into the `<aside>`'s classes. */
  className?: string;
}

/**
 * The navigation column: a labelled `<aside>` at desktop width, a left
 * `Drawer` below it.
 *
 * The content is written once and rendered in whichever of the two the
 * viewport calls for. The persistent column is hidden by CSS below `lg`, which
 * takes it out of the accessibility tree too; the drawer only exists while it
 * is open, and it never opens at desktop width. Outside an `AppShell` there is
 * no open state to read, so only the persistent column renders.
 */
export const AppSidebar = forwardRef<HTMLElement, AppSidebarProps>(function AppSidebar(
  { label, header, children, footer, className, ...props },
  ref,
) {
  const styles = sidebarStyles();
  const context = useContext(AppShellContext);

  return (
    <>
      <aside
        ref={ref}
        aria-label={label}
        data-slot="app-sidebar"
        className={styles.aside({ class: className })}
        {...props}
      >
        {header != null && <div data-slot="app-sidebar-header" className={styles.header()}>{header}</div>}
        <div data-slot="app-sidebar-body" className={styles.body()}>{children}</div>
        {footer != null && <div data-slot="app-sidebar-footer" className={styles.footer()}>{footer}</div>}
      </aside>
      {context && (
        <Drawer
          isOpen={context.drawerOpen}
          onClose={() => context.setSidebarOpen(false)}
          placement="left"
          title={label}
          footer={footer ?? undefined}
        >
          {header != null && <div className={styles.drawerHeader()}>{header}</div>}
          {children}
        </Drawer>
      )}
    </>
  );
});

/**
 * One entry in the navigation tree. The tree is the consumer's: any labels,
 * any depth, links or actions.
 */
export interface AppNavItem {
  /** Unique within the tree. Matched against `activeId`, and passed to `onNavigate`. */
  id: string;
  /** What the entry reads as. */
  label: ReactNode;
  /**
   * Where it goes. Present, the entry is an `<a>`; absent, it is a button that
   * reports through `onNavigate` — or, with `items` and no `onNavigate`, a
   * plain group heading.
   */
  href?: string;
  /**
   * A component, not a rendered element — `LayoutDashboard`, never
   * `<LayoutDashboard />` — matching `StatCard` and `PageHeader`.
   */
  icon?: ElementType<{ className?: string }>;
  /** Trailing content: a count, a `Badge`. */
  badge?: ReactNode;
  /** Children, rendered as a nested list under this entry. */
  items?: readonly AppNavItem[];
}

const navStyles = recipe({
  slots: {
    nav: 'font-mono text-sm',
    heading: 'mb-2 px-3 font-mono text-xs font-bold uppercase tracking-widest text-content-muted',
    list: 'flex flex-col gap-1.5',
    nested: 'mt-1.5 ml-3 flex flex-col gap-1.5 border-l-2 border-edge-strong pl-3',
    entry:
      'flex w-full items-center gap-2.5 border-2 px-3 py-2 text-left font-bold uppercase no-underline',
    iconFrame: 'inline-flex shrink-0',
    icon: 'h-4 w-4',
    label: 'min-w-0 flex-1 truncate',
    group: 'flex items-center gap-2.5 px-3 py-2 font-bold uppercase text-content-muted',
  },
  variants: {
    active: {
      true: { entry: 'border-edge-strong bg-accent-primary text-content-inverse shadow-hard-sm' },
      false: { entry: 'border-transparent text-content-primary hover:border-edge-strong hover:bg-surface-raised' },
    },
  },
});

export interface AppSidebarNavProps
  extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> {
  /**
   * The `<nav>` landmark's accessible name — `Primary`, `Projects`. Required,
   * because a sidebar can hold more than one, and two unnamed navigation
   * landmarks are indistinguishable.
   */
  label: string;
  /** The tree. */
  items: readonly AppNavItem[];
  /** The entry for the current page, marked `aria-current="page"` and filled. */
  activeId?: string;
  /**
   * Called with an entry's `id` when it is chosen, link or button. Inside an
   * `AppShell` a choice also closes the off-canvas sidebar, since the reader
   * has gone where they opened it to go.
   */
  onNavigate?: (id: string) => void;
  /** Shown above the list as a small caps heading. The landmark's name is `label` either way. */
  heading?: ReactNode;
  /** Merged into the `<nav>`'s classes. */
  className?: string;
}

/**
 * A labelled `<nav>` over a navigation tree the consumer supplies.
 *
 * Entries with an `href` are links; entries without one are buttons that
 * report through `onNavigate`, which is where a client-side router takes
 * over. An entry with `items` nests them, to any depth. The current entry
 * carries `aria-current="page"` — on the element a screen reader lands on, not
 * a wrapper — and the filled, shadowed treatment.
 */
export const AppSidebarNav = forwardRef<HTMLElement, AppSidebarNavProps>(function AppSidebarNav(
  { label, items, activeId, onNavigate, heading, className, ...props },
  ref,
) {
  const styles = navStyles();
  const context = useContext(AppShellContext);

  const choose = (id: string) => {
    onNavigate?.(id);
    context?.setSidebarOpen(false);
  };

  const renderEntry = (item: AppNavItem) => {
    const active = item.id === activeId;
    const entry = navStyles({ active });
    const Icon = item.icon;
    const inner = (
      <>
        {Icon && (
          <span className={styles.iconFrame()} aria-hidden="true">
            <Icon className={styles.icon()} />
          </span>
        )}
        <span className={styles.label()}>{item.label}</span>
        {item.badge}
      </>
    );

    if (item.href !== undefined) {
      return (
        <a
          href={item.href}
          aria-current={active ? 'page' : undefined}
          className={entry.entry()}
          onClick={() => choose(item.id)}
        >
          {inner}
        </a>
      );
    }
    if (item.items && !onNavigate) {
      return <span className={styles.group()}>{inner}</span>;
    }
    return (
      <button
        type="button"
        aria-current={active ? 'page' : undefined}
        className={entry.entry()}
        onClick={() => choose(item.id)}
      >
        {inner}
      </button>
    );
  };

  const renderList = (list: readonly AppNavItem[], depth: number) => (
    <ul className={depth === 0 ? styles.list() : styles.nested()}>
      {list.map((item) => (
        <li key={item.id}>
          {renderEntry(item)}
          {item.items && item.items.length > 0 && renderList(item.items, depth + 1)}
        </li>
      ))}
    </ul>
  );

  return (
    <nav ref={ref} aria-label={label} data-slot="app-sidebar-nav" className={styles.nav({ class: className })} {...props}>
      {heading != null && <p className={styles.heading()}>{heading}</p>}
      {renderList(items, 0)}
    </nav>
  );
});

const topbarStyles = recipe({
  slots: {
    header:
      'flex flex-wrap items-center gap-4 border-b-4 border-edge-strong bg-surface-base px-4 py-3 md:px-8',
    toggle: 'shrink-0 px-3 lg:hidden',
    lead: 'flex min-w-0 flex-auto flex-wrap items-center gap-3',
    actions: 'ml-auto flex shrink-0 flex-wrap items-center gap-3',
  },
});

export interface AppTopbarProps extends Omit<HTMLAttributes<HTMLElement>, 'className'> {
  /**
   * The `<header>` landmark's accessible name. `Application` by default; name
   * it for the application when a page carries more than one header.
   */
  label?: string;
  /** The leading slot: the page's title, a breadcrumb, status badges. */
  children?: ReactNode;
  /** The trailing slot: actions, a search field, a status area. */
  actions?: ReactNode;
  /**
   * The sidebar toggle's accessible name. It is an icon, so this is all a
   * screen reader hears of it; name it for what it opens.
   */
  sidebarToggleLabel?: string;
  /** Merged into the `<header>`'s classes. */
  className?: string;
}

/**
 * The bar above the page — a labelled `<header>`.
 *
 * Inside an `AppShell` with a sidebar it leads with the sidebar toggle, shown
 * below desktop width only. The toggle is a real button in the tab order,
 * named by `sidebarToggleLabel`, reporting `aria-expanded`; opening it moves
 * focus into the drawer, and closing the drawer returns focus here.
 *
 * When the leading slot and the actions do not fit on one line, the actions
 * wrap onto a second, right-aligned, rather than overlapping the lead.
 */
export const AppTopbar = forwardRef<HTMLElement, AppTopbarProps>(function AppTopbar(
  {
    label = 'Application',
    children,
    actions,
    sidebarToggleLabel = 'Open navigation',
    className,
    ...props
  },
  ref,
) {
  const styles = topbarStyles();
  const context = useContext(AppShellContext);

  return (
    <header
      ref={ref}
      aria-label={label}
      data-slot="app-topbar"
      className={styles.header({ class: className })}
      {...props}
    >
      {context?.hasSidebar && (
        <Button
          type="button"
          size="sm"
          aria-label={sidebarToggleLabel}
          aria-haspopup="dialog"
          aria-expanded={context.drawerOpen}
          data-slot="app-sidebar-toggle"
          className={styles.toggle()}
          onClick={() => context.setSidebarOpen(true)}
        >
          <MenuIcon className="h-5 w-5" aria-hidden="true" />
        </Button>
      )}
      <div data-slot="app-topbar-lead" className={styles.lead()}>{children}</div>
      {actions != null && <div data-slot="app-topbar-actions" className={styles.actions()}>{actions}</div>}
    </header>
  );
});

const mainStyles = recipe({
  base: 'flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-8',
});

export interface AppMainProps extends Omit<HTMLAttributes<HTMLElement>, 'className'> {
  /**
   * The `<main>` landmark's accessible name. `Content` by default; the page's
   * title is the better name when it has one.
   */
  label?: string;
  /** The page. Stacked with the system's gap, so sections need no spacing of their own. */
  children: ReactNode;
  /** Merged into the `<main>`'s classes. */
  className?: string;
}

/**
 * The page's one `<main>` landmark, labelled, padded and stacking its
 * children with a consistent gap — so a page of `PageHeader`, `Card` and
 * `DataTable` needs no layout CSS of its own.
 */
export const AppMain = forwardRef<HTMLElement, AppMainProps>(function AppMain(
  { label = 'Content', children, className, ...props },
  ref,
) {
  return (
    <main ref={ref} aria-label={label} data-slot="app-main" className={mainStyles({ class: className })} {...props}>
      {children}
    </main>
  );
});
