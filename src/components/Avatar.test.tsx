import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

/**
 * The failure path is the point.
 *
 * This rendered a bare `<img src>` with no `onError`, so a URL that 404s showed
 * the browser's broken-image glyph — the one state a fallback exists for, and
 * the one it never reached. Base UI's `Avatar.Image` only renders once the image
 * has loaded, so the fallback covers every other case including the moment
 * before it does.
 */
describe('Avatar', () => {
  it('shows the fallback when there is no src', () => {
    render(<Avatar fallback="RK" />);
    expect(screen.getByText('RK')).toBeDefined();
  });

  it('shows the fallback until the image has loaded, not a broken image', () => {
    render(<Avatar src="https://example.invalid/missing.png" fallback="RK" />);
    expect(screen.getByText('RK')).toBeDefined();
  });

  it('forwards its ref', () => {
    let node: HTMLDivElement | null = null;
    render(<Avatar ref={(n) => { node = n; }} fallback="RK" />);
    expect(node).not.toBeNull();
  });
});
