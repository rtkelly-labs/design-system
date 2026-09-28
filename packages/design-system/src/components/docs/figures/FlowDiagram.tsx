/**
 * Adapted from mdxcn by Keshav Bagaade, MIT licensed.
 * Source: https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/graph-flow/graph-flow.tsx
 * The local port keeps the MDX data API while replacing motion and graph
 * variables with deterministic rendering and semantic design-system tokens.
 */

import type { ReactNode } from 'react';
import * as React from 'react';
import {
  childItems,
  defineAsciiItem,
  AsciiFrameArrow,
  AsciiFrameBody,
  isHost,
  listItems,
  paragraphsOf,
  textOf,
  type FigurePalette,
} from './FigureFrame';
import { cn } from '../../../lib/recipe';

export type FlowTone = 'default' | 'accent' | 'muted';

export interface FlowNode {
  /** Text shown in the node. */
  label: string;
  /** Visual emphasis for the node. */
  tone?: FlowTone;
  /** Let this node absorb available row width. */
  stretch?: boolean;
}

export interface FlowRow {
  /** Nodes rendered from left to right. */
  nodes: FlowNode[];
}

export interface FlowPathProps {
  /** Flow nodes can also be written as Markdown children. */
  children?: ReactNode;
}

export interface FlowDiagramProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name for the paths; the enclosing FigureFrame owns the caption. */
  label?: string;
  /** Data form. If omitted, the component reads Markdown or `<Path>` children. */
  rows?: FlowRow[];
  /** Markdown list or `<Path>` content used to derive rows. */
  children?: ReactNode;
  /** Accent palette used for emphasized nodes. */
  palette?: FigurePalette;
  /** Additional classes for this diagram. */
  className?: string;
}

/** MDX-only item for a flow row, for example `<Path>write → ship</Path>`. */
export const Path = defineAsciiItem<FlowPathProps>('Path');

const ARROW = /\s*(?:→|->|—>|=>)\s*/;

function nodesOf(children: ReactNode): FlowNode[] {
  const nodes: FlowNode[] = [];

  for (const child of React.Children.toArray(children)) {
    if (typeof child === 'string' || typeof child === 'number') {
      for (const part of String(child).split(ARROW)) {
        const label = part.trim();
        if (label) nodes.push({ label });
      }
      continue;
    }

    if (!React.isValidElement<{ children?: ReactNode }>(child)) continue;
    if (isHost(child, ['strong', 'b'])) {
      nodes.push({ label: textOf(child).trim(), tone: 'accent' });
      continue;
    }
    if (isHost(child, ['em', 'i'])) {
      nodes.push({ label: textOf(child).trim(), tone: 'muted' });
      continue;
    }
    nodes.push(...nodesOf(child.props.children));
  }

  return nodes;
}

function rowsOf(children: ReactNode): FlowRow[] {
  const tagged = childItems(children, Path).map((path) => ({ nodes: nodesOf(path.children) }));
  if (tagged.length > 0) return tagged;

  const listed = listItems(children);
  if (listed.length > 0) {
    return listed.map((item) => ({ nodes: nodesOf((item.props as { children?: ReactNode }).children) }));
  }

  const paragraphs = paragraphsOf(children);
  if (paragraphs.length > 0) {
    return paragraphs.map((paragraph) => ({ nodes: nodesOf((paragraph.props as { children?: ReactNode }).children) }));
  }

  const text = textOf(children).trim();
  return text ? text.split(/\n+/).map((line) => ({ nodes: nodesOf(line) })) : [];
}

function toneClass(palette: FigurePalette | undefined, tone: FlowTone): string {
  if (tone === 'accent') return 'text-accent-primary';
  if (tone === 'muted') return palette === 'multi' ? 'text-accent-secondary' : 'text-content-muted';
  return 'text-content-primary';
}

/**
 * Renders an MDX-friendly sequence of nodes connected by ASCII arrows.
 * Bold nodes are emphasized and italic nodes recede without relying on animation.
 */
export const FlowDiagram = React.forwardRef<HTMLDivElement, FlowDiagramProps>(function FlowDiagram({ label = 'Flow diagram', rows: rowsProp, children, palette, className, ...rest }, ref) {
  const rows = rowsProp ?? rowsOf(children);

  return (
      <AsciiFrameBody ref={ref} {...rest} className={cn('flex flex-col gap-7', className)}>
        <div className="flex flex-col gap-7" role="list" aria-label={`${label} paths`}>
          {rows.map((row, rowIndex) => (
            <div
              className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:flex-nowrap"
              key={`row-${rowIndex}`}
              aria-label={row.nodes.map((node) => node.label).join(' then ')}
              role="listitem"
            >
              {row.nodes.map((node, nodeIndex) => (
                <div className={cn('flex min-w-0 items-center gap-3', node.stretch && 'min-w-16 flex-1')} key={`${node.label}-${nodeIndex}`}>
                  {nodeIndex > 0 ? <AsciiFrameArrow accent={node.tone === 'accent'} stretch={node.stretch} /> : null}
                  <span className={cn('shrink-0 whitespace-nowrap', toneClass(palette, node.tone ?? 'default'))}>{node.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <span className="sr-only">
          {rows.length === 0 ? 'Empty flow.' : `Flow with ${rows.length} path${rows.length === 1 ? '' : 's'}: ${rows.map((row) => row.nodes.map((node) => node.label).join(' then ')).join('; ')}.`}
        </span>
      </AsciiFrameBody>
  );
});
