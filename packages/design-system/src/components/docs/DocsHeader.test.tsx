import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocsHeader } from './DocsHeader';
import { ThemeProvider } from '../ThemeProvider';
import { LEVELS, THEME_LEVELS } from '../../theme/levels';

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

  it('omits the level control, because there is no level to choose', () => {
    render(<DocsHeader title="Docs" />);
    expect(screen.queryByLabelText(/Theme level/)).toBeNull();
  });
});

describe('DocsHeader within a ThemeProvider', () => {
  function Header() {
    return (
      <ThemeProvider persist={false} defaultLevel="midnight">
        <DocsHeader title="Docs" />
      </ThemeProvider>
    );
  }

  it('renders the level control as a menu trigger', () => {
    render(<Header />);
    const trigger = screen.getByRole('button', { name: 'Theme level (current: Midnight)' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
  });

  /*
   * The first consumer #166 names: the chooser replaced a button that cycled.
   * Open, see every level with the current one checked, choose from the
   * keyboard, and land back on the trigger with the level applied.
   */
  it('chooses a level from the keyboard and returns focus to the trigger', async () => {
    render(<Header />);
    const trigger = screen.getByRole('button', { name: /Theme level/ });
    act(() => trigger.focus());
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });

    const menu = await screen.findByRole('menu', { name: /Theme level/ });
    expect(within(menu).getByRole('group', { name: 'Level' })).toBeDefined();
    const items = within(menu).getAllByRole('menuitemradio');
    expect(items.map((item) => item.textContent)).toEqual(
      THEME_LEVELS.map((level) => LEVELS[level].label),
    );
    expect(within(menu).getByRole('menuitemradio', { name: 'Midnight' }).getAttribute('aria-checked')).toBe(
      'true',
    );

    await waitFor(() => expect(document.activeElement?.textContent).toBe('Midnight'));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' });
    await waitFor(() => expect(document.activeElement?.textContent).toBe('Sketch'));
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });
    fireEvent.click(document.activeElement as HTMLElement);

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
    expect(trigger.getAttribute('aria-label')).toBe('Theme level (current: Sketch)');
  });
});
