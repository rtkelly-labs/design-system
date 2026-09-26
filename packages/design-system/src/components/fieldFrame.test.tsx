import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './Checkbox';
import { FieldFrame, FieldItem, FieldMessage, GroupFrame, accentStyle } from './fieldFrame';
import { Fieldset } from './Fieldset';
import { Input, TextArea } from './Input';
import { Radio, RadioGroup } from './RadioGroup';
import { Select } from './Select';
import { Switch } from './Switch';

/**
 * The frame is shared by every field control, so what is asserted here is the part
 * none of them should have to re-test: which of `error` and `helperText` is
 * shown, and where the label goes in each layout.
 */
describe('FieldFrame', () => {
  it('stacks the label above the control', () => {
    const { container } = render(
      <FieldFrame label="Api Key">
        <input aria-label="control" />
      </FieldFrame>,
    );

    const label = container.querySelector('label');
    expect(label?.textContent).toBe('Api Key');
    expect(label?.querySelector('input')).toBeNull();
  });

  it('puts the control inside the label when inline', () => {
    const { container } = render(
      <FieldFrame label="Accept terms" layout="inline">
        <input aria-label="control" />
      </FieldFrame>,
    );

    const label = container.querySelector('label');
    expect(label?.textContent).toBe('Accept terms');
    expect(label?.querySelector('input')).not.toBeNull();
  });

  it('renders the control alone when an inline field has no label', () => {
    const { container } = render(
      <FieldFrame layout="inline">
        <input aria-label="control" />
      </FieldFrame>,
    );

    expect(container.querySelector('label')).toBeNull();
    expect(screen.getByLabelText('control')).toBeDefined();
  });

  it('shows helper text when there is no error', () => {
    render(
      <FieldFrame label="Api Key" helperText="32 characters">
        <input aria-label="control" />
      </FieldFrame>,
    );

    expect(screen.getByText('> 32 characters')).toBeDefined();
  });

  it('replaces helper text with the error', () => {
    render(
      <FieldFrame label="Api Key" helperText="32 characters" error="Too short">
        <input aria-label="control" />
      </FieldFrame>,
    );

    // Described rather than announced: see the field error contract below.
    expect(screen.getByText('> Too short').hasAttribute('role')).toBe(false);
    expect(screen.queryByText('> 32 characters')).toBeNull();
  });

  it('marks the field disabled so the label greys with the control', () => {
    const { container } = render(
      <FieldFrame label="Api Key" disabled layout="inline">
        <input aria-label="control" />
      </FieldFrame>,
    );

    expect(container.querySelector('label')?.hasAttribute('data-disabled')).toBe(true);
  });

  it('forwards a ref and spreads unrecognised props onto the wrapper', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <FieldFrame label="Api Key" ref={ref} data-testid="frame">
        <input aria-label="control" />
      </FieldFrame>,
    );

    expect(ref.current).toBe(screen.getByTestId('frame'));
  });

  it('carries the accent as a custom property rather than a class', () => {
    expect(accentStyle('warning')).toEqual({ '--field-accent': 'var(--ds-intent-warning)' });
  });
});

/**
 * The group arrangement of the same contract (#239). What is asserted here is
 * the placement both `Fieldset` and `RadioGroup` rely on, not either one's
 * behaviour.
 */
describe('GroupFrame', () => {
  it('renders a fieldset, with the message after it rather than inside it', () => {
    const { container } = render(
      <GroupFrame error="Choose one">
        <input aria-label="control" />
      </GroupFrame>,
    );

    const fieldset = container.querySelector('fieldset');
    const error = screen.getByText('> Choose one');
    expect(fieldset).not.toBeNull();
    expect(fieldset?.contains(error)).toBe(false);
    expect(fieldset?.getAttribute('aria-describedby')).toBe(error.id);
  });

  it('points at no message when there is none', () => {
    const { container } = render(
      <GroupFrame>
        <input aria-label="control" />
      </GroupFrame>,
    );

    expect(container.querySelector('fieldset')?.hasAttribute('aria-describedby')).toBe(false);
  });

  it('renders as the element it is given', () => {
    render(
      <GroupFrame render={<div role="radiogroup" aria-label="Choice" />} helperText="Guidance">
        <span />
      </GroupFrame>,
    );

    expect(screen.getByRole('radiogroup').tagName).toBe('DIV');
    expect(document.querySelector('fieldset')).toBeNull();
  });
});

