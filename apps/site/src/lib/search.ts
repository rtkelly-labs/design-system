/**
 * Search over pages and their sections, entirely in the browser.
 *
 * The index is small — every page and every section heading, built at build
 * time from the same registry that builds the navigation — so it travels with
 * the page and a query costs a filter, not a request. That is what makes it
 * instant on a static host with no search service behind it.
 */

export interface SearchEntry {
  /** Stable key, and the option's DOM id suffix. */
  id: string;
  /** What the result is called: a page title, or a section heading. */
  title: string;
  /** The page a section belongs to; absent on a page entry. */
  page?: string;
  /** Group label shown beside the result — `Components / Data`. */
  trail: string;
  href: string;
  /** Extra words that should find this entry. */
  text: string;
}

const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Score an entry against a query. Every query word must appear somewhere; a
 * title that starts with the query beats one that merely contains it, and a
 * page beats a section with the same score, so `modal` lands on the Modal page
 * before any section that mentions it.
 */
function score(entry: SearchEntry, words: string[], phrase: string): number {
  const title = normalise(entry.title);
  const haystack = `${title} ${normalise(entry.page ?? '')} ${normalise(entry.trail)} ${normalise(entry.text)}`;
  if (!words.every((w) => haystack.includes(w))) return 0;
  let s = 1;
  if (title === phrase) s += 100;
  else if (title.startsWith(phrase)) s += 50;
  else if (title.includes(phrase)) s += 20;
  if (normalise(entry.page ?? '').startsWith(phrase)) s += 10;
  if (!entry.page) s += 5;
  return s;
}

export function searchEntries(entries: readonly SearchEntry[], query: string, limit = 12): SearchEntry[] {
  const phrase = normalise(query);
  if (!phrase) return [];
  const words = phrase.split(' ');
  return entries
    .map((entry, index) => ({ entry, index, s: score(entry, words, phrase) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s || a.index - b.index)
    .slice(0, limit)
    .map((r) => r.entry);
}
