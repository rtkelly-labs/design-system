'use client';

import { Activity, Bell, FileText, GitBranch, LayoutDashboard, Network } from 'lucide-react';
import { forwardRef, useMemo, useState, type HTMLAttributes } from 'react';
import { AlertList } from '../AlertList';
import { AppMain, AppShell, AppSidebar, AppSidebarNav, AppTopbar, type AppNavItem } from '../AppShell';
import { Badge } from '../Badge';
import { FilterBar } from '../FilterBar';
import { FreshnessIndicator } from '../FreshnessIndicator';
import { IdChip } from '../IdChip';
import { IncidentTimeline } from '../IncidentTimeline';
import { LatencyHeatmap } from '../LatencyHeatmap';
import { LatencyHistogram } from '../LatencyHistogram';
import { LogViewer } from '../LogViewer';
import { ServiceMap } from '../ServiceMap';
import { StatCard } from '../StatCard';
import { TimeRangePicker, TimeRangeProvider, useTimeRange } from '../TimeRange';
import { TimeSeriesChart } from '../TimeSeriesChart';
import { TraceViewer } from '../TraceViewer';
import { cn } from '../../lib/recipe';
import { matchFilters, type Filter } from '../../lib/filters';
import {
  INCIDENT_WINDOW,
  LATENCY_SAMPLES,
  LATENCY_SERIES,
  OBSERVABILITY_ALERTS,
  OBSERVABILITY_FILTER_FIELDS,
  OBSERVABILITY_INCIDENT,
  OBSERVABILITY_LOGS,
  OBSERVABILITY_NOW,
  OBSERVABILITY_SPANS,
  OBSERVABILITY_STATS,
  OBSERVABILITY_TRACES,
  THROUGHPUT_SERIES,
} from './observabilityData';

type View = 'overview' | 'logs' | 'traces' | 'services' | 'alerts';

const NAV: AppNavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'traces', label: 'Traces', icon: GitBranch },
  { id: 'services', label: 'Service map', icon: Network },
  { id: 'alerts', label: 'Alerts', icon: Bell, badge: <Badge accent="danger">1</Badge> },
];

const DEPLOY_ANNOTATION = { time: OBSERVABILITY_INCIDENT.events.find((event) => event.kind === 'deploy')!.time, label: 'rollback payments v2.13.2', intent: 'info' as const };
const SECTION = 'flex min-w-0 flex-col gap-3 border-2 border-edge-default bg-surface-raised p-4';
const HEADING = 'font-mono text-xs font-bold uppercase tracking-wide text-content-secondary';

/** The trace a log line points at, or the slowest failing one. */
function findTrace(traceId: string | null) {
  return OBSERVABILITY_TRACES.find((trace) => trace.traceId === traceId)
    ?? OBSERVABILITY_TRACES.filter((trace) => trace.failed).reduce((a, b) => (b.spans[0]!.end! - b.spans[0]!.start > a.spans[0]!.end! - a.spans[0]!.start ? b : a));
}

