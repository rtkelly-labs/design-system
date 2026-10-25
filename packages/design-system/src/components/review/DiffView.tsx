import * as React from 'react';
import { cn, recipe } from '../../lib/recipe';
import { ChangeBar } from './ChangeBar';
import { ChangeCount } from './ChangeCount';

const LINES = ['line', 'lines'] as const;
import { countDiff, diffAnchor, type DiffHunk, type DiffLineKind } from './diff';

export interface DiffViewProps extends Omit<React.HTMLAttributes<HTMLElement>, 'children'> {
  /** The file's path. The directory part is drawn muted; the anchor `id` is derived from it. */
  path: string;
  /** The hunks to draw. `parseUnifiedDiff` reads them from `git diff` output. */
  hunks: readonly DiffHunk[];
  /** Fold the file behind its summary row, as a `<details>`. Defaults to `true`. */
  collapsible?: boolean;
  /** Start unfolded. Printing prints only what is open. */
  defaultOpen?: boolean;
  /** Wrap long lines instead of scrolling them. */
  wrap?: boolean;
  /** The largest change beside this one, so the summary bars share a scale. */
  max?: number;
  /** Additional classes for the root. */
  className?: string;
}

const SIGN: Record<DiffLineKind, string> = { added: '+', removed: '−', context: ' ' };
const SPOKEN: Record<DiffLineKind, string> = { added: 'added', removed: 'removed', context: '' };

const diffStyles = recipe({
  slots: {
    root: 'border border-edge-default bg-surface-raised scroll-mt-3',
    summary: 'grid cursor-pointer list-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5 font-mono text-sm sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] [&::-webkit-details-marker]:hidden group-open:border-b group-open:border-edge-default group-open:bg-surface-sunken',
    scroll: 'overflow-x-auto',
    table: 'w-full border-collapse font-mono text-xs leading-relaxed',
    gutter: 'w-px select-none whitespace-nowrap border-r border-edge-subtle px-2.5 text-right align-top tabular-nums text-content-muted',
    sign: 'w-px select-none px-2 align-top font-bold',
    text: 'px-2.5 align-top text-content-primary',
  },
  variants: {
    wrap: {
      true: { text: 'whitespace-pre-wrap [overflow-wrap:anywhere]' },
      false: { text: 'whitespace-pre' },
    },
  },
  defaultVariants: { wrap: false },
});

const ROW: Record<DiffLineKind, string> = {
  added: 'bg-delta-ground-added',
  removed: 'bg-delta-ground-removed',
  context: '',
};

const SIGN_TONE: Record<DiffLineKind, string> = {
  added: 'text-delta-added',
  removed: 'text-delta-removed',
  context: 'text-content-muted',
};

function PathLabel({ path }: { path: string }) {
  const cut = path.lastIndexOf('/');
  return (
    <span data-slot="diff-view-path" className="min-w-0 font-semibold [overflow-wrap:anywhere]">
      {cut >= 0 ? <span className="font-normal text-content-muted">{path.slice(0, cut + 1)}</span> : null}
      {path.slice(cut + 1)}
    </span>
  );
}

/**
 * One file's line diff: a summary row with the path, a change count and a bar, then each hunk's
 * header and its lines with baseline and candidate line numbers in two gutters.
 *
 * A changed row is told by its sign column as well as its ground, so the diff survives
 * greyscale printing. Folds as a `<details>` by default — the one disclosure a static report
 * has — with a `[+]`/`[−]` text marker. Colours are the `delta` roles: an added line is added,
 * not approved.
 */
