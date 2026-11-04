/**
 * The document around a report.
 *
 * This is the one place in the package that emits raw HTML rather than JSX, and
 * it is deliberately the smallest possible amount: there is no element in a
 * component to hang a `className` on for `<html>` or `<head>`, which is the same
 * exemption `styles.css` has for document-level styling.
 *
 * The level goes on `<html>` as `data-theme` *and* as a class, matching what
 * `ThemeProvider` writes at runtime — the attribute is what the generated CSS
 * selects on, the class is mirrored for consumers whose own CSS keys off it.
 */

import type { ThemeLevel } from '@rtkelly-labs/design-system';

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

/** For `<title>`, the only place caller text lands outside React's escaping. */
function escapeText(value: string) {
  return value.replace(/[&<>"]/g, (char) => ESCAPES[char] as string);
}

export interface DocumentShellOptions {
  body: string;
  css: string;
  theme: ThemeLevel;
  title: string;
}

export function documentShell({ body, css, theme, title }: DocumentShellOptions): string {
  return `<!doctype html>
<html lang="en" data-theme="${theme}" class="${theme}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeText(title)}</title>
    <style>
${css}
    </style>
  </head>
  <body>
${body}
  </body>
</html>
`;
}
