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

  it('renders an empty diff', () => {
    render(<ChangeSummary />);
    expect(screen.getByText('Empty diff.')).toBeTruthy();
  });
});
