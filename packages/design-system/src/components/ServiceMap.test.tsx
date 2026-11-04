import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ServiceGraph } from '../lib/serviceGraph';
import type { TraceSpanInput } from '../lib/trace';
import * as stories from '../stories/ServiceMap.stories';
import { ServiceMap } from './ServiceMap';

const spans: TraceSpanInput[] = [
  { id: 'a', name: 'GET /checkout', service: 'web', kind: 'server', start: 0, end: 400 },
  { id: 'b', parentId: 'a', name: 'cart.load', service: 'cart', start: 10, end: 150 },
  { id: 'c', parentId: 'b', name: 'SELECT cart_items', service: 'postgres', kind: 'client', start: 20, end: 140, attributes: { 'db.system': 'postgresql' } },
  { id: 'd', parentId: 'a', name: 'payment.authorize', service: 'payments', start: 160, end: 390, status: 'error' },
];

const graph: ServiceGraph = {
  nodes: [
    { id: 'api', requests: 1000, errors: 10, avgDuration: 120, p95Duration: 300 },
    { id: 'db', requests: 1200, errors: 0, avgDuration: 8, kind: 'database' },
    { id: 'users', requests: 400, errors: 40, avgDuration: 30 },
  ],
  edges: [
    { from: 'api', to: 'db', calls: 1200, errors: 0, avgDuration: 8 },
    { from: 'api', to: 'users', calls: 400, errors: 40, avgDuration: 30 },
  ],
};

const node = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name},`) });

describe('ServiceMap', () => {
  it('derives a graph from spans, describes it, and forwards its ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<ServiceMap ref={ref} spans={spans} data-testid="map" />);
    expect(ref.current?.getAttribute('data-slot')).toBe('service-map');
    expect(screen.getByTestId('map')).toBe(ref.current);
    const canvas = screen.getByRole('group', { name: 'Service map' });
    expect(canvas.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    expect(within(canvas).getAllByRole('button')).toHaveLength(4);
    expect(screen.getByText('4 services, 3 connections. 1 service over the 5% error threshold: payments.')).toBeTruthy();
    expect(node('postgres').getAttribute('aria-label')).toBe('postgres, database, 1 request, 0 errors, 0% error rate, average 120ms, p95 120ms, called by 1 service, calls 0 services');
    expect(node('payments').getAttribute('data-over-threshold')).toBe('true');
    expect(node('payments').querySelector('[data-part="danger-badge"]')).toBeTruthy();
    expect(node('web').querySelector('[data-part="danger-badge"]')).toBeNull();
    expect(ref.current!.querySelector('[data-slot="service-map-edge"][data-to="payments"]')?.getAttribute('data-error')).toBe('true');
  });

  it('flags by errorThreshold and thickens edges by traffic', () => {
    const { container } = render(<ServiceMap graph={graph} errorThreshold={0.2} />);
    expect(screen.getByText(/None over the 20% error threshold/)).toBeTruthy();
    const weight = (to: string) => container.querySelector(`[data-slot="service-map-edge"][data-to="${to}"] path:last-child`)?.getAttribute('stroke-width');
    expect(weight('db')).toBe('4.5');
    expect(weight('users')).toBe('3.5');
  });

  it('labels edges with calls and error rate', () => {
    const { container } = render(<ServiceMap graph={graph} edgeLabels="always" />);
    const labels = [...container.querySelectorAll('[data-slot="service-map-edge-label"]')].map((label) => label.textContent);
    expect(labels).toEqual(['1.2k calls · 0% err', '400 calls · 10% err']);
  });

  it('selects a node on click, dims the rest, and shows its details', () => {
    const onSelectedChange = vi.fn();
    const { container } = render(<ServiceMap spans={spans} onSelectedChange={onSelectedChange} />);
    fireEvent.click(node('cart'));
    expect(onSelectedChange).toHaveBeenLastCalledWith('cart');
    expect(node('cart').getAttribute('aria-pressed')).toBe('true');
    expect(node('payments').getAttribute('opacity')).toBe('0.25');
    expect(node('web').getAttribute('opacity')).toBeNull();
    const details = screen.getByRole('region', { name: 'cart details' });
    expect(details.getAttribute('data-slot')).toBe('service-map-details');
    expect(within(details).getAllByText('140ms', { selector: 'dd' })).toHaveLength(2);
    // The outbound edge selects the neighbour.
    fireEvent.click(within(details).getByRole('button', { name: /→ postgres/ }));
    expect(onSelectedChange).toHaveBeenLastCalledWith('postgres');
    expect(screen.getByRole('region', { name: 'postgres details' })).toBeTruthy();
    expect(container.querySelectorAll('[data-slot="service-map-node"][opacity]')).toHaveLength(2);
  });

  it('honours a controlled selection', () => {
    const onSelectedChange = vi.fn();
    render(<ServiceMap spans={spans} selectedId="web" onSelectedChange={onSelectedChange} />);
    fireEvent.click(node('cart'));
    expect(onSelectedChange).toHaveBeenLastCalledWith('cart');
    expect(node('web').getAttribute('aria-pressed')).toBe('true');
  });

  it('is a roving tab stop moved spatially by arrows; Enter selects, Escape clears', () => {
    const onSelectedChange = vi.fn();
    render(<ServiceMap spans={spans} onSelectedChange={onSelectedChange} />);
    const stops = screen.getAllByRole('button').filter((button) => button.getAttribute('tabindex') === '0');
    expect(stops).toEqual([node('web')]);
    node('web').focus();
    fireEvent.keyDown(node('web'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(node('cart'));
    fireEvent.keyDown(node('cart'), { key: 'ArrowDown' });
    expect(document.activeElement).toBe(node('payments'));
    fireEvent.keyDown(node('payments'), { key: 'ArrowUp' });
    fireEvent.keyDown(node('cart'), { key: 'ArrowRight' });
    expect(document.activeElement).toBe(node('postgres'));
    expect(node('postgres').querySelector('[data-part="focus-ring"]')).toBeTruthy();
    fireEvent.keyDown(node('postgres'), { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(node('cart'));
    fireEvent.keyDown(node('cart'), { key: 'Enter' });
    expect(onSelectedChange).toHaveBeenLastCalledWith('cart');
    fireEvent.keyDown(node('cart'), { key: ' ' });
    fireEvent.keyDown(node('cart'), { key: 'Escape' });
    expect(onSelectedChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('renders an empty state', () => {
    render(<ServiceMap spans={[]} />);
    expect(screen.getByText('No services to map.')).toBeTruthy();
  });

  it('renders every story', () => {
    const { container, unmount } = render(<ServiceMap {...stories.Checkout.args} />);
    expect(screen.getByText('9 services, 8 connections. 1 service over the 5% error threshold: card-network.')).toBeTruthy();
    expect(node('postgres').getAttribute('data-kind')).toBe('database');
    expect(node('orders').getAttribute('data-kind')).toBe('queue');
    expect(node('card-network').getAttribute('data-kind')).toBe('external');
    expect(container.querySelectorAll('[data-slot="service-map-edge"][data-error]')).toHaveLength(1);
    unmount();
    for (const story of [stories.FromTraceFixtures, stories.Selected, stories.Wide, stories.AllEdgeLabels, stories.Empty]) {
      const view = render(<ServiceMap {...story.args} />);
      expect(view.container.querySelector('[data-slot="service-map"]')).toBeTruthy();
      view.unmount();
    }
  });
});
