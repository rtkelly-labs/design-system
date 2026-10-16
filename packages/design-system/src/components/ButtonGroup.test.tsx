import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { ButtonGroup } from './ButtonGroup';
import { findHueCollisions } from './buttonHues';
import type { ButtonColourRole } from './buttonHues';

const accent = (role: 'primary' | 'secondary' | 'tertiary' | 'quiet'): ButtonColourRole => ({
  kind: 'accent',
  role,
});
const danger: ButtonColourRole = { kind: 'intent', role: 'danger' };
const neutral: ButtonColourRole = { kind: 'neutral' };

describe('findHueCollisions', () => {
  it('flags danger beside tertiary on every Level, because both are pink/red there', () => {
    const hits = findHueCollisions([accent('tertiary'), danger]);
    expect(hits.map((h) => h.level).sort()).toEqual(['midnight', 'sketch']);
    expect(hits.map((h) => h.hue).sort()).toEqual(['pink', 'red']);
    expect(hits[0]?.danger).toEqual([1]);
    expect(hits[0]?.others).toEqual([0]);
  });

  it('passes danger beside a neutral button', () => {
    expect(findHueCollisions([neutral, danger, neutral])).toEqual([]);
  });

  it('passes danger beside primary, whose hue differs on both Levels', () => {
    expect(findHueCollisions([accent('primary'), danger])).toEqual([]);
  });

  it('does not count two danger buttons as a collision', () => {
    expect(findHueCollisions([danger, danger])).toEqual([]);
  });

  it('passes a group with no danger button at all', () => {
    expect(findHueCollisions([accent('tertiary'), accent('tertiary')])).toEqual([]);
  });

  it('can be narrowed to one Level', () => {
    expect(findHueCollisions([accent('tertiary'), danger], ['sketch'])).toHaveLength(1);
  });
});

describe('ButtonGroup', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renders role="group"', () => {
    render(
      <ButtonGroup aria-label="Actions">
        <Button>ONE</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole('group', { name: 'Actions' })).toBeDefined();
  });

  it('warns once when a danger button sits beside a same-hue button', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ButtonGroup>
        <Button variant="tertiary">KEEP</Button>
        <Button variant="danger">DELETE</Button>
        <Button variant="tertiary">ALSO</Button>
      </ButtonGroup>,
    );
    // One message naming both Levels, not repeated for the third button.
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain('pink on midnight');
    expect(String(warn.mock.calls[0]?.[0])).toContain('red on sketch');
    expect(String(warn.mock.calls[0]?.[0])).toContain('danger');
  });

  it('is silent for danger beside quiet or secondary', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <ButtonGroup>
        <Button>CANCEL</Button>
        <Button variant="secondary">SAVE</Button>
        <Button variant="danger">DELETE</Button>
      </ButtonGroup>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('is silent outside a group, however the buttons are coloured', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <Button variant="tertiary">A</Button>
        <Button variant="danger">B</Button>
      </>,
    );
    expect(warn).not.toHaveBeenCalled();
  });
});
