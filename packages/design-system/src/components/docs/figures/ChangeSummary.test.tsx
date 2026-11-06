import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChangeSummary } from './ChangeSummary';

describe('ChangeSummary', () => {
  it('renders additions, removals, and totals from Markdown', () => {
    render(<ChangeSummary><ul><li>bundle: +2 kb</li><li>unused: -1 kb</li><li><strong>total: 1 kb</strong></li></ul></ChangeSummary>);
    expect(screen.getByLabelText('add: bundle 2 kb')).toBeTruthy();
    expect(screen.getByLabelText('remove: unused 1 kb')).toBeTruthy();
    expect(screen.getByLabelText('total: total 1 kb')).toBeTruthy();
  });

  it('reads directed rows as better or worse, sized by their relative change', () => {
    const { container } = render(
      <ChangeSummary direction="lower-is-better">
        <ul><li>runtime: +12 kb (+18%)</li><li>legacy: -8 kb (-6%)</li><li>shared: +0.2 kb (+0.4%)</li></ul>
      </ChangeSummary>,
    );
    expect(screen.getByLabelText('worse: runtime 12 kb (+18%)').getAttribute('data-significance')).toBe('major');
    expect(screen.getByLabelText('better: legacy 8 kb (−6%)').getAttribute('data-significance')).toBe('notable');
    expect(screen.getByLabelText('within noise: shared 0.2 kb (+0.4%)')).toBeTruthy();
    expect(container.querySelector('[data-slot="change-summary-tally"]')!.textContent).toBe('1 worse1 better1 within noise');
  });

  it('lets a row override the direction', () => {
    render(<ChangeSummary direction="lower-is-better" rows={[{ label: 'throughput', value: '+1.2k', sign: 'add', relative: 0.14, direction: 'higher-is-better' }]} />);
    expect(screen.getByLabelText('better: throughput +1.2k (+14%)')).toBeTruthy();
  });

  it('renders an empty diff', () => {
    render(<ChangeSummary />);
    expect(screen.getByText('Empty diff.')).toBeTruthy();
  });
});
