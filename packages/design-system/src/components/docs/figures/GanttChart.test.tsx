import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GanttChart } from './GanttChart';

describe('GanttChart', () => {
  it('scales calendar-date bars and exposes their actual date ranges', () => {
    render(<GanttChart columns={20} items={[{ label: 'Draft', start: '2026-03-01', end: '2026-03-10', complete: 0.5 }, { label: 'Publish', start: '2026-03-11', end: '2026-03-20' }]} />);
    expect(screen.getByRole('listitem', { name: 'Draft, 2026-03-01 through 2026-03-10, 50% complete' })).toBeTruthy();
    expect(screen.getByText('Schedule date range: 2026-03-01 through 2026-03-20.')).toBeTruthy();
    expect(screen.getByText('Mar 1')).toBeTruthy();
  });

  it('does not tick a month start beside the weekly dated ticks', () => {
    render(<GanttChart columns={56} items={[{ label: 'Migration', start: '2026-04-14', end: '2026-05-05' }]} range={{ start: '2026-04-01', end: '2026-05-10' }} />);
    expect(screen.queryByText('May')).toBeNull();
    expect(screen.queryByText('May 1')).toBeNull();
    expect(screen.getByText('May 4')).toBeTruthy();
  });

  it('supports explicit range, clamps columns, and handles invalid or empty schedules', () => {
    const { rerender } = render(<GanttChart items={[]} />);
    expect(screen.getByText('No schedule items to display.')).toBeTruthy();
    rerender(<GanttChart columns={10000} items={[{ label: 'Task', start: '2026-03-10', end: '2026-03-12' }, { label: 'Outside', start: '2026-04-01', end: '2026-04-02' }]} range={{ start: '2026-03-01', end: '2026-03-31' }} />);
    expect(screen.getByText('Schedule date range: 2026-03-01 through 2026-03-31.')).toBeTruthy();
    expect(screen.queryByText('Outside')).toBeNull();
    rerender(<GanttChart items={[{ label: 'Invalid', start: '2026-02-30', end: '2026-03-01' }]} />);
    expect(screen.getByText('No valid schedule in the selected date range.')).toBeTruthy();
  });

  it('clamps progress and omits invalid percentages from accessible labels', () => {
    render(<GanttChart items={[{ label: 'Done', start: '2026-03-01', end: '2026-03-03', complete: 2 }, { label: 'Unknown', start: '2026-03-02', end: '2026-03-03', complete: Number.NaN }]} />);
    expect(screen.getByRole('listitem', { name: 'Done, 2026-03-01 through 2026-03-03, 100% complete' })).toBeTruthy();
    expect(screen.getByRole('listitem', { name: 'Unknown, 2026-03-02 through 2026-03-03' })).toBeTruthy();
  });
});
