import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

/** The control element itself — the `span` Base UI gives `role="checkbox"`. */
function control(): HTMLElement {
  return screen.getByRole('checkbox');
}

/** The hidden input Base UI renders for form participation. */
function hiddenInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (!input) throw new Error('no hidden input rendered');
  return input;
}

describe('Checkbox', () => {
  it('names itself from the label', () => {
    render(<Checkbox label="Accept terms" />);

    expect(screen.getByRole('checkbox', { name: 'Accept terms' })).toBe(control());
  });

  it('starts unchecked, and reports checked once ticked', () => {
    render(<Checkbox label="Accept terms" />);

    expect(control().getAttribute('aria-checked')).toBe('false');
    fireEvent.click(control());
    expect(control().getAttribute('aria-checked')).toBe('true');
  });

  // Space, not Enter: a checkbox is toggled by Space and Enter submits the
  // form around it. Base UI owns both behaviours, and this is the assertion
  // that says so rather than a reviewer trying it once.
  it('toggles on Space', () => {
    render(<Checkbox label="Accept terms" />);

    control().focus();
    expect(document.activeElement).toBe(control());

    fireEvent.keyDown(control(), { key: ' ', code: 'Space' });
    fireEvent.keyUp(control(), { key: ' ', code: 'Space' });

    expect(control().getAttribute('aria-checked')).toBe('true');
  });

  // The label is a hit target because the control is rendered *inside* it and
  // `htmlFor` points at the hidden input. A sibling label would associate by
  // `aria-labelledby` and the words would do nothing when clicked.
  it('toggles when the label text is clicked', () => {
    render(<Checkbox label="Accept terms" />);

    fireEvent.click(screen.getByText('Accept terms'));

    expect(control().getAttribute('aria-checked')).toBe('true');
  });

  // The other half of that: clicking the box must toggle once, not twice. The
  // box sits inside a `<label>`, so a missing `preventDefault` would have the
  // label forward a second click to the hidden input and cancel the first.
  it('toggles once when the box itself is clicked', () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Accept terms" onCheckedChange={onCheckedChange} />);

    fireEvent.click(control());

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('honours a controlled value', () => {
    function Controlled() {
      const [checked, setChecked] = useState(true);
      return <Checkbox label="Accept terms" checked={checked} onCheckedChange={setChecked} />;
    }
    render(<Controlled />);

    expect(control().getAttribute('aria-checked')).toBe('true');
    fireEvent.click(control());
    expect(control().getAttribute('aria-checked')).toBe('false');
  });

  it('refuses to move while the caller holds it', () => {
    render(<Checkbox label="Accept terms" checked={false} />);

    fireEvent.click(control());

    expect(control().getAttribute('aria-checked')).toBe('false');
  });

  it('starts from defaultChecked when uncontrolled', () => {
    render(<Checkbox label="Accept terms" defaultChecked />);

    expect(control().getAttribute('aria-checked')).toBe('true');
  });

  // `aria-checked="mixed"` and the DOM property, neither of which this package
  // computes: `indeterminate` is passed straight through.
  it('announces the mixed state and sets the DOM property', () => {
    const { container } = render(<Checkbox label="Select all" indeterminate />);

    expect(control().getAttribute('aria-checked')).toBe('mixed');
    expect(hiddenInput(container).indeterminate).toBe(true);
    expect(screen.getByText('-')).toBeDefined();
  });

  it('does not toggle while disabled', () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Accept terms" disabled onCheckedChange={onCheckedChange} />);

    fireEvent.click(control());

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(control().getAttribute('aria-checked')).toBe('false');
    expect(control().hasAttribute('data-disabled')).toBe(true);
  });

  it('marks itself required', () => {
    render(<Checkbox label="Accept terms" required />);

    expect(control().getAttribute('aria-required')).toBe('true');
  });

  it('shows helper text, and describes the control with it', () => {
    render(<Checkbox label="Accept terms" helperText="You can withdraw consent later" />);

    expect(screen.getByText('> You can withdraw consent later')).toBeDefined();
    expect(control().getAttribute('aria-describedby')).toBeTruthy();
  });

  it('replaces helper text with the error, and marks the control invalid', () => {
    render(<Checkbox label="Accept terms" helperText="Standing guidance" error="Required to continue" />);

    expect(screen.getByText(/^> /).textContent).toBe('> Required to continue');
    expect(screen.queryByText('> Standing guidance')).toBeNull();
    expect(control().hasAttribute('data-invalid')).toBe(true);
  });

  it('prefers an explicit id over the generated one', () => {
    const { container } = render(<Checkbox label="Accept terms" id="terms" />);

    expect(hiddenInput(container).id).toBe('terms');
  });

  it('forwards a ref to the control', () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(<Checkbox label="Accept terms" ref={ref} />);

    expect(ref.current).toBe(control());
  });

  it('merges a caller className without dropping its own', () => {
    render(<Checkbox label="Accept terms" className="mt-4" />);

    expect(control().className).toContain('mt-4');
    expect(control().className).toContain('border-2');
  });

  it('spreads unrecognised props onto the control', () => {
    render(<Checkbox label="Accept terms" data-testid="terms-box" title="Terms" />);

    expect(screen.getByTestId('terms-box')).toBe(control());
    expect(control().getAttribute('title')).toBe('Terms');
  });

  it('drives the accent from a role, as a custom property', () => {
    render(<Checkbox label="Accept terms" accent="danger" />);

    expect(control().style.getPropertyValue('--field-accent')).toBe('var(--ds-intent-danger)');
  });
});

