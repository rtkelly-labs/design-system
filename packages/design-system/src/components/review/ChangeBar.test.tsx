import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChangeBar } from './ChangeBar';

const widths = (container: HTMLElement) =>
  [...container.querySelectorAll('rect')].map((r) => Number(r.getAttribute('width')));

describe('ChangeBar', () => {
  it('fills the track with its own change by default', () => {
    const { container } = render(<ChangeBar added={3} removed={1} />);
    expect(widths(container)).toEqual([75, 25]);
  });

  it('shares a scale with its siblings', () => {
    const { container } = render(<ChangeBar added={2} removed={2} max={43} />);
    const [a, d] = widths(container);
    expect(a! + d!).toBeCloseTo((4 / 43) * 100);
  });

  it('is decorative unless named', () => {
    const { container, rerender } = render(<ChangeBar added={1} removed={0} />);
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
    rerender(<ChangeBar added={1} removed={0} label="1 line added" />);
    expect(container.querySelector('svg')!.getAttribute('role')).toBe('img');
  });

  it('never draws past the track', () => {
    const { container } = render(<ChangeBar added={90} removed={90} max={100} />);
    const [a, d] = widths(container);
    expect(a! + d!).toBe(100);
  });
});
