import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { TraceSpanInput } from '../lib/trace';
import { TraceWaterfall } from './TraceWaterfall';

const spans: TraceSpanInput[] = [
  { id: 'a', name: 'GET /checkout', service: 'web', start: 0, end: 400 },
  { id: 'b', parentId: 'a', name: 'cart.load', service: 'cart', start: 10, end: 150 },
  { id: 'c', parentId: 'b', name: 'SELECT cart_items', service: 'postgres', start: 20, end: 140 },
  { id: 'd', parentId: 'a', name: 'payment.authorize', service: 'payments', start: 160, end: 390, status: 'error' },
];

const rowNames = () => screen.getAllByRole('treeitem').map((row) => row.getAttribute('data-span-id'));

describe('TraceWaterfall', () => {
  it('renders a tree of spans described in words, and forwards its ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<TraceWaterfall ref={ref} spans={spans} data-testid="waterfall" />);
    expect(ref.current?.getAttribute('data-slot')).toBe('trace-waterfall');
    const tree = screen.getByRole('tree', { name: 'Trace waterfall' });
    expect(within(tree).getAllByRole('treeitem')).toHaveLength(4);
    expect(screen.getByRole('treeitem', { name: 'payment.authorize, payments, starts at 160ms, takes 230ms, error, on the critical path' })).toBeTruthy();
    expect(screen.getByText('4 spans across 4 services over 400ms, 1 with errors.')).toBeTruthy();
    expect(screen.getByRole('treeitem', { name: /^SELECT cart_items/ }).getAttribute('aria-level')).toBe('3');
  });

  it('selects on click and on Enter, reporting the id', () => {
    const onSelectedChange = vi.fn();
    render(<TraceWaterfall spans={spans} onSelectedChange={onSelectedChange} />);
    fireEvent.click(screen.getByRole('treeitem', { name: /^cart.load/ }));
    expect(onSelectedChange).toHaveBeenLastCalledWith('b');
    expect(screen.getByRole('treeitem', { name: /^cart.load/ }).getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(screen.getByRole('treeitem', { name: /^GET/ }), { key: 'Enter' });
    expect(onSelectedChange).toHaveBeenLastCalledWith('a');
  });

  it('moves focus with the arrow keys and collapses and expands with Left and Right', () => {
    render(<TraceWaterfall spans={spans} />);
    const root = screen.getByRole('treeitem', { name: /^GET/ });
    expect(root.tabIndex).toBe(0);
    fireEvent.keyDown(root, { key: 'ArrowDown' });
    const cart = screen.getByRole('treeitem', { name: /^cart.load/ });
    expect(document.activeElement).toBe(cart);
    fireEvent.keyDown(cart, { key: 'ArrowLeft' });
    expect(cart.getAttribute('aria-expanded')).toBe('false');
    expect(rowNames()).toEqual(['a', 'b', 'd']);
    fireEvent.keyDown(cart, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(root);
    fireEvent.keyDown(root, { key: 'End' });
    expect(document.activeElement?.getAttribute('data-span-id')).toBe('d');
    fireEvent.keyDown(screen.getByRole('treeitem', { name: /^cart.load/ }), { key: 'ArrowRight' });
    expect(rowNames()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('never takes focus back after a key press that did not move', () => {
    const outside = document.createElement('input');
    document.body.append(outside);
    const { rerender } = render(<TraceWaterfall spans={spans} />);
    const root = screen.getByRole('treeitem', { name: /^GET/ });
    fireEvent.keyDown(root, { key: 'End' });
    const last = screen.getByRole('treeitem', { name: /^payment/ });
    fireEvent.keyDown(last, { key: 'End' });
    outside.focus();
    // Filtering the active row away moves the roving tab stop, and must leave focus where the user put it.
    rerender(<TraceWaterfall spans={spans} filter="cart" />);
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it('toggles from the disclosure glyph without selecting', () => {
    const onSelectedChange = vi.fn();
    const { container } = render(<TraceWaterfall spans={spans} onSelectedChange={onSelectedChange} />);
    fireEvent.click(container.querySelector('[data-span-id="a"] [data-part="toggle"]')!);
    expect(rowNames()).toEqual(['a']);
    expect(onSelectedChange).not.toHaveBeenCalled();
  });

  it('filters to matches and their ancestors, and says when nothing matches', () => {
    const { rerender } = render(<TraceWaterfall spans={spans} filter="postgres" />);
    expect(rowNames()).toEqual(['a', 'b', 'c']);
    rerender(<TraceWaterfall spans={spans} filter="nothing-like-this" />);
    expect(screen.getByText('No spans match the filter.')).toBeTruthy();
  });

  it('marks in-flight spans and grows them with now', () => {
    const live: TraceSpanInput[] = [{ id: 'r', name: 'deploy', service: 'ci', start: 0 }, { id: 's', parentId: 'r', name: 'build', service: 'ci', start: 0, end: 50 }];
    const { rerender, container } = render(<TraceWaterfall spans={live} now={100} />);
    expect(screen.getByRole('treeitem', { name: 'deploy, ci, starts at 0ms, running for 100ms, on the critical path' })).toBeTruthy();
    expect(container.querySelector('[data-slot="trace-waterfall"]')!.hasAttribute('data-live')).toBe(true);
    rerender(<TraceWaterfall spans={live} now={250} />);
    expect(screen.getByText('250ms…')).toBeTruthy();
  });

  it('keeps one axis label per interval while a trace grows from zero length', () => {
    const { container, rerender } = render(<TraceWaterfall spans={[{ id: 'r', name: 'job', start: 0 }]} now={0} />);
    rerender(<TraceWaterfall spans={[{ id: 'r', name: 'job', start: 0 }]} now={400} />);
    const labels = [...container.querySelectorAll('[data-part="axis"] > span:nth-child(2) > span')].map((node) => node.textContent);
    expect(labels).toEqual(['0ms', '100ms', '200ms', '300ms']);
  });

  it('holds the axis to a fixed range, draws a playhead, and animates rows on request', () => {
    const { container } = render(<TraceWaterfall spans={[{ id: 'r', name: 'job', start: 0, end: 100 }]} range={400} playhead={100} animate />);
    const labels = [...container.querySelectorAll('[data-part="axis"] > span:nth-child(2) > span')].map((node) => node.textContent);
    expect(labels).toEqual(['0ms', '100ms', '200ms', '300ms']);
    expect(container.querySelector('rect')!.getAttribute('width')).toBe('250');
    expect(container.querySelector('[data-part="playhead"]')!.getAttribute('x1')).toBe('250');
    expect(screen.getByRole('treeitem').className).toContain('starting:opacity-0');
    expect(screen.getByRole('treeitem').className).toContain('motion-reduce:transition-none');
  });

  it('never draws the axis shorter than the spans, and is still by default', () => {
    const { container } = render(<TraceWaterfall spans={[{ id: 'r', name: 'job', start: 0, end: 100 }]} range={10} />);
    expect(container.querySelector('rect')!.getAttribute('width')).toBe('1000');
    expect(container.querySelector('[data-part="playhead"]')).toBeNull();
    expect(screen.getByRole('treeitem').className).not.toContain('starting:');
  });

  it('renders an empty state', () => {
    render(<TraceWaterfall spans={[]} />);
    expect(screen.getByText('No spans to display.')).toBeTruthy();
  });
});
