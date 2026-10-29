import * as React from 'react';
import { cn } from '../../lib/recipe';
import { ChangeBar } from './ChangeBar';
import { ChangeCount } from './ChangeCount';

const LINES = ['line', 'lines'] as const;
import { diffAnchor } from './diff';

export interface ChangeIndexFile {
  /** The file's path. */
  path: string;
  /** Lines added. */
  added: number;
  /** Lines removed. */
  removed: number;
  /** Where the file's diff is. Defaults to `#` + `diffAnchor(path)`, which `DiffView` uses for its id. */
  href?: string;
}

export interface ChangeIndexGroup {
  /** The group's name, such as `Call graph` or `Hand-written code metrics`. */
  title: string;
  /** The group's files, in reading order. A group with none is left out. */
  files: readonly ChangeIndexFile[];
}

export interface ChangeIndexProps extends React.HTMLAttributes<HTMLElement> {
  /** Accessible name for the index. */
  label?: string;
  /** Groups in reading order. Each prints its own total before its files. */
  groups: readonly ChangeIndexGroup[];
  /** Printed when every group is empty. */
  emptyText?: React.ReactNode;
  /** Additional classes for the root. */
  className?: string;
}

function PathLabel({ path }: { path: string }) {
  const cut = path.lastIndexOf('/');
  return (
    <span className="min-w-0 [overflow-wrap:anywhere]">
      {cut >= 0 ? <span className="text-content-muted">{path.slice(0, cut + 1)}</span> : null}
      {path.slice(cut + 1)}
    </span>
  );
}

/**
 * The files a change touched, grouped, each group totalled before its files, each file with a
 * count and a bar on one shared scale, and each linking to its diff.
 *
 * Plain anchors, so the index works in a report with no script. A flat, scannable list rather
 * than `FileChangeTree`'s drawn directory layout: that figure explains a small changeset's shape,
 * this one indexes a large one.
 */
export const ChangeIndex = React.forwardRef<HTMLElement, ChangeIndexProps>(function ChangeIndex(
  { label = 'Changed files', groups, emptyText = 'No files changed.', className, ...rest },
  ref,
) {
  const files = groups.flatMap((group) => group.files);
  const max = Math.max(1, ...files.map((file) => file.added + file.removed));
  return (
    <nav ref={ref} aria-label={label} data-slot="change-index" {...rest} className={cn('border-t-2 border-edge-strong font-mono text-sm', className)}>
      {files.length === 0 ? <p className="m-0 py-3 font-sans text-content-muted">{emptyText}</p> : null}
      {groups
        .filter((group) => group.files.length > 0)
        .map((group) => {
          const added = group.files.reduce((sum, file) => sum + file.added, 0);
          const removed = group.files.reduce((sum, file) => sum + file.removed, 0);
          return (
            <section key={group.title} data-slot="change-index-group" aria-label={group.title} className="border-b border-dashed border-edge-subtle pb-2 last:border-b-0">
              <h3 className="m-0 flex items-center gap-3 px-0 pb-1 pt-2.5 text-xs font-bold uppercase tracking-wider text-content-primary">
                <span className="flex-1">{group.title}</span>
                <ChangeCount added={added} removed={removed} noun={LINES} className="text-xs" />
              </h3>
              <ul className="m-0 list-none p-0">
                {group.files.map((file) => (
                  <li key={file.path}>
                    <a
                      href={file.href ?? `#${diffAnchor(file.path)}`}
                      data-slot="change-index-file"
                      data-path={file.path}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-1.5 pl-4 pr-0 text-content-primary no-underline hover:bg-surface-sunken focus-visible:bg-surface-sunken sm:grid-cols-[minmax(0,1fr)_auto_auto]"
                    >
                      <PathLabel path={file.path} />
                      <ChangeCount added={file.added} removed={file.removed} noun={LINES} />
                      <ChangeBar added={file.added} removed={file.removed} max={max} className="hidden sm:inline-block" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </nav>
  );
});