function Overview({ onOpenTrace, onOpenAlerts }: { onOpenTrace: (id: string) => void; onOpenAlerts: () => void }) {
  const range = useTimeRange();
  const inRange = (time: number) => !range || (time >= range.range.from && time <= range.range.to);
  const samples = useMemo(() => LATENCY_SAMPLES.filter((sample) => inRange(sample.time)).map((sample) => sample.value),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `inRange` is derived from the two numbers below
    [range?.range.from, range?.range.to]);
  const errorLogs = OBSERVABILITY_LOGS.filter((entry) => entry.severity === 'error' || entry.severity === 'warn');
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="p99 latency · 1h" value={`${OBSERVABILITY_STATS.p99}ms`} change="+1.9s vs 6h" changeType="negative" accent="danger" />
        <StatCard title="Error rate · 1h" value={`${OBSERVABILITY_STATS.errorRate}%`} change="SLO 1%" changeType="negative" accent="warning" />
        <StatCard title="Throughput" value={`${OBSERVABILITY_STATS.rps} req/s`} change="steady" changeType="neutral" accent="primary" />
        <StatCard title="Open incidents" value="0" change="INC-482 resolved" changeType="positive" accent="success" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section aria-label="Latency" className={SECTION}>
          <h2 className={HEADING}>Latency · POST /checkout</h2>
          <TimeSeriesChart
            title="Checkout latency percentiles"
            series={LATENCY_SERIES}
            unit="ms"
            thresholds={[{ value: 1500, label: 'SLO 1.5s', intent: 'danger' }]}
            annotations={[DEPLOY_ANNOTATION]}
          />
        </section>
        <section aria-label="Throughput" className={SECTION}>
          <h2 className={HEADING}>Throughput by status</h2>
          <TimeSeriesChart title="Requests per second by status class" series={THROUGHPUT_SERIES} variant="stacked" unit="req/s" annotations={[DEPLOY_ANNOTATION]} />
        </section>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-label="Latency heatmap" className={SECTION}>
          <h2 className={HEADING}>Latency distribution over time</h2>
          <LatencyHeatmap title="Checkout latency heatmap" points={LATENCY_SAMPLES} />
        </section>
        <section aria-label="Latency histogram" className={SECTION}>
          <h2 className={HEADING}>Latency histogram · selected window</h2>
          <LatencyHistogram title="Checkout latency histogram" samples={samples} slo={{ value: 1500, label: 'SLO' }} />
        </section>
      </div>
      <div className="flex flex-col gap-4">
        <section aria-label="Alerts summary" className={SECTION}>
          <div className="flex items-baseline justify-between gap-2">
            <h2 className={HEADING}>Alerts</h2>
            <button type="button" onClick={onOpenAlerts} className="cursor-pointer font-mono text-xs text-accent-primary underline underline-offset-2">All alerts →</button>
          </div>
          <AlertList alerts={OBSERVABILITY_ALERTS} now={OBSERVABILITY_NOW} heading="Active and recent" />
        </section>
        <section aria-label="Warnings and errors" className={SECTION}>
          <h2 className={HEADING}>Warnings and errors</h2>
          <LogViewer entries={errorLogs} height={300} onTraceSelect={onOpenTrace} label="Warning and error log lines" />
        </section>
      </div>
    </div>
  );
}

function Logs({ onOpenTrace }: { onOpenTrace: (id: string) => void }) {
  const [filters, setFilters] = useState<Filter[]>([{ key: 'service', operator: '=', value: 'payments' }]);
  const entries = useMemo(
    () => OBSERVABILITY_LOGS.filter((entry) => matchFilters({ ...entry.fields, ...entry }, filters)),
    [filters],
  );
  const query = filters.find((filter) => filter.key === '*')?.value;
  return (
    <section aria-label="Logs" className={SECTION}>
      <FilterBar
        label="Filter logs"
        filters={filters}
        onFiltersChange={setFilters}
        fields={OBSERVABILITY_FILTER_FIELDS}
        placeholder="service=payments, severity=error, or text"
        summary={`${entries.length} of ${OBSERVABILITY_LOGS.length} lines`}
      />
      <LogViewer entries={entries} query={query} height={560} onTraceSelect={onOpenTrace} label="Checkout log lines" />
    </section>
  );
}

function Traces({ traceId, onOpenTrace }: { traceId: string | null; onOpenTrace: (id: string) => void }) {
  const trace = findTrace(traceId);
  const failing = OBSERVABILITY_TRACES.filter((candidate) => candidate.failed).slice(0, 8);
  return (
    <div className="grid gap-4 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <section aria-label="Failing traces" className={SECTION}>
        <h2 className={HEADING}>Failing traces</h2>
        <ul className="flex flex-col gap-1">
          {failing.map((candidate) => (
            <li key={candidate.traceId}>
              <button
                type="button"
                aria-pressed={candidate.traceId === trace.traceId}
                onClick={() => onOpenTrace(candidate.traceId)}
                className={cn('w-full cursor-pointer border border-edge-subtle px-2 py-1 text-left font-mono text-xs hover:bg-surface-sunken', candidate.traceId === trace.traceId && 'border-accent-primary bg-surface-sunken')}
              >
                {candidate.traceId.slice(0, 12)}… · {(candidate.spans[0]!.end! - candidate.spans[0]!.start)}ms
              </button>
            </li>
          ))}
        </ul>
      </section>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-content-secondary">
          <IdChip label="trace" value={trace.traceId} />
          <span>{trace.failed ? 'failed at the payment acquirer' : 'completed'}</span>
        </div>
        <TraceViewer key={trace.traceId} spans={trace.spans} title={`POST /checkout · ${trace.traceId.slice(0, 8)}`} replay defaultSelectedId={trace.spans.find((span) => span.status === 'error' && span.name.startsWith('POST'))?.id} />
      </div>
    </div>
  );
}

