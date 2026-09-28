/**
 * Adapted from mdxcn by Keshav Bagaade, MIT licensed.
 * Source: https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/graph-frame/graph-frame.tsx
 * The port replaces mdxcn's motion runtime and graph variables with this
 * package's deterministic rendering and semantic token contracts.
 */

import * as React from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../../lib/recipe';

export type FigurePalette = 'mono' | 'duo' | 'multi';
export type FigureTone = 'primary' | 'secondary' | 'tertiary' | 'idle' | 'empty';

export const DIM_OPACITY = 0.4;

export const GLYPH_SETS = {
  shade: ['·', '░', '▒', '▓', '█'],
  ascii: ['.', '-', '=', '#', '@'],
  hash: ['.', ':', '+', '#', '█'],
  bar: ['▁', '▂', '▃', '▅', '█'],
} as const;

export type GlyphSetName = keyof typeof GLYPH_SETS;
export type Glyphs = GlyphSetName | readonly string[];

export function resolveGlyphs(glyphs?: Glyphs): readonly string[] {
  if (glyphs == null) return GLYPH_SETS.shade;
  if (typeof glyphs === 'string') return GLYPH_SETS[glyphs] ?? GLYPH_SETS.shade;
  return glyphs.length > 0 ? glyphs : GLYPH_SETS.shade;
}

export function toneClass(palette: FigurePalette | undefined, tone: FigureTone): string {
  if (tone === 'empty') return 'text-content-muted';
  if (tone === 'idle') return 'text-content-secondary';
  if (tone === 'primary') return 'text-accent-primary';
  if (tone === 'secondary') {
    return palette === 'mono' || palette == null ? 'text-content-secondary' : 'text-accent-secondary';
  }
  return palette === 'multi' ? 'text-accent-tertiary' : 'text-accent-secondary';
}

export function intensityClass(level: number, palette: FigurePalette = 'mono'): string {
  const value = Math.min(4, Math.max(0, Math.round(level)));
  if (value === 0) return toneClass(palette, 'empty');
  if (palette === 'mono') return value <= 2 ? toneClass(palette, 'idle') : 'text-content-primary';
  return value === 1 ? toneClass(palette, 'secondary') : value === 2 ? toneClass(palette, 'tertiary') : toneClass(palette, 'primary');
}

export function intensityLevel(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.max(1, Math.round(Math.min(1, value / max) * 4));
}

export function intensityGlyph(level: number, glyphs: readonly string[] = GLYPH_SETS.shade): string {
  if (glyphs.length === 0) return '·';
  const clamped = Math.min(4, Math.max(0, Math.round(level)));
  return glyphs[Math.round((clamped / 4) * (glyphs.length - 1))] ?? glyphs[0] ?? '·';
}

export function words<T extends string>(value: T[] | string): T[] {
  return Array.isArray(value) ? value : value.split(/[\s,]+/).filter(Boolean) as T[];
}

export interface FigureFrameProps extends Omit<React.ComponentProps<'figure'>, 'title'> {
  /** Short uppercase caption drawn across the top edge. */
  title?: string;
  /** Character used at each frame corner. */
  corner?: string;
}

/**
 * Shared border and caption for one or more documentation renderers.
 * Renderers own their data and can also appear without a frame.
 */
export const FigureFrame = React.forwardRef<HTMLElement, FigureFrameProps>(function FigureFrame({ title, corner = '+', className, children, ...rest }, ref) {
  return (
    <figure
      ref={ref}
      aria-label={title ?? 'Document figure'}
      className={cn(
        'relative mx-auto my-8 w-full max-w-5xl border-2 border-dashed border-edge-strong bg-surface-base font-mono text-sm text-content-primary',
        className,
      )}
      {...rest}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -left-2 -top-2 z-10 bg-surface-base px-1 text-content-muted">
        {corner}
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute -right-2 -top-2 z-10 bg-surface-base px-1 text-content-muted">
        {corner}
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-2 -left-2 z-10 bg-surface-base px-1 text-content-muted">
        {corner}
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-2 -right-2 z-10 bg-surface-base px-1 text-content-muted">
        {corner}
      </span>
      {title ? <figcaption className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-surface-base px-3 uppercase tracking-wide text-accent-primary">[ {title} ]</figcaption> : null}
      <div className="flex min-w-0 flex-col gap-6 px-5 py-7 sm:px-8 sm:py-8">{children}</div>
    </figure>
  );
});

/** Internal root for a renderer. The frame owns the inset. */
export const AsciiFrameBody = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(function AsciiFrameBody({ className, ...props }, ref) {
  return <div ref={ref} className={cn('min-w-0', className)} {...props} />;
});

/** Markdown children inside a documentation visual. */
export function AsciiFrameProse({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-3 leading-relaxed',
        '[&_p]:m-0 [&_p]:text-pretty',
        '[&_ul]:m-0 [&_ul]:flex [&_ul]:list-none [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:p-0',
        '[&_ol]:m-0 [&_ol]:flex [&_ol]:list-none [&_ol]:flex-col [&_ol]:gap-1 [&_ol]:p-0',
        '[&_li]:relative [&_li]:pl-4 [&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:text-content-muted [&_li]:before:content-[\'-\']',
        '[&_a]:text-content-primary [&_a]:underline [&_a]:decoration-dashed [&_a]:underline-offset-[0.2em]',
        '[&_code]:font-semibold [&_code]:text-content-primary',
        '[&_pre]:m-0 [&_pre]:whitespace-pre-wrap [&_pre_code]:font-normal [&_pre_code]:text-inherit',
        '[&_strong]:font-semibold [&_strong]:text-content-primary',
        '[&_em]:text-content-secondary [&_em]:not-italic',
        className,
      )}
      {...props}
    />
  );
}

