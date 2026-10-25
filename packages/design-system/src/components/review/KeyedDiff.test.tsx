import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KeyedDiff } from './KeyedDiff';

describe('KeyedDiff', () => {
  it('draws one row per record with its change word and cells', () => {
    render(
      <KeyedDiff
        caption="Methods by stable id"
        identityLabel="Member"
        columns={['CC']}
        rows={[
          { identity: 'GetFieldConstructorExpression(PropertyModel)', change: 'added', cells: ['8'] },
          { identity: 'Old()', change: 'removed', cells: ['2'] },
        ]}
      />,
    );
    expect(screen.getByRole('table', { name: 'Methods by stable id' })).toBeTruthy();
    const added = screen.getByRole('rowheader', { name: 'GetFieldConstructorExpression(PropertyModel)' }).closest('tr')!;
    expect(added.querySelector('td')!.className).toContain('text-delta-added');
    expect(screen.getByRole('rowheader', { name: 'Old()' }).className).toContain('line-through');
  });

  it('never colours a change as a verdict', () => {
    const { container } = render(<KeyedDiff caption="x" rows={[{ identity: 'a', change: 'changed' }]} />);
    expect(container.innerHTML).not.toMatch(/text-intent-/);
  });

  it('designs the empty case', () => {
    render(<KeyedDiff caption="x" columns={['CC']} rows={[]} emptyText="No methods changed." />);
    expect(screen.getByText('No methods changed.').getAttribute('colspan')).toBe('3');
  });
});
