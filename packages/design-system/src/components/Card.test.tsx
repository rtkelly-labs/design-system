import { createRef } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from './Card';

/**
 * `Card` renders two structurally different things, and which one it picks was
 * historically inferred from whether a `title` happened to be set. #92 added an
 * explicit `variant`.
 *
 * The filename bar is the cheapest thing to key the assertions on: it exists in
 * the card form and nowhere else, so its presence identifies the form without
 * asserting on styling, which would be a worse version of a screenshot.
 */
function hasFilenameBar(container: HTMLElement) {
  return container.textContent?.includes('.md') ?? false;
}

describe('Card form selection', () => {
  it('renders the panel when variant says so, even with a title', () => {
    const { container } = render(<Card variant="panel" title="Scoped themes" />);
    expect(hasFilenameBar(container)).toBe(false);
  });

  it('renders the card when variant says so, even with no title', () => {
    const { container } = render(
      <Card variant="card">
        <p>Body</p>
      </Card>,
    );
    expect(hasFilenameBar(container)).toBe(true);
  });

  it('lets variant override the deprecated panel prop', () => {
    const { container } = render(<Card panel variant="card" title="Scoped themes" />);
    expect(hasFilenameBar(container)).toBe(true);
  });

  describe('the inference kept for call sites predating variant', () => {
    it('still picks the panel for children with no title', () => {
      const { container } = render(
        <Card>
          <p>Body</p>
        </Card>,
      );
      expect(hasFilenameBar(container)).toBe(false);
    });

    it('still picks the card once a title appears — the surprise variant exists to remove', () => {
      const { container } = render(
        <Card title="Scoped themes">
          <p>Body</p>
        </Card>,
      );
      expect(hasFilenameBar(container)).toBe(true);
    });

    it('still honours the deprecated panel prop', () => {
      const { container } = render(<Card panel title="Scoped themes" />);
      expect(hasFilenameBar(container)).toBe(false);
    });
  });
});

describe('Card ref', () => {
  it('forwards its ref to the root of either form', () => {
    const panel = createRef<HTMLDivElement>();
    const card = createRef<HTMLDivElement>();
    render(
      <>
        <Card ref={panel} variant="panel" data-testid="panel" />
        <Card ref={card} variant="card" title="A post" data-testid="card" />
      </>,
    );
    expect(panel.current?.dataset.testid).toBe('panel');
    expect(card.current?.dataset.testid).toBe('card');
  });
});

describe('Card weight', () => {
  it('draws a 2px strong edge by default and a 1px default edge when quiet', () => {
    const { container, rerender } = render(<Card variant="panel">x</Card>);
    const root = () => container.querySelector('[data-slot="card"]') as HTMLElement;
    expect(root().style.border).toContain('2px');
    rerender(<Card variant="panel" weight="quiet">x</Card>);
    expect(root().style.border).toContain('1px');
    expect(root().style.border).toContain('var(--ds-border-default)');
  });

  it('keeps the accent stripe when quiet', () => {
    const { container } = render(<Card variant="panel" weight="quiet" accent="danger">x</Card>);
    expect((container.querySelector('[data-slot="card"]') as HTMLElement).style.borderLeftWidth).toBe('4px');
  });
});
