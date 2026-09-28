import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Menu, MenuItem, MenuRadioGroup, MenuRadioItem, MenuSeparator } from './Menu';
import { Modal } from './Modal';

function Actions({
  onRename = vi.fn(),
  onDelete = vi.fn(),
  onOpenChange,
}: {
  onRename?: () => void;
  onDelete?: () => void;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Menu trigger={<Button>ACTIONS</Button>} onOpenChange={onOpenChange}>
      <MenuItem onClick={onRename}>Rename</MenuItem>
      <MenuItem disabled>Move</MenuItem>
      <MenuItem>Duplicate</MenuItem>
      <MenuSeparator />
      <MenuItem intent="danger" onClick={onDelete}>
        Delete
      </MenuItem>
    </Menu>
  );
}

/** Open the menu from the keyboard, the way a user without a pointer does. */
async function openWithKeyboard(key = 'ArrowDown') {
  const trigger = screen.getByRole('button', { name: 'ACTIONS' });
  act(() => trigger.focus());
  fireEvent.keyDown(trigger, { key });
  const menu = await screen.findByRole('menu');
  return { trigger, menu };
}

function focused() {
  return document.activeElement as HTMLElement;
}

describe('Menu', () => {
  it('labels the menu by its trigger and reports the open state on it', async () => {
    render(<Actions />);
    const trigger = screen.getByRole('button', { name: 'ACTIONS' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(trigger);
    const menu = await screen.findByRole('menu', { name: 'ACTIONS' });
    expect(menu).toBeTruthy();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('opens on ArrowDown with the first item focused, and traverses every item, the disabled one included', async () => {
    render(<Actions />);
    await openWithKeyboard();

    await waitFor(() => expect(focused().textContent).toBe('Rename'));

    fireEvent.keyDown(focused(), { key: 'ArrowDown' });
    // `Move` is disabled and still a stop: the WAI-ARIA menu pattern keeps
    // disabled items focusable so the user learns they exist.
    await waitFor(() => expect(focused().textContent).toBe('Move'));

    fireEvent.keyDown(focused(), { key: 'ArrowDown' });
    await waitFor(() => expect(focused().textContent).toBe('Duplicate'));

    fireEvent.keyDown(focused(), { key: 'ArrowDown' });
    await waitFor(() => expect(focused().textContent).toBe('Delete'));

    // Wraps from the last item to the first, and back.
    fireEvent.keyDown(focused(), { key: 'ArrowDown' });
    await waitFor(() => expect(focused().textContent).toBe('Rename'));
    fireEvent.keyDown(focused(), { key: 'ArrowUp' });
    await waitFor(() => expect(focused().textContent).toBe('Delete'));

    fireEvent.keyDown(focused(), { key: 'Home' });
    await waitFor(() => expect(focused().textContent).toBe('Rename'));
    fireEvent.keyDown(focused(), { key: 'End' });
    await waitFor(() => expect(focused().textContent).toBe('Delete'));
  });

  it('marks the disabled item and keeps it focusable', async () => {
    render(<Actions />);
    const { menu } = await openWithKeyboard();
    await waitFor(() => expect(focused().textContent).toBe('Rename'));

    const move = screen.getByRole('menuitem', { name: 'Move' });
    expect(menu.contains(move)).toBe(true);
    expect(move.getAttribute('aria-disabled')).toBe('true');
    expect(move.hasAttribute('data-disabled')).toBe(true);

    fireEvent.keyDown(focused(), { key: 'ArrowDown' });
    await waitFor(() => expect(document.activeElement).toBe(move));
  });

  it('opens on ArrowUp with the last item focused', async () => {
    render(<Actions />);
    await openWithKeyboard('ArrowUp');
    await waitFor(() => expect(focused().textContent).toBe('Delete'));
  });

  it('selects with Enter, closes, and returns focus to the trigger', async () => {
    const onDelete = vi.fn();
    render(<Actions onDelete={onDelete} />);
    const { trigger } = await openWithKeyboard('ArrowUp');
    await waitFor(() => expect(focused().textContent).toBe('Delete'));

    fireEvent.keyDown(focused(), { key: 'Enter' });
    fireEvent.click(focused());

    expect(onDelete).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('never activates a disabled item, from the pointer or the keyboard', async () => {
    const onMove = vi.fn();
    render(
      <Menu trigger={<Button>ACTIONS</Button>}>
        <MenuItem>Rename</MenuItem>
        <MenuItem disabled onClick={onMove}>
          Move
        </MenuItem>
      </Menu>,
    );
    await openWithKeyboard();
    await waitFor(() => expect(focused().textContent).toBe('Rename'));
    fireEvent.keyDown(focused(), { key: 'ArrowDown' });
    const move = screen.getByRole('menuitem', { name: 'Move' });
    await waitFor(() => expect(document.activeElement).toBe(move));

    fireEvent.keyDown(move, { key: 'Enter' });
    fireEvent.keyDown(move, { key: ' ' });
    fireEvent.click(move);
    expect(onMove).not.toHaveBeenCalled();
    // Nothing was chosen, so nothing dismissed the menu either.
    expect(screen.getByRole('menu')).toBeTruthy();
  });

  it('dismisses on Escape and returns focus to the trigger', async () => {
    const onOpenChange = vi.fn();
    render(<Actions onOpenChange={onOpenChange} />);
    const { trigger } = await openWithKeyboard();
    await waitFor(() => expect(focused().textContent).toBe('Rename'));

    fireEvent.keyDown(focused(), { key: 'Escape' });

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('closes on a press outside', async () => {
    render(
      <>
        <p data-testid="outside">Page</p>
        <Actions />
      </>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'ACTIONS' }));
    await screen.findByRole('menu');

    const outside = screen.getByTestId('outside');
    fireEvent.pointerDown(outside, { pointerType: 'mouse' });
    fireEvent.mouseDown(outside);
    fireEvent.pointerUp(outside, { pointerType: 'mouse' });
    fireEvent.mouseUp(outside);
    fireEvent.click(outside);
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('leaves no focusable item under an aria-hidden ancestor', async () => {
    render(<Actions />);
    const { menu } = await openWithKeyboard();
    const items = [...menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')];
    expect(items.length).toBe(4);
    for (const item of items) {
      expect(item.closest('[aria-hidden="true"]')).toBeNull();
    }
  });

  describe('radio group', () => {
    function LevelPicker({ onChange }: { onChange?: (value: string) => void }) {
      const [value, setValue] = useState('midnight');
      return (
        <Menu trigger={<Button>LEVEL</Button>}>
          <MenuRadioGroup
            label="Level"
            value={value}
            onValueChange={(next) => {
              setValue(next);
              onChange?.(next);
            }}
          >
            <MenuRadioItem value="midnight" closeOnClick>
              Midnight
            </MenuRadioItem>
            <MenuRadioItem value="sketch" closeOnClick>
              Sketch
            </MenuRadioItem>
          </MenuRadioGroup>
        </Menu>
      );
    }

    it('names the group on the element carrying role="group", and marks the chosen item', async () => {
      render(<LevelPicker />);
      fireEvent.click(screen.getByRole('button', { name: 'LEVEL' }));

      const group = await screen.findByRole('group', { name: 'Level' });
      expect(group.getAttribute('data-slot')).toBe('menu-radio-group');

      const midnight = screen.getByRole('menuitemradio', { name: 'Midnight' });
      const sketch = screen.getByRole('menuitemradio', { name: 'Sketch' });
      expect(midnight.getAttribute('aria-checked')).toBe('true');
      expect(sketch.getAttribute('aria-checked')).toBe('false');
    });

    it('chooses with the keyboard and closes when the item asks to', async () => {
      const onChange = vi.fn();
      render(<LevelPicker onChange={onChange} />);
      const trigger = screen.getByRole('button', { name: 'LEVEL' });
      act(() => trigger.focus());
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      await screen.findByRole('menu');
      await waitFor(() => expect(focused().textContent).toBe('Midnight'));

      fireEvent.keyDown(focused(), { key: 'ArrowDown' });
      await waitFor(() => expect(focused().textContent).toBe('Sketch'));
      fireEvent.keyDown(focused(), { key: 'Enter' });
      fireEvent.click(focused());

      expect(onChange).toHaveBeenCalledWith('sketch');
      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(trigger));
    });
  });

  describe('inside a Modal', () => {
    it('closes only the menu on Escape, and leaves the modal standing', async () => {
      const onModalClose = vi.fn();
      render(
        <Modal isOpen onClose={onModalClose} title="Settings">
          <Actions />
        </Modal>,
      );

      const trigger = await screen.findByRole('button', { name: 'ACTIONS' });
      act(() => trigger.focus());
      fireEvent.keyDown(trigger, { key: 'ArrowDown' });
      const menu = await screen.findByRole('menu');
      await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));

      for (const item of menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')) {
        expect(item.closest('[aria-hidden="true"]')).toBeNull();
      }

      fireEvent.keyDown(focused(), { key: 'Escape' });

      await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
      expect(onModalClose).not.toHaveBeenCalled();
      expect(screen.getByRole('dialog', { name: '[ Settings ]' })).toBeTruthy();
      await waitFor(() => expect(document.activeElement).toBe(trigger));
    });
  });

  it('forwards refs, spreads props, and merges a caller’s class and style', async () => {
    const menuRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();
    const disabledRef = createRef<HTMLDivElement>();
    render(
      <Menu
        ref={menuRef}
        defaultOpen
        trigger={<Button>ACTIONS</Button>}
        data-testid="menu"
        className="min-w-64"
        style={{ maxWidth: '20rem' }}
      >
        <MenuItem ref={itemRef} data-testid="item" className="py-3" style={{ letterSpacing: '0.1em' }}>
          Rename
        </MenuItem>
        <MenuItem ref={disabledRef} disabled className="py-3">
          Move
        </MenuItem>
      </Menu>,
    );

    const menu = await screen.findByTestId('menu');
    expect(menuRef.current).toBe(menu);
    expect(menu.getAttribute('role')).toBe('menu');
    expect(menu.className).toContain('min-w-64');
    expect(menu.className).not.toContain('min-w-48');
    expect(menu.style.maxWidth).toBe('20rem');

    const item = screen.getByTestId('item');
    expect(itemRef.current).toBe(item);
    expect(item.className).toContain('py-3');
    expect(item.className).not.toContain('py-1.5');
    expect(item.style.letterSpacing).toBe('0.1em');
    expect(disabledRef.current?.className).toContain('py-3');
    expect(disabledRef.current?.className).not.toContain('py-1.5');
  });
});
