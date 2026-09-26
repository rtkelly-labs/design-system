import type { Metadata } from 'next';
import Link from 'next/link';
import { AnchorHeading } from '@/ds';
import { Article } from '@/components/docs/Article';
import { catalogue as article } from '@/content/articles';
import { COMPONENT_PAGES, componentHref } from '@/content/registry';
import { catalogueSections } from '@/content/catalogue';
import { storybookHref } from '@/lib/docs-data';
import type { CatalogueEntry } from '@/lib/docs-data';

export const metadata: Metadata = { title: article.title, description: article.lede };

function Tile({ entry }: { entry: CatalogueEntry }) {
  const page = COMPONENT_PAGES.find((p) => p.name === entry.name);
  const body = (
    <>
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-display text-base font-extrabold uppercase tracking-wide text-content-primary">{entry.name}</span>
        <span className={'shrink-0 font-mono text-[0.65rem] font-bold uppercase tracking-wider ' + (page ? 'text-accent-primary' : 'text-content-muted')}>
          {page ? '[ PAGE ]' : '[ STORYBOOK ↗ ]'}
        </span>
      </span>
      {entry.description ? (
        <span className="line-clamp-2 font-sans text-sm leading-snug text-content-secondary">{entry.description}</span>
      ) : null}
    </>
  );
  const cls =
    'flex h-full flex-col gap-2 border-2 border-edge-strong bg-surface-raised p-4 no-underline transition-[box-shadow,translate] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-md';
  return page ? (
    <Link href={componentHref(page)} className={cls}>
      {body}
    </Link>
  ) : (
    <a href={storybookHref(entry)} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  );
}

export default function CataloguePage() {
  const sections = catalogueSections();
  const total = sections.reduce((n, s) => n + s.entries.length, 0);

  return (
    <Article article={article}>
      <p>
        {total} entries across {sections.length} categories, {COMPONENT_PAGES.length} with a page here. Read from the
        package&apos;s story titles at build time.
      </p>
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={section.id}>
          <AnchorHeading level={2} id={section.id}>
            {section.title}
          </AnchorHeading>
          <ul className="not-prose m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 2xl:grid-cols-3">
            {section.entries.map((entry) => (
              <li key={entry.title}>
                <Tile entry={entry} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </Article>
  );
}
