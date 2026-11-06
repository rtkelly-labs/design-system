/**
 * Heading slug generation, kept deliberately compatible with `github-slugger`
 * (the slugger behind `rehype-slug`).
 *
 * The docs pipeline generates heading `id`s at build time via `rehype-slug`,
 * but the same ids have to be derivable on the client — the table of contents,
 * the scroll-spy observer, and the copy-link affordance all need to agree on
 * what `#some-heading` refers to. Reimplementing the same rules here means a
 * runtime-built TOC lands on the same anchors as a remark-built one.
 */

/**
 * Characters github-slugger strips outright. Kept as an explicit class rather
 * than a `\W` negation so that accented latin, CJK, and emoji-adjacent glyphs
 * survive the same way they do on GitHub.
 */
const STRIP =
  /[ -⁯⸀-⹿\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~–—‘’“”]/g;

/** Slugify a single heading string. Does not deduplicate — see {@link Slugger}. */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(STRIP, '')
    .replace(/\s/g, '-');
}

/**
 * Stateful slugger that appends `-1`, `-2`, … to repeated headings, matching
 * `github-slugger`. Create one per document; reuse across documents would leak
 * counts between pages and desynchronise the anchors from the rendered HTML.
 */
export class Slugger {
  private readonly seen = new Map<string, number>();

  slug(value: string): string {
    const base = slugify(value);
    const count = this.seen.get(base);

    if (count === undefined) {
      this.seen.set(base, 0);
      return base;
    }

    const next = count + 1;
    this.seen.set(base, next);
    return `${base}-${next}`;
  }

  reset(): void {
    this.seen.clear();
  }
}

/**
 * Extract the plain text of a React child tree so a heading rendered as
 * `<h2>The <code>tvs</code> CLI</h2>` still slugs to `the-tvs-cli`.
 *
 * Only walks strings, numbers, arrays, and elements with `children` in props —
 * anything else (a component that renders text internally) is invisible here,
 * which is why {@link AnchorHeading} also accepts an explicit `id`.
 */
export function childrenToText(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(childrenToText).join('');

  if (typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: unknown } }).props;
    if (props && 'children' in props) return childrenToText(props.children);
  }

  return '';
}
