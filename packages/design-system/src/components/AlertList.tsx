'use client';

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { cn, recipe } from '../lib/recipe';
import { formatRangeDuration } from '../lib/timeRange';
import { severityAccent, type AlertSeverity, type AlertState } from '../lib/severity';
import { SeverityBadge } from './SeverityBadge';
import { Sparkline } from './Sparkline';

/** One alert as an alerting backend reports it. */
export interface Alert {
  /** Stable identity, used for selection and React keys. */
  id: string;
  /** The rule's name — `HighErrorRate`, `DiskAlmostFull`. */
  name: string;
  /** Where the alert is in its lifecycle. */
  state: AlertState;
  /** How bad it is. */
  severity: AlertSeverity;
  /** When the alert entered its current state, in epoch milliseconds. */
  since: number;
  /** The service or target the alert is about. */
  service?: string;
  /** One sentence on what is wrong. */
  summary?: string;
  /** The observed value, already formatted — `4.2%`. */
  value?: string;
  /** The threshold it is compared against, already formatted — `1%`. */
  threshold?: string;
  /** Recent samples of the alerting metric, oldest first, drawn as a sparkline. */
  trend?: readonly number[];
}

/** The order states are listed in, most urgent first. */
export const ALERT_STATE_ORDER: readonly AlertState[] = ['firing', 'pending', 'silenced', 'resolved'];
const SEVERITY_ORDER: readonly AlertSeverity[] = ['critical', 'warning', 'info'];

/**
 * Alerts in reading order: by state (firing, pending, silenced, resolved), then
 * by severity (critical first), then by `since` — the longest-running first
 * for an active alert, the most recently resolved first for a resolved one.
 * Ties fall back to the name, so the order is total and stable.
 */
export function sortAlerts(alerts: readonly Alert[]): Alert[] {
  return [...alerts].sort((a, b) => {
    const state = ALERT_STATE_ORDER.indexOf(a.state) - ALERT_STATE_ORDER.indexOf(b.state);
    if (state) return state;
    const severity = SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity);
    if (severity) return severity;
    const since = a.state === 'resolved' ? b.since - a.since : a.since - b.since;
    if (since) return since;
    return a.name.localeCompare(b.name);
  });
}

/** `firing for 12m`, `resolved 3h ago`: how long an alert has been in its state at `now`. */
export function formatAlertDuration(alert: Pick<Alert, 'state' | 'since'>, now: number): string {
  const elapsed = formatRangeDuration(now - alert.since);
  return alert.state === 'resolved' ? `resolved ${elapsed} ago` : `${alert.state} for ${elapsed}`;
}

const SEVERITY_TEXT: Record<AlertSeverity, string> = {
  critical: 'text-intent-danger',
  warning: 'text-intent-warning',
  info: 'text-intent-info',
};

/** A non-zero count is coloured only for the states that want attention. */
const COUNT_TEXT: Partial<Record<AlertState, string>> = { firing: 'text-intent-danger', pending: 'text-intent-warning' };

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary';

const alertList = recipe({
  slots: {
    root: 'flex min-w-0 flex-col border-2 border-edge-strong bg-surface-base font-mono text-sm text-content-primary',
    header: 'flex flex-wrap items-center gap-2 border-b-2 border-edge-strong bg-surface-raised px-3 py-2',
    heading: 'mr-auto text-xs font-bold uppercase tracking-wider text-content-secondary',
    filter: cn(
      'inline-flex items-center gap-1.5 border-2 border-edge-default bg-surface-base px-2 py-0.5 text-xs font-bold uppercase text-content-secondary transition-colors hover:border-edge-strong motion-reduce:transition-none aria-pressed:border-edge-strong aria-pressed:bg-surface-sunken aria-pressed:text-content-primary',
      FOCUS,
    ),
    count: 'tabular-nums',
    list: 'flex flex-col',
    row: 'flex min-w-0 items-stretch border-b border-edge-subtle last:border-b-0',
    main: 'grid min-w-0 flex-1 grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 border-l-4 border-transparent px-3 py-2 text-left sm:grid-cols-[5.5rem_minmax(0,1fr)_auto_auto_7.5rem]',
    state: 'justify-self-start',
    body: 'flex min-w-0 flex-col gap-0.5',
    title: 'flex min-w-0 flex-wrap items-baseline gap-x-2',
    severity: 'text-xs font-bold uppercase',
    name: 'truncate font-bold',
    service: 'truncate text-xs text-content-muted',
    summary: 'truncate text-xs text-content-secondary',
    value: 'col-start-2 text-xs tabular-nums text-content-secondary sm:col-start-auto sm:text-right',
    trend: 'hidden sm:block',
    duration: 'col-start-2 text-xs tabular-nums text-content-muted sm:col-start-auto sm:text-right',
    actions: 'flex shrink-0 items-center gap-2 px-3',
    empty: 'flex items-center gap-2 px-3 py-6 font-bold text-intent-success',
  },
  variants: {
    selectable: { true: { main: cn('cursor-pointer transition-colors hover:bg-surface-sunken motion-reduce:transition-none', FOCUS) } },
    selected: { true: { main: 'border-accent-primary bg-surface-raised' } },
  },
});

