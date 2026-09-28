/**
 * Adapted from mdxcn by Keshav Bagaade, MIT licensed.
 * Source: https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/steps/steps.tsx
 * The local port removes motion and graph variables while preserving the
 * numbered Markdown procedure and `<Step>` child API.
 */

import type { ReactNode } from 'react';
import * as React from 'react';
import {
  childItems,
  defineAsciiItem,
  AsciiFrameBody,
  AsciiFrameProse,
  hasHost,
  itemText,
  listItems,
  paragraphsOf,
  splitDash,
  textOf,
} from './FigureFrame';
import { cn } from '../../../lib/recipe';

export type StepState = 'done' | 'now' | 'next';

export interface StepProps {
  /** One-line title drawn beside the number. */
  title?: string;
  /** `now` uses the primary accent, `next` recedes, and `done` stays plain. */
  state?: StepState;
  /** Markdown body for the step. */
  children?: ReactNode;
}

export interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name; the enclosing FigureFrame owns the caption. */
  label?: string;
  /** Ordered Markdown list or `<Step>` content. */
  children?: ReactNode;
  /** Additional classes for the procedure. */
  className?: string;
}

/** MDX-only step item, for example `<Step title="Install">Run the CLI.</Step>`. */
export const Step = defineAsciiItem<StepProps>('Step');

function stepsOf(children: ReactNode): StepProps[] {
  const listed = listItems(children);
  if (listed.length === 0) return childItems(children, Step);
  return listed.map((item) => {
    const content = (item.props as { children?: ReactNode }).children;
    const paras = paragraphsOf(content);
    const title = paras.length > 0 ? textOf((paras[0]?.props as { children?: ReactNode }).children) : splitDash(itemText(item)).label;
    const body = paras.length > 1 ? paras.slice(1) : paras.length === 0 ? splitDash(itemText(item)).rest || undefined : undefined;
    const now = hasHost(content, ['strong', 'b']);
    const next = !now && hasHost(content, ['em', 'i']);
    return { title, children: body, state: (now ? 'now' : next ? 'next' : 'done') as StepState };
  });
}

/** Renders a numbered procedure with current and upcoming states preserved in text. */
export const Steps = React.forwardRef<HTMLDivElement, StepsProps>(function Steps({ label = 'Steps', children, className, ...rest }, ref) {
  const steps = stepsOf(children);
  const digits = String(steps.length).length;
  return (
      <AsciiFrameBody ref={ref} {...rest} className={className}>
        <ol className="flex flex-col" aria-label={`${label} procedure`}>
          {steps.map((step, index) => {
            const state = step.state ?? 'done';
            const last = index === steps.length - 1;
            const number = String(index + 1).padStart(Math.max(2, digits), '0');
            const titleClass = state === 'now' ? 'text-accent-primary' : state === 'next' ? 'text-content-muted' : 'text-content-primary';
            return <li className="flex flex-col" key={`${index}-${step.title ?? ''}`}>
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-x-3">
                <span aria-hidden="true" className={cn('select-none tabular-nums', titleClass)}>{number}</span>
                <div className="flex min-w-0 flex-col gap-2">
                  {step.title ? <p className={cn('text-pretty', titleClass)}>{step.title}</p> : null}
                  {step.children ? <AsciiFrameProse className={state === 'next' ? 'text-content-muted' : 'text-content-secondary'}>{step.children}</AsciiFrameProse> : null}
                </div>
              </div>
              {last ? null : <div aria-hidden="true" className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 py-2"><span className="select-none text-center text-content-muted">│</span></div>}
            </li>;
          })}
        </ol>
        <span className="sr-only">{steps.length === 0 ? 'Empty procedure.' : `${steps.length} step${steps.length === 1 ? '' : 's'}.`}</span>
      </AsciiFrameBody>
  );
});
