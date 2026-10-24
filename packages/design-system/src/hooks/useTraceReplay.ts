'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseTraceReplayOptions {
  /** Start playing on mount. Default false. */
  autoPlay?: boolean;
  /** Restart from zero on reaching the end. Default false. */
  loop?: boolean;
  /** Playback rate: 1 is real time. Default 1. */
  speed?: number;
  /** Pause held at the end before a loop restarts, in real milliseconds. Default 800. */
  loopDelay?: number;
}

export interface TraceReplay {
  /** Trace time reached, in milliseconds from its start. */
  elapsed: number;
  playing: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  /** Back to zero, playing. */
  restart: () => void;
  /** Jump to a trace time. Keeps playing if it was. */
  seek: (elapsed: number) => void;
  setSpeed: (speed: number) => void;
}

/**
 * Plays a finished trace back in real time: `elapsed` advances from 0 to
 * `duration` on animation frames, scaled by `speed`. Hand it to `replayTrace`
 * and the waterfall draws each span as it starts and grows it until it ends.
 *
 * The clock is the only impure thing in the trace components, and it lives
 * here: paused, nothing re-renders.
 */
export function useTraceReplay(duration: number, { autoPlay = false, loop = false, speed: initialSpeed = 1, loopDelay = 800 }: UseTraceReplayOptions = {}): TraceReplay {
  const total = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const [elapsed, setElapsed] = useState(() => (autoPlay ? 0 : total));
  const [playing, setPlaying] = useState(autoPlay && total > 0);
  const [speed, setSpeed] = useState(initialSpeed);
  // The trace can change under a mounted player — spans that load after mount,
  // a live trace that grows. Resting at the end, it follows the new end;
  // anywhere else it stays put, clamped to the new length.
  const [seenTotal, setSeenTotal] = useState(total);
  if (seenTotal !== total) {
    setSeenTotal(total);
    const next = !playing && elapsed >= seenTotal ? total : Math.min(elapsed, total);
    if (next !== elapsed) setElapsed(next);
  }
  // The frame loop reads these through refs so changing speed never restarts it.
  const elapsedRef = useRef(elapsed);
  useEffect(() => { elapsedRef.current = elapsed; }, [elapsed]);
  const speedRef = useRef(speed);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    if (!playing) return undefined;
    let frame = 0;
    let last: number | null = null;
    let heldSince: number | null = null;
    const step = (time: number) => {
      const delta = last === null ? 0 : time - last;
      last = time;
      let next = elapsedRef.current + delta * speedRef.current;
      if (next >= total) {
        next = total;
        if (!loop) {
          elapsedRef.current = next;
          setElapsed(next);
          setPlaying(false);
          return;
        }
        heldSince ??= time;
        if (time - heldSince >= loopDelay) { next = 0; heldSince = null; }
      }
      elapsedRef.current = next;
      setElapsed(next);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [playing, total, loop, loopDelay]);

  const seek = useCallback((to: number) => {
    const next = Math.max(0, Math.min(total, Number.isFinite(to) ? to : 0));
    elapsedRef.current = next;
    setElapsed(next);
  }, [total]);
  const play = useCallback(() => {
    if (!total) return;
    // Playing from the end starts again, as a media player does.
    if (elapsedRef.current >= total) seek(0);
    setPlaying(true);
  }, [total, seek]);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);
  const restart = useCallback(() => { seek(0); if (total) setPlaying(true); }, [seek, total]);

  return { elapsed, playing, speed, play, pause, toggle, restart, seek, setSpeed };
}
