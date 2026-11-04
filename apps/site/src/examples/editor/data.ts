/**
 * Seeded fixtures for the editor workbench. Nothing here is random, dated or
 * locale-formatted, so a render is the same on the server, on hydration and in
 * a screenshot.
 */

export type TokenKind =
  | 'keyword'
  | 'string'
  | 'number'
  | 'comment'
  | 'function'
  | 'type'
  | 'punct'
  | 'plain';

export interface Token {
  text: string;
  kind: TokenKind;
}

export const PAGINATE_SOURCE = `import { clamp } from './math';

export interface Page<T> {
  items: T[];
  cursor: number;
  total: number;
}

// Returns one page of items, never past the end.
export function paginate<T>(items: T[], cursor: number, size = 25): Page<T> {
  const start = clamp(cursor, 0, items.length);
  const slice = items.slice(start, start + size);
  const total: number = items.lenght;
  if (slice.length === 0) {
    return { items: [], cursor: start, total };
  }
  return {
    items: slice,
    cursor: start + slice.length,
    total,
  };
}

export const FIRST_PAGE = 0;
export const LABEL = 'page one';
`;

export const MATH_SOURCE = `// Small numeric helpers.
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export const EPSILON = 0.000001;
`;

const KEYWORDS = new Set([
  'import', 'from', 'export', 'interface', 'function', 'const', 'let', 'return', 'if', 'else', 'new', 'type',
]);
const TYPES = new Set(['number', 'string', 'boolean', 'T', 'Page']);

const TOKEN_RE =
  /(\/\/.*$)|('(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\s+)|([^\sA-Za-z_$\d])/g;

/** A deliberately small tokenizer: enough grammar for the fixtures, no more. */
export function tokenizeLine(line: string): Token[] {
  const out: Token[] = [];
  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(line)) !== null) {
    const [text, comment, str, num, word, space] = m;
    if (comment) out.push({ text, kind: 'comment' });
    else if (str) out.push({ text, kind: 'string' });
    else if (num) out.push({ text, kind: 'number' });
    else if (word) {
      const next = line[m.index + text.length];
      if (KEYWORDS.has(text)) out.push({ text, kind: 'keyword' });
      else if (TYPES.has(text)) out.push({ text, kind: 'type' });
      else if (next === '(' || (next === '<' && /^[a-z]/.test(text))) out.push({ text, kind: 'function' });
      else out.push({ text, kind: 'plain' });
    } else if (space) out.push({ text, kind: 'plain' });
    else out.push({ text, kind: 'punct' });
  }
  return out;
}

export type DecorationKind =
  | 'selection'
  | 'find'
  | 'findCurrent'
  | 'bracket'
  | 'error'
  | 'warning'
  | 'info';

export interface Decoration {
  line: number; // 1-based
  from: number; // 0-based column, inclusive
  to: number; // exclusive
  kind: DecorationKind;
}

/** Positions of `needle` on every line, as find-match decorations. */
export function findAll(source: string, needle: string): Decoration[] {
  const found: Decoration[] = [];
  source.split('\n').forEach((text, i) => {
    let from = text.indexOf(needle);
    while (from !== -1) {
      found.push({ line: i + 1, from, to: from + needle.length, kind: 'find' });
      from = text.indexOf(needle, from + needle.length);
    }
  });
  return found;
}

export const GIT_GUTTER: Record<number, 'added' | 'modified' | 'removed'> = {
  13: 'modified',
  15: 'modified',
  24: 'added',
  25: 'added',
};

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info';
  file: string;
  line: number;
  col: number;
  message: string;
  code: string;
}

export const DIAGNOSTICS: Diagnostic[] = [
  { severity: 'error', file: 'paginate.ts', line: 13, col: 30, message: "Property 'lenght' does not exist on type 'T[]'. Did you mean 'length'?", code: 'TS2551' },
  { severity: 'warning', file: 'paginate.ts', line: 13, col: 9, message: "Type annotation is redundant; 'total' is inferred as number.", code: 'no-inferrable-types' },
  { severity: 'info', file: 'paginate.ts', line: 25, col: 14, message: "'LABEL' is exported but never imported.", code: 'unused-export' },
];

