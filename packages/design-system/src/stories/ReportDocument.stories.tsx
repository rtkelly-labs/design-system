import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReportDocument, ReportDetails, ReportSection } from '../components/ReportDocument';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { CodeBlock } from '../components/docs/CodeBlock';
import { DataTable } from '../components/DataTable';
import { NoteBlock } from '../components/NoteBlock';
import { StatCard } from '../components/StatCard';

/**
 * The frame a generated report is built in.
 *
 * `@rtkelly13/design-system-report` renders reports into this, but the dependency runs one
 * way only: that package depends on this one, so nothing here may import it.
 * The split of responsibility follows — **this package asserts how the report
 * frame looks**, through the story below and its visual baseline, and the
 * generator asserts its own pipeline against its own templates. Each tests what
 * it owns, and neither can pull the other into its graph.
 */
const meta: Meta<typeof ReportDocument> = {
  title: 'Components/Reports/ReportDocument',
  component: ReportDocument,
  tags: ['autodocs', 'preview'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof ReportDocument>;

const checks = [
  { check: 'tokens:check', status: 'pass', detail: 'theme.css matches levels.ts' },
  { check: 'check:contrast', status: 'pass', detail: 'all 200 role pairs' },
  { check: 'check:css', status: 'fail', detail: '328 declarations, budget 320' },
];

/**
 * The shape a real report takes — a verdict line, stats, a table, a disclosure.
 * This is the asserted case in the visual suite.
 */
export const QualityGate: Story = {
  args: {
    title: 'Quality Gate',
    subtitle: 'Every gated check, and what the failing one is asking for.',
    meta: [
      { label: 'Generated', value: '2026-08-19' },
      { label: 'Commit', value: 'acf0345' },
      { label: 'Branch', value: 'main' },
    ],
    children: (
      <>
        <ReportSection title="Summary">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Checks" value={11} />
            <StatCard title="Passing" value={10} accent="success" />
            <StatCard title="Failing" value={1} accent="danger" subtitle="check:css" />
          </div>
          <NoteBlock>
            check:css is a ratchet, so it fails on any rise. Lower the budget when you migrate a
            component; never raise it.
          </NoteBlock>
        </ReportSection>
        <ReportSection title="Detail">
          <ReportDetails summary="check:css — full output" note="3 lines" open>
            {/* `CodeBlock`, not a raw `<pre>`: it already pairs the tabIndex a
                scrollable region needs with the role and name that make the
                focus stop worth landing on. A report emitting fixed-width
                output should reach for it for the same reason. */}
            <CodeBlock title="check:css output">
              {'prose.css   328 declarations   budget 320   OVER by 8'}
            </CodeBlock>
          </ReportDetails>
          <DataTable
            columns={[
              { header: 'Check', accessor: 'check' },
              {
                header: 'Status',
                accessor: (row: (typeof checks)[number]) => (
                  <Badge accent={row.status === 'pass' ? 'success' : 'danger'}>{row.status}</Badge>
                ),
              },
              { header: 'Detail', accessor: 'detail' },
            ]}
            data={checks}
            keyExtractor={(row) => row.check}
          />
        </ReportSection>
      </>
    ),
  },
};

/** Progressive disclosure with no client JS — a `<details>`, open and closed. */
export const Disclosure: StoryObj = {
  render: () => (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-8">
      <ReportDetails summary="Open by default" note="3 lines" open>
        <p className="font-mono text-sm text-content-secondary">
          The block a reader came for should not need a click.
        </p>
      </ReportDetails>
      <ReportDetails summary="Folded away" note="200 rows">
        <p className="font-mono text-sm text-content-secondary">Nothing omitted, nothing in the way.</p>
      </ReportDetails>
    </div>
  ),
};

/** Header only — no metadata strip, no subtitle. */
export const Minimal: Story = {
  args: {
    title: 'Link Audit',
    children: (
      <Card>
        <p className="text-content-secondary">No broken links found across 214 documents.</p>
      </Card>
    ),
  },
};
