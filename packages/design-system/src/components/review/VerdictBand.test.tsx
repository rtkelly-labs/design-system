import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { VerdictBand } from './VerdictBand';

describe('VerdictBand', () => {
  it('announces the outcome word with its line', () => {
    render(<VerdictBand outcome="fail" title="Two budgets exceeded.">Complexity policy v3.</VerdictBand>);
    const band = screen.getByRole('status');
    expect(band.getAttribute('data-outcome')).toBe('fail');
    expect(band.textContent).toContain('fail');
    expect(band.textContent).toContain('Two budgets exceeded.');
    expect(screen.getByText('fail').parentElement!.className).toContain('text-intent-danger');
  });

  it('states the absence of a verdict instead of omitting the band', () => {
    render(<VerdictBand outcome="none" title="Delta only. No Assessment was supplied." />);
    const word = screen.getByText('no verdict').parentElement!;
    expect(word.className).toContain('border-dashed');
    expect(word.className).not.toMatch(/text-intent-/);
  });

  it('omits the context line when none is given', () => {
    const { container } = render(<VerdictBand outcome="pass" title="All budgets held." />);
    expect(container.querySelector('[data-slot="verdict-band-context"]')).toBeNull();
  });
});
