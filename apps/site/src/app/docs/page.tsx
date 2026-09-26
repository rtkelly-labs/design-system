import type { Metadata } from 'next';
import Link from 'next/link';
import { Article, Heading } from '@/components/docs/Article';
import { Inline } from '@/components/docs/Inline';
import { overview as article } from '@/content/articles';
import { COMPONENT_PAGES, componentHref } from '@/content/registry';

export const metadata: Metadata = { title: article.title, description: article.lede };

const PRINCIPLES: [string, string][] = [
  ['Zero radius, hard shadows, 2px edges', 'The most recognisable property of the system, and a token rather than a reset. `rounded-lg` is square in a consumer\'s own markup too.'],
  ['Colour by role, never by hue', 'A component asks for `bg-surface-raised` or `text-intent-danger`, never `cyan`. A lint rule keeps the hue-named call-site count at zero.'],
  ['Two levels, drawn separately', '`midnight` is neon on blue-black. `sketch` is warm paper and pen ink. Neither is the other inverted, which is why a sketch preview sits beside every example here.'],
  ['Contrast is a gate', 'Every role pair on every level is checked as arithmetic in CI: 260 pairs, WCAG AA for text, 3:1 for UI edges.'],
  ['One interaction library', 'Focus, dialogs, menus and popups come from Base UI and nothing else. Two focus models in one tree is worse than either one.'],
];

export default function OverviewPage() {
  return (
    <Article article={article}>
      <Heading article={article} id="what-it-is" />
      <p>
        <code>@rtkelly13/design-system</code> is the visual language of ryankelly.dev, packaged as React components and
        Tailwind v4 tokens. Its character is <strong>brutalist neon terminal</strong>: monospace and condensed display
        type, bracketed labels, high-chroma accents on near-black, or ink on warm paper. It should read as a CRT and a
        drafting table, not as a SaaS dashboard.
      </p>
      <p>
        Every colour starts in one TypeScript module. The Tailwind theme, the DTCG token files and the terminal schemes
        are all generated from it and checked against it in CI.
      </p>

      <Heading article={article} id="principles" />
      <dl>
        {PRINCIPLES.map(([term, detail]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>
              <Inline text={detail} />
            </dd>
          </div>
        ))}
      </dl>

      <Heading article={article} id="this-site" />
      <p>This site is the package&apos;s first real Next.js consumer, and it hides nothing about how it is built:</p>
      <ul>
        <li>
          Every page is a static Server Component. Interactive parts are client islands that receive serialisable props.
          One client boundary at the root holds the level, the router adapter, toasts and search.
        </li>
        <li>
          Each example is a real file under <code>src/examples/</code>. The preview mounts it and the code block prints
          that same file, highlighted at build time, so the code you copy is the code that ran.
        </li>
        <li>
          Props tables come from react-docgen-typescript run over the package source, with Storybook&apos;s own options.
          The sidebar files components by their Storybook titles and category order.
        </li>
        <li>
          Fake data comes from a seeded generator with a fixed start time. Every build, and every screenshot, shows the
          same deployments.
        </li>
        <li>
          Where the package could not express something a docs site needs, the site says so and links the upstream
          issue, rather than quietly reimplementing it.
        </li>
      </ul>

      <Heading article={article} id="where-next" />
      <ul>
        <li>
          <Link href="/docs/installation">Installation</Link>: set up the stylesheet, the provider and Next.js.
        </li>
        {COMPONENT_PAGES.map((page) => (
          <li key={page.slug}>
            <Link href={componentHref(page)}>{page.name}</Link>
          </li>
        ))}
        <li>
          <Link href="/docs/components">All components</Link>: the full catalogue, with Storybook links for the pages not
          yet written.
        </li>
      </ul>
    </Article>
  );
}