export type DiffSign = 'add' | 'remove' | 'keep';
export interface DiffLine {
  sign: DiffSign;
  oldNo?: number;
  newNo?: number;
  text: string;
}

export const DIFF_LINES: DiffLine[] = [
  { sign: 'keep', oldNo: 11, newNo: 11, text: '  const start = clamp(cursor, 0, items.length);' },
  { sign: 'keep', oldNo: 12, newNo: 12, text: '  const slice = items.slice(start, start + size);' },
  { sign: 'remove', oldNo: 13, text: '  const total = items.length;' },
  { sign: 'add', newNo: 13, text: '  const total: number = items.lenght;' },
  { sign: 'keep', oldNo: 14, newNo: 14, text: '  if (slice.length === 0) {' },
  { sign: 'remove', oldNo: 15, text: '    return { items: [], cursor: start };' },
  { sign: 'add', newNo: 15, text: '    return { items: [], cursor: start, total };' },
  { sign: 'keep', oldNo: 16, newNo: 16, text: '  }' },
];

export const TERMINAL_SESSION = `$ pnpm test paginate
# vitest 3.2 · 3 files · seed 42
✓ clamps the cursor into range
✓ returns an empty page past the end
FAIL paginate.test.ts > counts every item
  expected 0 to be 120
$ tsc --noEmit
error TS2551: Property 'lenght' does not exist on type 'T[]'.`;

export interface TreeEntry {
  id: string;
  name: string;
  kind: 'dir' | 'file';
  git?: 'M' | 'A' | 'U';
  children?: TreeEntry[];
}

export const FILE_TREE: TreeEntry[] = [
  {
    id: 'src',
    name: 'src',
    kind: 'dir',
    children: [
      { id: 'paginate.ts', name: 'paginate.ts', kind: 'file', git: 'M' },
      { id: 'paginate.test.ts', name: 'paginate.test.ts', kind: 'file', git: 'A' },
      { id: 'math.ts', name: 'math.ts', kind: 'file' },
      {
        id: 'lib',
        name: 'lib',
        kind: 'dir',
        children: [
          { id: 'cursor.ts', name: 'cursor.ts', kind: 'file' },
          { id: 'index.ts', name: 'index.ts', kind: 'file', git: 'U' },
        ],
      },
    ],
  },
  { id: 'package.json', name: 'package.json', kind: 'file' },
  { id: 'tsconfig.json', name: 'tsconfig.json', kind: 'file' },
  { id: 'README.md', name: 'README.md', kind: 'file' },
];

export interface Command {
  id: string;
  label: string;
  group: string;
  shortcut?: string;
}

export const COMMANDS: Command[] = [
  { id: 'open', label: 'Go to File...', group: 'File', shortcut: 'Ctrl P' },
  { id: 'find', label: 'Find in File', group: 'Edit', shortcut: 'Ctrl F' },
  { id: 'format', label: 'Format Document', group: 'Edit', shortcut: 'Shift Alt F' },
  { id: 'diff', label: 'Open Changes', group: 'Git' },
  { id: 'panel', label: 'Toggle Panel', group: 'View', shortcut: 'Ctrl J' },
  { id: 'theme', label: 'Switch Colour Theme', group: 'Preferences' },
  { id: 'terminal', label: 'Focus Terminal', group: 'Terminal' },
];

/** A decoration over the first (or nth) occurrence of `needle` on a line. */
export function at(source: string, line: number, needle: string, kind: DecorationKind, nth = 0): Decoration {
  const text = source.split('\n')[line - 1] ?? '';
  let from = -1;
  for (let i = 0; i <= nth; i += 1) from = text.indexOf(needle, from + 1);
  if (from < 0) throw new Error(`"${needle}" not found on line ${line}`);
  return { line, from, to: from + needle.length, kind };
}
