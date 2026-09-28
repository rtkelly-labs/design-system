import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActivityGrid } from './ActivityGrid';

describe('ActivityGrid', () => {
  it('fills missing dates, labels months, and summarizes dated counts', () => {
    render(<ActivityGrid data={[{ date: '2026-01-01', count: 2 }, { date: '2026-01-03', count: 3 }]} />);
    expect(screen.getByText('Jan')).toBeTruthy();
    expect(screen.getByText(/5 contributions across 2 dates, from 2026-01-01 to 2026-01-03/)).toBeTruthy();
    expect(screen.getByRole('img', { name: '5 contributions across 2 dates' })).toBeTruthy();
  });

  it('renders empty and oversized ranges as bounded empty states', () => {
    const { rerender } = render(<ActivityGrid data={[]} />);
    expect(screen.getByText('No activity dates to display.')).toBeTruthy();
    rerender(<ActivityGrid data={[{ date: '2000-01-01', count: 1 }, { date: '2026-01-01', count: 2 }]} />);
    expect(screen.getByText('Date range is too large to display.')).toBeTruthy();
  });

  it('adds duplicate dates and leaves missing dates at zero', () => {
    render(<ActivityGrid data={[{ date: '2026-01-01', count: 2 }, { date: '2026-01-01', count: 3 }, { date: '2026-01-03', count: 1 }, { date: 'bad', count: 9 }]} />);
    expect(screen.getByText(/6 contributions across 2 dates/)).toBeTruthy();
    expect(screen.getByTitle('2026-01-01: 5 contributions')).toBeTruthy();
    expect(screen.getByTitle('2026-01-02: 0 contributions')).toBeTruthy();
  });
});
