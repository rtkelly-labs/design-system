import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

/**
 * The claims worth pinning are the accessible ones. A rotating square is a
 * screenshot's problem; whether the rotation is *announced*, and whether the
 * preference for less motion is honoured, are this file's.
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
  // the rotation rather than removing it.
  it('slows rather than stops under prefers-reduced-motion', () => {
    const { container } = render(<Spinner />);
    const mark = container.querySelector('[data-slot="spinner-mark"]');

    expect(mark?.className).toContain('animate-ds-spin');
    expect(mark?.className).toContain('motion-reduce:animate-ds-spin-slow');
    expect(mark?.className).not.toContain('motion-reduce:animate-none');
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
    expect(mark?.className).toContain('border-t-current');
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
