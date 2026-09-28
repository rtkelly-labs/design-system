import { createEvent, fireEvent, render, screen, within } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Checkbox } from './Checkbox';
import { ErrorSummary } from './ErrorSummary';
import type { ErrorSummaryError } from './ErrorSummary';
import { Input, TextArea } from './Input';
import { Radio, RadioGroup } from './RadioGroup';
import { Select } from './Select';
import { Switch } from './Switch';

const ERRORS: ErrorSummaryError[] = [
  { id: 'first', message: 'Enter the first value' },
  { id: 'second', message: 'Choose the second value' },
];

function summary(): HTMLElement {
  return screen.getByRole('region', { name: 'There is a problem' });
}

function link(name: string): HTMLElement {
  return within(summary()).getByRole('link', { name });
}

/** A primary click, returning whether the component cancelled the browser's own navigation. */
function click(element: HTMLElement, init: MouseEventInit = {}): boolean {
  const event = createEvent.click(element, { button: 0, ...init });
  fireEvent(element, event);
  return event.defaultPrevented;
}

describe('ErrorSummary', () => {
  describe('rendering', () => {
    it('renders nothing when there are no errors', () => {
      const { container } = render(<ErrorSummary errors={[]} />);

      expect(container.innerHTML).toBe('');
    });

    it('is a region named by its heading', () => {
      render(<ErrorSummary errors={ERRORS} />);

      const heading = screen.getByRole('heading', { level: 2, name: 'There is a problem' });
      expect(summary().getAttribute('aria-labelledby')).toBe(heading.id);
    });

    it('takes a heading of its own, at the level asked for', () => {
      render(<ErrorSummary errors={ERRORS} title="Check your answers" headingLevel={3} />);

      expect(screen.getByRole('heading', { level: 3, name: 'Check your answers' })).toBeDefined();
      expect(screen.getByRole('region', { name: 'Check your answers' })).toBeDefined();
    });

    it('lists one link per error, to the control it names', () => {
      render(<ErrorSummary errors={ERRORS} />);

      const links = within(summary()).getAllByRole('link');
      expect(links.map((a) => a.textContent)).toEqual([
        'Enter the first value',
        'Choose the second value',
      ]);
      expect(links.map((a) => a.getAttribute('href'))).toEqual(['#first', '#second']);
      expect(within(summary()).getAllByRole('listitem')).toHaveLength(2);
    });

    it('renders its children between the heading and the list', () => {
      render(
        <ErrorSummary errors={ERRORS}>
          <p>Nothing was saved.</p>
        </ErrorSummary>,
      );

      const description = summary().querySelector('[data-slot="error-summary-description"]');
      expect(description?.textContent).toBe('Nothing was saved.');
      expect(description?.previousElementSibling?.tagName).toBe('H2');
      expect(description?.nextElementSibling?.tagName).toBe('UL');
    });

    // Focus is the announcement. A live region as well would read the same
    // content twice, so its absence is asserted rather than assumed.
    it('is not a live region', () => {
      render(<ErrorSummary errors={ERRORS} />);

      expect(screen.queryByRole('alert')).toBeNull();
      expect(summary().hasAttribute('aria-live')).toBe(false);
    });
  });

  describe('focus on appearing', () => {
    it('moves focus to itself when it mounts with errors', () => {
      render(<ErrorSummary errors={ERRORS} />);

      expect(document.activeElement).toBe(summary());
      expect(summary().tabIndex).toBe(-1);
    });

    it('leaves focus alone when focusOnAppear is off', () => {
      render(<ErrorSummary errors={ERRORS} focusOnAppear={false} />);

      expect(document.activeElement).toBe(document.body);
    });

    it('moves focus when errors go from none to some, and not while they only change', () => {
      const { rerender } = render(
        <>
          <button type="submit">Save</button>
          <ErrorSummary errors={[]} />
        </>,
      );
      const submit = screen.getByRole('button', { name: 'Save' });
      submit.focus();

      rerender(
        <>
          <button type="submit">Save</button>
          <ErrorSummary errors={ERRORS} />
        </>,
      );
      expect(document.activeElement).toBe(summary());

      submit.focus();
      rerender(
        <>
          <button type="submit">Save</button>
          <ErrorSummary errors={ERRORS.slice(1)} />
        </>,
      );
      expect(document.activeElement).toBe(submit);
    });

    it('moves focus again when remounted with a new key, as a repeat failed submit does', () => {
      const { rerender } = render(
        <>
          <button type="submit">Save</button>
          <ErrorSummary key={1} errors={ERRORS} />
        </>,
      );
      const submit = screen.getByRole('button', { name: 'Save' });
      submit.focus();

      rerender(
        <>
          <button type="submit">Save</button>
          <ErrorSummary key={2} errors={ERRORS} />
        </>,
      );
      expect(document.activeElement).toBe(summary());
    });
  });

  describe('following a link', () => {
    it('focuses a text field by its id, and cancels the fragment jump', () => {
      render(
        <>
          <ErrorSummary errors={[{ id: 'name', message: 'Enter a name' }]} />
          <Input id="name" label="Name" error="Enter a name" />
        </>,
      );

      expect(click(link('Enter a name'))).toBe(true);
      expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Name' }));
    });

    it('focuses a textarea and a select by their ids', () => {
      render(
        <>
          <ErrorSummary
            errors={[
              { id: 'bio', message: 'Shorten the bio' },
              { id: 'zone', message: 'Choose a zone' },
            ]}
          />
          <TextArea id="bio" label="Bio" />
          <Select id="zone" label="Zone" options={[{ value: 'utc', label: 'UTC' }]} />
        </>,
      );

      click(link('Shorten the bio'));
      expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Bio' }));
      click(link('Choose a zone'));
      expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Zone' }));
    });

    // Issue 164: the themed Select puts its id on the listbox trigger, a
    // button, so the link lands on the element the field label names — and
    // neither on Base UI's hidden form input nor on an open list.
    it('focuses the themed Select trigger its id is on, without opening the list', () => {
      render(
        <>
          <ErrorSummary errors={[{ id: 'region', message: 'Choose a region' }]} />
          <Select
            id="region"
            name="region"
            label="Region"
            placeholder="Pick one"
            error="Choose a region"
            options={[{ value: 'eu-west-1', label: 'EU West' }]}
          />
        </>,
      );

      const trigger = screen.getByRole('combobox', { name: 'Region' });
      expect(trigger.id).toBe('region');
      expect(click(link('Choose a region'))).toBe(true);
      expect(document.activeElement).toBe(trigger);
      expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('focuses a native Select by its id', () => {
      render(
        <>
          <ErrorSummary errors={[{ id: 'region', message: 'Choose a region' }]} />
          <Select native id="region" label="Region" options={[{ value: 'eu-west-1', label: 'EU West' }]} />
        </>,
      );

      expect(click(link('Choose a region'))).toBe(true);
      expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Region' }));
      expect((document.activeElement as HTMLElement).tagName).toBe('SELECT');
    });

    // The id lands on Base UI's hidden input, which is aria-hidden and out of
    // the tab order. Focusing it would leave the reader nowhere.
    it('focuses the visible checkbox and switch, not the hidden inputs their ids are on', () => {
      render(
        <>
          <ErrorSummary
            errors={[
              { id: 'terms', message: 'Accept the terms' },
              { id: 'alerts', message: 'Choose whether to be alerted' },
            ]}
          />
          <Checkbox id="terms" label="Terms" error="Accept the terms" />
          <Switch id="alerts" label="Alerts" />
        </>,
      );

      click(link('Accept the terms'));
      expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: 'Terms' }));
      click(link('Choose whether to be alerted'));
      expect(document.activeElement).toBe(screen.getByRole('switch', { name: 'Alerts' }));
    });

    it('focuses the radio a radio group would give Tab to', () => {
      render(
        <>
          <ErrorSummary errors={[{ id: 'plan', message: 'Choose a plan' }]} />
          <RadioGroup id="plan" legend="Plan" error="Choose a plan">
            <Radio value="free" label="Free" />
            <Radio value="pro" label="Pro" />
          </RadioGroup>
        </>,
      );

      click(link('Choose a plan'));
      expect(document.activeElement).toBe(screen.getByRole('radio', { name: 'Free' }));
    });

    it('leaves a modified click to the browser', () => {
      render(
        <>
          <ErrorSummary errors={[{ id: 'name', message: 'Enter a name' }]} />
          <Input id="name" label="Name" />
        </>,
      );

      expect(click(link('Enter a name'), { metaKey: true })).toBe(false);
      expect(document.activeElement).toBe(summary());
    });

    it('falls back to the plain fragment link when nothing under the id can take focus', () => {
      render(
        <>
          <ErrorSummary
            errors={[
              { id: 'missing', message: 'Not on the page' },
              { id: 'locked', message: 'Disabled field' },
            ]}
          />
          <Input id="locked" label="Locked" disabled />
        </>,
      );

      expect(click(link('Not on the page'))).toBe(false);
      expect(click(link('Disabled field'))).toBe(false);
      expect(document.activeElement).toBe(summary());
    });
  });

  describe('component contract', () => {
    it('forwards its ref to the region', () => {
      const ref = createRef<HTMLElement>();
      render(<ErrorSummary ref={ref} errors={ERRORS} />);

      expect(ref.current).toBe(summary());
    });

    it('merges a caller class and style, and spreads other props', () => {
      render(
        <ErrorSummary
          errors={ERRORS}
          className="mb-8"
          style={{ maxWidth: '40rem' }}
          data-testid="summary"
          id="form-errors"
        />,
      );

      expect(summary().className).toContain('mb-8');
      expect(summary().className).toContain('border-intent-danger');
      expect(summary().style.maxWidth).toBe('40rem');
      expect(summary().dataset.testid).toBe('summary');
      expect(summary().id).toBe('form-errors');
    });

    it('holds no copy of any one form in its implementation', () => {
      const source = readFileSync(path.join(__dirname, 'ErrorSummary.tsx'), 'utf8');
      const code = source
        .split('\n')
        .filter((line) => !/^\s*(\/\/|\*|\/\*\*)/.test(line))
        .join('\n')
        .toLowerCase();
      for (const word of ['account', 'password', 'email', 'username', 'profile', 'settings']) {
        expect(code).not.toContain(word);
      }
    });
  });
});
