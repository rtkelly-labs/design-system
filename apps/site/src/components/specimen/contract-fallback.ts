/**
 * TEMPORARY. Stand-in values for the code-theme token contract, so the docs
 * page previews before the package defines `--ds-syntax-*` and `--ds-editor-*`.
 *
 * It is computed here rather than written as a stylesheet, so no file holds a
 * colour literal: every value is read off the exported `LEVELS` data through
 * round 6's `theme()` (the same numbers the decision board settled on).
 * `fallbackScope(level)` is passed to `LevelPair`'s `scope` and lands as inline
 * custom properties on each level's panel.
 *
 * DELETE THIS FILE WHEN THE PACKAGE TOKENS LAND. Inline properties beat the
 * package's `[data-theme]` rules, so leaving it in would hide them. Removal:
 *   1. delete this file and the `scope` / `fallbackScope` arguments on the page
 *      (`LevelPair`, `SpecimenLegend`, `SurfacesStrip`);
 *   2. replace the decision-board imports in `content/foundations/code-syntax.ts`
 *      (`theme`, `themeChecks`, `bands`) with the package's own token values;
 *   3. nothing else: `contract.ts` already reads the package's names by `var()`.
 */
import type { CSSProperties } from 'react';
import { theme } from '@/decisions/r6/look';
import { EDITOR_ROLES, SYNTAX_ROLES, editorVar, syntaxVar } from './contract';
import type { EditorRole, SyntaxRole } from './contract';
import type { Level } from './look';

export function fallbackValues(level: Level): { syntax: Record<SyntaxRole, string>; editor: Record<EditorRole, string> } {
  const l = theme(level);
  return {
    syntax: {
      keyword: l.tok.keyword,
      function: l.tok.function,
      string: l.tok.string,
      number: l.tok.number,
      type: l.tok.type,
      constant: l.tok.number,
      comment: l.tok.comment,
      punctuation: l.tok.sep,
      operator: l.tok.op,
      property: l.tok.plain,
      plain: l.tok.plain,
    },
    editor: {
      selection: l.sel.fill,
      'selection-ink': l.sel.fg,
      find: l.find.otherBorder,
      'find-current': l.find.curBorder,
      line: l.line.border,
      'line-number': l.line.num,
      'line-number-active': l.line.numActive,
      bracket: l.bracket.border,
      'bracket-wash': l.bracket.fill,
      error: l.err.fg,
      warning: l.warn.fg,
      info: l.info!.fg,
      'diff-added': l.add.bar,
      'diff-removed': l.del.bar,
      'diff-added-wash': l.add.wash,
      'diff-removed-wash': l.del.wash,
    },
  };
}

export function fallbackScope(level: Level): CSSProperties {
  const v = fallbackValues(level);
  const out: Record<string, string> = {};
  for (const r of SYNTAX_ROLES) out[syntaxVar(r)] = v.syntax[r];
  for (const r of EDITOR_ROLES) out[editorVar(r)] = v.editor[r];
  return out as CSSProperties;
}
