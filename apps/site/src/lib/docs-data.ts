import data from '@/generated/docs-data.json';

/**
 * The package's own description of itself — story titles, the sidebar
 * vocabulary and react-docgen-typescript's props — as written by
 * `scripts/generate-docs-data.mts`. Nothing in here is authored by the site.
 */

export interface CatalogueEntry {
  name: string;
  group: string;
  category: string | null;
  title: string;
  storyId: string;
  description: string;
}

export interface PropRow {
  name: string;
  type: string;
  required: boolean;
  defaultValue: string | null;
  description: string;
}

export interface ComponentDoc {
  name: string;
  description: string;
  file: string;
  props: PropRow[];
}

export const GROUPS = data.groups as readonly string[];
export const CATEGORIES = data.categories as Partial<Record<string, readonly string[]>>;
export const CATALOGUE = data.catalogue as readonly CatalogueEntry[];
const COMPONENTS = data.components as Record<string, ComponentDoc>;

export { REPO_URL, STORYBOOK_URL } from './links';
import { REPO_URL, STORYBOOK_URL } from './links';

export function componentDoc(name: string): ComponentDoc {
  const doc = COMPONENTS[name];
  if (!doc) throw new Error(`No docgen record for ${name} — is it exported from src/components?`);
  return doc;
}

export function catalogueEntry(name: string): CatalogueEntry {
  const entry = CATALOGUE.find((e) => e.name === name);
  if (!entry) throw new Error(`No story titled .../${name} — the catalogue is read from story titles`);
  return entry;
}

export const storybookHref = (entry: CatalogueEntry) => `${STORYBOOK_URL}/?path=/docs/${entry.storyId}--docs`;
export const sourceHref = (file: string) => `${REPO_URL}/blob/main/packages/design-system/${file}`;
