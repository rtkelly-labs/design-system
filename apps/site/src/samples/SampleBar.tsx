'use client';

import Link from 'next/link';
import { A11yMenu } from '@rtkelly13/design-system';
import { ThemeMenu } from '@/components/chrome/ThemeMenu';
import { BracketText } from '@rtkelly13/design-system';

/**
 * The one strip of site on a sample page: a way back, the same composition in
 * Storybook, and the accessibility and level pickers. Everything under it is the sample alone.
 */
export function SampleBar({ title, story }: { title: string; story: string }) {
  return (
    <nav
      aria-label="Example"
      className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-edge-strong bg-surface-raised px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Link href="/examples" className="text-accent-primary no-underline hover:underline">
          ← Examples
        </Link>
        <span className="truncate text-content-muted"><BracketText>{title}</BracketText></span>
      </div>
      <div className="flex items-center gap-3">
        <a href={story} className="text-accent-primary no-underline hover:underline">
          Storybook ↗
        </a>
        <A11yMenu />
        <ThemeMenu />
      </div>
    </nav>
  );
}
