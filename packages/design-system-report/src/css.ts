/**
 * The stylesheet for one report: Tailwind, compiled against a known candidate
 * set and nothing else.
 *
 * `compile()` is Tailwind's own entry point — the same one `@tailwindcss/vite`
 * and the CLI are built on. It needs two resolvers because it does no file I/O
 * itself, and it hands back `sources` (this package's `@source "./"`) for the
 * caller to scan. We ignore that: `extractCandidates` already knows the answer,
 * so `build()` gets the exact list and the scanner never runs.
 */

import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);

/** Resolve an `@import` the way a bundler would, from `base`. */
async function loadStylesheet(id: string, base: string) {
  const file = id.startsWith('.')
    ? path.resolve(base, id)
    : // `@import "tailwindcss"` names a package whose stylesheet is not its
      // main entry, so it cannot go through the generic branch below.
      id === 'tailwindcss'
      ? require_.resolve('tailwindcss/index.css')
      : require_.resolve(id, { paths: [base] });
  return { path: file, base: path.dirname(file), content: await readFile(file, 'utf8') };
}

/** Resolve an `@plugin` — `prose.css` loads `@tailwindcss/typography` this way. */
async function loadModule(id: string, base: string) {
  const file = id.startsWith('.') ? path.resolve(base, id) : require_.resolve(id, { paths: [base] });
  const loaded = await import(file);
  return { path: file, base: path.dirname(file), module: loaded.default ?? loaded };
}

/**
 * `prose.css` loads the typography plugin, and this pipeline compiles
 * `styles.css`, which imports `prose.css`. That made an *optional* peer
 * effectively required — a clean install without it crashed the whole render,
 * which a packed-tarball test caught and no in-repo test could.
 *
 * Dropping the `@plugin` line is the honest resolution rather than a patch. The
 * plugin is genuinely optional: it styles the bare tags a Markdown pipeline
 * emits, so a report that never renders `<Prose>` — which is most of them —
 * needs nothing from it. What is not acceptable is doing that silently, so the
 * caller gets told, and a report that *does* use `<Prose>` gets a warning naming
 * the package to install rather than unexplained plain text.
 */
const TYPOGRAPHY_PLUGIN = /^@plugin\s+["']@tailwindcss\/typography["'];?\s*$/m;

function hasTypographyPlugin(base: string) {
  try {
    require_.resolve('@tailwindcss/typography', { paths: [base] });
    return true;
  } catch {
    return false;
  }
}

/**
 * A report is one file, so its fonts have to travel inside it. `@fontsource`
 * stylesheets reference `./files/*.woff2` relative to themselves, and a copied
 * `.html` has no such folder — every face silently fell back to Courier and
 * Helvetica, in print as on screen. Each `@font-face` is therefore rewritten
 * to carry its woff2 as a data URI.
 *
 * Only the `latin` subsets of the `@fontsource` families are kept. The browser downloads a subset only when a
 * glyph in its `unicode-range` is used, but a data URI is paid for up front:
 * inlining every script's subset is ~3MB per report for glyphs a report
 * written in English never draws. Glyphs outside latin fall back, as they do
 * for any face that lacks them.
 */
const FONT_FACE = /@font-face\s*\{[^}]*\}/g;

