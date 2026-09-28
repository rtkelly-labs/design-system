import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionGrid } from './SectionGrid';

describe('SectionGrid', () => {
  it('names its slots from the prefix it is given', () => {
    const { container } = render(
      <SectionGrid slot="x-grid" title="T" description="D">
        <div />
      </SectionGrid>,
    );
    expect(container.querySelector('[data-slot="x-grid"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="x-grid-header"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="x-grid-items"]')?.children).toHaveLength(1);
  });

  it('keeps a caller-supplied labelling over its own', () => {
    render(
      <>
        <span id="elsewhere">Override</span>
        <SectionGrid slot="x" title="T" aria-labelledby="elsewhere" />
      </>,
    );
    expect(screen.getByRole('region', { name: 'Override' })).toBeDefined();
  });

  it('centres the description only when the header is centred', () => {
    const { container, rerender } = render(<SectionGrid slot="x" description="D" />);
    const description = () => container.querySelector('[data-slot="x-header"] p')?.className ?? '';
    expect(description()).toContain('mx-auto');
    rerender(<SectionGrid slot="x" description="D" align="start" />);
    expect(description()).not.toContain('mx-auto');
  });

  it('forwards its ref to the section', () => {
    const ref = createRef<HTMLElement>();
    render(<SectionGrid ref={ref} slot="x" />);
    expect(ref.current?.tagName).toBe('SECTION');
  });
});
