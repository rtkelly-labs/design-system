'use client';

import { forwardRef, useMemo, type HTMLAttributes, type ReactNode } from 'react';
import { cn, recipe } from '../lib/recipe';
import { formatRangeDuration, formatTimestamp } from '../lib/timeRange';
import type { AlertSeverity } from '../lib/severity';
import { SeverityBadge } from './SeverityBadge';

/** What happened at one point in an incident. */
export type IncidentEventKind = 'detected' | 'alert' | 'acknowledged' | 'update' | 'deploy' | 'mitigated' | 'resolved';

/** One entry in an incident's log. */
export interface IncidentEvent {
  /** Stable identity, used for React keys and `onEventSelect`. */
  id: string;
  /** When it happened, in epoch milliseconds. */
  time: number;
  /** What kind of event it is; decides the marker's role colour and the summary's milestones. */
  kind: IncidentEventKind;
  /** One line on what happened. */
  title: string;
  /** Longer prose under the title. */
  detail?: string;
  /** Who did it or wrote it. */
  author?: string;
}

/** The milestones of an incident, measured from its first `detected` or `alert` event. */
export interface IncidentSummary {
  /** `resolved` once any `resolved` event exists, `ongoing` otherwise. */
  status: 'ongoing' | 'resolved';
  /**
   * When the incident started: the first `detected` or `alert` event, or the
   * earliest event of any kind when there is neither. `null` with no events.
   */
  start: number | null;
  /** Milliseconds from start to the first `acknowledged` event; `null` when there is none. */
  timeToAcknowledge: number | null;
  /** Milliseconds from start to the first `mitigated` event; `null` when there is none. */
  timeToMitigate: number | null;
  /** Milliseconds from start to the first `resolved` event; `null` when there is none. */
  timeToResolve: number | null;
  /**
   * Total length: to the resolution when resolved; to `now` when ongoing and
   * `now` is given; otherwise to the latest event.
   */
  duration: number | null;
}

/** Compute an incident's status and milestones from its events. Pure; order of `events` does not matter. */
export function summariseIncident(events: readonly IncidentEvent[], now?: number): IncidentSummary {
  const sorted = [...events].sort((a, b) => a.time - b.time);
  const first = (kinds: readonly IncidentEventKind[]) => sorted.find((event) => kinds.includes(event.kind))?.time ?? null;
  const start = first(['detected', 'alert']) ?? sorted[0]?.time ?? null;
  const since = (time: number | null) => (time === null || start === null ? null : Math.max(0, time - start));
  const resolvedAt = first(['resolved']);
  const last = sorted[sorted.length - 1]?.time ?? null;
  const end = resolvedAt ?? (now !== undefined && Number.isFinite(now) ? Math.max(now, last ?? now) : last);
  return {
    status: resolvedAt === null ? 'ongoing' : 'resolved',
    start,
    timeToAcknowledge: since(first(['acknowledged'])),
    timeToMitigate: since(first(['mitigated'])),
    timeToResolve: since(resolvedAt),
    duration: since(end),
  };
}

/** Marker fill by kind — a role, never a hue. */
const MARKER: Record<IncidentEventKind, string> = {
  detected: 'bg-intent-danger',
  alert: 'bg-intent-danger',
  acknowledged: 'bg-intent-warning',
  update: 'bg-intent-info',
  deploy: 'bg-accent-secondary',
  mitigated: 'bg-intent-success',
  resolved: 'bg-intent-success',
};

const incidentTimeline = recipe({
  slots: {
    root: 'flex min-w-0 flex-col gap-4 font-mono text-sm text-content-primary',
    header: 'flex flex-wrap items-center gap-2',
    title: 'mr-auto text-base font-bold',
    summary: 'grid grid-cols-2 gap-px border-2 border-edge-strong bg-edge-strong sm:grid-cols-5',
    stat: 'flex flex-col gap-0.5 bg-surface-raised px-3 py-2',
    statLabel: 'text-xs uppercase tracking-wider text-content-muted',
    statValue: 'font-bold tabular-nums',
    list: 'flex flex-col',
    item: 'grid grid-cols-[minmax(0,9.5rem)_1rem_minmax(0,1fr)] gap-x-3',
    gapRow: 'col-span-3 grid grid-cols-subgrid',
    gapLabel: 'col-start-3 py-1 text-xs tabular-nums text-content-muted',
    time: 'pt-0.5 text-right text-xs tabular-nums text-content-secondary',
    rail: 'flex flex-col items-center',
    railLine: 'w-0.5 flex-1 bg-edge-subtle',
    marker: 'mt-1 size-3 shrink-0 border-2 border-edge-strong',
    body: 'flex min-w-0 flex-col gap-0.5 pb-3',
    kind: 'text-xs font-bold uppercase text-content-muted',
    eventTitle: 'font-bold',
    eventButton: 'text-left font-bold underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
    detail: 'text-content-secondary',
    author: 'text-xs text-content-muted',
    empty: 'text-content-muted',
  },
});

