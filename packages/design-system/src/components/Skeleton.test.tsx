import { createRef } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is hidden from assistive technology, so a scaffold is never read out', () => {
    const { container } = render(<Skeleton />);

    expect(container.querySelector('[data-slot="skeleton"]')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  // The issue's own requirement, and the one clause of it that a screenshot
  // cannot show: a shimmer is the canonical vestibular trigger, so the
  // animation has to come off entirely under the preference.
  it('drops the pulse under prefers-reduced-motion', () => {
    const { container } = render(<Skeleton />);
    const box = container.querySelector('[data-slot="skeleton"]');

    expect(box?.className).toContain('animate-ds-pulse');
    expect(box?.className).toContain('motion-reduce:animate-none');
  });

  it('colours itself from the sunken surface rather than a grey', () => {
    const { container } = render(<Skeleton />);

    expect(container.querySelector('[data-slot="skeleton"]')?.className).toContain(
      'bg-surface-sunken',
    );
  });

  it.each([
    ['text', 'h-4'],
    ['heading', 'h-7'],
    ['block', 'h-24'],
    ['avatar', 'size-12'],
  ] as const)('gives the %s shape its own default geometry', (shape, expected) => {
    const { container } = render(<Skeleton shape={shape} />);

    expect(container.querySelector('[data-slot="skeleton"]')?.className).toContain(expected);
  });

  // Sizing is the caller's, because the measurement that matters is the one
  // the real content will have. The recipe has to let their class win.
  it('lets a caller className replace the shape default', () => {
    const { container } = render(<Skeleton shape="text" className="h-10" />);
    const box = container.querySelector('[data-slot="skeleton"]');

    expect(box?.className).toContain('h-10');
    expect(box?.className).not.toContain('h-4');
  });

  it('forwards its ref and spreads unrecognised props', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<Skeleton ref={ref} aria-hidden={false} data-testid="ghost" />);

    expect(ref.current?.dataset.slot).toBe('skeleton');
    // The spread lands after the default, so a caller with a reason can put
    // the skeleton back into the accessibility tree.
    expect(container.querySelector('[data-slot="skeleton"]')?.getAttribute('aria-hidden')).toBe(
      'false',
    );
  });
});
