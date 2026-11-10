import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

/**
 * The claims worth pinning are the accessible ones and the motion contract. How
 * the quadrant looks is a screenshot's problem; whether it is *announced*,
 * whether it steps, and whether the preference for less motion is honoured,
 * are this file's.
 */
describe('Spinner', () => {
  it('announces itself as a status region with a default name', () => {
    render(<Spinner />);

    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText('Loading')).toBeDefined();
  });

  /*
   * The label is the live region's *content*, not its name, and the
   * distinction is the reason this asserts text rather than an accessible
   * name: `role="status"` names from the author only, so an `aria-label` on it
   * would be a second string a screen reader may read instead of the one that
   * is announced when the region appears.
   */
  it('takes a caller-supplied label, which is what a screen reader reads', () => {
    render(<Spinner label="Loading results" />);

    expect(screen.getByRole('status').textContent).toBe('Loading results');
  });

  it('hides the mark from assistive technology, so the wait is announced once', () => {
    const { container } = render(<Spinner />);
    const mark = container.querySelector('[data-slot="spinner-mark"]');

    expect(mark?.getAttribute('aria-hidden')).toBe('true');
  });

  // The rule the issue names for `Skeleton` applies here in the opposite
  // direction: a stopped spinner reads as a hung page, so the preference slows
  // the stepping rather than removing it.
  it('slows rather than stops under prefers-reduced-motion', () => {
    const { container } = render(<Spinner />);
    const quarter = container.querySelector('[data-slot="spinner-quarter"]');

    expect(quarter?.className).toContain('animate-ds-step');
    expect(quarter?.className).toContain('motion-reduce:animate-ds-step-slow');
    expect(quarter?.className).not.toContain('motion-reduce:animate-none');
  });

  it('holds the first frame when still, so a region can keep one live mark', () => {
    const { container } = render(<Spinner still />);
    const quarter = container.querySelector('[data-slot="spinner-quarter"]');

    expect(quarter?.className).not.toMatch(/(^|\s)animate-ds-step(\s|$)/);
  });

  // DESIGN.md §8: motion steps, it does not glide, and it moves the mark, never
  // the layout. The square holds still; only the quarter inside it moves.
  it('steps a quarter inside a square that does not move', () => {
    const { container } = render(<Spinner />);
    const mark = container.querySelector('[data-slot="spinner-mark"]');
    const quarter = container.querySelector('[data-slot="spinner-quarter"]');

    expect(mark?.className).not.toMatch(/animate-/);
    expect(quarter?.className).toContain('size-1/2');
    expect(quarter?.parentElement).toBe(mark);
  });

  // ADR 0007: the Level picks the drawing through `sketch:`, not a prop. Both
  // are always in the markup, so a nested provider draws its own Level.
  it('carries both drawings and lets the sketch variant choose', () => {
    const { container } = render(<Spinner />);
    const quarter = container.querySelector('[data-slot="spinner-quarter"]');
    const [cell, hatch] = Array.from(quarter?.children ?? []);

    expect(cell?.getAttribute('class')).toContain('sketch:hidden');
    expect(hatch?.tagName.toLowerCase()).toBe('svg');
    expect(hatch?.getAttribute('class')).toContain('hidden');
    expect(hatch?.getAttribute('class')).toContain('sketch:block');
  });

  // Two spinners on one page must not share a pattern id, or the second
  // hatches with the first one's pattern and an unmounted first leaves it blank.
  it('gives each spinner its own hatch pattern', () => {
    const { container } = render(
      <>
        <Spinner />
        <Spinner />
      </>,
    );
    const ids = Array.from(container.querySelectorAll('pattern')).map((p) => p.id);

    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) expect(container.querySelector(`rect[fill="url(#${id})"]`)).not.toBeNull();
  });

  it.each([
    ['primary', 'text-accent-primary'],
    ['danger', 'text-intent-danger'],
    ['success', 'text-intent-success'],
  ] as const)('colours the leading edge from the %s role', (accent, expected) => {
    const { container } = render(<Spinner accent={accent} />);

    expect(container.querySelector('[data-slot="spinner-mark"]')?.className).toContain(expected);
  });

  // Inside a filled Button, the button's ink is the one measured against its fill.
  it('inherits the surrounding ink when the accent is current', () => {
    const { container } = render(<Spinner accent="current" />);
    const mark = container.querySelector('[data-slot="spinner-mark"]');

    expect(mark?.className).not.toMatch(/(^|\s)text-/);
    expect(mark?.className).toContain('border-current/30');
  });

  it.each([
    ['sm', 'size-3'],
    ['md', 'size-5'],
    ['lg', 'size-8'],
  ] as const)('sizes the mark for %s', (size, expected) => {
    const { container } = render(<Spinner size={size} />);

    expect(container.querySelector('[data-slot="spinner-mark"]')?.className).toContain(expected);
  });

  it('forwards its ref and spreads unrecognised props onto the wrapper', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Spinner ref={ref} data-testid="busy" title="Working" />);

    expect(ref.current?.dataset.slot).toBe('spinner');
    expect(screen.getByTestId('busy').getAttribute('title')).toBe('Working');
  });

  // The recipe's `class` slot, not an appended string: a caller's utility has
  // to win the conflict rather than race it in CSS source order.
  it('merges a caller className onto the wrapper', () => {
    render(<Spinner className="inline-block" data-testid="busy" />);

    expect(screen.getByTestId('busy').className).toContain('inline-block');
  });
});
