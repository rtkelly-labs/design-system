/** One heading on a page, as the contents rail and the search index read it. */
export interface Section {
  id: string;
  title: string;
  depth: 2 | 3;
}

/**
 * One example: a real component file under `src/examples/`, rendered live and
 * printed as source. The printed code *is* the file the preview mounts, read at
 * build time, so the two cannot drift apart.
 */
export interface Example {
  id: string;
  title: string;
  /** Inline markup: `backticks` become code. */
  description: string;
  /**
   * Path under `src/examples/`. The component itself is looked up in
   * `src/examples/index.ts` by this path, so page metadata — which the root
   * layout reads for search — never imports an example's client code.
   */
  file: string;
  /** Let the preview use the full column rather than centring its content. */
  wide?: boolean;
}

export interface ComponentPageDef {
  /** URL segment under `/docs/components/`. */
  slug: string;
  /** The catalogue name — the last segment of the component's story title. */
  name: string;
  /** One or two sentences under the title. Inline markup. */
  lede: string;
  /** Components whose generated props tables this page shows, in order. */
  props: readonly string[];
  examples: readonly Example[];
  accessibility: {
    /** Inline markup, one paragraph each. */
    notes: readonly string[];
    /** Key → what it does. */
    keyboard?: readonly (readonly [string, string])[];
  };
  /** Extra words that should find the page in search. */
  keywords?: string;
}

export interface ArticleDef {
  href: string;
  title: string;
  /** Group label in the sidebar and search trail. */
  group: string;
  lede: string;
  sections: readonly Section[];
  keywords?: string;
}
