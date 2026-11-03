import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ResourceState } from './ResourceState';

const region = (container: HTMLElement) => container.querySelector('[data-slot="resource-state"]')!;

describe('ResourceState', () => {
  it('shows a skeleton while there is no data and no error, and marks the region busy', () => {
    const children = vi.fn(() => 'never');
    const { container } = render(<ResourceState state={{ data: undefined, error: undefined, loading: true }}>{children}</ResourceState>);
    expect(region(container).getAttribute('data-state')).toBe('loading');
    expect(region(container).getAttribute('aria-busy')).toBe('true');
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
    expect(children).not.toHaveBeenCalled();
  });

  it('takes an overriding loading slot', () => {
    render(
      <ResourceState state={{ data: undefined, error: undefined }} loading={<p>Fetching jobs</p>}>
        {() => null}
      </ResourceState>,
    );
    expect(screen.getByText('Fetching jobs')).toBeTruthy();
  });

  it('shows the error under the error title when there is nothing to show', () => {
    const { container } = render(
      <ResourceState state={{ data: undefined, error: 'connection refused', loading: false }} errorTitle="The hub API did not answer">
        {() => 'never'}
      </ResourceState>,
    );
    expect(region(container).getAttribute('data-state')).toBe('failed');
    expect(region(container).getAttribute('aria-busy')).toBe('false');
    expect(screen.getByText('connection refused')).toBeTruthy();
    expect(screen.getByText(/The hub API did not answer/)).toBeTruthy();
  });

  it('keeps stale data on screen beneath a warning', () => {
    const { container } = render(
      <ResourceState state={{ data: ['build'], error: 'timeout', loading: false }}>
        {(jobs) => <ul>{jobs.map((job) => <li key={job}>{job}</li>)}</ul>}
      </ResourceState>,
    );
    expect(region(container).getAttribute('data-state')).toBe('stale');
    expect(screen.getByText(/Showing the last good data/)).toBeTruthy();
    expect(screen.getByText('timeout')).toBeTruthy();
    expect(screen.getByText('build')).toBeTruthy();
  });

  it('renders the data, forwards its ref and spreads props', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ResourceState ref={ref} id="jobs" className="mt-4" state={{ data: 3, error: undefined }}>
        {(count) => <span>{count} jobs</span>}
      </ResourceState>,
    );
    expect(ref.current?.getAttribute('data-state')).toBe('ready');
    expect(ref.current?.id).toBe('jobs');
    expect(ref.current?.className).toContain('mt-4');
    expect(screen.getByText('3 jobs')).toBeTruthy();
    expect(ref.current?.querySelector('[data-slot="note-block"]')).toBeNull();
  });

  it('treats falsy data as data', () => {
    render(<ResourceState state={{ data: 0, error: undefined }}>{(count) => <span>{count} running</span>}</ResourceState>);
    expect(screen.getByText('0 running')).toBeTruthy();
  });
});
