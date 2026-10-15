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
import type { ThemeLevel } from '../../design-system/src/index';

import * as CardStories from '../../design-system/src/stories/Card.stories';
import * as StatCardStories from '../../design-system/src/stories/StatCard.stories';
import * as DataTableStories from '../../design-system/src/stories/DataTable.stories';
import * as SparklineStories from '../../design-system/src/stories/Sparkline.stories';
import * as InputStories from '../../design-system/src/stories/Input.stories';
import * as FlowDiagramStories from '../../design-system/src/stories/FlowDiagram.stories';
import * as TimelineStories from '../../design-system/src/stories/Timeline.stories';
import * as TabsStories from '../../design-system/src/stories/Tabs.stories';
import * as AppShellStories from '../../design-system/src/stories/AppShell.stories';
import * as AvatarStories from '../../design-system/src/stories/Avatar.stories';
import * as BracketTextStories from '../../design-system/src/stories/BracketText.stories';
import * as NoteBlockStories from '../../design-system/src/stories/NoteBlock.stories';
import * as TLDRStories from '../../design-system/src/stories/TLDR.stories';
import * as TagStories from '../../design-system/src/stories/Tag.stories';
import * as ProseStories from '../../design-system/src/stories/Prose.stories';
import * as CodeBlockStories from '../../design-system/src/stories/CodeBlock.stories';
import * as CodeTabsStories from '../../design-system/src/stories/CodeTabs.stories';
import * as TerminalStories from '../../design-system/src/stories/Terminal.stories';
import * as StepsStories from '../../design-system/src/stories/Steps.stories';
import * as SwatchStories from '../../design-system/src/stories/Swatch.stories';
import * as AnchorHeadingStories from '../../design-system/src/stories/AnchorHeading.stories';
import * as DividerStories from '../../design-system/src/stories/Divider.stories';
import * as PageHeaderStories from '../../design-system/src/stories/PageHeader.stories';
import * as PageTitleStories from '../../design-system/src/stories/PageTitle.stories';
import * as SectionContainerStories from '../../design-system/src/stories/SectionContainer.stories';
import * as NerdIconStories from '../../design-system/src/stories/NerdIcon.stories';
import * as SocialIconStories from '../../design-system/src/stories/SocialIcon.stories';
import * as BreadcrumbsStories from '../../design-system/src/stories/Breadcrumbs.stories';
import * as PaginationStories from '../../design-system/src/stories/Pagination.stories';
import * as SiteNavStories from '../../design-system/src/stories/SiteNav.stories';
import * as SiteFooterStories from '../../design-system/src/stories/SiteFooter.stories';
import * as SiteHeaderStories from '../../design-system/src/stories/SiteHeader.stories';
import * as MobileNavStories from '../../design-system/src/stories/MobileNav.stories';
import * as DocsHeaderStories from '../../design-system/src/stories/DocsHeader.stories';
import * as DocsSidebarStories from '../../design-system/src/stories/DocsSidebar.stories';
import * as TableOfContentsStories from '../../design-system/src/stories/TableOfContents.stories';
import * as DocPagerStories from '../../design-system/src/stories/DocPager.stories';
import * as FieldsetStories from '../../design-system/src/stories/Fieldset.stories';
import * as ErrorSummaryStories from '../../design-system/src/stories/ErrorSummary.stories';
import * as ProgressStories from '../../design-system/src/stories/Progress.stories';
import * as SpinnerStories from '../../design-system/src/stories/Spinner.stories';
import * as SkeletonStories from '../../design-system/src/stories/Skeleton.stories';
import * as EmptyStateStories from '../../design-system/src/stories/EmptyState.stories';
import * as NotFoundPageStories from '../../design-system/src/stories/NotFoundPage.stories';
import * as ServerErrorPageStories from '../../design-system/src/stories/ServerErrorPage.stories';
import * as StatusPageStories from '../../design-system/src/stories/StatusPage.stories';
import * as ChartTooltipStories from '../../design-system/src/stories/ChartTooltip.stories';
import * as BarChartStories from '../../design-system/src/stories/BarChart.stories';
import * as BulletChartStories from '../../design-system/src/stories/BulletChart.stories';
import * as ActivityGridStories from '../../design-system/src/stories/ActivityGrid.stories';
import * as AsciiGaugeStories from '../../design-system/src/stories/AsciiGauge.stories';
import * as TelemetryGaugeStories from '../../design-system/src/stories/TelemetryGauge.stories';
import * as TickerTapeStories from '../../design-system/src/stories/TickerTape.stories';
import * as UptimeStripStories from '../../design-system/src/stories/UptimeStrip.stories';
import * as BeforeAfterStories from '../../design-system/src/stories/BeforeAfter.stories';
import * as ChangeSummaryStories from '../../design-system/src/stories/ChangeSummary.stories';
import * as DrawingSheetStories from '../../design-system/src/stories/DrawingSheet.stories';
import * as FigureFrameStories from '../../design-system/src/stories/FigureFrame.stories';
import * as GanttChartStories from '../../design-system/src/stories/GanttChart.stories';
import * as IndexedSectionStories from '../../design-system/src/stories/IndexedSection.stories';
import * as TreeDiagramStories from '../../design-system/src/stories/TreeDiagram.stories';
import * as CTASectionStories from '../../design-system/src/stories/CTASection.stories';
import * as FeatureGridStories from '../../design-system/src/stories/FeatureGrid.stories';
import * as HeroStories from '../../design-system/src/stories/Hero.stories';
import * as PricingGridStories from '../../design-system/src/stories/PricingGrid.stories';
import * as BlogPostStories from '../../design-system/src/stories/BlogPost.stories';
import * as ColophonCardStories from '../../design-system/src/stories/ColophonCard.stories';
import * as MetadataGridStories from '../../design-system/src/stories/MetadataGrid.stories';
import * as TrackCardStories from '../../design-system/src/stories/TrackCard.stories';
import * as SlideStories from '../../design-system/src/stories/Slide.stories';
import * as SlideDeckStories from '../../design-system/src/stories/SlideDeck.stories';
import * as ReportDocumentStories from '../../design-system/src/stories/ReportDocument.stories';
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
import { CodeBlock, CodeBlockAttachment } from '../../design-system/src/components/docs/CodeBlock';
import { Prose } from '../../design-system/src/components/docs/Prose';
import { GitHubIcon, LinkedInIcon, BlueskyIcon, XIcon, MailIcon } from '../../design-system/src/components/SocialIcon';
import { BarChart } from '../../design-system/src/components/BarChart';
import { BeforeAfter, Slope } from '../../design-system/src/components/docs/figures/BeforeAfter';
import { ChangeSummary, Line } from '../../design-system/src/components/docs/figures/ChangeSummary';
import { TreeDiagram, Node } from '../../design-system/src/components/docs/figures/TreeDiagram';
import { badgeStates, buttonStates, checkboxStates, inputStates, radioGroupStates, selectStates, switchStates } from './compendium.states';
import { ReportDocument, ReportSection } from '../../design-system/src/components/ReportDocument';
import { DrawingSheet } from '../../design-system/src/components/docs/figures/DrawingSheet';
import { IndexedSection } from '../../design-system/src/components/docs/figures/IndexedSection';
import { Glyph } from '../../design-system/src/components/Glyph';
import { AsciiDivider } from '../../design-system/src/components/AsciiDivider';
import { SiteLink } from '../../design-system/src/components/LinkProvider';
import { DocsLink } from '../../design-system/src/components/docs/DocsLinkProvider';

