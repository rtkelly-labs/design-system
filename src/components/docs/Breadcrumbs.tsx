import { Fragment } from 'react';
import { DocsLink } from './DocsLinkProvider';
import { cn } from '../../lib/recipe';

export interface Crumb {
  label: string;
  /** Omit on the final crumb, or for grouping segments with no index page. */
  href?: string;
}

export interface BreadcrumbsProps {
  items: readonly Crumb[];
  /** Separator glyph between crumbs. */
  separator?: string;
  className?: string;
}

/**
 * Path trail for nested documentation.
 *
 * The last crumb is always rendered as plain text and marked `aria-current`
 * even when it carries an `href` — self-links read as navigation to assistive
 * tech but go nowhere.
 */
export function Breadcrumbs({ items, separator = '/', className = '' }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav className={cn('not-prose', className)} aria-label="Breadcrumb">
      <ol className="docs-breadcrumbs-list">
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;

          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <li>
                {crumb.href && !isLast ? (
                  <DocsLink href={crumb.href} className="docs-breadcrumbs-link">
                    {crumb.label}
                  </DocsLink>
                ) : (
                  <span
                    className="docs-breadcrumbs-current"
                    {...(isLast ? { 'aria-current': 'page' as const } : {})}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="docs-breadcrumbs-sep">
                  {separator}
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
