import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusMark } from './StatusMark';
import { STATUS_APPEARANCE } from './vocabulary';

describe('StatusMark', () => {
  it('prints the word and hides the glyph from assistive technology', () => {
    render(<StatusMark vocabulary="outcome" status="needs-review" />);
    const mark = screen.getByText('needs review').parentElement!;
    expect(mark.getAttribute('data-status')).toBe('needs-review');
    expect(mark.querySelector('[aria-hidden="true"]')?.textContent).toBe('?');
    expect(mark.className).toContain('text-intent-info');
  });

  it('never colours a comparison result as a verdict', () => {
    render(<StatusMark vocabulary="delta" status="changed" />);
    const mark = screen.getByText('changed').parentElement!;
    expect(mark.className).not.toMatch(/text-intent-/);
  });

  it('draws could-not-tell states dashed and muted', () => {
    render(<StatusMark vocabulary="trust" status="missing" />);
    const mark = screen.getByText('missing').parentElement!;
    expect(mark.className).toContain('border-dashed');
    expect(mark.className).toContain('text-content-muted');
  });

  it('keeps the glyph and colour when the word is translated', () => {
    render(<StatusMark vocabulary="outcome" status="fail" label="échec" />);
    const mark = screen.getByText('échec').parentElement!;
    expect(mark.className).toContain('text-intent-danger');
  });

  it('gives every status in every vocabulary a distinct glyph-and-word pair', () => {
    for (const table of Object.values(STATUS_APPEARANCE)) {
      const pairs = Object.values(table).map((a) => `${a.glyph} ${a.word}`);
      expect(new Set(pairs).size).toBe(pairs.length);
    }
  });
});
