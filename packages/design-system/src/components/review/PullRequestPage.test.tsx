import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PullRequestPage } from './PullRequestPage';
import { DEFAULT_PULL_REQUEST } from './samples';

describe('PullRequestPage', () => {
  it('names the pull request, its state and its branches', () => {
    render(<PullRequestPage pullRequest={DEFAULT_PULL_REQUEST} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/\b412\b/);
    expect(screen.getByText('feat/field-id').tagName).toBe('CODE');
  });

  it('draws each check as an outcome with its own word', () => {
    render(<PullRequestPage pullRequest={DEFAULT_PULL_REQUEST} />);
    const checks = screen.getByRole('region', { name: 'Checks' });
    expect(within(checks).getAllByRole('listitem')).toHaveLength(6);
    expect(within(checks).getByText('pending')).toBeTruthy();
    expect(within(checks).getByText('no verdict')).toBeTruthy();
  });

  it('opens the files that carry review comments and counts them', () => {
    const { container } = render(<PullRequestPage pullRequest={DEFAULT_PULL_REQUEST} />);
    const open = [...container.querySelectorAll('details[data-slot="diff-view"]')].filter((d) => (d as HTMLDetailsElement).open);
    expect(open).toHaveLength(2);
    expect(container.querySelectorAll('[data-slot="diff-view-comment"]')).toHaveLength(3);
    expect(screen.getByText('3 review comments on the changed files.')).toBeTruthy();
  });

  it('leads with whether it can merge, then why, then the tallies worst first', () => {
    render(<PullRequestPage pullRequest={DEFAULT_PULL_REQUEST} />);
    const status = screen.getByRole('region', { name: 'Merge status' });
    expect(within(within(status).getByRole('list', { name: 'Checks' })).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['!1warn', '?1needs review', '~1pending', '○1no verdict', '✓2pass']);
    expect(within(screen.getByRole('region', { name: 'Checks' })).getByText(/2 passing/).closest('details')!.open).toBe(false);
  });

  it('says why it cannot merge', () => {
    render(<PullRequestPage pullRequest={DEFAULT_PULL_REQUEST} />);
    expect(screen.getByText('Cannot merge yet')).toBeTruthy();
    expect(screen.getByText('Changes requested by kestrel. No failing checks.')).toBeTruthy();
  });

  it('says how a finished pull request finished, not that it waits on review', () => {
    const { rerender } = render(<PullRequestPage pullRequest={{ ...DEFAULT_PULL_REQUEST, state: 'merged' }} />);
    expect(screen.getByText(`Merged into ${DEFAULT_PULL_REQUEST.base}.`)).toBeTruthy();
    expect(screen.queryByText(/Waiting on review|Cannot merge yet/)).toBeNull();
    rerender(<PullRequestPage pullRequest={{ ...DEFAULT_PULL_REQUEST, state: 'closed' }} />);
    expect(screen.getByText('Closed without merging.')).toBeTruthy();
    rerender(<PullRequestPage pullRequest={{ ...DEFAULT_PULL_REQUEST, state: 'draft', reviewers: [] }} />);
    expect(screen.getByText(/Still a draft, so it cannot merge yet/)).toBeTruthy();
  });
});
