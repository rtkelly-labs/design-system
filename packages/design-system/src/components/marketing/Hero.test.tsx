import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Hero } from './Hero';

describe('Hero', () => {
  it('is a region named by its one h1', () => {
    render(<Hero title="Ship it" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toContain('Ship it');
    expect(screen.getByRole('region', { name: /Ship it/ })).toBeDefined();
  });

  it('holds no copy of its own: an empty slot renders no wrapper', () => {
    const { container } = render(<Hero title="T" bracketed={false} />);
    expect(container.textContent).toBe('T');
    for (const slot of ['hero-eyebrow', 'hero-actions', 'hero-media']) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).toBeNull();
    }
  });

  it('places the eyebrow, subtitle, actions and media', () => {
    const { container } = render(
      <Hero
        title="T"
        eyebrow={<span>NEW</span>}
        subtitle="A line."
        actions={<button type="button">Go</button>}
      >
        <img alt="Screenshot" src="data:," />
      </Hero>,
    );
    expect(container.querySelector('[data-slot="hero-eyebrow"]')?.textContent).toBe('NEW');
    expect(screen.getByText('A line.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Go' })).toBeDefined();
    expect(screen.getByRole('img', { name: 'Screenshot' }).closest('[data-slot="hero-media"]')).not.toBeNull();
  });

  it('aligns to the start on request', () => {
    const { container } = render(<Hero title="T" align="start" actions={<span>a</span>} />);
    expect(container.querySelector('[data-slot="hero"]')?.className).toContain('text-left');
    expect(container.querySelector('[data-slot="hero-actions"]')?.className).toContain('justify-start');
  });

  it('forwards its ref, merges className and spreads the rest', () => {
    const ref = createRef<HTMLElement>();
    render(<Hero ref={ref} title="T" className="mb-4" data-testid="h" style={{ color: 'red' }} />);
    const root = screen.getByTestId('h');
    expect(ref.current).toBe(root);
    expect(root.tagName).toBe('SECTION');
    expect(root.className).toContain('mb-4');
    expect(root.className).not.toContain('mb-16');
    expect(root.style.color).toBe('red');
  });
});
