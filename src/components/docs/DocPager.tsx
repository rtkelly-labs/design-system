import { ArrowLeft, ArrowRight } from 'lucide-react';
import { DocsLink } from './DocsLinkProvider';
import { cn } from '../../lib/recipe';

export interface DocPagerTarget {
  label: string;
  href: string;
}

export interface DocPagerProps {
  prev?: DocPagerTarget;
  next?: DocPagerTarget;
  className?: string;
}

/**
 * Titled previous/next navigation for the foot of a documentation page.
 *
 * Distinct from {@link Pagination}, which counts numbered pages (`[ 3 / 12 ]`)
 * for list views. Readers moving through docs sequentially need the *name* of
 * the adjacent page, not its index.
 *
 * Renders an empty spacer when only one side exists so `next` stays
 * right-aligned on a page with no predecessor.
 */
export function DocPager({ prev, next, className = '' }: DocPagerProps) {
  if (!prev && !next) return null;

  return (
    <nav className={cn('not-prose docs-pager', className)} aria-label="Page navigation">
      {prev ? (
        <DocsLink href={prev.href} className="docs-pager-link" rel="prev">
          <span className="docs-pager-dir">
            <ArrowLeft size={13} aria-hidden="true" /> PREVIOUS
          </span>
          <span className="docs-pager-label">{prev.label}</span>
        </DocsLink>
      ) : (
        <span aria-hidden="true" />
      )}

      {next ? (
        <DocsLink href={next.href} className="docs-pager-link docs-pager-next" rel="next">
          <span className="docs-pager-dir">
            NEXT <ArrowRight size={13} aria-hidden="true" />
          </span>
          <span className="docs-pager-label">{next.label}</span>
        </DocsLink>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
