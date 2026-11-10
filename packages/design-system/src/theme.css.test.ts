import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { THEME_LEVELS } from './theme/levels';

/**
 * Structural tests over the generated `theme.css`.
 *
 * These assert a rule the stylesheet depends on and cannot state in a way
 * anything checks: **custom properties substitute where they are declared, not
 * where they are used.** Tailwind emits `@theme` onto `:root`, so a token
 * declared only there resolves against the root level and descendants inherit
 * that resolved *literal*. A nested `bright` panel inside a `midnight` page
 * overrides `--ds-*` underneath, but an alias sitting above it has already
 * resolved — and the panel silently keeps the root level's colour.
 *
 * Any token whose value indirects through a per-level variable therefore has to
 * be re-declared inside every level block. `scripts/build-tokens.mjs` does that
 * today, which is why `<ThemeProvider scoped>` works at any depth. Nothing
 * enforced it, and it is the kind of property a well-meaning tidy-up of the
 * generator removes without any test going red: single-level pages would carry
 * on rendering correctly, because at the root the alias resolves to the right
 * value anyway. Only nested panels break, and nothing screenshots one.
 *
 * `pnpm tokens:check` is the neighbouring guard and a different one — it proves
 * the committed CSS matches `levels.ts`. It would be equally happy with a
 * generator that emitted the wrong shape, as long as it did so reproducibly.
 */

// Resolved from the Vitest root (the repo root, where vitest.config.mts sits)
// rather than from import.meta.url, which is not a file URL under the jsdom
// environment's module transform.
const css = readFileSync(resolve(process.cwd(), 'src/theme.css'), 'utf8');

/** Body of the first block whose selector matches, brace-counted. */
function blockBody(source: string, selector: string): string {
  const start = source.indexOf(selector + ' {');
  if (start === -1) throw new Error(`no block for selector: ${selector}`);

  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(source.indexOf('{', start) + 1, i);
    }
  }
  throw new Error(`unterminated block: ${selector}`);
}

