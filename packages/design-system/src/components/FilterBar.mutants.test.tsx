import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Filter } from '../lib/filters';
import { FilterBar } from './FilterBar';

/**
 * Tests written against the mutants that survived both the example tests and
 * the model in `FilterBar.model.test.tsx` — the contracts neither observes.
 *
 * The model checks state: chips, text, edit index, error. It cannot see
 * whether a key event was consumed, where focus went, or what the suggestion
 * list holds. Each test here names one of those contracts. Ones marked
 * *incidental* pin a detail rather than a promise, and are the first to drop.
 */

const checkout: Filter = { key: 'service', operator: '=', value: 'checkout' };
const input = () => screen.getByLabelText('Filter') as HTMLInputElement;
// `fireEvent` returns false when a handler called `preventDefault`.
const consumed = (key: string) => !fireEvent.keyDown(input(), { key });

describe('FilterBar keys', () => {
  it('consumes Enter, so a surrounding form is not submitted', () => {
    render(<FilterBar />);
    fireEvent.change(input(), { target: { value: 'status=500' } });
    expect(consumed('Enter')).toBe(true);
  });

  it('lets Escape through when there is nothing to cancel, so a dialog around it can close', () => {
    render(<FilterBar defaultFilters={[checkout]} />);
    expect(consumed('Escape')).toBe(false);
    fireEvent.change(input(), { target: { value: 'half' } });
    expect(consumed('Escape')).toBe(true);
  });

  it('consumes Backspace only when it removes a chip', () => {
    render(<FilterBar defaultFilters={[checkout]} />);
    fireEvent.change(input(), { target: { value: 'x' } });
    expect(consumed('Backspace')).toBe(false);
    fireEvent.change(input(), { target: { value: '' } });
    expect(consumed('Backspace')).toBe(true);
    expect(screen.queryByRole('list', { name: 'Active filters' })).toBeNull();
    expect(consumed('Backspace')).toBe(false);
  });
});

describe('FilterBar focus', () => {
  it('returns focus to the input after a chip is edited, removed, or all are cleared', () => {
    const status: Filter = { key: 'status', operator: '!=', value: '500' };
    render(<FilterBar defaultFilters={[checkout, status]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit filter status != 500' }));
    expect(document.activeElement).toBe(input());

    screen.getByRole('button', { name: 'Clear all' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter service = checkout' }));
    expect(document.activeElement).toBe(input());
    // Removing a chip before the one being edited keeps that edit on the same chip.
    expect(screen.getByRole('button', { name: 'Edit filter status != 500' }).getAttribute('aria-pressed')).toBe('true');

    screen.getByRole('button', { name: 'Clear all' }).focus();
    fireEvent.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(document.activeElement).toBe(input());
  });
});

describe('FilterBar editing', () => {
  const status: Filter = { key: 'status', operator: '!=', value: '500' };
  const chips = () =>
    screen
      .getAllByRole('button', { name: /^Edit filter / })
      .map((button) => button.getAttribute('aria-label')?.replace('Edit filter ', ''));

  it('drops the chip being edited when the edit turns it into a copy of another', () => {
    render(<FilterBar defaultFilters={[checkout, status]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit filter status != 500' }));
    fireEvent.change(input(), { target: { value: 'service=checkout' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(chips()).toEqual(['service = checkout']);
  });

  it('replaces an edited chip in place, keeping its position', () => {
    render(<FilterBar defaultFilters={[checkout, status]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit filter service = checkout' }));
    fireEvent.change(input(), { target: { value: 'env=prod' } });
    fireEvent.keyDown(input(), { key: 'Enter' });
    expect(chips()).toEqual(['env = prod', 'status != 500']);
  });

  it('cancels an edit on Escape even when the input was cleared', () => {
    render(<FilterBar defaultFilters={[checkout]} />);
    const chip = screen.getByRole('button', { name: 'Edit filter service = checkout' });
    fireEvent.click(chip);
    fireEvent.change(input(), { target: { value: '' } });
    expect(consumed('Escape')).toBe(true);
    expect(chip.getAttribute('aria-pressed')).toBe('false');
  });
});

describe('FilterBar rendering', () => {
  it('suggests each field and value once, labelled by the field', () => {
    const { container } = render(
      <FilterBar
        fields={[
          { key: 'env', label: 'Environment', values: ['prod', 'prod', 'dev'] },
          { key: 'env' },
          { key: 'team' },
        ]}
      />,
    );
    const options = Array.from(container.querySelectorAll('datalist option'));
    expect(options.map((option) => option.getAttribute('value'))).toEqual(['env=', 'env=prod', 'env=dev', 'team=']);
    expect(options.map((option) => option.textContent)).toEqual(['Environment', 'Environment', 'Environment', 'team=']);
  });

  it('shows free text as a quoted phrase and a field filter as key, operator, value', () => {
    render(<FilterBar defaultFilters={[{ key: '*', operator: '~', value: 'timeout' }, checkout]} />);
    expect(screen.getByRole('button', { name: 'Edit filter “timeout”' }).textContent).toBe('“timeout”');
    expect(screen.getByRole('button', { name: 'Edit filter service = checkout' }).textContent).toBe('service=checkout');
  });

  it('renders no chip list at all when there are no filters', () => {
    render(<FilterBar />);
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('renders a summary of 0, and none for null', () => {
    const { container, rerender } = render(<FilterBar summary={0} />);
    expect(container.querySelector('[data-slot="filter-bar-summary"]')?.textContent).toBe('0');
    rerender(<FilterBar summary={null} />);
    expect(container.querySelector('[data-slot="filter-bar-summary"]')).toBeNull();
  });

  it('puts a caller className on the root', () => {
    const { container } = render(<FilterBar className="mt-2" />);
    expect(container.querySelector('[data-slot="filter-bar"]')?.classList.contains('mt-2')).toBe(true);
  });

  it('turns spellcheck off on the input (incidental)', () => {
    render(<FilterBar />);
    expect(input().getAttribute('spellcheck')).toBe('false');
  });
});
