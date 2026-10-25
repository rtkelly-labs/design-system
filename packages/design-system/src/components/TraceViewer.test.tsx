import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TraceSpanInput } from '../lib/trace';
import { TraceViewer } from './TraceViewer';

const spans: TraceSpanInput[] = [
  { id: 'a', name: 'GET /checkout', service: 'web', kind: 'server', start: 0, end: 400 },
  { id: 'b', parentId: 'a', name: 'SELECT cart_items', service: 'postgres', start: 20, end: 140, attributes: { 'db.system': 'postgresql', rows: 12 } },
  { id: 'c', parentId: 'a', name: 'payment.authorize', service: 'payments', start: 160, end: 390, status: 'error' },
];

describe('TraceViewer', () => {
  it('zooms the waterfall to the selected span with 5% either side', () => {
    const onWindowChange = vi.fn();
    const { container } = render(<TraceViewer spans={spans} defaultSelectedId="b" onWindowChange={onWindowChange} />);
    fireEvent.click(within(screen.getByRole('complementary', { name: 'Span details' })).getByRole('button', { name: 'Zoom to span' }));
    expect(onWindowChange.mock.lastCall?.[0].start).toBeCloseTo(14);
    expect(onWindowChange.mock.lastCall?.[0].end).toBeCloseTo(146);
    expect(container.querySelector('[data-slot="trace-waterfall"]')!.getAttribute('data-window')).toBe('14 146');
  });

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

  describe('replay', () => {
    afterEach(() => vi.useRealTimers());
    const rows = () => screen.queryAllByRole('treeitem').map((row) => row.getAttribute('data-span-id'));

    it('shows the whole trace until played, then draws spans as they start', () => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance', 'Date'] });
      render(<TraceViewer spans={spans} replay />);
      expect(rows()).toEqual(['a', 'b', 'c']);
      fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
      expect(rows()).toEqual(['a']);
      act(() => { vi.advanceTimersByTime(100); });
      expect(rows()).toEqual(['a', 'b']);
      expect(screen.getByRole('treeitem', { name: /^SELECT cart_items/ }).getAttribute('data-in-flight')).toBe('true');
      fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
      act(() => { vi.advanceTimersByTime(1000); });
      expect(rows()).toEqual(['a', 'b']);
    });

    it('scrubs and changes speed from the transport', () => {
      render(<TraceViewer spans={spans} replay />);
      const scrubber = screen.getByRole('slider', { name: 'Replay position' });
      fireEvent.change(scrubber, { target: { value: '200' } });
      expect(rows()).toEqual(['a', 'b', 'c']);
      expect(screen.getByRole('treeitem', { name: /^payment.authorize/ }).getAttribute('data-status')).toBe('unset');
      expect(screen.getByText('200ms / 400ms')).toBeTruthy();
      const fast = screen.getByRole('button', { name: '4×' });
      fireEvent.click(fast);
      expect(fast.getAttribute('aria-pressed')).toBe('true');
      expect(screen.getByRole('button', { name: '1×' }).getAttribute('aria-pressed')).toBe('false');
    });

    it('has no transport without replay', () => {
      render(<TraceViewer spans={spans} />);
      expect(screen.queryByRole('group', { name: 'Replay' })).toBeNull();
    });
  });
});
