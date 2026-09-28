import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { auditContrast } from '../theme/contrast';
import { LEVELS } from '../theme/levels';
import { Select } from './Select';
import type { SelectOption, SelectProps } from './Select';

/** Four regions, one of them not choosable, so traversal has something to skip. */
const REGIONS: SelectOption[] = [
  { label: 'US East', value: 'us-east-1' },
  { label: 'EU West', value: 'eu-west-1', disabled: true },
  { label: 'EU Central', value: 'eu-central-1' },
  { label: 'AP South', value: 'ap-south-1' },
];

function Region(props: Partial<SelectProps>) {
  return <Select label="Region" name="region" options={REGIONS} {...props} />;
}

function trigger(): HTMLElement {
  return screen.getByRole('combobox');
}

function option(name: string): HTMLElement {
  return screen.getByRole('option', { name });
}

/**
 * Drive a key and let Base UI settle: it moves focus in a microtask and
 * mounts the popup over a frame, so a bare `fireEvent` asserts too early.
 */
async function press(target: Element, key: string) {
  await act(async () => {
    fireEvent.keyDown(target, { key });
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

async function open() {
  await act(async () => {
    fireEvent.click(trigger());
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

/** A real mouse click: Base UI ignores a click that did not start with a press on the row. */
async function choose(name: string) {
  await act(async () => {
    fireEvent.pointerDown(option(name), { pointerType: 'mouse' });
    fireEvent.click(option(name));
  });
}

/** The option's own text, without the chosen row's `>` mark. */
function rowText(row: Element): string | null | undefined {
  return row.querySelector('[data-slot="select-item-text"]')?.textContent;
}

function focused(): Element | null {
  return document.activeElement;
}

function submit(form: HTMLFormElement): FormData {
  return new FormData(form);
}

describe('Select — the listbox', () => {
  // By role and name, which is what a screen reader is given. On the native
  // control this was a `select` found by label; it is a `combobox` now, and
  // the field's label has to reach it rather than a wrapper.
  it('is a combobox named by the field label', () => {
    render(<Region />);

    expect(screen.getByRole('combobox', { name: 'Region' })).toBe(trigger());
    expect(trigger().tagName).toBe('BUTTON');
  });

  it('opens a listbox named by the same label, holding every option', async () => {
    render(<Region />);
    await open();

    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('listbox', { name: 'Region' })).toBeDefined();
    expect(screen.getAllByRole('option').map(rowText)).toEqual(REGIONS.map((r) => r.label));
  });

  it('names both the trigger and the list from aria-label when there is no visible label', async () => {
    render(<Select aria-label="Region" options={REGIONS} />);
    await open();

    expect(screen.getByRole('combobox', { name: 'Region' })).toBeDefined();
    expect(screen.getByRole('listbox', { name: 'Region' })).toBeDefined();
  });

  it('focuses the trigger, without opening the list, when the label is clicked', async () => {
    render(<Region />);

    await act(async () => {
      fireEvent.click(screen.getByText('Region'));
    });

    expect(focused()).toBe(trigger());
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('puts a caller id on the trigger, not the wrapper', () => {
    render(<Region id="region-picker" />);

    expect(trigger().id).toBe('region-picker');
  });

  it('starts on the first enabled option when nothing is given, as a native select does', () => {
    render(<Select label="Region" options={[REGIONS[1]!, ...REGIONS.slice(2)]} />);

    expect(trigger().textContent).toBe('EU Central');
  });

  it('starts from defaultValue', () => {
    render(<Region defaultValue="ap-south-1" />);

    expect(trigger().textContent).toBe('AP South');
  });

  it('starts from nothing, and shows the placeholder, when one is set', () => {
    render(<Region placeholder="Pick a region" />);

    expect(trigger().textContent).toBe('Pick a region');
    expect(trigger().hasAttribute('data-placeholder')).toBe(true);
  });

  it('commits a clicked option and reports its value', async () => {
    const onValueChange = vi.fn();
    render(<Region onValueChange={onValueChange} />);
    await open();

    await choose('AP South');

    expect(onValueChange).toHaveBeenCalledWith('ap-south-1');
    expect(trigger().textContent).toBe('AP South');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('follows a controlled value', async () => {
    function Controlled() {
      const [value, setValue] = useState('us-east-1');
      return (
        <>
          <Region value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);
    await open();

    await choose('EU Central');

    expect(screen.getByRole('status').textContent).toBe('eu-central-1');
    expect(trigger().textContent).toBe('EU Central');
  });

  it('does not commit a disabled option', async () => {
    const onValueChange = vi.fn();
    render(<Region onValueChange={onValueChange} />);
    await open();

    await choose('EU West');

    expect(onValueChange).not.toHaveBeenCalled();
    expect(option('EU West').getAttribute('aria-disabled')).toBe('true');
  });

  it('marks the chosen option selected, and only that one', async () => {
    render(<Region defaultValue="eu-central-1" />);
    await open();

    const selected = screen.getAllByRole('option').filter((o) => o.getAttribute('aria-selected') === 'true');
    expect(selected.map(rowText)).toEqual(['EU Central']);
  });

  it('shows an empty state rather than an empty box when there are no options', async () => {
    render(<Select label="Region" options={[]} />);
    await open();

    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('> No options')).toBeDefined();
  });
});

describe('Select — keyboard', () => {
  it('opens from the arrow key and lands on the chosen option', async () => {
    render(<Region defaultValue="eu-central-1" />);

    await press(trigger(), 'ArrowDown');

    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(focused()).toBe(option('EU Central'));
  });

  // The two reviewers' findings on Base UI's defaults: it lets the arrows and
  // Home/End stop on a disabled row. These fail without `skipDisabledRows`.
  it('steps over a disabled option with the arrow keys', async () => {
    render(<Region />);
    await press(trigger(), 'ArrowDown');
    expect(focused()).toBe(option('US East'));

    await press(focused()!, 'ArrowDown');
    expect(focused()).toBe(option('EU Central'));
    expect(option('EU Central').hasAttribute('data-highlighted')).toBe(true);

    await press(focused()!, 'ArrowUp');
    expect(focused()).toBe(option('US East'));
  });

  it('goes to the first and last enabled option on Home and End', async () => {
    const options = [{ label: 'Off', value: 'off', disabled: true }, ...REGIONS, { label: 'Gone', value: 'gone', disabled: true }];
    render(<Select label="Region" options={options} defaultValue="eu-central-1" />);
    await press(trigger(), 'ArrowDown');

    await press(focused()!, 'End');
    expect(focused()).toBe(option('AP South'));

    await press(focused()!, 'Home');
    expect(focused()).toBe(option('US East'));
  });

  it('stays on the last enabled option rather than stepping past it', async () => {
    render(<Region defaultValue="ap-south-1" />);
    await press(trigger(), 'ArrowDown');

    await press(focused()!, 'ArrowDown');

    expect(focused()).toBe(option('AP South'));
  });

  it('commits the highlighted option on Enter', async () => {
    const onValueChange = vi.fn();
    render(<Region onValueChange={onValueChange} />);
    await press(trigger(), 'ArrowDown');
    await press(focused()!, 'ArrowDown');

    await press(focused()!, 'Enter');

    expect(onValueChange).toHaveBeenCalledWith('eu-central-1');
    expect(trigger().textContent).toBe('EU Central');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape without committing the highlighted option', async () => {
    const onValueChange = vi.fn();
    render(<Region onValueChange={onValueChange} />);
    await press(trigger(), 'ArrowDown');
    await press(focused()!, 'End');

    await press(focused()!, 'Escape');

    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger().textContent).toBe('US East');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('jumps to the option that starts with what was typed', async () => {
    render(<Region />);
    await press(trigger(), 'ArrowDown');

    await press(focused()!, 'a');

    expect(focused()).toBe(option('AP South'));
  });

  it('skips a disabled option while typing ahead', async () => {
    render(<Region />);
    await press(trigger(), 'ArrowDown');

    await press(focused()!, 'e');

    expect(focused()).toBe(option('EU Central'));
  });
});

describe('Select — the field contract', () => {
  it('shows helper text, then replaces it with the error', () => {
    const { rerender } = render(<Region helperText="Where the cluster runs" />);
    expect(screen.getByText('> Where the cluster runs')).toBeDefined();

    rerender(<Region helperText="Where the cluster runs" error="Pick a region" />);
    expect(screen.getByText('> Pick a region')).toBeDefined();
    expect(screen.queryByText('> Where the cluster runs')).toBeNull();
  });

  it('marks the trigger invalid and describes it with the error', () => {
    render(<Region error="Pick a region" />);

    expect(trigger().getAttribute('aria-invalid')).toBe('true');
    const describedBy = (trigger().getAttribute('aria-describedby') ?? '').split(' ');
    expect(describedBy.map((id) => document.getElementById(id)?.textContent)).toContain('> Pick a region');
    expect(trigger().className).toContain('border-intent-danger');
  });

  it('refuses to open while disabled, and greys the control', async () => {
    render(<Region disabled />);
    await open();

    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(trigger().hasAttribute('data-disabled')).toBe(true);
    expect(trigger().className).toContain('data-[disabled]:text-content-muted');
  });

  it('drives the focus border, the highlight and the mark from the accent', async () => {
    render(<Region accent="danger" />);
    await open();

    expect(trigger().style.getPropertyValue('--field-accent')).toBe('var(--ds-intent-danger)');
    // The list is portalled out of the trigger's subtree, so it carries the
    // accent itself rather than inheriting it.
    const popup = document.querySelector<HTMLElement>('[data-slot="select-popup"]');
    expect(popup?.style.getPropertyValue('--field-accent')).toBe('var(--ds-intent-danger)');
  });

  it('merges a caller style with the accent instead of losing it', () => {
    render(<Region accent="success" style={{ width: 320 }} />);

    expect(trigger().style.width).toBe('320px');
    expect(trigger().style.getPropertyValue('--field-accent')).toBe('var(--ds-intent-success)');
  });

  it('forwards its ref to the trigger', () => {
    let node: HTMLElement | null = null;
    render(<Select label="Region" options={REGIONS} ref={(el) => { node = el; }} />);

    expect(node).toBe(trigger());
  });

  it('merges a caller className onto the trigger', () => {
    render(<Region className="mt-4" />);

    expect(trigger().className).toContain('mt-4');
    expect(trigger().className).toContain('border-2');
  });
});

describe('Select — native form submission', () => {
  it('submits the chosen value under name', async () => {
    const { container } = render(
      <form>
        <Region />
      </form>,
    );
    const form = container.querySelector('form')!;
    expect(submit(form).get('region')).toBe('us-east-1');

    await open();
    await choose('AP South');

    expect(submit(form).get('region')).toBe('ap-south-1');
  });

  it('submits nothing chosen as an empty value while the placeholder shows', () => {
    const { container } = render(
      <form>
        <Region placeholder="Pick a region" />
      </form>,
    );

    expect(submit(container.querySelector('form')!).get('region')).toBe('');
  });

  it('submits nothing while disabled, as a disabled select does', () => {
    const { container } = render(
      <form>
        <Region disabled />
      </form>,
    );

    expect(submit(container.querySelector('form')!).has('region')).toBe(false);
  });
});

describe('Select — native', () => {
  it('renders the platform select, labelled by the field', () => {
    render(<Region native />);

    expect(screen.getByLabelText('Region').tagName).toBe('SELECT');
    expect(screen.queryByRole('combobox', { name: 'Region' })?.tagName).toBe('SELECT');
  });

  it('renders every option, disabled ones included', () => {
    render(<Region native />);

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(REGIONS.map((r) => r.label));
    expect((option('EU West') as HTMLOptionElement).disabled).toBe(true);
  });

  it('starts from defaultValue and reports a change by value', () => {
    const onValueChange = vi.fn();
    render(<Region native defaultValue="ap-south-1" onValueChange={onValueChange} />);
    const select = screen.getByLabelText('Region') as HTMLSelectElement;
    expect(select.value).toBe('ap-south-1');

    fireEvent.change(select, { target: { value: 'eu-central-1' } });

    expect(onValueChange).toHaveBeenCalledWith('eu-central-1');
  });

  it('submits under name', () => {
    const { container } = render(
      <form>
        <Region native defaultValue="eu-central-1" />
      </form>,
    );

    expect(submit(container.querySelector('form')!).get('region')).toBe('eu-central-1');
  });

  it('keeps the accent and a caller style together', () => {
    render(<Region native accent="warning" style={{ width: 320 }} />);
    const select = screen.getByLabelText('Region') as HTMLSelectElement;

    expect(select.style.width).toBe('320px');
    expect(select.style.getPropertyValue('--field-accent')).toBe('var(--ds-intent-warning)');
  });

  it('forwards its ref to the select', () => {
    let node: HTMLElement | null = null;
    render(<Select label="Region" options={REGIONS} native ref={(el) => { node = el; }} />);

    expect(node).toBe(screen.getByLabelText('Region'));
  });
});

/**
 * The open list is drawn from roles, and `check:contrast` measures exactly the
 * roles it is drawn from. Asserted from both ends: the classes name the roles,
 * and the audit carries a named pair for each, passing on every Level.
 */
describe('Select — the list is painted by the palette', () => {
  it('draws the list, the rows and the highlight from roles', async () => {
    render(<Region defaultValue="eu-central-1" />);
    await press(trigger(), 'ArrowDown');

    const popup = document.querySelector<HTMLElement>('[data-slot="select-popup"]')!;
    expect(popup.className).toContain('bg-surface-raised');
    expect(popup.className).toContain('text-content-primary');
    expect(popup.className).toContain('border-edge-strong');

    const row = option('EU Central');
    expect(row.hasAttribute('data-highlighted')).toBe(true);
    expect(row.className).toContain('data-[highlighted]:bg-[var(--field-accent)]');
    expect(row.className).toContain('data-[highlighted]:text-content-inverse');
    expect(option('EU West').className).toContain('data-[disabled]:text-content-muted');
  });

  it.each(Object.keys(LEVELS))('measures every pair the list draws on %s', (level) => {
    const pairs = auditContrast(LEVELS).filter((r) => r.level === level && r.pair.startsWith('select.'));
    const names = pairs.map((r) => r.pair);

    expect(names).toContain('select.option: text.primary on surface.raised');
    expect(names).toContain('select.option disabled: text.muted on surface.raised');
    expect(names).toContain('select.option highlighted: text.inverse on accent.primary');
    expect(names).toContain('select.option selected mark: accent.primary on surface.raised');
    expect(names).toContain('select.option highlighted: text.inverse on intent.danger');
    expect(pairs.filter((r) => !r.passes)).toEqual([]);
  });
});
