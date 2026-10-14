// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';

describe('Table prints unclipped (PT-03, INB-11)', () => {
  const view = () =>
    render(
      <Table containerClassName="max-h-64 overflow-y-auto">
        <TableHeader>
          <TableRow>
            <TableHead>A</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>1</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

  it('lifts the scroll container’s clipping on paper, even when the caller caps it', () => {
    const { container } = view();
    const cls = container.querySelector('[data-slot="table-container"], div')?.className ?? '';
    expect(cls).toContain('print:max-h-none');
    expect(cls).toContain('print:overflow-visible');
  });

  it('keeps rows whole and repeats the header per page', () => {
    const { container } = view();
    for (const row of container.querySelectorAll('tbody tr')) expect(row.className).toContain('print:break-inside-avoid');
    expect(container.querySelector('thead')?.className).toContain('print:table-header-group');
  });
});
