import { useCallback, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { DocsLink } from './DocsLinkProvider';
import { cn } from '../../lib/recipe';

export interface DocsNavNode {
  label: string;
  /** Omit for a pure grouping node. */
  href?: string;
  items?: readonly DocsNavNode[];
  /** Start collapsed even when it does not contain the active page. */
  defaultCollapsed?: boolean;
}

export interface DocsSidebarProps {
  nav: readonly DocsNavNode[];
  /** Current page path, matched against `href` to mark the active item. */
  currentPath?: string;
  /** Shown above the tree. Pass `null` to omit. */
  label?: string | null;
  /** Called after any nav link is clicked — close the mobile drawer here. */
  onNavigate?: () => void;
  className?: string;
}

/** Does this subtree contain `path`? Drives auto-expansion of the active branch. */
function containsPath(node: DocsNavNode, path: string | undefined): boolean {
  if (!path) return false;
  if (node.href === path) return true;
  return (node.items ?? []).some((child) => containsPath(child, path));
}

/**
 * Collapsible documentation navigation tree.
 *
 * Groups containing the current page expand on mount and cannot be
 * force-collapsed by stale state — expansion is stored as an override keyed by
 * group path, so navigating into a collapsed section still reveals it.
 */
export function DocsSidebar({
  nav,
  currentPath,
  label = 'DOCS',
  onNavigate,
  className = '',
}: DocsSidebarProps) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const toggle = useCallback((key: string, next: boolean) => {
    setOverrides((prev) => ({ ...prev, [key]: next }));
  }, []);

  return (
    <nav className={cn('not-prose', className)} aria-label="Documentation">
      {label && <p className="docs-sidebar-label">[ {label} ]</p>}
      <NodeList
        nodes={nav}
        currentPath={currentPath}
        depth={0}
        path=""
        overrides={overrides}
        onToggle={toggle}
        onNavigate={onNavigate}
      />
    </nav>
  );
}

interface NodeListProps {
  nodes: readonly DocsNavNode[];
  currentPath: string | undefined;
  depth: number;
  path: string;
  overrides: Record<string, boolean>;
  onToggle: (key: string, next: boolean) => void;
  onNavigate: (() => void) | undefined;
}

function NodeList({ nodes, depth, path, ...rest }: NodeListProps) {
  return (
    <ul className="docs-sidebar-list" data-depth={depth}>
      {nodes.map((node, index) => (
        <NodeItem
          key={`${path}/${node.href ?? node.label}#${index}`}
          node={node}
          depth={depth}
          path={`${path}/${node.href ?? node.label}`}
          {...rest}
        />
      ))}
    </ul>
  );
}

interface NodeItemProps extends Omit<NodeListProps, 'nodes'> {
  node: DocsNavNode;
}

function NodeItem({
  node,
  currentPath,
  depth,
  path,
  overrides,
  onToggle,
  onNavigate,
}: NodeItemProps) {
  const hasChildren = (node.items?.length ?? 0) > 0;
  const isActive = Boolean(node.href && node.href === currentPath);

  const onActiveBranch = useMemo(
    () => containsPath(node, currentPath),
    [node, currentPath],
  );

  // Precedence: an explicit user toggle wins; otherwise the branch holding the
  // current page is open, and `defaultCollapsed` decides the rest.
  const expanded =
    overrides[path] ?? (onActiveBranch || node.defaultCollapsed !== true);

  if (!hasChildren) {
    return (
      <li>
        {node.href ? (
          <DocsLink
            href={node.href}
            className="docs-sidebar-link"
            data-active={isActive ? 'true' : undefined}
            onClick={onNavigate}
            {...(isActive ? { 'aria-current': 'page' as const } : {})}
          >
            {node.label}
          </DocsLink>
        ) : (
          <span className="docs-sidebar-link docs-sidebar-link-static">{node.label}</span>
        )}
      </li>
    );
  }

  return (
    <li>
      <div className="docs-sidebar-group">
        <button
          type="button"
          className="docs-sidebar-toggle"
          onClick={() => onToggle(path, !expanded)}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${node.label}`}
        >
          <ChevronRight
            size={14}
            aria-hidden="true"
            style={{
              transform: expanded ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>

        {node.href ? (
          <DocsLink
            href={node.href}
            className="docs-sidebar-link docs-sidebar-group-label"
            data-active={isActive ? 'true' : undefined}
            onClick={onNavigate}
            {...(isActive ? { 'aria-current': 'page' as const } : {})}
          >
            {node.label}
          </DocsLink>
        ) : (
          <button
            type="button"
            className="docs-sidebar-link docs-sidebar-group-label"
            onClick={() => onToggle(path, !expanded)}
            aria-expanded={expanded}
          >
            {node.label}
          </button>
        )}
      </div>

      {expanded && (
        <NodeList
          nodes={node.items ?? []}
          currentPath={currentPath}
          depth={depth + 1}
          path={path}
          overrides={overrides}
          onToggle={onToggle}
          onNavigate={onNavigate}
        />
      )}
    </li>
  );
}
