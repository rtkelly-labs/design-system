import { useEffect, useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import { Menu, Palette, Search, X } from 'lucide-react';
import { DocsLink } from './DocsLinkProvider';
import { useOptionalTheme } from '../ThemeProvider';
import { LEVELS } from '../../theme/levels';
import { cn } from '../../lib/recipe';

export interface DocsNavItem {
  label: string;
  href: string;
  /** Marks the item active. Callers own route matching. */
  active?: boolean;
  external?: boolean;
}

export interface DocsHeaderProps {
  /** Brand text, rendered bracketed and uppercased. */
  title: string;
  /** Href the brand links to. Defaults to the site root. */
  titleHref?: string;
  /** Optional glyph before the brand — a lucide icon or any SVG component. */
  icon?: ElementType<{ className?: string }>;
  /** Top-level sections, shown inline on desktop only. */
  nav?: readonly DocsNavItem[];
  /** Invoked by the search button. Omit to hide the button entirely. */
  onSearch?: () => void;
  /** Keyboard hint rendered inside the search button. */
  searchShortcut?: string;
  /** Controls the mobile sidebar toggle. Omit to hide it. */
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  /** Extra trailing content — version switcher, repo link, and so on. */
  children?: ReactNode;
  className?: string;
}

/**
 * The persistent top bar for a docs site.
 *
 * Beyond navigation it owns one piece of cross-cutting state: it measures its
 * own rendered height and publishes it as `--docs-header-height` on the root
 * element. A sticky header silently swallows anchor targets — jump to
 * `#some-section` and the heading lands underneath the bar — so the offset has
 * to reach `scroll-margin-top` in `prose.css` and the scroll-spy reading line
 * in `useActiveHeading`. Measuring rather than hard-coding keeps all three
 * correct when the bar wraps on narrow screens or a consumer restyles it.
 */
export function DocsHeader({
  title,
  titleHref = '/',
  icon: Icon,
  nav = [],
  onSearch,
  searchShortcut = '⌘K',
  onToggleSidebar,
  sidebarOpen = false,
  children,
  className = '',
}: DocsHeaderProps) {
  const ref = useRef<HTMLElement | null>(null);
  /*
   * `useOptionalTheme`, not `useTheme`. A docs header is chrome, and ADR 0004
   * says a consumer may theme with the `data-theme` attribute alone and never
   * mount a provider — developer themes consume colour only, the host owns the
   * geometry and the clock. The strict hook throws, so requiring it here takes
   * the whole page down rather than degrading.
   *
   * This component *adapts* to the level rather than requiring it: with no
   * provider there is nothing to cycle, so the control is omitted and the rest
   * of the header renders.
   */
  const theme = useOptionalTheme();

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;

    const publish = () => {
      document.documentElement.style.setProperty(
        '--docs-header-height',
        `${Math.round(el.getBoundingClientRect().height)}px`,
      );
    };

    publish();

    // ResizeObserver is absent in older jsdom-based test environments; the
    // initial measurement above is still correct there.
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', publish);
      return () => window.removeEventListener('resize', publish);
    }

    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header ref={ref} className={cn('not-prose docs-header', className)}>
      <div className="docs-header-left">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="docs-header-icon-btn docs-header-sidebar-toggle"
            aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}

        <DocsLink href={titleHref} className="docs-header-brand">
          {Icon && <Icon className="docs-header-brand-icon" />}
          <span>[ {title.toUpperCase()} ]</span>
        </DocsLink>
      </div>

      {nav.length > 0 && (
        <nav className="docs-header-nav" aria-label="Main">
          {nav.map((item) => (
            <DocsLink
              key={item.href}
              href={item.href}
              className="docs-header-nav-link"
              {...(item.active ? { 'aria-current': 'page' as const } : {})}
            >
              {item.label}
            </DocsLink>
          ))}
        </nav>
      )}

      <div className="docs-header-right">
        {children}

        {onSearch && (
          <button
            type="button"
            onClick={onSearch}
            className="docs-header-search"
            aria-label="Search documentation"
          >
            <Search size={15} aria-hidden="true" />
            <span className="docs-header-search-label">SEARCH</span>
            {searchShortcut && (
              <kbd className="docs-header-kbd">{searchShortcut}</kbd>
            )}
          </button>
        )}

        {theme && (
          <button
            type="button"
            onClick={theme.cycleLevel}
            className="docs-header-icon-btn"
            aria-label={`Switch theme level (current: ${LEVELS[theme.level].label})`}
            title={`Level: ${LEVELS[theme.level].label}`}
          >
            <Palette size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
