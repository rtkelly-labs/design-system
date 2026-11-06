import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DeltaValue, deltaSignificance, deltaTrend } from './DeltaValue';

const text = (ui: React.ReactElement) => render(ui).container.textContent;

describe('DeltaValue', () => {
  it('prints before, after and the signed change', () => {
    expect(text(<DeltaValue before={194} after={198} />)).toBe('194→to198+4');
    expect(text(<DeltaValue before={8418} after={8398} />)).toBe('8,418→to8,398−20');
  });

  it('colours a directed move by which way it went: against is danger, with is success', () => {
    const { container } = render(<DeltaValue before={21} after={24} direction="lower-is-better" />);
    const root = container.firstElementChild!;
    expect(root.getAttribute('data-trend')).toBe('against');
    expect(root.textContent).toContain('▲');
    expect(root.querySelector('[data-slot="delta-value-change"]')!.className).toContain('text-intent-danger');
    expect(root.textContent).toContain('against the preferred direction (lower is better)');
    const better = render(<DeltaValue before={24} after={21} direction="lower-is-better" />).container.firstElementChild!;
    expect(better.querySelector('[data-slot="delta-value-change"]')!.className).toContain('text-intent-success');
  });

  it('never colours an undirected change or one within noise', () => {
    const plain = render(<DeltaValue before={21} after={24} />).container.firstElementChild!;
    expect(plain.innerHTML).not.toMatch(/(?:text|bg|fill)-(?:intent|delta)-/);
    const noise = render(<DeltaValue before={1000} after={1010} direction="lower-is-better" />).container.firstElementChild!;
    expect(noise.getAttribute('data-significance')).toBe('noise');
    expect(noise.innerHTML).not.toMatch(/text-intent-/);
  });

  it('bands relative change into noise, notable and major', () => {
    expect(deltaSignificance(0.01)).toBe('noise');
    expect(deltaSignificance(-0.05)).toBe('notable');
    expect(deltaSignificance(0.25)).toBe('major');
    expect(deltaSignificance(0.05, { noise: 0.1 })).toBe('noise');
    expect(deltaSignificance(undefined)).toBe('notable');
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
