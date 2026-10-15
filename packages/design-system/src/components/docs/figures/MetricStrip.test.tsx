import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MetricStrip } from './MetricStrip';

describe('MetricStrip', () => {
  it('pairs each value with its label as a description list', () => {
    render(<MetricStrip label="Palette" items={[{ value: '6', label: 'kept unchanged', tone: 'success' }, { value: '0.036', label: 'brand drift' }]} />);
    const list = screen.getByRole('group', { name: 'Palette' });
    expect(list.querySelectorAll('dt')).toHaveLength(2);
    expect(screen.getByText('6').className).toContain('text-intent-success');
    expect(screen.getByText('brand drift')).toBeTruthy();
  });

  it('announces an empty state', () => {
    render(<MetricStrip items={[]} />);
    expect(screen.getByText('No metrics.')).toBeTruthy();
  });
});
