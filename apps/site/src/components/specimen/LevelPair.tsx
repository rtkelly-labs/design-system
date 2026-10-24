import type { CSSProperties, ReactNode } from 'react';
import type { Level } from './look';
import { BracketText } from '@rtkelly13/design-system';

export const LEVEL_IDS: Level[] = ['midnight', 'sketch'];

/** Where the two panels sit side by side. Below it they stack: one column at 375px. */
const COLUMNS = {
  lg: 'grid grid-cols-1 gap-4 lg:grid-cols-2',
  xl: 'grid grid-cols-1 gap-4 xl:grid-cols-2',
  /** For a narrow column, such as the docs article beside its sidebar and contents rail. */
  '2xl': 'grid grid-cols-1 gap-4 2xl:grid-cols-2',
} as const;

/** One level of the package, scoped to a subtree with `data-theme`, in a labelled panel. */
export function LevelPanel({
  level,
  label,
  style,
  children,
}: {
  level: Level;
  label?: string;
  /** Custom properties for this level, on the panel so every descendant resolves them. */
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div data-theme={level} style={style} className="min-w-0 border-2 border-edge-strong bg-surface-base p-3 text-content-primary sm:p-4">
      <p className="m-0 mb-3 font-mono text-xs font-bold uppercase tracking-wider text-accent-primary"><BracketText>{label ?? level}</BracketText></p>
      {children}
    </div>
  );
}

/**
 * Renders `children` once per level, each in its own `data-theme` panel, side by
 * side from `columns` up and in one column below it. Because the panels carry
 * the level, everything inside resolves its role tokens for that level.
 */
export function LevelPair({
  children,
  scope,
  columns = 'xl',
}: {
  children: (level: Level) => ReactNode;
  /** Per-level custom properties, set on each panel. */
  scope?: (level: Level) => CSSProperties;
  columns?: keyof typeof COLUMNS;
}) {
  return (
    <div className={COLUMNS[columns]}>
      {LEVEL_IDS.map((l) => (
        <LevelPanel key={l} level={l} style={scope?.(l)}>
          {children(l)}
        </LevelPanel>
      ))}
    </div>
  );
}
