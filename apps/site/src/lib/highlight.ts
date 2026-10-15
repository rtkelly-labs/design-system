import 'server-only';

import { createCssVariablesTheme, createHighlighterCore } from 'shiki/core';
import type { HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

/**
 * Syntax highlighting, at build time, in a Server Component.
 *
 * Shiki runs where the page is rendered and ships no JavaScript: the output is
 * spans whose colours are CSS custom properties (`--shiki-token-keyword`), and
 * `globals.css` points each one at a `--ds-syntax-*` role of the package (issue 148).
 * `CodeBlock` deliberately takes pre-rendered children rather than owning a
 * highlighter (issue 209) — so the scope-to-slot mapping lives in this site, in
 * one place, and never names a hue.
 */

const base = createCssVariablesTheme({
  name: 'ds-roles',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
});

/**
 * Shiki's css-variables theme has eight slots and no `type`, `number` or `operator`: it paints
 * types with the function colour and every operator with the keyword colour. Round 6
 * gives each its own role, so these scopes read slots the theme does not define.
 * Appended, and the more specific scope wins in TextMate matching.
 */
const v = (slot: string) => `var(--shiki-token-${slot})`;
const EXTRA = [
  { scope: ['entity.name.type', 'entity.other.inherited-class', 'support.type', 'support.class', 'storage.type.primitive'], settings: { foreground: v('type') } },
  { scope: ['constant.numeric'], settings: { foreground: v('number') } },
  // Symbol operators are not keywords; the word-like ones (new, typeof, in, ...) are.
  { scope: ['keyword.operator'], settings: { foreground: v('operator') } },
  { scope: ['keyword.operator.new', 'keyword.operator.expression', 'keyword.operator.delete', 'keyword.operator.wordlike'], settings: { foreground: v('keyword') } },
  { scope: ['keyword.operator.accessor', 'punctuation.terminator', 'punctuation.definition.block', 'punctuation.definition.parameters', 'punctuation.definition.typeparameters', 'punctuation.section', 'punctuation.accessor', 'meta.brace'], settings: { foreground: v('punctuation') } },
];

const theme = { ...base, tokenColors: [...(base.tokenColors ?? []), ...EXTRA] };

let highlighter: Promise<HighlighterCore> | undefined;

function getHighlighter() {
  highlighter ??= createHighlighterCore({
    themes: [theme],
    langs: [import('shiki/langs/tsx.mjs'), import('shiki/langs/bash.mjs'), import('shiki/langs/css.mjs')],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighter;
}

export type CodeLanguage = 'tsx' | 'bash' | 'css';

/**
 * The inner HTML of a highlighted `<code>` — no `<pre>`, because `CodeBlock`
 * owns the `<pre>` (and its copy button, focusability and region name).
 */
export async function highlight(code: string, lang: CodeLanguage): Promise<string> {
  const hl = await getHighlighter();
  const html = hl.codeToHtml(code.replace(/\n+$/, ''), { lang, theme: 'ds-roles' });
  const inner = /<code[^>]*>([\s\S]*)<\/code>/.exec(html)?.[1];
  if (inner === undefined) throw new Error(`shiki produced no <code> for a ${lang} block`);
  return inner;
}
