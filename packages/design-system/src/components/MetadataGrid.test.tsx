import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { MetadataGrid } from './MetadataGrid';

describe('MetadataGrid', () => {
  it('renders all 4 editorial metadata cells', () => {
    render(
      <MetadataGrid
        published="2026-09-16"
        readTime="10 MIN READ"
        series={{ name: 'DISTRIBUTED ARCHITECTURES', part: 2, totalParts: 4 }}
        tags={['kafka', 'storage']}
      />,
    );

    expect(screen.getByText('[ PUBLISHED ]')).toBeDefined();
    expect(screen.getByText('2026-09-16')).toBeDefined();
    expect(screen.getByText('[ READ TIME ]')).toBeDefined();
    expect(screen.getByText('10 MIN READ')).toBeDefined();
    expect(screen.getByText('[ SERIES TRACK ]')).toBeDefined();
    expect(screen.getByText(/DISTRIBUTED ARCHITECTURES/)).toBeDefined();
    expect(screen.getByText('[ TOPICS ]')).toBeDefined();
    expect(screen.getByText('#KAFKA')).toBeDefined();
  });

  it('renders standalone label when no series is provided', () => {
    render(
      <MetadataGrid
        published="2026-09-16"
        readTime="5 MIN"
      />,
    );

    expect(screen.getByText('STANDALONE')).toBeDefined();
  });

  it('renders arbitrary custom items when provided', () => {
    render(
      <MetadataGrid
        items={[
          { label: 'STATUS', value: 'PRODUCTION' },
          { label: 'REVISION', value: 'v2.4.1' },
        ]}
      />,
    );

    expect(screen.getByText('[ STATUS ]')).toBeDefined();
    expect(screen.getByText('PRODUCTION')).toBeDefined();
    expect(screen.getByText('[ REVISION ]')).toBeDefined();
    expect(screen.getByText('v2.4.1')).toBeDefined();
  });

  it('forwards ref to root grid container', () => {
    const ref = createRef<HTMLDivElement>();
    render(<MetadataGrid ref={ref} published="2026" />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges caller className', () => {
    const { container } = render(
      <MetadataGrid published="2026" className="opacity-50" />,
    );
    expect(container.firstElementChild?.className).toContain('opacity-50');
  });

  it('emits no palette-pinned class', () => {
    const FORBIDDEN =
      /brutalist-|--color-white|--border-color|zinc-|-red-\d|bg-black|text-white|border-white/;
    const { container } = render(
      <MetadataGrid
        published="2026-09-16"
        readTime="12 MIN"
        series={{ name: 'SYSTEMS' }}
        tags={['design', 'tokens']}
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
