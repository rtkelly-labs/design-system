import { cpSync } from 'node:fs';
import path from 'node:path';

import type { Plugin } from 'esbuild';
import { defineConfig } from 'tsup';

import { expandStarExports } from './scripts/expand-star-exports.mjs';
import { reachableModules, ROOT, SOURCE, SRC } from './scripts/module-graph.mjs';

/**
 * Keep every import between source modules an import between output files.
 *
 * Each module is its own entry point and is bundled alone: a specifier that
 * resolves to another module under `src/` is rewritten to that module's output
 * file — with its `.js` extension written out, so Node's own ESM resolver can
 * load `dist/` without a bundler (the report CLI and a Vitest consumer both do)
 * — and marked external. Packages are already external. What is left inside
 * each output file is exactly its own source module.
 */
function preserveModules(): Plugin {
  return {
    name: 'preserve-modules',
    setup(build) {
      build.onResolve({ filter: /^(?:\.{1,2}\/|@\/)/ }, async (args) => {
        if (args.kind === 'entry-point' || args.pluginData?.preserveModules) return undefined;
        const resolved = await build.resolve(args.path, {
          importer: args.importer,
          kind: args.kind,
          resolveDir: args.resolveDir,
          pluginData: { preserveModules: true },
        });
        if (resolved.errors.length > 0) return { errors: resolved.errors };
        if (!resolved.path.startsWith(SRC + path.sep) || !SOURCE.test(resolved.path)) return undefined;
        let specifier = path
          .relative(path.dirname(args.importer), resolved.path)
          .replace(SOURCE, '.js')
          .split(path.sep)
          .join('/');
        if (!specifier.startsWith('.')) specifier = `./${specifier}`;
        return { path: specifier, external: true };
      });
    },
  };
}

export default defineConfig({
  /*
   * One output file per source module (#301). A single flat `dist/index.js`
   * made `sideEffects` useless — it works at module granularity, and the whole
   * library was one module — so a consumer importing `Button` kept every
   * module-level `forwardRef`, `recipe` and `createContext` call in the
   * package, and with them Base UI, visx and d3: 515 KB minified for any
   * subset at all. Per module, a bundler drops every file the consumer's
   * imports do not reach without having to prove a single statement pure.
   * `check:import-cost` holds the result.
   */
  entry: reachableModules(),
  /*
   * ESM only. `"type": "module"` makes `.js` an ES module, so that is the
   * extension written. There is no CommonJS build: it was every module a
   * second time, larger than the ESM half because esbuild writes its interop
   * helpers into each file, and a consumer that loaded both copies got two
   * React contexts per provider. Node >= 22.12 can `require()` this output.
   */
  format: ['esm'],
  outExtension: () => ({ js: '.js' }),
  // One declaration file for the public entry point, exactly as before, so the
  // type surface `check:api` reviews is unchanged by the output layout.
  dts: { entry: 'src/index.ts' },
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  injectStyle: false,
  external: ['react', 'react-dom'],
  esbuildPlugins: [preserveModules()],
  async onSuccess() {
    const dist = path.join(ROOT, 'dist');
    for (const file of ['styles.css', 'theme.css', 'prose.css']) cpSync(path.join(SRC, file), path.join(dist, file));
    cpSync(path.join(SRC, 'fonts'), path.join(dist, 'fonts'), { recursive: true });
    // Named, not `export *`, so a server component's import of the barrel
    // reaches only the client modules it uses. See the script's header.
    await expandStarExports(dist);
  },
});
