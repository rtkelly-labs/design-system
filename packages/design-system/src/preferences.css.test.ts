import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { applyContrastDelta, auditContrast, auditHueAgreement, auditSeriesSeparation, contrastMoreLadder } from './theme/contrast';
import { LEVELS, SERIES_COUNT, THEME_LEVELS } from './theme/levels';

/**
 * The Preference axis in the generated stylesheet (D9, ADR 0007).
 *
 * Three behaviours are asserted by running the rules rather than reading them: a
 * series glyph is hidden until `data-a11y-cvd="patterns"`, the duration tokens
 * collapse under `data-a11y-motion="reduce"` and stand under `"full"`, and the
 * `contrast: more` blocks carry exactly the values `applyContrastDelta` derives
 * from `levels.ts` — no colour written in CSS that the ladder does not declare.
 */

const css = readFileSync(resolve(process.cwd(), 'src/theme.css'), 'utf8');

/** The text of a top-level rule or at-rule beginning at `start`, brace-counted. */
function ruleFrom(source: string, start: number): string {
  const open = source.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error('unterminated rule');
}

/** Every top-level rule whose selector text contains `needle`. */
function rulesContaining(needle: string): string[] {
  const found: string[] = [];
  let from = 0;
  for (;;) {
    const at = css.indexOf(needle, from);
    if (at === -1) return found;
    // Back up to the start of the selector (the previous blank line or comment end).
    const start = Math.max(css.lastIndexOf('\n\n', at), css.lastIndexOf('*/', at)) + 1;
    const rule = ruleFrom(css, start).trim();
    if (!found.includes(rule)) found.push(rule);
    from = at + needle.length;
  }
}

function declarationsOf(rule: string): Map<string, string> {
  const body = rule.slice(rule.indexOf('{') + 1, rule.lastIndexOf('}'));
  const found = new Map<string, string>();
  for (const line of body.split('\n')) {
    const match = /^\s*(--[a-zA-Z0-9-]+)\s*:\s*(.+?);\s*$/.exec(line);
    if (match) found.set(match[1]!, match[2]!);
  }
  return found;
}

const PREFERENCE_CSS = css.slice(css.indexOf('The Preference axis'));
const style = document.createElement('style');

afterEach(() => {
  style.remove();
  document.body.replaceChildren();
  document.documentElement.removeAttribute('data-a11y-cvd');
  document.documentElement.removeAttribute('data-a11y-motion');
});

describe('cvd: patterns — the series glyph', () => {
  const glyphRules = PREFERENCE_CSS.slice(
    PREFERENCE_CSS.indexOf('/* cvd: patterns'),
    PREFERENCE_CSS.indexOf('/* links: underline'),
  );

  function mount() {
    style.textContent = glyphRules;
    document.head.append(style);
    document.body.innerHTML = `
      <span data-slot="series-glyph" id="html">B</span>
      <svg><g data-slot="series-glyph" id="svg"></g></svg>
      <span data-slot="intent-glyph" id="intent"></span>
      <span id="other"></span>`;
    const display = (id: string) => getComputedStyle(document.getElementById(id)!).display;
    return display;
  }

  it('is hidden by default, with no attribute on the document', () => {
    const display = mount();
    expect(display('html')).toBe('none');
    expect(display('svg')).toBe('none');
    expect(display('intent')).toBe('none');
    expect(display('other')).not.toBe('none');
  });

  it('is shown under data-a11y-cvd="patterns", HTML and SVG alike', () => {
    const display = mount();
    document.documentElement.setAttribute('data-a11y-cvd', 'patterns');
    expect(display('html')).toBe('inline');
    expect(display('svg')).toBe('inline');
    expect(display('intent')).toBe('inline');
  });

  it('is shown under an ancestor that carries the attribute, so a preview can scope it', () => {
    const display = mount();
    document.body.innerHTML = '<div data-a11y-cvd="patterns"><span data-slot="series-glyph" id="scoped"></span></div><span data-slot="series-glyph" id="outside"></span>';
    expect(display('scoped')).toBe('inline');
    expect(display('outside')).toBe('none');
  });

  it('stays hidden for any other value of the attribute', () => {
    const display = mount();
    document.documentElement.setAttribute('data-a11y-cvd', 'swap');
    expect(display('html')).toBe('none');
  });
});

