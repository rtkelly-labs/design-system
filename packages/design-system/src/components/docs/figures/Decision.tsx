import * as React from 'react';
import { cn } from '../../../lib/recipe';
import { childItems, defineAsciiItem } from './FigureFrame';

export interface DecisionOption {
  /** The option, as a short heading. */
  title: string;
  /** What it costs, in a line. */
  cost?: string;
  /** Marks the recommended option. */
  picked?: boolean;
  /** One or two sentences on what the option does. */
  children?: React.ReactNode;
}

/** MDX-only option, for example `<Option title="5.5:1" picked cost="…">…</Option>`. */
export const Option = defineAsciiItem<DecisionOption>('Option');

export interface DecisionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The question being decided. Also the accessible name. */
  question: string;
  /** One line on why it matters, under the question. */
  context?: string;
  /** Data form. If omitted, the component reads `<Option>` children. */
  options?: readonly DecisionOption[];
  /** The recommendation, under the options. */
  recommendation?: React.ReactNode;
  /** `<Option>` items. */
  children?: React.ReactNode;
  /** Additional classes for the frame. */
  className?: string;
}

/** A decision laid out as options with costs, with the recommended one marked. */
export const Decision = React.forwardRef<HTMLDivElement, DecisionProps>(function Decision(
  { question, context, options: optionsProp, recommendation, children, className, ...rest },
  ref,
) {
  const options = optionsProp ?? childItems(children, Option);
  const picked = options.find((o) => o.picked);
  return (
    <div data-slot="decision" ref={ref} role="group" aria-label={question} {...rest} className={cn('border-[3px] border-intent-warning bg-surface-raised shadow-hard-md', className)}>
      <div className="border-b-2 border-intent-warning px-4 py-3">
        <p className="m-0 font-display text-base font-extrabold text-content-primary">{question}</p>
        {context && <p className="m-0 mt-1 font-mono text-xs text-content-muted">{context}</p>}
      </div>
      <div className="grid sm:grid-cols-2">
        {options.map((o, i) => (
          <div key={`${o.title}-${i}`} data-slot="decision-option" className={cn('flex flex-col gap-2 border-b border-edge-subtle px-4 py-3 sm:odd:border-r', o.picked && 'bg-surface-sunken')}>
            <p className="m-0 flex items-baseline justify-between gap-2 font-display text-sm font-bold text-content-primary">
              <span>{o.title}</span>
              {o.picked && <span className="border-2 border-intent-success px-1 font-mono text-[0.6rem] uppercase text-intent-success">Recommended</span>}
            </p>
            {o.children && <div className="text-sm text-content-secondary [&_p]:m-0">{o.children}</div>}
            {o.cost && <p className="m-0 font-mono text-xs text-content-muted">cost: <span>{o.cost}</span></p>}
          </div>
        ))}
      </div>
      <span className="sr-only">{options.length === 0 ? 'No options.' : `${options.length} option${options.length === 1 ? '' : 's'}${picked ? `, recommended: ${picked.title}` : ''}.`}</span>
      {recommendation && <div className="px-4 py-3 text-sm text-content-primary [&_p]:m-0">{recommendation}</div>}
    </div>
  );
});
