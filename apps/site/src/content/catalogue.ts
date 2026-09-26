import { CATALOGUE, CATEGORIES, GROUPS } from '@/lib/docs-data';
import type { CatalogueEntry } from '@/lib/docs-data';

/** The groups a reader of a component catalogue is looking for, in Storybook's order. */
const SHOWN = ['Foundations', 'Components', 'Docs'];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export interface CatalogueSection {
  id: string;
  title: string;
  entries: CatalogueEntry[];
}

/** Every catalogued story, grouped as Storybook's sidebar groups it. */
export function catalogueSections(): CatalogueSection[] {
  const sections: CatalogueSection[] = [];
  for (const group of GROUPS.filter((g) => SHOWN.includes(g))) {
    const inGroup = CATALOGUE.filter((e) => e.group === group);
    const categories = CATEGORIES[group];
    if (categories) {
      for (const category of categories) {
        const entries = inGroup.filter((e) => e.category === category);
        if (entries.length) sections.push({ id: slugify(`${group}-${category}`), title: `${group} / ${category}`, entries });
      }
    } else if (inGroup.length) {
      sections.push({ id: slugify(group), title: group, entries: inGroup });
    }
  }
  return sections;
}
