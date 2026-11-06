import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useHotkey } from '@tanstack/react-hotkeys';
import { cn } from '../../lib/recipe';

export interface DocsLayoutProps {
  /** Rendered above everything, sticky. Normally a `DocsHeader`. */
  header?: ReactNode;
  /** Left rail. Normally a `DocsSidebar`. */
  sidebar?: ReactNode;
  /** Right rail. Normally a `TableOfContents`. Hidden below `xl`. */
  toc?: ReactNode;
  children: ReactNode;
  /** Mobile drawer state. Ignored at `lg` and up, where the rail is always shown. */
  sidebarOpen?: boolean;
  onCloseSidebar?: () => void;
  className?: string;
}

/**
 * Three-column documentation shell: sidebar, content, contents rail.
 *
 * Below `lg` the sidebar becomes an overlay drawer. Scroll on `<body>` is
 * locked while it is open, otherwise the page behind scrolls under the drawer
 * on touch devices and the reader loses their place on close.
 */
export function DocsLayout({
  header,
  sidebar,
  toc,
  children,
  sidebarOpen = false,
  onCloseSidebar,
  className = '',
}: DocsLayoutProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!sidebarOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [sidebarOpen]);

  // Escape belongs to the drawer only while the drawer is open; `enabled`
  // says so declaratively where the old code rebuilt a `window` listener
  // around that condition. `preventDefault` stays off: closing a drawer is
  // not the kind of default that should be swallowed.
  useHotkey('Escape', () => onCloseSidebar?.(), {
    enabled: sidebarOpen && Boolean(onCloseSidebar),
    preventDefault: false,
    stopPropagation: false,
    meta: { name: 'Close navigation', description: 'Dismisses the open docs drawer' },
  });

  return (
    <div className={cn('docs-layout', className)}>
      {header}

      <div className="docs-layout-body">
        {sidebar && (
          <>
            {sidebarOpen && (
              <div
                className="docs-layout-scrim"
                onClick={onCloseSidebar}
                aria-hidden="true"
              />
            )}
            <aside
              className="docs-layout-sidebar"
              data-open={sidebarOpen ? 'true' : undefined}
            >
              {sidebar}
            </aside>
          </>
        )}

        <main className="docs-layout-main" id="docs-content">
          {children}
        </main>

        {toc && <aside className="docs-layout-toc">{toc}</aside>}
      </div>
    </div>
  );
}
