import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  EDITOR_ALPHA_TARGET,
  EDITOR_TRANSLUCENT,
  alphaHex,
  applyContrastDelta,
  auditEditor,
  auditEditorAgreement,
  contrastMoreLadder,
  contrastRatio,
  deriveEditor,
  deriveSyntax,
  fitEditorAlpha,
  holdsEditorAlpha,
  flattenOnto,
  resolveRef,
} from './contrast';
import { EDITOR_ROLES, LEVELS, PRINT_LEVEL, SYNTAX_ROLES, THEME_LEVELS } from './levels';

/**
 * #148 and #80, Round 6. `syntax` and `editor` are literals in `levels.ts`, and
 * what makes a literal safe is that the name of its source is declared beside it
 * and a test re-derives it. Change a role and forget the literal, or the other
 * way round, and this fails with the value to paste.
 */
describe('syntax and editor groups', () => {
  for (const level of THEME_LEVELS) {
    const def = LEVELS[level];

    it(`${level}: declares every syntax and editor role`, () => {
      expect(Object.keys(def.syntax).sort()).toEqual([...SYNTAX_ROLES].sort());
      expect(Object.keys(def.syntaxSource).sort()).toEqual([...SYNTAX_ROLES].sort());
      expect(Object.keys(def.editor).sort()).toEqual([...EDITOR_ROLES].sort());
      expect(Object.keys(def.editorSource).sort()).toEqual([...EDITOR_ROLES].sort());
    });

    it(`${level}: every syntax literal is its declared source`, () => {
      expect(def.syntax).toEqual(deriveSyntax(def));
    });

    it(`${level}: every editor literal is its declared source at the declared alpha`, () => {
      expect(def.editor).toEqual(deriveEditor(def));
    });

    it(`${level}: the translucent roles are #rrggbbaa and the rest are opaque`, () => {
      for (const role of EDITOR_ROLES) {
        const translucent = role in EDITOR_TRANSLUCENT;
        expect(def.editor[role]).toMatch(translucent ? /^#[0-9a-f]{8}$/ : /^#[0-9a-f]{6}$/);
      }
      for (const value of Object.values(def.syntax)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
    });

    it(`${level}: editorAlpha is the fitted value, and no step higher holds`, () => {
      const fitted = fitEditorAlpha(def);
      expect(def.editorAlpha).toEqual(fitted);
      for (const key of ['selection', 'bracket', 'diff'] as const) {
        expect(def.editorAlpha[key]).toBeLessThanOrEqual(EDITOR_ALPHA_TARGET[key]);
      }
      // It holds at the declared strength, and one step higher does not (unless the target caps it).
      for (const key of ['selection', 'bracket', 'diff'] as const) {
        expect(holdsEditorAlpha(def, key, def.editorAlpha[key])).toBe(true);
        if (def.editorAlpha[key] < EDITOR_ALPHA_TARGET[key]) {
          expect(holdsEditorAlpha(def, key, def.editorAlpha[key] + 1)).toBe(false);
        }
      }
    });
  }

  it('declares the Round 6 sources by role, not by hex', () => {
    const m = LEVELS.midnight;
    const s = LEVELS.sketch;
    expect(m.syntaxSource).toMatchObject({ keyword: 'accent.tertiary', function: 'accent.primary', string: 'intent.success', number: 'accent.secondary', type: 'accent.secondary', constant: 'accent.secondary', comment: 'text.muted', punctuation: 'text.secondary', operator: 'text.secondary', property: 'text.primary', plain: 'text.primary' });
    expect(s.syntaxSource).toMatchObject({ keyword: 'accent.tertiary', function: 'accent.primary', string: 'accent.secondary', number: 'palette.violet', type: 'palette.violet', constant: 'palette.violet' });
    // Midnight's error is the red Hue: intent.danger is pink there and would be the keyword.
    expect(m.editorSource.error).toBe('palette.red');
    expect(s.editorSource.error).toBe('intent.danger');
    expect(s.editorSource.warning).toBe('intent.warning');
    expect(m.editorSource.line).toBe('border.subtle');
    expect(m.editorSource.lineNumberActive).toBe('accent.primary');
  });

  it('records the shared keyword and error hue on Sketch as by design', () => {
    // Shape, not colour, carries the error there: both are palette.red.
    const s = LEVELS.sketch;
    expect(resolveRef(s, s.syntaxSource.keyword)).toBe(s.palette.red);
    expect(resolveRef(s, s.editorSource.error)).toBe(s.palette.red);
    const m = LEVELS.midnight;
    expect(resolveRef(m, m.editorSource.error)).not.toBe(resolveRef(m, m.syntaxSource.keyword));
  });

  it('passes every syntax and editor gate on every level', () => {
    const checks = auditEditor(LEVELS);
    expect(checks.length).toBeGreaterThan(0);
    expect(checks.filter((c) => !c.passes).map((c) => `${c.level} ${c.pair} ${c.ratio.toFixed(2)}`)).toEqual([]);
    expect(auditEditorAgreement(LEVELS).filter((r) => !r.passes)).toEqual([]);
  });

  it('measures the selection ink composited, not against its nominal colour', () => {
    for (const level of THEME_LEVELS) {
      const def = LEVELS[level];
      const flat = flattenOnto(def.editor.selection, def.surface.sunken);
      const ratio = contrastRatio(def.editor.selectionInk, flat);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(flat).not.toBe(def.surface.sunken);
    }
  });

  it('alphaHex rounds to the byte', () => {
    expect(alphaHex('#22D3EE', 30)).toBe('#22d3ee4d');
    expect(alphaHex('#000000', 100)).toBe('#000000ff');
  });

  it('contrast: more re-derives the code Groups from the delta', () => {
    for (const level of THEME_LEVELS) {
      const def = LEVELS[level];
      const more = applyContrastDelta(def);
      expect(more.syntax.comment).toBe(def.text.secondary);
      expect(more.editor.line).toBe(def.border.default);
      expect(more.editor.lineNumber).toBe(def.text.secondary);
      expect(more.syntax.keyword).toBe(def.syntax.keyword);
      expect(more.editor.selection).toBe(def.editor.selection);
      expect(auditEditor(contrastMoreLadder(LEVELS)).filter((c) => !c.passes)).toEqual([]);
    }
  });
});

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
const css = readFileSync(resolve(process.cwd(), 'src/theme.css'), 'utf8');

/** The `--ds-syntax-*` and `--ds-editor-*` declarations in the block that opens with `selector {`. */
function codeVars(selector: string): Map<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`no block: ${selector}`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('\n}', start));
  const found = new Map<string, string>();
  for (const m of body.matchAll(/^\s*(--ds-(?:syntax|editor)-[a-z-]+):\s*(.+?);\s*$/gm)) found.set(m[1]!, m[2]!);
  return found;
}

