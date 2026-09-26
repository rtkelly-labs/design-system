/**
 * Everything the site knows about the package that the package already says.
 *
 * Two outputs, both read from the design system rather than restated here:
 *
 *   1. **The catalogue** — every component with a story, filed by the title its
 *      story declares (`Components/Data/BarChart`) and ordered by the closed
 *      vocabulary in `.storybook/sidebar.ts`. The site's navigation is this
 *      list filtered to the pages that exist, so a component recategorised in
 *      Storybook moves in the site's sidebar with no edit here.
 *   2. **The props** — `react-docgen-typescript`, with the exact options
 *      `.storybook/main.ts` hands it (including the `propFilter` that keeps
 *      inherited `HTMLAttributes` out). The same extractor, so the props table
 *      on a site page and the one on the Storybook docs page cannot disagree;
 *      `check:docgen-props` already gates that this extractor finds them.
 *
 * Why not read Storybook's `manifests/components.json`? It only exists after a
 * full `build-storybook`, which would put a Storybook build — the longest step
 * in CI — in front of every site build. Running the extractor directly costs a
 * TypeScript program over `src/components` and nothing else.
 *
 * Written to `src/generated/docs-data.json`, which is gitignored: it is a
 * cache of the package, never a source.
 */

import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import docgen from 'react-docgen-typescript';

import { CATEGORIES, GROUPS } from '../../../packages/design-system/.storybook/sidebar.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '..');
const PKG = path.resolve(SITE, '../../packages/design-system');
const OUT = path.join(SITE, 'src/generated/docs-data.json');

function walk(dir: string, match: RegExp, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, match, found);
    else if (match.test(entry)) found.push(full);
  }
  return found;
}

/** Storybook's own id sanitiser: lowercase, non-alphanumerics to one dash. */
const storyId = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* ------------------------------------------------------------------ */
/* 1. The catalogue                                                    */
/* ------------------------------------------------------------------ */

interface CatalogueEntry {
  name: string;
  group: string;
  category: string | null;
  title: string;
  storyId: string;
  description: string;
}

const stories = walk(path.join(PKG, 'src'), /\.stories\.tsx$/);
const titled: Omit<CatalogueEntry, 'description'>[] = [];
for (const file of stories) {
  const source = readFileSync(file, 'utf8');
  // The meta object's title is the first `title:` naming a declared group.
  const title = [...source.matchAll(/^\s*title:\s*'([^']+)'/gm)]
    .map((m) => m[1])
    .find((t) => (GROUPS as readonly string[]).includes(t.split('/')[0]));
  if (!title) continue;
  const parts = title.split('/');
  const group = parts[0];
  const categories = CATEGORIES[group as keyof typeof CATEGORIES];
  const category = categories && parts.length === 3 ? parts[1] : null;
  titled.push({ name: parts[parts.length - 1], group, category, title, storyId: storyId(title) });
}

const groupRank = (g: string) => (GROUPS as readonly string[]).indexOf(g);
const categoryRank = (e: { group: string; category: string | null }) =>
  e.category ? (CATEGORIES[e.group as keyof typeof CATEGORIES] ?? []).indexOf(e.category) : -1;

titled.sort(
  (a, b) =>
    groupRank(a.group) - groupRank(b.group) ||
    categoryRank(a) - categoryRank(b) ||
    a.name.localeCompare(b.name),
);

/* ------------------------------------------------------------------ */
/* 2. The props                                                        */
/* ------------------------------------------------------------------ */

const parser = docgen.withCustomConfig(path.join(PKG, 'tsconfig.json'), {
  // Mirrors `.storybook/main.ts` → `typescript.reactDocgenTypescriptOptions`.
  shouldExtractLiteralValuesFromEnum: true,
  shouldRemoveUndefinedFromOptional: true,
  propFilter: (prop) => !prop.parent?.fileName.includes('node_modules'),
  savePropValueAsString: true,
});

const componentFiles = walk(path.join(PKG, 'src/components'), /^[A-Z][A-Za-z]*\.tsx$/).filter(
  (f) => !f.endsWith('.test.tsx'),
);

