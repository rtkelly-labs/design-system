import type { Meta, StoryObj } from '@storybook/react-vite';
import { DataTable } from '../components/DataTable';
import type { Column } from '../components/DataTable';
import { InlineAction } from '../components/InlineAction';

const meta: Meta<typeof InlineAction> = {
  title: 'Components/Actions & Forms/InlineAction',
  component: InlineAction,
  tags: ['autodocs', 'preview'],
};

export default meta;
type Story = StoryObj<typeof InlineAction>;

/**
 * Inside a sentence: the action takes the paragraph's font and size and adds
 * only the accent ink and the underline. A `<button>`, because it runs a
 * handler rather than going anywhere.
 */
export const InSentence: Story = {
  render: () => (
    <p className="max-w-prose text-content-primary">
      The last run exited with code 1 after 41 seconds.{' '}
      <InlineAction onClick={() => undefined}>View its output</InlineAction> or{' '}
      <InlineAction onClick={() => undefined}>run it again</InlineAction>.
    </p>
  ),
};

interface Run {
  id: string;
  job: string;
  state: string;
}

const runs: Run[] = [
  { id: 'run_8f2c', job: 'estate audit', state: 'ok' },
  { id: 'run_1b7e', job: 'chrome-tabs prune', state: 'failed' },
  { id: 'run_c0ff', job: 'workspace sync', state: 'running' },
];

const runColumns: Column<Run>[] = [
  { header: 'JOB', accessor: 'job', rowHeader: true },
  { header: 'STATE', accessor: 'state' },
  {
    header: 'OUTPUT',
    accessor: (row) => (
      <InlineAction className="font-mono" disabled={row.state === 'running'} onClick={() => undefined}>
        view output
      </InlineAction>
    ),
  },
  {
    header: 'RUN',
    accessor: (row) => (
      <InlineAction className="font-mono" href={`#${row.id}`}>
        {row.id}
      </InlineAction>
    ),
  },
];

/**
 * In `DataTable` cells, the shape it was made for: one action per row that
 * does not turn the column into a wall of buttons. `view output` is a button,
 * disabled on the row still running; the run id is the `href` form, a link
 * through `LinkProvider`. `className="font-mono"` sets the cell's typeface,
 * which is what `className` is for here.
 */
export const InTable: Story = {
  render: () => (
    <DataTable<Run>
      caption="Recent runs"
      density="compact"
      data={runs}
      keyExtractor={(row) => row.id}
      enableSorting={false}
      columns={runColumns}
    />
  ),
};

/**
 * Both tones, enabled and disabled. `accent` is the default and the one to
 * reach for. `quiet` is for housekeeping beside the content it acts on —
 * `clear`, `reset` — where an accent would compete with the content. Disabled
 * is muted ink with no underline and no hover: it no longer reads as
 * something to press.
 */
export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-6 font-mono text-sm text-content-primary">
      <InlineAction onClick={() => undefined}>accent</InlineAction>
      <InlineAction tone="quiet" onClick={() => undefined}>
        quiet
      </InlineAction>
      <InlineAction disabled>disabled</InlineAction>
      <InlineAction tone="quiet" disabled>
        quiet disabled
      </InlineAction>
    </div>
  ),
};
