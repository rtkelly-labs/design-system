import { diffAnchor } from './diff';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DiffView } from './DiffView';
import { parseUnifiedDiff } from './diff';

const HUNKS = parseUnifiedDiff('@@ -7,3 +7,3 @@\n context\n-old total\n+new total\n tail\n');

describe('DiffView', () => {
  it('folds behind a summary with the path, counts and an anchor', () => {
    const { container } = render(<DiffView path="metrics/duplication.txt" hunks={HUNKS} />);
    const details = container.querySelector('details')!;
    expect(details.id).toBe(diffAnchor('metrics/duplication.txt'));
    expect(details.open).toBe(false);
    expect(screen.getByText('metrics/').className).toContain('text-content-muted');
    expect(screen.getByText('1 line added, 1 line removed')).toBeTruthy();
  });

  it('draws each line with both gutters, a sign and the delta ground', () => {
    const { container } = render(<DiffView path="a.txt" hunks={HUNKS} defaultOpen />);
    const removed = container.querySelector('tr[data-kind="removed"]')!;
    expect(removed.className).toContain('bg-delta-ground-removed');
    expect([...removed.querySelectorAll('td')].map((td) => td.textContent)).toEqual(['8', '', '−removed', 'old total']);
    const added = container.querySelector('tr[data-kind="added"]')!;
    expect(added.querySelector('td:nth-child(3)')!.className).toContain('text-delta-added');
  });

  it('renders as a plain section when not collapsible', () => {
    const { container } = render(<DiffView path="a.txt" hunks={HUNKS} collapsible={false} />);
    expect(container.querySelector('details')).toBeNull();
    expect(screen.getByRole('region', { name: 'a.txt' })).toBeTruthy();
  });

  it('wraps long lines on request', () => {
    const { container } = render(<DiffView path="a.txt" hunks={HUNKS} wrap defaultOpen />);
    expect(container.querySelector('tr[data-kind="added"] td:last-child')!.className).toContain('whitespace-pre-wrap');
  });

  it('pins review comments under their line', () => {
    const hunks = parseUnifiedDiff('@@ -1 +1 @@\n-a\n+b\n');
    hunks[0]!.lines[1]!.comments = [{ author: 'diffra', meta: 'policy', body: 'Complexity rose by 3.' }];
    const { container } = render(<DiffView path="a.txt" hunks={hunks} defaultOpen />);
    const rows = [...container.querySelectorAll('tbody tr')];
    const comment = container.querySelector('[data-slot="diff-view-comment"]')!;
    expect(rows.indexOf(comment)).toBe(rows.indexOf(container.querySelector('tr[data-kind="added"]')!) + 1);
    expect(comment.textContent).toContain('diffra');
    expect(comment.textContent).toContain('Complexity rose by 3.');
  });

  it('designs the zero case', () => {
    render(<DiffView path="a.txt" hunks={[]} defaultOpen />);
    expect(screen.getByText('No line changes.')).toBeTruthy();
  });
});
