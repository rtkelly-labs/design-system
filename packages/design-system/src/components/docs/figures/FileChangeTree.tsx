'use client';

import type { ReactNode } from 'react';
import * as React from 'react';
import { AsciiFrameBody } from './FigureFrame';
import { cn } from '../../../lib/recipe';

export type FileChange = 'add' | 'modify' | 'remove' | 'rename';
export type FileChangeView = 'before' | 'changes' | 'after';

export interface FileChangeNode {
  /** File or directory name. A node with `children` is drawn as a directory. */
  name: string;
  /** How the file changed. Omit for an unchanged file or a directory. */
  change?: FileChange;
  /** One line on what changed, drawn under the name. */
  note?: ReactNode;
  /** Entries inside a directory. */
  children?: FileChangeNode[];
}

export interface FileChangeTreeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Accessible name; the enclosing frame owns the caption. */
  label?: string;
  /** Top-level entries. Each one becomes a column under the shared connector. */
  nodes: FileChangeNode[];
  /** Controlled view. `changes` marks every entry; `before` and `after` show the tree on one side of the change. */
  view?: FileChangeView;
  /** Initial view when uncontrolled. */
  defaultView?: FileChangeView;
  /** Called when the reader picks a view. */
  onViewChange?: (view: FileChangeView) => void;
  /** Hide the before / changes / after switch and the tallies. */
  hideFooter?: boolean;
  /** Replaces the switch's button text, for translated pages. */
  viewLabels?: Partial<Record<FileChangeView, string>>;
  /** Replaces the tally words, for translated pages. */
  changeLabels?: Partial<Record<FileChange, string>>;
  /** Additional classes for the root. */
  className?: string;
}

const VIEWS: readonly FileChangeView[] = ['before', 'changes', 'after'];
const CHANGES: readonly FileChange[] = ['add', 'modify', 'rename', 'remove'];

const DEFAULT_VIEW_LABELS: Record<FileChangeView, string> = { before: 'Before', changes: 'Changes', after: 'After' };
const DEFAULT_CHANGE_LABELS: Record<FileChange, string> = { add: 'added', modify: 'modified', rename: 'renamed', remove: 'removed' };

const GLYPH: Record<FileChange, string> = { add: '+', modify: '~', rename: '→', remove: '−' };

/** A change is meaning, so it is addressed through intent roles, never accents. */
const TONE: Record<FileChange, { text: string; fill: string }> = {
  add: { text: 'text-intent-success', fill: 'bg-intent-success' },
  modify: { text: 'text-intent-warning', fill: 'bg-intent-warning' },
  rename: { text: 'text-intent-info', fill: 'bg-intent-info' },
  remove: { text: 'text-intent-danger', fill: 'bg-intent-danger' },
};

function isDirectory(node: FileChangeNode): boolean {
  return node.children != null;
}

/** Drops what does not exist on one side of the change, and empty directories with it. */
function visible(nodes: FileChangeNode[], view: FileChangeView): FileChangeNode[] {
  return nodes.flatMap((node) => {
    if (view === 'before' && node.change === 'add') return [];
    if (view === 'after' && node.change === 'remove') return [];
    if (!isDirectory(node)) return [node];
    const children = visible(node.children ?? [], view);
    return children.length > 0 || view === 'changes' ? [{ ...node, children }] : [];
  });
}

function tally(nodes: FileChangeNode[], counts: Record<FileChange, number> = { add: 0, modify: 0, rename: 0, remove: 0 }): Record<FileChange, number> {
  for (const node of nodes) {
    if (node.change) counts[node.change] += 1;
    if (node.children) tally(node.children, counts);
  }
  return counts;
}

function ChangeMark({ change }: { change: FileChange }) {
  return (
    <span
      aria-hidden="true"
      data-slot="file-change-tree-mark"
      className={cn('inline-flex size-4 shrink-0 select-none items-center justify-center text-[0.7rem] font-bold leading-none text-content-inverse', TONE[change].fill)}
    >
      {GLYPH[change]}
    </span>
  );
}

