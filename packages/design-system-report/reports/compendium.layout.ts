/**
 * Pagination for the compendium, as a pure function of the registry. No hand-kept page numbers:
 * each plate declares a size class, sheets are filled greedily in registry order, and everything
 * that prints or asserts a page number (footer, index, print test) reads the same result.
 *
 * Heights are DECLARED (millimetres, a ceiling), not measured at render, so the HTML stays a pure
 * function of the registry. compendium.print.test.ts measures every plate in Chromium and fails if
 * one outgrows its declared height, or is declared more than SLACK_MM taller than it measures (so
 * the declarations cannot rot into wasted paper). The strict overflow check backstops the sheet.
 *
 * Packing is first-fit within a group (see paginate), so small plates backfill gaps.
 */

/** Usable body height of one sheet, and the gap between two plates on it. `FULL` is a plate that keeps a sheet. */
export const BODY_MM = 236;
export const FULL = BODY_MM;
export const GAP_MM = 6;
/** How much taller than measured a declared height may be. */
export const SLACK_MM = 25;

/** Index rows per sheet: the first carries the title block, so fewer. */
export const INDEX_FIRST_ROWS = 18;
export const INDEX_ROWS = 28;

export interface Packable {
  component: string;
  group: string;
  /** Declared height ceiling in mm. */
  height: number;
}

export type IndexRow<P extends Packable> = { kind: 'group'; group: string } | { kind: 'plate'; plate: P };

export interface Pagination<P extends Packable> {
  /** Index sheets come first; their rows, per sheet. */
  index: IndexRow<P>[][];
  /** Plate sheets, each in registry order. */
  sheets: P[][];
  /** 1-based sheet number of every component. */
  pageOf: Map<string, number>;
  total: number;
}

export function paginate<P extends Packable>(plates: readonly P[]): Pagination<P> {
  const rows: IndexRow<P>[] = [];
  let group: string | undefined;
  for (const plate of plates) {
    if (plate.group !== group) rows.push({ kind: 'group', group: (group = plate.group) });
    rows.push({ kind: 'plate', plate });
  }
  const index: IndexRow<P>[][] = [rows.slice(0, INDEX_FIRST_ROWS)];
  for (let i = INDEX_FIRST_ROWS; i < rows.length; i += INDEX_ROWS) index.push(rows.slice(i, i + INDEX_ROWS));

  // First-fit within a group: a plate may backfill any sheet from the one the group started on
  // (which may be the previous group's partly filled last sheet). Sheets of earlier groups are
  // never revisited, so a change to one group cannot move another group's plates by more than the
  // sheets that group itself occupies.
  const sheets: P[][] = [];
  const used: number[] = [];
  let from = 0;
  let current: string | undefined;
  for (const plate of plates) {
    if (plate.group !== current) {
      current = plate.group;
      from = Math.max(0, sheets.length - 1);
    }
    let at = -1;
    for (let i = from; i < sheets.length; i++) {
      if ((used[i] ?? 0) + GAP_MM + plate.height <= BODY_MM) {
        at = i;
        break;
      }
    }
    if (at === -1) {
      sheets.push([]);
      used.push(-GAP_MM);
      at = sheets.length - 1;
    }
    sheets[at]!.push(plate);
    used[at] = (used[at] ?? 0) + GAP_MM + plate.height;
  }

  const pageOf = new Map<string, number>();
  sheets.forEach((s, i) => s.forEach((p) => pageOf.set(p.component, index.length + 1 + i)));
  return { index, sheets, pageOf, total: index.length + sheets.length };
}
