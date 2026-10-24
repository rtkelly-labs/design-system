import type { ReactNode } from 'react';
import * as React from 'react';
import { cn } from '../../lib/recipe';
import { ChangeCount } from './ChangeCount';
import { ChangeIndex } from './ChangeIndex';
import { DiffView } from './DiffView';
import { StatusMark } from './StatusMark';
import { VerdictBand } from './VerdictBand';
import { countDiff, type DiffHunk } from './diff';
import { STATUS_TONE_TEXT, type AssessmentOutcome, type StatusTone } from './vocabulary';

export type PullRequestState = 'open' | 'draft' | 'merged' | 'closed';
export type ReviewerState = 'approved' | 'changes-requested' | 'commented' | 'pending';

/** One CI check. Its status is an Assessment outcome, because a check is a policy that ran. */
export interface PullRequestCheck {
  name: string;
  status: AssessmentOutcome;
  /** Replaces the printed status word, e.g. `pending` for a queued run drawn as `inconclusive`. */
  label?: string;
  /** One line on what it found. */
  summary?: string;
  /** Pre-formatted, e.g. `6m 12s`. */
  duration?: string;
}

/** Everything a pull request page shows. */
export interface PullRequestData {
  /** `owner/name`. */
  repository: string;
  number: number;
  title: string;
  state: PullRequestState;
  author: string;
  /** The branch merged into. */
  base: string;
  /** The branch merged from. */
  head: string;
  /** Pre-formatted, e.g. `opened 23 Oct 2026`. Formatted by the caller so a render never reads the clock. */
  opened: string;
  labels?: readonly string[];
  /** The description, one paragraph per entry. */
  description: readonly ReactNode[];
  reviewers: readonly { name: string; state: ReviewerState }[];
  checks: readonly PullRequestCheck[];
  /** A comparison tool's summary of the change, drawn as a verdict band at the top of the conversation. */
  verdict?: { outcome: AssessmentOutcome; title: string; context?: string };
  /** Top-level comments, oldest first. */
  conversation?: readonly { author: string; meta?: string; body: ReactNode }[];
  /** Changed files. Lines may carry review comments. */
  files: readonly { path: string; hunks: readonly DiffHunk[] }[];
}

export interface PullRequestPageProps extends React.HTMLAttributes<HTMLElement> {
  /** The pull request to draw. `DEFAULT_PULL_REQUEST` is a sample to start from. */
  pullRequest: PullRequestData;
  /** Additional classes for the page. */
  className?: string;
}

const STATE: Record<PullRequestState, { glyph: string; tone: string }> = {
  open: { glyph: '●', tone: 'border-accent-primary text-accent-primary' },
  draft: { glyph: '○', tone: 'border-dashed border-content-muted text-content-muted' },
  merged: { glyph: '◆', tone: 'border-accent-secondary text-accent-secondary' },
  closed: { glyph: '✕', tone: 'border-content-secondary text-content-secondary' },
};

const REVIEWER: Record<ReviewerState, { glyph: string; tone: StatusTone; word: string }> = {
  approved: { glyph: '✓', tone: 'success', word: 'approved' },
  'changes-requested': { glyph: '✕', tone: 'danger', word: 'changes requested' },
  commented: { glyph: '●', tone: 'neutral', word: 'commented' },
  pending: { glyph: '○', tone: 'hollow', word: 'review pending' },
};

const label = 'font-mono text-xs font-bold uppercase tracking-wider text-content-muted';

/** A section link above the header's own rule: an accent underline on hover, not a boxed tab. */
const TAB = 'pb-3 pt-1 text-content-primary no-underline decoration-accent-primary decoration-[3px] underline-offset-[0.6rem] hover:underline focus-visible:underline';

