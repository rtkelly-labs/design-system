import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl, SegmentedControlItem } from './SegmentedControl';

function Views({ onValueChange }: { onValueChange?: (v: string) => void }) {
  return (
    <SegmentedControl label="Calendar view" defaultValue="week" onValueChange={onValueChange}>
      <SegmentedControlItem value="week">WEEK</SegmentedControlItem>
      <SegmentedControlItem value="day">DAY</SegmentedControlItem>
      <SegmentedControlItem value="month">MONTH</SegmentedControlItem>
    </SegmentedControl>
  );
}

describe('SegmentedControl', () => {
  it('is a named radiogroup of radios, with no tab semantics and no aria-controls', () => {
    const { container } = render(<Views />);
    expect(screen.getByRole('radiogroup', { name: 'Calendar view' })).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.queryByRole('tab')).toBeNull();
    expect(container.querySelector('[aria-controls]')).toBeNull();
  });

  it('marks the selected option and reports a click', () => {
    const onValueChange = vi.fn();
    render(<Views onValueChange={onValueChange} />);
    const week = screen.getByRole('radio', { name: 'WEEK' });
    expect(week.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(screen.getByRole('radio', { name: 'DAY' }));
    expect(onValueChange).toHaveBeenCalledWith('day');
    expect(screen.getByRole('radio', { name: 'DAY' }).getAttribute('aria-checked')).toBe('true');
  });

  it('keeps only the selected option in the tab order', () => {
    render(<Views />);
    expect(screen.getByRole('radio', { name: 'WEEK' }).getAttribute('tabindex')).toBe('0');
    expect(screen.getByRole('radio', { name: 'DAY' }).getAttribute('tabindex')).toBe('-1');
  });

  it('sizes the options to Button xs and sm', () => {
    const { rerender } = render(<Views />);
    expect(screen.getByRole('radio', { name: 'WEEK' }).className).toContain('h-7');
    rerender(
      <SegmentedControl label="v" size="sm" defaultValue="a">
        <SegmentedControlItem value="a">A</SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(screen.getByRole('radio', { name: 'A' }).className).toContain('h-10');
  });
});
