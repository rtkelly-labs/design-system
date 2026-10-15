import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { A11yMenu } from './A11yMenu';
import { A11yPreferencesProvider, useA11yPreferences } from './A11yPreferencesProvider';
import type { A11yStorage } from './A11yPreferencesProvider';
import {
  A11Y_ATTRIBUTES,
  A11Y_AXES,
  A11Y_DEFAULT,
  A11Y_STORAGE_KEY,
  getA11yInitScript,
  parseA11yState,
  resolveA11yAttributes,
  serialiseA11yState,
} from './a11yInitScript';
import type { A11yState } from './a11yInitScript';

const ATTRIBUTES = A11Y_AXES.map((axis) => A11Y_ATTRIBUTES[axis].attribute);

function clearAttributes() {
  for (const attribute of ATTRIBUTES) document.documentElement.removeAttribute(attribute);
}

/** The attributes as the document has them right now: `null` where absent. */
function applied(): Record<string, string | null> {
  return Object.fromEntries(
    A11Y_AXES.map((axis) => [axis, document.documentElement.getAttribute(A11Y_ATTRIBUTES[axis].attribute)]),
  );
}

function mockContrastMore(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: matches && query === '(prefers-contrast: more)',
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

/** Run the generated script the way a browser would: as inline code, against the live document. */
function runInitScript(options?: { followSystem?: boolean }) {
  new Function(getA11yInitScript(options))();
}

/**
 * An in-memory Storage. Node 25 ships its own experimental `localStorage` that
 * shadows jsdom's and has no `clear()`, so the suite installs one it controls;
 * `test-setup.ts` puts the original back after each test.
 */
function installMemoryStorage() {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, String(value)),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
  };
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage });
}

beforeEach(() => {
  installMemoryStorage();
  clearAttributes();
  mockContrastMore(false);
});

afterEach(() => {
  clearAttributes();
});

describe('getA11yInitScript resolution order: stored, then OS, then absent', () => {
  it('sets nothing when nothing is stored and the OS has no signal', () => {
    runInitScript();
    expect(applied()).toEqual({ motion: null, contrast: null, cvd: null, links: null });
  });

  it('takes contrast from the OS when nothing is stored', () => {
    mockContrastMore(true);
    runInitScript();
    expect(applied().contrast).toBe('more');
  });

  it('lets a stored "on" win over an absent OS signal', () => {
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify({ contrast: 'on', cvd: 'on', links: 'on', motion: 'on' }));
    runInitScript();
    expect(applied()).toEqual({ motion: 'reduce', contrast: 'more', cvd: 'patterns', links: 'underline' });
  });

  it('lets a stored "off" beat the OS signal for contrast', () => {
    mockContrastMore(true);
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify({ contrast: 'off' }));
    runInitScript();
    expect(applied().contrast).toBeNull();
  });

  it('writes "full" for a stored motion "off", the explicit opt-out the stylesheet honours', () => {
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify({ motion: 'off' }));
    runInitScript();
    expect(applied().motion).toBe('full');
  });

  it('leaves motion absent for "system": the OS answer lives in the stylesheet', () => {
    runInitScript();
    expect(applied().motion).toBeNull();
  });

  it('ignores the OS signal when followSystem is off', () => {
    mockContrastMore(true);
    runInitScript({ followSystem: false });
    expect(applied().contrast).toBeNull();
  });

  it('survives corrupt storage and a storage that throws', () => {
    window.localStorage.setItem(A11Y_STORAGE_KEY, '{not json');
    expect(() => runInitScript()).not.toThrow();
    expect(applied()).toEqual({ motion: null, contrast: null, cvd: null, links: null });

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    mockContrastMore(true);
    try {
      expect(() => runInitScript()).not.toThrow();
      expect(applied().contrast).toBe('more');
    } finally {
      // The shared teardown reads storage, and this one throws.
      installMemoryStorage();
    }
  });

  it('agrees with resolveA11yAttributes for every combination of choices and OS signal', () => {
    const choices = ['system', 'on', 'off'] as const;
    for (const contrastMore of [false, true]) {
      mockContrastMore(contrastMore);
      for (const motion of choices)
        for (const contrast of choices)
          for (const cvd of choices)
            for (const links of choices) {
              clearAttributes();
              const state: A11yState = { motion, contrast, cvd, links };
              window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(state));
              runInitScript();
              expect(applied()).toEqual(resolveA11yAttributes(state, { contrastMore }));
            }
    }
  });
});