export const GROUPS = ['Primitives', 'Content', 'Layout', 'Navigation', 'Forms', 'Feedback', 'Data display', 'Figures', 'Marketing', 'Blog', 'Presentation', 'Icons'] as const;
export type Group = (typeof GROUPS)[number];

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
  /**
   * Too tall for both rungs on one sheet: show each rung as its own block, packed independently
   * (the sketch block, then the midnight block). `height` is then per block.
   */
  split?: boolean;
  /** Show only these rungs (default both). For page-scale templates, where a second rung would double a full sheet. */
  rungs?: readonly ThemeLevel[];
  /** The component clips its own content on purpose (a marquee window, a track, a bleeding watermark). Exempts it from the print test's clipped-content check; say why. */
  clips?: string;
  states: PlateState[];
}

export const RUNGS: readonly ThemeLevel[] = ['sketch', 'midnight'];

/** What the paginator packs: a whole plate, or one rung of a split plate. */
export interface Block {
  key: string;
  component: string;
  continuation: boolean;
  group: Group;
  height: number;
  plate: PlateSpec;
  rungs: readonly ThemeLevel[];
}

export const blockKey = (plate: PlateSpec, rung: ThemeLevel) => (plate.split && rungsOf(plate).length > 1 ? `${plate.component}#${rung}` : plate.component);

