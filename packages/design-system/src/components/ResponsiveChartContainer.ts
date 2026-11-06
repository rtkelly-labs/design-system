/**
 * visx `ParentSize`, re-exported for a chart that tracks its parent's width.
 *
 * Its own module so docgen does not read `ParentSize`'s props as `BarChart`'s
 * (#312), which it did while the two shared a file.
 */
export { ParentSize as ResponsiveChartContainer } from '@visx/responsive';
