/**
 * Turning a `.tsx` file into markup, in one esbuild pass.
 *
 * Node cannot import TSX, and a report will import this package plus whatever
 * else its author reached for, so something has to transpile and resolve. esbuild
 * does both in ~200ms, which is what keeps the whole generator inside the time an
 * agent will actually wait.
 *
 * Three decisions here are load-bearing:
 *
 *   1. **The entry is a generated wrapper, fed through `stdin`.** The report
 *      itself only has to export a component; the render call lives in code we
 *      control, so the file an agent writes stays a plain component file.
 *   2. **`resolveDir` is the report's own directory.** Imports resolve from where
 *      the report lives, so a report can import the author's own modules.
 *   3. **The bundle is closed over — nothing external.** It is written to a temp
 *      directory and imported from there, so if `react` were left external it
 *      would resolve against `/tmp` and fail. Bundling React in also guarantees
 *      one copy, which is the difference between rendering and a hook error.
 */

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * `require` of a Node builtin, for CJS dependencies esbuild converts to ESM —
 * `react-dom/server` reaches for `node:util` this way. Without it the bundle
 * throws "Dynamic require of util is not supported" at import time.
 */
const CJS_INTEROP =
  "import { createRequire as __ds_cr } from 'node:module';" +
  'const require = __ds_cr(import.meta.url);';

/** The report's contract: a default export, either a component or an element. */
function wrapper(input: string, designSystem: string) {
  return `
    import { createElement, isValidElement } from 'react';
    import { renderToStaticMarkup } from 'react-dom/server';
    import * as report from ${JSON.stringify(input)};
    export function render(props) {
      const exported = report;
      const target = exported.default ?? exported.Report;
      if (!target) {
        throw new Error(
          ${JSON.stringify(input)} + ' has no default export. A report module must default-export a component.',
        );
      }
      return renderToStaticMarkup(
        isValidElement(target) ? target : createElement(target, props),
      );
    }
    export const designSystem = ${JSON.stringify(designSystem)};
  `;
}

export interface MarkupOptions {
  /** Absolute path to the report's `.tsx`. */
  input: string;
  /**
   * Absolute path this package's own entry module resolves to. Reports import
   * `@rtkelly-labs/design-system` by name; aliasing it to the copy that owns this
   * renderer means the markup and the CSS can never come from two versions.
   */
  designSystemEntry: string;
  props?: Record<string, unknown>;
}

export async function renderMarkup({
  input,
  designSystemEntry,
  props = {},
}: MarkupOptions): Promise<string> {
  // Imported here rather than at module scope, and that is not a style choice.
  // esbuild is an *optional* peer: a consumer who only renders components should
  // not have to install a build toolchain. A static import makes its absence a
  // module-load failure, which throws before any of this package's code runs —
  // so the CLI's `explain()` never sees it and the promise of an install
  // instruction instead of a stack trace is quietly false. A clean-install test
  // caught exactly that. Keep this dynamic.
  const { build } = await import('esbuild');
  const scratch = await mkdtemp(path.join(tmpdir(), 'ds-report-'));
  const outfile = path.join(scratch, 'report.mjs');
  try {
    await build({
      stdin: { contents: wrapper(input, designSystemEntry), resolveDir: path.dirname(input), loader: 'ts' },
      outfile,
      bundle: true,
      format: 'esm',
      platform: 'node',
      jsx: 'automatic',
      define: { 'process.env.NODE_ENV': '"production"' },
      alias: { '@rtkelly-labs/design-system': designSystemEntry },
      // A report is styled by utilities in its TSX; a stylesheet an imported
      // module pulls in has no meaning in this pipeline and must not fail it.
      loader: { '.css': 'empty' },
      banner: { js: CJS_INTEROP },
      logLevel: 'silent',
    });
    const module_ = (await import(pathToFileURL(outfile).href)) as {
      render: (props: Record<string, unknown>) => string;
    };
    return module_.render(props);
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
