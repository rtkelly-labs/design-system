/**
 * Starting point for a generated report. Copy it, replace the data, render it:
 *
 *   ds-report my-report.tsx --theme white
 *
 * The rules that matter when editing it:
 *
 *   - Every colour addresses a **role** (`text-content-secondary`,
 *     `border-edge-subtle`, `text-intent-danger`), never a hue. That is what
 *     makes `--theme midnight` and `--theme sketch` both correct.
 *   - Styling is Tailwind utilities on the element. There is no stylesheet to
 *     edit and no `<style>` block to add.
 *   - Nothing here runs in a browser. The output is static HTML, so an
 *     `onClick`, a `useState` or a `Modal` renders inert.
 *
 * This file is shipped as a reference and is not imported by the package.
 */

import {
  Badge,
  Card,
  DataTable,
  NoteBlock,
  ReportDocument,
  ReportSection,
  StatCard,
} from '@rtkelly-labs/design-system';

const rows = [
  { check: 'tokens:check', status: 'pass', detail: 'theme.css matches levels.ts' },
  { check: 'check:contrast', status: 'pass', detail: 'all 200 role pairs' },
  { check: 'check:css', status: 'fail', detail: '328 declarations, budget 320' },
];

export default function Report() {
  return (
    <ReportDocument
      title="Quality Gate"
      subtitle="Every gated check, and what the failing one is asking for."
      meta={[
        { label: 'Generated', value: '2026-08-19' },
        { label: 'Commit', value: <code>acf0345</code> },
        { label: 'Branch', value: 'main' },
      ]}
    >
      <ReportSection title="Summary">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Checks" value={11} />
          <StatCard title="Passing" value={10} accent="success" />
          <StatCard title="Failing" value={1} accent="danger" subtitle="check:css" />
        </div>
        <NoteBlock>
          `check:css` is a ratchet, so it fails on any rise. Lower the budget when you migrate a
          component; never raise it.
        </NoteBlock>
      </ReportSection>

      <ReportSection title="Detail">
        <DataTable
          columns={[
            { header: 'Check', accessor: 'check' },
            {
              header: 'Status',
              accessor: (row) => (
                <Badge accent={row.status === 'pass' ? 'success' : 'danger'}>{row.status}</Badge>
              ),
            },
            { header: 'Detail', accessor: 'detail' },
          ]}
          data={rows}
          keyExtractor={(row) => row.check}
        />
      </ReportSection>

      <ReportSection title="Next">
        <Card>
          <p className="text-content-secondary">
            Migrate one <code>prose.css</code> component onto <code>recipe</code> and lower the
            budget line by its declaration count.
          </p>
        </Card>
      </ReportSection>
    </ReportDocument>
  );
}
