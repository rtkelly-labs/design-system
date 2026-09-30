import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { TrackCard } from './TrackCard';

describe('TrackCard', () => {
  const items = [
    {
      id: '1',
      number: '01',
      title: 'Segment Allocation',
      duration: '10 min',
      status: 'completed' as const,
      href: '/milestone/1',
    },
    {
      id: '2',
      number: '02',
      title: 'Memory Mapped Indices',
      duration: '15 min',
      status: 'current' as const,
      summary: 'Virtual memory pages and sparse binary search.',
    },
    {
      id: '3',
      number: '03',
      title: 'Zero-Copy Transfers',
      duration: '20 min',
      status: 'upcoming' as const,
    },
  ];

  it('renders track header, progress percentage, and description', () => {
    render(
      <TrackCard
        trackNumber="01"
        title="STORAGE ENGINE"
        description="Append-only log architecture."
        items={items}
      />,
    );

    expect(screen.getByText('TRACK 01')).toBeDefined();
    expect(screen.getByText(/\/\/ STORAGE ENGINE/)).toBeDefined();
    expect(screen.getByText(/1\/3 COMPLETED \(33%\)/)).toBeDefined();
    expect(screen.getByText('Append-only log architecture.')).toBeDefined();
  });

  it('renders each milestone with status markers', () => {
    render(
      <TrackCard
        trackNumber="02"
        title="TRACK TWO"
        items={items}
      />,
    );

    expect(screen.getByText('Segment Allocation')).toBeDefined();
    expect(screen.getByText('Memory Mapped Indices')).toBeDefined();
    expect(screen.getByText('ACTIVE')).toBeDefined();
    expect(screen.getAllByText('COMING SOON').length).toBeGreaterThan(0);
  });

  it('renders anchor link for items with href', () => {
    render(
      <TrackCard
        trackNumber="01"
        title="LINKS"
        items={items}
      />,
    );

    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('/milestone/1');
  });

  it('forwards ref to root card container', () => {
    const ref = createRef<HTMLDivElement>();
    render(<TrackCard ref={ref} trackNumber="01" title="REF" items={items} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges caller className', () => {
    const { container } = render(
      <TrackCard
        trackNumber="01"
        title="CLASS"
        items={items}
        className="opacity-50"
      />,
    );
    expect(container.firstElementChild?.className).toContain('opacity-50');
  });

  it('emits no palette-pinned class', () => {
    const FORBIDDEN =
      /brutalist-|--color-white|--border-color|zinc-|-red-\d|bg-black|text-white|border-white/;
    const { container } = render(
      <TrackCard
        trackNumber="01"
        title="AUDIT"
        items={items}
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