/** Custom-property declarations, ignoring anything inside comments. */
function declarations(body: string): Map<string, string> {
  const withoutComments = body.replace(/\/\*[\s\S]*?\*\//g, '');
  const found = new Map<string, string>();

  for (const line of withoutComments.split('\n')) {
    const match = /^\s*(--[a-zA-Z0-9-]+)\s*:\s*(.+?);\s*$/.exec(line);
    if (match) found.set(match[1], match[2]);
  }

  return found;
}

/**
 * `midnight` doubles as the default, so its block is `:root, [data-theme=…]`
 * and the selector is not uniform across levels. Derived from `THEME_LEVELS`
 * rather than hand-listed, so adding a rung widens these tests automatically —
 * the same rule the rest of the ladder follows.
 */
const selectorFor = (level: string) =>
  level === 'midnight' ? ':root, [data-theme="midnight"]' : `[data-theme="${level}"]`;

const themeTokens = declarations(blockBody(css, '@theme'));
const levelTokens = new Map(
  THEME_LEVELS.map((level) => [level, declarations(blockBody(css, selectorFor(level)))] as const),
);

describe('theme.css structure', () => {
  it('has a block for every level, and an @theme block', () => {
    expect(themeTokens.size).toBeGreaterThan(0);
    expect(levelTokens.size).toBe(THEME_LEVELS.length);
    for (const [level, tokens] of levelTokens) {
      expect(tokens.size, `${level} declares nothing`).toBeGreaterThan(0);
    }
  });

  it('declares the --ds-* role layer in every level block', () => {
    for (const [level, tokens] of levelTokens) {
      const ds = [...tokens.keys()].filter((t) => t.startsWith('--ds-'));
      expect(ds.length, `${level} declares no --ds-* roles`).toBeGreaterThan(0);
    }
  });
});

/**
 * Variables whose value differs between levels. A token referencing one of
 * these resolves differently per level and so must be re-declared; the
 * `--font-*` chains are set once in a level-independent `:root` block and are
 * deliberately not in this set.
 */
const levelVarying = new Set([...levelTokens.values()].flatMap((tokens) => [...tokens.keys()]));

describe('indirected @theme tokens are re-declared in every level block', () => {
  // The tokens at risk: those referencing a variable that changes per level. A
  // literal (`--color-black: #000`), or a reference to something constant
  // across levels, resolves the same everywhere and needs no repeating.
  const indirected = [...themeTokens.entries()].filter(([, value]) =>
    [...value.matchAll(/var\((--[a-zA-Z0-9-]+)/g)].some((m) => levelVarying.has(m[1])),
  );

  it('finds tokens to check', () => {
    expect(indirected.length).toBeGreaterThan(20);
  });

  // The `--ds-font-*` chains indirect through app-provided `--font-inter` and
  // friends, which no level overrides, so they are correctly absent from the
  // level blocks. Pinning this stops the rule above from being quietly widened
  // into a false positive that would demand fonts be repeated four times.
  it('excludes tokens that do not vary by level', () => {
    const tokens = indirected.map(([token]) => token);

    expect(tokens).not.toContain('--font-sans');
    expect(tokens).not.toContain('--font-display');
    expect(tokens).not.toContain('--font-mono');
    expect(tokens).not.toContain('--font-pixel');
    expect(levelVarying.has('--font-inter')).toBe(false);
    expect(levelVarying.has('--ds-font-display')).toBe(false);
  });

  it.each(
    THEME_LEVELS.flatMap((level) =>
      indirected.map(([token]) => ({ level, token })),
    ),
  )('$token follows a nested $level panel', ({ level, token }) => {
    expect(levelTokens.get(level)?.has(token)).toBe(true);
  });

  it('re-declares each token with the same value it has in @theme', () => {
    // A drifted value would theme correctly but render the wrong colour, which
    // is harder to spot than an omission.
    for (const [token, value] of indirected) {
      for (const [level, tokens] of levelTokens) {
        expect(tokens.get(token), `${token} differs in ${level}`).toBe(value);
      }
    }
  });

  // AGENTS.md tells consumers to prefer the semantic aliases over the palette
  // names, so these are the ones that most need to follow a nested panel — and
  // historically they were the half that did not.
  it('covers every semantic alias family, on every level', () => {
    const families = ['accent', 'intent', 'surface', 'content', 'edge'];

    for (const family of families) {
      const aliases = [...themeTokens.keys()].filter((t) => t.startsWith(`--color-${family}-`));

      expect(aliases.length, `no --color-${family}-* aliases found`).toBeGreaterThan(0);
      for (const alias of aliases) {
        for (const [level, tokens] of levelTokens) {
          expect(tokens.has(alias), `${alias} missing from ${selectorFor(level)}`).toBe(true);
        }
      }
    }
  });
});

describe('semantic aliases resolve through the --ds-* layer', () => {
  it('never reaches past it to the raw palette', () => {
    // `--color-accent-primary: var(--brutalist-cyan)` would still theme, but it
    // would pin the role to one palette entry and defeat the indirection.
    const semanticAliases = [...themeTokens.entries()].filter(([token]) =>
      /^--color-(accent|intent|surface|content|edge)-/.test(token),
    );

    expect(semanticAliases.length).toBeGreaterThan(0);
    for (const [token, value] of semanticAliases) {
      expect(value, `${token} should indirect through --ds-*`).toMatch(/^var\(--ds-[a-z-]+\)$/);
    }
  });
});

/**
 * The `midnight:` and `sketch:` variants must match an element's *nearest*
 * themed ancestor, because that is the Level the element is painted in. A
 * scoped panel inside a page on the other Level is the case that matters: the
 * custom properties already resolve there (above), and a component that varies
 * its drawing by Level (ADR 0007) has to draw the panel's Level, not the
 * page's. The selector used to exclude any element with a differently-themed
 * ancestor anywhere above it, so inside a nested panel neither variant matched.
 */
describe('level variants match the nearest themed ancestor', () => {
  const variant = (level: string): string => {
    const line = css.split('\n').find((l) => l.startsWith(`@custom-variant ${level} (`));
    if (!line) throw new Error(`no @custom-variant for ${level}`);
    return line.slice(`@custom-variant ${level} (`.length, -2).replaceAll('&', '*');
  };

  /** Builds nested `data-theme` wrappers from the outside in and returns the innermost leaf. */
  const leafIn = (...levels: string[]): Element => {
    const root = document.createElement('div');
    let at: Element = root;
    for (const level of levels) {
      const box = document.createElement('div');
      box.setAttribute('data-theme', level);
      at.appendChild(box);
      at = box;
    }
    const leaf = document.createElement('span');
    at.appendChild(leaf);
    document.body.appendChild(root);
    return leaf;
  };

  const [a, b] = THEME_LEVELS;

  it.each([
    ['a page on one level', [a], a],
    ['a panel nested in a page on the other level', [a, b], b],
    ['a panel nested twice, back out', [b, a], a],
  ] as const)('%s', (_, chain, expected) => {
    const leaf = leafIn(...chain);
    for (const level of THEME_LEVELS) {
      expect(leaf.matches(variant(level)), `${level} variant on ${chain.join(' > ')}`).toBe(level === expected);
    }
  });
});