// An item is only meaningful inside a group's field — Base UI refuses a
// `Field.Item` with no `Field.Root` above it — so each is rendered in one.
describe('FieldItem', () => {
  it('puts the control inside its label, with its own description', () => {
    const { container } = render(
      <GroupFrame>
        <FieldItem label="Hybrid" helperText="Both">
          <input aria-label="control" />
        </FieldItem>
      </GroupFrame>,
    );

    expect(container.querySelector('label')?.querySelector('input')).not.toBeNull();
    expect(screen.getByText('> Both')).toBeDefined();
  });

  it('renders the control alone when it has no label', () => {
    const { container } = render(
      <GroupFrame>
        <FieldItem>
          <input aria-label="control" />
        </FieldItem>
      </GroupFrame>,
    );

    expect(container.querySelector('label')).toBeNull();
    expect(screen.getByLabelText('control')).toBeDefined();
  });
});

describe('FieldMessage', () => {
  it('renders nothing when there is nothing to say', () => {
    const { container } = render(<FieldMessage />);

    expect(container.innerHTML).toBe('');
  });

  it('names its slot for the frame it sits in', () => {
    const { container } = render(
      <>
        <FieldFrame helperText="One control">
          <input aria-label="control" />
        </FieldFrame>
        <GroupFrame helperText="A set">
          <input aria-label="member" />
        </GroupFrame>
      </>,
    );

    expect(container.querySelector('[data-slot="field-description"]')?.textContent).toBe('> One control');
    expect(container.querySelector('[data-slot="fieldset-description"]')?.textContent).toBe('> A set');
  });
});

/**
 * The field error contract (#299): an error is described, never announced.
 *
 * It was `role="alert"`, and a failed submit then read every invalid field on
 * top of `ErrorSummary` taking focus. The error now reaches a screen reader
 * only as the control's description, read when the reader lands on the field.
 * Every control built on the frame is checked, because each one wires the
 * description to a different element: an `input`, a `textarea`, a listbox
 * trigger, a checkbox or switch span, a `radiogroup`, a `fieldset`.
 */
describe('field error contract', () => {
  const REGIONS = [
    { value: 'eu', label: 'Europe' },
    { value: 'us', label: 'North America' },
  ];

  const cases: Array<[string, ReactElement, () => HTMLElement]> = [
    ['Input', <Input key="i" label="Key" error="Broken" />, () => screen.getByRole('textbox')],
    ['TextArea', <TextArea key="t" label="Notes" error="Broken" />, () => screen.getByRole('textbox')],
    ['Select', <Select key="s" label="Region" options={REGIONS} error="Broken" />, () => screen.getByRole('combobox')],
    ['Checkbox', <Checkbox key="c" label="Accept" error="Broken" />, () => screen.getByRole('checkbox')],
    ['Switch', <Switch key="w" label="Telemetry" error="Broken" />, () => screen.getByRole('switch')],
    [
      'RadioGroup',
      <RadioGroup key="r" legend="Deployment" name="deployment" error="Broken">
        <Radio value="cloud" label="Cloud" />
        <Radio value="hybrid" label="Hybrid" />
      </RadioGroup>,
      () => screen.getByRole('radiogroup'),
    ],
    [
      'Fieldset',
      <Fieldset key="f" legend="Regions" error="Broken">
        <Checkbox name="region" value="eu" label="Europe" />
      </Fieldset>,
      () => screen.getByRole('group'),
    ],
  ];

  /** A live region on the element or any ancestor would announce it on insertion. */
  function liveAncestor(element: HTMLElement): Element | null {
    return element.closest('[role="alert"], [role="status"], [role="log"], [aria-live]:not([aria-live="off"])');
  }

  it.each(cases)('%s: the error is not a live region, and describes the control', (_name, ui, control) => {
    const { container } = render(ui);

    const error = screen.getByText('> Broken');
    expect(error.hasAttribute('role')).toBe(false);
    expect(error.hasAttribute('aria-live')).toBe(false);
    expect(liveAncestor(error)).toBeNull();
    expect(container.querySelector('[role="alert"], [role="status"], [aria-live]')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();

    expect(error.id).not.toBe('');
    expect((control().getAttribute('aria-describedby') ?? '').split(' ')).toContain(error.id);
  });

  it.each(cases.filter(([name]) => name !== 'Fieldset'))(
    '%s: the control is marked invalid while it has an error',
    (_name, ui, control) => {
      render(ui);
      const el = control();
      // `aria-invalid` where the role permits it; Base UI's `data-invalid` on
      // the span controls, whose hidden input carries the native state.
      expect(el.getAttribute('aria-invalid') === 'true' || el.hasAttribute('data-invalid')).toBe(true);
    },
  );
});
