import type { CSSProperties } from 'react';
import { CodeBlock } from '@rtkelly13/design-system';
import { highlight } from '@/lib/highlight';
import type { CodeLanguage } from '@/lib/highlight';
import { SHIKI_SLOTS } from './contract';

/**
 * The package's `CodeBlock` around Shiki output, with Shiki's token slots
 * pointed at the code-theme contract instead of the site's default role map.
 * The slots are set on the `<pre>` because `.docs-codeblock` declares the
 * defaults one level up.
 */
export async function ShikiSnippet({ code, lang = 'tsx', title }: { code: string; lang?: CodeLanguage; title?: string }) {
  const html = await highlight(code, lang);
  return (
    <CodeBlock title={title} language={lang} className="m-0!" style={SHIKI_SLOTS as CSSProperties}>
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </CodeBlock>
  );
}
