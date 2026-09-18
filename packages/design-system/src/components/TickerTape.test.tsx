import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { TickerTape } from './TickerTape';

describe('TickerTape', () => {
  it('renders title and sequence items', () => {
    render(
      <TickerTape
        title="NEWS // WIRE"
        items={['ITEM 01', 'ITEM 02']}
      />,
    );

    expect(screen.getByText(/NEWS \/\/ WIRE/)).toBeDefined();
    expect(screen.getAllByText('ITEM 01').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ITEM 02').length).toBeGreaterThan(0);
  });

  it('renders endAddon slot', () => {
    render(
      <TickerTape
        items={['SIGNAL']}
        endAddon={<span data-testid="addon">DOCK</span>}
      />,
    );

    expect(screen.getByTestId('addon')).toBeDefined();
  });

  it('applies sticky class when sticky=true', () => {
    const { container } = render(
      <TickerTape items={['STICKY']} sticky />,
    );
    expect(container.firstElementChild?.className).toContain('fixed');
    expect(container.firstElementChild?.className).toContain('top-0');
  });

  it('handles mouse enter and leave without resetting', () => {
    const { container } = render(
      <TickerTape items={['HOVER TEST']} />,
    );
    const root = container.firstElementChild!;
    fireEvent.mouseEnter(root);
    fireEvent.mouseLeave(root);
  });

  it('forwards ref to root container', () => {
    const ref = createRef<HTMLDivElement>();
    render(<TickerTape ref={ref} items={['REF']} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('merges caller className', () => {
    const { container } = render(
      <TickerTape items={['CLASS']} className="opacity-50" />,
    );
    expect(container.firstElementChild?.className).toContain('opacity-50');
  });

  it('emits no palette-pinned class', () => {
    const FORBIDDEN =
      /brutalist-|--color-white|--border-color|zinc-|-red-\d|bg-black|text-white|border-white/;
    const { container } = render(
      <TickerTape
        title="AUDIT"
        items={['ALPHA', 'BETA']}
        endAddon={<span>END</span>}
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
