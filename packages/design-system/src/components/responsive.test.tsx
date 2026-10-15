import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';
import { Divider } from './Divider';
import { StatCard } from './StatCard';
import { Table, TableBody, TableCell, TableRow } from './Table';
import { Tabs, TabsList, TabsPanel, TabsTab } from './Tabs';
import { TickerTape } from './TickerTape';
import { PricingGrid, PricingTier } from './marketing/PricingGrid';
import { FeatureGrid } from './marketing/FeatureGrid';
import { Slide } from './slides/Slide';
import { SlideDeck } from './slides/SlideDeck';

/**
 * Narrow-width and wide-width repairs from the applied evaluation (AUD-F28 to
 * F34, G04 to G16), as the class contracts jsdom can see. jsdom has no layout,
 * so what is asserted is the mechanism each repair stands on; the pixels are
 * measured in a browser against the built Storybook.
 */

describe('Divider fills its container (AUD-F31)', () => {
  it('draws caps at the ends and repeats the unit between them, far past one string', () => {
    const { container } = render(<Divider variant="terminal" />);
    const divider = container.querySelector('[data-slot="divider"]') as HTMLElement;
    const [start, fill, end] = Array.from(divider.children);
    expect(start?.textContent).toBe('//');
    expect(end?.textContent).toBe('//');
    expect(fill?.textContent?.length).toBeGreaterThanOrEqual(480);
    expect(fill?.className).toContain('flex-1');
    expect(divider.getAttribute('aria-hidden')).toBe('true');
  });

  it('repeats a custom pattern as the unit, with no caps', () => {
    const { container } = render(<Divider pattern="-=" />);
    const divider = container.querySelector('[data-slot="divider"]') as HTMLElement;
    expect(divider.children).toHaveLength(1);
    expect(divider.textContent?.startsWith('-=-=')).toBe(true);
    expect(divider.textContent?.length).toBeGreaterThanOrEqual(480);
  });
});

describe('Table overflow cue (AUD-F29)', () => {
  const wide = () =>
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

  const scroller = () => document.querySelector('[data-slot="table-container"]') as HTMLElement;

  it('marks no side while the table fits', () => {
    wide();
    expect(scroller().hasAttribute('data-more-right')).toBe(false);
    expect(scroller().hasAttribute('data-more-left')).toBe(false);
  });

  it('marks the right edge while columns are hidden there, and the left once scrolled', () => {
    wide();
    const el = scroller();
    Object.defineProperty(el, 'scrollWidth', { configurable: true, value: 900 });
    Object.defineProperty(el, 'clientWidth', { configurable: true, value: 300 });
    act(() => {
      fireEvent.scroll(el);
    });
    expect(el.hasAttribute('data-more-right')).toBe(true);
    expect(el.hasAttribute('data-more-left')).toBe(false);

    el.scrollLeft = 200;
    act(() => {
      fireEvent.scroll(el);
    });
    expect(el.hasAttribute('data-more-left')).toBe(true);
    expect(el.hasAttribute('data-more-right')).toBe(true);

    el.scrollLeft = 600;
    act(() => {
      fireEvent.scroll(el);
    });
    expect(el.hasAttribute('data-more-right')).toBe(false);
    expect(el.hasAttribute('data-more-left')).toBe(true);
  });

  it('draws the cue as a hard rule, not a fade', () => {
    wide();
    const cls = scroller().className;
    expect(cls).toContain('data-[more-right]:shadow-[4px_0_0_0_var(--ds-border-strong)]');
    expect(cls).not.toMatch(/gradient/);
  });
});

describe('PricingGrid holds one column until 900px (AUD-F30 / G06)', () => {
  it('three tiers go three-up from 900px, not from md', () => {
    render(
      <PricingGrid title="Pricing">
        <PricingTier name="A" price="$0" />
        <PricingTier name="B" price="$1" />
        <PricingTier name="C" price="$2" />
      </PricingGrid>,
    );
    const grid = document.querySelector('[data-slot="pricing-grid-items"]') as HTMLElement;
    expect(grid.className).toContain('min-[900px]:grid-cols-3');
    expect(grid.className).not.toContain('md:grid-cols-3');
  });

  it('leaves FeatureGrid three-up at md', () => {
    render(<FeatureGrid title="Features" />);
    const grid = document.querySelector('[data-slot="feature-grid-items"]') as HTMLElement;
    expect(grid.className).toContain('md:grid-cols-3');
  });

  it('keeps a bracketed action on one line', () => {
    render(<Button bracketed>START FREE</Button>);
    const label = screen.getByText('START FREE');
    expect(label.className).toContain('whitespace-nowrap');
  });

  it('hangs the badge off the card instead of setting it in flow, so prices align (G07)', () => {
    render(<PricingTier name="Team" price="$12" badge="POPULAR" />);
    const badge = document.querySelector('[data-slot="pricing-tier-badge"]') as HTMLElement;
    expect(badge.className).toContain('absolute');
  });
});

