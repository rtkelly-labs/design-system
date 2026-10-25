import { describe, expect, it } from 'vitest';
import {
  centreViewportRows,
  clampViewportRows,
  clampViewportWindow,
  fitViewportWindow,
  panViewportRows,
  panViewportWindow,
  sameViewportWindow,
  zoomViewportRows,
  zoomViewportWindow,
} from './viewport';

const close = (window: { start: number; end: number }, start: number, end: number) => {
  expect(window.start).toBeCloseTo(start);
  expect(window.end).toBeCloseTo(end);
};

describe('window', () => {
  it('clamps, slides at an edge and honours a minimum width', () => {
    close(clampViewportWindow({ start: 0.9, end: 1.2 }), 0.7, 1);
    close(clampViewportWindow({ start: 0.5, end: 0.5 }, 0.1), 0.5, 0.6);
    close(clampViewportWindow({ start: Number.NaN, end: 0.4 }), 0, 0.4);
  });

  it('zooms about an anchor and pans without changing width', () => {
    close(zoomViewportWindow({ start: 0.2, end: 0.6 }, 2, 0.2), 0.2, 0.4);
    close(zoomViewportWindow({ start: 0.2, end: 0.6 }, 2, 0.6), 0.4, 0.6);
    close(panViewportWindow({ start: 0.2, end: 0.6 }, -0.5), 0, 0.4);
  });

  it('fits a range with padding, clamped to the whole', () => {
    close(fitViewportWindow(0.4, 0.6, 0.05), 0.39, 0.61);
    close(fitViewportWindow(0.9, 1, 0.5), 0.8, 1);
    expect(sameViewportWindow(fitViewportWindow(0, 1), { start: 0, end: 1 })).toBe(true);
  });
});

describe('rows', () => {
  it('clamps, zooms, pans and centres', () => {
    expect(clampViewportRows({ min: 8, max: 14 }, 10)).toEqual({ min: 4, max: 10 });
    expect(zoomViewportRows({ min: 0, max: 9 }, 2, 20)).toEqual({ min: 3, max: 7 });
    expect(panViewportRows({ min: 0, max: 4 }, 3, 20)).toEqual({ min: 3, max: 7 });
    expect(centreViewportRows({ min: 0, max: 4 }, 10, 20)).toEqual({ min: 8, max: 12 });
    expect(centreViewportRows({ min: 0, max: 4 }, 19, 20)).toEqual({ min: 16, max: 20 });
  });
});
