/**
 * Pagination for the compendium, as a pure function of the registry. No hand-kept page numbers:
 * each plate declares a height, sheets are filled best-fit, and everything
 * that prints or asserts a page number (footer, index, print test) reads the same result.
 *
 * Heights are DECLARED (millimetres, a ceiling), not measured at render, so the HTML stays a pure
 * function of the registry. compendium.print.test.ts measures every plate in Chromium and fails if
 * one outgrows its declared height, or is declared more than SLACK_MM taller than it measures (so
 * the declarations cannot rot into wasted paper). The strict overflow check backstops the sheet.
 *
 * Packing is best-fit decreasing over whole plates (see paginate), so small plates backfill gaps.
 */

/** Usable body height of one sheet, and the gap between two plates on it. `FULL` is a plate that keeps a sheet. */
export const BODY_MM = 236;
export const FULL = BODY_MM;
export const GAP_MM = 6;
/** How much taller than measured a declared height may be. */
export const SLACK_MM = 25;

/** Index rows per sheet (three columns, one sheet for ~100 plates and groups): the first carries the title block. The strict overflow check fails the build if the rows stop fitting; lower these to spill onto a second sheet. */
export const INDEX_FIRST_ROWS = 100;
export const INDEX_ROWS = 120;

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

  // Best-fit decreasing over "units". A unit is a whole plate: a split plate's rung blocks stay
  // together on one sheet whenever the two fit (only a plate too tall for that is packed as separate
  // blocks). Units go in tallest first, each onto the sheet it leaves least room on, so the big
  // plates make the sheets and the small ones fill the gaps (measured against first-fit in registry
  // order, which left most sheets 20-55% empty). Deterministic: ties fall back to registry order.
  // Sheets are then ordered by their earliest plate and each sheet's plates by registry order, so a
  // group still reads in sequence. Adding or removing a plate can move later plates between sheets;
  // plate ids do not move, because every plate is its own React root.
  const units: { at: number; blocks: P[]; height: number }[] = [];
  plates.forEach((plate, at) => {
    const last = units[units.length - 1];
    if (plate.continuation && last && last.blocks[0]!.component === plate.component) {
      last.blocks.push(plate);
      last.height += GAP_MM + plate.height;
    } else units.push({ at, blocks: [plate], height: plate.height });
  });
  const items = units.flatMap((u) => (u.height <= BODY_MM ? [u] : u.blocks.map((b, i) => ({ at: u.at + i, blocks: [b], height: b.height }))));
  items.sort((a, b) => b.height - a.height || a.at - b.at);

  const packed: { used: number; items: typeof items }[] = [];
  for (const item of items) {
    let best = -1;
    let left = Infinity;
    packed.forEach((sheet, i) => {
      const room = BODY_MM - (sheet.used + GAP_MM + item.height);
      if (room >= 0 && room < left) {
        best = i;
        left = room;
      }
    });
    if (best === -1) {
      packed.push({ used: -GAP_MM, items: [] });
      best = packed.length - 1;
    }
    packed[best]!.items.push(item);
    packed[best]!.used += GAP_MM + item.height;
  }
  const sheets: P[][] = packed
    .map((s) => s.items.sort((a, b) => a.at - b.at))
    .sort((a, b) => a[0]!.at - b[0]!.at)
    .map((s) => s.flatMap((u) => u.blocks));

  const pageOf = new Map<string, number>();
  sheets.forEach((s, i) => s.forEach((p) => pageOf.set(p.key, index.length + 1 + i)));
  return { index, sheets, pageOf, total: index.length + sheets.length };
}
