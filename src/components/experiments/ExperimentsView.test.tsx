import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExperimentsView } from './ExperimentsView';
import type { ExperimentItem } from './ExperimentsView';
import { accentVar } from '../../lib/theme';

/**
 * Status used to be coloured by `status === 'active' ? 'cyan' : 'yellow'`,
 * which rendered `archived` and `experimental` identically and reached for
 * emphasis roles to express meaning (#96).
 *
 * `Badge` sets its accent as an inline `color`, so the assertion reads the
 * resolved variable rather than a class string — every accent produces the
 * same classes there, which means a class assertion could not tell a working
 * mapping from a broken one.
 */
const CATALOGUE: ExperimentItem[] = [
  { id: 'a', name: 'Alpha', description: 'Live', status: 'active', componentCount: 1 },
  { id: 'b', name: 'Beta', description: 'In progress', status: 'experimental', componentCount: 2 },
  { id: 'c', name: 'Gamma', description: 'Shelved', status: 'archived', componentCount: 3 },
];

function badgeColour(label: string) {
  return (screen.getByText(label) as HTMLElement).style.color;
}

describe('ExperimentsView status badges', () => {
  it('maps each status to its own role', () => {
    render(<ExperimentsView experiments={CATALOGUE} />);
    expect(badgeColour('ACTIVE')).toBe(accentVar('success'));
    expect(badgeColour('EXPERIMENTAL')).toBe(accentVar('info'));
    expect(badgeColour('ARCHIVED')).toBe(accentVar('quiet'));
  });

  it('gives the three states three distinct colours', () => {
    render(<ExperimentsView experiments={CATALOGUE} />);
    const colours = ['ACTIVE', 'EXPERIMENTAL', 'ARCHIVED'].map(badgeColour);
    expect(new Set(colours).size).toBe(3);
  });

  it('no longer renders a live experiment through an emphasis role', () => {
    render(<ExperimentsView experiments={CATALOGUE} />);
    expect(badgeColour('ACTIVE')).not.toBe(accentVar('primary'));
  });
});
