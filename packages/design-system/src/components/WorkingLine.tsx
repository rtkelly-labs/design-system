import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { recipe } from '../lib/recipe';
import { formatTraceDuration } from '../lib/trace';
import { Spinner } from './Spinner';

/** Where the work stands. `waiting` is waiting on a person. */
export type WorkingLineStatus = 'working' | 'waiting' | 'done' | 'failed';

const workingLine = recipe({
  slots: {
    root: 'inline-flex max-w-full min-w-0 items-center gap-2 whitespace-nowrap text-content-primary',
    mark: 'inline-flex flex-none items-center justify-center',
    phase: 'min-w-0 truncate',
    elapsed: 'flex-none tabular-nums text-content-muted',
  },
  variants: {
    size: {
      xs: { root: 'text-xs' },
      sm: { root: 'text-sm' },
    },
    status: {
      working: { mark: 'text-intent-info' },
      waiting: { mark: 'font-bold text-intent-warning', phase: 'text-intent-warning' },
      done: { mark: 'font-bold text-intent-success' },
      failed: { mark: 'font-bold text-intent-danger', phase: 'text-intent-danger' },
    },
  },
  defaultVariants: { size: 'sm', status: 'working' },
});

export interface WorkingLineProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** What the agent is doing now, in words: `Running tests`. Swapped when it changes, never animated. */
  phase?: ReactNode;
  /**
   * Phases to cycle through, one every `interval`, from `startedAt` and `now`.
   * For a demo or a placeholder; a real run passes `phase`. Ignored when `phase` is set.
   */
  phases?: readonly string[];
  /** How long each of `phases` shows, in milliseconds. Default 2400. */
  interval?: number;
  /** `working`, `waiting` (on a person), `done` or `failed`. Default `working`. */
  status?: WorkingLineStatus;
  /** When the work started, in milliseconds on the same clock as `now`. */
  startedAt?: number;
  /** The current time. Never read from the clock here, so a story is a function of its props. */
  now?: number;
  /** The total, in milliseconds, when there is no `startedAt`/`now` pair. */
  duration?: number;
  /** What a finished line says instead of its phase. Default `Done`, or `Failed`. */
  summary?: ReactNode;
  /** `xs` or `sm`, matching `Button`'s two smallest sizes so it sits in a footer or a header. Default `sm`. */
  size?: 'xs' | 'sm';
  /**
   * Hold the quadrant still. Set it when another mark in the same region is
   * the live one (`DESIGN.md` §8). Default false.
   */
  still?: boolean;
}

/**
 * One line saying an agent is still working, and on what.
 *
 * The quadrant (`Spinner`), the current phase in words, and the elapsed time.
 * Between a prompt and its answer an agent can be silent for tens of seconds;
 * a bare spinner says something is happening, and this says what. The phase is
 * swapped when it changes, never typed out, shimmered or cross-faded, because
 * text is swapped and never animated (`DESIGN.md` §8). The quadrant is the only
 * thing that moves, and only while `working`.
 *
 * Finished, it settles: `✓` and a summary when done, `✕` when failed, `!` and
 * the phase in `intent.warning` while waiting on a person. The status is a
 * mark and a word, never colour alone.
 *
 * It is one `role="status"` region: the phase and the summary are announced
 * politely when they change. The elapsed time is hidden from assistive
 * technology, so a ticking clock is not read out every second.
 */
export const WorkingLine = forwardRef<HTMLDivElement, WorkingLineProps>(function WorkingLine(
  { phase, phases, interval = 2400, status = 'working', startedAt, now, duration, summary, size = 'sm', still = false, className, ...props },
  ref,
) {
  const styles = workingLine({ size, status });
  const elapsed = startedAt !== undefined && now !== undefined ? Math.max(0, now - startedAt) : duration;
  const current = phase ?? (phases ? workingPhase(phases, elapsed ?? 0, interval) : undefined);
  const finished = status === 'done' || status === 'failed';
  const words = finished ? (summary ?? (status === 'done' ? 'Done' : 'Failed')) : current;
  const time = elapsed === undefined ? null : `${finished ? 'in ' : ''}${formatTraceDuration(elapsed)}`;

  return (
    <div ref={ref} role="status" data-slot="working-line" data-status={status} {...props} className={styles.root({ className })}>
      <span aria-hidden="true" data-slot="working-line-mark" className={styles.mark()}>
        {status === 'working' ? (
          <Spinner size="sm" accent="current" still={still} label="" />
        ) : status === 'waiting' ? (
          '!'
        ) : status === 'done' ? (
          '✓'
        ) : (
          '✕'
        )}
      </span>
      {words ? <span data-slot="working-line-phase" className={styles.phase()}>{words}</span> : null}
      {time ? (
        <span aria-hidden="true" data-slot="working-line-elapsed" className={styles.elapsed()}>
          {time}
        </span>
      ) : null}
    </div>
  );
});

WorkingLine.displayName = 'WorkingLine';

/**
 * The phase a `phases` cycle is on at `elapsed`. Kept private: exported, the
 * docs extractor folds it into `WorkingLine`'s record and empties its props table.
 */
function workingPhase(phases: readonly string[], elapsed: number, interval = 2400): string | undefined {
  if (!phases.length) return undefined;
  const step = Math.max(1, interval);
  return phases[Math.floor(Math.max(0, elapsed) / step) % phases.length];
}
