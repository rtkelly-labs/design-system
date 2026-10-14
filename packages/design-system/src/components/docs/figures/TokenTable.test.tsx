import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../../theme/levels';
import { TokenTable } from './TokenTable';

const muted = LEVELS.sketch.text.muted;

describe('TokenTable', () => {
  it('shows token, after swatch, measures and note in one row', () => {
    render(
      <TokenTable
        label="Text tones"
        measures={['WCAG']}
        rows={[{ token: 'text.muted', after: muted, values: ['6.16:1'], note: 'Measured on sunken.' }]}
      />,
    );
    const table = screen.getByRole('table', { name: 'Text tones' });
    expect(table.querySelectorAll('th[scope="col"]')).toHaveLength(4);
    expect(screen.getByText('text.muted')).toBeTruthy();
    expect(screen.getByText(muted)).toBeTruthy();
    expect(screen.getByText('6.16:1')).toBeTruthy();
    expect(screen.queryByRole('columnheader', { name: 'Before' })).toBeNull();
  });

  it('adds a before column only when some row has one', () => {
    render(<TokenTable rows={[{ token: 'a', before: muted, after: muted }]} />);
    expect(screen.getByRole('columnheader', { name: 'Before' })).toBeTruthy();
  });
});
