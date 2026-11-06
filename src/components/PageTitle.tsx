import type { ReactNode, HTMLAttributes } from 'react';
import { BracketText } from './BracketText';
import { cn } from '../lib/recipe';

export interface PageTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  subtitle?: string;
  bracketed?: boolean;
  className?: string;
}

export function PageTitle({
  children,
  subtitle,
  bracketed = true,
  className = '',
  ...props
}: PageTitleProps) {
  const baseClasses =
    'text-3xl font-display font-bold leading-tight tracking-tight text-[var(--ds-text-primary)] uppercase sm:text-4xl md:text-5xl border-4 border-double border-[var(--ds-border-strong)] inline-block px-6 py-4';

  return (
    <div className="mb-8">
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
