import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './Table';

/**
 * A compound API, so the thing worth asserting is that the parts still produce a
 * real table — the semantics a screen reader and a crawler both read.
 *
 * `Table` also wraps itself in a scroll container, which is why the `data-slot`
 * names matter: a consumer adjusting the cell padding has to be able to reach
 * past the wrapper.
 */
describe('Table', () => {
  const Example = () => (
    <Table>
      <TableCaption>Quarterly figures</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Quarter</TableHead>
          <TableHead>Revenue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Q1</TableCell>
          <TableCell>120</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell>120</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );

  it('renders a table with its rows, headers and cells', () => {
    render(<Example />);
    expect(screen.getByRole('table')).toBeDefined();
    expect(screen.getAllByRole('columnheader')).toHaveLength(2);
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByRole('cell', { name: 'Q1' })).toBeDefined();
  });

  it('names the table with its caption', () => {
    render(<Example />);
    expect(screen.getByRole('table', { name: 'Quarterly figures' })).toBeDefined();
  });

  it('scopes a header cell to its column unless told it heads a row', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Node</TableHead>
            <TableHead>Load</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row">edge-1</TableHead>
            <TableCell>0.4</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getAllByRole('columnheader').map((th) => th.getAttribute('scope'))).toEqual(['col', 'col']);
    const rowHeader = screen.getByRole('rowheader', { name: 'edge-1' });
    expect(rowHeader.getAttribute('scope')).toBe('row');
    // A row header takes the body cell's geometry, not the column header's
    // display face — it reads as the first cell of its row.
    expect(rowHeader.className).not.toContain('uppercase');
  });

  it('exposes every part with a data-slot', () => {
    const { container } = render(<Example />);
    for (const slot of ['table-container', 'table', 'table-caption', 'table-header', 'table-body', 'table-footer', 'table-row', 'table-head', 'table-cell']) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it('merges a caller className on the table and on the container separately', () => {
    const { container } = render(<Table className="mt-4" containerClassName="max-w-md"><TableBody><TableRow><TableCell>x</TableCell></TableRow></TableBody></Table>);
    expect(container.querySelector('[data-slot="table"]')?.className).toContain('mt-4');
    expect(container.querySelector('[data-slot="table-container"]')?.className).toContain('max-w-md');
  });
});
