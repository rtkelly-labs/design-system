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
import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

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
  'Symbols Nerd Font Mono':
    'self-hosted Nerd Fonts symbol fallback for developer glyphs and UI icons',
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

if (problems.length) {
  console.error('\nFont reachability problems:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('');
  process.exit(1);
}

console.log(
  `Fonts OK — ${packages.length} @fontsource packages, every declared family named by a --ds-font-* stack.`,
);