export const DiffView = React.forwardRef<HTMLElement, DiffViewProps>(function DiffView(
  { path, hunks, collapsible = true, defaultOpen = false, wrap = false, max, id, className, ...rest },
  ref,
) {
  const styles = diffStyles({ wrap });
  const { added, removed } = countDiff(hunks);
  const anchor = id ?? diffAnchor(path);

  const body =
    hunks.length === 0 ? (
      <p className="m-0 px-3 py-3 text-sm text-content-muted">No line changes.</p>
    ) : (
      <div className={styles.scroll()}>
        <table data-slot="diff-view-table" className={styles.table()}>
          <caption className="sr-only">{`Changes to ${path}: ${added} added, ${removed} removed`}</caption>
          {hunks.map((hunk, h) => (
            <tbody key={`${hunk.header}-${h}`} data-slot="diff-view-hunk">
              <tr className="bg-delta-ground-hunk">
                <td className={cn(styles.gutter(), 'border-r-0')} colSpan={3} aria-hidden="true" />
                <td className="px-2.5 py-0.5 text-content-secondary whitespace-pre-wrap [overflow-wrap:anywhere]">{hunk.header}</td>
              </tr>
              {hunk.lines.flatMap((line, l) => [
                <tr key={l} data-kind={line.kind} className={ROW[line.kind]}>
                  <td className={styles.gutter()}>{line.oldNumber ?? ''}</td>
                  <td className={styles.gutter()}>{line.newNumber ?? ''}</td>
                  <td className={cn(styles.sign(), SIGN_TONE[line.kind])}>
                    <span aria-hidden="true">{SIGN[line.kind]}</span>
                    {line.kind !== 'context' ? <span className="sr-only">{SPOKEN[line.kind]}</span> : null}
                  </td>
                  <td className={styles.text()}>{line.text}</td>
                </tr>,
                ...(line.comments ?? []).map((comment, c) => (
                  <tr key={`${l}-comment-${c}`} data-slot="diff-view-comment">
                    <td colSpan={4} className="px-2.5 py-2 font-sans">
                      {/* Sticky to the scroller's left edge and no wider than the viewport, so a comment stays
                          readable on a narrow screen while the long lines beside it scroll. */}
                      <div className="sticky left-2 flex w-[min(48rem,calc(100vw-4.5rem))] flex-col sm:ml-24 gap-1.5 whitespace-normal border border-l-2 border-edge-default border-l-accent-primary bg-surface-raised px-3 py-2.5">
                        <p className="m-0 flex flex-wrap items-baseline gap-x-2 font-mono text-xs">
                          <span className="font-bold text-content-primary">{comment.author}</span>
                          {comment.meta ? <span className="text-content-muted">{comment.meta}</span> : null}
                          <span className="sr-only">{`commented on ${line.kind === 'removed' ? 'removed' : ''} line ${line.newNumber ?? line.oldNumber ?? ''}`}</span>
                        </p>
                        <div className="text-sm text-content-primary [overflow-wrap:anywhere]">{comment.body}</div>
                      </div>
                    </td>
                  </tr>
                )),
              ])}
            </tbody>
          ))}
        </table>
      </div>
    );

  const summary = (
    <>
      {collapsible ? (
        <span aria-hidden="true" className="font-bold text-content-muted">
          <span className="group-open:hidden">[+]</span>
          <span className="hidden group-open:inline">[−]</span>
        </span>
      ) : (
        <span aria-hidden="true" />
      )}
      <PathLabel path={path} />
      <ChangeCount added={added} removed={removed} noun={LINES} />
      <ChangeBar added={added} removed={removed} max={max} className="hidden sm:inline-block" />
    </>
  );

  if (!collapsible) {
    return (
      <section ref={ref} id={anchor} aria-label={path} data-slot="diff-view" {...rest} className={cn(styles.root(), className)}>
        <div className={cn(styles.summary(), 'cursor-auto border-b border-edge-default bg-surface-sunken')}>{summary}</div>
        {body}
      </section>
    );
  }
  return (
    <details
      ref={ref as React.Ref<HTMLDetailsElement>}
      id={anchor}
      open={defaultOpen}
      data-slot="diff-view"
      {...(rest as React.HTMLAttributes<HTMLDetailsElement>)}
      className={cn('group', styles.root(), className)}
    >
      <summary className={styles.summary()}>{summary}</summary>
      {body}
    </details>
  );
});
