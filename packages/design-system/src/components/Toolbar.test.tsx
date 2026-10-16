import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ButtonGroup } from './ButtonGroup';
import { Menu, MenuItem } from './Menu';
import { Toolbar, ToolbarButton, ToolbarSeparator } from './Toolbar';

function Bar({ loopFocus }: { loopFocus?: boolean }) {
  return (
    <Toolbar label="Bulk actions" loopFocus={loopFocus}>
      <ButtonGroup aria-label="Apply">
        <ToolbarButton size="xs">STATUS</ToolbarButton>
        <ToolbarButton size="xs">ARCHIVE</ToolbarButton>
        <ToolbarSeparator />
        <ToolbarButton size="xs">CLEAR</ToolbarButton>
      </ButtonGroup>
    </Toolbar>
  );
}

describe('Toolbar', () => {
  it('is a named toolbar with a single tab stop', () => {
    render(<Bar />);
    expect(screen.getByRole('toolbar', { name: 'Bulk actions' })).toBeTruthy();
    const stops = screen.getAllByRole('button').filter((b) => b.getAttribute('tabindex') === '0');
    expect(stops).toHaveLength(1);
  });

  it('moves between controls with the arrow keys, and loops by default', async () => {
    render(<Bar />);
    const [status, archive, clear] = screen.getAllByRole('button');
    status!.focus();
    fireEvent.keyDown(status!, { key: 'ArrowRight' });
    await waitFor(() => expect(document.activeElement).toBe(archive));
    fireEvent.keyDown(archive!, { key: 'ArrowRight' });
    await waitFor(() => expect(document.activeElement).toBe(clear));
    fireEvent.keyDown(clear!, { key: 'ArrowRight' });
    await waitFor(() => expect(document.activeElement).toBe(status));
  });

  it('stops at the end with loopFocus off', async () => {
    render(<Bar loopFocus={false} />);
    const buttons = screen.getAllByRole('button');
    const last = buttons[buttons.length - 1]!;
    last.focus();
    fireEvent.keyDown(last, { key: 'ArrowRight' });
    await waitFor(() => expect(document.activeElement).toBe(last));
  });

  it('keeps Button styling on its items, and a bare item plain', () => {
    render(
      <Toolbar label="Tools" framed={false}>
        <ToolbarButton size="xs">GO</ToolbarButton>
        <ToolbarButton bare aria-label="Search" className="flex">
          s
        </ToolbarButton>
      </Toolbar>,
    );
    expect(screen.getByRole('button', { name: 'GO' }).className).toContain('h-7');
    expect(screen.getByRole('button', { name: 'Search' }).className).toBe('flex');
  });

  it('lets a menu trigger be a toolbar item', async () => {
    render(
      <Toolbar label="Bulk actions">
        <ToolbarButton size="xs">ARCHIVE</ToolbarButton>
        <Menu trigger={<ToolbarButton size="xs">STATUS</ToolbarButton>}>
          <MenuItem>Open</MenuItem>
        </Menu>
      </Toolbar>,
    );
    const archive = screen.getByRole('button', { name: 'ARCHIVE' });
    const status = screen.getByRole('button', { name: 'STATUS' });
    expect(status.getAttribute('aria-haspopup')).toBe('menu');
    archive.focus();
    fireEvent.keyDown(archive, { key: 'ArrowRight' });
    await waitFor(() => expect(document.activeElement).toBe(status));
  });
});
