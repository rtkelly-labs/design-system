# ADR 0006 — Taxonomy for documentation visuals

## Status

Accepted

## Context

The design system has two kinds of visual module:

- responsive or interactive chart modules such as `BarChart`, `Sparkline`, and
  `BulletChart`, which own application-facing geometry and chart-engine
  integration;
- static documentation visuals adapted from mdxcn, which sit next to prose.
  Some use glyph cells, but several use CSS grid or flex layout.

Calling every documentation visual a `Graph` hides its data shape. Calling
every one `Ascii*` is also inaccurate: `ChangeSummary` and `BeforeAfter`, for
example, use CSS layout rather than character-cell geometry. The dashed
wrapper is presentation, not a chart.

The upstream catalogue also contains semantic documentation blocks such as
steps and terminal transcripts. Their names should describe their content.

## Decision

Name a renderer for its data and meaning. Make the frame optional and separate.

| Kind | Public naming | Examples | Contract |
| --- | --- | --- | --- |
| Wrapper | `FigureFrame` | One caption, border, and figure landmark around one or more renderers |
| Dated visual | `ActivityGrid`, `UptimeStrip`, `GanttChart` | Activity counts, service status, or dated work intervals |
| Relationship visual | `FlowDiagram`, `Timeline`, `TreeDiagram` | Paths, ordered events, or hierarchy |
| Comparison visual | `ChangeSummary`, `BeforeAfter` | Signed changes or paired measurements |
| Documentation block | `Steps`, `Terminal` | A procedure or command transcript |
| Application chart | `BarChart`, `Sparkline`, `BulletChart` | Responsive chart geometry and application interaction |

Reserve `Ascii*` for a component whose public contract requires character-cell
rendering, or when it must distinguish itself from another renderer with the
same semantic name. None of the current documentation visuals needs that
prefix: even `ActivityGrid` and `GanttChart` name their data form without
promising that their implementation always uses characters.

Renderers do not create a `FigureFrame`. Authors can place one renderer alone
or group related renderers under one caption. `FigureFrame` supplies the only
outer border and figure landmark. The existing application charts do not
change.

## Consequences

- `ActivityGrid` can show commits, blog posts, or any dated count.
- A composed incident figure can combine `Timeline` and `UptimeStrip` without
  nested borders or repeated captions.
- Changing a renderer's visual medium later does not force a public rename.
- A future interactive chart with the same data needs a distinct name if its
  controls and behaviour differ.
