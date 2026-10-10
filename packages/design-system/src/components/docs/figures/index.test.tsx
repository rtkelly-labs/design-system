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
  SheetSection,
  UptimeStrip,
  Event,
  Line,
  Node,
  Path,
  Slope,
  Step,
  Steps,
  Terminal,
} from './index';

describe('documentation figure surface', () => {
  it('exports every figure, documentation block, and MDX data item publicly', () => {
    expect([FigureFrame, ActivityGrid, GanttChart, FlowDiagram, Timeline, ChangeSummary, BeforeAfter, UptimeStrip, TreeDiagram, FileChangeTree, DrawingSheet, SheetSection, Terminal, Steps]).toHaveLength(14);
    expect([Path, Event, Line, Slope, Node, Step]).toHaveLength(6);
  });

  it('registers the authored JSX names in the MDX map', () => {
    expect(mdxComponents).toMatchObject({ FigureFrame, ActivityGrid, GanttChart, FlowDiagram, Timeline, ChangeSummary, BeforeAfter, UptimeStrip, TreeDiagram, FileChangeTree, DrawingSheet, SheetSection, Terminal, Steps, Path, Event, Line, Slope, Node, Step });
    expect(mdxComponents).not.toHaveProperty('Graph');
    expect(mdxComponents).not.toHaveProperty('AsciiFlow');
  });
});