export interface IncidentTimelineProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The incident's log, in any order. */
  events: readonly IncidentEvent[];
  /** The incident's name, shown above the summary. */
  title?: ReactNode;
  /** The incident's severity, shown as a badge beside the title. */
  severity?: AlertSeverity;
  /** The time an unresolved incident's duration runs to. Passed in, never read from the clock. */
  now?: number;
  /** `oldest-first` (default) puts the newest event last; `newest-first` reverses it. */
  order?: 'oldest-first' | 'newest-first';
  /** Makes each event's title a button, called with the event when pressed. */
  onEventSelect?: (event: IncidentEvent) => void;
  /** Accessible name for the list of events. Default `Incident timeline`. */
  label?: string;
}

const dash = (ms: number | null) => (ms === null ? '—' : formatRangeDuration(ms));

/**
 * An incident's history on a vertical rail: one marker per event, coloured by
 * kind, with its timestamp, title, detail and author, and the time between
 * consecutive events labelled on the rail.
 *
 * A summary strip above it gives the status and the time to acknowledge,
 * mitigate and resolve, measured from the first `detected` or `alert` event —
 * see `summariseIncident`. The events are an `<ol>` with `<time dateTime>`;
 * nothing is interactive unless `onEventSelect` is given.
 */
export const IncidentTimeline = forwardRef<HTMLDivElement, IncidentTimelineProps>(function IncidentTimeline(
  { events, title, severity, now, order = 'oldest-first', onEventSelect, label = 'Incident timeline', className, ...props },
  ref,
) {
  const summary = useMemo(() => summariseIncident(events, now), [events, now]);
  const chronological = useMemo(() => [...events].sort((a, b) => a.time - b.time), [events]);
  const shown = order === 'newest-first' ? [...chronological].reverse() : chronological;
  const styles = incidentTimeline();

  const status = summary.status === 'resolved'
    ? 'RESOLVED'
    : `ONGOING${summary.duration === null ? '' : ` · ${formatRangeDuration(summary.duration)}`}`;

  const stats: Array<[string, string]> = [
    ['Status', summary.status === 'ongoing' && summary.duration !== null ? `ongoing · ${formatRangeDuration(summary.duration)}` : summary.status],
    ['To acknowledge', dash(summary.timeToAcknowledge)],
    ['To mitigate', dash(summary.timeToMitigate)],
    ['To resolve', dash(summary.timeToResolve)],
    ['Duration', dash(summary.duration)],
  ];

  return (
    <div ref={ref} data-slot="incident-timeline" data-status={summary.status} {...props} className={styles.root({ className })}>
      {title || severity ? (
        <div data-slot="incident-timeline-header" className={styles.header()}>
          {title ? <span className={styles.title()}>{title}</span> : null}
          {severity ? <SeverityBadge severity={severity} /> : null}
          <SeverityBadge severity={summary.status === 'resolved' ? 'resolved' : 'firing'}>{status}</SeverityBadge>
        </div>
      ) : null}
      <dl data-slot="incident-timeline-summary" className={styles.summary()}>
        {stats.map(([name, value]) => (
          <div key={name} className={styles.stat()}>
            <dt className={styles.statLabel()}>{name}</dt>
            <dd className={cn(styles.statValue(), name === 'Status' && (summary.status === 'resolved' ? 'text-intent-success' : 'text-intent-danger'))}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {shown.length === 0 ? (
        <p className={styles.empty()}>No events yet.</p>
      ) : (
        <ol aria-label={label} className={styles.list()}>
          {shown.map((event, index) => {
            const previous = shown[index - 1];
            const gap = previous ? Math.abs(event.time - previous.time) : null;
            const isLast = index === shown.length - 1;
            return (
              <li key={event.id} data-slot="incident-timeline-event" data-kind={event.kind} className={styles.item()}>
                {gap === null ? null : (
                  <div className={styles.gapRow()}>
                    <span aria-hidden="true" />
                    <span aria-hidden="true" className={styles.rail()}><span className={styles.railLine()} /></span>
                    <span data-slot="incident-timeline-gap" className={styles.gapLabel()}><span className="sr-only">Gap </span>+{formatRangeDuration(gap)}</span>
                  </div>
                )}
                <time dateTime={new Date(event.time).toISOString()} className={styles.time()}>{formatTimestamp(event.time)}</time>
                <span aria-hidden="true" className={styles.rail()}>
                  <span data-slot="incident-timeline-marker" className={cn(styles.marker(), MARKER[event.kind])} />
                  {isLast ? null : <span className={styles.railLine()} />}
                </span>
                <div className={styles.body()}>
                  <span className={styles.kind()}>{event.kind}</span>
                  {onEventSelect ? (
                    <button type="button" className={styles.eventButton()} onClick={() => onEventSelect(event)}>{event.title}</button>
                  ) : (
                    <span className={styles.eventTitle()}>{event.title}</span>
                  )}
                  {event.detail ? <p className={styles.detail()}>{event.detail}</p> : null}
                  {event.author ? <span className={styles.author()}>— {event.author}</span> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
});

IncidentTimeline.displayName = 'IncidentTimeline';
