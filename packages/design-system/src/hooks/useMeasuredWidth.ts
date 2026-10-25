'use client';

import { useLayoutEffect, useState } from 'react';

/**
 * Track an element's content width, in whole pixels, for a chart that draws
 * to its container. Returns a callback ref and the width — `fallback` until
 * the element reports one (jsdom, a server render).
 *
 * Measured in a layout effect, so the first paint is already at the real
 * width, and on every `ResizeObserver` report with no debounce. A debounced
 * measurement left a window in which a screenshot caught the chart still at
 * `fallback`: a `fullPage` capture resizes the viewport, and whether the
 * capture beat the debounced re-render varied from run to run.
 */
export function useMeasuredWidth<T extends Element = HTMLDivElement>(fallback: number): [(node: T | null) => void, number] {
  const [node, setNode] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!node) return undefined;
    const measure = () => setWidth(Math.floor(node.getBoundingClientRect().width));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return [setNode, width > 0 ? width : fallback];
}
