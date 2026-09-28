import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CTASection } from './CTASection';

describe('CTASection', () => {
  it('is a region named by its h2', () => {
    render(<CTASection title="Start today" />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Start today');
    expect(screen.getByRole('region', { name: 'Start today' })).toBeDefined();
  });

  it('holds no copy or buttons of its own', () => {
    const { container } = render(<CTASection title="Ask" />);
    expect(container.textContent).toBe('Ask');
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('[data-slot="cta-section-body"]')).toBeNull();
    expect(container.querySelector('[data-slot="cta-section-actions"]')).toBeNull();
  });

  it('places the body and the actions', () => {
    render(
      <CTASection title="Ask" actions={<a href="/start">Start</a>}>
        No card required.
      </CTASection>,
    );
    expect(screen.getByText('No card required.')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Start' })).toBeDefined();
  });

  it('takes its shadow from the accent, primary by default', () => {
    const { container, rerender } = render(<CTASection title="Ask" />);
    const root = () => container.querySelector('[data-slot="cta-section"]')?.className ?? '';
    expect(root()).toContain('shadow-hard-accent-primary');
    rerender(<CTASection title="Ask" accent="secondary" align="start" />);
    expect(root()).toContain('shadow-hard-accent-secondary');
    expect(root()).toContain('text-left');
  });

  it('forwards its ref, merges className and spreads the rest', () => {
    const ref = createRef<HTMLElement>();
    render(<CTASection ref={ref} title="Ask" className="my-0" data-testid="c" />);
    const root = screen.getByTestId('c');
    expect(ref.current).toBe(root);
    expect(root.className).toContain('my-0');
    expect(root.className).not.toContain('my-12');
  });
});