function Entries({ nodes, view, changeLabels }: { nodes: FileChangeNode[]; view: FileChangeView; changeLabels: Record<FileChange, string> }) {
  return (
    <ul className="flex flex-col gap-3" data-slot="file-change-tree-list">
      {nodes.map((node, index) => {
        const last = index === nodes.length - 1;
        const marked = view === 'changes' && node.change != null;
        const change = marked ? node.change : undefined;
        return (
          <li key={`${node.name}-${index}`} className="relative pl-6" data-slot="file-change-tree-entry">
            {/* The elbow: a stem down to this row, then a tick across to it. The last row's stem stops at its tick. */}
            <span aria-hidden="true" className={cn('absolute left-0 top-0 border-l-2 border-edge-subtle', last ? 'h-[0.8em]' : '-bottom-3')} />
            <span aria-hidden="true" className="absolute left-0 top-[0.8em] w-4 border-t-2 border-edge-subtle" />
            <div className="flex items-center gap-2">
              {change ? <ChangeMark change={change} /> : null}
              <span className={cn('min-w-0 break-all', change ? TONE[change].text : 'text-content-primary', change === 'remove' && 'line-through')}>
                {node.name}
              </span>
              {change ? <span className="sr-only">({changeLabels[change]})</span> : null}
            </div>
            {node.note != null && !isDirectory(node) ? <p className="m-0 mt-1 text-pretty text-content-secondary">{node.note}</p> : null}
            {isDirectory(node) && (node.children?.length ?? 0) > 0 ? (
              <div className="mt-3">
                <Entries nodes={node.children ?? []} view={view} changeLabels={changeLabels} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * A changeset drawn as its directory layout: each top-level directory is a boxed column under
 * one connector, its files hang from a ruled tree with a change mark and a one-line note, and a
 * footer tallies the change and switches between the tree before, the change itself, and after.
 *
 * Stacks into one column below the `sm` breakpoint, where the connector is dropped.
 */
export const FileChangeTree = React.forwardRef<HTMLDivElement, FileChangeTreeProps>(function FileChangeTree(
  { label = 'File changes', nodes, view: viewProp, defaultView = 'changes', onViewChange, hideFooter = false, viewLabels, changeLabels, className, ...rest },
  ref,
) {
  const [uncontrolled, setUncontrolled] = React.useState<FileChangeView>(defaultView);
  const view = viewProp ?? uncontrolled;
  const views = { ...DEFAULT_VIEW_LABELS, ...viewLabels };
  const changes = { ...DEFAULT_CHANGE_LABELS, ...changeLabels };
  const columns = visible(nodes, view);
  const counts = tally(nodes);
  const connected = columns.length > 1;

  const pick = (next: FileChangeView) => {
    if (viewProp == null) setUncontrolled(next);
    onViewChange?.(next);
  };

  return (
    <AsciiFrameBody ref={ref} {...rest} data-slot="file-change-tree" className={cn('flex flex-col gap-6 font-sans', className)}>
      <div role="list" aria-label={label} className="flex flex-col gap-8 sm:flex-row sm:gap-6">
        {columns.map((column, index) => {
          const first = index === 0;
          const last = index === columns.length - 1;
          const marked = view === 'changes' && column.change != null;
          return (
            <div role="listitem" key={`${column.name}-${index}`} className="relative flex min-w-0 flex-1 flex-col" data-slot="file-change-tree-column">
              {connected ? (
                <span aria-hidden="true" className="relative hidden h-6 sm:block">
                  {/* The shared bar, carried half a gap past each side so neighbours meet; the ends stop at the drop. */}
                  <span className={cn('absolute top-0 border-t-2 border-edge-strong', first ? 'left-1/2' : '-left-3', last ? 'right-1/2' : '-right-3')} />
                  <span className="absolute left-1/2 top-0 h-full border-l-2 border-edge-strong" />
                </span>
              ) : null}
              <div className="flex items-center justify-center gap-2 border-2 border-edge-strong bg-surface-base px-3 py-3 font-semibold text-content-primary" data-slot="file-change-tree-root">
                {marked && column.change ? <ChangeMark change={column.change} /> : null}
                <span className={cn('break-all', marked && column.change ? TONE[column.change].text : undefined)}>{column.name}</span>
                {marked && column.change ? <span className="sr-only">({changes[column.change]})</span> : null}
              </div>
              {column.note != null ? <p className="m-0 mt-2 text-pretty text-content-secondary">{column.note}</p> : null}
              {(column.children?.length ?? 0) > 0 ? (
                <div className="ml-4 mt-4">
                  <Entries nodes={column.children ?? []} view={view} changeLabels={changes} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {hideFooter ? null : (
        <div className="flex flex-wrap items-center justify-between gap-4" data-slot="file-change-tree-footer">
          <p className="m-0 flex flex-wrap gap-x-5 gap-y-1 font-mono tabular-nums" data-slot="file-change-tree-tally">
            {CHANGES.filter((change) => counts[change] > 0).map((change) => (
              <span key={change} className={TONE[change].text}>
                <span aria-hidden="true">{GLYPH[change]}</span>
                {counts[change]} {changes[change]}
              </span>
            ))}
          </p>
          <div role="group" aria-label="View" className="flex border-2 border-edge-default" data-slot="file-change-tree-views">
            {VIEWS.map((option, index) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => pick(option)}
                className={cn(
                  'px-4 py-1.5 text-content-secondary hover:bg-surface-raised',
                  index > 0 && 'border-l-2 border-edge-default',
                  view === option && 'bg-content-primary font-semibold text-content-inverse hover:bg-content-primary',
                )}
              >
                {views[option]}
              </button>
            ))}
          </div>
        </div>
      )}
    </AsciiFrameBody>
  );
});
