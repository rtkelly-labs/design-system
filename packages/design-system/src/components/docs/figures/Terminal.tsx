/**
 * Adapted from mdxcn by Keshav Bagaade, MIT licensed.
 * Source: https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/terminal/terminal.tsx
 * The local port replaces motion and graph variables with deterministic
 * rendering, semantic tokens, and a keyboard-focusable scrolling surface.
 */

import type { ReactNode } from 'react';
import * as React from 'react';
import { AsciiFrameBody, textOf } from './FigureFrame';
import { cn } from '../../../lib/recipe';

export interface TerminalProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name; the enclosing FigureFrame owns the caption. */
  label?: string;
  /** Prompt glyph marking a command line. Defaults to `$`. */
  prompt?: string;
  /** Plain lines or a fenced code block. `$ cmd` is a command, `# …` a comment, `✓` a success, `✗` or `Error:` an error and `⚠` or `warn:` a warning. */
  children?: ReactNode;
  /** Additional classes for this terminal. */
  className?: string;
}

type TerminalLineKind = 'command' | 'comment' | 'ok' | 'error' | 'warn' | 'output';
type TerminalLine = { kind: TerminalLineKind; text: string };

/** A failure marker, or a line that opens with the word: `✗ x`, `Error: x`, `FAIL src/a.test.ts`. `errors: 0` is not one. */
const ERROR_LINE = /^(?:[✗✘✖×]|(?:error|fail(?:ed|ure)?|err!)(?![\p{L}\p{N}_]))/iu;
/** `⚠ x`, `warn: x`, `Warning: x`. */
const WARN_LINE = /^(?:⚠|warn(?:ing)?(?![\p{L}\p{N}_]))/iu;

/** The colour each line kind is drawn in, by role: errors and warnings use the editor roles, so they do not read as muted output. */
const KIND_CLASS: Record<TerminalLineKind, string> = {
  command: 'text-content-primary',
  comment: 'text-content-muted',
  ok: 'text-accent-primary',
  error: 'text-editor-error',
  warn: 'text-editor-warning',
  output: 'text-content-muted',
};

function parse(source: string, prompt: string): TerminalLine[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  while (lines.length > 0 && lines[0]?.trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1]?.trim() === '') lines.pop();
  return lines.map((raw) => {
    const text = raw.replace(/\s+$/, '');
    if (text.startsWith(`${prompt} `) || text === prompt) return { kind: 'command', text: text.slice(prompt.length).trimStart() };
    if (text.startsWith('#')) return { kind: 'comment', text };
    if (/^[✓✔√]/.test(text)) return { kind: 'ok', text };
    if (ERROR_LINE.test(text)) return { kind: 'error', text };
    if (WARN_LINE.test(text)) return { kind: 'warn', text };
    return { kind: 'output', text };
  });
}

/** Renders a shell session with command, comment, success, error, warning, and output line semantics. */
export const Terminal = React.forwardRef<HTMLDivElement, TerminalProps>(function Terminal({ label = 'Shell', prompt = '$', children, className, ...rest }, ref) {
  const lines = parse(textOf(children), prompt);
  return (
      <AsciiFrameBody data-slot="terminal" ref={ref} {...rest} className={cn('overflow-x-auto', className)}>
        <pre className="m-0 flex min-w-max flex-col gap-0.5 whitespace-pre leading-relaxed" role="region" tabIndex={0} aria-label={`${label} terminal output`}>
          {lines.map((line, index) => <code data-kind={line.kind} className={cn('grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2', KIND_CLASS[line.kind])} key={`${index}-${line.text}`}>
            <span aria-hidden="true" className={cn('select-none text-center', line.kind === 'command' ? 'text-accent-primary' : 'text-transparent')}>{line.kind === 'command' ? prompt : ' '}</span>
            <span>{line.text || ' '}</span>
          </code>)}
        </pre>
        <span className="sr-only">Terminal with {lines.length} line{lines.length === 1 ? '' : 's'}.</span>
      </AsciiFrameBody>
  );
});