describe('motion — the duration tokens honour both directions', () => {
  const motionRules = [
    ...css.matchAll(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}\n\n:root\[data-a11y-motion="reduce"\] \{[\s\S]*?\n\}/g),
  ][0]![0];

  it('collapses quick and considered under data-a11y-motion="reduce", with the OS silent', () => {
    style.textContent = `:root { --ds-duration-quick: 120ms; --ds-duration-considered: 240ms; }\n${motionRules}`;
    document.head.append(style);
    // Read fresh each time: a computed style is a snapshot.
    const root = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    expect(root('--ds-duration-quick')).toBe('120ms');

    document.documentElement.setAttribute('data-a11y-motion', 'reduce');
    expect(root('--ds-duration-quick')).toBe('0ms');
    expect(root('--ds-duration-considered')).toBe('0ms');
  });

  it('restores them under "full" even when the OS asks for reduced motion', () => {
    // The OS rule is `@media (prefers-reduced-motion: reduce) { :root:not([data-a11y-motion="full"]) }`.
    // jsdom evaluates no media queries, so assert the exclusion on the selector it
    // carries: the only rule that collapses under the query cannot match "full".
    const osRule = /@media \(prefers-reduced-motion: reduce\) \{\s*(:root[^{]*)\{/.exec(css)![1]!.trim();
    document.documentElement.setAttribute('data-a11y-motion', 'full');
    expect(document.documentElement.matches(osRule)).toBe(false);
    document.documentElement.setAttribute('data-a11y-motion', 'anything-else');
    expect(document.documentElement.matches(osRule)).toBe(true);
    document.documentElement.removeAttribute('data-a11y-motion');
    expect(document.documentElement.matches(osRule)).toBe(true);
  });

  it('leaves the loop unit alone, so a spinner is not stopped by it', () => {
    expect(motionRules).not.toContain('--ds-loop-unit');
  });
});

describe('contrast: more — overrides equal the levels.ts derivation', () => {
  for (const level of THEME_LEVELS) {
    it(`${level}: every declaration in its block is a value applyContrastDelta derives`, () => {
      const rules = rulesContaining(`[data-a11y-contrast="more"] [data-theme="${level}"]`).filter(
        (rule) => !rule.startsWith('@media'),
      );
      expect(rules).toHaveLength(1);
      const declared = declarationsOf(rules[0]!);
      const def = LEVELS[level];
      const more = applyContrastDelta(def);

      expect(declared.get('--ds-text-muted')).toBe(more.text.muted);
      expect(declared.get('--ds-border-default')).toBe(more.border.default);
      expect(declared.get('--ds-border-subtle')).toBe(more.border.subtle);
      for (const [key, value] of Object.entries(more.tint.accent)) {
        expect(declared.get(`--ds-tint-accent-${key}`)).toBe(value);
      }
      for (const [key, value] of Object.entries(more.tint.intent)) {
        expect(declared.get(`--ds-tint-intent-${key}`)).toBe(value);
      }
      // The code Groups follow the text and border Roles they read by name.
      expect(declared.get('--ds-syntax-comment')).toBe(more.syntax.comment);
      expect(declared.get('--ds-editor-line')).toBe(more.editor.line);
      expect(declared.get('--ds-editor-line-number')).toBe(more.editor.lineNumber);
      // Only what the delta changes is emitted: nothing is repeated, nothing is authored.
      expect(declared.size).toBe(3 + 8 + 3);
    });
  }

  it('strengthens borders a rung, raises muted to secondary, and takes tints to the ground', () => {
    for (const level of THEME_LEVELS) {
      const def = LEVELS[level];
      const more = applyContrastDelta(def);
      expect(more.border.subtle).toBe(def.border.default);
      expect(more.border.default).toBe(def.border.strong);
      expect(more.border.strong).toBe(def.border.strong);
      expect(more.text.muted).toBe(def.text.secondary);
      expect(Object.values(more.tint.accent)).toEqual(Array(4).fill(def.surface.base));
      expect(Object.values(more.tint.intent)).toEqual(Array(4).fill(def.surface.base));
    }
  });

  it('never weakens a pair the Level already gated, and clears every floor', () => {
    const before = auditContrast(LEVELS);
    const after = auditContrast(contrastMoreLadder(LEVELS));
    expect(after.filter((r) => !r.passes)).toEqual([]);
    expect(after).toHaveLength(before.length);
    for (let i = 0; i < before.length; i += 1) {
      expect(after[i]!.pair).toBe(before[i]!.pair);
      expect(after[i]!.ratio, `${after[i]!.level} ${after[i]!.pair}`).toBeGreaterThanOrEqual(before[i]!.ratio - 1e-9);
    }
  });

  it('is re-pointed to paper under print, so a dark level never prints dark', () => {
    const printRule = rulesContaining('@media print').find((r) => r.includes('data-a11y-contrast'))!;
    const paper = applyContrastDelta(LEVELS.sketch);
    expect(printRule).toContain(`--ds-border-default: ${paper.border.default};`);
    expect(printRule).toContain(`--ds-text-muted: ${paper.text.muted};`);
  });
});

describe('series — the categorical group', () => {
  it(`has ${SERIES_COUNT} members per level, each its declared Hue's value`, () => {
    for (const level of THEME_LEVELS) {
      const def = LEVELS[level];
      expect(def.series).toHaveLength(SERIES_COUNT);
      expect(def.seriesHue).toHaveLength(SERIES_COUNT);
      def.seriesHue.forEach((hue, i) => expect(def.series[i]).toBe(def.palette[hue]));
      expect(new Set(def.series).size).toBe(SERIES_COUNT);
    }
    expect(auditHueAgreement(LEVELS).filter((r) => r.role.startsWith('series.') && !r.passes)).toEqual([]);
  });

  it('is D9-A: red, yellow, teal, blue, violet, magenta', () => {
    for (const level of THEME_LEVELS) {
      expect(LEVELS[level].seriesHue).toEqual(['red', 'yellow', 'teal', 'blue', 'violet', 'magenta']);
    }
  });

  it('emits --ds-series-1..6 in every level block and a Tailwind alias for each', () => {
    for (let n = 1; n <= SERIES_COUNT; n += 1) {
      expect(css).toContain(`--color-series-${n}: var(--ds-series-${n});`);
      for (const level of THEME_LEVELS) expect(css).toContain(`--ds-series-${n}: ${LEVELS[level].series[n - 1]};`);
    }
  });

  it('pins the separation measured in levels.ts: gated under normal vision, reported under simulation', () => {
    const rows = auditSeriesSeparation(LEVELS);
    const at = (level: string, vision: string) => rows.find((r) => r.level === level && r.vision === vision)!;
    expect(at('midnight', 'normal').min).toBeCloseTo(0.1406, 4);
    expect(at('sketch', 'normal').min).toBeCloseTo(0.1254, 4);
    expect(at('midnight', 'protanopia').min).toBeCloseTo(0.0081, 4);
    expect(at('sketch', 'deuteranopia').min).toBeCloseTo(0.0396, 4);
    expect(rows.filter((r) => r.gated && !r.passes)).toEqual([]);
    // The simulations are what the glyphs are for: reported, and allowed to be low.
    expect(rows.filter((r) => !r.gated).some((r) => r.min < 0.04)).toBe(true);
  });
});

describe('links: underline', () => {
  it('is an unlayered rule scoped to prose and the site link', () => {
    const rule = rulesContaining('data-a11y-links="underline"')[0]!;
    expect(rule).toContain('.prose a');
    expect(rule).toContain('a[data-slot="site-link"]');
    expect(rule).toContain('text-decoration-line: underline');
  });
});
