import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Decision, Option } from './Decision';

describe('Decision', () => {
  it('reads options from MDX children and marks the pick', () => {
    render(
      <Decision question="How strict on dark?" recommendation="Take 5.5.">
        <Option title="4.5:1" cost="no editor headroom">Keeps every colour.</Option>
        <Option title="5.5:1" picked cost="three invisible moves">Buys the editor.</Option>
      </Decision>,
    );
    const region = screen.getByRole('group', { name: 'How strict on dark?' });
    expect(region.querySelectorAll('[data-slot="decision-option"]')).toHaveLength(2);
    expect(screen.getByText('Recommended')).toBeTruthy();
    expect(screen.getByText('Take 5.5.')).toBeTruthy();
    expect(screen.getByText('three invisible moves')).toBeTruthy();
  });

  it('accepts options as data', () => {
    render(<Decision question="Q" options={[{ title: 'A' }, { title: 'B' }]} />);
    expect(screen.getByText('A')).toBeTruthy();
  });
});
