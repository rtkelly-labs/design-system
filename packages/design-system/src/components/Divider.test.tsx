import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DIVIDER_MARKS, Divider } from './Divider';

describe('Divider', () => {
  it('draws a start cap, a repeating fill and an end cap', () => {
    const { container } = render(<Divider variant="terminal" />);
    const parts = [...container.querySelector('[data-slot="divider"]')!.children];
    expect(parts.map((p) => p.textContent?.slice(0, 2))).toEqual(['//', '==', '//']);
    expect(parts[1]!.getAttribute('data-slot')).toBe('divider-fill');
  });

  it('sizes the fill in whole units with CSS round(), so no glyph is cut', () => {
    const { container } = render(<Divider variant="pencil" />);
    const fill = container.querySelector('[data-slot="divider-fill"]')!;
    expect(fill.className).toContain('round(down');
    expect(fill.textContent!.startsWith(DIVIDER_MARKS.light.fill)).toBe(true);
  });

  it('keeps an explicit pattern as given', () => {
    const { container } = render(<Divider pattern="* * *" />);
    expect(container.querySelector('[data-slot="divider"]')!.textContent).toBe('* * *');
    expect(container.querySelector('[data-slot="divider-fill"]')).toBeNull();
  });

  it('is decoration', () => {
    const { container } = render(<Divider />);
    expect(container.querySelector('[data-slot="divider"]')!.getAttribute('aria-hidden')).toBe('true');
  });
});
