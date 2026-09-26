import type { DocsNavNode, TocEntry } from '@/ds';
import { CATEGORIES, catalogueEntry } from '@/lib/docs-data';
import type { SearchEntry } from '@/lib/search';
import { ARTICLES } from './articles';
import { barChart } from './components/bar-chart';
import { button } from './components/button';
import { dataTable } from './components/data-table';
import { input } from './components/input';
import { modal } from './components/modal';
import type { ComponentPageDef, Section } from './types';

/**
 * Every page on the site, and everything derived from the list: the sidebar,
 * the pager order, the contents rail for each path, and the search index.
 * One list, so a page cannot be in the navigation and missing from search.
 */

export const COMPONENT_PAGES: readonly ComponentPageDef[] = [button, input, modal, dataTable, barChart];

export const componentHref = (page: ComponentPageDef) => `/docs/components/${page.slug}`;

export const propsSectionId = (name: string) => `props-${name.toLowerCase()}`;

/** A component page's headings, in the order its template renders them. */
export function componentSections(page: ComponentPageDef): Section[] {
  return [
    { id: 'examples', title: 'Examples', depth: 2 },
    ...page.examples.map((e) => ({ id: e.id, title: e.title, depth: 3 as const })),
    { id: 'props', title: 'Props', depth: 2 },
    ...(page.props.length > 1
      ? page.props.map((name) => ({ id: propsSectionId(name), title: name, depth: 3 as const }))
      : []),
    { id: 'accessibility', title: 'Accessibility', depth: 2 },
  ];
}

/**
 * The sidebar. Components are filed by the category their Storybook title
 * declares, in the order `.storybook/sidebar.ts` gives the categories — so the
 * site and Storybook use one vocabulary and a recategorised story moves here
 * without an edit. Groups with no page yet are left out rather than stubbed.
 */
export function buildNav(): DocsNavNode[] {
  const byCategory = new Map<string, DocsNavNode[]>();
  for (const page of COMPONENT_PAGES) {
    const entry = catalogueEntry(page.name);
    const key = entry.category ?? entry.group;
    byCategory.set(key, [...(byCategory.get(key) ?? []), { label: page.name, href: componentHref(page) }]);
  }
  const order = CATEGORIES.Components ?? [];
  const categories = [...byCategory.keys()].sort((a, b) => order.indexOf(a) - order.indexOf(b));

  return [
    { label: 'Getting started', items: ARTICLES.map((a) => ({ label: a.title, href: a.href })) },
    {
      label: 'Components',
      items: categories.map((category) => ({
        label: category,
        items: [...(byCategory.get(category) ?? [])].sort((a, b) => a.label.localeCompare(b.label)),
      })),
    },
  ];
}

/** Every page href in sidebar order: the reading order the pager follows. */
export function readingOrder(): { label: string; href: string }[] {
  const out: { label: string; href: string }[] = [];
  const walk = (nodes: readonly DocsNavNode[]) => {
    for (const node of nodes) {
      if (node.href) out.push({ label: node.label, href: node.href });
      if (node.items) walk(node.items);
    }
  };
  walk(buildNav());
  return out;
}

export function pagerFor(href: string) {
  const order = readingOrder();
  const at = order.findIndex((p) => p.href === href);
  return { prev: at > 0 ? order[at - 1] : undefined, next: at >= 0 ? order[at + 1] : undefined };
}

const toToc = (sections: readonly Section[]): TocEntry[] =>
  sections.map((s) => ({ id: s.id, title: s.title, depth: s.depth }));

/** The contents rail for every path, keyed by pathname. */
export function tocByPath(): Record<string, TocEntry[]> {
  const out: Record<string, TocEntry[]> = {};
  for (const article of ARTICLES) out[article.href] = toToc(article.sections);
  for (const page of COMPONENT_PAGES) out[componentHref(page)] = toToc(componentSections(page));
  return out;
}

const plain = (markup: string) => markup.replace(/`/g, '');

export function searchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const article of ARTICLES) {
    entries.push({
      id: article.href,
      title: article.title,
      trail: article.group,
      href: article.href,
      text: `${plain(article.lede)} ${article.keywords ?? ''}`,
    });
    for (const section of article.sections) {
      entries.push({
        id: `${article.href}#${section.id}`,
        title: section.title,
        page: article.title,
        trail: article.group,
        href: `${article.href}#${section.id}`,
        text: '',
      });
    }
  }
  for (const page of COMPONENT_PAGES) {
    const entry = catalogueEntry(page.name);
    const trail = [entry.group, entry.category].filter(Boolean).join(' / ');
    const href = componentHref(page);
    entries.push({
      id: href,
      title: page.name,
      trail,
      href,
      text: `${plain(page.lede)} ${page.keywords ?? ''} ${page.props.join(' ')}`,
    });
    for (const section of componentSections(page)) {
      const example = page.examples.find((e) => e.id === section.id);
      entries.push({
        id: `${href}#${section.id}`,
        title: section.title,
        page: page.name,
        trail,
        href: `${href}#${section.id}`,
        text: example ? plain(example.description) : '',
      });
    }
  }
  return entries;
}
