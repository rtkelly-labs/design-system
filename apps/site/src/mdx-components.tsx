import type { MDXComponents } from 'mdx/types';
import Link from 'next/link';
import { isValidElement, type AnchorHTMLAttributes, type ReactNode } from 'react';
import {
  AnchorHeading, NoteBlock, TLDR, BeforeAfter, Slope, ChangeSummary, Line, Timeline, Event, Steps, Step,
  FigureFrame, SwatchCompare, MetricStrip, TokenTable, Decision, Option, TermGrid, Term,
} from '@rtkelly13/design-system';
import { Code } from '@/components/docs/Code';
import type { CodeLanguage } from '@/lib/highlight';
import { isStorybookHref } from '@/lib/links';

/** What `highlight.ts` can colour. Any other fence language renders as plain text rather than failing the build. */
const SUPPORTED: Record<string, CodeLanguage> = {
  tsx: 'tsx', ts: 'tsx', typescript: 'tsx', jsx: 'tsx', js: 'tsx', javascript: 'tsx',
  bash: 'bash', sh: 'bash', shell: 'bash', zsh: 'bash',
  css: 'css',
};

function fence(children: ReactNode): { code: string; lang: CodeLanguage | null } | null {
  if (!isValidElement<{ className?: string; children?: ReactNode }>(children)) return null;
  const tag = /language-([\w-]+)/.exec(children.props.className ?? '')?.[1];
  return {
    code: String(children.props.children ?? '').replace(/\n$/, ''),
    lang: tag ? (SUPPORTED[tag] ?? null) : 'tsx',
  };
}

const heading = (level: 2 | 3) =>
  function MdxHeading({ children }: { children?: ReactNode }) {
    return <AnchorHeading level={level}>{children}</AnchorHeading>;
  };

/**
 * A root-relative href is an internal page, so it goes through next/link, which adds the /site
 * basePath (AGENTS.md rule 8). Storybook links (`/?path=`), anchors, `mailto:` and absolute URLs
 * stay plain anchors.
 */
function MdxLink({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const internal = typeof href === 'string' && href.startsWith('/') && !href.startsWith('//') && !isStorybookHref(href);
  if (internal) return <Link href={href} {...rest}>{children}</Link>;
  return <a href={href} {...rest}>{children}</a>;
}

const components: MDXComponents = {
  a: MdxLink,
  h2: heading(2),
  h3: heading(3),
  pre: ({ children }) => {
    const f = fence(children);
    if (!f) return <pre>{children}</pre>;
    return f.lang ? <Code lang={f.lang} code={f.code} /> : <pre>{f.code}</pre>;
  },
  NoteBlock, TLDR, BeforeAfter, Slope, ChangeSummary, Line, Timeline, Event, Steps, Step,
  FigureFrame, SwatchCompare, MetricStrip, TokenTable, Decision, Option, TermGrid, Term,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
