/**
 * `@rtkelly-labs/design-system-report` — a TSX file in, one self-contained HTML report out.
 *
 * A separate package on purpose. This needs esbuild, Tailwind's compiler and a
 * TypeScript compiler to do its job; none of that belongs in the dependency
 * graph of an app that installs the design system for its components. Keeping
 * them apart also lets each version on its own clock — a fix here is not a
 * release of the components, and the report is rendered against whichever copy
 * of `@rtkelly-labs/design-system` the report's own project installs.
 */

export { renderReport, renderReports } from './render';
export type {
  ReportOptions,
  RenderReportOptions,
  RenderReportsOptions,
  RenderReportResult,
} from './render';
export { extractCandidates } from './candidates';
export { lintReport, formatProblems } from './lint';
export type { ReportProblem, Severity } from './lint';
export { buildReportCss, createReportCssCompiler } from './css';
export type { ReportCssOptions, ReportCssCompiler } from './css';
export { documentShell } from './shell';
export { typecheckReports, findChecker } from './typecheck';
export type { Checker, TypecheckResult } from './typecheck';
export type { DocumentShellOptions } from './shell';
