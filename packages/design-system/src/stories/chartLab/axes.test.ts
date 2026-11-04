import { describe, expect, it } from 'vitest';
import { LATENCY_HEATMAP_VARIANTS } from '../../components/LatencyHeatmap';
import { variantAxes, variantAxisNames } from './axes';

describe('variantAxes', () => {
  it('ignores the __docgenInfo key Storybook’s docgen adds to an exported constant', () => {
    // What the Storybook build does to LATENCY_HEATMAP_VARIANTS; vitest never runs that plugin.
    const annotated = Object.assign({ ...LATENCY_HEATMAP_VARIANTS }, { __docgenInfo: { displayName: 'LATENCY_HEATMAP_VARIANTS', props: {} } }) as unknown as typeof LATENCY_HEATMAP_VARIANTS;
    expect(variantAxisNames(annotated)).toEqual(Object.keys(LATENCY_HEATMAP_VARIANTS));
    expect(variantAxes(annotated).every(([, values]) => Array.isArray(values))).toBe(true);
  });
});
