/**
 * The compendium's plates: which components, and which states of each.
 *
 * A plate is GENERATED from the component's own Storybook module wherever one exists: the
 * registry names story exports and `StoryNode` renders them (args, `render`, meta args and
 * decorators), so the compendium shows exactly what the component page shows, and a renamed or
 * deleted story fails loudly here instead of silently dropping out of the document.
 * Hand-written JSX (`custom`) is for components with no story at all; it must exercise the
 * component's parts, which compendium.test.ts proves.
 *
 * Imports are relative into the design system's `src/` on purpose, not the package name: stories
 * import `../components/*`, so using the same module graph keeps one copy of every component in
 * the bundle (and one identity in the coverage test).
 */

import type { ReactNode } from 'react';

import * as ButtonStories from '../../design-system/src/stories/Button.stories';
import * as BadgeStories from '../../design-system/src/stories/Badge.stories';
import * as CardStories from '../../design-system/src/stories/Card.stories';
import * as StatCardStories from '../../design-system/src/stories/StatCard.stories';
import * as DataTableStories from '../../design-system/src/stories/DataTable.stories';
import * as SparklineStories from '../../design-system/src/stories/Sparkline.stories';
import * as InputStories from '../../design-system/src/stories/Input.stories';
import * as CheckboxStories from '../../design-system/src/stories/Checkbox.stories';
import * as FlowDiagramStories from '../../design-system/src/stories/FlowDiagram.stories';
import * as TimelineStories from '../../design-system/src/stories/Timeline.stories';
import * as TabsStories from '../../design-system/src/stories/Tabs.stories';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../../design-system/src/components/Table';
import { FlowDiagram, Path } from '../../design-system/src/components/docs/figures/FlowDiagram';
import { Timeline, Event } from '../../design-system/src/components/docs/figures/Timeline';
import { FigureFrame } from '../../design-system/src/components/docs/figures/FigureFrame';

export type Group = 'Primitives' | 'Data display' | 'Forms' | 'Figures' | 'Composite';
export const GROUPS: readonly Group[] = ['Primitives', 'Data display', 'Forms', 'Figures', 'Composite'];

export interface PlateState {
  /** The story export name, or a stable id for a hand-written state. Goes on `data-state`. */
  id: string;
  from: 'story' | 'custom';
  /** A thunk, so nothing is built at import time and the coverage test can watch the render. */
  render: () => ReactNode;
  /** What was authored: a story's merged args. The coverage test walks it for parts, because a story module may hoist JSX built before any render. */
  authored?: unknown;
}

export interface PlateSpec {
  /** Public export name. Goes on `data-component`. */
  component: string;
  group: Group;
  /** Declared height ceiling in mm (see compendium.layout.ts). The print test fails a plate that outgrows it, or one declared much taller than it measures. */
  height: number;
  /** `side`: the two rungs next to each other. `stack`: one under the other, for wide components. */
  layout: 'side' | 'stack';
  states: PlateState[];
}

// ---------------------------------------------------------------------------------------------
// Story -> node
// ---------------------------------------------------------------------------------------------

type Ctx = Record<string, unknown>;
type Decorator = (Story: () => ReactNode, ctx: Ctx) => ReactNode;
interface StoryLike {
  args?: Record<string, unknown>;
  render?: (args: Record<string, unknown>, ctx: Ctx) => ReactNode;
  decorators?: Decorator[];
}
interface MetaLike extends StoryLike {
  title?: string;
  component?: (props: never) => ReactNode;
}
export type StoryModule = { default: unknown } & Record<string, unknown>;

/**
 * Render one story export the way Storybook does, minus the runtime: meta args under story args,
 * the story's `render` (else the meta's, else the component), then decorators outward. `play`,
 * controls and `parameters` are interaction concerns and are ignored. It is a component, not a
 * call, so a `render` that uses a hook still works.
 */
function StoryNode({ mod, name }: { mod: StoryModule; name: string }): ReactNode {
  const meta = mod.default as MetaLike;
  const story = mod[name] as StoryLike;
  const args = { ...meta.args, ...story.args };
  const ctx: Ctx = { args, globals: {}, parameters: {}, viewMode: 'story', id: name, name, title: meta.title };
  const render = story.render ?? meta.render;
  const Component = meta.component as unknown as (props: Record<string, unknown>) => ReactNode;
  let Inner: () => ReactNode = () => (render ? render(args, ctx) : <Component {...args} />);
  for (const decorate of [...(story.decorators ?? []), ...(meta.decorators ?? [])]) {
    const previous = Inner;
    Inner = () => decorate(previous, ctx);
  }
  return <Inner />;
}

