/**
 * Adapted from mdxcn by Keshav Bagaade, MIT licensed.
 * Source: https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/graph-timeline/graph-timeline.tsx
 * The local port replaces motion and graph variables with deterministic
 * semantic token classes and preserves the Markdown child API.
 */

import type { ReactNode } from 'react';
import * as React from 'react';
import {
  childItems,
  defineAsciiItem,
  AsciiFrameBody,
  hasHost,
  itemText,
  listItems,
  splitLabel,
  textOf,
  type FigurePalette,
} from './FigureFrame';
import { cn } from '../../../lib/recipe';

export type TimelineState = 'done' | 'now' | 'next';

export interface TimelineEvent {
  /** Date or time label shown in the middle column. */
  date: string;
  /** Falls back to the child text for `<Event date="14:02">p95 crossed</Event>`. */
  label?: string;
  state?: TimelineState;
}

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name; the enclosing FigureFrame owns the caption. */
  label?: string;
  /** Data form. If omitted, the component reads Markdown or `<Event>` children. */
  events?: TimelineEvent[];
  /** Markdown list or `<Event>` content used to derive events. */
  children?: ReactNode;
  /** Accent palette used for current and upcoming events. */
  palette?: FigurePalette;
  /** Additional classes for this timeline. */
  className?: string;
}

/** MDX-only timeline item, for example `<Event date="Mar 18" state="now">Launch</Event>`. */
export const Event = defineAsciiItem<TimelineEvent>('Event');

const MARK: Record<TimelineState, string> = { done: '●', now: '●', next: '○' };

function stateClass(palette: FigurePalette | undefined, state: TimelineState): string {
  if (state === 'now') return 'text-accent-primary';
  if (state === 'next') return palette === 'multi' ? 'text-accent-secondary' : 'text-content-muted';
  return 'text-content-primary';
}

function eventsOf(children: ReactNode): TimelineEvent[] {
  const listed = listItems(children).map((item) => {
    const text = itemText(item);
    const time = text.match(/^(\d{1,2}:\d{2})\s*:\s*(.*)$/);
    const { label: date, rest } = time ? { label: time[1] ?? '', rest: time[2] ?? '' } : splitLabel(text);
    const content = (item.props as { children?: ReactNode }).children;
    const now = hasHost(content, ['strong', 'b']);
    const next = !now && hasHost(content, ['em', 'i']);
    return { date, label: rest || date, state: now ? 'now' : next ? 'next' : 'done' } as TimelineEvent;
  });
  if (listed.length > 0) return listed;

  return childItems(children, Event).map((entry) => ({
    ...entry,
    label: entry.label ?? textOf(entry.children),
  }));
}

/** Renders a dated sequence with explicit done, current, and upcoming states. */
export const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(function Timeline({ label = 'Timeline', events: eventsProp, children, palette, className, ...rest }, ref) {
  const events = eventsProp ?? eventsOf(children);

  return (
      <AsciiFrameBody ref={ref} {...rest} className={className}>
        <ol className="flex flex-col" aria-label={label}>
          {events.map((event, index) => {
            const state = event.state ?? 'done';
            const last = index === events.length - 1;
            const label = event.label ?? '';
            return (
              <li className="flex flex-col" key={`${event.date}-${label}-${index}`}>
                <div className="grid grid-cols-[1.25rem_7rem_minmax(0,1fr)] items-baseline gap-x-4" aria-label={`${event.date}: ${label}`}>
                  <span aria-hidden="true" className={cn('select-none text-center leading-none', stateClass(palette, state))}>{MARK[state]}</span>
                  <span className={cn('tabular-nums', state === 'next' ? 'text-content-muted' : 'text-content-primary')}>{event.date}</span>
                  <span className={stateClass(palette, state)}>{label}</span>
                </div>
                {last ? null : <div aria-hidden="true" className="grid grid-cols-[1.25rem_7rem_minmax(0,1fr)] gap-x-4 py-1"><span className="select-none text-center text-content-muted">│</span></div>}
              </li>
            );
          })}
        </ol>
        <span className="sr-only">{events.length === 0 ? 'Empty timeline.' : `${events.length} timeline event${events.length === 1 ? '' : 's'}.`}</span>
      </AsciiFrameBody>
  );
});
