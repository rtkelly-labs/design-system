import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';
import { Fieldset, Legend } from './Fieldset';
import { Input } from './Input';

function referencedText(element: HTMLElement, attribute: string): string {
  return (element.getAttribute(attribute) ?? '')
    .split(' ')
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? `<missing #${id}>`)
    .join(' ');
}

/** A non-radio grouping — the case that says `Fieldset` is not a radio part. */
function Regions(props: Partial<Parameters<typeof Fieldset>[0]>) {
  return (
    <Fieldset legend="Regions" {...props}>
      <Checkbox name="region" value="eu" label="Europe" />
      <Checkbox name="region" value="us" label="North America" />
    </Fieldset>
  );
}

describe('Fieldset', () => {
  it('is a group named by its legend', () => {
    render(<Regions />);

    const group = screen.getByRole('group', { name: 'Regions' });
    expect(group.tagName).toBe('FIELDSET');
  });

  it('takes a Legend of its own among the children', () => {
    render(
      <Fieldset>
        <Legend>
          Notify me about <code>main</code>
        </Legend>
        <Checkbox label="Pushes" />
      </Fieldset>,
    );

    expect(screen.getByRole('group', { name: 'Notify me about main' })).toBeDefined();
  });

  it('merges a Legend className onto the shared label typography', () => {
    render(
      <Fieldset>
        <Legend className="mb-2" data-testid="legend">
          Regions
        </Legend>
      </Fieldset>,
    );

    const legend = screen.getByTestId('legend');
    expect(legend.className).toContain('mb-2');
    expect(legend.className).toContain('uppercase');
  });

  it('describes the group with its helper text', () => {
    render(<Regions helperText="Where the replicas run" />);

    expect(referencedText(screen.getByRole('group'), 'aria-describedby')).toBe('> Where the replicas run');
  });

  it('describes the group — and each control in it — with the group error', () => {
    render(<Regions error="Choose at least one region" helperText="Standing guidance" />);

    const error = screen.getByText('> Choose at least one region');
    expect(error.textContent).toBe('> Choose at least one region');
    expect(screen.queryByText('> Standing guidance')).toBeNull();
    expect(referencedText(screen.getByRole('group'), 'aria-describedby')).toBe('> Choose at least one region');
    for (const box of screen.getAllByRole('checkbox')) {
      expect((box.getAttribute('aria-describedby') ?? '').split(' ')).toContain(error.id);
    }
  });

  // `aria-invalid` is not a permitted attribute on the `group` role, so the
  // state travels as a data attribute for styling and the error is announced
  // through the description instead.
  it('marks itself invalid without an aria attribute the role does not allow', () => {
    render(<Regions error="Choose at least one region" />);

    const group = screen.getByRole('group');
    expect(group.hasAttribute('data-invalid')).toBe(true);
    expect(group.hasAttribute('aria-invalid')).toBe(false);
  });

  it('disables every control inside it', () => {
    const onCheckedChange = vi.fn();
    render(
      <Fieldset legend="Window" disabled>
        <Checkbox label="Weekends" onCheckedChange={onCheckedChange} />
        <Input label="Starts" />
      </Fieldset>,
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox').hasAttribute('data-disabled')).toBe(true);
    expect((screen.getByRole('textbox') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole('group') as HTMLFieldSetElement).disabled).toBe(true);
  });

  it('forwards a ref to the fieldset, and spreads props and className onto it', () => {
    const ref = { current: null as HTMLFieldSetElement | null };
    render(<Regions ref={ref} data-testid="regions" className="mt-4" />);

    const group = screen.getByRole('group');
    expect(ref.current).toBe(group);
    expect(screen.getByTestId('regions')).toBe(group);
    expect(group.className).toContain('mt-4');
    expect(group.className).toContain('border-0');
  });

  it('leaves each control its own name and submission', () => {
    const { container } = render(
      <form>
        <Fieldset legend="Regions">
          <Checkbox name="region" value="eu" label="Europe" defaultChecked />
          <Checkbox name="region" value="us" label="North America" defaultChecked />
        </Fieldset>
      </form>,
    );
    const form = container.querySelector('form')!;
    let data: FormData | undefined;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      data = new FormData(form);
    });
    fireEvent.submit(form);

    expect(screen.getByRole('checkbox', { name: 'Europe' })).toBeDefined();
    expect(data?.getAll('region')).toEqual(['eu', 'us']);
  });
});
