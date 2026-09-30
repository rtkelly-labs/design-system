import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { ColophonCard } from './ColophonCard';

describe('ColophonCard', () => {
  it('renders author name, role, bio, and section marker', () => {
    render(
      <ColophonCard
        authorName="ADA LOVELACE"
        authorRole="COMPUTATIONAL ANALYST"
        bio="First programmer in human history."
        sectionMarker="§"
      />,
    );

    expect(screen.getByText('ADA LOVELACE')).toBeDefined();
    expect(screen.getByText('COMPUTATIONAL ANALYST')).toBeDefined();
    expect(screen.getByText('First programmer in human history.')).toBeDefined();
    expect(screen.getAllByText('§').length).toBeGreaterThan(0);
  });

  it('renders action links with custom icons and labels', () => {
    render(
      <ColophonCard
        links={[
          { label: 'SOURCE', href: 'https://github.com/test', icon: 'code' },
          { label: 'SITE', href: 'https://test.dev', icon: 'globe' },
        ]}
      />,
    );

    const sourceLink = screen.getByText('SOURCE').closest('a');
    expect(sourceLink?.getAttribute('href')).toBe('https://github.com/test');
    expect(sourceLink?.getAttribute('target')).toBe('_blank');
  });

  it('forwards ref to root aside element', () => {
    const ref = createRef<HTMLElement>();
    render(<ColophonCard ref={ref} authorName="REF" />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('ASIDE');
  });

  it('merges caller className', () => {
    const { container } = render(
      <ColophonCard className="opacity-50" />,
    );
    expect(container.firstElementChild?.className).toContain('opacity-50');
  });

  it('emits no palette-pinned class', () => {
    const FORBIDDEN =
      /brutalist-|--color-white|--border-color|zinc-|-red-\d|bg-black|text-white|border-white/;
    const { container } = render(
      <ColophonCard
        authorName="AUDIT"
        authorRole="TESTER"
        bio="No hue classes allowed."
      />,
    );

    for (const node of container.querySelectorAll<HTMLElement>('*')) {
      const cls = typeof node.className === 'string' ? node.className : (node.getAttribute('class') ?? '');
      expect(cls, `${node.tagName} pins a palette entry`).not.toMatch(
        FORBIDDEN,
      );
    }
  });
});
