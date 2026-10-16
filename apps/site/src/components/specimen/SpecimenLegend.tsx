import type { CSSProperties } from 'react';
import { CodeFrame } from './CodeFrame';
import type { RowSpec } from './CodeFrame';
import { LEVEL_IDS } from './LevelPair';
import type { CodeLook, Level } from './look';
import { Label } from './parts';
import { BracketText } from '@rtkelly13/design-system';

export interface LegendItem {
  label: string;
  rows: RowSpec[];
}

/**
 * One legend: a row per highlight, the label on the left and one small frame per
 * level beside it. Below `sm` the levels stack under the label.
 */
export function SpecimenLegend({
  items,
  look,
  notes = {},
  title = 'Legend',
  idPrefix = 'legend',
  scope,
}: {
  items: readonly LegendItem[];
  look: (level: Level) => CodeLook;
  /** A second line under a label, for what a frame cannot say (the underline style). */
  notes?: Record<string, string>;
  title?: string;
  idPrefix?: string;
  /** Per-level custom properties for each frame. Every frame carries its level's `data-theme`, so looks that read `var()` tokens resolve per column. */
  scope?: (level: Level) => CSSProperties;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label><BracketText>{title}</BracketText></Label>
      <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-[8.5rem_minmax(0,1fr)_minmax(0,1fr)]">
        <span className="hidden sm:block" />
        {LEVEL_IDS.map((lv) => (
          <span key={lv} className="hidden font-mono text-[11px] text-content-muted sm:block">{lv}</span>
        ))}
        {items.map((item) => (
          <div key={item.label} className="contents">
            <span className="self-center font-mono text-xs font-bold text-content-primary">
              {item.label}
              {notes[item.label] && <span className="block text-[10px] font-normal text-content-muted">{notes[item.label]}</span>}
            </span>
            {LEVEL_IDS.map((lv) => (
              <div key={lv} data-theme={lv} style={scope?.(lv)} className="min-w-0">
                <CodeFrame look={look(lv)} rows={item.rows} frameId={`${idPrefix}-${item.label}-${lv}`} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
