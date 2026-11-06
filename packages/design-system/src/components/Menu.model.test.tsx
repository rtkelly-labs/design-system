import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import fc from 'fast-check';
import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { Button } from './Button';
import { Menu, MenuItem } from './Menu';

/**
 * Menu against a model of the WAI-ARIA menu pattern, driven by generated
 * keyboard sequences — the control case for `FilterBar.model.test.tsx`.
 *
 * FilterBar's state machine is ours. Menu's is Base UI's: the wrapper forwards
 * props and adds styling, so the keyboard model under test here belongs to a
 * dependency with its own suite. Running the same technique on both is how
 * the experiment tells "model-based testing finds things" apart from "it finds
 * things where we wrote the logic".
 *
 * Every step waits for focus to settle, because Base UI moves it in an
 * animation frame; that makes each sequence slow, so the run count is low.
 */

const NUM_RUNS = Math.max(1, Math.round(Number(process.env.FC_NUM_RUNS ?? 30) / 3));

const ITEMS = [
  { label: 'Rename', disabled: false },
  { label: 'Move', disabled: true },
  { label: 'Duplicate', disabled: false },
  { label: 'Delete', disabled: false },
] as const;
const LAST = ITEMS.length - 1;

interface Model {
  open: boolean;
  active: number;
  selected: string[];
}

interface Real {
  onSelect: Mock<(label: string) => void>;
}

const trigger = () => screen.getByRole('button', { name: 'ACTIONS' });
const focusedText = () => (document.activeElement as HTMLElement | null)?.textContent;

async function agree(m: Model, r: Real) {
  if (m.open) {
    await waitFor(() => expect(focusedText()).toBe(ITEMS[m.active]!.label));
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  } else {
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger()));
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  }
  expect(r.onSelect.mock.calls.map(([label]) => label)).toEqual(m.selected);
}

class Open implements fc.AsyncCommand<Model, Real> {
  constructor(readonly key: 'ArrowDown' | 'ArrowUp') {}
  check = (m: Readonly<Model>) => !m.open;
  async run(m: Model, r: Real) {
    m.open = true;
    m.active = this.key === 'ArrowDown' ? 0 : LAST;
    act(() => trigger().focus());
    fireEvent.keyDown(trigger(), { key: this.key });
    await screen.findByRole('menu');
    await agree(m, r);
  }
  toString = () => `open(${this.key})`;
}

class Navigate implements fc.AsyncCommand<Model, Real> {
  constructor(readonly key: 'ArrowDown' | 'ArrowUp' | 'Home' | 'End') {}
  check = (m: Readonly<Model>) => m.open;
  async run(m: Model, r: Real) {
    // Disabled items stay focusable, and the list wraps at both ends.
    if (this.key === 'ArrowDown') m.active = m.active === LAST ? 0 : m.active + 1;
    else if (this.key === 'ArrowUp') m.active = m.active === 0 ? LAST : m.active - 1;
    else m.active = this.key === 'Home' ? 0 : LAST;
    fireEvent.keyDown(document.activeElement!, { key: this.key });
    await agree(m, r);
  }
  toString = () => `navigate(${this.key})`;
}

class Dismiss implements fc.AsyncCommand<Model, Real> {
  check = (m: Readonly<Model>) => m.open;
  async run(m: Model, r: Real) {
    m.open = false;
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await agree(m, r);
  }
  toString = () => 'dismiss()';
}

class Activate implements fc.AsyncCommand<Model, Real> {
  check = (m: Readonly<Model>) => m.open;
  async run(m: Model, r: Real) {
    const item = ITEMS[m.active]!;
    // A disabled item is announced and reachable, and does nothing.
    if (!item.disabled) {
      m.selected.push(item.label);
      m.open = false;
    }
    const target = document.activeElement as HTMLElement;
    fireEvent.keyDown(target, { key: 'Enter' });
    fireEvent.click(target);
    await agree(m, r);
  }
  toString = () => 'activate()';
}

const commands = [
  fc.constantFrom('ArrowDown' as const, 'ArrowUp' as const).map((key) => new Open(key)),
  fc.constantFrom('ArrowDown' as const, 'ArrowUp' as const, 'Home' as const, 'End' as const).map((key) => new Navigate(key)),
  fc.constant(new Dismiss()),
  fc.constant(new Activate()),
];

describe('Menu model', () => {
  it(
    'follows the menu keyboard pattern for any sequence of keys',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.commands(commands, { maxCommands: 12 }), async (cmds) => {
          const onSelect = vi.fn<(label: string) => void>();
          const { unmount } = render(
            <Menu trigger={<Button>ACTIONS</Button>}>
              {ITEMS.map((item) => (
                <MenuItem key={item.label} disabled={item.disabled} onClick={() => onSelect(item.label)}>
                  {item.label}
                </MenuItem>
              ))}
            </Menu>,
          );
          try {
            await fc.asyncModelRun(() => ({ model: { open: false, active: 0, selected: [] }, real: { onSelect } }), cmds);
          } finally {
            unmount();
          }
        }),
        { numRuns: NUM_RUNS, verbose: true },
      );
    },
    60_000,
  );
});
