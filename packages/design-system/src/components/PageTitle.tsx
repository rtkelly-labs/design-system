import type { ReactNode, HTMLAttributes } from 'react';
import { BracketText } from './BracketText';
import { cn } from '../lib/recipe';

export interface PageTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  subtitle?: string;
  bracketed?: boolean;
  /**
   * Draw the title in its double-ruled box. `true` by default. Set `false` where something else
   * on the page is the heavy object — a hero whose demo leads, for instance — so the title does
   * not compete with it. See `docs/edge-hierarchy.md`.
   */
  framed?: boolean;
  className?: string;
}

export function PageTitle({
  children,
  subtitle,
  bracketed = true,
  framed = true,
  className = '',
  ...props
}: PageTitleProps) {
  const baseClasses = cn(
    'text-3xl font-display font-bold leading-tight tracking-tight text-[var(--ds-text-primary)] uppercase text-balance sm:text-4xl md:text-5xl inline-block',
    framed ? 'border-4 border-double border-[var(--ds-border-strong)] px-6 py-4' : 'py-2',
  );

  return (
    <div data-slot="page-title" className="mb-8">
      <h1 className={cn(baseClasses, className)} {...props}>
        {bracketed ? <BracketText>{children}</BracketText> : children}
      </h1>
      {subtitle && (
        <p className="mt-2 font-mono text-sm text-accent-primary">
          {subtitle}
        </p>
      )}
    </div>
  );
}