function inlineFonts(css: string, base: string): string {
  if (!css.includes('@font-face')) return css;
  return css.replace(FONT_FACE, (block) => {
    const woff2 = /url\((['"]?)(\.[^)'"]*?\.woff2)\1\)/.exec(block)?.[2];
    if (!woff2 || !/-latin-(?!ext)/.test(woff2)) return '';
    const data = readFileSync(path.resolve(base, woff2)).toString('base64');
    return block.replace(
      /src:[^;]*;/,
      `src: url(data:font/woff2;base64,${data}) format('woff2');`,
    );
  });
}

/**
 * The design system's own faces — DS Symbols (arrows, box drawing, ✓ ⌘) and the
 * Nerd Font set (icons) — are declared in `styles.css` itself, with relative
 * `./fonts/` urls, so they never pass through the import loader above. They
 * differ in cost: DS Symbols is 21KB, the Nerd Font is ~1MB. So a face is
 * inlined only when the finished document contains a character in its
 * `unicode-range`; a report with no icons carries no icon font, and a report
 * with a stray one is not silently drawn in tofu.
 */
function inlineOwnFonts(css: string, base: string, text: string | undefined): string {
  const points = new Set([...(text ?? '')].map((c) => c.codePointAt(0) as number));
  // No document given, so nothing can be ruled out: keep every face rather than silently drop them.
  const used = (range: string) =>
    text === undefined ||
    range.split(',').some((part) => {
      const [lo, hi = lo] = part.trim().replace(/^U\+/i, '').split('-').map((h) => parseInt(h, 16));
      for (const point of points) if (point >= (lo as number) && point <= (hi as number)) return true;
      return false;
    });
  return css.replace(FONT_FACE, (block) => {
    const file = /url\((['"]?)(\.\/fonts\/[^)'"]*?\.woff2)\1\)/.exec(block)?.[2];
    if (!file) return block;
    const range = /unicode-range:\s*([^;]*);/.exec(block)?.[1];
    if (range && !used(range)) return '';
    const data = readFileSync(path.resolve(base, file)).toString('base64');
    return block.replace(/src:[^;]*;/, `src: url(data:font/woff2;base64,${data}) format('woff2');`);
  });
}

/*
 * There is no webfont import to drop, and that is the design system's doing
 * rather than an omission here.
 *
 * This package used to carry an `--offline` flag that stripped an
 * `@import url("https://fonts.googleapis.com/…")` out of `styles.css`, so a
 * report could render with no network. That stylesheet now self-hosts its
 * faces through `@fontsource`, for reasons its own banner sets out at length —
 * the first of which is that a remote font import transmits every reader's IP
 * to a third party. Every report is therefore already offline-capable, and the
 * flag had become a no-op that promised something it no longer did.
 */

export interface ReportCssOptions {
  /** The design system's entry stylesheet — `styles.css`, source or built. */
  entry: string;
  candidates: readonly string[];
}

/**
 * A compiler bound to one stylesheet, reusable across reports.
 *
 * The split exists because the two halves cost wildly different amounts: parsing
 * Tailwind's own stylesheet plus this package's four is ~150ms, while emitting
 * the rules for a candidate set is ~13ms once and ~0 after. Rendering several
 * reports — or one report on several rungs of the ladder — should pay the first
 * cost once, and `renderReports` is what does.
 */
export interface ReportCssCompiler {
  /** `text` is the finished document: the design system's own faces are inlined only if it uses them. Omitted, every face is kept. */
  build(candidates: readonly string[], text?: string): string;
  /** Degradations the caller should pass on — a dropped optional plugin. */
  notes: string[];
}

export async function createReportCssCompiler({
  entry,
}: Omit<ReportCssOptions, 'candidates'>): Promise<ReportCssCompiler> {
  // Dynamic for the same reason as esbuild in `markup.ts`: tailwindcss is an
  // optional peer, and a static import turns its absence into a module-load
  // crash that no error handler in this package can reach.
  const { compile } = await import('tailwindcss');
  const base = path.dirname(entry);
  const notes: string[] = [];

  const typography = hasTypographyPlugin(base);
  if (!typography) {
    notes.push(
      '@tailwindcss/typography is not installed, so the prose layer was skipped. ' +
        'Install it if this report renders <Prose> or Markdown; otherwise ignore this.',
    );
  }

  const resolve: typeof loadStylesheet = async (id, from) => {
    const sheet = await loadStylesheet(id, from);
    const content = inlineFonts(sheet.content, sheet.base);
    return typography ? { ...sheet, content } : { ...sheet, content: content.replace(TYPOGRAPHY_PLUGIN, '') };
  };

  let source = await readFile(entry, 'utf8');
  if (!typography) source = source.replace(TYPOGRAPHY_PLUGIN, '');

  const compiler = await compile(source, { base, loadStylesheet: resolve, loadModule });
  return {
    build: (candidates, text) => inlineOwnFonts(compiler.build([...candidates]), base, text),
    notes,
  };
}

/** One-shot convenience over {@link createReportCssCompiler}. */
export async function buildReportCss({
  entry,
  candidates,
}: ReportCssOptions): Promise<string> {
  const compiler = await createReportCssCompiler({ entry });
  return compiler.build(candidates);
}