/**
 * Native form submission — the part hand-rolled checkboxes get wrong.
 *
 * A `<span role="checkbox">` submits nothing. Base UI renders a hidden input
 * beside it, which is the entire reason this component does not render one,
 * and this is the assertion that the wiring is real rather than assumed.
 */
describe('Checkbox in a form', () => {
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

  it('appears in FormData under its name when checked', () => {
    const { container } = render(
      <form>
        <Checkbox name="terms" label="Accept terms" defaultChecked />
      </form>,
    );

    expect(submit(container.querySelector('form')!).get('terms')).toBe('on');
  });

  it('submits its own value when one is given', () => {
    const { container } = render(
      <form>
        <Checkbox name="plan" value="pro" label="Pro plan" defaultChecked />
      </form>,
    );

    expect(submit(container.querySelector('form')!).get('plan')).toBe('pro');
  });

  it('submits nothing while unchecked, as a native checkbox does', () => {
    const { container } = render(
      <form>
        <Checkbox name="terms" label="Accept terms" />
      </form>,
    );

    expect(submit(container.querySelector('form')!).has('terms')).toBe(false);
  });

  it('merges a caller style with the accent rather than replacing it', () => {
    const { container } = render(
      <Checkbox label="Accept" defaultChecked style={{ width: '320px' }} />,
    );
    // The element carrying the caller's style must still carry the accent:
    // without it the checked fill has no colour and the state is invisible.
    const styled = Array.from(container.querySelectorAll<HTMLElement>('[style]')).find(
      (el) => el.style.width === '320px',
    );
    expect(styled).toBeDefined();
    expect(styled?.style.getPropertyValue('--field-accent')).not.toBe('');
  });

  it('keeps a disabled checked box legibly checked (issue 270)', () => {
    const { container } = render(<Checkbox label="Locked on" defaultChecked disabled />);
    const control = container.querySelector<HTMLElement>('[data-slot="checkbox"]')!;
    const mark = container.querySelector<HTMLElement>('[data-slot="checkbox-indicator"]')!;
    expect(control.hasAttribute('data-checked')).toBe(true);
    expect(control.hasAttribute('data-disabled')).toBe(true);
    // The disabled surface wins by selector, not by CSS source order, and the
    // mark changes ink so it stays visible on it.
    expect(control.className).toContain('data-[checked]:data-[disabled]:bg-surface-sunken');
    expect(mark.hasAttribute('data-disabled')).toBe(true);
    expect(mark.className).toContain('data-[disabled]:text-content-muted');
    expect(mark.textContent).not.toBe('');
  });
});
