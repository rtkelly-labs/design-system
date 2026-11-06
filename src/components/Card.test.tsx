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
