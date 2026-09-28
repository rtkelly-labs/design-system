import { act, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Radio, RadioGroup } from './RadioGroup';
import type { RadioGroupProps } from './RadioGroup';

/** The issue's own example: three options, the middle one chosen. */
function Deployment(props: Partial<RadioGroupProps>) {
  return (
    <RadioGroup legend="Preferred deployment" name="deployment" defaultValue="self-hosted" {...props}>
      <Radio value="cloud" label="Cloud" />
      <Radio value="self-hosted" label="Self-hosted" />
      <Radio value="hybrid" label="Hybrid" />
    </RadioGroup>
  );
}

/**
 * Press an arrow key on an option and let Base UI move focus, which it does in
 * a microtask after the keydown rather than inside it.
 */
async function press(target: HTMLElement, key: string) {
  await act(async () => {
    fireEvent.keyDown(target, { key });
    await Promise.resolve();
  });
}

function group(): HTMLElement {
  return screen.getByRole('radiogroup');
}

function option(name: string): HTMLElement {
  return screen.getByRole('radio', { name });
}

/** Resolve an `aria-*` id-reference list to the text it points at. */
function referencedText(element: HTMLElement, attribute: string): string {
  return (element.getAttribute(attribute) ?? '')
    .split(' ')
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? `<missing #${id}>`)
    .join(' ');
}

describe('RadioGroup', () => {
  // By role and name — the accessibility tree's answer, not the markup's. A
  // group labelled by nothing would fail the `name` lookup rather than pass
  // on an attribute that happened to exist.
  it('is one radiogroup, named by its legend', () => {
    render(<Deployment />);

    expect(screen.getAllByRole('radiogroup')).toHaveLength(1);
    expect(screen.getByRole('radiogroup', { name: 'Preferred deployment' })).toBe(group());
  });

  it('names each option from its own label', () => {
    render(<Deployment />);

    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(option('Cloud')).toBeDefined();
    expect(option('Self-hosted')).toBeDefined();
    expect(option('Hybrid')).toBeDefined();
  });

  it('starts from defaultValue, and moves the selection on click', () => {
    render(<Deployment />);

    expect(option('Self-hosted').getAttribute('aria-checked')).toBe('true');
    fireEvent.click(option('Hybrid'));
    expect(option('Hybrid').getAttribute('aria-checked')).toBe('true');
    expect(option('Self-hosted').getAttribute('aria-checked')).toBe('false');
  });

  it('selects when the label text is clicked', () => {
    render(<Deployment />);

    fireEvent.click(screen.getByText('Cloud'));

    expect(option('Cloud').getAttribute('aria-checked')).toBe('true');
  });

  it('reports the new value, and only the value', () => {
    const onValueChange = vi.fn();
    render(<Deployment onValueChange={onValueChange} />);

    fireEvent.click(option('Cloud'));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]).toEqual(['cloud']);
  });

  it('honours a controlled value', () => {
    function Controlled() {
      const [value, setValue] = useState('cloud');
      return (
        <>
          <Deployment defaultValue={undefined} value={value} onValueChange={setValue} />
          <output>{value}</output>
        </>
      );
    }
    render(<Controlled />);

    expect(option('Cloud').getAttribute('aria-checked')).toBe('true');
    fireEvent.click(option('Hybrid'));
    expect(screen.getByRole('status').textContent).toBe('hybrid');
    expect(option('Hybrid').getAttribute('aria-checked')).toBe('true');
  });

  // Roving tabindex: exactly one option is in the tab order, so Tab enters
  // the group once and the next Tab leaves it. Several radios sharing a
  // `name` with no group would each be a stop.
  it('puts exactly one option in the tab order — the selected one', () => {
    render(<Deployment />);

    const tabbable = screen.getAllByRole('radio').filter((r) => r.tabIndex === 0);
    expect(tabbable).toEqual([option('Self-hosted')]);
  });

  it('moves and selects with the arrow keys, wrapping at both ends', async () => {
    render(<Deployment />);

    option('Self-hosted').focus();
    await press(option('Self-hosted'), 'ArrowDown');
    expect(document.activeElement).toBe(option('Hybrid'));
    expect(option('Hybrid').getAttribute('aria-checked')).toBe('true');

    await press(option('Hybrid'), 'ArrowDown');
    expect(document.activeElement).toBe(option('Cloud'));
    expect(option('Cloud').getAttribute('aria-checked')).toBe('true');

    await press(option('Cloud'), 'ArrowUp');
    expect(document.activeElement).toBe(option('Hybrid'));

    // The tab stop follows the selection, so leaving and re-entering the
    // group lands on the option last chosen.
    const tabbable = screen.getAllByRole('radio').filter((r) => r.tabIndex === 0);
    expect(tabbable).toEqual([option('Hybrid')]);
  });

  it('describes the group with its helper text', () => {
    render(<Deployment helperText="You can change this later" />);

    expect(referencedText(group(), 'aria-describedby')).toBe('> You can change this later');
  });

  // The failure the issue names: an error "announced against whichever radio
  // happened to carry it". Here it is on the group — the radiogroup is
  // described by it and marked invalid — and no option owns it alone.
  it('associates a group error with the group, not with one option', () => {
    render(<Deployment error="Choose where this runs" helperText="Standing guidance" />);

    expect(screen.getByText('> Choose where this runs')).toBeDefined();
    expect(screen.queryByText('> Standing guidance')).toBeNull();
    expect(referencedText(group(), 'aria-describedby')).toBe('> Choose where this runs');
    expect(group().getAttribute('aria-invalid')).toBe('true');

    const errorId = screen.getByText('> Choose where this runs').id;
    const describedOptions = screen
      .getAllByRole('radio')
      .filter((r) => (r.getAttribute('aria-describedby') ?? '').split(' ').includes(errorId));
    // Every option inherits it through `Field.Item` — so whichever option a
    // screen reader lands on hears it — and none owns it alone.
    expect(describedOptions).toHaveLength(3);
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.hasAttribute('data-invalid')).toBe(true);
    }
  });

  it("describes an option by its own helper text, and not its siblings", () => {
    render(
      <RadioGroup legend="Preferred deployment" name="deployment">
        <Radio value="cloud" label="Cloud" />
        <Radio value="hybrid" label="Hybrid" helperText="Control plane in our cloud" />
      </RadioGroup>,
    );

    expect(referencedText(option('Hybrid'), 'aria-describedby')).toContain('> Control plane in our cloud');
    expect(referencedText(option('Cloud'), 'aria-describedby')).not.toContain('Control plane');
  });

  it('disables every option from the group', () => {
    const onValueChange = vi.fn();
    render(<Deployment disabled onValueChange={onValueChange} />);

    fireEvent.click(option('Cloud'));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(group().getAttribute('aria-disabled')).toBe('true');
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio.hasAttribute('data-disabled')).toBe(true);
    }
  });

  it('disables one option without disabling the rest', async () => {
    render(
      <RadioGroup legend="Preferred deployment" name="deployment" defaultValue="cloud">
        <Radio value="cloud" label="Cloud" />
        <Radio value="self-hosted" label="Self-hosted" disabled />
        <Radio value="hybrid" label="Hybrid" />
      </RadioGroup>,
    );

    fireEvent.click(option('Self-hosted'));
    expect(option('Self-hosted').getAttribute('aria-checked')).toBe('false');
    expect(option('Self-hosted').hasAttribute('data-disabled')).toBe(true);
    expect(option('Hybrid').hasAttribute('data-disabled')).toBe(false);

    // And the arrow keys step over it.
    option('Cloud').focus();
    await press(option('Cloud'), 'ArrowDown');
    expect(document.activeElement).toBe(option('Hybrid'));
  });

  it('refuses to change while read-only', () => {
    render(<Deployment readOnly />);

    fireEvent.click(option('Cloud'));

    expect(option('Self-hosted').getAttribute('aria-checked')).toBe('true');
    expect(group().getAttribute('aria-readonly')).toBe('true');
  });

  it('marks the group required', () => {
    render(<Deployment required />);

    expect(group().getAttribute('aria-required')).toBe('true');
  });

  it('forwards a ref to the radiogroup, and spreads props onto it', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <RadioGroup ref={ref} legend="Preferred deployment" data-testid="deployment" className="mt-4">
        <Radio value="cloud" label="Cloud" />
      </RadioGroup>,
    );

    expect(ref.current).toBe(group());
    expect(screen.getByTestId('deployment')).toBe(group());
    expect(group().className).toContain('mt-4');
    expect(group().className).toContain('flex-col');
  });

  it('carries the accent on the group, for every option to inherit', () => {
    render(<Deployment accent="danger" />);

    expect(group().style.getPropertyValue('--field-accent')).toBe('var(--ds-intent-danger)');
  });

  it('forwards a ref to each option, and merges its className', () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(
      <RadioGroup legend="Plan" name="plan">
        <Radio ref={ref} value="pro" label="Pro" className="ml-2" data-testid="pro" />
      </RadioGroup>,
    );

    expect(ref.current).toBe(option('Pro'));
    expect(screen.getByTestId('pro')).toBe(option('Pro'));
    expect(option('Pro').className).toContain('ml-2');
    expect(option('Pro').className).toContain('border-2');
  });
});