function fromStories(mod: StoryModule, names: readonly string[]): PlateState[] {
  return names.map((name) => {
    if (typeof mod[name] !== 'object' || name === 'default') {
      throw new Error(`Compendium: story "${name}" no longer exists in its module (has: ${Object.keys(mod).join(', ')}).`);
    }
    const meta = mod.default as MetaLike;
    return { id: name, from: 'story', render: () => <StoryNode mod={mod} name={name} />, authored: { ...meta.args, ...(mod[name] as StoryLike).args } };
  });
}

// ---------------------------------------------------------------------------------------------
// Plates
// ---------------------------------------------------------------------------------------------

/** A hand-written state: for what no story shows (here, the MDX-only item components). */
function mdxState(id: string, render: () => ReactNode): PlateState {
  return { id, from: 'custom', render };
}

export const PLATES: readonly PlateSpec[] = [
  { component: 'Button', group: 'Primitives', height: 230, layout: 'side', states: fromStories(ButtonStories, ['Default', 'Bracketed', 'Disabled', 'Pending']) },
  { component: 'Badge', group: 'Primitives', height: 110, layout: 'side', states: fromStories(BadgeStories, ['Default', 'Emphasis', 'Intent']) },
  { component: 'Card', group: 'Primitives', height: 180, layout: 'side', states: fromStories(CardStories, ['FullCard']) },

  { component: 'StatCard', group: 'Data display', height: 125, layout: 'side', states: fromStories(StatCardStories, ['SystemHealth', 'ComputeLatency']) },
  {
    // No story exists for Table (DataTable's stories cover it), so this one is written by hand, and
    // it is the proof that a part is exercised: the coverage test fails if any Table* is dropped.
    component: 'Table',
    group: 'Data display',
    height: 160,
    layout: 'stack',
    states: [
      {
        id: 'compound',
        from: 'custom',
        render: () => (
          <Table>
            <TableCaption>Edge clusters, last 5 minutes</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>[ CLUSTER ]</TableHead>
                <TableHead>[ REQUESTS ]</TableHead>
                <TableHead>[ P95 ]</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>us-east-edge-1</TableCell>
                <TableCell>48,210</TableCell>
                <TableCell>12ms</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>eu-west-edge-2</TableCell>
                <TableCell>31,004</TableCell>
                <TableCell>145ms</TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>Total</TableCell>
                <TableCell>79,214</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        ),
      },
    ],
  },
  { component: 'DataTable', group: 'Data display', height: 170, layout: 'stack', states: fromStories(DataTableStories, ['Default']) },
  { component: 'Sparkline', group: 'Data display', height: 65, layout: 'side', states: fromStories(SparklineStories, ['PrimaryTrend', 'DangerLatencySpike']) },

  { component: 'Input', group: 'Forms', height: 150, layout: 'side', states: fromStories(InputStories, ['DefaultInput', 'InputWithError', 'TextAreaStory']) },
  { component: 'Checkbox', group: 'Forms', height: 90, layout: 'side', states: fromStories(CheckboxStories, ['Checked', 'Indeterminate', 'WithError']) },

  { component: 'FlowDiagram', group: 'Figures', height: 150, layout: 'side', states: [...fromStories(FlowDiagramStories, ['OptimisticUi']), mdxState('mdx-items', () => (<FigureFrame title="MDX ITEMS"><FlowDiagram><Path>write → review → ship</Path><Path>hotfix → ship</Path></FlowDiagram></FigureFrame>))] },
  { component: 'Timeline', group: 'Figures', height: 200, layout: 'side', states: [...fromStories(TimelineStories, ['Shipped']), mdxState('mdx-items', () => (<FigureFrame title="MDX ITEMS"><Timeline><Event date="Mar 12" state="done">CLI copies the files</Event><Event date="Mar 18" state="now">Launch</Event></Timeline></FigureFrame>))] },

  { component: 'Tabs', group: 'Composite', height: 195, layout: 'stack', states: fromStories(TabsStories, ['Default', 'Underline']) },
];

/** Plates in the document's order: by group, then as listed. Stable, so the index is deterministic. */
export function orderedPlates(): PlateSpec[] {
  return GROUPS.flatMap((g) => PLATES.filter((p) => p.group === g));
}