/**
 * Components the extractor documents wrongly, read instead through a shim that
 * types a stand-in component with the real props interface.
 *
 * `BarChart` is the one: `BarChart.tsx` re-exports visx's `ParentSize` as
 * `ResponsiveChartContainer`, and react-docgen-typescript — with exactly the
 * options Storybook uses — attributes `ParentSize`'s seven props
 * (`initialSize`, `ignoreDimensions`, …) to `BarChart` and none of its own.
 * `check:docgen-props` counts props rather than checking whose they are, so
 * it passes (issue 312). Delete the entry when the extractor sees
 * `BarChartProps` on the real file.
 */
const SHIMS: Record<string, { props: string; from: string }> = {
  BarChart: { props: 'BarChartProps', from: 'src/components/BarChart.tsx' },
};
const SHIM_DIR = path.join(SITE, 'node_modules/.cache/docgen-shims');
mkdirSync(SHIM_DIR, { recursive: true });
const shimFiles = Object.entries(SHIMS).map(([name, { props, from }]) => {
  const file = path.join(SHIM_DIR, `${name}.tsx`);
  const target = path.join(PKG, from).replace(/\.tsx$/, '');
  writeFileSync(
    file,
    `import type { ${props} } from '${target}';\n` +
      `/** shim */\nexport function ${name}(props: ${props}) { return null; }\n`,
  );
  return file;
});

interface PropRow {
  name: string;
  type: string;
  required: boolean;
  defaultValue: string | null;
  description: string;
}
interface ComponentDoc {
  name: string;
  description: string;
  file: string;
  props: PropRow[];
}

/** A union alias (`ButtonVariant`) is printed as its members, which is what a reader needs. */
function typeText(type: { name: string; raw?: string; value?: unknown }): string {
  if (type.name === 'enum' && Array.isArray(type.value) && type.value.length <= 12) {
    return (type.value as { value: string }[]).map((v) => v.value).join(' | ');
  }
  const raw = type.raw ?? type.name;
  return raw.length < 160 && !raw.includes('\n') ? raw : type.name;
}

const started = Date.now();
const docs: Record<string, ComponentDoc> = {};
const parsed = parser.parse([...componentFiles, ...shimFiles]);
const isShim = (file: string) => file.startsWith(SHIM_DIR);
for (const doc of parsed) {
  if (doc.displayName in SHIMS && !isShim(doc.filePath)) continue;
  const rows: PropRow[] = Object.values(doc.props)
    .map((p) => ({
      name: p.name,
      type: typeText(p.type),
      required: p.required,
      defaultValue: p.defaultValue?.value != null ? String(p.defaultValue.value) : null,
      description: p.description.trim(),
    }))
    // Required first, then alphabetical: the order a reader scans for.
    .sort((a, b) => Number(b.required) - Number(a.required) || a.name.localeCompare(b.name));
  const existing = docs[doc.displayName];
  if (existing && existing.props.length >= rows.length) continue;
  const shim = SHIMS[doc.displayName];
  docs[doc.displayName] = {
    name: doc.displayName,
    description: (shim ? '' : doc.description).trim(),
    file: shim ? shim.from : path.relative(PKG, doc.filePath),
    props: rows,
  };
}

/** The first paragraph of a JSDoc, flattened to one line — the catalogue blurb. */
const lede = (text: string) =>
  (text.split(/\n\s*\n/)[0] ?? '').replace(/\s+/g, ' ').replace(/[`*]/g, '').trim();

const catalogue: CatalogueEntry[] = titled.map((entry) => ({
  ...entry,
  description: lede(docs[entry.name]?.description ?? ''),
}));

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  `${JSON.stringify(
    {
      groups: GROUPS,
      categories: CATEGORIES,
      catalogue,
      components: Object.fromEntries(Object.entries(docs).sort(([a], [b]) => a.localeCompare(b))),
    },
    null,
    2,
  )}\n`,
);

console.log(
  `docs-data: ${catalogue.length} catalogue entries, ${Object.keys(docs).length} components with props ` +
    `(${componentFiles.length} files, ${((Date.now() - started) / 1000).toFixed(1)}s) → ${path.relative(SITE, OUT)}`,
);
