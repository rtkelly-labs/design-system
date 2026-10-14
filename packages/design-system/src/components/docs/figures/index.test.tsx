import { describe, expect, it } from 'vitest';
import { mdxComponents } from '../mdxComponents';
import {
  FigureFrame,
  ActivityGrid,
  BeforeAfter,
  ChangeSummary,
  FlowDiagram,
  GanttChart,
  Timeline,
  TreeDiagram,
  FileChangeTree,
  DrawingSheet,
  IndexedSection,
  UptimeStrip,
  Event,
  Line,
  Node,
  Path,
  Slope,
  Step,
  Steps,
  Terminal,
  SwatchCompare,
  MetricStrip,
  TokenTable,
  Decision,
  Option,
  TermGrid,
  Term,
} from './index';

describe('documentation figure surface', () => {
  it('exports every figure, documentation block, and MDX data item publicly', () => {
    expect([FigureFrame, ActivityGrid, GanttChart, FlowDiagram, Timeline, ChangeSummary, BeforeAfter, UptimeStrip, TreeDiagram, FileChangeTree, DrawingSheet, IndexedSection, Terminal, Steps, SwatchCompare, MetricStrip, TokenTable, Decision, TermGrid]).toHaveLength(19);
    expect([Path, Event, Line, Slope, Node, Step, Option, Term]).toHaveLength(8);
  });

  it('registers the authored JSX names in the MDX map', () => {
    expect(mdxComponents).toMatchObject({ FigureFrame, ActivityGrid, GanttChart, FlowDiagram, Timeline, ChangeSummary, BeforeAfter, UptimeStrip, TreeDiagram, FileChangeTree, DrawingSheet, IndexedSection, Terminal, Steps, Path, Event, Line, Slope, Node, Step, SwatchCompare, MetricStrip, TokenTable, Decision, Option, TermGrid, Term });
    expect(mdxComponents).not.toHaveProperty('Graph');
    expect(mdxComponents).not.toHaveProperty('AsciiFlow');
  });
});
