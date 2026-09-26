import type { ReactNode } from 'react';
import { AnchorHeading, DocPager, Prose } from '@/ds';
import { pagerFor } from '@/content/registry';
import type { ArticleDef } from '@/content/types';
import { PageIntro } from './PageIntro';

/** A hand-written docs page: the shared intro, a prose body, and the pager. */
export function Article({ article, children }: { article: ArticleDef; children: ReactNode }) {
  const { prev, next } = pagerFor(article.href);
  return (
    <article>
      <PageIntro eyebrow={article.group} title={article.title} lede={article.lede} />
      <Prose className="max-w-none">{children}</Prose>
      <DocPager prev={prev} next={next} className="mt-12" />
    </article>
  );
}

/**
 * A heading taken from the article's declared sections, so the id and title
 * the contents rail and search index were built from are the ones rendered.
 * An id that is not declared fails the build rather than orphaning an anchor.
 */
export function Heading({ article, id, children }: { article: ArticleDef; id: string; children?: ReactNode }) {
  const section = article.sections.find((s) => s.id === id);
  if (!section) throw new Error(`${article.href} declares no section "${id}"`);
  return (
    <AnchorHeading level={section.depth} id={section.id}>
      {children ?? section.title}
    </AnchorHeading>
  );
}
