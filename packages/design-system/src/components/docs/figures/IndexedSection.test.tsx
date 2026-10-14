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
});
