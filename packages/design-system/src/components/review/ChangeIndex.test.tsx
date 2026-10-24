import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChangeIndex } from './ChangeIndex';

const GROUPS = [
  { title: 'Duplication', files: [{ path: 'metrics/duplication.txt', added: 2, removed: 2 }] },
  {
    title: 'Call graph',
    files: [
      { path: 'callgraph/a.callgraph.txt', added: 8, removed: 5 },
      { path: 'callgraph/callgraph.md', added: 1, removed: 2, href: '#custom' },
    ],
  },
];

describe('ChangeIndex', () => {
  it('totals each group before its files', () => {
    render(<ChangeIndex groups={GROUPS} />);
    const group = screen.getByRole('region', { name: 'Call graph' });
    expect(group.querySelector('h3')!.textContent).toContain('9 lines added, 7 lines removed');
  });

  it('links each file to its diff anchor', () => {
    render(<ChangeIndex groups={GROUPS} />);
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['#diff-metrics-duplication-txt', '#diff-callgraph-a-callgraph-txt', '#custom']);
  });

  it('scales every bar to the largest file', () => {
    const { container } = render(<ChangeIndex groups={GROUPS} />);
    const largest = container.querySelectorAll('[data-slot="change-index-file"] svg')[1]!;
    const filled = [...largest.querySelectorAll('rect')].reduce((sum, r) => sum + Number(r.getAttribute('width')), 0);
    expect(filled).toBe(100);
  });

  it('designs the empty case', () => {
    render(<ChangeIndex groups={[{ title: 'Duplication', files: [] }]} emptyText="Unchanged. 7 files compared." />);
    expect(screen.getByText('Unchanged. 7 files compared.')).toBeTruthy();
    expect(screen.queryByRole('region')).toBeNull();
  });
});
