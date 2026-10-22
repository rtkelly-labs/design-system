import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { IncidentTimeline, summariseIncident, type IncidentEvent } from './IncidentTimeline';

const at = (h: number, m: number) => Date.UTC(2026, 9, 22, h, m);
const events: IncidentEvent[] = [
  { id: 'r', time: at(13, 2), kind: 'resolved', title: 'Resolved' },
  { id: 'a', time: at(12, 4), kind: 'alert', title: 'Alert fired', detail: 'Errors up', author: 'alertmanager' },
  { id: 'k', time: at(12, 10), kind: 'acknowledged', title: 'Acked' },
  { id: 'd', time: at(12, 24), kind: 'deploy', title: 'Rollback' },
  { id: 'm', time: at(12, 31), kind: 'mitigated', title: 'Mitigated' },
];

describe('summariseIncident', () => {
  it('measures milestones from the first detected or alert event', () => {
    expect(summariseIncident(events)).toEqual({
      status: 'resolved',
      start: at(12, 4),
      timeToAcknowledge: 6 * 60_000,
      timeToMitigate: 27 * 60_000,
      timeToResolve: 58 * 60_000,
      duration: 58 * 60_000,
    });
  });

  it('runs an ongoing incident to now, and reports missing milestones as null', () => {
    const s = summariseIncident([{ id: 'a', time: at(13, 18), kind: 'alert', title: 'x' }], at(14, 0));
    expect(s).toMatchObject({ status: 'ongoing', timeToAcknowledge: null, timeToResolve: null, duration: 42 * 60_000 });
    expect(summariseIncident([])).toMatchObject({ start: null, duration: null });
  });
});

describe('IncidentTimeline', () => {
  it('renders an ordered list with time elements, gaps and kinds, oldest first', () => {
    const ref = createRef<HTMLDivElement>();
    render(<IncidentTimeline ref={ref} events={events} title="Checkout" severity="critical" />);
    expect(ref.current?.getAttribute('data-slot')).toBe('incident-timeline');
    const items = screen.getAllByRole('listitem');
    expect(items.map((li) => li.getAttribute('data-kind'))).toEqual(['alert', 'acknowledged', 'deploy', 'mitigated', 'resolved']);
    expect(ref.current?.querySelector('ol')).toBeTruthy();
    expect(items[0]!.querySelector('time')?.getAttribute('dateTime')).toBe('2026-10-22T12:04:00.000Z');
    expect(items[0]!.querySelector('time')?.textContent).toBe('Oct 22 12:04:00');
    expect(items[1]!.querySelector('[data-slot="incident-timeline-gap"]')?.textContent).toBe('Gap +6m');
    expect(screen.getByText('RESOLVED')).toBeTruthy();
    expect(screen.getAllByText('58m', { selector: 'dd' })).toHaveLength(2);
    expect(screen.getByText('— alertmanager')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows ongoing with duration, dashes for missing milestones, and reverses order', () => {
    render(<IncidentTimeline events={[events[1]!, events[2]!]} now={at(12, 46)} order="newest-first" />);
    expect(screen.getByText('ongoing · 42m')).toBeTruthy();
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getAllByRole('listitem').map((li) => li.getAttribute('data-kind'))).toEqual(['acknowledged', 'alert']);
  });

  it('makes titles buttons when onEventSelect is given', () => {
    const onSelect = vi.fn();
    render(<IncidentTimeline events={events} onEventSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rollback' }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'd' }));
  });
});