describe('StatCard wraps instead of clipping (G04 / G05)', () => {
  it('lets the value row wrap, and the value and card shrink', () => {
    const { container } = render(<StatCard title="Cash" value="+$4,280.00" change="+12.4%" />);
    const row = container.querySelector('[data-slot="statcard-value-row"]') as HTMLElement;
    expect(row.className).toContain('flex-wrap');
    expect(row.className).toContain('min-w-0');
    const value = container.querySelector('[data-slot="statcard-value"]') as HTMLElement;
    expect(value.className).toContain('clamp(');
    expect(value.className).toContain('min-w-0');
    expect(container.querySelector('[data-slot="statcard-change"]')?.className).toContain('shrink-0');
    expect(container.querySelector('[data-slot="stat-card"]')?.className).toContain('min-w-0');
  });
});

describe('Tabs vertical stretches the panel (AUD-F34)', () => {
  it('aligns the root to stretch', () => {
    render(
      <Tabs defaultValue="a" orientation="vertical">
        <TabsList label="x">
          <TabsTab value="a">A</TabsTab>
        </TabsList>
        <TabsPanel value="a">p</TabsPanel>
      </Tabs>,
    );
    const root = document.querySelector('[data-slot="tabs"]') as HTMLElement;
    expect(root.className).toContain('items-stretch');
    expect(root.className).not.toContain('items-start');
  });
});

describe('TickerTape under reduced motion is a static list (G16)', () => {
  it('stacks the items, drops the looping duplicate and wraps the title off the list', () => {
    const { container } = render(<TickerTape title="T" items={['ONE', 'TWO']} />);
    const track = container.querySelector('[data-slot="ticker-tape-track"]') as HTMLElement;
    expect(track.className).toContain('motion-reduce:whitespace-normal');
    const [primary, duplicate] = Array.from(track.children) as HTMLElement[];
    expect(primary?.className).toContain('motion-reduce:flex-col');
    expect(duplicate?.className).toContain('motion-reduce:hidden');
    expect(container.querySelector('[data-slot="ticker-tape"]')?.className).toContain('motion-reduce:flex-wrap');
  });
});

describe('SlideDeck at narrow widths (G12)', () => {
  const deck = () =>
    render(
      <SlideDeck>
        <Slide title="ONE">body</Slide>
        <Slide title="TWO">body</Slide>
      </SlideDeck>,
    );

  it('is a size container, and the stage keeps its ratio as a floor under 42rem', () => {
    deck();
    const root = document.querySelector('[data-slot="slide-deck"]') as HTMLElement;
    expect(root.className).toContain('@container');
    const stage = root.firstElementChild as HTMLElement;
    expect(stage.className).toContain('min-h-[calc(100cqw*var(--deck-inverse))]');
    expect(stage.className).toContain('@2xl:[aspect-ratio:var(--deck-ratio)]');
    expect(stage.style.getPropertyValue('--deck-ratio')).toBe('16 / 9');
    expect(stage.style.getPropertyValue('--deck-inverse')).toBe('0.5625');
  });

  it('stacks the control bar under 32rem and wraps the controls', () => {
    deck();
    const root = document.querySelector('[data-slot="slide-deck"]') as HTMLElement;
    const bar = root.children[1] as HTMLElement;
    expect(bar.className).toContain('flex-col');
    expect(bar.className).toContain('@lg:flex-row');
    expect(bar.lastElementChild?.className).toContain('flex-wrap');
  });

  it('clamps the slide title and padding to the viewport', () => {
    deck();
    const slide = document.querySelector('[data-slot="slide"]') as HTMLElement;
    expect(slide.style.padding).toContain('clamp(');
    const h2 = slide.querySelector('h2') as HTMLElement;
    expect(h2.style.fontSize).toContain('clamp(');
  });
});
