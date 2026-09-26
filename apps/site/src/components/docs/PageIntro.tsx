import type { ReactNode } from 'react';
import { Inline } from './Inline';

/**
 * The head of every docs page: a bracketed eyebrow naming where the page sits,
 * the title, and a one-paragraph lede. Outside the prose scope, because the
 * page title is set larger and tighter than an article `h1`.
 */
export function PageIntro({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  children?: ReactNode;
}) {
  return (
    <header className="not-prose mt-6 mb-8 flex flex-col gap-4 border-b-4 border-double border-edge-strong pb-8">
      <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">[ {eyebrow} ]</p>
      <h1 className="m-0 font-display text-4xl font-extrabold uppercase tracking-tight text-content-primary sm:text-5xl">
        {title}
      </h1>
      <p className="m-0 max-w-3xl text-lg leading-relaxed text-content-secondary [&_code]:border [&_code]:border-edge-default [&_code]:bg-surface-raised [&_code]:px-1.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-content-primary">
        <Inline text={lede} />
      </p>
      {children}
    </header>
  );
}
