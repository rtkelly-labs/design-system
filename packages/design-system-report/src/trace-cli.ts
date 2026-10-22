#!/usr/bin/env node
/**
 * `ds-trace [file] [options]`
 *
 * A trace as a waterfall in the terminal or a CI log. Thin, like `ds-report`:
 * read, parse with `parseTraceDocument`, draw with `formatTraceWaterfall` —
 * the same model `TraceWaterfall` renders, so a log and a page agree on every
 * number.
 *
 * Dynamic in two ways. `--watch` redraws whenever the file changes, so a
 * collector's file exporter can be watched as a request runs. Piped input on a
 * terminal is drawn as it arrives, so `otel-tail | ds-trace` grows line by
 * line. While anything is in flight and the trace is on the wall clock, the
 * in-flight bars keep growing between writes.
 */

import { readFileSync, watch } from 'node:fs';
import process from 'node:process';
import { buildTrace, formatTraceWaterfall, parseTraceDocument, type FormatTraceWaterfallOptions } from '@rtkelly13/design-system';

const USAGE = `ds-trace — draw a trace as a waterfall in the terminal

  ds-trace [trace.json] [options]
  cat trace.ndjson | ds-trace [options]

Input is OTLP/JSON ({ "resourceSpans": [...] }), an array of spans, { "spans": [...] },
or newline-delimited JSON of any of those. A span is
  { "id", "parentId"?, "name", "service"?, "start", "end"? | "duration"?, "status"?, "attributes"? }
with times in milliseconds. A span with no end is in flight.

Options
  -w, --watch           Redraw whenever the file changes.
  -c, --columns <n>     Bar width in characters. Default: fit the terminal, or 48.
      --label-width <n> Width of the span-name column. Default: fit, at most 40.
      --ascii           Draw with # = | instead of block and box characters.
      --color           Force ANSI colour.  --no-color  Never colour.
                        Default: colour on a terminal, unless NO_COLOR is set.
      --no-service      Hide the service column.
  -h, --help            This text.

Piped input on a terminal is redrawn as it arrives. Rows marked ◆ are the
critical path; … marks a span still in flight.
`;

interface Parsed {
  file?: string;
  watch: boolean;
  columns?: number;
  labelWidth?: number;
  ascii: boolean;
  color?: boolean;
  hideService: boolean;
  help: boolean;
}

function parse(argv: readonly string[]): Parsed {
  const parsed: Parsed = { watch: false, ascii: false, hideService: false, help: false };
  const number = (flag: string, value: string | undefined) => {
    const n = Number(value);
    if (value === undefined || !Number.isFinite(n) || n <= 0) throw new Error(`${flag} needs a positive number.`);
    return n;
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] as string;
    switch (argument) {
      case '-w': case '--watch': parsed.watch = true; break;
      case '-c': case '--columns': parsed.columns = number(argument, argv[++index]); break;
      case '--label-width': parsed.labelWidth = number(argument, argv[++index]); break;
      case '--ascii': parsed.ascii = true; break;
      case '--color': parsed.color = true; break;
      case '--no-color': parsed.color = false; break;
      case '--no-service': parsed.hideService = true; break;
      case '-h': case '--help': parsed.help = true; break;
      default:
        if (argument.startsWith('-') && argument !== '-') throw new Error(`Unknown option ${argument}.`);
        if (parsed.file) throw new Error('One trace at a time.');
        parsed.file = argument;
    }
  }
  return parsed;
}

const CLEAR = '\u001b[H\u001b[2J';
/** A trace whose start is within a day of now is on the wall clock, so in-flight spans can be drawn to it. */
const WALL_CLOCK_WINDOW = 86_400_000;

function main(): void {
  let options: Parsed;
  try {
    options = parse(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`ds-trace: ${(error as Error).message}\n\n${USAGE}`);
    process.exit(2);
  }
  if (options.help) {
    process.stdout.write(USAGE);
    return;
  }
  const fromStdin = !options.file || options.file === '-';
  if (fromStdin && process.stdin.isTTY) {
    process.stdout.write(USAGE);
    process.exit(2);
  }
  if (options.watch && fromStdin) {
    process.stderr.write('ds-trace: --watch needs a file; piped input is already drawn as it arrives.\n');
    process.exit(2);
  }

  const tty = !!process.stdout.isTTY;
  const color = options.color ?? (tty && !process.env.NO_COLOR);
  const format = (text: string): string => {
    const spans = parseTraceDocument(text);
    const model = buildTrace(spans);
    const wallClock = model.inFlightCount > 0 && Math.abs(Date.now() - model.start) < WALL_CLOCK_WINDOW;
    const formatOptions: FormatTraceWaterfallOptions = {
      columns: options.columns ?? (tty ? Math.max(20, Math.min(160, (process.stdout.columns ?? 120) - 72)) : 48),
      labelWidth: options.labelWidth,
      ascii: options.ascii,
      color,
      hideService: options.hideService,
      now: wallClock ? Date.now() : undefined,
    };
    return formatTraceWaterfall(spans, formatOptions);
  };

  if (!fromStdin) {
    const file = options.file as string;
    const read = () => {
      try {
        return readFileSync(file, 'utf8');
      } catch (error) {
        process.stderr.write(`ds-trace: cannot read ${file}: ${(error as Error).message}\n`);
        process.exit(1);
      }
    };
    if (!options.watch) {
      process.stdout.write(format(read()));
      return;
    }
    // Redraw on change, and on a tick while anything is in flight.
    let text = read();
    const draw = () => process.stdout.write(`${tty ? CLEAR : ''}${format(text)}`);
    draw();
    let pending: NodeJS.Timeout | undefined;
    watch(file, () => {
      clearTimeout(pending);
      pending = setTimeout(() => { text = read(); draw(); }, 50);
    });
    if (tty) setInterval(() => { if (buildTrace(parseTraceDocument(text)).inFlightCount) draw(); }, 250);
    return;
  }

  let text = '';
  let last = 0;
  let timer: NodeJS.Timeout | undefined;
  const draw = () => { last = Date.now(); process.stdout.write(`${CLEAR}${format(text)}`); };
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk: string) => {
    text += chunk;
    if (!tty) return;
    // Throttle: redraw at most every 100ms while data streams in.
    clearTimeout(timer);
    if (Date.now() - last > 100) draw();
    else timer = setTimeout(draw, 100);
  });
  process.stdin.on('end', () => {
    clearTimeout(timer);
    process.stdout.write(`${tty ? CLEAR : ''}${format(text)}`);
  });
}

main();
