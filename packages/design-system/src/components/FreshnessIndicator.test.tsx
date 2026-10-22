import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { FreshnessIndicator, formatAge } from './FreshnessIndicator';

const now = Date.UTC(2026, 9, 22, 14, 0);

describe('FreshnessIndicator', () => {
  it('reads the age in a <time> carrying the ISO instant, and forwards its ref', () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(<FreshnessIndicator ref={ref} updatedAt={now - 12_000} now={now} id="fresh" />);
    expect(ref.current?.getAttribute('data-slot')).toBe('freshness-indicator');
    expect(ref.current?.id).toBe('fresh');
    expect(ref.current?.getAttribute('data-state')).toBe('fresh');
    const time = container.querySelector('time')!;
    expect(time.textContent).toBe('Updated 12s ago');
    expect(time.getAttribute('dateTime')).toBe('2026-10-22T13:59:48.000Z');
  });

  it('turns stale past staleAfter, in the warning role', () => {
    render(<FreshnessIndicator updatedAt={now - 5 * 60_000} now={now} />);
    const text = screen.getByText('Stale · updated 5m ago');
    expect(text.closest('[data-slot="freshness-indicator"]')?.className).toContain('text-intent-warning');
  });

  it('honours a custom staleAfter', () => {
    render(<FreshnessIndicator updatedAt={now - 3 * 60_000} now={now} staleAfter={10 * 60_000} />);
    expect(screen.getByText('Updated 3m ago')).toBeTruthy();
  });

  it('pulses only when live and fresh, with reduced motion respected', () => {
    const { container, rerender } = render(<FreshnessIndicator updatedAt={now - 1000} now={now} live />);
    const dot = () => container.querySelector('[data-slot="freshness-indicator-dot"]');
    expect(dot()?.className).toContain('animate-ds-pulse');
    expect(dot()?.className).toContain('motion-reduce:animate-none');
    rerender(<FreshnessIndicator updatedAt={now - 120_000} now={now} live />);
    expect(dot()?.className).not.toContain('animate-ds-pulse');
    rerender(<FreshnessIndicator updatedAt={now - 1000} now={now} />);
    expect(dot()).toBeNull();
  });

  it('reads Paused when paused', () => {
    render(<FreshnessIndicator updatedAt={now - 600_000} now={now} paused live />);
    expect(screen.getByText('Paused')).toBeTruthy();
  });

  it('formats ages by hand', () => {
    expect(formatAge(400)).toBe('just now');
    expect(formatAge(59_999)).toBe('59s ago');
    expect(formatAge(2 * 3_600_000)).toBe('2h ago');
    expect(formatAge(3 * 86_400_000)).toBe('3d ago');
  });
});
