'use client';

import { createContext, forwardRef, useCallback, useContext, useMemo, useState, type HTMLAttributes, type ReactNode } from 'react';
import { recipe } from '../lib/recipe';
import {
  TIME_RANGE_PRESETS,
  formatRange,
  formatRangeDuration,
  normaliseRange,
  presetRange,
  type TimeRange,
  type TimeRangePreset,
} from '../lib/timeRange';

export interface TimeRangeState {
  /** The page's clock, as the provider was given it. */
  now: number;
  /** The window every view on the page draws. */
  range: TimeRange;
  /** The preset the range came from, or null once it was zoomed or set by hand. */
  presetId: string | null;
  presets: readonly TimeRangePreset[];
  /** Set the window. Pass a preset id to keep it relative; omit to mark it custom. */
  setRange: (range: TimeRange, presetId?: string | null) => void;
  /** Select a preset by id. */
  selectPreset: (id: string) => void;
}

export interface TimeCursorState {
  /** The time being hovered on any view, or null. */
  cursor: number | null;
  setCursor: (time: number | null) => void;
}

const RangeContext = createContext<TimeRangeState | null>(null);
const CursorContext = createContext<TimeCursorState | null>(null);

/**
 * The shared window, or null outside a `TimeRangeProvider` — every consumer
 * works standalone too, with its own props.
 */
export function useTimeRange(): TimeRangeState | null {
  return useContext(RangeContext);
}

/**
 * The shared hover cursor, or null outside a provider. Its own context, so a
 * cursor moving across a chart re-renders the views that draw it and nothing
 * that only reads the range.
 */
export function useTimeCursor(): TimeCursorState | null {
  return useContext(CursorContext);
}

export interface TimeRangeProviderProps {
  /** The page's clock. Pass `Date.now()` in an app and a fixed epoch in a story. */
  now: number;
  /** The preset selected on mount when uncontrolled. Default `1h`. */
  defaultPresetId?: string;
  /** A controlled window. */
  range?: TimeRange;
  /** Called when the window changes, with the preset it came from. */
  onRangeChange?: (range: TimeRange, presetId: string | null) => void;
  /** The windows the picker offers. Default `TIME_RANGE_PRESETS`. */
  presets?: readonly TimeRangePreset[];
  children?: ReactNode;
}

/**
 * The time window and hover cursor every observability view on a page shares:
 * pick "last hour" once and every chart, heatmap and log list follows; hover
 * one chart and the others draw the same moment; drag across a chart to zoom
 * them all.
 *
 * Renders nothing of its own — it is context, like `ThemeProvider`.
 */
export function TimeRangeProvider({ now, defaultPresetId = '1h', range: rangeProp, onRangeChange, presets = TIME_RANGE_PRESETS, children }: TimeRangeProviderProps) {
  const initial = presets.find((preset) => preset.id === defaultPresetId) ?? presets[0];
  const [owned, setOwned] = useState<{ range: TimeRange; presetId: string | null }>(() => ({
    range: initial ? presetRange(initial, now) : { from: now - 3_600_000, to: now },
    presetId: initial?.id ?? null,
  }));
  const [cursor, setCursor] = useState<number | null>(null);

  const setRange = useCallback((next: TimeRange, presetId: string | null = null) => {
    const clean = normaliseRange(next);
    if (!clean) return;
    setOwned({ range: clean, presetId });
    onRangeChange?.(clean, presetId);
  }, [onRangeChange]);
  const selectPreset = useCallback((id: string) => {
    const preset = presets.find((candidate) => candidate.id === id);
    if (preset) setRange(presetRange(preset, now), preset.id);
  }, [presets, now, setRange]);

  const rangeValue = useMemo<TimeRangeState>(() => {
    // A relative preset follows `now`; a custom window stays where it was put.
    const active = owned.presetId ? presets.find((preset) => preset.id === owned.presetId) : undefined;
    const range = normaliseRange(rangeProp) ?? (active ? presetRange(active, now) : owned.range);
    return { now, range, presetId: rangeProp ? null : owned.presetId, presets, setRange, selectPreset };
  }, [now, rangeProp, owned, presets, setRange, selectPreset]);
  const cursorValue = useMemo<TimeCursorState>(() => ({ cursor, setCursor }), [cursor]);

  return (
    <RangeContext.Provider value={rangeValue}>
      <CursorContext.Provider value={cursorValue}>{children}</CursorContext.Provider>
    </RangeContext.Provider>
  );
}

const timeRangePicker = recipe({
  slots: {
    root: 'inline-flex flex-wrap items-center gap-2 font-mono text-xs text-content-primary',
    presets: 'flex border border-edge-default',
    preset: 'cursor-pointer border-l border-edge-default px-2 py-1 tabular-nums text-content-secondary first:border-l-0 hover:bg-surface-raised hover:text-content-primary aria-pressed:bg-accent-primary aria-pressed:text-content-inverse',
    range: 'tabular-nums text-content-secondary',
    custom: 'border border-accent-primary px-1.5 py-0.5 uppercase text-accent-primary',
    reset: 'cursor-pointer underline decoration-dotted underline-offset-2 text-content-secondary hover:text-content-primary',
  },
});

export interface TimeRangePickerProps extends HTMLAttributes<HTMLDivElement> {
  /** Accessible name for the preset group. Default `Time range`. */
  label?: string;
}

/**
 * The preset strip — 15m, 1h, 6h, 24h, 7d — and the window it resolves to, in
 * UTC. When a chart zooms the window it shows `Zoomed` and a reset back to the
 * last preset. Reads and writes the nearest `TimeRangeProvider`, and renders
 * nothing without one.
 */
export const TimeRangePicker = forwardRef<HTMLDivElement, TimeRangePickerProps>(function TimeRangePicker(
  { label = 'Time range', className, ...props },
  ref,
) {
  const state = useTimeRange();
  const [lastPreset, setLastPreset] = useState<string | null>(state?.presetId ?? null);
  if (state?.presetId && state.presetId !== lastPreset) setLastPreset(state.presetId);
  const styles = timeRangePicker();
  if (!state) return null;
  const custom = state.presetId === null;
  return (
    <div ref={ref} data-slot="time-range-picker" {...props} className={styles.root({ className })}>
      <div role="group" aria-label={label} className={styles.presets()}>
        {state.presets.map((preset) => (
          <button key={preset.id} type="button" aria-pressed={state.presetId === preset.id} onClick={() => state.selectPreset(preset.id)} className={styles.preset()}>
            {preset.label}
          </button>
        ))}
      </div>
      {custom ? <span className={styles.custom()}>Zoomed · {formatRangeDuration(state.range.to - state.range.from)}</span> : null}
      <span className={styles.range()}>{formatRange(state.range)} UTC</span>
      {custom && lastPreset ? (
        <button type="button" onClick={() => state.selectPreset(lastPreset)} className={styles.reset()}>
          Reset to {state.presets.find((preset) => preset.id === lastPreset)?.label}
        </button>
      ) : null}
    </div>
  );
});

TimeRangePicker.displayName = 'TimeRangePicker';
