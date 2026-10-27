'use client';

import { useEffect, useState } from 'react';

export interface UseTraceClockOptions {
  /** Tick while true. Default true — pass `model.inFlightCount > 0` to stop once a trace settles. */
  running?: boolean;
  /** Milliseconds between ticks. Default 100. */
  interval?: number;
  /** The clock, for tests and replays. Default `Date.now`. */
  read?: () => number;
}

/**
 * The `now` a live `TraceWaterfall` or `TraceViewer` draws in-flight spans to.
 *
 * The components never read the clock themselves, so a render is deterministic;
 * this hook is the one place a live trace gets its time. It stops ticking when
 * `running` turns false, and returns the last value it read.
 */
export function useTraceClock({ running = true, interval = 100, read = Date.now }: UseTraceClockOptions = {}): number {
  const [now, setNow] = useState(read);
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setNow(read()), Math.max(16, interval));
    return () => clearInterval(id);
  }, [running, interval, read]);
  return now;
}