describe('theme.css emits the syntax and editor Groups', () => {
  const expected = (level: (typeof THEME_LEVELS)[number]) =>
    new Map<string, string>([
      ...SYNTAX_ROLES.map((r) => [`--ds-syntax-${kebab(r)}`, deriveSyntax(LEVELS[level])[r]] as const),
      ...EDITOR_ROLES.map((r) => [`--ds-editor-${kebab(r)}`, deriveEditor(LEVELS[level])[r]] as const),
    ]);

  for (const level of THEME_LEVELS) {
    it(`${level}: every emitted var equals the levels.ts derivation`, () => {
      const own = `[data-theme="${level}"]`;
      const selector = level === THEME_LEVELS[0] ? `:root, ${own}` : own;
      expect(codeVars(selector)).toEqual(expected(level));
    });
  }

  it('uses the contract names, exactly', () => {
    const names = [...expected('midnight').keys()].sort();
    expect(names).toEqual(
      [
        'syntax-keyword', 'syntax-function', 'syntax-string', 'syntax-number', 'syntax-type', 'syntax-constant',
        'syntax-comment', 'syntax-punctuation', 'syntax-operator', 'syntax-property', 'syntax-plain',
        'editor-selection', 'editor-selection-ink', 'editor-find', 'editor-find-current', 'editor-line',
        'editor-line-number', 'editor-line-number-active', 'editor-bracket', 'editor-bracket-wash',
        'editor-error', 'editor-warning', 'editor-info', 'editor-diff-added', 'editor-diff-removed',
        'editor-diff-added-wash', 'editor-diff-removed-wash',
      ].map((n) => `--ds-${n}`).sort(),
    );
  });

  it('exposes a Tailwind colour for each, so the utilities exist', () => {
    for (const name of expected('midnight').keys()) {
      expect(css).toContain(`--color-${name.slice('--ds-'.length)}: var(${name});`);
    }
  });

  it('paints paper with the print level\'s code colours', () => {
    const printBlock = css.slice(css.indexOf('@media print {\n  :root, [data-theme] {'));
    const paper = expected(PRINT_LEVEL);
    for (const [name, value] of paper) expect(printBlock).toContain(`${name}: ${value};`);
  });
});
