// @vitest-environment node
// esbuild resolves the module graph, and refuses to run under jsdom.
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { census, clientReasons, hasDirective } from './client-boundary.mjs';

/**
 * `'use client'` sits on exactly the shipped modules that need it — see the
 * header of `client-boundary.mjs` for the rule and why each direction of
 * getting it wrong matters.
 */

const parse = (source) => ts.createSourceFile('x.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

describe('client boundary', () => {
  const rows = census();

  it('every module that needs the directive carries it', () => {
    const missing = rows
      .filter((row) => row.client && !row.directive)
      .map((row) => `${row.rel}: ${row.reasons.join('; ')}`);
    expect(missing, "add 'use client' as the first statement of these modules").toEqual([]);
  });

  it('no module carries the directive without needing it', () => {
    // Over-marking cannot crash anything, which is why it needs a test: a
    // server-safe component marked client costs every App Router consumer its
    // server rendering, silently.
    const extra = rows.filter((row) => !row.client && row.directive).map((row) => row.rel);
    expect(extra, "remove 'use client' from these modules, or say what needs it").toEqual([]);
  });

  it('keeps the entry points and the server-safe components on the server', () => {
    const server = new Set(rows.filter((row) => !row.client).map((row) => row.rel));
    for (const rel of [
      'src/index.ts',
      'src/theme/levels.ts',
      'src/lib/recipe.ts',
      'src/components/themeInitScript.ts',
      'src/components/Card.tsx',
      'src/components/Button.tsx',
      'src/components/Tag.tsx',
    ]) {
      expect(server, rel).toContain(rel);
    }
  });

  it('the rule sees what it claims to', () => {
    expect(clientReasons(parse(`import { useState } from 'react'; export function A() { useState(0); return null; }`))).toEqual([
      'calls useState',
    ]);
    expect(clientReasons(parse(`export const C = createContext(null);`))).toEqual(['calls createContext']);
    expect(clientReasons(parse(`export function A() { return <button onClick={() => 1} />; }`))).toEqual([
      'passes a function to onClick',
    ]);
    expect(
      clientReasons(parse(`function go() {} export function A() { return <button onClick={go} />; }`)),
    ).toEqual(['passes go to onClick']);
    expect(clientReasons(parse(`import { Axis } from '@visx/axis';`))).toEqual(['imports @visx/axis']);
    // Passed through from props, `useId`, and a type-only import are all fine
    // on the server.
    expect(
      clientReasons(
        parse(
          `import type { Axis } from '@visx/axis'; export function A({ onClick }) { const id = useId(); return <button id={id} onClick={onClick} />; }`,
        ),
      ),
    ).toEqual([]);
  });

  it('reads the directive only where it takes effect', () => {
    expect(hasDirective(parse(`'use client';\nexport const a = 1;`))).toBe(true);
    expect(hasDirective(parse(`/** header */\n'use client';\nexport const a = 1;`))).toBe(true);
    expect(hasDirective(parse(`export const a = 1;\n'use client';`))).toBe(false);
  });
});
