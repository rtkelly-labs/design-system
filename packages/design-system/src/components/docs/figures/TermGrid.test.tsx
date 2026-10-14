import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Term, TermGrid } from './TermGrid';

describe('TermGrid', () => {
  it('renders each term as a definition with its scale line', () => {
    render(
      <TermGrid label="Four words">
        <Term term="Chroma" scale="0 = grey · 0.3 = neon">How colourful.</Term>
        <Term term="Contrast ratio" scale="4.5:1 = AA">Whether text reads.</Term>
      </TermGrid>,
    );
    const list = screen.getByRole('group', { name: 'Four words' });
    expect(list.querySelectorAll('dt')).toHaveLength(2);
    expect(screen.getByText('0 = grey · 0.3 = neon')).toBeTruthy();
  });
});
