import type { CSSProperties } from 'react';
import { NO_GUTTER } from './CodeFrame';

/** One run of text: the ANSI slot (1 to 8) it is drawn in, or none for default ink, and whether it is bold. */
export type Run = [text: string, slot?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, bold?: boolean];

/**
 * A terminal transcript. `slots` holds the eight ANSI colours as CSS values
 * (literals or `var()` references); slot 8, bright black, is the dim ink.
 */
export function TerminalFrame({
  ground,
  ink,
  slots,
  lines,
  label,
}: {
  ground: string;
  ink: string;
  slots: readonly string[];
  lines: readonly (readonly Run[])[];
  label: string;
}) {
  const style: CSSProperties = {
    fontFamily: 'var(--ds-font-mono)',
    fontSize: NO_GUTTER.fs,
    lineHeight: `${NO_GUTTER.lh}px`,
    padding: '6px 12px',
    background: ground,
    color: ink,
    width: 'max-content',
    minWidth: '100%',
  };
  return (
    <div className="overflow-x-auto border-2 border-edge-strong" style={{ background: ground }}>
      <div style={style} role="img" aria-label={label}>
        {lines.map((runs, i) => (
          <div key={i} style={{ height: NO_GUTTER.lh, whiteSpace: 'pre' }}>
            {runs.map(([text, slot, bold], j) =>
              slot === undefined && !bold ? (
                text
              ) : (
                <span key={j} style={{ color: slot ? slots[slot - 1] : undefined, fontWeight: bold ? 700 : undefined }}>
                  {text}
                </span>
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
