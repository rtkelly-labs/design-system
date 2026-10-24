import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProvenanceStrip } from './ProvenanceStrip';

describe('ProvenanceStrip', () => {
  it('pairs each label with its value and note', () => {
    render(
      <ProvenanceStrip
        items={[
          { label: 'Baseline role', value: 'merge-base', note: 'what did this change?' },
          { label: 'Baseline commit', value: '216f6fc28cec75077f5b8fa90cd3d7055e81db7b' },
        ]}
      />,
    );
    const strip = screen.getByRole('region', { name: 'Provenance' });
    expect(strip.querySelectorAll('dt')).toHaveLength(2);
    expect(screen.getByText('what did this change?')).toBeTruthy();
  });
});
