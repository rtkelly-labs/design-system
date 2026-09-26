import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteChrome } from '@/components/chrome/SiteChrome';
import { PageIntro } from '@/components/docs/PageIntro';
import { SAMPLES, sampleHref } from '@/content/samples';

export const metadata: Metadata = {
  title: 'Examples',
  description: 'Whole pages composed from the package, each opened full-page.',
};

/** The sample projects, one card each, opening full-page. */
export default function ExamplesIndex() {
  return (
    <SiteChrome>
      <div className="mx-auto max-w-6xl px-4 pt-10 pb-16 md:px-6">
        <PageIntro
          eyebrow="EXAMPLES"
          title="Whole pages, from the box"
          lede="Each example is a composition the package exports, rendered full-page with its own sample data. Switch the level from the bar at the top of any of them."
        />
        <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-2">
          {SAMPLES.map((sample) => (
            <li key={sample.slug} className="flex flex-col border-2 border-edge-strong bg-surface-raised shadow-hard-md">
              <Link
                href={sampleHref(sample)}
                className="flex flex-1 flex-col gap-3 p-5 text-content-primary no-underline hover:text-accent-primary"
              >
                <span className="font-display text-2xl font-extrabold uppercase">{sample.title}</span>
                <span className="text-content-secondary">{sample.lede}</span>
                <span className="font-mono text-xs text-content-muted">{sample.components.join(' · ')}</span>
              </Link>
              <div className="flex justify-between border-t-2 border-edge-strong px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider">
                <Link href={sampleHref(sample)} className="text-accent-primary no-underline hover:underline">
                  Open →<span className="sr-only"> {sample.title}</span>
                </Link>
                <a href={sample.story} className="text-accent-primary no-underline hover:underline">
                  Storybook ↗<span className="sr-only"> for {sample.title}</span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </SiteChrome>
  );
}
