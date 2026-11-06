import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocsHeader } from './DocsHeader';
import { ThemeProvider } from '../ThemeProvider';

/**
 * `DocsHeader` destructured `useTheme()`, which throws without a provider — and
 * a docs header is chrome that a consumer theming with the `data-theme`
 * attribute alone would reasonably render. ADR 0004 makes that an explicitly
 * supported arrangement: developer themes consume colour only, and the host owns
 * the geometry and the clock. So the whole page came down rather than the level
 * control being absent.
 *
 * The distinction the fix turns on is *requires* versus *adapts*. A component
 * that cannot do its job without the level should keep the strict hook and fail
 * loudly. This one reads the level to render one button, so it adapts: no
 * provider, no button, everything else renders.
 */
describe('DocsHeader without a ThemeProvider', () => {
  it('renders rather than throwing', () => {
    expect(() => render(<DocsHeader title="Docs" />)).not.toThrow();
    expect(screen.getByRole('banner')).toBeDefined();
  });

  it('omits the level control, because there is no level to cycle', () => {
    render(<DocsHeader title="Docs" />);
    expect(screen.queryByLabelText(/Switch theme level/)).toBeNull();
  });
});

describe('DocsHeader within a ThemeProvider', () => {
  it('renders the level control', () => {
    render(
      <ThemeProvider persist={false}>
        <DocsHeader title="Docs" />
      </ThemeProvider>
    );
    expect(screen.getByLabelText(/Switch theme level/)).toBeDefined();
  });
});
