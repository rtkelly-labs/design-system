import * as React from 'react';
import { cn } from '../../../lib/recipe';
import { childItems, defineAsciiItem } from './FigureFrame';

export interface TermItem {
  /** The word being defined. */
  term: string;
  /** A plain-language scale or example, set in mono under the definition. */
  scale?: string;
  /** The definition, in a sentence. */
  children?: React.ReactNode;
}

/** MDX-only glossary entry, for example `<Term term="Chroma" scale="0 = grey">How colourful.</Term>`. */
export const Term = defineAsciiItem<TermItem>('Term');

export interface TermGridProps extends React.HTMLAttributes<HTMLDListElement> {
  /** Accessible name for the glossary. */
  label?: string;
  /** Data form. If omitted, the component reads `<Term>` children. */
  terms?: readonly TermItem[];
  /** `<Term>` items. */
  children?: React.ReactNode;
  /** Additional classes for the grid. */
  className?: string;
}

/** A glossary of the words a page depends on, each with a plain-language scale. */
export const TermGrid = React.forwardRef<HTMLDListElement, TermGridProps>(function TermGrid(
  { label = 'Terms', terms: termsProp, children, className, ...rest },
  ref,
) {
  const terms = termsProp ?? childItems(children, Term);
  return (
    <dl ref={ref} role="group" aria-label={label} {...rest} className={cn('m-0 grid border-2 border-edge-strong sm:grid-cols-2', className)}>
      {terms.map((t) => (
        <div key={t.term} className="flex flex-col gap-1 border-b border-r border-edge-subtle p-4">
          <dt className="font-display text-sm font-bold text-content-primary">{t.term}</dt>
          <dd className="m-0 text-sm text-content-secondary [&_p]:m-0">{t.children}</dd>
          {t.scale && <dd className="m-0 font-mono text-xs text-content-muted">{t.scale}</dd>}
        </div>
      ))}
    </dl>
  );
});
