import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeltaValue, deltaTrend } from './DeltaValue';

const text = (ui: React.ReactElement) => render(ui).container.textContent;

describe('DeltaValue', () => {
  it('prints before, after and the signed change', () => {
    expect(text(<DeltaValue before={194} after={198} />)).toBe('194→to198+4');
    expect(text(<DeltaValue before={8418} after={8398} />)).toBe('8,418→to8,398−20');
  });

  it('marks a move against the preferred direction, without colour', () => {
    const { container } = render(<DeltaValue before={21} after={24} direction="lower-is-better" />);
    const root = container.firstElementChild!;
    expect(root.getAttribute('data-trend')).toBe('against');
    expect(root.textContent).toContain('▲');
    expect(root.innerHTML).not.toMatch(/(?:text|bg|fill)-(?:intent|delta)-/);
    expect(root.textContent).toContain('against the preferred direction (lower is better)');
  });

  it('reads the trend from the declared direction', () => {
    expect(deltaTrend(5, 'lower-is-better')).toBe('against');
    expect(deltaTrend(-5, 'lower-is-better')).toBe('with');
    expect(deltaTrend(5, 'higher-is-better')).toBe('with');
    expect(deltaTrend(5)).toBeUndefined();
    expect(deltaTrend(0, 'lower-is-better')).toBeUndefined();
  });

  it('says unchanged, new and gone in words', () => {
    expect(text(<DeltaValue before={88} after={88} />)).toBe('88=unchanged');
    expect(text(<DeltaValue after={8} />)).toBe('new8');
    expect(text(<DeltaValue before={5} />)).toBe('5gone');
    expect(text(<DeltaValue />)).toBe('—not measured');
  });

  it('refuses a relative change from zero', () => {
    expect(text(<DeltaValue before={0} after={3} relative />)).toContain('(n/a)');
    expect(text(<DeltaValue before={200} after={210} relative />)).toContain('(+5%)');
  });

  it('prints the unit on both sides', () => {
    expect(text(<DeltaValue before={31} after={33} unit="kB" />)).toBe('31 kB→to33 kB+2');
  });
});
