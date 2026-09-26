import { CodeBlock } from '@/ds';
import { highlight } from '@/lib/highlight';
import type { CodeLanguage } from '@/lib/highlight';

/**
 * A highlighted snippet in the package's `CodeBlock`. Highlighting happens
 * here, on the server, at build time; `CodeBlock` receives finished spans and
 * adds the copy button and the focusable scroll region.
 */
export async function Code({
  code,
  lang = 'tsx',
  title,
  attached,
}: {
  code: string;
  lang?: CodeLanguage;
  title?: string;
  attached?: boolean;
}) {
  const html = await highlight(code, lang);
  return (
    <CodeBlock title={title} language={lang} attached={attached}>
      <code dangerouslySetInnerHTML={{ __html: html }} />
    </CodeBlock>
  );
}
