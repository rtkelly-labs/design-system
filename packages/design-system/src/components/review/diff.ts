/**
 * The data a line diff is drawn from, and a reader for the unified format every diff tool emits.
 *
 * Kept apart from the component so a generator — a CLI, a CI step, a report written in TSX — can
 * turn `git diff` output into `DiffHunk[]` without rendering anything.
 */

import type { ReactNode } from 'react';

export type DiffLineKind = 'added' | 'removed' | 'context';

/** A review comment pinned under one line of a diff. */
export interface DiffLineComment {
  /** Who wrote it: a person's handle, or a tool's name. */
  author: string;
  /** Short annotation beside the author, such as `suggestion` or a timestamp. Pre-formatted. */
  meta?: string;
  /** The comment itself. */
  body: ReactNode;
}

export interface DiffLine {
  /** Whether the line was added, removed, or is unchanged context. */
  kind: DiffLineKind;
  /** Line number in the baseline. Absent on an added line. */
  oldNumber?: number;
  /** Line number in the candidate. Absent on a removed line. */
  newNumber?: number;
  /** The line without its leading sign. */
  text: string;
  /** Review comments drawn under the line, in order. */
  comments?: readonly DiffLineComment[];
}

export interface DiffHunk {
  /** The `@@ -a,b +c,d @@ …` header, as the diff printed it. */
  header: string;
  /** The hunk's lines, in file order. */
  lines: DiffLine[];
}

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

/**
 * Reads the hunks of one file's unified diff. File headers (`diff --git`, `---`, `+++`, `index`)
 * are skipped; `\ No newline at end of file` is dropped. Lines before the first hunk are ignored.
 */
export function parseUnifiedDiff(text: string): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let current: DiffHunk | undefined;
  let oldLine = 0;
  let newLine = 0;
  for (const raw of text.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n')) {
    const header = HUNK.exec(raw);
    if (header) {
      current = { header: raw, lines: [] };
      hunks.push(current);
      oldLine = Number(header[1]);
      newLine = Number(header[2]);
      continue;
    }
    if (!current || raw.startsWith('\\')) continue;
    const sign = raw[0];
    const body = raw.slice(1);
    if (sign === '+') current.lines.push({ kind: 'added', newNumber: newLine++, text: body });
    else if (sign === '-') current.lines.push({ kind: 'removed', oldNumber: oldLine++, text: body });
    else if (sign === ' ' || raw === '') current.lines.push({ kind: 'context', oldNumber: oldLine++, newNumber: newLine++, text: body });
  }
  return hunks;
}

/** Added and removed line counts across hunks. */
export function countDiff(hunks: readonly DiffHunk[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.kind === 'added') added += 1;
      else if (line.kind === 'removed') removed += 1;
    }
  }
  return { added, removed };
}

/** The anchor a file's diff is reachable at: `metrics/duplication.txt` becomes `diff-metrics-duplication-txt`. */
export function diffAnchor(path: string): string {
  return `diff-${path.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}
