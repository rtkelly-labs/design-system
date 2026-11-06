import { describe, expect, it } from 'vitest';
import {
  accentVar,
  borderVar,
  fontVar,
  HEADING_EMPHASIS,
  semanticTokens,
  surfaceVar,
  textVar,
  type Emphasis,
  type Intent,
} from './theme';

describe('accentVar', () => {
  it('resolves each emphasis step to its own variable', () => {
    const emphases: Emphasis[] = ['primary', 'secondary', 'tertiary', 'quiet'];
    const resolved = emphases.map((e) => accentVar(e));

    expect(resolved).toEqual([
      'var(--ds-accent-primary)',
      'var(--ds-accent-secondary)',
      'var(--ds-accent-tertiary)',
      'var(--ds-accent-quiet)',
    ]);
    expect(new Set(resolved).size).toBe(emphases.length);
  });

  it('resolves each intent to its own variable', () => {
    const intents: Intent[] = ['info', 'success', 'warning', 'danger'];
    const resolved = intents.map((i) => accentVar(i));

    expect(resolved).toEqual([
      'var(--ds-intent-info)',
      'var(--ds-intent-success)',
      'var(--ds-intent-warning)',
      'var(--ds-intent-danger)',
    ]);
    expect(new Set(resolved).size).toBe(intents.length);
  });



  it('falls back to the supplied token when given undefined', () => {
    expect(accentVar(undefined, 'danger')).toBe('var(--ds-intent-danger)');
    expect(accentVar(undefined)).toBe('var(--ds-accent-primary)');
  });

  // Documented behaviour: a mistyped prop degrades to something legible rather
  // than leaving `color: undefined` on the element. Note it lands on the
  // primary accent, *not* on the `fallback` argument — that parameter only
  // covers an absent token.
  it('degrades an unrecognised token to the primary accent, ignoring fallback', () => {
    const bogus = 'chartreuse' as unknown as Emphasis;

    expect(accentVar(bogus)).toBe('var(--ds-accent-primary)');
    expect(accentVar(bogus, 'danger')).toBe('var(--ds-accent-primary)');
  });

  it('never returns undefined for any input', () => {
    const inputs = [undefined, '', 'primary', 'danger', 'cyan', 'nonsense'];
    for (const input of inputs) {
      expect(accentVar(input as Emphasis)).toMatch(/^var\(--ds-/);
    }
  });
});

describe('surfaceVar / textVar / borderVar', () => {
  it('resolves surfaces, defaulting to base', () => {
    expect(surfaceVar('raised')).toBe('var(--ds-surface-raised)');
    expect(surfaceVar('sunken')).toBe('var(--ds-surface-sunken)');
    expect(surfaceVar('overlay')).toBe('var(--ds-surface-overlay)');
    expect(surfaceVar()).toBe('var(--ds-surface-base)');
  });

  it('resolves text tones, defaulting to primary', () => {
    expect(textVar('secondary')).toBe('var(--ds-text-secondary)');
    expect(textVar('muted')).toBe('var(--ds-text-muted)');
    expect(textVar('inverse')).toBe('var(--ds-text-inverse)');
    expect(textVar()).toBe('var(--ds-text-primary)');
  });

  // `strong` rather than `default` is the deliberate default here: it is the
  // full-contrast brutalist border, so an unspecified border stays on-system.
  it('resolves border tones, defaulting to strong', () => {
    expect(borderVar('default')).toBe('var(--ds-border-default)');
    expect(borderVar('subtle')).toBe('var(--ds-border-subtle)');
    expect(borderVar()).toBe('var(--ds-border-strong)');
  });
});

describe('HEADING_EMPHASIS', () => {
  it('covers all six levels', () => {
    expect(Object.keys(HEADING_EMPHASIS)).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  // Colour hierarchy should follow structural hierarchy: never louder as the
  // heading gets deeper.
  it('never increases in prominence as level deepens', () => {
    const rank: Record<Emphasis, number> = { primary: 0, secondary: 1, tertiary: 2, quiet: 3 };
    const levels = [1, 2, 3, 4, 5, 6] as const;

    for (let i = 1; i < levels.length; i += 1) {
      const prev = rank[HEADING_EMPHASIS[levels[i - 1]]];
      const curr = rank[HEADING_EMPHASIS[levels[i]]];
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
  });

  it('resolves every level through accentVar', () => {
    for (const level of [1, 2, 3, 4, 5, 6] as const) {
      expect(accentVar(HEADING_EMPHASIS[level])).toMatch(/^var\(--ds-accent-/);
    }
  });
});

describe('semanticTokens', () => {
  it('exposes every role group', () => {
    expect(Object.keys(semanticTokens).sort()).toEqual([
      'accent',
      'border',
      'font',
      'intent',
      'shadowColor',
      'surface',
      'text',
    ]);
  });

  it('agrees with the resolver functions', () => {
    expect(semanticTokens.accent.primary).toBe(accentVar('primary'));
    expect(semanticTokens.intent.danger).toBe(accentVar('danger'));
    expect(semanticTokens.surface.raised).toBe(surfaceVar('raised'));
    expect(semanticTokens.text.muted).toBe(textVar('muted'));
    expect(semanticTokens.border.subtle).toBe(borderVar('subtle'));
    expect(semanticTokens.font).toBe(fontVar);
  });

  // The whole point of the layer: every token is an indirection through a
  // `--ds-*` variable, so a mode swap propagates without touching components.
  // A literal colour anywhere in here would be invisible to `.dim`/`.sketch`.
  it('contains only --ds-* variable expressions, never literal colours', () => {
    const values = [
      ...Object.values(semanticTokens.accent),
      ...Object.values(semanticTokens.intent),
      ...Object.values(semanticTokens.surface),
      ...Object.values(semanticTokens.text),
      ...Object.values(semanticTokens.border),
      ...Object.values(semanticTokens.font),
      semanticTokens.shadowColor,
    ];

    expect(values.length).toBeGreaterThan(0);
    for (const value of values) {
      expect(value).toMatch(/^var\(--ds-[a-z-]+\)$/);
      expect(value).not.toMatch(/#[0-9a-fA-F]{3,8}|rgba?\(|brutalist-/);
    }
  });
});
