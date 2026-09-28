import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ComponentPage } from '@/components/docs/ComponentPage';
import { COMPONENT_PAGES } from '@/content/registry';

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPONENT_PAGES.map((page) => ({ slug: page.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = COMPONENT_PAGES.find((p) => p.slug === slug);
  return page ? { title: page.name, description: page.lede.replace(/`/g, '') } : {};
}

export default async function Page({ params }: Params) {
  const { slug } = await params;
  const page = COMPONENT_PAGES.find((p) => p.slug === slug);
  if (!page) notFound();
  return <ComponentPage page={page} />;
}
