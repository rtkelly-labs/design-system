/**
 * The shape and letter each categorical series member wears under the `patterns`
 * preference. Data only, so it sits apart from `seriesShape.tsx`, which draws.
 */

/** The shape of each series member, in order. Six that stay distinct at 12px and in one ink. */
export const SERIES_SHAPES = ['circle', 'square', 'triangle', 'diamond', 'cross', 'ring'] as const;

export type SeriesShapeName = (typeof SERIES_SHAPES)[number];

/** The letter of each series member, in order, for a reader who cannot rely on the shape either. */
export const SERIES_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
