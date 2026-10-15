'use client';

import { DataTable } from '@rtkelly13/design-system';
import type { Column } from '@rtkelly13/design-system';
import { ISSUES_R3, Labels, PRIORITY_CLASS, StatusUnit } from './labels';
import type { Issue, Opt, StatusStyle } from './labels';

/** The package DataTable with a label column in the option's treatment. Client-side because the column accessors are functions. */
export function DataTableScene({ opt, status }: { opt: Opt; status: StatusStyle | 'none' }) {
  const columns: Column<Issue>[] = [];
  if (opt === 'F') {
    columns.push({ header: 'ST', accessor: (r) => <StatusUnit style="glyph" status={r.status} />, enableSorting: false, className: 'w-8 !px-2' });
  }
  columns.push(
    { header: 'ID', accessor: 'id', rowHeader: true, className: 'whitespace-nowrap' },
    { header: 'TITLE', accessor: 'title', className: 'min-w-[16rem]' },
    { header: 'LABELS', accessor: (r) => <Labels opt={opt} ids={r.labels} ctx="table" />, enableSorting: false, className: 'w-44 min-w-44' },
  );
  if (status !== 'none') {
    columns.push({
      header: 'STATUS',
      accessor: (r) => <StatusUnit style={status} status={r.status} />,
      sortValue: (r) => r.status,
    });
  }
  columns.push({
    header: 'PRI',
    accessor: (r) => <span className={`font-bold ${PRIORITY_CLASS[r.pri]}`}>{r.pri}</span>,
    sortValue: (r) => r.pri,
  });
  return (
    <DataTable
      caption="Issues (8 rows)"
      data={ISSUES_R3}
      columns={columns}
      keyExtractor={(r) => r.id}
      density="compact"
      appearance="quiet"
    />
  );
}
