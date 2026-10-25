import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Minimap, type MinimapMark } from './Minimap';

const marks: MinimapMark[] = [
  { x0: 0, x1: 1, row: 0, tone: 'muted' },
  { x0: 0.1, x1: 0.4, row: 1, tone: 'danger' },
  { x0: 0.5, x1: 0.5001, row: 2, tone: 'accent' },
];

describe('Minimap', () => {
  it('is a slider whose value is the window, and forwards its ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Minimap ref={ref} marks={marks} rows={3} window={{ start: 0.2, end: 0.5 }} rowWindow={{ min: 1, max: 2 }} />);
    const slider = screen.getByRole('slider', { name: 'Overview' });
    expect(ref.current).toBe(slider);
    expect(slider.getAttribute('data-slot')).toBe('minimap');
    expect(slider.getAttribute('aria-valuenow')).toBe('20');
    expect(slider.getAttribute('aria-valuetext')).toBe('Showing 20% to 50% across, rows 2 to 3 of 3');
  });

  it('renders statically: the marks and the window, with no script', () => {
    const html = renderToStaticMarkup(<Minimap marks={marks} rows={3} window={{ start: 0.2, end: 0.5 }} markStyle="line" />);
    expect(html).toContain('class="fill-intent-danger"');
    expect(html).toMatch(/data-slot="minimap-window" x="20%"[^>]*width="30(\.\d+)?%"/);
    // A line too short to see still gets a pixel at the assumed width.
    expect(html).toMatch(/x="50%"[^>]*width="0\.10416/);
  });

  it('pans with the arrow keys, rows following the drawing order', () => {
    const onWindowChange = vi.fn();
    render(<Minimap marks={marks} rows={10} window={{ start: 0.2, end: 0.4 }} rowWindow={{ min: 2, max: 4 }} rowOrder="bottom-up" onWindowChange={onWindowChange} />);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onWindowChange.mock.lastCall?.[0].start).toBeCloseTo(0.22);
    fireEvent.keyDown(slider, { key: 'ArrowLeft', shiftKey: true });
    expect(onWindowChange.mock.lastCall?.[0].start).toBeCloseTo(0);
    fireEvent.keyDown(slider, { key: 'ArrowUp' });
    expect(onWindowChange.mock.lastCall?.[1]).toEqual({ min: 3, max: 5 });
    fireEvent.keyDown(slider, { key: 'End' });
    expect(onWindowChange.mock.lastCall?.[0].end).toBeCloseTo(1);
  });
});
