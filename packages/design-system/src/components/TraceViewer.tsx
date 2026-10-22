'use client';

import { forwardRef, useId, useMemo, useState, type HTMLAttributes } from 'react';
import { Input } from './Input';
import { recipe } from '../lib/recipe';
import { buildTrace, formatTraceDuration, type TraceModel, type TraceSpanInput } from '../lib/trace';
import { TraceWaterfall } from './TraceWaterfall';

const traceViewer = recipe({
  slots: {
    root: 'flex min-w-0 flex-col gap-4 border-2 border-edge-strong bg-surface-base p-4 font-mono text-sm text-content-primary',
    header: 'flex flex-wrap items-baseline justify-between gap-3 border-b border-edge-subtle pb-3',
    title: 'text-base font-bold uppercase tracking-wide',
    stats: 'flex flex-wrap gap-x-5 gap-y-1',
    stat: 'flex items-baseline gap-1.5',
    statLabel: 'text-xs uppercase text-content-muted',
    statValue: 'tabular-nums',
    body: 'grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]',
    details: 'flex min-w-0 flex-col gap-3 border border-edge-default bg-surface-raised p-3',
    detailsTitle: 'break-words font-bold',
    list: 'grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs',
    term: 'text-content-muted',
    value: 'break-words',
    hint: 'text-xs text-content-muted',
  },
});

export interface TraceViewerProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The spans, or a model built with `buildTrace`. */
  spans: readonly TraceSpanInput[] | TraceModel;
  /** Where in-flight spans end. Pair with `useTraceClock` for a live trace. */
  now?: number;
  /** Heading for the trace — an id, a route, a job name. */
  title?: string;
  /** The span whose details show on mount. Default: the first root. */
  defaultSelectedId?: string | null;
  /** Show the filter field. Default true. */
  searchable?: boolean;
}

/**
 * A trace viewer: a summary strip, a filterable `TraceWaterfall`, and the
 * selected span's details — timing, self time, status and attributes.
 *
 * Live when spans are in flight and `now` advances; load OTLP/JSON with
 * `parseTraceDocument`.
 */
export const TraceViewer = forwardRef<HTMLElement, TraceViewerProps>(function TraceViewer(
  { spans, now, title = 'Trace', defaultSelectedId, searchable = true, className, ...props },
  ref,
) {
  const model = useMemo(() => buildTrace(spans, { now }), [spans, now]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(defaultSelectedId === undefined ? null : defaultSelectedId);
  const headingId = useId();
  const styles = traceViewer();

  const fallback = defaultSelectedId === undefined ? model.spans[0]?.id ?? null : null;
  const selected = model.byId.get(selectedId ?? fallback ?? '') ?? null;
  const parent = selected?.parentId ? model.byId.get(selected.parentId) : undefined;

  const stats: Array<[string, string]> = [
    ['Duration', formatTraceDuration(model.duration)],
    ['Spans', String(model.spans.length)],
    ['Services', String(model.services.length)],
    ['Errors', String(model.errorCount)],
    ...(model.inFlightCount ? [['In flight', String(model.inFlightCount)] as [string, string]] : []),
  ];

  return (
    <section ref={ref} data-slot="trace-viewer" aria-labelledby={headingId} {...props} className={styles.root({ className })}>
      <header className={styles.header()}>
        <h3 id={headingId} className={styles.title()}>{title}</h3>
        <dl className={styles.stats()}>
          {stats.map(([term, value]) => (
            <div key={term} className={styles.stat()}>
              <dt className={styles.statLabel()}>{term}</dt>
              <dd className={styles.statValue()}>{value}</dd>
            </div>
          ))}
        </dl>
      </header>
      {searchable ? (
        <Input
          label="Filter spans"
          type="search"
          value={query}
          placeholder="name, service or key=value"
          onChange={(event) => setQuery(event.target.value)}
          className="max-w-xs"
        />
      ) : null}
      <div className={styles.body()}>
        <TraceWaterfall
          spans={model}
          filter={query}
          selectedId={selected?.id ?? null}
          onSelectedChange={setSelectedId}
          label={`${title} spans`}
        />
        <aside aria-label="Span details" data-part="details" className={styles.details()}>
          {selected ? (
            <>
              <p className={styles.detailsTitle()}>{selected.name}</p>
              <dl className={styles.list()}>
                <dt className={styles.term()}>service</dt><dd className={styles.value()}>{selected.service}</dd>
                {selected.kind ? <><dt className={styles.term()}>kind</dt><dd className={styles.value()}>{selected.kind}</dd></> : null}
                <dt className={styles.term()}>status</dt>
                <dd className={selected.status === 'error' ? 'text-intent-danger' : styles.value()}>{selected.inFlight ? 'in flight' : selected.status}</dd>
                <dt className={styles.term()}>start</dt><dd className={styles.value()}>+{formatTraceDuration(selected.offset)}</dd>
                <dt className={styles.term()}>duration</dt><dd className={styles.value()}>{formatTraceDuration(selected.duration)}</dd>
                <dt className={styles.term()}>self time</dt><dd className={styles.value()}>{formatTraceDuration(selected.selfTime)}</dd>
                {parent ? <><dt className={styles.term()}>parent</dt><dd className={styles.value()}>{parent.name}</dd></> : null}
                <dt className={styles.term()}>critical</dt><dd className={styles.value()}>{selected.critical ? 'yes' : 'no'}</dd>
                <dt className={styles.term()}>span id</dt><dd className={styles.value()}>{selected.id}</dd>
              </dl>
              {Object.keys(selected.attributes).length ? (
                <dl className={styles.list()} aria-label="Attributes">
                  {Object.entries(selected.attributes).map(([key, value]) => (
                    <div key={key} className="contents">
                      <dt className={styles.term()}>{key}</dt>
                      <dd className={styles.value()}>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </>
          ) : (
            <p className={styles.hint()}>Select a span to see its details.</p>
          )}
        </aside>
      </div>
    </section>
  );
});

TraceViewer.displayName = 'TraceViewer';