export interface ObservabilityConsoleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'> {
  /** The view open on mount. Default `overview`. */
  defaultView?: View;
}

/**
 * An ops console for a checkout service the hour after an incident: one
 * shared time range across latency and throughput charts, a latency heatmap
 * and histogram, alerts with the incident's timeline, filterable logs whose
 * trace ids open a replayable trace, and a service map built from the same
 * spans. Every number comes from one seeded dataset, so the views agree.
 *
 * A composition of exported components and nothing else — the acceptance
 * test for the observability surface (#407), served at `/site/examples/observability/`.
 */
export const ObservabilityConsole = forwardRef<HTMLDivElement, ObservabilityConsoleProps>(function ObservabilityConsole({ defaultView = 'overview', ...props }, ref) {
  const [view, setView] = useState<View>(defaultView);
  const [traceId, setTraceId] = useState<string | null>(null);
  const openTrace = (id: string) => { setTraceId(id); setView('traces'); };
  const current = NAV.find((item) => item.id === view)!;

  return (
    <TimeRangeProvider now={OBSERVABILITY_NOW} defaultPresetId="1h">
      <AppShell
        ref={ref}
        data-slot="observability-console"
        {...props}
        sidebar={
          <AppSidebar
            label="Observability"
            header={
              <div className="flex flex-col gap-1">
                <span className="flex items-center gap-2 font-display text-lg font-black uppercase text-accent-primary"><Activity aria-hidden="true" className="h-5 w-5" /> OBSERVE</span>
                <span className="font-mono text-xs text-content-muted">checkout · eu-west-1 · prod</span>
              </div>
            }
          >
            <AppSidebarNav label="Observability" items={NAV} activeId={view} onNavigate={(id) => setView(id as View)} />
          </AppSidebar>
        }
        topbar={
          <AppTopbar label="Time range" actions={<FreshnessIndicator updatedAt={OBSERVABILITY_NOW - 8_000} now={OBSERVABILITY_NOW} live />}>
            <TimeRangePicker />
          </AppTopbar>
        }
      >
        <AppMain label={String(current.label)}>
          <div className="flex flex-col gap-4 p-4 lg:p-6">
            <h1 className="font-display text-2xl font-black uppercase tracking-wide">{String(current.label)}</h1>
            {view === 'overview' ? <Overview onOpenTrace={openTrace} onOpenAlerts={() => setView('alerts')} /> : null}
            {view === 'logs' ? <Logs onOpenTrace={openTrace} /> : null}
            {view === 'traces' ? <Traces traceId={traceId} onOpenTrace={openTrace} /> : null}
            {view === 'services' ? (
              <section aria-label="Service map" className={SECTION}>
                <h2 className={HEADING}>Dependencies · {OBSERVABILITY_TRACES.length} sampled checkout traces</h2>
                <ServiceMap title="Checkout service map" spans={OBSERVABILITY_SPANS} defaultSelectedId="payments" />
              </section>
            ) : null}
            {view === 'alerts' ? (
              <div className="grid gap-4 xl:grid-cols-2">
                <section aria-label="Alerts" className={SECTION}><AlertList alerts={OBSERVABILITY_ALERTS} now={OBSERVABILITY_NOW} defaultSelectedId="a1" /></section>
                <section aria-label="Incident" className={SECTION}>
                  <IncidentTimeline title={OBSERVABILITY_INCIDENT.title} severity={OBSERVABILITY_INCIDENT.severity} events={OBSERVABILITY_INCIDENT.events} now={OBSERVABILITY_NOW} />
                </section>
              </div>
            ) : null}
          </div>
        </AppMain>
      </AppShell>
    </TimeRangeProvider>
  );
});

ObservabilityConsole.displayName = 'ObservabilityConsole';

/** The incident window, for callers that want to open the console zoomed onto it. */
export const OBSERVABILITY_INCIDENT_WINDOW = INCIDENT_WINDOW;
