import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { WorkingLine } from './WorkingLine';

describe('WorkingLine', () => {
  it('says what is happening and for how long, as one status region', () => {
    render(<WorkingLine phase="Running tests" startedAt={0} now={12_000} />);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Running tests');
    expect(status.textContent).toContain('12s');
    expect(status.querySelector('[data-slot="spinner-quarter"]')?.className).toContain('animate-ds-step');
  });

  it('hides the ticking time and the mark from assistive technology', () => {
    const { container } = render(<WorkingLine phase="Reading schema" startedAt={0} now={4000} />);
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    const hiddenText = Array.from(hidden).map((node) => node.textContent).join(' ');
    expect(hiddenText).toContain('4s');
    expect(container.querySelectorAll('[role="status"]:not([aria-hidden="true"] *)')).toHaveLength(1);
  });

  it('swaps the phase from now, and never reads the clock', () => {
    const phases = ['Reading', 'Writing', 'Testing'];
    const { rerender } = render(<WorkingLine phases={phases} interval={1000} startedAt={0} now={500} />);
    expect(screen.getByRole('status').textContent).toContain('Reading');
    rerender(<WorkingLine phases={phases} interval={1000} startedAt={0} now={2500} />);
    expect(screen.getByRole('status').textContent).toContain('Testing');
    rerender(<WorkingLine phases={phases} interval={1000} startedAt={0} now={3500} />);
    expect(screen.getByRole('status').textContent).toContain('Reading');
  });

  it('settles on a mark and a word when done, failed or waiting, and stops moving', () => {
    const { rerender, container } = render(<WorkingLine status="done" summary="Rebaseline staged" duration={30_200} />);
    expect(screen.getByRole('status').textContent).toBe('✓Rebaseline stagedin 30.2s');
    expect(container.querySelector('[data-slot="spinner"]')).toBeNull();
    rerender(<WorkingLine status="failed" duration={2400} />);
    expect(screen.getByRole('status').textContent).toContain('✕Failed');
    rerender(<WorkingLine status="waiting" phase="Push staging/5.4?" />);
    expect(screen.getByRole('status').textContent).toContain('!Push staging/5.4?');
    expect(container.querySelector('[data-slot="spinner"]')).toBeNull();
  });

  it('holds the quadrant still when another mark in the region is the live one', () => {
    const { container } = render(<WorkingLine phase="x" still />);
    expect(container.querySelector('[data-slot="spinner-quarter"]')?.className).not.toMatch(/animate-ds-step/);
  });

  it('carries a data-slot on every part', () => {
    const { container } = render(<WorkingLine phase="x" startedAt={0} now={1000} />);
    for (const slot of ['working-line-mark', 'working-line-phase', 'working-line-elapsed']) {
      expect(container.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
  });

  it('forwards its ref and props', () => {
    const ref = createRef<HTMLDivElement>();
    render(<WorkingLine ref={ref} phase="x" data-testid="line" />);
    expect(ref.current?.dataset.slot).toBe('working-line');
    expect(screen.getByTestId('line')).toBe(ref.current);
  });
});
