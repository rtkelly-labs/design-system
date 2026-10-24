import type { CodeLook } from './look';

/**
 * The code-theme token contract, as the package will ship it: CSS custom
 * properties on `[data-theme]`, resolved per level. A `CodeFrame` drawn from
 * `contractLook` reads these by `var()`, so the same frame follows whichever
 * level is in scope and, once the package defines them, needs no change here.
 *
 * Names only. Values come from the package; until it ships them,
 * The package defines them per level.
 */

export const SYNTAX_ROLES = ['keyword', 'function', 'string', 'number', 'type', 'constant', 'comment', 'punctuation', 'operator', 'property', 'plain'] as const;
export const EDITOR_ROLES = [
  'selection',
  'selection-ink',
  'find',
  'find-current',
  'line',
  'line-number',
  'line-number-active',
  'bracket',
  'bracket-wash',
  'error',
  'warning',
  'info',
  'diff-added',
  'diff-removed',
  'diff-added-wash',
  'diff-removed-wash',
] as const;

export type SyntaxRole = (typeof SYNTAX_ROLES)[number];
export type EditorRole = (typeof EDITOR_ROLES)[number];

export const syntaxVar = (role: SyntaxRole) => `--ds-syntax-${role}`;
export const editorVar = (role: EditorRole) => `--ds-editor-${role}`;
const s = (role: SyntaxRole) => `var(${syntaxVar(role)})`;
const e = (role: EditorRole) => `var(${editorVar(role)})`;

/** The ground and ink a code surface sits on: ordinary role tokens, not part of the contract. */
const GROUND = 'var(--ds-surface-base)';
const INK = 'var(--ds-text-primary)';

/** A `CodeLook` whose every colour is a `var()` of the contract. */
export const contractLook: CodeLook = {
  ground: GROUND,
  ink: INK,
  tok: {
    keyword: s('keyword'),
    control: s('keyword'),
    string: s('string'),
    number: s('number'),
    type: s('type'),
    function: s('function'),
    comment: s('comment'),
    op: s('operator'),
    sep: s('punctuation'),
    bracket: s('punctuation'),
    plain: s('plain'),
  },
  bold: {},
  italic: {},
  rot: [s('punctuation')],
  sel: { fill: e('selection'), fg: e('selection-ink') },
  find: {
    otherBorder: e('find'),
    otherFg: s('plain'),
    curBorder: e('find-current'),
    curFill: 'transparent',
    curBold: true,
    otherW: 1,
    curW: 2,
  },
  line: { fill: 'transparent', border: e('line'), num: e('line-number'), numActive: e('line-number-active') },
  bracket: { border: e('bracket'), fill: e('bracket-wash'), fg: s('plain'), bold: false },
  err: { fg: e('error'), wash: 'transparent' },
  warn: { fg: e('warning'), wash: 'transparent' },
  info: { fg: e('info') },
  diagStyle: { err: 'wavy', warn: 'dashed', info: 'dotted' },
  add: { bar: e('diff-added'), wash: e('diff-added-wash') },
  del: { bar: e('diff-removed'), wash: e('diff-removed-wash') },
  guide: { rot: ['var(--ds-border-subtle)'], active: ['var(--ds-border-default)'] },
  marker: { cur: e('find-current') },
};

/** The eight ANSI slots of a terminal, as contract references, in slot order (1 red to 8 bright black). */
export const CONTRACT_ANSI: readonly string[] = [e('error'), s('string'), s('number'), s('function'), s('keyword'), e('info'), s('plain'), s('comment')];

/**
 * Shiki's css-variables theme emits `var(--shiki-token-*)`. These point each slot at the
 * contract. Set on the `<pre>`, below `.docs-codeblock`, which would otherwise win.
 */
export const SHIKI_SLOTS: Record<string, string> = {
  '--shiki-foreground': s('plain'),
  '--shiki-token-keyword': s('keyword'),
  '--shiki-token-constant': s('constant'),
  '--shiki-token-string': s('string'),
  '--shiki-token-string-expression': s('string'),
  '--shiki-token-comment': s('comment'),
  '--shiki-token-function': s('function'),
  '--shiki-token-parameter': s('property'),
  '--shiki-token-punctuation': s('punctuation'),
  '--shiki-token-link': s('function'),
};
