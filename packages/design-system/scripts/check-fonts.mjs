/**
 * Every self-hosted family must be named by a font stack that can reach it.
 *
 * `@fontsource`'s variable packages do not declare the family under its plain
 * name. `@fontsource-variable/inter` declares `"Inter Variable"`; the static
 * `@fontsource/inter` declares `"Inter"`. Import the variable one while the
 * stack says `"Inter"` and there is no matching `@font-face`, so the browser
 * falls through to the next entry — silently, and for every consumer.
 *
 * That happened on the branch that introduced self-hosting. Nine gates passed:
 * the fonts installed, the CSS imported them, the build emitted 33 `.woff2`
 * files, and none of it was reachable, because `--ds-font-body` asked for a
 * family nothing declared. The only thing that noticed was the visual suite,
 * which reported it as "nearly every baseline changed" — true, and three
 * inferential steps away from the cause. Worse, the obvious response to that
 * failure is to re-record the baselines, which would have committed
 * system-fallback rendering across the whole library as the expectation.
 *
 * So this reads the family names out of the installed packages' own CSS rather
 * than taking a list on trust, and fails if a stack cannot name one.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import ts from 'typescript';
import {
  cmapCodepoints,
  cssContentCodepoints,
  cssStackBypasses,
  deterministicPrefix,
  fontFaces,
  hex,
  mdxCodepoints,
  parseUnicodeRange,
  stackFamilies,
  tsCodepoints,
  tsStackBypasses,
  woff2Cmap,
} from './font-coverage.mjs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const listing = process.argv.includes('--list');

/** The `@import`ed fontsource packages, from the stylesheet that ships. */
const imported = [
  ...readFileSync('src/styles.css', 'utf8').matchAll(
    /@import\s+["']((?:@fontsource[^"']*))["']/g,
  ),
].map((m) => m[1]);

/** `@fontsource/ibm-plex-mono/400.css` -> `@fontsource/ibm-plex-mono` */
const packageOf = (spec) => spec.split('/').slice(0, 2).join('/');

/** Families a package declares, read from every `@font-face` in its CSS. */
async function familiesOf(name) {
  const root = join('node_modules', name);
  if (!existsSync(root)) return null;

  const families = new Set();
  const files = (await readdir(root)).filter((f) => f.endsWith('.css'));
  for (const file of files) {
    const css = readFileSync(join(root, file), 'utf8');
    for (const [, family] of css.matchAll(/font-family:\s*['"]([^'"]+)['"]/g)) {
      families.add(family);
    }
  }
  return families;
}

/** The stacks that have to name them. Generated, so read the generator's output. */
const stacks = [
  ...readFileSync('src/theme.css', 'utf8').matchAll(/--ds-font-[a-z]+:\s*([^;]+);/g),
].map((m) => m[1]);

const problems = [];
const packages = [...new Set(imported.map(packageOf))];

for (const name of packages) {
  const families = await familiesOf(name);
  if (families === null) {
    problems.push(`${name}: imported from src/styles.css but not installed.`);
    continue;
  }
  if (families.size === 0) {
    problems.push(`${name}: installed but declares no @font-face family.`);
    continue;
  }

  // One family per package is enough — a variable package declares exactly one,
  // and a static package's per-weight files all declare the same name.
  const reachable = [...families].filter((f) =>
    stacks.some((stack) => stack.includes(`"${f}"`)),
  );

  if (listing) {
    console.log(`  ${reachable.length ? '[ OK ]' : '[FAIL]'} ${name}`);
    for (const f of families) {
      const named = stacks.some((s) => s.includes(`"${f}"`));
      console.log(`         ${named ? '·' : '!'} "${f}"${named ? '' : ' — named by no font stack'}`);
    }
  }

  if (reachable.length === 0) {
    problems.push(
      `${name}: declares ${[...families].map((f) => `"${f}"`).join(', ')}, and no ` +
        `--ds-font-* stack names any of them. The @font-face rules ship but ` +
        `nothing can reach them, so text renders in the next fallback. Add the ` +
        `family to the stack in scripts/build-tokens.mjs, or import the static ` +
        `@fontsource package, which declares the plain family name.`,
    );
  }
}

