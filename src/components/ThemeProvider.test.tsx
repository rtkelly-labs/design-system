import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_LEVEL, SYSTEM_LEVEL, THEME_LEVELS, type ThemeLevel } from '../theme/levels';
import {
  getThemeInitScript,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  ThemeProvider,
  useOptionalTheme,
  useTheme,
} from './ThemeProvider';

/**
 * Everything here has a right answer that does not depend on a pixel, which is
 * `AGENTS.md`'s criterion for a unit test. Three of them are paths no visual
 * check can reach at all: the `localStorage` throw, the missing `matchMedia`,
 * and the init script, which runs before React exists.
 *
 * The level names are never written as literals. They come from `THEME_LEVELS`
 * and `SYSTEM_LEVEL`, so a rung rename moves these tests with it rather than
 * turning them red — the ladder has been renamed twice already.
 */
const [FIRST, SECOND] = THEME_LEVELS as readonly ThemeLevel[];
const OTHER = THEME_LEVELS.find((l) => l !== DEFAULT_LEVEL)!;

function setMatchMedia(prefersDark: boolean | undefined) {
  if (prefersDark === undefined) {
    // Not every environment has it — jsdom has not, historically, and a
    // ReferenceError here would take the whole render down.
    Reflect.deleteProperty(window, 'matchMedia');
    return;
  }
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockReturnValue({ matches: prefersDark }),
  });
}

function Probe() {
  const { level, setLevel, cycleLevel, levels } = useTheme();
  return (
    <div>
      <span data-testid="level">{level}</span>
      <span data-testid="levels">{levels.join(',')}</span>
      <button type="button" onClick={() => setLevel(OTHER)}>
        set
      </button>
      <button type="button" onClick={cycleLevel}>
        cycle
      </button>
    </div>
  );
}

const level = () => screen.getByTestId('level').textContent;
const root = () => document.documentElement;

beforeEach(() => {
  window.localStorage.clear();
  root().removeAttribute(THEME_ATTRIBUTE);
  root().classList.remove(...THEME_LEVELS);
  setMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('resolving the level after hydration', () => {
  it('trusts the attribute the init script already set over re-deriving it', () => {
    root().setAttribute(THEME_ATTRIBUTE, OTHER);
    window.localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_LEVEL);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    // Storage says one thing and the attribute another. The attribute wins,
    // because it is what the user is already looking at — re-deriving would
    // repaint the page out from under them.
    expect(level()).toBe(OTHER);
  });

  it('ignores an attribute that names no level', () => {
    root().setAttribute(THEME_ATTRIBUTE, 'solarized');
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(level()).toBe(DEFAULT_LEVEL);
  });

  it('falls back to what was persisted', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, OTHER);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(level()).toBe(OTHER);
  });

  it('falls back to the OS preference when nothing is persisted', () => {
    setMatchMedia(true);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(level()).toBe(SYSTEM_LEVEL.dark);
  });

  it('maps a light OS preference onto the light rung', () => {
    setMatchMedia(false);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(level()).toBe(SYSTEM_LEVEL.light);
  });

  it('lands on the default when there is nothing to read', () => {
    setMatchMedia(undefined);
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(level()).toBe(DEFAULT_LEVEL);
  });

  it('starts at the default on the very first render, before any effect', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, OTHER);
    // Server and first client render must agree or React reports a hydration
    // mismatch, so the stored value may not be read in a state initialiser.
    // This is the assertion that stops that regression coming back.
    let first: string | null = null;
    function Capture() {
      first ??= useTheme().level;
      return null;
    }
    render(
      <ThemeProvider>
        <Capture />
      </ThemeProvider>,
    );
    expect(first).toBe(DEFAULT_LEVEL);
  });
});

describe('opting out', () => {
  it('does not read storage when persist is off', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, OTHER);
    render(
      <ThemeProvider persist={false} defaultLevel={DEFAULT_LEVEL}>
        <Probe />
      </ThemeProvider>,
    );
    expect(level()).toBe(DEFAULT_LEVEL);
  });

  it('does not write storage when persist is off', () => {
    render(
      <ThemeProvider persist={false}>
        <Probe />
      </ThemeProvider>,
    );
    act(() => screen.getByText('set').click());
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('does not consult the OS when followSystem is off', () => {
    setMatchMedia(true);
    render(
      <ThemeProvider followSystem={false} defaultLevel={DEFAULT_LEVEL}>
        <Probe />
      </ThemeProvider>,
    );
    expect(level()).toBe(DEFAULT_LEVEL);
  });
});

describe('the Safari private-mode path', () => {
  it('renders when reading storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(() =>
      render(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>,
      ),
    ).not.toThrow();
    expect(level()).toBe(SYSTEM_LEVEL.light);
  });

  it('renders when writing storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(() => act(() => screen.getByText('set').click())).not.toThrow();
    // The choice is still live in this session; only its persistence was lost.
    expect(level()).toBe(OTHER);
  });
});

