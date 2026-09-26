import { AnchorHeading, Breadcrumbs, DocPager, Prose } from '@/ds';
import { componentHref, pagerFor, propsSectionId } from '@/content/registry';
import type { ComponentPageDef } from '@/content/types';
import { catalogueEntry, componentDoc, sourceHref, storybookHref } from '@/lib/docs-data';
import { Code } from './Code';
import { Example } from './Example';
import { Inline } from './Inline';
import { PageIntro } from './PageIntro';
import { PropsTable } from './PropsTable';

/**
 * The template every component page renders through, so every page has the
 * same anatomy in the same order: what it is, how to import it, examples
 * (each a live preview over its own source), the generated props, and the
 * accessibility contract. The contents rail and the search index are built
 * from the same definition by `componentSections`, which is why this renders
 * headings with the ids that function hands out.
 */
export function ComponentPage({ page }: { page: ComponentPageDef }) {
  const entry = catalogueEntry(page.name);
  const doc = componentDoc(page.name);
  const { prev, next } = pagerFor(componentHref(page));
  const imports = page.props.filter((name) => name !== page.name);

  return (
    <article>
      <Breadcrumbs
        items={[
          { label: 'Docs', href: '/docs' },
          { label: 'Components', href: '/docs/components' },
          { label: entry.category ?? entry.group },
          { label: page.name },
        ]}
      />

      <Prose className="max-w-none">
        <PageIntro eyebrow={entry.category ?? entry.group} title={page.name} lede={page.lede}>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs font-bold uppercase tracking-wider">
            <a className="text-accent-primary underline decoration-2 underline-offset-4" href={storybookHref(entry)} target="_blank" rel="noopener noreferrer">
              Storybook ↗
            </a>
            <a className="text-accent-primary underline decoration-2 underline-offset-4" href={sourceHref(doc.file)} target="_blank" rel="noopener noreferrer">
              Source ↗
            </a>
          </div>
        </PageIntro>

        <div className="not-prose">
          <Code
            title="import"
            code={`import { ${[page.name, ...imports].join(', ')} } from '@rtkelly13/design-system';`}
          />
        </div>

        <AnchorHeading level={2} id="examples">
          Examples
        </AnchorHeading>
        {page.examples.map((example) => (
          <section key={example.id} aria-labelledby={example.id}>
            <AnchorHeading level={3} id={example.id}>
              {example.title}
            </AnchorHeading>
            <p>
              <Inline text={example.description} />
            </p>
            <Example example={example} />
          </section>
        ))}

        <AnchorHeading level={2} id="props">
          Props
        </AnchorHeading>
        <p>
          Generated from the package source by react-docgen-typescript, the same extractor Storybook uses. Inherited
          HTML attributes are passed through to the rendered element and are not listed.
        </p>
        {page.props.map((name) =>
          page.props.length > 1 ? (
            <section key={name} aria-labelledby={propsSectionId(name)}>
              <AnchorHeading level={3} id={propsSectionId(name)}>
                {name}
              </AnchorHeading>
              <PropsTable name={name} />
            </section>
          ) : (
            <PropsTable key={name} name={name} />
          ),
        )}

        <AnchorHeading level={2} id="accessibility">
          Accessibility
        </AnchorHeading>
        <ul>
          {page.accessibility.notes.map((note) => (
            <li key={note}>
              <Inline text={note} />
            </li>
          ))}
        </ul>
        {page.accessibility.keyboard ? (
          <table>
            <caption className="sr-only">Keyboard interactions</caption>
            <thead>
              <tr>
                <th scope="col">Key</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {page.accessibility.keyboard.map(([key, action]) => (
                <tr key={key}>
                  <th scope="row">
                    <kbd>{key}</kbd>
                  </th>
                  <td>{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </Prose>

      <DocPager prev={prev} next={next} className="mt-12" />
    </article>
  );
}
