import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { createRef, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TimeRangePicker, TimeRangeProvider, useTimeCursor, useTimeRange } from './TimeRange';

const NOW = Date.UTC(2026, 9, 22, 14, 0);
const HOUR = 3_600_000;
const wrap = (props: Partial<Parameters<typeof TimeRangeProvider>[0]> = {}) => ({ children }: { children: ReactNode }) => <TimeRangeProvider now={NOW} {...props}>{children}</TimeRangeProvider>;

describe('TimeRangeProvider', () => {
  it('starts on the default preset and follows now while relative', () => {
    const { result, rerender } = renderHook(() => useTimeRange(), { wrapper: wrap() });
    expect(result.current).toMatchObject({ presetId: '1h', range: { from: NOW - HOUR, to: NOW } });
    rerender();
    act(() => result.current!.selectPreset('15m'));
    expect(result.current).toMatchObject({ presetId: '15m', range: { from: NOW - 900_000, to: NOW } });
  });

  it('keeps a custom window fixed and reports changes', () => {
    const onRangeChange = vi.fn();
    const { result } = renderHook(() => useTimeRange(), { wrapper: wrap({ onRangeChange }) });
    act(() => result.current!.setRange({ from: NOW - 10, to: NOW - 20 }));
    expect(result.current).toMatchObject({ presetId: null, range: { from: NOW - 20, to: NOW - 10 } });
    expect(onRangeChange).toHaveBeenCalledWith({ from: NOW - 20, to: NOW - 10 }, null);
  });

  it('shares a hover cursor, and both hooks are null without a provider', () => {
    const { result } = renderHook(() => useTimeCursor(), { wrapper: wrap() });
    expect(result.current!.cursor).toBeNull();
    act(() => result.current!.setCursor(NOW - 5));
    expect(result.current!.cursor).toBe(NOW - 5);
    expect(renderHook(() => useTimeRange()).result.current).toBeNull();
    expect(renderHook(() => useTimeCursor()).result.current).toBeNull();
  });
});

describe('TimeRangePicker', () => {
  function Zoom() {
    const state = useTimeRange()!;
    return <button type="button" onClick={() => state.setRange({ from: NOW - 600_000, to: NOW - 300_000 })}>zoom</button>;
  }

  it('selects presets, shows a zoomed window, and resets to the last preset', () => {
    const ref = createRef<HTMLDivElement>();
    render(<TimeRangeProvider now={NOW}><TimeRangePicker ref={ref} /><Zoom /></TimeRangeProvider>);
    expect(ref.current?.getAttribute('data-slot')).toBe('time-range-picker');
    expect(screen.getByRole('button', { name: '1h' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('13:00 – 14:00 UTC')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '6h' }));
    expect(screen.getByText('08:00 – 14:00 UTC')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'zoom' }));
    expect(screen.getByText('Zoomed · 5m')).toBeTruthy();
    expect(screen.getByRole('button', { name: '6h' }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(screen.getByRole('button', { name: 'Reset to 6h' }));
    expect(screen.getByRole('button', { name: '6h' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('renders nothing outside a provider', () => {
    const { container } = render(<TimeRangePicker />);
    expect(container.innerHTML).toBe('');
  });
});
