import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * A framed piece of the homepage with a way into its documentation — the
 * homepage's promise is that everything on it is a real component with a page.
 */
export function DemoPanel({
  label,
  docs,
  className = '',
  children,
}: {
  /** Component name, shown in the frame's tab. */
  label: string;
  /** Its docs page. */
  docs: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={'flex min-w-0 flex-col border-2 border-edge-strong bg-surface-raised shadow-hard-md ' + className}>
      <div className="flex items-center justify-between gap-3 border-b-2 border-edge-strong px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider">
        <span className="text-content-muted">[ {label} ]</span>
        <Link href={docs} className="text-accent-primary no-underline hover:underline">
          Docs →<span className="sr-only"> for {label}</span>
        </Link>
      </div>
      <div className="min-w-0 flex-1 p-4 sm:p-5">{children}</div>
    </div>
  );
}

/** A section heading on the homepage: bracketed eyebrow, display title, one line. */
export function SectionHead({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex max-w-3xl flex-col gap-3">
      <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-accent-primary">[ {eyebrow} ]</p>
      <h2 id={id} className="m-0 font-display text-3xl font-extrabold uppercase tracking-tight sm:text-4xl">{title}</h2>
      {children ? <p className="m-0 text-lg text-content-secondary">{children}</p> : null}
    </div>
  );
}
