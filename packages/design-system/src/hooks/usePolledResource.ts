'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UsePolledResourceOptions {
  /**
   * What is being loaded — an id, a filter, a page number. A change of key
   * drops the previous key's data and loads afresh. The load function itself is
   * read through a ref, so a new closure on every render reloads nothing; the
   * key is what says the question changed.
   */
  key?: string | number;
  /**
   * Milliseconds between loads, counted from when the previous one settled.
   * Default `30_000`. Zero or less loads once and never polls.
   */
  intervalMs?: number;
  /** Load and poll while true. Default true. While false nothing loads, and `reload` does nothing. */
  enabled?: boolean;
}

export interface UsePolledResourceResult<T> {
  /** The last good answer for the current key, kept when a later load fails. */
  data: T | undefined;
  /** Why the latest load failed, as a message; cleared by the next success. */
  error: string | undefined;
  /** True while a load for the current key is in flight. */
  loading: boolean;
  /** When `data` was last loaded, as epoch milliseconds — what `FreshnessIndicator` takes as `updatedAt`. */
  updatedAt: number | undefined;
  /** Load now, superseding any load in flight, and restart the poll from when it settles. */
  reload: () => void;
}

interface Snapshot<T> {
  key: string | number | undefined;
  data: T | undefined;
  error: string | undefined;
  loading: boolean;
  updatedAt: number | undefined;
}

/** An error, a rejection reason or a thrown string, as one line a person can read. */
function messageOf(reason: unknown): string {
  return reason instanceof Error ? reason.message : String(reason);
}

/**
 * Data that refreshes itself while someone is looking at it.
 *
 * Loads once on mount, then again `intervalMs` after each load settles — but
 * only while `document.visibilityState` is `visible`. A background tab costs
 * nothing. A tick that falls due while the tab is hidden is remembered, and the
 * load happens the moment the tab is shown again, so a reader returning after
 * ten minutes sees fresh data at once rather than ten-minute-old data for up to
 * another interval. A tab that is hidden and shown again *before* a tick fell
 * due does not load, so switching back and forth does not hammer the source.
 *
 * Counting the interval from when a load settles, not on a fixed clock, means a
 * load slower than the interval is never cut off by the next tick.
 *
 * ## What it guarantees
 *
 * - **The newest request wins.** Every load takes a generation number, and an
 *   answer that arrives after a newer request was made is discarded. A slow
 *   response for an old key can never overwrite a fast one for the new key.
 * - **A failure keeps the last good answer.** `data` survives a failed load and
 *   `error` says why, so a view can show what it had with a stale warning —
 *   which is what `ResourceState` renders.
 * - **A new key starts empty.** Changing `key` clears `data`, `error` and
 *   `updatedAt` in the same render, so the previous key's answer is never
 *   shown as though it belonged to the new one.
 *
 * Errors are normalised to a message string: the one thing a view does with a
 * failure is show it, and doing that once here saves every caller doing it.
 */
export function usePolledResource<T>(
  load: () => Promise<T>,
  { key, intervalMs = 30_000, enabled = true }: UsePolledResourceOptions = {},
): UsePolledResourceResult<T> {
  const [snapshot, setSnapshot] = useState<Snapshot<T>>(() => ({
    key,
    data: undefined,
    error: undefined,
    loading: enabled,
    updatedAt: undefined,
  }));

  const loadRef = useRef(load);
  const keyRef = useRef(key);
  const intervalRef = useRef(intervalMs);
  const enabledRef = useRef(enabled);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const missed = useRef(false);

  // Declared first, so every effect below reads this render's values.
  useEffect(() => {
    loadRef.current = load;
    keyRef.current = key;
    intervalRef.current = intervalMs;
    enabledRef.current = enabled;
  });

  // Named, so the poll's timeout re-enters it without reading `run` before it exists.
  const run = useCallback(function loadNow() {
    if (!enabledRef.current) return;
    clearTimeout(timer.current);
    missed.current = false;
    const mine = ++generation.current;
    const forKey = keyRef.current;

    setSnapshot((prev) =>
      prev.key === forKey
        ? { ...prev, loading: true }
        : { key: forKey, data: undefined, error: undefined, loading: true, updatedAt: undefined },
    );

    const schedule = () => {
      const every = intervalRef.current;
      if (every <= 0) return;
      timer.current = setTimeout(() => {
        if (document.visibilityState === 'visible') loadNow();
        else missed.current = true;
      }, every);
    };

    let pending: Promise<T>;
    try {
      pending = Promise.resolve(loadRef.current());
    } catch (reason) {
      pending = Promise.reject(reason);
    }

    pending.then(
      (value) => {
        if (mine !== generation.current) return;
        setSnapshot({ key: forKey, data: value, error: undefined, loading: false, updatedAt: Date.now() });
        schedule();
      },
      (reason: unknown) => {
        if (mine !== generation.current) return;
        setSnapshot((prev) => ({ ...prev, error: messageOf(reason), loading: false }));
        schedule();
      },
    );
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const requests = generation;
    run();
    return () => {
      // Whatever is in flight now answers a question nobody is asking.
      requests.current++;
      clearTimeout(timer.current);
      missed.current = false;
      setSnapshot((prev) => (prev.loading ? { ...prev, loading: false } : prev));
    };
  }, [key, enabled, intervalMs, run]);

  useEffect(() => {
    if (!enabled) return undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && missed.current) run();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [enabled, run]);

  // The render after a key change, before the effect has loaded anything: the
  // snapshot still holds the old key's answer, which must not be shown.
  if (snapshot.key !== key) {
    return { data: undefined, error: undefined, loading: enabled, updatedAt: undefined, reload: run };
  }

  return {
    data: snapshot.data,
    error: snapshot.error,
    loading: enabled && snapshot.loading,
    updatedAt: snapshot.updatedAt,
    reload: run,
  };
}
