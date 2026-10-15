import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { LevelPair } from './LevelPair';
import type { Level } from './look';
import { Label } from './parts';

export interface Surface {
  label: string;
  render: (level: Level) => ReactNode;
}

/** "The same theme on other surfaces": each surface labelled and stacked, once per level. */
export function SurfacesStrip({ surfaces, scope, columns }: { surfaces: readonly Surface[]; scope?: (level: Level) => CSSProperties; columns?: ComponentProps<typeof LevelPair>['columns'] }) {
  return (
    <LevelPair scope={scope} columns={columns}>
      {(lv) => (
        <div className="flex flex-col gap-3">
          {surfaces.map((s) => (
            <div key={s.label} className="flex min-w-0 flex-col gap-3">
              <Label>{s.label}</Label>
              {s.render(lv)}
            </div>
          ))}
        </div>
      )}
    </LevelPair>
  );
}
