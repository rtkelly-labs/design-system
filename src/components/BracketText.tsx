import type { ReactNode, HTMLAttributes } from 'react';
import type { AccentToken } from '../lib/theme';
import { cn } from '../lib/recipe';
import { accentTextClass } from '../lib/accentClasses';

export interface BracketTextProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  /**
   * Semantic emphasis. Roles only — `'white'` was still accepted here after
   * #138 removed the hue vocabulary from the component API, because the union
   * named it explicitly and the class map was typed `Record<string, string>`.
   * An appearance name in a component API is the defect ADR 0001 exists to
   * prevent; omit `accent` for the default ink.
   */
  accent?: AccentToken;
  className?: string;
}

export function BracketText({
  children,
  accent,
  className = '',
  ...props
}: BracketTextProps) {
  // No per-render object: the map lives in `lib/accentClasses`, written once.
  const accentClass = accent ? accentTextClass(accent) : '';

  return (
    <span className={cn(accentClass, className)} {...props}>
      <span aria-hidden="true">
        [
      </span>{' '}
      {children}{' '}
      <span aria-hidden="true">
        ]
      </span>
    </span>
  );
}
