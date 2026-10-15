/**
 * What the Code & syntax page measures. Everything here is computed from the
 * package's exported `LEVELS` data and its `contrastRatio` / `composite`
 * (through round 6's `theme()` and `themeChecks()`), so a change to a level's
 * accents moves the checks with it. Nothing is typed in.
 *
 * TEMPORARY SOURCE: `theme()` and `fallbackValues()` read the decision board's
 * round-6 numbers. When the package ships `--ds-syntax-*` and `--ds-editor-*`,
 * read the values from the package instead; see `contract-fallback.ts`.
 */
import { EDITOR_ROLES, SYNTAX_ROLES, editorVar, syntaxVar } from '@/components/specimen/contract';
import { fallbackValues } from '@/components/specimen/contract-fallback';
import { GEO } from '@/components/specimen';
import type { NumbersTableData } from '@/components/specimen';
import { ratio } from '@/decisions/p2/Frame';
import { LEVEL_IDS, bands, theme, themeChecks, worst } from '@/decisions/r6/look';

export function codeSyntaxChecks() {
  return themeChecks();
}

/** Per level: every band the text sits on, the flat colour it composites to, and the lowest contrast on it. */
export function bandTables(): NumbersTableData[] {
  return LEVEL_IDS.map((lv) => {
    const l = theme(lv);
    const w = worst(l);
    return {
      title: `${lv} · ground ${l.ground} · worst ${w.r.toFixed(2)}:1 on ${w.band}`,
      head: ['band', 'flat', 'text on it', 'lowest', 'which'],
      rows: bands(l).map((b) => {
        const low = b.fgs.map((c) => ({ c, r: ratio(c, b.flat) })).sort((x, y) => x.r - y.r)[0]!;
        return [b.name, b.flat, b.why, `${low.r.toFixed(2)}${low.r < 4.5 ? ' ✕' : ''}`, low.c];
      }),
    };
  });
}

/** The alpha each translucent layer settled at, per level. */
export function alphaTable(): NumbersTableData {
  const [mid, sk] = LEVEL_IDS.map((lv) => theme(lv).alphas) as [Record<string, string>, Record<string, string>];
  return {
    title: 'Translucent layers',
    head: ['layer', ...LEVEL_IDS],
    rows: Object.keys(mid).map((k) => [k, mid[k]!, sk[k]!]),
  };
}

/** Every contract variable and the value it resolves to on each level. */
export function roleTable(): NumbersTableData {
  const [mid, sk] = LEVEL_IDS.map((lv) => fallbackValues(lv));
  return {
    title: 'Role to variable',
    head: ['variable', ...LEVEL_IDS],
    rows: [
      ...SYNTAX_ROLES.map((r) => [syntaxVar(r), mid!.syntax[r], sk!.syntax[r]]),
      ...EDITOR_ROLES.map((r) => [editorVar(r), mid!.editor[r], sk!.editor[r]]),
    ],
  };
}

export function metricsTable(): NumbersTableData {
  const g = GEO.spec;
  return {
    title: 'Type metrics',
    head: ['size', 'leading', 'ratio', 'tab', 'gutter', 'width of 48 columns'],
    rows: [[`${g.fs}px`, `${g.lh}px`, (g.lh / g.fs).toFixed(2), '2', `${g.mark + g.num + 1 + g.diff}ch`, `${Math.round((48 + g.mark + g.num + 1 + g.diff + g.pad) * g.fs * 0.6)}px`]],
  };
}