/**
 * Native submission: the value arrives under the *group's* name, which is the
 * point of one name per set rather than one per option.
 */
describe('RadioGroup in a form', () => {
  function submit(form: HTMLFormElement): FormData {
    let data: FormData | undefined;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      data = new FormData(form);
    });
    fireEvent.submit(form);
    if (!data) throw new Error('form never submitted');
    return data;
  }

  it('submits the selected value under the group name', () => {
    const { container } = render(
      <form>
        <Deployment />
      </form>,
    );

    expect(submit(container.querySelector('form')!).getAll('deployment')).toEqual(['self-hosted']);
  });

  it('submits the new value once the selection moves', () => {
    const { container } = render(
      <form>
        <Deployment />
      </form>,
    );

    fireEvent.click(option('Hybrid'));

    expect(submit(container.querySelector('form')!).getAll('deployment')).toEqual(['hybrid']);
  });

  it('submits nothing while nothing is selected, as native radios do', () => {
    const { container } = render(
      <form>
        <Deployment defaultValue={undefined} />
      </form>,
    );

    expect(submit(container.querySelector('form')!).has('deployment')).toBe(false);
  });

  it('merges a caller style with the accent rather than replacing it', () => {
    const { container } = render(
      <RadioGroup legend="Preferred deployment" name="deployment" defaultValue="cloud" style={{ width: '320px' }}>
        <Radio value="cloud" label="Cloud" />
      </RadioGroup>,
    );
    // The element carrying the caller's style must still carry the accent:
    // without it the checked fill has no colour and the state is invisible.
    const styled = Array.from(container.querySelectorAll<HTMLElement>('[style]')).find(
      (el) => el.style.width === '320px',
    );
    expect(styled).toBeDefined();
    expect(styled?.style.getPropertyValue('--field-accent')).not.toBe('');
  });
});
