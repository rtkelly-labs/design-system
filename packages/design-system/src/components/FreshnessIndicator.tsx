import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { recipe } from '../lib/recipe';

export interface FreshnessIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** When the data was last refreshed, as epoch milliseconds. */
  updatedAt: number;
  /** The page's clock, as epoch milliseconds. A prop, never read here, so a story or a capture is deterministic. */
  now: number;
  /** How old the data may get, in milliseconds, before it reads as stale. Default `60_000`. */
  staleAfter?: number;
  /** The view refreshes on its own — a pulsing dot while the data is fresh. */
  live?: boolean;
  /** Refreshing is suspended: reads `Paused`, whatever the age. */
  paused?: boolean;
}

/** Which of the three states an indicator is in. */
export type FreshnessState = 'fresh' | 'stale' | 'paused';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** `12s`, `3m`, `2h`, `4d` — an age in its largest whole unit; `just now` under a second. */
export function formatAge(ms: number): string {
  if (!Number.isFinite(ms) || ms < SECOND) return 'just now';
  if (ms < MINUTE) return `${Math.floor(ms / SECOND)}s ago`;
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)}m ago`;
  if (ms < DAY) return `${Math.floor(ms / HOUR)}h ago`;
  return `${Math.floor(ms / DAY)}d ago`;
}

const freshness = recipe({
  slots: {
    root: 'inline-flex items-center gap-1.5 font-mono text-xs tabular-nums',
    dot: 'inline-block size-2 shrink-0',
    text: '',
  },
  variants: {
    state: {
      fresh: { root: 'text-content-secondary', dot: 'bg-intent-success' },
      stale: { root: 'text-intent-warning', dot: 'bg-intent-warning' },
      paused: { root: 'text-content-muted', dot: 'bg-content-muted' },
    },
    pulse: {
      true: { dot: 'animate-ds-pulse motion-reduce:animate-none' },
    },
  },
});

/**
 * How old the data on screen is: `Updated 12s ago`, `Updated 3m ago`; past
 * `staleAfter` it turns to the warning role and reads `Stale · updated 5m ago`,
 * and `paused` reads `Paused`.
 *
 * `now` is a prop: the indicator never reads the clock, so it re-renders when
 * the page's clock ticks and renders identically in a story. The age sits in
 * a `<time>` whose `dateTime` is the update's ISO instant.
 *
 * `live` adds a dot that pulses while the data is fresh, holds still in the
 * warning role once stale, and greys out when paused. The pulse stops under
 * `prefers-reduced-motion`. It is decoration; the words carry the state.
 */
export const FreshnessIndicator = forwardRef<HTMLSpanElement, FreshnessIndicatorProps>(function FreshnessIndicator(
  { updatedAt, now, staleAfter = 60_000, live = false, paused = false, className, ...props },
  ref,
) {
  const age = Math.max(0, now - updatedAt);
  const state: FreshnessState = paused ? 'paused' : age > staleAfter ? 'stale' : 'fresh';
  const styles = freshness({ state, pulse: live && state === 'fresh' });
  const ago = formatAge(age);
  const words = state === 'paused' ? 'Paused' : state === 'stale' ? `Stale · updated ${ago}` : `Updated ${ago}`;
  const iso = Number.isFinite(updatedAt) ? new Date(updatedAt).toISOString() : undefined;
  return (
    <span ref={ref} data-slot="freshness-indicator" data-state={state} {...props} className={styles.root({ className })}>
      {live ? <span aria-hidden="true" data-slot="freshness-indicator-dot" className={styles.dot()} /> : null}
      <time dateTime={iso} className={styles.text()}>
        {words}
      </time>
    </span>
  );
});

FreshnessIndicator.displayName = 'FreshnessIndicator';