describe('scoped mode', () => {
  it('never touches documentElement', () => {
    render(
      <ThemeProvider scoped defaultLevel={OTHER}>
        <Probe />
      </ThemeProvider>,
    );
    expect(root().getAttribute(THEME_ATTRIBUTE)).toBeNull();
    expect(root().className).not.toContain(OTHER);
  });

  it('never persists, so a preview cannot overwrite the real choice', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_LEVEL);
    render(
      <ThemeProvider scoped defaultLevel={OTHER}>
        <Probe />
      </ThemeProvider>,
    );
    act(() => screen.getByText('cycle').click());
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(DEFAULT_LEVEL);
  });

  it('carries the level on its own wrapper instead', () => {
    const { container } = render(
      <ThemeProvider scoped defaultLevel={OTHER} className="preview">
        <Probe />
      </ThemeProvider>,
    );
    const wrapper = container.querySelector('.preview')!;
    expect(wrapper.getAttribute(THEME_ATTRIBUTE)).toBe(OTHER);
  });
});

describe('applying the level to the document', () => {
  it('sets the attribute and the mirroring class', () => {
    render(
      <ThemeProvider defaultLevel={FIRST}>
        <Probe />
      </ThemeProvider>,
    );
    expect(root().getAttribute(THEME_ATTRIBUTE)).toBe(FIRST);
    expect(root().classList.contains(FIRST)).toBe(true);
  });

  it('removes the previous level class rather than accumulating them', () => {
    render(
      <ThemeProvider defaultLevel={FIRST} followSystem={false}>
        <Probe />
      </ThemeProvider>,
    );
    act(() => screen.getByText('cycle').click());
    const applied = THEME_LEVELS.filter((l) => root().classList.contains(l));
    // Two level classes at once is the bug: whichever rule comes later in the
    // stylesheet wins, which is not a decision this component gets to make.
    expect(applied).toHaveLength(1);
    expect(applied[0]).not.toBe(FIRST);
  });

  it('persists the chosen level', () => {
    render(
      <ThemeProvider defaultLevel={FIRST}>
        <Probe />
      </ThemeProvider>,
    );
    act(() => screen.getByText('set').click());
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(OTHER);
  });

  it('cycles through every rung and wraps', () => {
    render(
      <ThemeProvider defaultLevel={FIRST} followSystem={false}>
        <Probe />
      </ThemeProvider>,
    );
    const seen = [level()];
    for (let i = 0; i < THEME_LEVELS.length; i += 1) {
      act(() => screen.getByText('cycle').click());
      seen.push(level());
    }
    expect(seen.slice(0, -1).sort()).toEqual([...THEME_LEVELS].sort());
    expect(seen.at(-1)).toBe(FIRST);
  });

  it('publishes the full ladder to consumers', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('levels').textContent).toBe(THEME_LEVELS.join(','));
  });
});

describe('the hooks', () => {
  it('useTheme throws outside a provider, rather than silently reading a default', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow();
  });

  it('useOptionalTheme returns undefined outside a provider', () => {
    let value: unknown = 'unset';
    function Optional() {
      value = useOptionalTheme();
      return null;
    }
    render(<Optional />);
    expect(value).toBeUndefined();
  });
});

describe('getThemeInitScript', () => {
  /** Run the script the way a browser would, and report what it applied. */
  function run(script: string): string | null {
    root().removeAttribute(THEME_ATTRIBUTE);
    // eslint-disable-next-line no-new-func -- executing the emitted script is
    // the point: asserting on its source would pass for a script that throws.
    new Function(script)();
    return root().getAttribute(THEME_ATTRIBUTE);
  }

  it('applies a persisted level before any React code runs', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, SECOND);
    expect(run(getThemeInitScript())).toBe(SECOND);
  });

  it('rejects a persisted value that names no level', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'solarized');
    expect(run(getThemeInitScript())).toBe(SYSTEM_LEVEL.light);
  });

  it('follows the OS preference when nothing is persisted', () => {
    setMatchMedia(true);
    expect(run(getThemeInitScript())).toBe(SYSTEM_LEVEL.dark);
  });

  it('uses the given default when followSystem is off', () => {
    setMatchMedia(true);
    expect(run(getThemeInitScript({ defaultLevel: SECOND, followSystem: false }))).toBe(SECOND);
  });

  it('survives storage throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(run(getThemeInitScript())).toBe(SYSTEM_LEVEL.light);
  });

  it('survives a missing matchMedia', () => {
    setMatchMedia(undefined);
    expect(run(getThemeInitScript())).toBe(SYSTEM_LEVEL.light);
  });

  it('agrees with the provider on the level it resolves', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, SECOND);
    const fromScript = run(getThemeInitScript());
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    // The whole point of the script is that the provider then adopts what it
    // set. If these two ever disagree the page flashes one level and settles
    // on another, which is the bug the script exists to prevent.
    expect(level()).toBe(fromScript);
  });
});
