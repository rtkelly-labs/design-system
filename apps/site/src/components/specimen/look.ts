import type { ThemeLevel } from '@rtkelly13/design-system';

/**
 * What a `CodeFrame` needs to draw: every colour as a CSS value. A value may be
 * a literal (the decision board resolves its candidates to hex) or a
 * `var(--ds-syntax-*)` reference (the docs page draws from the token contract),
 * because the frame only ever writes the string into `style`.
 */

export type Level = ThemeLevel;

/** Token classes. `control` is a control-flow keyword; `keyword` a declaration. The shipped theme paints both the same. */
export type Cls = 'keyword' | 'control' | 'string' | 'number' | 'type' | 'function' | 'comment' | 'op' | 'sep' | 'bracket' | 'plain';

export type UnderlineStyle = 'wavy' | 'dashed' | 'dotted';

export interface CodeLook {
  ground: string;
  ink: string;
  tok: Record<Cls, string>;
  bold: Partial<Record<Cls, boolean>>;
  italic: Partial<Record<Cls, boolean>>;
  /** Bracket-pair colours by depth, repeating. */
  rot: string[];
  sel: { fill: string; fg: string };
  find: {
    otherBorder: string;
    otherFill?: string;
    otherFg: string;
    curBorder: string;
    curFill: string;
    curFg?: string;
    /** Bold glyphs inside the current match. */
    curBold?: boolean;
    otherW: number;
    curW: number;
  };
  line: { fill: string; border: string; num: string; numActive: string };
  bracket: { border: string; fill: string; fg: string; bold: boolean };
  err: { fg: string; wash: string };
  warn: { fg: string; wash: string };
  info?: { fg: string };
  /** The underline style each severity uses (default wavy). */
  diagStyle?: { err: UnderlineStyle; warn: UnderlineStyle; info: UnderlineStyle };
  add: { bar: string; wash: string };
  del: { bar: string; wash: string };
  guide: { rot: string[]; active: string[] };
  /** Diagnostic and current-match glyph colours in the gutter. */
  marker: { cur: string };
}

/** One pass or fail line: a title, and the reason in one sentence. */
export interface Check {
  ok: boolean;
  title: string;
  reason: string;
}