/** A value that is controlled when the prop is defined, and owned here otherwise. */
function useControllable<T>(value: T | undefined, initial: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [owned, setOwned] = useState(initial);
  const current = value === undefined ? owned : value;
  const set = useCallback((next: T) => {
    if (value === undefined) setOwned(next);
    onChange?.(next);
  }, [value, onChange]);
  return [current, set];
}

export interface AlertListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  /** The alerts, in any order; the list sorts them by state, severity and age. */
  alerts: readonly Alert[];
  /** The time durations are measured to, in epoch milliseconds. Passed in, never read from the clock. */
  now: number;
  /**
   * States shown. Controlled when defined. An empty list shows every state —
   * the header's toggles narrow from "all" rather than starting with all pressed.
   */
  stateFilter?: readonly AlertState[];
  /** States shown on mount when uncontrolled. Default `[]`, every state. */
  defaultStateFilter?: readonly AlertState[];
  /** Called with the new set of shown states when a header toggle is pressed. */
  onStateFilterChange?: (states: AlertState[]) => void;
  /**
   * The selected alert id. Controlled when defined; `null` selects nothing.
   * Rows become buttons only when one of `selectedId`, `defaultSelectedId` or
   * `onSelectedChange` is given.
   */
  selectedId?: string | null;
  /** The alert selected on mount when uncontrolled. */
  defaultSelectedId?: string | null;
  /** Called with the id a click, Enter or Space selects. */
  onSelectedChange?: (id: string | null) => void;
  /**
   * Per-row actions — Acknowledge, Silence. Rendered beside the row's select
   * target, never inside it, so no interactive element nests in another.
   */
  renderActions?: (alert: Alert) => ReactNode;
  /** The header's title. Default `Alerts`. */
  heading?: ReactNode;
  /** Shown when no alert matches the filter. Default `No alerts firing.` */
  emptyMessage?: ReactNode;
  /** Accessible name for the list of alerts. Default `Alerts`. */
  label?: string;
}

/**
 * An alert inbox: every alert in one list, the most urgent first, with a
 * header of per-state counts that double as filter toggles.
 *
 * Each row carries the state badge, severity, rule name, service, summary,
 * value against threshold, an optional trend and how long the alert has been
 * in its state at `now`. Selectable rows are buttons with a roving tab stop —
 * Up/Down/Home/End move, Enter or Space selects — and `renderActions` puts
 * row actions beside the button rather than inside it.
 */
