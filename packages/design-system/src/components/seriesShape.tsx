/**
 * The six series shapes and letters, and the one drawing of them.
 *
 * Not exported from the package index: `SeriesMark` (HTML) and `BarChart` (SVG)
 * both draw from here so that series 3 is the same triangle in a legend and on a
 * bar, and nothing outside needs the primitive.
 */

/** The shape of each series member, in order. Six that stay distinct at 12px and in one ink. */
export const SERIES_SHAPES = ['circle', 'square', 'triangle', 'diamond', 'cross', 'ring'] as const;

export type SeriesShapeName = (typeof SERIES_SHAPES)[number];

/** The letter of each series member, in order, for a reader who cannot rely on the shape either. */
export const SERIES_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/**
 * One shape in a 0..10 box, filled with the inherited `fill` (the ring is
 * stroked in `currentColor`).
 */
export function SeriesShape({ shape }: { shape: SeriesShapeName }) {
  switch (shape) {
    case 'circle':
      return <circle cx="5" cy="5" r="4.5" />;
    case 'square':
      return <rect x="0.5" y="0.5" width="9" height="9" />;
    case 'triangle':
      return <polygon points="5,0.5 9.5,9.5 0.5,9.5" />;
    case 'diamond':
      return <polygon points="5,0 10,5 5,10 0,5" />;
    case 'cross':
      return <path d="M3.5 0.5h3v3h3v3h-3v3h-3v-3h-3v-3h3z" />;
    case 'ring':
      return <circle cx="5" cy="5" r="3.5" fill="none" stroke="currentColor" strokeWidth="2.4" />;
  }
}
