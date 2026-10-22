import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Filter } from '../lib/filters';
import { FilterBar } from './FilterBar';

const checkout: Filter = { key: 'service', operator: '=', value: 'checkout' };
const status: Filter = { key: 'status', operator: '!=', value: '500' };

const input = () => screen.getByLabelText('Filter');
const type = (text: string, key = 'Enter') => {
  fireEvent.change(input(), { target: { value: text } });
  fireEvent.keyDown(input(), { key });
};

describe('FilterBar', () => {
  it('renders chips, the summary and the slot, and forwards its ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<FilterBar ref={ref} defaultFilters={[checkout, status]} summary="42 of 1,204 spans" data-testid="bar" />);
    expect(ref.current?.getAttribute('data-slot')).toBe('filter-bar');
    expect(ref.current?.getAttribute('data-testid')).toBe('bar');
    expect(screen.getByRole('button', { name: 'Remove filter service = checkout' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Edit filter status != 500' }).textContent).toBe('status!=500');
    expect(screen.getByText('42 of 1,204 spans')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Clear all' })).toBeTruthy();
  });

  it('adds a chip on Enter, uncontrolled, and reports the list', () => {
    const onFiltersChange = vi.fn();
    render(<FilterBar onFiltersChange={onFiltersChange} />);
    expect(screen.queryByRole('button', { name: 'Clear all' })).toBeNull();
    type('service=checkout');
    expect(onFiltersChange).toHaveBeenLastCalledWith([checkout]);
    expect((input() as HTMLInputElement).value).toBe('');
    type('timeout');
    expect(onFiltersChange).toHaveBeenLastCalledWith([checkout, { key: '*', operator: '~', value: 'timeout' }]);
    expect(screen.getByRole('button', { name: 'Remove filter “timeout”' })).toBeTruthy();
  });

  it('does not add a duplicate', () => {
    const onFiltersChange = vi.fn();
    render(<FilterBar defaultFilters={[checkout]} onFiltersChange={onFiltersChange} />);
    type('service = checkout');
    expect(onFiltersChange).not.toHaveBeenCalled();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('removes with the chip button, Backspace in an empty input, and Clear all', () => {
    render(<FilterBar defaultFilters={[checkout, status, { key: 'msg', operator: '~', value: 'x' }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter service = checkout' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    fireEvent.keyDown(input(), { key: 'Backspace' });
    expect(screen.queryByRole('button', { name: /msg/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('Escape clears the input', () => {
    render(<FilterBar />);
    fireEvent.change(input(), { target: { value: 'service=' } });
    fireEvent.keyDown(input(), { key: 'Escape' });
    expect((input() as HTMLInputElement).value).toBe('');
  });

  it('edits a chip in place from its text', () => {
    const onFiltersChange = vi.fn();
    render(<FilterBar defaultFilters={[checkout, status]} onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit filter service = checkout' }));
    expect((input() as HTMLInputElement).value).toBe('service=checkout');
    expect(document.activeElement).toBe(input());
    expect(screen.getByRole('button', { name: 'Edit filter service = checkout' }).getAttribute('aria-pressed')).toBe('true');
    type('service=cart');
    expect(onFiltersChange).toHaveBeenLastCalledWith([{ key: 'service', operator: '=', value: 'cart' }, status]);
  });

  it('is controlled when given filters', () => {
    const onFiltersChange = vi.fn();
    render(<FilterBar filters={[checkout]} onFiltersChange={onFiltersChange} />);
    type('status!=500');
    expect(onFiltersChange).toHaveBeenLastCalledWith([checkout, status]);
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('shows an error tied to the input for an expression with no key', () => {
    render(<FilterBar />);
    type('=value');
    const field = input();
    expect(field.getAttribute('aria-invalid')).toBe('true');
    const message = document.getElementById(field.getAttribute('aria-describedby')!);
    expect(message?.textContent).toMatch(/field name before =/);
    expect((field as HTMLInputElement).value).toBe('=value');
    fireEvent.change(field, { target: { value: 'service=x' } });
    expect(field.getAttribute('aria-invalid')).toBeNull();
  });

  it('suggests keys and key=value pairs through a datalist', () => {
    const { container } = render(<FilterBar fields={[{ key: 'service', label: 'Service', values: ['checkout', 'cart'] }, { key: 'route', values: ['/v1 orders'] }]} />);
    const list = container.querySelector(`datalist#${CSS.escape(input().getAttribute('list')!)}`);
    expect(Array.from(list!.querySelectorAll('option')).map((option) => option.value)).toEqual([
      'service=', 'service=checkout', 'service=cart', 'route=', 'route=/v1 orders',
    ]);
  });

  it('labels the input visibly, or for assistive technology only', () => {
    const { rerender } = render(<FilterBar label="Filter spans" />);
    expect(screen.getByText('Filter spans').className).not.toContain('sr-only');
    rerender(<FilterBar label="Filter spans" hideLabel />);
    expect(screen.getByText('Filter spans').className).toContain('sr-only');
    expect(screen.getByRole('textbox', { name: 'Filter spans' })).toBeTruthy();
  });
});
