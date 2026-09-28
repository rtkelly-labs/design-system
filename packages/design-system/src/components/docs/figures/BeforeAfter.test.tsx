import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BeforeAfter } from './BeforeAfter';

describe('BeforeAfter', () => {
  it('formats Markdown values with units and exposes the comparison', () => {
    render(<BeforeAfter fromLabel="before" toLabel="after"><ul><li>p95: 160 ms → 142 ms</li></ul></BeforeAfter>);
    expect(screen.getByLabelText('p95 from 160 ms to 142 ms')).toBeTruthy();
    expect(screen.getByText('160 ms')).toBeTruthy();
    expect(screen.getByText('142 ms')).toBeTruthy();
  });

  it('renders explicit numeric items', () => {
    render(<BeforeAfter fromLabel="old" toLabel="new" items={[{ label: 'requests', from: 10, to: 20 }]} />);
    expect(screen.getByLabelText('requests from 10 to 20')).toBeTruthy();
  });

  it('retains units in explicit string items', () => {
    render(<BeforeAfter fromLabel="before" toLabel="after" items={[{ label: 'errors', from: '2.4%', to: '1.2%' }]} />);
    expect(screen.getByLabelText('errors from 2.4% to 1.2%')).toBeTruthy();
    expect(screen.getByText('2.4%')).toBeTruthy();
    expect(screen.getByText('1.2%')).toBeTruthy();
  });
});
