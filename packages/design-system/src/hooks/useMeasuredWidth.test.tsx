import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMeasuredWidth } from './useMeasuredWidth';

function Probe({ onRender }: { onRender: (width: number) => void }) {
  const [ref, width] = useMeasuredWidth(640);
  onRender(width);
  return <div ref={ref} />;
}

describe('useMeasuredWidth', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reports the fallback until the element has a width', () => {
    const widths: number[] = [];
    render(<Probe onRender={(width) => widths.push(width)} />);
    expect(widths.at(-1)).toBe(640);
  });

  it('measures before paint and follows every resize report, undebounced', () => {
    let report: () => void = () => {};
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: () => void) { report = callback; }
      observe() {}
      disconnect() {}
    });
    let width = 812.6;
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ width }) as DOMRect);
    const widths: number[] = [];
    render(<Probe onRender={(next) => widths.push(next)} />);
    // The layout effect measured synchronously inside render(): no timer had to run.
    expect(widths.at(-1)).toBe(812);
    width = 400;
    act(() => report());
    expect(widths.at(-1)).toBe(400);
    spy.mockRestore();
  });
});
