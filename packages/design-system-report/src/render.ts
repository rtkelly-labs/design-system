/**
 * `renderReport` — a `.tsx` file in, one self-contained `.html` file out.
 *
 * The point of this is to replace the HTML an agent would otherwise hand-write.
 * A report built from these components inherits the whole system: the four-rung
 * theme ladder, roles whose contrast is audited by `pnpm check:contrast`, and
 * components whose appearance is pinned by the visual suite. A hand-written
 * `<div style="...">` inherits none of it and is a fresh design decision every
 * time.
 *
 * The pipeline is three steps and no intermediate artefacts:
 *
 *   TSX --esbuild--> markup --class attributes--> candidates --tailwind--> CSS
 *
 * See `candidates.ts` for why reading the candidates out of finished markup is
 * what makes a single pass possible.
 */

import { Buffer } from 'node:buffer';
import { readFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import path from 'node:path';
import { createRequire } from 'node:module';
import { extractCandidates } from './candidates';
import { formatProblems, lintReport, type ReportProblem } from './lint';
import { createReportCssCompiler } from './css';
import { renderMarkup } from './markup';
import { documentShell } from './shell';
import { typecheckReports } from './typecheck';
import { THEME_LEVELS, type ThemeLevel } from '@rtkelly13/design-system';

/**
 * The design system this report renders against, resolved **from the report**.
 *
 * This is the arrangement a separate package buys. While the generator lived
 * inside the design system it could only ever use the copy it shipped with, so
 * upgrading the components meant upgrading the tool and vice versa. Now
 * `@rtkelly13/design-system` is a peer, resolved from the report's own
 * directory: an author renders against the version they installed, the one their
 * editor typechecks against and their app is built with.
 *
 * Both paths come from the package's `exports` map rather than by reaching into
 * its layout, so this holds for a published install and for a workspace link.
 */
function designSystem(from: string) {
  const require_ = createRequire(path.join(from, 'noop.js'));
  const fail = (error: unknown) => {
    throw new Error(
      `Could not resolve @rtkelly13/design-system from ${from}. ` +
        'A report is rendered against the copy its own project installs, so it must be a ' +
        `dependency there:\n  pnpm add @rtkelly13/design-system\n\n${String(error)}`,
    );
  };
  try {
    return {
      entry: require_.resolve('@rtkelly13/design-system'),
      styles: require_.resolve('@rtkelly13/design-system/styles.css'),
    };
  } catch (error) {
    return fail(error) as never;
  }
}

/** Shared by the single- and multi-input entry points. */
export interface ReportOptions {
  /** `<title>`, and nothing else — the report's own heading is its business. */
  title?: string;

  /** Props passed to the report component. */
  props?: Record<string, unknown>;
  /**
   * Treat lint warnings as errors. The two warning rules — non-deterministic
   * values and behaviour that cannot run — are context-dependent enough that
   * blocking by default would be wrong, and important enough that CI should.
   */
  strict?: boolean;
  /** Skip the lint entirely. For rendering a file you did not write. */
  lint?: boolean;
  /**
   * Typecheck the report before rendering. On by default: esbuild strips types
   * without reading them, so without this a wrong prop is not an error but a
   * report with `[object Object]` in it.
   *
   * Skipped with a note when neither `@typescript/native-preview` nor
   * `typescript` resolves from the report's directory.
   */
  typecheck?: boolean;
}

export interface RenderReportResult {
  input: string;
  output: string;
  theme: ThemeLevel;
  html: string;
  /** How many distinct utilities the document actually used. */
  candidates: number;
  bytes: number;
  /** Lint warnings that did not block. Empty under `strict`, which throws. */
  warnings: ReportProblem[];
  /** Degradations, such as an optional Tailwind plugin that was not installed. */
  notes: string[];
}

export interface RenderReportOptions extends ReportOptions {
  /** Path to the report's `.tsx`. Must default-export a component or element. */
  input: string;
  /** Where to write the HTML. Defaults to `input` with an `.html` extension. */
  output?: string;
  /**
   * Rung of the theme ladder to render at. `sketch` by default: reports get read
   * in bright rooms and printed, which is the rung documented for exactly that.
   */
  theme?: ThemeLevel;
}

export interface RenderReportsOptions extends ReportOptions {
  inputs: readonly string[];
  /**
   * One document per rung. Rendering the same report on four levels costs one
   * bundle, one render and one stylesheet: the level lives on `<html>`, so the
   * markup — and therefore the candidate set — is identical on all of them.
   */
  themes?: readonly ThemeLevel[];
  /**
   * Where each document goes, given its input and level. The default writes
   * beside the input, suffixing the level only when there is more than one.
   */
  outputFor?: (input: string, theme: ThemeLevel, themeCount: number) => string;
}

function defaultOutputFor(input: string, theme: ThemeLevel, themeCount: number) {
  const base = input.replace(/\.tsx?$/, '');
  return themeCount > 1 ? `${base}.${theme}.html` : `${base}.html`;
}

function assertLadder(themes: readonly ThemeLevel[]) {
  for (const theme of themes) {
    if (!THEME_LEVELS.includes(theme)) {
      throw new Error(
        `Unknown theme level "${theme}". Expected one of: ${THEME_LEVELS.join(', ')}.`,
      );
    }
  }
}

/** Lint one report, throwing on anything that blocks. */
async function lintOrThrow(input: string, enabled: boolean, strict: boolean) {
  const problems = enabled ? lintReport(await readFile(input, 'utf8')) : [];
  const blocking = problems.filter((p) => strict || p.severity === 'error');
  if (blocking.length > 0) {
    throw new Error(
      `${path.basename(input)} breaks ${blocking.length} design system rule(s):\n\n` +
        `${formatProblems(path.relative(process.cwd(), input), blocking)}`,
    );
  }
  return problems.filter((p) => p.severity === 'warning');
}

/**
 * Render one or more reports, on one or more rungs.
 *
 * The ordering is what makes this quick. Both expensive things are paid once and
 * reused: Tailwind's compiler is built before the loop (~150ms, against ~0 per
 * document after), and each input is bundled and rendered once no matter how
 * many levels it is emitted at. Four levels of one report is therefore barely
 * more work than one.
 *
 * Every report is linted **before** any of them is bundled, so a batch with a
 * bad file fails in milliseconds rather than after rendering its siblings.
 */
export async function renderReports({
  inputs,
  themes = ['sketch'],
  outputFor = defaultOutputFor,
  title,
  props,
  strict = false,
  lint = true,
  typecheck = true,
}: RenderReportsOptions): Promise<RenderReportResult[]> {
  assertLadder(themes);
  if (themes.length === 0) throw new Error('At least one theme level is required.');
  if (inputs.length === 0) throw new Error('At least one report file is required.');

  const absolute = inputs.map((input) => path.resolve(input));
  const notes: string[] = [];

  // Cheapest gate first. The lint is 0.11ms and the typecheck is ~500ms, so a
  // report that breaks a colour rule never pays for a compiler run.
  const warnings = new Map<string, ReportProblem[]>();
  for (const input of absolute) {
    warnings.set(input, await lintOrThrow(input, lint, strict));
  }

  if (typecheck) {
    // Every report in one compiler run: loading the lib and React types is most
    // of the cost, and it is identical for each of them.
    const checked = await typecheckReports(absolute);
    if (!checked.ok) {
      throw new Error(`${checked.checker} rejected the report:\n\n${checked.diagnostics}`);
    }
    if (checked.checker === 'none') {
      notes.push(
        'No TypeScript compiler resolved from the report, so it was not typechecked. ' +
          'Install typescript, or @typescript/native-preview for a faster check.',
      );
    }
  }

  const { entry, styles } = designSystem(path.dirname(absolute[0] as string));
  const compiler = await createReportCssCompiler({ entry: styles });

  const results: RenderReportResult[] = [];
  for (const input of absolute) {
    const body = await renderMarkup({ input, designSystemEntry: entry, props });
    const candidates = extractCandidates(body);
    const css = compiler.build(candidates, body);

    for (const theme of themes) {
      const html = documentShell({
        body,
        css,
        theme,
        title: title ?? path.basename(input, path.extname(input)),
      });
      const output = path.resolve(outputFor(input, theme, themes.length));
      await writeFile(output, html, 'utf8');
      results.push({
        input,
        output,
        theme,
        html,
        candidates: candidates.length,
        bytes: Buffer.byteLength(html),
        warnings: warnings.get(input) ?? [],
        notes: [...notes, ...compiler.notes],
      });
    }
  }
  return results;
}

/** One report, one level, one file. The common case. */
export async function renderReport({
  input,
  output,
  theme = 'sketch',
  ...rest
}: RenderReportOptions): Promise<RenderReportResult> {
  const [result] = await renderReports({
    ...rest,
    inputs: [input],
    themes: [theme],
    outputFor: output ? () => output : undefined,
  });
  return result as RenderReportResult;
}