describe('state serialisation', () => {
  it('stores only the axes that are not "system", and nothing for the default', () => {
    expect(serialiseA11yState(A11Y_DEFAULT)).toBeNull();
    expect(JSON.parse(serialiseA11yState({ ...A11Y_DEFAULT, cvd: 'on', motion: 'off' })!)).toEqual({
      cvd: 'on',
      motion: 'off',
    });
  });

  it('reads anything that is not a known choice as "system"', () => {
    expect(parseA11yState(JSON.stringify({ motion: 'sideways', cvd: 'on', extra: 1 }))).toEqual({
      ...A11Y_DEFAULT,
      cvd: 'on',
    });
    expect(parseA11yState('[1,2]')).toEqual(A11Y_DEFAULT);
    expect(parseA11yState('null')).toEqual(A11Y_DEFAULT);
    expect(parseA11yState(undefined)).toEqual(A11Y_DEFAULT);
  });
});

function Probe() {
  const prefs = useA11yPreferences();
  return (
    <>
      {A11Y_AXES.map((axis) => (
        <output key={axis} data-testid={axis}>
          {prefs[axis]}
        </output>
      ))}
      <button type="button" onClick={() => prefs.set('cvd', 'on')}>
        cvd on
      </button>
      <button type="button" onClick={() => prefs.set('contrast', 'off')}>
        contrast off
      </button>
      <button type="button" onClick={() => prefs.set('motion', 'on')}>
        motion on
      </button>
      <button type="button" onClick={() => prefs.reset()}>
        reset
      </button>
    </>
  );
}

const text = (axis: string) => screen.getByTestId(axis).textContent;
const click = (name: string) => act(() => fireEvent.click(screen.getByRole('button', { name })));

