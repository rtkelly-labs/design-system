'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { DocsHeader, DocsLayout, DocsSidebar, Drawer, SocialIcon, TableOfContents } from '@/ds';
import type { DocsNavNode, TocEntry } from '@/ds';
import { useSearch } from '@/components/chrome/Search';
import { REPO_URL, STORYBOOK_URL } from '@/lib/links';

/**
 * The docs chrome: `DocsLayout` with `DocsHeader`, `DocsSidebar` and
 * `TableOfContents` from the package, one instance for every docs page.
 *
 * Below `lg` the sidebar opens in the package's `Drawer`, not in
 * `DocsLayout`'s own off-canvas rail. That rail is translated off-screen
 * rather than removed, so its links stay in the tab order while it is closed,
 * and it has no focus containment while open (issue 309). `Drawer` is
 * Base UI's dialog, so it has both. The rail's content is hidden below `lg` so
 * the two never coexist.
 */
export function DocsShell({
  nav,
  tocByPath,
  children,
}: {
  nav: DocsNavNode[];
  tocByPath: Record<string, TocEntry[]>;
  children: ReactNode;
}) {
  const pathname = usePathname().replace(/\/$/, '') || '/';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const search = useSearch();
  const toc = tocByPath[pathname] ?? [];

  return (
    <DocsLayout
      header={
        <DocsHeader
          title="RTK / DS"
          titleHref="/"
          nav={[
            { label: 'Docs', href: '/docs', active: pathname === '/docs' || pathname === '/docs/installation' },
            { label: 'Components', href: '/docs/components', active: pathname.startsWith('/docs/components') },
            { label: 'Storybook', href: STORYBOOK_URL, external: true },
          ]}
          onSearch={search.open}
          onToggleSidebar={() => setDrawerOpen((open) => !open)}
          sidebarOpen={drawerOpen}
        >
          <SocialIcon name="github" href={REPO_URL} label="GitHub repository" className="size-5" />
        </DocsHeader>
      }
      sidebar={
        <div className="hidden lg:block">
          <DocsSidebar nav={nav} currentPath={pathname} label="DOCS" />
        </div>
      }
      toc={toc.length ? <TableOfContents key={pathname} toc={toc} /> : undefined}
    >
      {children}
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} placement="left" title="Documentation">
        <DocsSidebar nav={nav} currentPath={pathname} label={null} onNavigate={() => setDrawerOpen(false)} />
      </Drawer>
    </DocsLayout>
  );
}
