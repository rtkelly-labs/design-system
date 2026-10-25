import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { IndexedSection } from './IndexedSection';

describe('IndexedSection', () => {
  it('is a region named by its heading, at the requested level', () => {
    render(
      <IndexedSection index="A" title="What changed" headingLevel={2} actions={<button type="button">Comment</button>}>
        content
      </IndexedSection>,
    );
    expect(screen.getByRole('region', { name: 'What changed' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'What changed' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Comment' })).toBeTruthy();
    expect(screen.getByText('A')).toBeTruthy();
  });

  it('renders title with data-slot', () => {
    const { container } = render(<IndexedSection index="01" title="Summary">body</IndexedSection>);
    const title = container.querySelector('[data-slot="indexed-section-title"]');
    expect(title).toBeTruthy();
    expect(title?.textContent).toBe('Summary');
  });

  it('forwards refs', () => {
    const section = createRef<HTMLElement>();
    render(<IndexedSection ref={section} index="B" title="Checks" />);
    expect(section.current).toBe(screen.getByRole('region', { name: 'Checks' }));
  });

  it('defaults to bg-surface-base standalone, and can be overridden via surface prop', () => {
    const { container: standalone } = render(<IndexedSection index="1" title="Standalone" />);
    expect(standalone.firstElementChild?.classList.contains('bg-surface-base')).toBe(true);

    const { container: raised } = render(<IndexedSection index="2" title="Raised" surface="raised" />);
    expect(raised.firstElementChild?.classList.contains('bg-surface-raised')).toBe(true);

    const { container: transparent } = render(<IndexedSection index="3" title="Transparent" surface="transparent" />);
    expect(transparent.firstElementChild?.classList.contains('bg-transparent')).toBe(true);
  });
});
