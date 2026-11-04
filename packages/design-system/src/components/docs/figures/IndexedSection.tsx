'use client';

import type { ReactNode } from 'react';
import * as React from 'react';
import { cn } from '../../../lib/recipe';
import { FigureSurfaceContext } from './FigureSurfaceContext';

export interface IndexedSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  /** Short reference drawn in the solid tab, such as `A`, `B2`, or `01`. */
  index: ReactNode;
  /** Section heading. */
  title: ReactNode;
  /** Heading level for `title`, so the section sits correctly in the page outline. */
  headingLevel?: 2 | 3 | 4;
  /** Controls drawn at the right of the header, such as a comment button. */
  actions?: ReactNode;
  /**
   * Surface elevation rung for the section background.
   * If omitted, defaults to `'raised'` when nested in a `DrawingSheet`, or `'base'` standalone.
   */
  surface?: 'base' | 'raised' | 'transparent';
  /** Section content. */
  children?: ReactNode;
  /** Additional classes for the root. */
  className?: string;
}

/**
 * An indexed section container: a solid high-contrast index tab, a heading, an optional actions
 * slot, and a hard-ruled body. Works on its own, inside an article/spec, or within a `DrawingSheet`.
 */
export const IndexedSection = React.forwardRef<HTMLElement, IndexedSectionProps>(function IndexedSection(
  { index, title, headingLevel = 3, actions, surface, children, className, ...rest },
  ref,
) {
  const enclosingSurface = React.useContext(FigureSurfaceContext);
  const resolvedSurface = surface ?? (enclosingSurface === 'sheet' ? 'raised' : 'base');
  const surfaceClass = resolvedSurface === 'raised'
    ? 'bg-surface-raised'
    : resolvedSurface === 'transparent'
      ? 'bg-transparent'
      : 'bg-surface-base';

  const headingId = React.useId();
  const Heading = `h${headingLevel}` as const;
  return (
    <section
      ref={ref}
      aria-labelledby={headingId}
      {...rest}
      data-slot="indexed-section"
      className={cn('flex min-w-0 flex-col border-2 border-edge-strong', surfaceClass, className)}
    >
      <header data-slot="indexed-section-header" className="flex items-stretch border-b-2 border-edge-strong">
        <span
          data-slot="indexed-section-index"
          className="flex min-w-12 items-center justify-center bg-content-primary px-3 font-mono text-lg font-bold text-content-inverse"
        >
          {index}
        </span>
        <Heading
          id={headingId}
          data-slot="indexed-section-title"
          className="m-0 flex flex-1 items-center px-4 py-3 font-mono text-lg font-bold tracking-tight text-content-primary"
        >
          {title}
        </Heading>
        {actions != null ? (
          <div data-slot="indexed-section-actions" className="flex items-center gap-2 px-3">
            {actions}
          </div>
        ) : null}
      </header>
      <div data-slot="indexed-section-body" className="min-w-0 p-4 sm:p-6">
        {children}
      </div>
    </section>
  );
});