// A stack naming a family nothing declares is the same bug seen from the other
// side, and is how this would come back after a package swap.
const declared = new Set();
for (const name of packages) {
  for (const f of (await familiesOf(name)) ?? []) declared.add(f);
}
// The package's own faces, declared in styles.css rather than by a package.
const ownFaces = fontFaces(readFileSync('src/styles.css', 'utf8'));
for (const face of ownFaces) declared.add(face.family);
const SYSTEM = /^(sans-serif|serif|monospace|cursive|fantasy|system-ui|ui-monospace|-apple-system|BlinkMacSystemFont|Segoe UI|Roboto|Helvetica Neue|Courier New|Arial|Noto Sans|inherit)$/;

/**
 * Families named on purpose without being shipped, each with the reason. These
 * are the plain names of the variable packages: `theme.css` is the
 * bring-your-own-fonts entry point, so a consumer who installs the static
 * `@fontsource/inter`, or simply has Inter locally, should still match. They sit
 * *after* the Variable name in each stack, so they never win here.
 *
 * An entry has to still be named by a stack to stay valid, which is what stops
 * this list becoming a place to silence the check.
 */
const BRING_YOUR_OWN = {
  Inter: 'plain name of @fontsource-variable/inter, for a consumer-supplied static Inter',
  'Space Grotesk':
    'plain name of @fontsource-variable/space-grotesk, for a consumer-supplied static build',
};

for (const stack of stacks) {
  for (const [, quoted] of stack.matchAll(/"([^"]+)"/g)) {
    if (declared.has(quoted) || SYSTEM.test(quoted) || quoted in BRING_YOUR_OWN) continue;
    problems.push(
      `"${quoted}" is named by a --ds-font-* stack but no imported @fontsource ` +
        `package declares it, and it is not in BRING_YOUR_OWN. Either add it ` +
        `there with the reason, or fix the name — as written it renders as ` +
        `fallback text.`,
    );
  }
}

const namedSomewhere = (family) => stacks.some((s) => s.includes(`"${family}"`));

for (const [family, why] of Object.entries(BRING_YOUR_OWN)) {
  if (!namedSomewhere(family)) {
    problems.push(
      `"${family}" is in BRING_YOUR_OWN (${why}) but no --ds-font-* stack names ` +
        `it any more. Remove the entry.`,
    );
  }
  if (listing) console.log(`  [ BYO ] "${family}" — ${why}`);
}

/* ------------------------------------------------------------------ *
 * Glyph coverage: every character a story renders has a shipped face.
 *
 * The check above proves each family is reachable. This proves each rendered
 * character is: a family that is reachable but lacks the glyph hands it to the
 * next entry, and past the shipped faces the next entry is the operating
 * system. `✓`, `⌘` and every box-drawing rule were drawn that way — Courier New
 * on the GitHub runner, no glyph at all for `⌘`, something else again in the
 * Playwright image — and the visual suite could not tell that from a regression.
 *
 * Inputs: rendered text in src/ (string literals, template text and JSX text in
 * .ts/.tsx via the TypeScript AST, so comments are excluded; MDX body text; CSS
 * `content:`), minus unit tests. Coverage: each face's `cmap` intersected with
 * its `unicode-range`, read from the WOFF2 bytes. A character must be covered by
 * the shipped prefix of every `--ds-font-*` stack — a component can set any of
 * them, and a Tailwind class can move text between them without touching the
 * text.
 * ------------------------------------------------------------------ */

const faceFiles = [];
for (const spec of imported) {
  const [scope, name, ...rest] = spec.split('/');
  const cssFile = rest.length ? join('node_modules', scope, name, ...rest) : join('node_modules', scope, name, 'index.css');
  for (const face of fontFaces(readFileSync(cssFile, 'utf8'))) faceFiles.push({ ...face, base: dirname(cssFile) });
}
for (const face of ownFaces) faceFiles.push({ ...face, base: 'src' });

const coverage = new Map();
for (const face of faceFiles) {
  if (!face.woff2) continue;
  const inRange = parseUnicodeRange(face.unicodeRange);
  const set = coverage.get(face.family) ?? new Set();
  for (const cp of cmapCodepoints(woff2Cmap(readFileSync(join(face.base, face.woff2))))) {
    if (inRange(cp)) set.add(cp);
  }
  coverage.set(face.family, set);
}

// A plain name placed after its own Variable build is the same typeface for a
// consumer who brings a static one; it is skipped, not treated as the end of
// the shipped part of the stack.
const shipped = new Set(coverage.keys());
const aliases = new Set(Object.keys(BRING_YOUR_OWN));
const stackCoverage = [...readFileSync('src/theme.css', 'utf8').matchAll(/--(ds-font-[a-z]+):\s*([^;]+);/g)].map(
  ([, name, value]) => {
    const families = deterministicPrefix(stackFamilies(value).filter((f) => !aliases.has(f)), shipped);
    return { name, families, covers: (cp) => families.some((f) => coverage.get(f).has(cp)) };
  },
);

const sourceFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (/\.(tsx?|mdx|css)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) && entry.name !== 'test-setup.ts') {
      sourceFiles.push(path);
    }
  }
})('src');

const rendered = new Map();
const bypasses = [];
// These files *define* the stacks; everything else must use them.
const STACK_DEFINITIONS = new Set(['src/theme.css', 'src/styles.css']);
for (const file of sourceFiles) {
  const source = readFileSync(file, 'utf8');
  const hits = file.endsWith('.mdx')
    ? mdxCodepoints(source)
    : file.endsWith('.css')
      ? cssContentCodepoints(source)
      : tsCodepoints(ts, file, source);
  for (const { entity, line } of hits.unknownEntities ?? []) {
    problems.push(
      `${file}:${line}: entity ${entity} is not in font-coverage.mjs's table, so the census cannot ` +
        `tell which character it renders. Write the character itself, or a numeric entity.`,
    );
  }
  if (!STACK_DEFINITIONS.has(file) && !file.endsWith('.mdx')) {
    const found = file.endsWith('.css') ? cssStackBypasses(source) : tsStackBypasses(ts, file, source);
    for (const { line, text } of found) bypasses.push({ at: `${file}:${line}`, text });
  }
  for (const { cp, line } of hits) {
    const sites = rendered.get(cp) ?? [];
    sites.push(`${file}:${line}`);
    rendered.set(cp, sites);
  }
}

// A census that silently reads nothing is worse than none.
if (sourceFiles.length < 100 || rendered.size === 0) {
  problems.push(
    `Glyph census read ${sourceFiles.length} files and found ${rendered.size} non-ASCII characters — ` +
      `too few to be reading src/ at all. The walk or the extractors are broken.`,
  );
}

for (const [cp, sites] of [...rendered].sort((a, b) => a[0] - b[0])) {
  const missing = stackCoverage.filter((stack) => !stack.covers(cp)).map((stack) => stack.name);
  if (listing) {
    console.log(`  ${missing.length ? '[FAIL]' : '[ OK ]'} ${hex(cp)} ${String.fromCodePoint(cp)}  ${sites.length} site(s)${missing.length ? ` — no shipped glyph in ${missing.join(', ')}` : ''}`);
  }
  if (!missing.length) continue;
  problems.push(
    `${hex(cp)} "${String.fromCodePoint(cp)}" is rendered at ${sites.slice(0, 3).join(', ')}` +
      `${sites.length > 3 ? ` and ${sites.length - 3} more` : ''}, and no shipped face draws it in ` +
      `${missing.join(', ')}. It falls to a system font, which differs between machines. Add it to ` +
      `a shipped face (DS Symbols' unicode-range in src/styles.css), or render something that is covered.`,
  );
}

/*
 * Font stacks written in place, at zero.
 *
 * The census above proves the four role stacks cover every rendered character.
 * That only holds for text that uses them: a component writing its own
 * `var(--font-*, "Name"), generic` inherits none of the symbol faces. 43 of
 * them existed when this was a ratchet, and two of the three spellings named
 * families nothing declares (`"Inter"`, `"Space Grotesk"`; the shipped builds
 * are the Variable ones), so that text was in a system sans outright. All now
 * use the role variables, so there is no budget: one is a failure.
 */
for (const { at, text } of bypasses) {
  problems.push(
    `${at}: font stack written in place — \`${text.slice(0, 70)}\`. It skips the symbol faces the ` +
      `--ds-font-* stacks carry, so its non-Latin characters reach a system font. Use ` +
      `var(--ds-font-body|display|mono|pixel), fontVar / semanticTokens.font, or a font-* class.`,
  );
}

if (listing) {
  for (const stack of stackCoverage) console.log(`  [STACK] --${stack.name}: ${stack.families.join(' → ')}`);
}

if (problems.length) {
  console.error('\nFont reachability problems:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('');
  process.exit(1);
}

console.log(
  `Fonts OK — ${packages.length} @fontsource packages, every declared family named by a --ds-font-* stack; ` +
    `${rendered.size} non-ASCII characters rendered across ${sourceFiles.length} files, every one drawn by a ` +
    `shipped face in all ${stackCoverage.length} stacks, and no stack written outside them.`,
);
