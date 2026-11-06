import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Input, Select, TextArea } from './Input';

describe('Input', () => {
  it('associates the label with the control', () => {
    render(<Input label="Api Key" />);

    expect(screen.getByLabelText('Api Key')).toBe(screen.getByRole('textbox'));
  });

  it('prefers an explicit id over the derived one', () => {
    render(<Input label="Api Key" id="custom" />);

    expect(screen.getByLabelText('Api Key')).toHaveProperty('id', 'custom');
  });

  it('renders without a label', () => {
    render(<Input placeholder="unlabelled" />);

    expect(screen.getByPlaceholderText('unlabelled')).toBeDefined();
  });

  it('shows helper text when there is no error', () => {
    render(<Input label="Key" helperText="32 characters" />);

    expect(screen.getByText('> 32 characters')).toBeDefined();
  });

  it('replaces helper text with the error', () => {
    render(<Input label="Key" helperText="32 characters" error="Too short" />);

    expect(screen.getByText('> Too short')).toBeDefined();
    expect(screen.queryByText('> 32 characters')).toBeNull();
  });

  it('marks the border with the danger intent while in error', () => {
    const { container } = render(<Input label="Key" error="Too short" />);

    expect(container.querySelector('input')?.className).toContain('border-intent-danger');
  });

  it('forwards arbitrary input attributes', () => {
    render(<Input label="Key" type="password" required maxLength={8} />);

    const field = screen.getByLabelText('Key') as HTMLInputElement;
    expect(field.type).toBe('password');
    expect(field.required).toBe(true);
    expect(field.maxLength).toBe(8);
  });

  it('appends a caller className without dropping its own', () => {
    const { container } = render(<Input label="Key" className="mt-4" />);
    const className = container.querySelector('input')?.className ?? '';

    expect(className).toContain('mt-4');
    expect(className).toContain('border-2');
  });

  // The accent is a runtime value, so it cannot be a utility class: Tailwind's
  // scanner reads source text and would generate nothing for `border-${role}`.
  // It travels as `--field-accent` instead, which the recipe's
  // `focus:border-[var(--field-accent)]` reads. Asserting the property rather
  // than the class is also what makes this test meaningful — every accent
  // produces the *same* class string, so a class assertion could not tell a
  // working accent from a broken one.
  it('drives the focus ring from the accent', () => {
    const { container } = render(<Input label="Key" accent="danger" />);

    expect(container.querySelector('input')?.style.getPropertyValue('--field-accent')).toBe(
      'var(--ds-intent-danger)',
    );
  });

  // The deprecation promise: renaming a legacy accent at a call site must not
  // change what renders.
  it('renders a legacy accent identically to its semantic name', () => {
    const legacy = render(<Input label="Key" accent="primary" />);
    const semantic = render(<Input label="Key" accent="primary" />);

    const legacyInput = legacy.container.querySelector('input');
    const semanticInput = semantic.container.querySelector('input');

    expect(legacyInput?.className).toBe(semanticInput?.className);
    expect(legacyInput?.style.getPropertyValue('--field-accent')).toBe(
      semanticInput?.style.getPropertyValue('--field-accent'),
    );
    expect(legacyInput?.style.getPropertyValue('--field-accent')).toBe(
      'var(--ds-accent-primary)',
    );
  });
});

describe('TextArea', () => {
  it('associates the label with the control', () => {
    render(<TextArea label="Notes" />);

    expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA');
  });

  // Regression: TextArea accepted `accent` and hardcoded the cyan focus border,
  // so the prop silently did nothing.
  it('honours the accent prop', () => {
    const { container } = render(<TextArea label="Notes" accent="warning" />);

    expect(container.querySelector('textarea')?.style.getPropertyValue('--field-accent')).toBe(
      'var(--ds-intent-warning)',
    );
  });

  it('shows the error', () => {
    render(<TextArea label="Notes" error="Required" />);

    expect(screen.getByText('> Required')).toBeDefined();
  });

  it('forwards textarea attributes', () => {
    render(<TextArea label="Notes" rows={7} />);

    expect((screen.getByLabelText('Notes') as HTMLTextAreaElement).rows).toBe(7);
  });
});

describe('Select', () => {
  const options = [
    { label: 'Alpha', value: 'a' },
    { label: 'Beta', value: 'b' },
  ];

  it('renders every option', () => {
    render(<Select label="Mode" options={options} />);

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Alpha', 'Beta']);
  });

  it('associates the label with the control', () => {
    render(<Select label="Mode" options={options} />);

    expect(screen.getByLabelText('Mode').tagName).toBe('SELECT');
  });

  // Same regression as TextArea.
  it('honours the accent prop', () => {
    const { container } = render(<Select label="Mode" options={options} accent="success" />);

    expect(container.querySelector('select')?.style.getPropertyValue('--field-accent')).toBe(
      'var(--ds-intent-success)',
    );
  });

  it('renders an empty option list without crashing', () => {
    render(<Select label="Mode" options={[]} />);

    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('forwards select attributes', () => {
    render(<Select label="Mode" options={options} defaultValue="b" />);

    expect((screen.getByLabelText('Mode') as HTMLSelectElement).value).toBe('b');
  });
});

/**
 * The gap-1 invariant, asserted where it is cheapest to check. AGENTS.md
 * forbids components from naming a palette entry; these three are the ones the
 * audit found doing it.
 */
describe('form controls address roles, not colours', () => {
  const FORBIDDEN = /brutalist-|--color-white|--border-color|zinc-|-red-\d|bg-black|text-white|border-white/;

  it.each([
    ['Input', <Input key="i" label="L" helperText="h" />],
    ['Input in error', <Input key="ie" label="L" error="e" />],
    ['TextArea', <TextArea key="t" label="L" />],
    ['Select', <Select key="s" label="L" options={[{ label: 'A', value: 'a' }]} />],
  ])('%s emits no palette-pinned class', (_name, element) => {
    const { container } = render(element);

    for (const node of container.querySelectorAll<HTMLElement>('*')) {
      expect(node.className, `${node.tagName} pins a palette entry`).not.toMatch(FORBIDDEN);
    }
  });
});
