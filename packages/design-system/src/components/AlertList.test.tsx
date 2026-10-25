import { fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { AlertList, formatAlertDuration, sortAlerts, type Alert } from './AlertList';

const now = Date.UTC(2026, 9, 22, 14, 0);
const ago = (m: number) => now - m * 60_000;

const alerts: Alert[] = [
  { id: 'r', name: 'Resolved', state: 'resolved', severity: 'critical', since: ago(180) },
  { id: 'p', name: 'Pending', state: 'pending', severity: 'warning', since: ago(3) },
  { id: 'fw', name: 'FiringWarn', state: 'firing', severity: 'warning', since: ago(40) },
  { id: 'fc', name: 'FiringCrit', state: 'firing', severity: 'critical', since: ago(12), service: 'api', value: '4%', threshold: '2%', trend: [1, 2, 3] },
  { id: 's', name: 'Silenced', state: 'silenced', severity: 'info', since: ago(60) },
];

const names = () => screen.getAllByRole('listitem').map((li) => li.getAttribute('data-state') + ':' + within(li).getByText(/^(Resolved|Pending|FiringWarn|FiringCrit|Silenced)$/).textContent);

describe('AlertList', () => {
  it('sorts by state then severity, and formats durations', () => {
    expect(sortAlerts(alerts).map((a) => a.id)).toEqual(['fc', 'fw', 'p', 's', 'r']);
    expect(formatAlertDuration({ state: 'firing', since: ago(12) }, now)).toBe('firing for 12m');
    expect(formatAlertDuration({ state: 'resolved', since: ago(180) }, now)).toBe('resolved 3h ago');
  });

  it('renders rows with slot, ref, durations and value vs threshold', () => {
    const ref = createRef<HTMLDivElement>();
    render(<AlertList ref={ref} alerts={alerts} now={now} data-testid="list" />);
    expect(ref.current?.getAttribute('data-slot')).toBe('alert-list');
    expect(screen.getByTestId('list')).toBe(ref.current);
    expect(names()).toEqual(['firing:FiringCrit', 'firing:FiringWarn', 'pending:Pending', 'silenced:Silenced', 'resolved:Resolved']);
    expect(screen.getByText('firing for 12m')).toBeTruthy();
    expect(screen.getByText('resolved 3h ago')).toBeTruthy();
    expect(screen.getByText('/ 2%')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'FiringCrit trend' })).toBeTruthy();
    // Not selectable: no row buttons.
    expect(screen.queryByRole('button', { name: /FiringCrit/ })).toBeNull();
  });

  it('filters by state with aria-pressed toggles and shows the empty state', () => {
    const onChange = vi.fn();
    render(<AlertList alerts={alerts.filter((a) => a.state !== 'pending')} now={now} onStateFilterChange={onChange} />);
    const pending = screen.getByRole('button', { name: /pending/i });
    expect(pending.getAttribute('aria-pressed')).toBe('false');
    expect(within(screen.getByRole('button', { name: /firing/i })).getByText('2')).toBeTruthy();
    fireEvent.click(pending);
    expect(onChange).toHaveBeenCalledWith(['pending']);
    expect(pending.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('status').textContent).toContain('No alerts firing.');
    fireEvent.click(pending);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });

  it('selects with click and Enter, and roves focus with arrows, Home and End', () => {
    const onSelected = vi.fn();
    render(<AlertList alerts={alerts} now={now} onSelectedChange={onSelected} />);
    const rows = screen.getAllByRole('button', { pressed: false }).filter((b) => b.getAttribute('data-slot') === 'alert-list-select');
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    rows[0]!.focus();
    fireEvent.keyDown(rows[0]!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(rows[1]);
    fireEvent.keyDown(rows[1]!, { key: 'End' });
    expect(document.activeElement).toBe(rows[4]);
    fireEvent.keyDown(rows[4]!, { key: 'Home' });
    expect(document.activeElement).toBe(rows[0]);
    fireEvent.click(rows[2]!);
    expect(onSelected).toHaveBeenCalledWith('p');
    expect(rows[2]!.getAttribute('aria-pressed')).toBe('true');
  });

  it('never takes focus back after a key press that did not move', () => {
    const outside = document.createElement('input');
    document.body.append(outside);
    const { rerender } = render(<AlertList alerts={alerts} now={now} onSelectedChange={() => {}} />);
    const first = screen.getAllByRole('button').find((b) => b.getAttribute('data-slot') === 'alert-list-select')!;
    first.focus();
    fireEvent.keyDown(first, { key: 'Home' });
    outside.focus();
    // Removing the active row moves the roving tab stop, and must leave focus where the user put it.
    const firstId = sortAlerts(alerts)[0]!.id;
    rerender(<AlertList alerts={alerts.filter((alert) => alert.id !== firstId)} now={now} onSelectedChange={() => {}} />);
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it('renders actions as siblings of the select target, never inside it', () => {
    render(<AlertList alerts={alerts} now={now} defaultSelectedId={null} renderActions={(a) => <button type="button">ACK {a.id}</button>} />);
    const ack = screen.getByRole('button', { name: 'ACK fc' });
    expect(ack.closest('[data-slot="alert-list-select"]')).toBeNull();
    expect(ack.closest('[data-slot="alert-list-item"]')?.querySelector('[data-slot="alert-list-select"]')).toBeTruthy();
  });
});
