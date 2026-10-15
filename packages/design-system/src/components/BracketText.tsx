import type { ReactNode, HTMLAttributes } from 'react';
import type { AccentToken } from '../lib/theme';
import { cn } from '../lib/recipe';
import { accentTextClass } from '../lib/accentClasses';

/**
 * The one way to bracket a label. Write `<BracketText>PAGE</BracketText>`, never
 * `[ PAGE ]` by hand: `check:component-contract` fails on a literal bracketed
 * label in JSX.
 *
 * - **The brackets cannot strand.** Each is glued to the label by a no-break
 *   space, so a line can break inside the label but never next to a bracket.
 * - **They stay out of the accessible name.** Both are `aria-hidden`, so a
 *   dialog titled "[ Delete domain ]" is announced as "Delete domain".
 * - **They stay out of a copy.** `select-none` leaves them behind when the
 *   label is selected and copied.
 *
 * Why spans and not `::before`/`::after`: the no-break space would have to be
 * written into a Tailwind class, and no spelling of it survives both the
 * package build (which escapes it to `\xA0` in `dist`) and the consumer's class
 * scanner (which reads `dist` as text).
 */
const OPEN = '[\u00a0';
const CLOSE = '\u00a0]';

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
    <span data-slot="bracket-text" className={cn(accentClass, className)} {...props}>
      <span aria-hidden="true" className="select-none">
        {OPEN}
      </span>
      {children}
      <span aria-hidden="true" className="select-none">
        {CLOSE}
      </span>
    </span>
  );
}