export const AlertList = forwardRef<HTMLDivElement, AlertListProps>(function AlertList(
  {
    alerts,
    now,
    stateFilter: stateFilterProp,
    defaultStateFilter = [],
    onStateFilterChange,
    selectedId: selectedProp,
    defaultSelectedId,
    onSelectedChange,
    renderActions,
    heading = 'Alerts',
    emptyMessage = 'No alerts firing.',
    label = 'Alerts',
    className,
    ...props
  },
  ref,
) {
  const [stateFilter, setStateFilter] = useControllable<readonly AlertState[]>(
    stateFilterProp,
    defaultStateFilter,
    onStateFilterChange as ((states: readonly AlertState[]) => void) | undefined,
  );
  const [selectedId, setSelectedId] = useControllable<string | null>(selectedProp, defaultSelectedId ?? null, onSelectedChange);
  const selectable = selectedProp !== undefined || defaultSelectedId !== undefined || onSelectedChange !== undefined;

  const sorted = useMemo(() => sortAlerts(alerts), [alerts]);
  const counts = useMemo(() => {
    const out: Record<AlertState, number> = { firing: 0, pending: 0, silenced: 0, resolved: 0 };
    for (const alert of alerts) out[alert.state] += 1;
    return out;
  }, [alerts]);
  const rows = useMemo(
    () => (stateFilter.length ? sorted.filter((alert) => stateFilter.includes(alert.state)) : sorted),
    [sorted, stateFilter],
  );

  // Roving tabindex over the select buttons.
  const [activeId, setActiveId] = useState<string | null>(null);
  const focusId = rows.some((row) => row.id === activeId) ? activeId : (rows.find((row) => row.id === selectedId) ?? rows[0])?.id ?? null;
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());
  const pendingFocus = useRef(false);
  useEffect(() => {
    if (!pendingFocus.current || !focusId) return;
    pendingFocus.current = false;
    buttonRefs.current.get(focusId)?.focus();
  }, [focusId]);
  const moveTo = (id: string | undefined) => {
    if (!id) return;
    pendingFocus.current = true;
    setActiveId(id);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const index = rows.findIndex((row) => row.id === id);
    switch (event.key) {
      case 'ArrowDown': moveTo(rows[index + 1]?.id); break;
      case 'ArrowUp': moveTo(rows[index - 1]?.id); break;
      case 'Home': moveTo(rows[0]?.id); break;
      case 'End': moveTo(rows[rows.length - 1]?.id); break;
      default: return;
    }
    event.preventDefault();
  };

  const toggleState = (state: AlertState) => {
    setStateFilter(stateFilter.includes(state) ? stateFilter.filter((s) => s !== state) : [...stateFilter, state]);
  };

  const styles = alertList();

  const rowContent = (alert: Alert) => (
    <>
      <SeverityBadge severity={alert.state} className={styles.state()} />
      <span className={styles.body()}>
        <span className={styles.title()}>
          <span data-slot="alert-list-severity" className={cn(styles.severity(), SEVERITY_TEXT[alert.severity])}>{alert.severity}</span>
          <span data-slot="alert-list-name" className={styles.name()}>{alert.name}</span>
          {alert.service ? <span data-slot="alert-list-service" className={styles.service()}>{alert.service}</span> : null}
        </span>
        {alert.summary ? <span data-slot="alert-list-summary" className={styles.summary()}>{alert.summary}</span> : null}
      </span>
      <span data-slot="alert-list-value" className={styles.value()}>
        {alert.value ?? ''}
        {alert.value && alert.threshold ? <span className="text-content-muted"> / {alert.threshold}</span> : null}
      </span>
      <span className={styles.trend()}>
        {alert.trend?.length ? (
          <Sparkline
            data={[...alert.trend]}
            width={72}
            height={20}
            accent={severityAccent(alert.state)}
            showArea={false}
            ariaLabel={`${alert.name} trend`}
          />
        ) : null}
      </span>
      <span data-slot="alert-list-duration" className={styles.duration()}>{formatAlertDuration(alert, now)}</span>
    </>
  );

  return (
    <div ref={ref} data-slot="alert-list" {...props} className={styles.root({ className })}>
      <div data-slot="alert-list-header" className={styles.header()}>
        <span className={styles.heading()}>{heading}</span>
        <div role="group" aria-label="Filter by state" className="flex flex-wrap gap-2">
          {ALERT_STATE_ORDER.map((state) => (
            <button
              key={state}
              type="button"
              data-slot="alert-list-filter"
              data-state={state}
              aria-pressed={stateFilter.includes(state)}
              onClick={() => toggleState(state)}
              className={styles.filter()}
            >
              <span>{state}</span>
              <span className={cn(styles.count(), counts[state] > 0 && COUNT_TEXT[state])}>{counts[state]}</span>
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <p data-slot="alert-list-empty" role="status" className={styles.empty()}>
          <span aria-hidden="true">✓</span>
          {emptyMessage}
        </p>
      ) : (
        <ul aria-label={label} className={styles.list()}>
          {rows.map((alert) => {
            const selected = selectable && alert.id === selectedId;
            const actions = renderActions?.(alert);
            return (
              <li
                key={alert.id}
                data-slot="alert-list-item"
                data-state={alert.state}
                data-severity={alert.severity}
                data-selected={selected || undefined}
                className={styles.row()}
              >
                {selectable ? (
                  <button
                    ref={(node) => { if (node) buttonRefs.current.set(alert.id, node); else buttonRefs.current.delete(alert.id); }}
                    type="button"
                    data-slot="alert-list-select"
                    aria-pressed={selected}
                    tabIndex={alert.id === focusId ? 0 : -1}
                    onFocus={() => setActiveId(alert.id)}
                    onClick={() => setSelectedId(alert.id)}
                    onKeyDown={(event) => onKeyDown(event, alert.id)}
                    className={styles.main({ selectable: true, selected })}
                  >
                    {rowContent(alert)}
                  </button>
                ) : (
                  <div className={styles.main()}>{rowContent(alert)}</div>
                )}
                {actions ? <div data-slot="alert-list-actions" className={styles.actions()}>{actions}</div> : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

AlertList.displayName = 'AlertList';
