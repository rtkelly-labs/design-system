'use client';

import { useState } from 'react';
import {
  Badge,
  BarChart,
  Button,
  DataTable,
  Modal,
  Sparkline,
  StatCard,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  useToast,
} from '@/ds';
import type { Column } from '@/ds';
import {
  DEPLOYMENTS,
  DEPLOYS_14D,
  ERROR_RATE_24H,
  REGION_TRAFFIC,
  SUMMARY,
  formatDuration,
  formatStamp,
} from '@/data/fixtures';
import type { Deployment } from '@/data/fixtures';
import { DemoPanel } from './DemoPanel';

const STATUS_INTENT = { LIVE: 'success', FAILED: 'danger', 'ROLLED BACK': 'warning', BUILDING: 'info' } as const;
const WINDOWS = ['24h', '7d', '30d'] as const;

/**
 * The homepage's centrepiece: a deploy dashboard composed only of package
 * components and seeded fixtures. Everything responds — sort the table, page
 * it, switch the chart's window, promote a preview deploy — and every panel
 * links to the page that documents its component.
 */
export function Dashboard() {
  const toast = useToast();
  const [range, setRange] = useState<string>('7d');
  const [promoting, setPromoting] = useState<Deployment | null>(null);
  const [promoted, setPromoted] = useState<ReadonlySet<string>>(new Set());

  const columns: Column<Deployment>[] = [
    { header: 'SERVICE', accessor: 'service', rowHeader: true },
    {
      header: 'STATUS',
      accessor: (row) => (
        <Badge accent={promoted.has(row.id) ? 'success' : STATUS_INTENT[row.status]}>
          {promoted.has(row.id) ? 'LIVE' : row.status}
        </Badge>
      ),
      sortValue: (row) => row.status,
    },
    { header: 'BRANCH', accessor: 'branch', className: 'max-w-40 truncate' },
    {
      header: 'BUILD',
      accessor: (row) => (row.duration ? formatDuration(row.duration) : '—'),
      sortValue: (row) => row.duration,
      className: 'tabular-nums',
    },
    { header: 'STARTED', accessor: (row) => formatStamp(row.startedAt), sortValue: (row) => row.startedAt },
    {
      header: 'ACTION',
      enableSorting: false,
      accessor: (row) =>
        row.environment === 'preview' && row.status === 'LIVE' && !promoted.has(row.id) ? (
          <Button size="sm" variant="primary" onClick={() => setPromoting(row)}>
            PROMOTE<span className="sr-only"> {row.service} {row.commit}</span>
          </Button>
        ) : (
          <span className="text-content-muted">—</span>
        ),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <DemoPanel label="StatCard" docs="/docs/components" className="lg:col-span-1">
        <StatCard title="Deploys, 7 days" value={SUMMARY.deploys} change="+12%" subtitle="vs previous week" accent="primary" />
      </DemoPanel>
      <DemoPanel label="StatCard" docs="/docs/components" className="lg:col-span-1">
        <StatCard
          title="Success rate"
          value={SUMMARY.successRate}
          change={`${SUMMARY.failed} failed`}
          changeType="negative"
          subtitle={`median build ${SUMMARY.medianDuration}`}
          accent="secondary"
        />
      </DemoPanel>
      <DemoPanel label="Sparkline" docs="/docs/components" className="lg:col-span-1">
        <div className="flex flex-col gap-4 font-mono text-xs uppercase text-content-muted">
          <div className="flex items-center justify-between gap-4">
            <span>Deploys / day, 14d</span>
            <Sparkline data={[...DEPLOYS_14D]} width={120} height={32} accent="primary" ariaLabel="Deploys per day over 14 days" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Error ‰, 24h</span>
            <Sparkline data={[...ERROR_RATE_24H]} width={120} height={32} accent="danger" showArea ariaLabel="Error rate per mille over 24 hours" />
          </div>
        </div>
      </DemoPanel>

      <DemoPanel label="BarChart + Tabs" docs="/docs/components/bar-chart" className="lg:col-span-3">
        <Tabs value={range} onValueChange={setRange}>
          <TabsList label="Traffic window">
            {WINDOWS.map((w) => (
              <TabsTab key={w} value={w}>
                {w.toUpperCase()}
              </TabsTab>
            ))}
          </TabsList>
          {WINDOWS.map((w) => (
            <TabsPanel key={w} value={w} className="pt-4">
              {/* Sized wrapper: a responsive BarChart has no height of its own (issue 306). */}
              <div className="h-[240px]">
                <BarChart
                  responsive
                  height={240}
                  data={[...REGION_TRAFFIC[w]]}
                  accent="tertiary"
                  ariaLabel={`Requests by region over ${w}, in thousands`}
                />
              </div>
            </TabsPanel>
          ))}
        </Tabs>
      </DemoPanel>

      <DemoPanel label="DataTable" docs="/docs/components/data-table" className="lg:col-span-3">
        <DataTable
          caption="Recent deployments"
          data={[...DEPLOYMENTS]}
          columns={columns}
          pageSize={6}
          keyExtractor={(row) => row.id}
        />
      </DemoPanel>

      <Modal
        isOpen={promoting !== null}
        onClose={() => setPromoting(null)}
        title={promoting ? `Promote ${promoting.service}` : 'Promote'}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button size="sm" variant="inverse" onClick={() => setPromoting(null)}>
              CANCEL
            </Button>
            <Button
              size="sm"
              variant="primary"
              bracketed
              onClick={() => {
                if (!promoting) return;
                setPromoted((current) => new Set(current).add(promoting.id));
                toast.show({
                  title: 'Promoted',
                  description: `${promoting.service} ${promoting.commit} is live in ${promoting.region}`,
                  intent: 'success',
                });
                setPromoting(null);
              }}
            >
              PROMOTE
            </Button>
          </div>
        }
      >
        {promoting ? (
          <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 font-mono text-sm">
            <dt className="text-content-muted">COMMIT</dt>
            <dd className="m-0">{promoting.commit}</dd>
            <dt className="text-content-muted">BRANCH</dt>
            <dd className="m-0">{promoting.branch}</dd>
            <dt className="text-content-muted">REGION</dt>
            <dd className="m-0">{promoting.region}</dd>
            <dt className="text-content-muted">AUTHOR</dt>
            <dd className="m-0">{promoting.author}</dd>
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}
