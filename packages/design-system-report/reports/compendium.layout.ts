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
 * Packing is first-fit (see paginate), so small plates backfill gaps.
 */

/** Usable body height of one sheet, and the gap between two plates on it. `FULL` is a plate that keeps a sheet. */
export const BODY_MM = 236;
export const FULL = BODY_MM;
export const GAP_MM = 6;
/** How much taller than measured a declared height may be. */
export const SLACK_MM = 25;

/** Index rows per sheet (two columns): the first carries the title block, so fewer. */
export const INDEX_FIRST_ROWS = 40;
export const INDEX_ROWS = 60;

export interface Packable {
  /** Unique per block: the component, or `component#rung` for a plate split across sheets. */
  key: string;
  component: string;
  /** Later blocks of a split plate: packed like any other, but not listed again in the index. */
  continuation?: boolean;
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
  /** 1-based sheet number of every block, by block key. */
  pageOf: Map<string, number>;
  total: number;
}

export function paginate<P extends Packable>(plates: readonly P[]): Pagination<P> {
  const rows: IndexRow<P>[] = [];
  let group: string | undefined;
  for (const plate of plates) {
    if (plate.group !== group) rows.push({ kind: 'group', group: (group = plate.group) });
    if (!plate.continuation) rows.push({ kind: 'plate', plate });
  }
  const index: IndexRow<P>[][] = [rows.slice(0, INDEX_FIRST_ROWS)];
  for (let i = INDEX_FIRST_ROWS; i < rows.length; i += INDEX_ROWS) index.push(rows.slice(i, i + INDEX_ROWS));

  // First-fit over every sheet, in registry order: a small plate backfills the first gap that holds
  // it. Deterministic, and denser than next-fit (measured: 48 sheets against 52 for 85 blocks).
  // Adding or removing a plate can pull later plates back a sheet; the plate ids do not move,
  // because every plate is its own React root.
  const sheets: P[][] = [];
  const used: number[] = [];
  for (const plate of plates) {
    let at = -1;
    for (let i = 0; i < sheets.length; i++) {
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
  sheets.forEach((s, i) => s.forEach((p) => pageOf.set(p.key, index.length + 1 + i)));
  return { index, sheets, pageOf, total: index.length + sheets.length };
}
