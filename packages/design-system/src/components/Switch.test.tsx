import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

/** The control element itself — the `span` Base UI gives `role="switch"`. */
function control(): HTMLElement {
  return screen.getByRole('switch');
}

function hiddenInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
  if (!input) throw new Error('no hidden input rendered');
  return input;
}

describe('Switch', () => {
  it('names itself from the label', () => {
    render(<Switch label="Send telemetry" />);

    expect(screen.getByRole('switch', { name: 'Send telemetry' })).toBe(control());
  });

  it('starts off, and reports on once flipped', () => {
    render(<Switch label="Send telemetry" />);

    expect(control().getAttribute('aria-checked')).toBe('false');
    fireEvent.click(control());
    expect(control().getAttribute('aria-checked')).toBe('true');
  });

  it('toggles on Space', () => {
    render(<Switch label="Send telemetry" />);

    control().focus();
    expect(document.activeElement).toBe(control());

    fireEvent.keyDown(control(), { key: ' ', code: 'Space' });
    fireEvent.keyUp(control(), { key: ' ', code: 'Space' });

    expect(control().getAttribute('aria-checked')).toBe('true');
  });

  it('toggles when the label text is clicked', () => {
    render(<Switch label="Send telemetry" />);

    fireEvent.click(screen.getByText('Send telemetry'));

    expect(control().getAttribute('aria-checked')).toBe('true');
  });

  // The track sits inside the `<label>`, so a click on it must not also be
  // forwarded by the label to the hidden input — that would toggle twice and
  // look like nothing happening.
  it('toggles once when the track itself is clicked', () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Send telemetry" onCheckedChange={onCheckedChange} />);

    fireEvent.click(control());

    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('honours a controlled value', () => {
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return <Switch label="Send telemetry" checked={checked} onCheckedChange={setChecked} />;
    }
    render(<Controlled />);

    fireEvent.click(control());
    expect(control().getAttribute('aria-checked')).toBe('true');
  });

  it('refuses to move while the caller holds it', () => {
    render(<Switch label="Send telemetry" checked={false} />);

    fireEvent.click(control());

    expect(control().getAttribute('aria-checked')).toBe('false');
  });

  it('starts from defaultChecked when uncontrolled', () => {
    render(<Switch label="Send telemetry" defaultChecked />);

    expect(control().getAttribute('aria-checked')).toBe('true');
  });

  it('does not toggle while disabled', () => {
    const onCheckedChange = vi.fn();
    render(<Switch label="Send telemetry" disabled onCheckedChange={onCheckedChange} />);

    fireEvent.click(control());

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(control().hasAttribute('data-disabled')).toBe(true);
  });

  it('marks itself required', () => {
    render(<Switch label="Send telemetry" required />);

    expect(control().getAttribute('aria-required')).toBe('true');
  });

  it('shows helper text, and describes the control with it', () => {
    render(<Switch label="Send telemetry" helperText="Counts only page views" />);

    expect(screen.getByText('> Counts only page views')).toBeDefined();
    expect(control().getAttribute('aria-describedby')).toBeTruthy();
  });

  it('replaces helper text with the error, and marks the control invalid', () => {
    render(<Switch label="Send telemetry" helperText="Standing guidance" error="Turn this on to continue" />);

    expect(screen.getByText(/^> /).textContent).toBe('> Turn this on to continue');
    expect(screen.queryByText('> Standing guidance')).toBeNull();
    expect(control().hasAttribute('data-invalid')).toBe(true);
  });

  it('prefers an explicit id over the generated one', () => {
    const { container } = render(<Switch label="Send telemetry" id="telemetry" />);

    expect(hiddenInput(container).id).toBe('telemetry');
  });

  it('forwards a ref to the control', () => {
    const ref = { current: null as HTMLSpanElement | null };
    render(<Switch label="Send telemetry" ref={ref} />);

    expect(ref.current).toBe(control());
  });

  it('merges a caller className without dropping its own', () => {
    render(<Switch label="Send telemetry" className="mt-4" />);

    expect(control().className).toContain('mt-4');
    expect(control().className).toContain('border-2');
  });

  it('spreads unrecognised props onto the control', () => {
    render(<Switch label="Send telemetry" data-testid="telemetry-switch" title="Telemetry" />);

    expect(screen.getByTestId('telemetry-switch')).toBe(control());
    expect(control().getAttribute('title')).toBe('Telemetry');
  });

  it('drives the accent from a role, as a custom property', () => {
    render(<Switch label="Send telemetry" accent="success" />);

    expect(control().style.getPropertyValue('--field-accent')).toBe('var(--ds-intent-success)');
  });
});

/**
 * Native form submission, asserted for the switch as well as the checkbox.
 *
 * A switch is the presentation most likely to be hand-rolled as a styled
 * `<div>`, and the one where the missing hidden input is least likely to be
 * noticed — the setting appears to work and simply never reaches the server.
 */
describe('Switch in a form', () => {
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

  it('appears in FormData under its name when on', () => {
    const { container } = render(
      <form>
        <Switch name="telemetry" label="Send telemetry" defaultChecked />
      </form>,
    );

    expect(submit(container.querySelector('form')!).get('telemetry')).toBe('on');
  });

  it('submits its own value when one is given', () => {
    const { container } = render(
      <form>
        <Switch name="mode" value="live" label="Live mode" defaultChecked />
      </form>,
    );

    expect(submit(container.querySelector('form')!).get('mode')).toBe('live');
  });

  it('submits nothing while off', () => {
    const { container } = render(
      <form>
        <Switch name="telemetry" label="Send telemetry" />
      </form>,
    );

    expect(submit(container.querySelector('form')!).has('telemetry')).toBe(false);
  });

  // Both controls in one form, which is the composition #238 is actually
  // about: a form that drops out of the system at its first boolean.
  it('submits alongside a Checkbox from the same form', async () => {
    const { Checkbox } = await import('./Checkbox');
    const { container } = render(
      <form>
        <Checkbox name="terms" label="Accept terms" defaultChecked />
        <Switch name="telemetry" label="Send telemetry" defaultChecked />
      </form>,
    );

    const data = submit(container.querySelector('form')!);
    expect(data.get('terms')).toBe('on');
    expect(data.get('telemetry')).toBe('on');
  });

  it('merges a caller style with the accent rather than replacing it', () => {
    const { container } = render(
      <Switch label="Telemetry" defaultChecked style={{ width: '320px' }} />,
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
