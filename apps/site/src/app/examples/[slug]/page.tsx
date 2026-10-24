import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SAMPLES } from '@/content/samples';
import { SampleBar } from '@/samples/SampleBar';
import { SamplePage } from '@/samples';

export const dynamicParams = false;

export function generateStaticParams() {
  return SAMPLES.map((sample) => ({ slug: sample.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const sample = SAMPLES.find((s) => s.slug === slug);
  return sample ? { title: sample.title, description: sample.lede } : {};
}

/**
 * A sample project, full page. No `SiteChrome`: the point is to see the
 * package compose a whole product page, so the only site furniture is the bar.
 */
export default async function Page({ params }: Params) {
  const { slug } = await params;
  const sample = SAMPLES.find((s) => s.slug === slug);
  if (!sample) notFound();
  return (
    <div
      className={
        sample.fullHeight
          ? 'flex h-dvh flex-col overflow-hidden bg-surface-base text-content-primary print:block print:h-auto'
          : 'min-h-screen bg-surface-base text-content-primary'
      }
    >
      <SampleBar title={sample.title} story={sample.story} />
      {sample.fullHeight ? (
        <div className="min-h-0 flex-1 print:block">
          <SamplePage slug={sample.slug} />
        </div>
      ) : (
        <SamplePage slug={sample.slug} />
      )}
    </div>
  );
}
