/**
 * Adapted from mdxcn by Keshav Bagaade, MIT licensed.
 * Source: https://github.com/keshav-exe/mdxcn/blob/2928126ba146ebbae9c2351deca27d27bb40e744/registry/default/graph-tree/graph-tree.tsx
 * The local port removes motion and graph variables while retaining nested
 * Markdown and `<Node>` children as the data interface.
 */

import type { ReactNode } from 'react';
import * as React from 'react';
import {
  childItems,
  defineAsciiItem,
  AsciiFrameBody,
  hasHost,
  itemText,
  listItems,
  nestedList,
  textOf,
} from './FigureFrame';
import { cn } from '../../../lib/recipe';

export interface TreeNode {
  label: string;
  meta?: string;
  accent?: boolean;
  children?: TreeNode[];
}

export interface NodeProps {
  /** Label falls back to child text when there are no nested nodes. */
  label?: string;
  meta?: string;
  accent?: boolean;
  children?: ReactNode;
}

export interface TreeDiagramProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible name; the enclosing FigureFrame owns the caption. */
  label?: string;
  /** Data form. If omitted, the component reads nested Markdown or `<Node>` children. */
  nodes?: TreeNode[];
  /** Nested Markdown list or `<Node>` content used to derive nodes. */
  children?: ReactNode;
  /** Additional classes for this tree. */
  className?: string;
}

/** MDX-only tree item, for example `<Node meta="ui">graph-frame.tsx</Node>`. */
export const Node = defineAsciiItem<NodeProps>('Node');

function directTextOf(children: ReactNode): string {
  return React.Children.toArray(children)
    .filter((child) => !(React.isValidElement(child) && (child.type === 'ul' || child.type === 'ol')))
    .map((child) => React.isValidElement(child) ? directTextOf((child.props as { children?: ReactNode }).children) : String(child))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function nodesFromList(items: ReturnType<typeof listItems>): TreeNode[] {
  return items.map((item) => {
    const kids = nodesFromList(nestedList(item));
    const text = directTextOf((item.props as { children?: ReactNode }).children) || itemText(item);
    const [label, meta] = text.split(/\s+[—–]\s+/);
    return {
      label: label || text,
      meta,
      accent: hasHost((item.props as { children?: ReactNode }).children, ['strong', 'b']),
      children: kids.length > 0 ? kids : undefined,
    };
  });
}

function nodesOf(children: ReactNode): TreeNode[] {
  const listed = nodesFromList(listItems(children));
  if (listed.length > 0) return listed;
  return childItems(children, Node).map((node) => {
    const kids = nodesOf(node.children);
    return { label: node.label ?? (kids.length === 0 ? textOf(node.children) : ''), meta: node.meta, accent: node.accent, children: kids.length > 0 ? kids : undefined };
  });
}

interface FlatRow extends Omit<TreeNode, 'children'> {
  key: string;
  branch: string;
}

function flatten(nodes: TreeNode[], prefix = '', trail = 'root', isRoot = true): FlatRow[] {
  const singleRoot = isRoot && nodes.length === 1;
  return nodes.flatMap((node, index) => {
    const last = index === nodes.length - 1;
    const branch = singleRoot ? '' : prefix + (last ? '└─ ' : '├─ ');
    const key = `${trail}/${node.label}-${index}`;
    const childPrefix = singleRoot ? '' : prefix + (last ? '   ' : '│  ');
    const row: FlatRow = { key, branch, label: node.label, meta: node.meta, accent: node.accent };
    return [row, ...(node.children ? flatten(node.children, childPrefix, key, false) : [])];
  });
}

/** Renders a nested file-like tree and keeps the node count available to screen readers. */
export const TreeDiagram = React.forwardRef<HTMLDivElement, TreeDiagramProps>(function TreeDiagram({ label = 'Tree diagram', nodes, children, className, ...rest }, ref) {
  const rows = flatten(nodes ?? nodesOf(children));
  const hasAccent = rows.some((row) => row.accent);

  return (
      <AsciiFrameBody ref={ref} {...rest} className={cn('overflow-x-auto', className)}>
        <ul className="flex min-w-max flex-col gap-1" aria-label={label}>
          {rows.map((row) => {
            const emphasized = hasAccent && row.accent;
            return <li className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6" key={row.key}>
              <span className="whitespace-nowrap"><span aria-hidden="true" className="select-none text-content-muted">{row.branch}</span><span className={cn(emphasized ? 'text-accent-primary' : 'text-content-primary')}>{row.label}</span></span>
              {row.meta ? <span className={cn('tabular-nums', emphasized ? 'text-accent-secondary' : 'text-content-secondary')}>{row.meta}</span> : <span />}
            </li>;
          })}
        </ul>
        <span className="sr-only">Tree with {rows.length} nodes.</span>
      </AsciiFrameBody>
  );
});
