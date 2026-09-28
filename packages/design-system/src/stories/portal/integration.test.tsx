import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getThemeInitScript } from '../../components/themeInitScript';
import { THEME_LEVELS } from '../../theme/levels';
import { INIT_SOURCE, LEVEL, MOUNT_SOURCE, MountedApp, TAILWIND_SOURCE } from './integration';

/**
 * The portal shows an integration snippet. This is what stops it becoming the
 * README.
 *
 * `README.md` carried the same snippet as a fenced block nobody rendered, and it
 * drifted until it named a prop that does not exist and a level that was never
 * on the ladder — #73. `check:doc-snippets` now catches that class in the docs;
 * this catches it here, where the snippet sits beside a *live* preview and the
 * two could otherwise disagree silently.
 */
describe('the portal’s integration snippet', () => {
  it('names a level that is actually on the ladder', () => {
    expect(THEME_LEVELS).toContain(LEVEL);
  });

  it('prints the same level the live preview mounts', () => {
    const printed = MOUNT_SOURCE.match(/defaultLevel="([a-z]+)"/)?.[1];
    expect(printed).toBe(LEVEL);

    render(
      <MountedApp>
        <span>preview</span>
      </MountedApp>,
    );
    const scope = screen.getByText('preview').closest('[data-theme]');
    expect(scope?.getAttribute('data-theme')).toBe(printed);
  });

  it('passes the same level to the flash guard, which is the whole point of step 3', () => {
    // A guard seeded with a different level than the provider is worse than no
    // guard: it guarantees the mismatch it exists to prevent.
    const call = INIT_SOURCE.match(/getThemeInitScript\(([^)]*)\)/)?.[0];
    expect(call).toBeDefined();
    const flashGuard = vi.fn(getThemeInitScript);
    const script = new Function('getThemeInitScript', `return ${call};`)(flashGuard);
    expect(flashGuard).toHaveBeenCalledWith({ defaultLevel: LEVEL });
    expect(script).toBe(getThemeInitScript({ defaultLevel: LEVEL }));
  });

  it('imports the theme contract that registers its own Tailwind source', () => {
    expect(TAILWIND_SOURCE).toContain('@import');
    expect(TAILWIND_SOURCE).toContain('@rtkelly13/design-system/theme.css');
  });

  it('does not write to the host page’s storage', () => {
    const before = window.localStorage.length;
    render(
      <MountedApp>
        <span>embedded</span>
      </MountedApp>,
    );
    expect(window.localStorage.length).toBe(before);
  });
});
