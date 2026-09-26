import type { ComponentPageDef } from '../types';

export const barChart: ComponentPageDef = {
  slug: 'bar-chart',
  name: 'BarChart',
  lede:
    'A categorical bar chart drawn with visx. Its SVG is deterministic, with 2px edges, fills taken from roles, and mono axis labels. It redraws for the level through CSS custom properties, so switching the theme needs no re-render.',
  props: ['BarChart'],
  keywords: 'chart graph bars visx svg data visualisation visualization horizontal responsive accent',
  examples: [
    {
      id: 'basic',
      title: 'Basic usage',
      description:
        '`data` is a list of `{ label, value }`. `width` and `height` set the SVG\'s coordinate space, and the chart scales down to fit narrower containers. Always write an `ariaLabel` that says what is measured and in what unit. The default only counts the categories.',
      file: 'bar-chart/basic.tsx',
    },
    {
      id: 'horizontal',
      title: 'Horizontal bars',
      description:
        '`orientation="horizontal"` suits long category names and ranked lists. Sort the data yourself, because the chart keeps your order. Widen the left `margin` to fit the longest label.',
      file: 'bar-chart/horizontal.tsx',
    },
    {
      id: 'per-bar-accent',
      title: 'Colour by meaning',
      description:
        'Each datum can take its own `accent`. Use an intent when the colour means something, such as a region over its latency objective. Say it in text as well, because colour alone is not an accessible encoding.',
      file: 'bar-chart/per-bar-accent.tsx',
    },
    {
      id: 'responsive',
      title: 'Responsive, in tabs',
      description:
        '`responsive` tracks the parent\'s width, with `height` fixed. Here it sits in `Tabs`, which switches the time window. Only the selected panel is laid out, so its chart measures its own width. For now the parent also needs the chart\'s height: without it the chart collapses to nothing (issue 306).',
      file: 'bar-chart/responsive-tabs.tsx',
      wide: true,
    },
    {
      id: 'inspect',
      title: 'Inspecting a bar',
      description:
        '`onBarClick` receives the datum and its index. Today it only works with a pointer: the bars are not focusable, so a keyboard user cannot reach this interaction (issue 311). Offer the same detail another way, such as a table, until the chart supports it.',
      file: 'bar-chart/inspect.tsx',
    },
  ],
  accessibility: {
    notes: [
      'The SVG is one `role="img"` with an accessible name. Screen readers read the `ariaLabel`, not the bars, so put the takeaway in the label or in nearby text.',
      'Next to a chart whose exact values matter, provide the same data as a `DataTable`. A chart shows the shape of the data. A table gives the numbers.',
      'The value labels on the bars (`showValues`) are the only non-colour encoding of each value. Keep them on unless the same values are printed nearby.',
      '`onBarClick` is pointer-only. The bars do not take focus and have no key handler, so do not make it the only way to reach information.',
    ],
  },
};
