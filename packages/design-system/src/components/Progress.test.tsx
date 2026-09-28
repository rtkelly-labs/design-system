import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Progress } from './Progress';

/**
 * These assert the *contract*, not Base UI. The ARIA is the reason the
 * primitive is here at all, so what is pinned is that a consumer reading this
 * component's props gets a bar that reports its position correctly — including
 * the indeterminate case, where the correct report is the absence of a value.
 */
describe('Progress', () => {
  it('exposes the value, the bounds and the label on one progressbar', () => {
    render(<Progress value={40} label="Uploading evidence" />);

    const bar = screen.getByRole('progressbar', { name: 'Uploading evidence' });

    expect(bar.getAttribute('aria-valuenow')).toBe('40');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
  });

  it('scales a value against a non-percentage max', () => {
    render(<Progress value={3} max={4} label="Steps" />);

    const bar = screen.getByRole('progressbar');

    expect(bar.getAttribute('aria-valuenow')).toBe('3');
    expect(bar.getAttribute('aria-valuemax')).toBe('4');
  });

  // The state a hand-rolled bar gets wrong: no value at all, rather than zero.
  it('reports no value when indeterminate, and says so in words', () => {
    render(<Progress label="Rebuilding tokens" />);

    const bar = screen.getByRole('progressbar');

    expect(bar.getAttribute('aria-valuenow')).toBeNull();
    expect(bar.getAttribute('aria-valuetext')).toBe('indeterminate progress');
  });

  it('sweeps the indicator while indeterminate, and pulses it in place under reduced motion', () => {
    const { container } = render(<Progress label="Rebuilding tokens" />);
    const indicator = container.querySelector('[data-slot="progress-indicator"]');

    expect(indicator?.className).toContain('data-[indeterminate]:animate-ds-track');
    expect(indicator?.className).toContain('motion-reduce:data-[indeterminate]:animate-ds-pulse');
    // A third of a track standing still reads as "33% done"; the reduced-motion
    // bar fills the track instead.
    expect(indicator?.className).toContain('motion-reduce:data-[indeterminate]:w-full');
  });

  it('marks the indeterminate state on the parts, which is what the styling keys off', () => {
    const { container } = render(<Progress label="Rebuilding tokens" />);

    expect(container.querySelector('[data-slot="progress-indicator"]')).toHaveProperty(
      'dataset.indeterminate',
      '',
    );
  });

  it('keeps the label as the accessible name when it is visually hidden', () => {
    render(<Progress value={10} label="Uploading evidence" hideLabel />);

    expect(screen.getByRole('progressbar', { name: 'Uploading evidence' })).toBeDefined();
    expect(screen.getByText('Uploading evidence').className).toContain('sr-only');
  });

  it('shows the formatted value only when asked', () => {
    const { rerender } = render(<Progress value={40} label="Uploading" />);

    expect(screen.queryByText('40%')).toBeNull();

    rerender(<Progress value={40} label="Uploading" showValue />);

    expect(screen.getByText('40%')).toBeDefined();
  });

  it.each([
    ['primary', 'text-accent-primary'],
    ['success', 'text-intent-success'],
    ['warning', 'text-intent-warning'],
  ] as const)('fills from the %s role', (accent, expected) => {
    const { container } = render(<Progress value={50} label="Uploading" accent={accent} />);

    expect(container.querySelector('[data-slot="progress-indicator"]')?.className).toContain(
      expected,
    );
  });

  it('forwards its ref and spreads unrecognised props onto the root', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Progress ref={ref} value={1} label="Uploading" data-testid="bar" />);

    expect(ref.current?.getAttribute('role')).toBe('progressbar');
    expect(screen.getByTestId('bar')).toBeDefined();
  });

  it('merges a caller className onto the root', () => {
    render(<Progress value={1} label="Uploading" className="max-w-xs" data-testid="bar" />);

    expect(screen.getByTestId('bar').className).toContain('max-w-xs');
  });
});
