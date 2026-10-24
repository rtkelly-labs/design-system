import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BracketText } from './BracketText';

describe('BracketText', () => {
  it('joins each bracket to its neighbouring word with a no-break space', () => {
    const { container } = render(<BracketText>HIGH-PERFORMANCE PLATFORM</BracketText>);
    expect(container.textContent).toBe('[ HIGH-PERFORMANCE PLATFORM ]');
  });

  it('hides the brackets from assistive technology', () => {
    const { container } = render(<BracketText>LATEST</BracketText>);
    const hidden = [...container.querySelectorAll('[aria-hidden="true"]')].map((el) => el.textContent);
    expect(hidden).toEqual(['[', ']']);
  });
});