function Comment({ author, meta, children }: { author: string; meta?: string; children: ReactNode }) {
  return (
    <article className="flex flex-col border border-edge-default bg-surface-raised">
      <header className="flex flex-wrap items-baseline gap-x-2 border-b border-edge-subtle bg-surface-sunken px-3 py-2 font-mono text-xs">
        <span className="font-bold text-content-primary">{author}</span>
        {meta ? <span className="text-content-muted">{meta}</span> : null}
      </header>
      <div className="px-3 py-2.5 text-sm text-content-primary">{children}</div>
    </article>
  );
}

/**
 * A pull request under review, the page a code host shows: title and state, the branches, a
 * conversation led by a comparison tool's verdict, reviewers and labels in a side rail, the
 * checks as status marks, and the changed files as line diffs with review comments pinned under
 * their lines.
 *
 * Static: the section links are anchors, the files fold as `<details>`, and nothing posts. A
 * check is drawn with the Assessment vocabulary because a check is a policy that ran; the files
 * use the `delta` roles because a diff is not a verdict.
 */
export const PullRequestPage = React.forwardRef<HTMLElement, PullRequestPageProps>(function PullRequestPage(
  { pullRequest: pr, className, ...rest },
  ref,
) {
  const files = pr.files.map((file) => ({ ...file, ...countDiff(file.hunks) }));
  const added = files.reduce((sum, file) => sum + file.added, 0);
  const removed = files.reduce((sum, file) => sum + file.removed, 0);
  const max = Math.max(1, ...files.map((file) => file.added + file.removed));
  const commentCount = files.reduce((sum, file) => sum + file.hunks.reduce((n, hunk) => n + hunk.lines.reduce((m, line) => m + (line.comments?.length ?? 0), 0), 0), 0);
  const failing = pr.checks.filter((check) => check.status === 'fail').length;
  const state = STATE[pr.state];

  return (
    <main ref={ref} data-slot="pull-request-page" {...rest} className={cn('mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 font-sans text-content-primary sm:px-6', className)}>
      <header className="flex flex-col gap-3 border-b-4 border-edge-strong">
        <p className="m-0 font-mono text-xs font-bold uppercase tracking-widest text-content-muted">
          [ {pr.repository} · pull request #{pr.number} ]
        </p>
        <h1 className="m-0 font-display text-2xl font-bold leading-tight sm:text-3xl">
          {pr.title} <span className="font-normal text-content-muted">#{pr.number}</span>
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <span data-slot="pull-request-state" className={cn('inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-xs font-bold uppercase tracking-wider', state.tone)}>
            <span aria-hidden="true">{state.glyph}</span>
            {pr.state}
          </span>
          <span className="text-content-secondary">
            <span className="font-mono font-bold text-content-primary">{pr.author}</span> wants to merge{' '}
            <code className="border border-edge-subtle bg-surface-sunken px-1.5 font-mono text-xs">{pr.head}</code> into{' '}
            <code className="border border-edge-subtle bg-surface-sunken px-1.5 font-mono text-xs">{pr.base}</code> · {pr.opened}
          </span>
        </div>
        <nav aria-label="Pull request sections" className="mt-3 flex max-w-full flex-wrap gap-x-6 font-mono text-xs font-bold uppercase tracking-wider">
          <a href="#conversation" className={TAB}>Conversation</a>
          <a href="#checks" className={TAB}>
            Checks <span className="text-content-muted">{pr.checks.length}</span>
          </a>
          <a href="#files" className={cn(TAB, 'flex items-center gap-2')}>
            Files changed <span className="text-content-muted">{files.length}</span>
            <ChangeCount added={added} removed={removed} noun={['line', 'lines']} className="text-xs" />
          </a>
        </nav>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <section id="conversation" aria-label="Conversation" className="flex min-w-0 scroll-mt-4 flex-col gap-4">
          {pr.verdict ? (
            <VerdictBand outcome={pr.verdict.outcome} title={pr.verdict.title}>
              {pr.verdict.context}
            </VerdictBand>
          ) : null}
          <Comment author={pr.author} meta="opened this pull request">
            <div className="flex flex-col gap-2">
              {pr.description.map((paragraph, i) => (
                <p key={i} className="m-0">{paragraph}</p>
              ))}
            </div>
          </Comment>
          {pr.conversation?.map((entry, i) => (
            <Comment key={i} author={entry.author} meta={entry.meta}>
              {entry.body}
            </Comment>
          ))}
          <p className="m-0 font-mono text-xs text-content-muted">
            {commentCount} review comment{commentCount === 1 ? '' : 's'} on the changed files.
          </p>
        </section>

        <aside aria-label="Details" className="flex flex-col gap-6 text-sm">
          <section className="flex flex-col gap-2">
            <h2 className={cn('m-0', label)}>Reviewers</h2>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {pr.reviewers.map((reviewer) => {
                const look = REVIEWER[reviewer.state];
                return (
                  <li key={reviewer.name} className="flex items-center justify-between gap-2">
                    <span className="font-mono">{reviewer.name}</span>
                    <span className={cn('inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider', STATUS_TONE_TEXT[look.tone])}>
                      <span aria-hidden="true">{look.glyph}</span>
                      {look.word}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
          {pr.labels && pr.labels.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className={cn('m-0', label)}>Labels</h2>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {pr.labels.map((name) => (
                  <li key={name} className="border border-edge-subtle bg-surface-sunken px-1.5 py-0.5 font-mono text-xs">{name}</li>
                ))}
              </ul>
            </section>
          ) : null}
          <section className="flex flex-col gap-2">
            <h2 className={cn('m-0', label)}>Merge</h2>
            <p className="m-0 text-content-secondary">
              {failing > 0 ? `${failing} failing check${failing === 1 ? '' : 's'}. ` : 'No failing checks. '}
              {pr.reviewers.some((r) => r.state === 'changes-requested') ? 'Changes requested, so it cannot merge yet.' : 'Waiting on review.'}
            </p>
          </section>
        </aside>
      </div>

      <section id="checks" aria-labelledby="checks-heading" className="flex scroll-mt-4 flex-col gap-3">
        <h2 id="checks-heading" className="m-0 border-b-2 border-edge-subtle pb-2 font-display text-xl font-bold uppercase">Checks</h2>
        <ul className="m-0 flex list-none flex-col p-0">
          {pr.checks.map((check) => (
            <li key={check.name} data-slot="pull-request-check" className="grid grid-cols-[minmax(7.5rem,auto)_minmax(0,1fr)] items-start gap-x-4 gap-y-1 border-b border-edge-subtle py-2.5 last:border-b-0 sm:grid-cols-[minmax(9rem,auto)_minmax(0,1fr)_auto]">
              <StatusMark vocabulary="outcome" status={check.status} label={check.label} className="w-fit" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="font-mono text-sm font-bold [overflow-wrap:anywhere]">{check.name}</span>
                {check.summary ? <span className="text-sm text-content-secondary">{check.summary}</span> : null}
              </div>
              {check.duration ? <span className="col-start-2 font-mono text-xs tabular-nums text-content-muted sm:col-start-auto">{check.duration}</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <section id="files" aria-labelledby="files-heading" className="flex scroll-mt-4 flex-col gap-4">
        <h2 id="files-heading" className="m-0 flex flex-wrap items-baseline gap-3 border-b-2 border-edge-subtle pb-2 font-display text-xl font-bold uppercase">
          Files changed <ChangeCount added={added} removed={removed} noun={['line', 'lines']} />
        </h2>
        <ChangeIndex label="Files changed" groups={[{ title: `${files.length} file${files.length === 1 ? '' : 's'}`, files: files.map(({ path, added: a, removed: r }) => ({ path, added: a, removed: r })) }]} />
        {files.map((file) => (
          <DiffView key={file.path} path={file.path} hunks={file.hunks} max={max} defaultOpen={file.hunks.some((hunk) => hunk.lines.some((line) => (line.comments?.length ?? 0) > 0))} />
        ))}
      </section>
    </main>
  );
});
