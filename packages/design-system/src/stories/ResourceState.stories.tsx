import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button';
import { FreshnessIndicator } from '../components/FreshnessIndicator';
import { ResourceState } from '../components/ResourceState';
import { Skeleton } from '../components/Skeleton';
import { useTraceClock } from '../hooks/useTraceClock';
import { usePolledResource } from '../hooks/usePolledResource';

interface Job {
  name: string;
  outcome: string;
}

const JOBS: Job[] = [
  { name: 'backup-main', outcome: 'ok · 42s' },
  { name: 'release-train', outcome: 'held · CI running' },
  { name: 'deployment-drift', outcome: 'ok · 3s' },
];

function JobList({ jobs }: { jobs: Job[] }) {
  return (
    <ul className="flex flex-col border-2 border-edge-strong font-mono text-sm">
      {jobs.map((job) => (
        <li key={job.name} className="flex justify-between gap-4 border-b border-edge-subtle px-3 py-2 text-content-primary last:border-b-0">
          <span>{job.name}</span>
          <span className="text-content-secondary">{job.outcome}</span>
        </li>
      ))}
    </ul>
  );
}

const meta: Meta<typeof ResourceState> = {
  title: 'Components/Feedback/ResourceState',
  component: ResourceState,
  tags: ['autodocs', 'preview'],
  decorators: [(Story) => <div className="max-w-md">{Story()}</div>],
};
export default meta;
type Story = StoryObj<typeof ResourceState>;

/** Nothing has arrived yet: the `loading` slot, a block `Skeleton` unless the caller passes the shape of the real content. */
export const Loading: Story = {
  render: () => (
    <ResourceState<Job[]> state={{ data: undefined, error: undefined, loading: true }}>{(jobs) => <JobList jobs={jobs} />}</ResourceState>
  ),
};

/** The first load failed and there is nothing to show: the error, under `errorTitle`, in the danger role. */
export const Failed: Story = {
  render: () => (
    <ResourceState<Job[]> state={{ data: undefined, error: 'connect ECONNREFUSED 127.0.0.1:4593', loading: false }} errorTitle="The hub API did not answer">
      {(jobs) => <JobList jobs={jobs} />}
    </ResourceState>
  ),
};

/**
 * A later load failed after an earlier one succeeded. The earlier answer stays on screen — it is
 * more use than nothing — under a warning that says it is not current. The asserted baseline: it
 * draws the note and the data together.
 */
export const Stale: Story = {
  render: () => (
    <ResourceState<Job[]> state={{ data: JOBS, error: 'Request timed out after 10s', loading: false }}>{(jobs) => <JobList jobs={jobs} />}</ResourceState>
  ),
};

/** Data and no error: the render prop, and nothing else. */
export const Ready: Story = {
  render: () => <ResourceState<Job[]> state={{ data: JOBS, error: undefined, loading: false }}>{(jobs) => <JobList jobs={jobs} />}</ResourceState>,
};

/** A loading slot in the shape of the content, so the page does not move when the rows land. */
export const ShapedLoading: Story = {
  render: () => (
    <ResourceState<Job[]>
      state={{ data: undefined, error: undefined, loading: true }}
      loading={
        <div className="flex flex-col gap-2">
          <Skeleton />
          <Skeleton />
          <Skeleton className="w-2/3" />
        </div>
      }
    >
      {(jobs) => <JobList jobs={jobs} />}
    </ResourceState>
  ),
};

function PolledJobs() {
  const calls = useRef(0);
  const resource = usePolledResource(
    () =>
      new Promise<Job[]>((resolve, reject) => {
        const call = ++calls.current;
        setTimeout(() => (call % 3 === 0 ? reject(new Error(`Load ${call} failed on purpose`)) : resolve(JOBS.map((job) => ({ ...job, outcome: `${job.outcome} · #${call}` })))), 600);
      }),
    { intervalMs: 4000 },
  );
  const now = useTraceClock({ interval: 1000 });
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        {resource.updatedAt === undefined ? <span /> : <FreshnessIndicator updatedAt={resource.updatedAt} now={now} staleAfter={10_000} live />}
        <Button size="sm" onClick={resource.reload}>
          Refresh
        </Button>
      </div>
      <ResourceState state={resource}>{(jobs) => <JobList jobs={jobs} />}</ResourceState>
    </div>
  );
}

/**
 * Wired to `usePolledResource`: a load every four seconds while the tab is visible, every third
 * one failing on purpose so the stale state shows, and a `FreshnessIndicator` fed `updatedAt`.
 * Live, so it is not a visual baseline.
 */
export const Polled: Story = {
  render: () => <PolledJobs />,
};