/** A dashed horizontal rule inside a documentation visual. */
export function AsciiFrameRule({ className, ...props }: React.ComponentProps<'div'>) {
  return <div aria-hidden="true" className={cn('my-1 h-px w-full border-t border-dashed border-edge-subtle', className)} {...props} />;
}

/** A dashed vertical rule inside a documentation visual. */
export function AsciiFrameRuleY({ className, ...props }: React.ComponentProps<'div'>) {
  return <div aria-hidden="true" className={cn('w-px self-stretch border-l border-dashed border-edge-subtle', className)} {...props} />;
}

/** A full-width character track used by uptime and related figures. */
export function AsciiFrameTrack({ className, ...props }: React.ComponentProps<'span'>) {
  return <span aria-hidden="true" className={cn('flex w-full min-w-0 select-none', className)} {...props} />;
}

/** One flexible cell in a character track. */
export function AsciiFrameTick({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('min-w-0 flex-1 overflow-hidden text-center', className)} {...props} />;
}

/** ASCII arrow used by flow diagrams. */
export function AsciiFrameArrow({ accent = false, stretch = false, className }: { accent?: boolean; stretch?: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('flex min-w-6 items-center text-content-muted', stretch && 'flex-1', className)}>
      <span className={cn('w-full border-t border-dashed border-current', accent && 'text-accent-primary')} />
      <span className={cn('-ml-1', accent ? 'text-accent-primary' : 'text-content-muted')}>▶</span>
    </span>
  );
}

type WithChildren<P> = P & { children?: ReactNode };
type AsciiItemComponent<P extends object> = ((props: WithChildren<P>) => null) & {
  graphItem: string;
  displayName?: string;
};

/** Defines an MDX-only data child that its parent renderer reads. */
export function defineAsciiItem<P extends object>(name: string): AsciiItemComponent<P> {
  const Item = (() => null) as unknown as AsciiItemComponent<P>;
  Item.displayName = name;
  Item.graphItem = name;
  return Item;
}

function typeName(type: unknown): string {
  if (typeof type === 'string') return type;
  if (typeof type === 'function') {
    const fn = type as { graphItem?: string; displayName?: string; name?: string };
    return fn.graphItem || fn.displayName || fn.name || '';
  }
  if (type && typeof type === 'object') {
    const value = type as { graphItem?: string; displayName?: string; name?: string; $$id?: string };
    if (value.graphItem) return value.graphItem;
    if (value.displayName) return value.displayName;
    if (typeof value.$$id === 'string') return value.$$id.split('#').pop()?.split('@')[0] ?? '';
    return value.name || '';
  }
  return '';
}

export function isHost(element: ReactElement, tags: string | readonly string[]): boolean {
  const name = typeName(element.type).toLowerCase();
  const list = typeof tags === 'string' ? [tags] : tags;
  return list.some((tag) => tag.toLowerCase() === name);
}

export function elementsOf(children: ReactNode): ReactElement[] {
  const result: ReactElement[] = [];
  for (const child of React.Children.toArray(children)) {
    if (!React.isValidElement(child)) continue;
    if (child.type === React.Fragment) {
      result.push(...elementsOf((child.props as { children?: ReactNode }).children));
    } else {
      result.push(child);
    }
  }
  return result;
}

export function textOf(children: ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => (React.isValidElement(child) ? textOf((child.props as { children?: ReactNode }).children) : String(child)))
    .join('');
}

export function itemText(item: ReactElement): string {
  const children = (item.props as { children?: ReactNode }).children;
  return textOf(children).replace(/\s+/g, ' ').trim();
}

export function listItems(children: ReactNode): ReactElement[] {
  const elements = elementsOf(children);
  const lists = elements.filter((element) => isHost(element, ['ul', 'ol']));
  const items = lists.length > 0
    ? lists.flatMap((list) => elementsOf((list.props as { children?: ReactNode }).children))
    : elements;
  return items.filter((element) => isHost(element, 'li'));
}

export function nestedList(item: ReactElement): ReactElement[] {
  return listItems((item.props as { children?: ReactNode }).children);
}

export function paragraphsOf(children: ReactNode): ReactElement[] {
  return elementsOf(children).filter((element) => isHost(element, 'p'));
}

export function hasHost(children: ReactNode, tags: string | readonly string[]): boolean {
  return React.Children.toArray(children).some((child) => {
    if (!React.isValidElement(child)) return false;
    return isHost(child, tags) || hasHost((child.props as { children?: ReactNode }).children, tags);
  });
}

export function childItems<P extends object>(children: ReactNode, item: AsciiItemComponent<P>): (P & { children?: ReactNode })[] {
  return elementsOf(children)
    .filter((element) => typeName(element.type) === item.graphItem)
    .map((element) => element.props as P & { children?: ReactNode });
}

export function splitLabel(value: string): { label: string; rest: string } {
  const match = value.match(/^([^:—–-]+?)\s*:\s*(.*)$/);
  if (!match) return { label: value.trim(), rest: '' };
  return { label: match[1]?.trim() ?? '', rest: match[2]?.trim() ?? '' };
}

export function splitDash(value: string): { label: string; rest: string } {
  const match = value.match(/^(.+?)\s+[-—–]\s+(.+)$/);
  if (!match) return { label: value.trim(), rest: '' };
  return { label: match[1]?.trim() ?? '', rest: match[2]?.trim() ?? '' };
}

export function numberOf(value: number | string): number {
  if (typeof value === 'number') return value;
  const parsed = Number(value.replace(/[^\d.+-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}
