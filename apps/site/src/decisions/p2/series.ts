import { LEVELS, PALETTE_HUES } from '@rtkelly13/design-system';
import type { Hue, LevelDefinition, ThemeLevel } from '@rtkelly13/design-system';
import { deltaE, minPair, simulate, subsets } from './colour';
import type { Vision } from './colour';

export const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'cross', 'ring', 'bar', 'star'] as const;
export type Shape = (typeof SHAPES)[number];
export const LEVEL_IDS: readonly ThemeLevel[] = ['midnight', 'sketch'];

export interface Member {
  name: string;
  /** What the member is declared as: a hue name, or a role. */
  source: string;
  colour: (d: LevelDefinition) => string;
  shape?: Shape;
  letter?: string;
}

const CAL_NAMES = ['Work', 'Home', 'Family', 'Fitness', 'Travel', 'Team', 'Birthdays', 'Holidays'];

const hueMember = (h: Hue, i: number, glyph: boolean): Member => ({
  name: CAL_NAMES[i]!,
  source: h,
  colour: (d) => d.palette[h],
  shape: glyph ? SHAPES[i] : undefined,
  letter: glyph ? String.fromCharCode(65 + i) : undefined,
});

/** Worst-level minimum pairwise deltaE of a hue subset, normal vision. The objective for the search. */
function score(set: readonly Hue[]): number {
  return Math.min(...LEVEL_IDS.map((l) => minPair(set.map((h) => LEVELS[l].palette[h])).min));
}

function best(k: number): Hue[] {
  let top: Hue[] = [];
  let topScore = -1;
  for (const s of subsets<Hue>(PALETTE_HUES, k)) {
    const sc = score(s);
    if (sc > topScore) {
      topScore = sc;
      top = s;
    }
  }
  return top;
}

export const BEST6 = best(6);
export const BEST8 = best(8);

const ROLE_MEMBERS: [string, (d: LevelDefinition) => string][] = [
  ['accent.primary', (d) => d.accent.primary],
  ['accent.secondary', (d) => d.accent.secondary],
  ['accent.tertiary', (d) => d.accent.tertiary],
  ['accent.quiet', (d) => d.accent.quiet],
  ['intent.info', (d) => d.intent.info],
  ['intent.success', (d) => d.intent.success],
  ['intent.warning', (d) => d.intent.warning],
  ['intent.danger', (d) => d.intent.danger],
];

const roleMember = (i: number, glyph: boolean): Member => ({
  name: CAL_NAMES[i]!,
  source: ROLE_MEMBERS[i]![0],
  colour: ROLE_MEMBERS[i]![1],
  shape: glyph ? SHAPES[i] : undefined,
  letter: glyph ? String.fromCharCode(65 + i) : undefined,
});

export const SET: Record<string, Member[]> = {
  CUR: ROLE_MEMBERS.map((_, i) => roleMember(i, false)),
  'D9-A': BEST6.map((h, i) => hueMember(h, i, true)),
  'D9-B': BEST8.map((h, i) => hueMember(h, i, false)),
  'D9-C': ROLE_MEMBERS.map((_, i) => roleMember(i, true)),
};

export interface VisionStat {
  vision: Vision;
  min: number;
  pair: string;
}

export interface SetStats {
  /** Number of colours that are actually different (deltaE >= 0.04 apart), normal vision. */
  distinct: number;
  vision: VisionStat[];
}

/** Colours within 0.04 deltaE of each other count as one colour (the gate in DESIGN.md). */
export function stats(opt: string, level: ThemeLevel): SetStats {
  const members = SET[opt]!;
  const colours = members.map((m) => m.colour(LEVELS[level]));
  const groups: number[] = [];
  colours.forEach((c, i) => {
    const hit = groups.find((g) => deltaE(simulate(colours[g]!, 'normal'), c) < 0.04);
    if (hit === undefined) groups.push(i);
  });
  const vision: VisionStat[] = (['normal', 'deuteranopia', 'protanopia'] as const).map((v) => {
    const p = minPair(colours, v);
    return { vision: v, min: p.min, pair: `${members[p.a]!.name}/${members[p.b]!.name}` };
  });
  return { distinct: groups.length, vision };
}