/** The rungs a plate is shown on. */
export const rungsOf = (plate: PlateSpec): readonly ThemeLevel[] => plate.rungs ?? RUNGS;

export function blocksOf(plates: readonly PlateSpec[]): Block[] {
  return plates.flatMap((plate): Block[] =>
    plate.split && rungsOf(plate).length > 1
      ? RUNGS.map((rung, i) => ({ key: blockKey(plate, rung), component: plate.component, continuation: i > 0, group: plate.group, height: plate.height, plate, rungs: [rung] }))
      : [{ key: plate.component, component: plate.component, continuation: false, group: plate.group, height: plate.height, plate, rungs: rungsOf(plate) }],
  );
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

/** A hand-written state, for a component no story shows (or only shows inside something else). */
function custom(id: string, render: () => ReactNode): PlateState {
  return { id, from: 'custom', render };
}

export const PLATES: readonly PlateSpec[] = [
  { component: 'Button', group: 'Primitives', height: 109, layout: 'side', states: buttonStates() },
  { component: 'Badge', group: 'Primitives', height: 71, layout: 'side', states: badgeStates() },
  { component: 'Card', group: 'Primitives', height: 61, layout: 'side', states: fromStories(CardStories, ['FullCard']) },

  { component: 'StatCard', group: 'Data display', height: 80, layout: 'side', states: fromStories(StatCardStories, ['SystemHealth', 'ComputeLatency']) },
  {
    // No story exists for Table (DataTable's stories cover it), so this one is written by hand, and
    // it is the proof that a part is exercised: the coverage test fails if any Table* is dropped.
    component: 'Table',
    group: 'Data display',
    height: 103,
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
  { component: 'DataTable', group: 'Data display', height: 109, layout: 'stack', states: fromStories(DataTableStories, ['Default']) },
  { component: 'Sparkline', group: 'Data display', height: 42, layout: 'side', states: fromStories(SparklineStories, ['PrimaryTrend', 'DangerLatencySpike']) },

  { component: 'Input', group: 'Forms', height: 93, layout: 'side', states: [...inputStates(), ...fromStories(InputStories, ['TextAreaStory'])] },
  { component: 'Checkbox', group: 'Forms', height: 60, layout: 'side', states: checkboxStates() },

  { component: 'FlowDiagram', group: 'Figures', height: 98, layout: 'side', states: [...fromStories(FlowDiagramStories, ['OptimisticUi']), mdxState('mdx-items', () => (<FigureFrame title="MDX ITEMS"><FlowDiagram><Path>write → review → ship</Path><Path>hotfix → ship</Path></FlowDiagram></FigureFrame>))] },
  { component: 'Timeline', group: 'Figures', height: 106, layout: 'side', states: [...fromStories(TimelineStories, ['Shipped']), mdxState('mdx-items', () => (<FigureFrame title="MDX ITEMS"><Timeline><Event date="Mar 12" state="done">CLI copies the files</Event><Event date="Mar 18" state="now">Launch</Event></Timeline></FigureFrame>))] },

  { component: 'Avatar', group: 'Content', height: 26, layout: 'side', states: fromStories(AvatarStories, ['Default']) },
  { component: 'BracketText', group: 'Content', height: 39, layout: 'side', states: fromStories(BracketTextStories, ['Emphasis']) },
  { component: 'NoteBlock', group: 'Content', height: 126, layout: 'side', states: fromStories(NoteBlockStories, ['AllTypes']) },
  { component: 'TLDR', group: 'Content', height: 60, layout: 'side', states: fromStories(TLDRStories, ['Default']) },
  { component: 'Tag', group: 'Content', height: 23, layout: 'side', states: fromStories(TagStories, ['Row']) },
  { component: 'Prose', group: 'Content', height: 145, layout: 'stack', states: fromStories(ProseStories, ['Default']) },
  { component: 'CodeBlock', group: 'Content', height: 117, layout: 'side', states: [...fromStories(CodeBlockStories, ['Default', 'NotCopyable']), custom('attached', () => (<CodeBlockAttachment value={true}><CodeBlock title="app.ts" language="ts">{'export const answer = 42;'}</CodeBlock></CodeBlockAttachment>))] },
  { component: 'CodeTabs', group: 'Content', height: 49, layout: 'side', states: fromStories(CodeTabsStories, ['Merged']) },
  { component: 'Terminal', group: 'Content', height: 58, layout: 'side', states: fromStories(TerminalStories, ['Default']) },
  { component: 'Steps', group: 'Content', height: 79, layout: 'side', states: fromStories(StepsStories, ['Default']) },
  { component: 'Swatch', group: 'Content', height: 45, layout: 'side', states: fromStories(SwatchStories, ['Group']) },
  {
    component: 'AnchorHeading',
    group: 'Content',
    height: 113,
    layout: 'side',
    // Headings carry no type of their own: the level scale comes from `Prose`, which is where they live in a docs page,
    // so the story is shown inside it (bare, h1-h4 are four identical lines). The copy-link anchor is hidden until hover
    // (`prose.css`), and a static page has no hover, so the second state shows it as a touch device does
    // (`@media (hover: none)` reveals it at full opacity); a rule, not a new look. A plain rule here, not a utility: `prose.css` is unlayered and beats any utility, and the report compiles only the utilities its own sources name.
    states: fromStories(AnchorHeadingStories, ['Levels']).flatMap((s): PlateState[] => [
      { ...s, id: 'levels', render: () => <Prose>{s.render()}</Prose> },
      { ...s, id: 'anchor-revealed', render: () => <div className="compendium-anchor-revealed"><style>{'.compendium-anchor-revealed .docs-anchor-link { opacity: 1; }'}</style><Prose>{s.render()}</Prose></div> },
    ]),
  },
  { component: 'Divider', group: 'Layout', height: 87, layout: 'stack', states: fromStories(DividerStories, ['Variants']) },
  { component: 'PageHeader', group: 'Layout', height: 100, layout: 'stack', states: fromStories(PageHeaderStories, ['WithChildren']) },
  { component: 'PageTitle', group: 'Layout', height: 84, layout: 'stack', states: fromStories(PageTitleStories, ['WithSubtitle']) },
  { component: 'SectionContainer', group: 'Layout', height: 38, layout: 'side', states: fromStories(SectionContainerStories, ['Default']) },
  { component: 'NerdIcon', group: 'Icons', height: 87, layout: 'side', states: fromStories(NerdIconStories, ['DeveloperGlyphs']) },
  { component: 'SocialIcon', group: 'Icons', height: 48, layout: 'side', states: [...fromStories(SocialIconStories, ['BrandMarks']), custom('named-icons', () => (<div className="flex gap-3"><GitHubIcon /><LinkedInIcon /><BlueskyIcon /><XIcon /><MailIcon /></div>))] },
  { component: 'Breadcrumbs', group: 'Navigation', height: 25, layout: 'side', states: fromStories(BreadcrumbsStories, ['WithUnlinkedGroup']) },
  { component: 'Pagination', group: 'Navigation', height: 66, layout: 'stack', states: fromStories(PaginationStories, ['ManyPages']) },
  { component: 'SiteNav', group: 'Navigation', height: 32, layout: 'side', states: fromStories(SiteNavStories, ['Default']) },
  { component: 'SiteFooter', group: 'Navigation', height: 110, layout: 'stack', states: fromStories(SiteFooterStories, ['Columns']) },
  { component: 'SiteHeader', group: 'Navigation', height: 126, layout: 'stack', states: fromStories(SiteHeaderStories, ['Portfolio']) },
  { component: 'MobileNav', group: 'Navigation', height: 71, layout: 'side', states: fromStories(MobileNavStories, ['Open']) },
  { component: 'DocsHeader', group: 'Navigation', height: 49, layout: 'stack', states: fromStories(DocsHeaderStories, ['WithSearch']) },
  { component: 'DocsSidebar', group: 'Navigation', height: 66, layout: 'side', states: fromStories(DocsSidebarStories, ['Default']) },
  { component: 'TableOfContents', group: 'Navigation', height: 49, layout: 'side', states: fromStories(TableOfContentsStories, ['Default']) },
  { component: 'DocPager', group: 'Navigation', height: 82, layout: 'stack', states: fromStories(DocPagerStories, ['Both']) },
  { component: 'Switch', group: 'Forms', height: 68, layout: 'side', states: switchStates() },
  { component: 'RadioGroup', group: 'Forms', height: 64, layout: 'side', states: radioGroupStates() },
  { component: 'Select', group: 'Forms', height: 56, layout: 'side', states: selectStates() },
  { component: 'Fieldset', group: 'Forms', height: 44, layout: 'side', states: fromStories(FieldsetStories, ['CheckboxSet']) },
  { component: 'ErrorSummary', group: 'Forms', height: 97, layout: 'side', states: fromStories(ErrorSummaryStories, ['Default']) },
  { component: 'Progress', clips: 'the fill is clipped by its track', group: 'Feedback', height: 24, layout: 'side', states: fromStories(ProgressStories, ['Determinate']) },
  { component: 'Spinner', group: 'Feedback', height: 24, layout: 'side', states: fromStories(SpinnerStories, ['Sizes']) },
  { component: 'Skeleton', group: 'Feedback', height: 64, layout: 'side', states: fromStories(SkeletonStories, ['Shapes']) },
  { component: 'EmptyState', group: 'Feedback', height: 65, layout: 'side', states: fromStories(EmptyStateStories, ['EmptySearchResult']) },
  { component: 'NotFoundPage', rungs: ['sketch'], group: 'Feedback', height: 86, layout: 'stack', states: fromStories(NotFoundPageStories, ['Standalone']) },
  { component: 'ServerErrorPage', rungs: ['sketch'], group: 'Feedback', height: 86, layout: 'stack', states: fromStories(ServerErrorPageStories, ['Standalone']) },
  { component: 'StatusPage', rungs: ['sketch'], group: 'Feedback', height: 86, layout: 'stack', states: fromStories(StatusPageStories, ['Maintenance']) },
  { component: 'ChartTooltip', group: 'Data display', height: 34, layout: 'side', states: fromStories(ChartTooltipStories, ['Primary']) },
  { component: 'BarChart', group: 'Data display', height: 126, layout: 'side', states: [...fromStories(BarChartStories, ['Vertical']), custom('responsive', () => (<div style={{ height: 280 }}><BarChart responsive data={[{ label: 'Mon', value: 4 }, { label: 'Tue', value: 7 }, { label: 'Wed', value: 5 }]} /></div>))] },
  { component: 'BulletChart', group: 'Data display', height: 24, layout: 'side', states: fromStories(BulletChartStories, ['PrimaryBenchmark']) },
  { component: 'ActivityGrid', group: 'Data display', height: 133, layout: 'stack', states: fromStories(ActivityGridStories, ['Commits']) },
  { component: 'AsciiGauge', group: 'Data display', height: 23, layout: 'side', states: fromStories(AsciiGaugeStories, ['Default']) },
  { component: 'TelemetryGauge', group: 'Data display', height: 23, layout: 'side', states: fromStories(TelemetryGaugeStories, ['Default']) },
  { component: 'TickerTape', clips: 'a marquee: the tape is wider than its window by design', group: 'Data display', height: 43, layout: 'stack', states: fromStories(TickerTapeStories, ['Default']) },
  { component: 'UptimeStrip', group: 'Figures', height: 57, layout: 'side', states: fromStories(UptimeStripStories, ['Default']) },
  { component: 'BeforeAfter', group: 'Figures', height: 102, layout: 'side', states: [...fromStories(BeforeAfterStories, ['Default']), mdxState('mdx-items', () => (<FigureFrame title="MDX ITEMS"><BeforeAfter fromLabel="before" toLabel="after"><Slope from={160} to={142}>p95</Slope><Slope from={420} to={390}>p99</Slope></BeforeAfter></FigureFrame>))] },
  { component: 'ChangeSummary', group: 'Figures', height: 105, layout: 'side', states: [...fromStories(ChangeSummaryStories, ['Default']), mdxState('mdx-items', () => (<FigureFrame title="MDX ITEMS"><ChangeSummary><Line sign="add" value="+31 kb">app</Line><Line sign="remove" value="-4 kb">vendor</Line></ChangeSummary></FigureFrame>))] },
  { component: 'DrawingSheet', group: 'Figures', height: 117, layout: 'side', states: [custom('sheet', () => (<DrawingSheet columns={3} rows={2}><IndexedSection index="A" title="What changed"><p>One file.</p></IndexedSection><IndexedSection index="B" title="How it was checked"><p>All tests pass.</p></IndexedSection></DrawingSheet>)), ...fromStories(DrawingSheetStories, ['StandaloneSection'])] },
  { component: 'FigureFrame', group: 'Figures', height: 61, layout: 'side', states: fromStories(FigureFrameStories, ['EditorialFigure']) },
  { component: 'GanttChart', group: 'Figures', height: 127, layout: 'stack', states: fromStories(GanttChartStories, ['ReleasePlan']) },
  { component: 'IndexedSection', group: 'Figures', height: 49, layout: 'side', states: fromStories(IndexedSectionStories, ['Numbered']) },
  { component: 'TreeDiagram', group: 'Figures', height: 94, layout: 'side', states: [...fromStories(TreeDiagramStories, ['Default']), mdxState('mdx-items', () => (<FigureFrame title="MDX ITEMS"><TreeDiagram><Node meta="ui">graph-frame.tsx</Node><Node meta="lib">theme.ts</Node></TreeDiagram></FigureFrame>))] },
  { component: 'CTASection', rungs: ['sketch'], group: 'Marketing', height: 84, layout: 'stack', states: fromStories(CTASectionStories, ['Default']) },
  { component: 'FeatureGrid', rungs: ['sketch'], group: 'Marketing', height: 92, layout: 'stack', states: fromStories(FeatureGridStories, ['Default']) },
  { component: 'Hero', rungs: ['sketch'], group: 'Marketing', height: 101, layout: 'stack', states: fromStories(HeroStories, ['WithMedia']) },
  { component: 'PricingGrid', rungs: ['sketch'], group: 'Marketing', height: 123, layout: 'stack', states: fromStories(PricingGridStories, ['TwoTiers']) },
  { component: 'BlogPost', rungs: ['sketch'], group: 'Blog', height: 125, layout: 'stack', states: fromStories(BlogPostStories, ['Default']) },
  { component: 'ColophonCard', clips: 'a decorative watermark glyph bleeds off the card', group: 'Blog', height: 68, layout: 'side', states: fromStories(ColophonCardStories, ['Default']) },
  { component: 'MetadataGrid', group: 'Blog', height: 42, layout: 'side', states: fromStories(MetadataGridStories, ['Default']) },
  { component: 'TrackCard', group: 'Blog', height: 117, layout: 'side', states: fromStories(TrackCardStories, ['Default']) },
  { component: 'Slide', group: 'Presentation', height: 88, layout: 'side', states: fromStories(SlideStories, ['Default']) },
  { component: 'SlideDeck', clips: 'chrome badges straddle the slide frame', rungs: ['sketch'], group: 'Presentation', height: 129, layout: 'stack', states: fromStories(SlideDeckStories, ['DefaultDeck']) },
  { component: 'ReportDocument', rungs: ['sketch'], group: 'Content', height: 105, layout: 'side', states: [...fromStories(ReportDocumentStories, ['Minimal', 'Disclosure']), custom('section', () => (<ReportDocument title="Link Audit"><ReportSection title="Findings"><p>None.</p></ReportSection></ReportDocument>))] },

  { component: 'Glyph', group: 'Icons', height: 38, layout: 'side', states: [custom('named', () => <Glyph name="git-branch" accent="primary" label="branch" />), custom('typographic', () => <Glyph bracketed accent="secondary">{'->'}</Glyph>)] },
  { component: 'AsciiDivider', group: 'Layout', height: 54, layout: 'stack', states: [custom('deprecated-alias', () => <AsciiDivider />)] },
  // SiteLink is a bare anchor: `aria-current="page"` is its whole current state and nothing styles it here (SiteNavItem does, through an
  // `aria-[current=page]:` variant, so the current look is on the SiteNav plate). A second cell would be a pixel copy of this one.
  { component: 'SiteLink', group: 'Navigation', height: 23, layout: 'side', states: [custom('link', () => <SiteLink href="/docs">Docs</SiteLink>)] },
  // DocsLink is a bare anchor too: external only adds target="_blank" and rel, with no icon or class, so it looks the same as internal.
  { component: 'DocsLink', group: 'Navigation', height: 23, layout: 'side', states: [custom('internal', () => <DocsLink href="/guide">Guide</DocsLink>)] },

  { component: 'AppShell', rungs: ['sketch'], group: 'Layout', height: 135, layout: 'stack', states: fromStories(AppShellStories, ['Default']) },

  { component: 'Tabs', group: 'Navigation', height: 125, layout: 'stack', states: fromStories(TabsStories, ['Default', 'Underline']) },
];

/** Plates in the document's order: by group, then as listed. Stable, so the index is deterministic. */
export function orderedPlates(): PlateSpec[] {
  return GROUPS.flatMap((g) => PLATES.filter((p) => p.group === g));
}
