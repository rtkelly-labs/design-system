import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';
import { BarChart } from './BarChart';
import { DocsHeader } from './docs/DocsHeader';
import { A11yPreferencesProvider } from './A11yPreferencesProvider';
import { SERIES_LETTERS, SERIES_SHAPES, SeriesLegend, SeriesMark } from './SeriesMark';

describe('SeriesMark', () => {
  it('carries the colour chip, and the shape and letter in the markup behind a slot the stylesheet reveals', () => {
    const { container } = render(<SeriesMark series={3} />);
    const mark = container.querySelector('[data-slot="series-mark"]')!;
    expect(mark.getAttribute('aria-hidden')).toBe('true');
    const chip = mark.querySelector('span > span') as HTMLElement;
    expect(chip.style.background).toBe('var(--ds-series-3)');
    const glyph = mark.querySelector('[data-slot="series-glyph"]')!;
    expect(glyph.textContent).toBe(SERIES_LETTERS[2]);
    expect(glyph.querySelector('svg')).not.toBeNull();
  });

  it('has a different shape and letter for each of the six', () => {
    expect(new Set(SERIES_SHAPES).size).toBe(6);
    expect(new Set(SERIES_LETTERS).size).toBe(6);
  });

  it('takes a letter override and can drop the chip', () => {
    const { container } = render(<SeriesMark series={1} letter="W" swatch={false} />);
    expect(container.querySelector('[data-slot="series-glyph"]')!.textContent).toBe('W');
    expect(container.querySelector('[data-slot="series-mark"] > span[style]')).toBeNull();
  });
});

describe('SeriesLegend', () => {
  it('always names every series in text, whatever the preference', () => {
    render(
      <SeriesLegend
        items={[
          { label: 'Work', series: 1 },
          { label: 'Home', series: 2 },
        ]}
      />,
    );
    expect(screen.getByText('Work')).toBeTruthy();
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});

describe('BarChart series', () => {
  const data = [
    { label: 'Q1', value: 40, series: 1 as const },
    { label: 'Q2', value: 70, series: 4 as const },
  ];

  it('fills a bar from the series group and draws a glyph for it', () => {
    const { container } = render(<BarChart data={data} />);
    const fills = [...container.querySelectorAll('rect')].map((r) => r.getAttribute('fill'));
    expect(fills).toContain('var(--ds-series-1)');
    expect(fills).toContain('var(--ds-series-4)');
    const glyphs = container.querySelectorAll('[data-slot="series-glyph"]');
    expect(glyphs).toHaveLength(2);
    expect([...glyphs].map((g) => g.textContent)).toEqual(['A', 'D']);
  });

  it('keeps the category labels on the axis, so colour is never the only cue (WCAG 1.4.1)', () => {
    const { container } = render(<BarChart data={data} />);
    const text = [...container.querySelectorAll('text')].map((t) => t.textContent);
    expect(text).toContain('Q1');
    expect(text).toContain('Q2');
  });

  it('draws no glyph for a bar with no series', () => {
    const { container } = render(<BarChart data={[{ label: 'A', value: 3 }]} />);
    expect(container.querySelector('[data-slot="series-glyph"]')).toBeNull();
  });
});

describe('Badge intent glyph', () => {
  it('carries an icon for an intent, behind the slot the stylesheet reveals, and keeps its text', () => {
    const { container } = render(<Badge accent="danger">FAILING</Badge>);
    expect(container.querySelector('[data-slot="intent-glyph"] svg')).not.toBeNull();
    expect(screen.getByText('FAILING')).toBeTruthy();
  });

  it('has none for an emphasis accent', () => {
    const { container } = render(<Badge accent="primary">NEW</Badge>);
    expect(container.querySelector('[data-slot="intent-glyph"]')).toBeNull();
  });
});

describe('DocsHeader and the accessibility menu', () => {
  it('shows the menu beside the level picker when a provider is mounted', () => {
    render(
      <A11yPreferencesProvider persist={false}>
        <DocsHeader title="Docs" />
      </A11yPreferencesProvider>,
    );
    expect(screen.getByRole('button', { name: 'Accessibility preferences' })).toBeTruthy();
  });

  it('renders without it, and without throwing, when there is no provider', () => {
    render(<DocsHeader title="Docs" />);
    expect(screen.queryByRole('button', { name: 'Accessibility preferences' })).toBeNull();
  });
});
