import type { Metadata } from 'next';
import { SiteChrome } from '@/components/chrome/SiteChrome';
import { Board } from '@/decisions/Board';

export const metadata: Metadata = {
  title: 'Decision board',
  description: 'Phase 1 (decided) and Phase 2 design options shown in context on both levels. Scaffolding.',
};

export default function DecisionsPage() {
  return (
    <SiteChrome>
      <Board />
    </SiteChrome>
  );
}