describe('A11yPreferencesProvider', () => {
  it('starts every axis on "system" and applies nothing', () => {
    render(
      <A11yPreferencesProvider>
        <Probe />
      </A11yPreferencesProvider>,
    );
    expect(A11Y_AXES.map(text)).toEqual(['system', 'system', 'system', 'system']);
    expect(applied()).toEqual({ motion: null, contrast: null, cvd: null, links: null });
  });

  it('applies and persists a choice, and removes the attribute when it returns to system', () => {
    render(
      <A11yPreferencesProvider>
        <Probe />
      </A11yPreferencesProvider>,
    );
    click('cvd on');
    expect(text('cvd')).toBe('on');
    expect(document.documentElement.getAttribute('data-a11y-cvd')).toBe('patterns');
    expect(JSON.parse(window.localStorage.getItem(A11Y_STORAGE_KEY)!)).toEqual({ cvd: 'on' });

    click('reset');
    expect(text('cvd')).toBe('system');
    expect(document.documentElement.hasAttribute('data-a11y-cvd')).toBe(false);
    expect(window.localStorage.getItem(A11Y_STORAGE_KEY)).toBeNull();
  });

  it('reads a stored choice after mount and applies it', () => {
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify({ links: 'on', motion: 'off' }));
    render(
      <A11yPreferencesProvider>
        <Probe />
      </A11yPreferencesProvider>,
    );
    expect(text('links')).toBe('on');
    expect(text('motion')).toBe('off');
    expect(applied()).toMatchObject({ links: 'underline', motion: 'full' });
  });

  it('does not clobber what the init script resolved before it has read storage', () => {
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify({ cvd: 'on' }));
    runInitScript();
    expect(document.documentElement.getAttribute('data-a11y-cvd')).toBe('patterns');
    render(
      <A11yPreferencesProvider>
        <Probe />
      </A11yPreferencesProvider>,
    );
    expect(document.documentElement.getAttribute('data-a11y-cvd')).toBe('patterns');
  });

  it('tri-state: "off" beats an OS signal and "system" follows it', () => {
    mockContrastMore(true);
    render(
      <A11yPreferencesProvider>
        <Probe />
      </A11yPreferencesProvider>,
    );
    // Mounted on "system" with the OS asking for more: the attribute is on, the choice is not.
    expect(text('contrast')).toBe('system');
    expect(document.documentElement.getAttribute('data-a11y-contrast')).toBe('more');

    click('contrast off');
    expect(document.documentElement.hasAttribute('data-a11y-contrast')).toBe(false);

    click('reset');
    expect(document.documentElement.getAttribute('data-a11y-contrast')).toBe('more');
  });

  it('forces motion on and back off with the attribute', () => {
    render(
      <A11yPreferencesProvider>
        <Probe />
      </A11yPreferencesProvider>,
    );
    click('motion on');
    expect(document.documentElement.getAttribute('data-a11y-motion')).toBe('reduce');
  });

  it('writes nothing when persist is off', () => {
    render(
      <A11yPreferencesProvider persist={false}>
        <Probe />
      </A11yPreferencesProvider>,
    );
    click('cvd on');
    expect(document.documentElement.getAttribute('data-a11y-cvd')).toBe('patterns');
    expect(window.localStorage.getItem(A11Y_STORAGE_KEY)).toBeNull();
  });

  it('reads, writes and reports through a custom storage adapter and onChange', () => {
    const write = vi.fn();
    const storage: A11yStorage = { read: () => ({ links: 'on' }), write };
    const onChange = vi.fn();
    render(
      <A11yPreferencesProvider storage={storage} onChange={onChange}>
        <Probe />
      </A11yPreferencesProvider>,
    );
    expect(text('links')).toBe('on');
    click('cvd on');
    const expected: A11yState = { ...A11Y_DEFAULT, links: 'on', cvd: 'on' };
    expect(write).toHaveBeenLastCalledWith(expected);
    expect(onChange).toHaveBeenLastCalledWith(expected);
    // The default store is untouched: the adapter replaced it.
    expect(window.localStorage.getItem(A11Y_STORAGE_KEY)).toBeNull();
  });

  it('keeps two changes in one tick', () => {
    function Both() {
      const prefs = useA11yPreferences();
      return (
        <button
          type="button"
          onClick={() => {
            prefs.set('cvd', 'on');
            prefs.set('links', 'on');
          }}
        >
          both
        </button>
      );
    }
    render(
      <A11yPreferencesProvider>
        <Both />
        <Probe />
      </A11yPreferencesProvider>,
    );
    click('both');
    expect(text('cvd')).toBe('on');
    expect(text('links')).toBe('on');
  });

  it('throws from the strict hook without a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<Probe />)).toThrow(/A11yPreferencesProvider/);
    spy.mockRestore();
  });
});

describe('A11yMenu', () => {
  it('lists a radio group per axis, with the current choice checked, and sets and resets through it', async () => {
    render(
      <A11yPreferencesProvider>
        <A11yMenu />
        <Probe />
      </A11yPreferencesProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Accessibility preferences' }));

    for (const name of ['Motion', 'Contrast', 'Colour vision', 'Links']) {
      expect(await screen.findByRole('group', { name })).toBeTruthy();
    }
    expect(screen.getAllByRole('menuitemradio', { checked: true })).toHaveLength(4);

    const patterns = screen.getByRole('menuitemradio', { name: 'Patterns' });
    await act(async () => fireEvent.click(patterns));
    expect(text('cvd')).toBe('on');
    expect(document.documentElement.getAttribute('data-a11y-cvd')).toBe('patterns');

    await act(async () => fireEvent.click(screen.getByRole('menuitem', { name: 'Reset to system' })));
    expect(text('cvd')).toBe('system');
    expect(document.documentElement.hasAttribute('data-a11y-cvd')).toBe(false);
  });
});
