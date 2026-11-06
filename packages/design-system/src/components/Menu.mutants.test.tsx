import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './Button';
import { Menu, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator } from './Menu';

/**
 * Tests written against the Menu mutants the rest of the suite let survive.
 *
 * Most Menu survivors are class lists (`intent="danger"`, `disabled`), which
 * this suite leaves to the visual tests on purpose. These two are behaviour.
 */

async function open() {
  const trigger = screen.getByRole('button', { name: 'VIEW' });
  act(() => trigger.focus());
  fireEvent.keyDown(trigger, { key: 'ArrowDown' });
  return screen.findByRole('menu');
}

describe('Menu, survivors', () => {
  it('renders a separator between groups', async () => {
    render(
      <Menu trigger={<Button>VIEW</Button>}>
        <MenuItem>Rename</MenuItem>
        <MenuSeparator />
        <MenuItem>Delete</MenuItem>
      </Menu>,
    );
    const menu = await open();
    expect(menu.querySelectorAll('[role="separator"]')).toHaveLength(1);
  });

  it('keeps the menu open after a radio choice, so the new state is visible', async () => {
    render(
      <Menu trigger={<Button>VIEW</Button>}>
        <MenuRadioGroup defaultValue="list">
          <MenuRadioItem value="list">List</MenuRadioItem>
          <MenuRadioItem value="grid">Grid</MenuRadioItem>
        </MenuRadioGroup>
      </Menu>,
    );
    await open();
    const focused = () => document.activeElement as HTMLElement;
    await waitFor(() => expect(focused().textContent).toBe('List'));
    fireEvent.keyDown(focused(), { key: 'ArrowDown' });
    await waitFor(() => expect(focused().textContent).toBe('Grid'));
    const grid = focused();
    fireEvent.keyDown(grid, { key: 'Enter' });
    fireEvent.click(grid);
    await waitFor(() => expect(grid.getAttribute('aria-checked')).toBe('true'));
    // `aria-expanded` drops as soon as the menu starts to close, before any exit animation.
    expect(screen.getByRole('button', { name: 'VIEW' }).getAttribute('aria-expanded')).toBe('true');
  });
});
