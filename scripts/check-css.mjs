#!/usr/bin/env node
/**
 * Enforce that styling lives in TSX, not in CSS.
 *
 * The rule: a CSS file may declare custom properties and may style things that
 * have no element in a component to hang a `className` on. Everything else —
 * anything selected by a class this repo authors — belongs on the element, as
 * Tailwind utilities.
 *
 * This is checkable because "does the selector name a class we wrote" is a
 * syntactic question. Three categories are exempt, and each is exempt for a
 * reason rather than by convenience:
 *
 *   1. Custom-property declarations (`--x: …`) anywhere. Variables are the
 *      sanctioned CSS payload — `theme.css` is nothing but these.
 *   2. Selectors made only of element names, `:root`, `html`, `body`, `*` and
 *      pseudo-classes. There is no JSX element for the document, and bare tags
 *      arriving from a consumer's own markup cannot be given a className by us.
 *   3. Class names emitted by third-party tooling (remark/rehype plugins,
 *      Storybook), listed in THIRD_PARTY. We never render those elements, so
 *      there is no TSX to move the styling into.
 *
 * A ratchet, like check-tokens: BUDGET is the count today and CI fails if it
 * rises. Lower a line as a file is migrated; delete it at zero.
 *
 *   node scripts/check-css.mjs           fail if any file exceeds budget
 *   node scripts/check-css.mjs --list    show the offending selectors
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * `theme.css` is generated and is variables-only by construction, so it is not
 * scanned at all — `pnpm tokens:check` already guarantees its shape.
 */
const FILES = ['src/styles.css', 'src/prose.css'];

/**
 * Class names this repo styles but does not render. Markdown pipelines emit
 * these as raw HTML from remark/rehype plugins, so no component sees them.
 */
const THIRD_PARTY = [
  'markdown-alert',
  'markdown-alert-title',
  'markdown-alert-tip',
  'markdown-alert-important',
  'markdown-alert-caution',
  'markdown-alert-note',
  'markdown-alert-warning',
  'remark-code-title',
  'task-list-item',
  'sb-show-main',
];

/** Counts as of the commit that introduced this rule. */
const BUDGET = {
  // Migrated: its four component classes are utilities in Badge, AsciiDivider
  // and ExperimentsView. What is left is document-level and stays.
  'src/styles.css': 0,
  // Down from 455: the bare-tag prose rules and the ~70 declarations of
  // chrome-inside-prose reset are gone, replaced by @tailwindcss/typography
  // plus a variables-only token mapping. What remains is the docs chrome —
  // ~12 components, each with a 1:1 class. Migrate one at a time.
  //
  // 328 -> 330, deliberately and once: the two `@media (hover: none)` rules
  // each needed a `color` alongside their `opacity`, to fix an AA failure the
  // arithmetic gate cannot see (#135 — `opacity` changes the foreground after
  // `check:contrast` has read it; 0.55 and 0.6 composited to 3.45:1 and 2.64:1
  // on `sketch`, permanently, on every touch device). A ratchet that forbids an
  // accessibility fix is a worse rule than the debt it guards. It comes back
  // down when the docs chrome moves to TSX, which is what the budget is for.
  'src/prose.css': 330,
};

/** Strip comments and string literals so braces inside them do not confuse the scan. */
function stripNoise(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Walk the stylesheet, pairing each selector with the declarations in its block.
 *
 * A real CSS parser would be better, but these are two hand-written files with
 * no nesting beyond `@media`, and a dependency-free check is worth more here
 * than perfect generality.
 */
function rules(css) {
  const out = [];
  let depth = 0;
  let buffer = '';
  const stack = [];

  for (const char of css) {
    if (char === '{') {
      const selector = buffer.trim();
      buffer = '';
      depth += 1;
      stack.push(selector);
      continue;
    }
    if (char === '}') {
      const selector = stack.pop() ?? '';
      // At-rules (`@media`, `@supports`) wrap other rules rather than holding
      // declarations, so only leaf blocks are collected.
      if (!selector.startsWith('@') && buffer.trim()) {
        out.push({ selector, body: buffer });
      }
      buffer = '';
      depth -= 1;
      continue;
    }
    buffer += char;
  }
  return out;
}

/** Declarations in a block, minus custom properties, which are always allowed. */
function countStyleDeclarations(body) {
  return body
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .filter((d) => d.includes(':'))
    .filter((d) => !d.startsWith('--')).length;
}

/**
 * True when a selector targets something no component can put a className on.
 *
 * Judged on the selector's *target* — its last compound — not the whole chain,
 * because a scope class is not what is being styled. `.docs-prose
 * .markdown-alert-title` is exempt: the alert markup comes from a remark
 * plugin, and `.docs-prose` is only saying where. `.docs-prose h1` is NOT
 * exempt: headings already route through `mdxComponents`, so there is a
 * component to move it into.
 */
function isExempt(selector) {
  return selector.split(',').every((part) => {
    const trimmed = part.trim();
    if (!trimmed) return true;

    const target = trimmed.split(/[\s>+~]+/).filter(Boolean).pop() ?? '';
    if (THIRD_PARTY.some((name) => target.includes(`.${name}`))) return true;

    // No class, id or attribute anywhere: the document, or a bare tag arriving
    // from markup this package does not render.
    return !/[.#[]/.test(trimmed);
  });
}

let failed = false;
const list = process.argv.includes('--list');

console.log('CSS surface — styling belongs in TSX\n');

let total = 0;
let budgetTotal = 0;

for (const relative of FILES) {
  const css = stripNoise(readFileSync(path.join(ROOT, relative), 'utf8'));
  const offenders = rules(css)
    .map((rule) => ({ ...rule, count: countStyleDeclarations(rule.body) }))
    .filter((rule) => rule.count > 0 && !isExempt(rule.selector));

  const count = offenders.reduce((sum, rule) => sum + rule.count, 0);
  const budget = BUDGET[relative] ?? 0;
  const over = count > budget;
  if (over) failed = true;

  total += count;
  budgetTotal += budget;

  const status = over ? 'OVER' : count < budget ? 'DOWN' : ' OK ';
  console.log(`  [${status}] ${relative.padEnd(24)} ${String(count).padStart(4)} / ${budget} declarations`);

  if (list && offenders.length > 0) {
    for (const rule of offenders.sort((a, b) => b.count - a.count).slice(0, 25)) {
      console.log(`         ${String(rule.count).padStart(3)}  ${rule.selector.replace(/\s+/g, ' ')}`);
    }
  }
  if (over) {
    console.log('         Move these onto the element as Tailwind utilities.');
  }
}

console.log(`\n  ${total} declarations outside the exemptions, budget ${budgetTotal}.`);

if (failed) {
  console.error('\nCSS surface grew. New styling goes in the TSX, not a stylesheet.');
  process.exit(1);
}

if (total < budgetTotal) {
  console.log(`  ${budgetTotal - total} below budget — lower BUDGET in scripts/check-css.mjs.`);
}
