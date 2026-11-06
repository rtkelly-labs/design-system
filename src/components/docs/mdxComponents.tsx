import { isValidElement } from 'react';
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { AnchorHeading, createAnchorHeading } from './AnchorHeading';
import { CodeBlock } from './CodeBlock';
import { CodeTab, CodeTabs } from './CodeTabs';
import { DocsLink } from './DocsLinkProvider';
import { NoteBlock } from '../NoteBlock';
import { TLDR } from '../TLDR';
import { Badge } from '../Badge';
import { Card } from '../Card';
import { Tag } from '../Tag';
import { AsciiDivider } from '../AsciiDivider';

/**
 * Pull `language-ts` off the `<code>` child that MDX nests inside every `<pre>`,
 * so the code block can label itself without the caller threading metadata
 * through the compiler.
 */
function languageOf(children: ReactNode): string | undefined {
  if (!isValidElement<{ className?: string }>(children)) return undefined;
  const match = /language-([\w-]+)/.exec(children.props.className ?? '');
  return match?.[1];
}

function MdxPre({ children, ...rest }: HTMLAttributes<HTMLPreElement>) {
  return (
    <CodeBlock language={languageOf(children)} {...rest}>
      {children}
    </CodeBlock>
  );
}

function MdxAnchor({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  // MDX types `href` as optional; an anchor without one is a bare fragment
  // target and must not go through the router.
  if (!href) return <a {...rest}>{children}</a>;

  return (
    <DocsLink href={href} {...rest}>
      {children}
    </DocsLink>
  );
}

/**
 * The shared HTML-tag → component map for compiled MDX.
 *
 * Exported as one object so every consumer — the docs portal, the blog, a
 * Storybook preview — renders Markdown identically. Divergence here is the
 * usual way two sites drift apart while nominally sharing a design system.
 *
 * Headings resolve to {@link AnchorHeading}, giving every section a `#slug`
 * target and a copy-link affordance. Pass the map straight to an
 * `<MDXProvider components={...}>` or to `getMDXComponent(code)(...)`.
 *
 * Elements not listed (`ul`, `ol`, `table`, `blockquote`, `hr`, inline `code`)
 * are deliberately left as native tags and styled by `prose.css` — wrapping
 * them in components would cost a lot of bundle for no visual gain.
 */
export const mdxComponents = {
  h1: createAnchorHeading(1),
  h2: createAnchorHeading(2),
  h3: createAnchorHeading(3),
  h4: createAnchorHeading(4),
  h5: createAnchorHeading(5),
  h6: createAnchorHeading(6),
  pre: MdxPre,
  a: MdxAnchor,

  // Available to authors as JSX inside MDX.
  AnchorHeading,
  NoteBlock,
  TLDR,
  Badge,
  Card,
  Tag,
  AsciiDivider,
  CodeBlock,
  CodeTabs,
  CodeTab,
};

export type MdxComponents = typeof mdxComponents;
