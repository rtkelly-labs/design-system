import { describe, expect, it } from 'vitest';
import {
  ACCENT_CLASS_MAPS,
  accentFocusClass,
  accentHoverEdgeClass,
  accentTextClass,
  canonicalAccent,
  type CanonicalAccent,
} from './accentClasses';
import { accentVar, type AccentToken } from './theme';

const ROLES: CanonicalAccent[] = [
  'accent-primary',
  'accent-secondary',
  'accent-tertiary',
  'accent-quiet',
  'intent-info',
  'intent-success',
  'intent-warning',
  'intent-danger',
];

const TOKENS: AccentToken[] = [
  'primary',
  'secondary',
  'tertiary',
  'quiet',
  'info',
  'success',
  'warning',
  'danger',
];

describe('canonicalAccent', () => {
  it('maps each semantic token to its own role', () => {
    const semantic = TOKENS.slice(0, 8);
    const roles = semantic.map((t) => canonicalAccent(t));

    expect(new Set(roles).size).toBe(8);
    expect(roles).toEqual(ROLES);
  });

  it('defaults to the primary accent', () => {
    expect(canonicalAccent(undefined)).toBe('accent-primary');
  });

  it('honours an explicit fallback for an absent token', () => {
    expect(canonicalAccent(undefined, 'danger')).toBe('intent-danger');
  });

  // Mirrors accentVar: a mistyped prop should render something legible rather
  // than dropping the class and leaving the element unstyled.
  it('degrades an unrecognised token to the primary accent', () => {
    const bogus = 'chartreuse' as AccentToken;

    expect(canonicalAccent(bogus)).toBe('accent-primary');
    expect(canonicalAccent(bogus, 'danger')).toBe('accent-primary');
  });
});

/**
 * The class maps and `accentVar` are two encodings of one mapping. If they ever
 * disagree, a component's Tailwind class and its inline style would resolve the
 * same prop to different colours — the kind of drift that only shows up in a
 * screenshot of one particular story.
 */
describe('class maps agree with accentVar', () => {
  it.each(TOKENS)('%s resolves to the same role in both encodings', (token) => {
    expect(accentVar(token)).toBe(`var(--ds-${canonicalAccent(token)})`);
  });
});

describe('class maps', () => {
  it.each(Object.entries(ACCENT_CLASS_MAPS))('%s covers every role', (_name, map) => {
    expect(Object.keys(map).sort()).toEqual([...ROLES].sort());
  });

  // Tailwind's scanner reads source text, so a class assembled at runtime
  // produces no CSS. Every value has to be a literal utility string.
  it.each(Object.entries(ACCENT_CLASS_MAPS))(
    '%s contains only literal utility classes',
    (_name, map) => {
      for (const value of Object.values(map)) {
        expect(value).not.toContain('${');
        expect(value).not.toContain('undefined');
        expect(value.trim()).toBe(value);
        expect(value.length).toBeGreaterThan(0);
      }
    },
  );

  it('names the same role in every class it emits', () => {
    for (const role of ROLES) {
      expect(accentTextClass(role === 'accent-primary' ? 'primary' : undefined)).toContain(
        'accent-primary',
      );
    }

    for (const token of TOKENS) {
      const role = canonicalAccent(token);

      expect(accentTextClass(token)).toBe(`text-${role}`);
      expect(accentFocusClass(token)).toBe(`focus:border-${role} focus:ring-${role}`);
      expect(accentHoverEdgeClass(token)).toBe(
        `hover:border-${role} hover:shadow-hard-${role}`,
      );
    }
  });

  it('emits a distinct class per role', () => {
    const texts = ROLES.map((role) => ACCENT_CLASS_MAPS.TEXT[role]);

    expect(new Set(texts).size).toBe(ROLES.length);
  });

  // The hover shadow references --shadow-hard-<role>, which only exists
  // because theme.css declares it. A typo here would silently render no
  // shadow at all.
  it('references hard-shadow tokens that theme.css declares', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const css = readFileSync(resolve(process.cwd(), 'src/theme.css'), 'utf8');

    for (const role of ROLES) {
      expect(css, `--shadow-hard-${role} missing from theme.css`).toContain(
        `--shadow-hard-${role}:`,
      );
    }
  });
});
