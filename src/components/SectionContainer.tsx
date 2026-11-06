import type { ReactNode } from 'react';
import { cn } from '../lib/recipe';

export interface SectionContainerProps {
  children: ReactNode;
  className?: string;
}

export function SectionContainer({ children, className = '' }: SectionContainerProps) {
  return (
    /*
     * `cn()`, not a template. Appending the caller's `className` to a template
     * string does nothing when the two conflict: Tailwind resolves
     * `max-w-3xl` against `max-w-7xl` by CSS source order, not by the order the
     * classes appear in the attribute. `cn()` merges, so the caller wins.
     */
    <section className={cn('mx-auto max-w-3xl px-4 sm:px-6 xl:max-w-5xl xl:px-0', className)}>
      {children}
    </section>
  );
}
