import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import type { TraceSpanInput } from '../lib/trace';
import { TraceViewer } from './TraceViewer';

const spans: TraceSpanInput[] = [
  { id: 'a', name: 'GET /checkout', service: 'web', kind: 'server', start: 0, end: 400 },
  { id: 'b', parentId: 'a', name: 'SELECT cart_items', service: 'postgres', start: 20, end: 140, attributes: { 'db.system': 'postgresql', rows: 12 } },
  { id: 'c', parentId: 'a', name: 'payment.authorize', service: 'payments', start: 160, end: 390, status: 'error' },
];

describe('TraceViewer', () => {
  it('summarises the trace and shows the first root by default', () => {
    const ref = createRef<HTMLElement>();
    render(<TraceViewer ref={ref} spans={spans} title="checkout 4f2a" />);
    expect(ref.current?.getAttribute('data-slot')).toBe('trace-viewer');
    expect(screen.getByRole('region', { name: 'checkout 4f2a' })).toBeTruthy();
    const details = screen.getByRole('complementary', { name: 'Span details' });
    expect(within(details).getByText('GET /checkout')).toBeTruthy();
    expect(within(details).getByText('server')).toBeTruthy();
    expect(within(details).getByText('50ms')).toBeTruthy();
  });

  it('shows a selected span’s timing and attributes', () => {
    render(<TraceViewer spans={spans} />);
    fireEvent.click(screen.getByRole('treeitem', { name: /^SELECT cart_items/ }));
    const details = screen.getByRole('complementary', { name: 'Span details' });
    expect(within(details).getByText('+20ms')).toBeTruthy();
    expect(within(details).getByText('postgresql')).toBeTruthy();
    expect(within(details).getByText('12')).toBeTruthy();
    expect(within(details).getByText('GET /checkout')).toBeTruthy();
  });

  it('filters the waterfall from its search field', () => {
    render(<TraceViewer spans={spans} />);
    fireEvent.change(screen.getByLabelText('Filter spans'), { target: { value: 'payments' } });
    expect(screen.getAllByRole('treeitem').map((row) => row.getAttribute('data-span-id'))).toEqual(['a', 'c']);
  });

  it('can start with nothing selected and without search', () => {
    render(<TraceViewer spans={spans} defaultSelectedId={null} searchable={false} />);
    expect(screen.getByText('Select a span to see its details.')).toBeTruthy();
    expect(screen.queryByLabelText('Filter spans')).toBeNull();
  });
});
