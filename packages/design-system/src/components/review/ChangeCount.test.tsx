import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChangeCount } from './ChangeCount';

describe('ChangeCount', () => {
  it('draws the signs in the delta roles and speaks the words', () => {
    render(<ChangeCount added={77} removed={50} noun={['line', 'lines']} />);
    expect(screen.getByText('+77').className).toContain('text-delta-added');
    expect(screen.getByText('−50').className).toContain('text-delta-removed');
    expect(screen.getByText('77 lines added, 50 lines removed')).toBeTruthy();
  });

  it('prints moves only when counted', () => {
    const { container, rerender } = render(<ChangeCount added={1} removed={0} />);
    expect(container.textContent).not.toContain('→');
    rerender(<ChangeCount added={1} removed={0} moved={2} />);
    expect(screen.getByText('→2').className).toContain('text-delta-moved');
  });

  it('speaks a singular count in the singular', () => {
    render(<ChangeCount added={1} removed={2} noun={['line', 'lines']} />);
    expect(screen.getByText('1 line added, 2 lines removed')).toBeTruthy();
  });
});
