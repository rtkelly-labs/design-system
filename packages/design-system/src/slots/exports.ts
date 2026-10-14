/**
 * What the design system exports, classified from the running module, not from a list.
 *
 * `analyse()` reads `src/index.ts` as the module and sorts every export into one of four classes, and
 * derives each composition part's parent mechanically. Three things consume it: the slot contract
 * (`slots.test.tsx`), the compendium's coverage test in `@rtkelly13/design-system-report`, and the
 * compendium's slot map. A NEW export is classified the moment it exists; nothing here is a list of
 * component names.
 *
 * Classes
 *   component  a standalone, visible component.
 *   part       a composition piece of a parent (TabsList of Tabs). Derived from, in order: a story's
 *              `subcomponents`, living in the parent's file, or a name prefix of a parent export.
 *   provider   a context/wrapper with no visual of its own (name ends in Provider).
 *   nonvisual  hooks, tokens, utilities, classes, constants. Types are erased at runtime, so the type
 *              surface is `check:api`'s job.
 */

import * as ds from '../index';

// Vite's `import.meta.glob`, typed locally: `vite/client` is not in this package's tsconfig, and
// vitest (the only thing that runs this file) provides the real one.
declare global {
  interface ImportMeta {
    glob<T = unknown>(pattern: string | string[], options?: { eager?: boolean }): Record<string, () => Promise<T>>;
  }
}

export type ExportClass = 'component' | 'part' | 'provider' | 'nonvisual';
export type PartBasis = 'story-subcomponent' | 'same-file' | 'name-prefix';

export interface ExportInfo {
  name: string;
  class: ExportClass;
  /** Set for a part. */
  parent?: string;
  basis?: PartBasis;
  /** Story files whose meta names this as `component`. */
  stories: string[];
}

const storyLoaders = import.meta.glob('../stories/**/*.stories.tsx');
const moduleExports = import.meta.glob(['../components/**/*.{ts,tsx}', '!**/*.test.*'], {
  eager: true,
}) as unknown as Record<string, Record<string, unknown>>;

const isClass = (v: unknown) => typeof v === 'function' && /^class\s/.test(Function.prototype.toString.call(v));
const isExotic = (v: unknown) => typeof v === 'object' && v !== null && '$$typeof' in v;

/** A component is a PascalCase, non-constant export that is a function component or a forwardRef/memo. */
export function isComponentExport(name: string, value: unknown): boolean {
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name) || !/[a-z]/.test(name)) return false;
  return (typeof value === 'function' && !isClass(value)) || isExotic(value);
}

export interface Analysis {
  exports: ExportInfo[];
  storyFiles: number;
  storyExports: number;
  /** Story-module namespace per story file, for the registry to cite. */
  byClass: Record<ExportClass, string[]>;
  /** The story modules whose meta names a component, for rendering it without Storybook. */
  storyModules: Map<string, Record<string, unknown>[]>;
}

export async function analyse(): Promise<Analysis> {
  const entries = Object.entries(ds as Record<string, unknown>);
  const components = new Map(entries.filter(([k, v]) => isComponentExport(k, v)));
  const idOf = new Map<unknown, string>([...components].map(([k, v]) => [v, k]));

  // export -> defining file, from the component modules themselves.
  const fileOf = new Map<string, string>();
  for (const [file, mod] of Object.entries(moduleExports)) {
    for (const [k, v] of Object.entries(mod)) {
      if (idOf.get(v) === k && !fileOf.has(k)) fileOf.set(k, file);
    }
  }
  const basename = (file: string) => file.replace(/^.*\//, '').replace(/\.tsx?$/, '');

  const stories = new Map<string, string[]>();
  const subOf = new Map<string, string>();
  const storyModules = new Map<string, Record<string, unknown>[]>();
  let storyExports = 0;
  for (const [file, load] of Object.entries(storyLoaders)) {
    const mod = (await load()) as Record<string, unknown> & {
      default?: { component?: unknown; subcomponents?: Record<string, unknown> };
    };
    storyExports += Object.keys(mod).filter((k) => k !== 'default').length;
    const label = file.replace(/^.*\/stories\//, '');
    const owner = idOf.get(mod.default?.component);
    if (owner) {
      stories.set(owner, [...(stories.get(owner) ?? []), label]);
      storyModules.set(owner, [...(storyModules.get(owner) ?? []), mod]);
    }
    for (const sub of Object.values(mod.default?.subcomponents ?? {})) {
      const name = idOf.get(sub);
      if (name && owner && name !== owner) subOf.set(name, owner);
    }
  }

  const out: ExportInfo[] = [];
  for (const [name, value] of entries) {
    if (!components.has(name)) {
      out.push({ name, class: 'nonvisual', stories: [] });
      continue;
    }
    const own = stories.get(name) ?? [];
    if (/Provider$/.test(name)) {
      out.push({ name, class: 'provider', stories: own });
      continue;
    }
    const base: ExportInfo = { name, class: 'component', stories: own };
    void value;
    if (own.length === 0) {
      const file = fileOf.get(name);
      const primary = file ? basename(file) : undefined;
      const prefix = [...components.keys()]
        .filter((other) => other !== name && name.startsWith(other) && !/Provider$/.test(other))
        .sort((a, b) => b.length - a.length)[0];
      if (subOf.has(name)) Object.assign(base, { class: 'part', parent: subOf.get(name), basis: 'story-subcomponent' });
      else if (primary && primary !== name && components.has(primary) && !/Provider$/.test(primary))
        Object.assign(base, { class: 'part', parent: primary, basis: 'same-file' });
      else if (prefix) Object.assign(base, { class: 'part', parent: prefix, basis: 'name-prefix' });
    }
    out.push(base);
  }

  const byClass: Record<ExportClass, string[]> = { component: [], part: [], provider: [], nonvisual: [] };
  for (const e of out) byClass[e.class].push(e.name);
  return { exports: out, storyFiles: Object.keys(storyLoaders).length, storyExports, byClass, storyModules };
}
