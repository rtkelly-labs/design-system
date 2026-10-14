import { describe, expect, it } from 'vitest';
import { BODY_MM, GAP_MM, paginate, type Packable } from './compendium.layout';

const plate = (component: string, group: string, height: number): Packable => ({ component, group, height });
const sheetCost = (s: Packable[]) => s.reduce((n, p) => n + p.height, 0) + GAP_MM * (s.length - 1);

describe('compendium pagination', () => {
  const plates = [
    plate('A', 'g1', 120),
    plate('B', 'g1', 150),
    plate('C', 'g1', 130),
    plate('D', 'g1', 40),
    plate('E', 'g2', 60),
    plate('F', 'g2', 236),
    plate('G', 'g3', 90),
  ];

  it('places every plate once and never exceeds the sheet body', () => {
    const { sheets, pageOf } = paginate(plates);
    expect(sheets.flat().map((p) => p.component).sort()).toEqual(plates.map((p) => p.component).sort());
    for (const s of sheets) expect(sheetCost(s)).toBeLessThanOrEqual(BODY_MM);
    expect(pageOf.size).toBe(plates.length);
  });

  it('backfills within a group, and is deterministic', () => {
    const a = paginate(plates);
    expect(paginate(plates).pageOf).toEqual(a.pageOf);
    // D (40) fits beside A (120) on the first sheet even though C and B came before it and did not.
    expect(a.pageOf.get('D')).toBe(a.pageOf.get('A'));
  });

  it('removing a plate leaves other groups on their own pages or earlier-group pages unchanged', () => {
    const before = paginate(plates).pageOf;
    const after = paginate(plates.filter((p) => p.component !== 'G')).pageOf;
    for (const name of ['A', 'B', 'C', 'D', 'E', 'F']) expect(after.get(name)).toBe(before.get(name));
  });

  it('page numbers start after the index sheets', () => {
    const { index, pageOf } = paginate(plates);
    expect(Math.min(...pageOf.values())).toBe(index.length + 1);
  });
});
