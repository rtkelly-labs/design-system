import { describe, expect, it } from 'vitest';
import { BODY_MM, GAP_MM, paginate, type Packable } from './compendium.layout';

const plate = (component: string, group: string, height: number): Packable => ({ key: component, component, group, height });
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

  it('backfills earlier sheets, and is deterministic', () => {
    const a = paginate(plates);
    expect(paginate(plates).pageOf).toEqual(a.pageOf);
    // D (40) fits beside A (120) on the first sheet even though C and B came before it and did not.
    expect(a.pageOf.get('D')).toBe(a.pageOf.get('A'));
  });

  it('keeps the rungs of a split plate on one sheet when the pair fits', () => {
    const split = [
      { key: 'S#sketch', component: 'S', group: 'g', height: 100 },
      { key: 'S#midnight', component: 'S', group: 'g', height: 100, continuation: true },
      plate('T', 'g', 130),
      plate('U', 'g', 100),
    ];
    const { pageOf } = paginate(split);
    expect(pageOf.get('S#midnight')).toBe(pageOf.get('S#sketch'));
    // Too tall as a pair: the two blocks go to separate sheets rather than overflowing one.
    const tall = paginate([
      { key: 'V#sketch', component: 'V', group: 'g', height: 150 },
      { key: 'V#midnight', component: 'V', group: 'g', height: 150, continuation: true },
    ]);
    expect(tall.sheets.length).toBe(2);
  });

  it('fills sheets better than registry-order first-fit would', () => {
    const { sheets } = paginate([plate('a', 'g', 130), plate('b', 'g', 130), plate('c', 'g', 100), plate('d', 'g', 100)]);
    expect(sheets.length).toBe(2);
  });

  it('page numbers start after the index sheets', () => {
    const { index, pageOf } = paginate(plates);
    expect(Math.min(...pageOf.values())).toBe(index.length + 1);
  });
});
