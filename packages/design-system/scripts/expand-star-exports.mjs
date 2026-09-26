/**
 * Rewrite every `export * from "./x.js"` in the ESM output as the named list
 * it stands for.
 *
 * ## Why
 *
 * Measured in a Next 16 App Router build (#301): a server component importing
 * the twelve names the blog uses from the root barrel shipped **699 KB** of
 * client JavaScript under Turbopack — every client module in the package,
 * Base UI and visx included — because the server graph turns each `'use
 * client'` module a star re-export reaches into a client reference, whether
 * or not anything uses it. With the same barrel written as named re-exports
 * it shipped 46 KB. The client graph shakes either form; the server graph
 * only shakes the named one.
 *
 * `src/index.ts` keeps `export *` — a new export in a component module should
 * reach the package without anyone remembering to list it — and the build
 * writes the list. Names are read from the built module itself, by bundling
 * it with esbuild, so the list is exactly what `export *` would have produced.
 *
 * Two ESM rules are kept rather than approximated: a name the barrel exports
 * itself shadows a star export of the same name, and a name two star exports
 * both provide is ambiguous, which `export *` silently drops and a named list
 * would make a syntax error — so it fails the build instead.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import esbuild from 'esbuild';
import ts from 'typescript';

const STAR = /^export \* from "(\.{1,2}\/[^"]+)";$/;

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

/** Every name a built module exports, star re-exports resolved. */
async function exportsOf(file) {
  const result = await esbuild.build({
    entryPoints: [file],
    bundle: true,
    write: false,
    metafile: true,
    format: 'esm',
    packages: 'external',
    outdir: path.join(path.dirname(file), '.expand-star-exports'),
    logLevel: 'silent',
  });
  return Object.values(result.metafile.outputs).find((output) => output.entryPoint)?.exports ?? [];
}

/** The names a module exports by name — `export { a, b as c }`, with or without `from`. */
function ownExports(source) {
  const sf = ts.createSourceFile('barrel.js', source, ts.ScriptTarget.Latest, false, ts.ScriptKind.JS);
  const names = new Set();
  for (const statement of sf.statements) {
    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) names.add(element.name.text);
    }
  }
  return names;
}

export async function expandStarExports(distDir) {
  let rewritten = 0;
  for (const file of walk(distDir).filter((f) => f.endsWith('.js'))) {
    const source = readFileSync(file, 'utf8');
    const lines = source.split('\n');
    if (!lines.some((line) => STAR.test(line))) continue;

    const own = ownExports(source);
    const providers = new Map();
    const lists = new Map();
    for (const line of lines) {
      const match = STAR.exec(line);
      if (!match) continue;
      const names = (await exportsOf(path.resolve(path.dirname(file), match[1]))).filter(
        (name) => name !== 'default' && !own.has(name),
      );
      for (const name of names) providers.set(name, [...(providers.get(name) ?? []), match[1]]);
      lists.set(line, { specifier: match[1], names });
    }

    const ambiguous = [...providers].filter(([, from]) => from.length > 1);
    if (ambiguous.length) {
      throw new Error(
        `${path.relative(distDir, file)}: ${ambiguous.map(([name, from]) => `${name} (${from.join(', ')})`).join('; ')} ` +
          'is exported by more than one `export *`. ESM drops an ambiguous name silently; export it by name from one of them.',
      );
    }

    const out = lines.map((line) => {
      const list = lists.get(line);
      if (!list) return line;
      // A module with nothing left to re-export contributes nothing: no line.
      return list.names.length ? `export { ${list.names.join(', ')} } from "${list.specifier}";` : '';
    });
    writeFileSync(file, out.join('\n'));
    rewritten += 1;
  }
  return rewritten;
}
