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

  it('says why it cannot merge', () => {
    render(<PullRequestPage pullRequest={DEFAULT_PULL_REQUEST} />);
    expect(screen.getByText(/Changes requested, so it cannot merge yet/)).toBeTruthy();
  });
});
