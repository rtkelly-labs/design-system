import 'server-only';

import { createCssVariablesTheme, createHighlighterCore } from 'shiki/core';
import type { HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

/**
 * Syntax highlighting, at build time, in a Server Component.
 *
 * Shiki runs where the page is rendered and ships no JavaScript: the output is
 * spans whose colours are CSS custom properties (`--shiki-token-keyword`), and
 * `globals.css` points each one at a design-system role. The package has no
 * syntax Group yet (issue 148), and `CodeBlock` deliberately takes pre-rendered
 * children rather than owning a highlighter (issue 209) — so the role mapping lives
 * in this site, in one place, and never names a hue.
 */

const theme = createCssVariablesTheme({
  name: 'ds-roles',
  variablePrefix: '--shiki-',
  variableDefaults: {},
  fontStyle: true,
});

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
