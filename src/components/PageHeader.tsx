import type { ReactNode, ElementType } from 'react';
import { cn } from '../lib/recipe';
import { accentTextClass } from '../lib/accentClasses';
import type { AccentToken } from '../lib/theme';


export interface PageHeaderProps {
  /** Rendered bracketed + uppercased as `[ TITLE ]`. */
  title: string;
  /** Mono strapline under the title, prefixed with the `>` prompt glyph. */
  subtitle?: ReactNode;
  /** Optional leading glyph — a lucide icon or SVG component. */
  icon?: ElementType<{ className?: string }>;
  /** Themes the icon + prompt glyph. */
  accent?: AccentToken;
  /** Extra header content (badges, admin notes) below the subtitle. */
  children?: ReactNode;
  /** Custom container class name override. */
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  accent = 'primary',
  children,
  className = '',
}: PageHeaderProps) {
  const accentText = accentTextClass(accent);

  return (
    <header className={cn('bg-surface-raised px-6 pt-8 pb-10', className)}>
      <div className="mb-4 flex items-center gap-4">
        {Icon && <Icon className={cn('h-10 w-10', accentText)} />}
        <h1 className="font-display text-4xl font-bold uppercase text-content-primary md:text-6xl">
          [ {title} ]
        </h1>
      </div>
      {subtitle && (
        <p className="mt-4 font-mono text-lg text-content-muted">
          <span className={accentText}>&gt;</span> {subtitle}
        </p>
      )}
      {children}
    </header>
  );
}
