import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FileChangeTree, type FileChangeNode } from './FileChangeTree';

const NODES: FileChangeNode[] = [
  { name: 'src/', children: [
    { name: 'math.js', change: 'add', note: 'Delimiter rules.' },
    { name: 'render.js', change: 'modify' },
    { name: 'old.js', change: 'remove' },
    { name: 'themes/', children: [{ name: 'math.css', change: 'add' }] },
  ] },
  { name: 'test/', children: [{ name: 'math.test.js', change: 'add' }] },
];

describe('FileChangeTree', () => {
  it('draws one column per top-level directory and names each change for screen readers', () => {
    render(<FileChangeTree nodes={NODES} />);
    expect(screen.getByRole('list', { name: 'File changes' }).children).toHaveLength(2);
    expect(screen.getByText('Delimiter rules.')).toBeTruthy();
    expect(screen.getAllByText('(added)')).toHaveLength(3);
    expect(screen.getByText('(removed)')).toBeTruthy();
  });

  it('tallies every change, nested ones included', () => {
    render(<FileChangeTree nodes={NODES} />);
    const tally = document.querySelector('[data-slot="file-change-tree-tally"]');
    expect(tally?.textContent).toContain('3 added');
    expect(tally?.textContent).toContain('1 modified');
    expect(tally?.textContent).toContain('1 removed');
  });

  it('shows each side of the change without its marks', () => {
    render(<FileChangeTree nodes={NODES} />);
    fireEvent.click(screen.getByRole('button', { name: 'Before' }));
    expect(screen.queryByText('math.js')).toBeNull();
    expect(screen.queryByText('themes/')).toBeNull();
    expect(screen.getByText('old.js')).toBeTruthy();
    expect(screen.queryByText('(modified)')).toBeNull();
    expect(screen.getByRole('button', { name: 'Before' }).getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'After' }));
    expect(screen.getByText('math.js')).toBeTruthy();
    expect(screen.queryByText('old.js')).toBeNull();
  });

  it('drops a column with nothing left on one side', () => {
    render(<FileChangeTree nodes={NODES} defaultView="before" />);
    expect(screen.getByRole('list', { name: 'File changes' }).children).toHaveLength(1);
  });

  it('reports picks when controlled and does not move on its own', () => {
    const onViewChange = vi.fn();
    render(<FileChangeTree nodes={NODES} view="changes" onViewChange={onViewChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'After' }));
    expect(onViewChange).toHaveBeenCalledWith('after');
    expect(screen.getByText('old.js')).toBeTruthy();
  });

  it('takes translated labels, can hide its footer, and forwards ref and attributes', () => {
    const ref = createRef<HTMLDivElement>();
    const { rerender } = render(<FileChangeTree ref={ref} data-testid="tree" nodes={NODES} viewLabels={{ changes: '变更' }} changeLabels={{ add: '新增' }} />);
    expect(screen.getByRole('button', { name: '变更' })).toBeTruthy();
    expect(screen.getAllByText('(新增)')).toHaveLength(3);
    expect(ref.current).toBe(screen.getByTestId('tree'));
    rerender(<FileChangeTree nodes={NODES} hideFooter />);
    expect(screen.queryByRole('group', { name: 'View' })).toBeNull();
  });
});
