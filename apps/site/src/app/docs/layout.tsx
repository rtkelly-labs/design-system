import type { ReactNode } from 'react';
import { DocsShell } from '@/components/docs/DocsShell';
import { buildNav, tocByPath } from '@/content/registry';

export default function DocsRootLayout({ children }: { children: ReactNode }) {
  return (
    <DocsShell nav={buildNav()} tocByPath={tocByPath()}>
      {children}
    </DocsShell>
  );
}
