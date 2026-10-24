#!/usr/bin/env node
/**
 * `ds-report <report.tsx> [options]`
 *
 * The agent-facing surface. Deliberately thin: parse flags, call
 * `renderReport`, print one line of what happened, and turn a missing optional
 * peer into an instruction rather than a stack trace.
 */

import process from 'node:process';
import { THEME_LEVELS, type ThemeLevel } from '@rtkelly-labs/design-system';
import { formatProblems } from './lint';
import path from 'node:path';
import { describeOverflow, htmlToPdf, type PaperSize } from './pdf';
import { renderReports } from './render';

const USAGE = `ds-report — render a TSX report to one self-contained HTML file

  ds-report <report.tsx> [more.tsx ...] [options]

Options
  -o, --output <file>   Where to write. Single input and single level only.
                        Default: the input with an .html extension, suffixed
                        with the level when more than one is asked for.
  -t, --theme <levels>  Comma-separated rungs: ${THEME_LEVELS.join(' | ')}.
                        Default: sketch. Several levels cost one render, not two.
      --title <text>    Document <title>. Default: the input's filename.
      --pdf             Also emit <name>[.level].pdf beside each HTML, printing
                        the finished document through headless Chromium under
                        print media. Needs playwright as a devDependency and a
                        downloaded Chromium — it is an optional peer.
      --paper <size>    A4 (default) or Letter. Read with --pdf: the page's own
                        @page rule wins over the format when it declares one.
      --strict          Treat lint warnings and --pdf page overflow as errors.
                        Use this in CI.
      --no-lint         Skip the design system lint. For files you did not write.
      --no-typecheck    Skip the type check. It is on by default.
  -h, --help            This text.

The report is linted against this system's own rules and then typechecked with
your own TypeScript before it renders. See AGENTS.md.

The report must default-export a React component. Compose it from
@rtkelly-labs/design-system — ReportDocument and ReportSection are the frame.
`;

interface Parsed {
  inputs: string[];
  output?: string;
  theme?: string;
  title?: string;
  pdf: boolean;
  paper: PaperSize;
  strict: boolean;
  lint: boolean;
  typecheck: boolean;
  help: boolean;
}

function parse(argv: readonly string[]): Parsed {
  const parsed: Parsed = {
    inputs: [],
    pdf: false,
    paper: 'A4',
    strict: false,
    lint: true,
    typecheck: true,
    help: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] as string;
    const next = () => {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('-')) throw new Error(`${argument} needs a value.`);
      index += 1;
      return value;
    };
    switch (argument) {
      case '-o':
      case '--output':
        parsed.output = next();
        break;
      case '-t':
      case '--theme':
        parsed.theme = next();
        break;
      case '--title':
        parsed.title = next();
        break;
      case '--pdf':
        parsed.pdf = true;
        break;
      case '--paper': {
        const value = next();
        if (value !== 'A4' && value !== 'Letter') {
          throw new Error(`--paper must be A4 or Letter, not "${value}".`);
        }
        parsed.paper = value;
        break;
      }
      case '--strict':
        parsed.strict = true;
        break;
      case '--no-lint':
        parsed.lint = false;
        break;
      case '--no-typecheck':
        parsed.typecheck = false;
        break;
      case '-h':
      case '--help':
        parsed.help = true;
        break;
      default:
        if (argument.startsWith('-')) throw new Error(`Unknown option ${argument}.`);
        parsed.inputs.push(argument);
    }
  }
  return parsed;
}

/**
 * `esbuild` and `tailwindcss` are optional peers — a consumer who only renders
 * components should not be made to install a build toolchain. That trade is only
 * defensible if the failure says so precisely.
 */
function explain(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const missing = /Cannot find (?:package|module) '(esbuild|tailwindcss)'/.exec(message);
  if (missing) {
    return `ds-report needs ${missing[1]}, which is an optional peer dependency of this package.\n  pnpm add -D esbuild tailwindcss`;
  }
  return message;
}

async function main(argv: readonly string[]) {
  const options = parse(argv);
  if (options.help || options.inputs.length === 0) {
    process.stdout.write(USAGE);
    process.exitCode = options.inputs.length > 0 ? 0 : 1;
    return;
  }

  const themes = (options.theme?.split(',').map((t) => t.trim()) ?? ['sketch']) as ThemeLevel[];
  if (options.output && (options.inputs.length > 1 || themes.length > 1)) {
    throw new Error('--output names one file, so it cannot be used with several inputs or levels.');
  }

  const results = await renderReports({
    inputs: options.inputs,
    themes,
    outputFor: options.output ? () => options.output as string : undefined,
    title: options.title,
    strict: options.strict,
    lint: options.lint,
    typecheck: options.typecheck,
  });

  // One warning block per input, not per document: four levels of one report
  // share a source file and would otherwise repeat themselves four times.
  // Degradations are a property of the invocation, not of any one report.
  for (const note of results[0]?.notes ?? []) {
    process.stderr.write(`  note   ${note}\n\n`);
  }

  const reported = new Set<string>();
  for (const result of results) {
    if (result.warnings.length === 0 || reported.has(result.input)) continue;
    reported.add(result.input);
    process.stderr.write(
      `${formatProblems(path.relative(process.cwd(), result.input), result.warnings)}\n\n` +
        '  (--strict makes these fail)\n\n',
    );
  }
  // Printing is a post-step on finished documents, not a second render: the
  // outputs are absolute already, so the peer walk finds the author's project.
  const pdfs: string[] = [];
  const overflows: string[] = [];
  if (options.pdf) {
    for (const result of results) {
      const printed = await htmlToPdf(result.output, { paper: options.paper });
      pdfs.push(printed.output);
      // Chromium adds a page without a word when a sheet outgrows the paper, so
      // the page count against the document's own break rules is the only tell.
      const overflow = describeOverflow(printed, options.paper);
      if (overflow) overflows.push(overflow);
    }
  }
  for (const message of overflows) {
    process.stderr.write(`  ${options.strict ? 'error  ' : 'warning'} page overflow: ${message}\n\n`);
  }
  for (const result of results) {
    process.stdout.write(
      `${result.output}  ${(result.bytes / 1024).toFixed(1)}kB, ${result.candidates} utilities\n`,
    );
  }
  for (const pdf of pdfs) {
    process.stdout.write(`${pdf}\n`);
  }
  if (options.strict && overflows.length > 0) process.exitCode = 1;
}

main(process.argv.slice(2)).catch((error: unknown) => {
  process.stderr.write(`ds-report: ${explain(error)}\n`);
  process.exitCode = 1;
});
