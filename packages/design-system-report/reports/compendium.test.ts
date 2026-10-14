/**
 * Coverage: is every public component in the compendium, and is every part exercised?
 *
 * WHY HERE. The coverage rule is about a report that lives in this package, so the test sits with
 * it (vitest's `include` is widened to `reports/*.test.ts`). It could not live in the design
 * system: the design system must never import from this package, and the compendium is this
 * package's. It reads the design system's `src/` directly (not `dist/`) so it needs no build and
 * sees the same module identities the stories do.
 *
 * WHAT IT PROVES, in order of strength
 *   1. Every export is classified. A new export is either obviously non-visual (a hook, a token),
 *      a provider, a part with a derivable parent, or a component, and a component with no plate, no
 *      exemption and no backlog entry fails here.
 *   2. Every part of a plated parent is exercised in that parent's plate. Proved by rendering the
 *      plate with the JSX runtime wrapped, and asking which component types were created, which
 *      also catches parts a parent creates internally from markdown-ish children.
 *   3. EXEMPT and BACKLOG can only shrink: a stale name, or a backlog entry that has since got a
 *      plate, fails.
 */

import { isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as ds from '../../design-system/src/index';
import { EXEMPT, analyse, type Analysis } from './compendium.coverage';
import { BACKLOG } from './compendium.backlog';
import { PLATES } from './compendium.registry';
import { MATRICES } from './compendium.states';
import { showsComponent, slotLabel } from './compendium.slots';

const seen = vi.hoisted(() => new Set<unknown>());
vi.mock('react/jsx-runtime', async (importOriginal) => {
  const real = await importOriginal<typeof import('react/jsx-runtime')>();
  const wrap = (fn: (...a: never[]) => unknown) => (type: unknown, ...rest: never[]) => (seen.add(type), fn(type as never, ...rest));
  return { ...real, jsx: wrap(real.jsx as never), jsxs: wrap(real.jsxs as never) };
});
vi.mock('react/jsx-dev-runtime', async (importOriginal) => {
  const real = await importOriginal<typeof import('react/jsx-dev-runtime')>();
  const wrap = (fn: (...a: never[]) => unknown) => (type: unknown, ...rest: never[]) => (seen.add(type), fn(type as never, ...rest));
  return { ...real, jsxDEV: wrap(real.jsxDEV as never) };
});

/**
 * Element types in a tree that was built before the render started. Story modules hoist shared JSX
 * (Tabs.stories builds its TabsList at import), which the jsx-runtime wrapper never sees, so the
 * authored tree is walked too: children and any prop that is itself an element.
 */
function collect(node: ReactNode, into: Set<unknown>) {
  if (Array.isArray(node)) return node.forEach((n) => collect(n, into));
  if (node && typeof node === 'object' && !isValidElement(node)) {
    for (const value of Object.values(node as unknown as Record<string, unknown>)) collect(value as ReactNode, into);
    return;
  }
  if (!isValidElement(node)) return;
  into.add(node.type);
  for (const value of Object.values((node as { props: Record<string, unknown> }).props)) collect(value as ReactNode, into);
}

/** Everything a state creates or carries: the walked tree, plus what the render itself builds. */
function exercised(plate: (typeof PLATES)[number]): Set<unknown> {
  seen.clear();
  const all = new Set<unknown>();
  for (const state of plate.states) {
    const node = state.render();
    collect(node, all);
    collect(state.authored as ReactNode, all);
    renderToStaticMarkup(node as never);
  }
  seen.forEach((t) => all.add(t));
  return all;
}

let analysis: Analysis;
beforeEach(async () => {
  analysis ??= await analyse();
});

const plated = new Set(PLATES.map((p) => p.component));
/** The backlog may only shrink. Lower this when it does; raising it is a decision, not a fix. */
const BACKLOG_CEILING = 11;

describe('compendium coverage', () => {
  it('classifies every export, and reports the real numbers', () => {
    const { byClass, storyFiles, storyExports, exports } = analysis;
    const withStory = exports.filter((e) => e.class === 'component' && e.stories.length > 0).length;
    const parts = exports.filter((e) => e.class === 'part');
    const basis = (b: string) => parts.filter((p) => p.basis === b).length;
    // eslint-disable-next-line no-console
    console.log(
      `exports ${exports.length}: component ${byClass.component.length} (${withStory} with a story, ` +
        `${byClass.component.length - withStory} without), part ${byClass.part.length} ` +
        `(story-subcomponent ${basis('story-subcomponent')}, same-file ${basis('same-file')}, name-prefix ${basis('name-prefix')}), ` +
        `provider ${byClass.provider.length}, nonvisual ${byClass.nonvisual.length}; ` +
        `${storyFiles} story files, ${storyExports} story exports; plated ${plated.size}, backlog ${Object.keys(BACKLOG).length}, exempt ${Object.keys(EXEMPT).length}`,
    );
    expect(exports.length).toBeGreaterThan(100);
    // The automatic rules must keep resolving the shapes they were written for.
    expect(analysis.byClass.provider).toContain('ThemeProvider');
    expect(analysis.exports.find((e) => e.name === 'TabsList')).toMatchObject({ class: 'part', parent: 'Tabs' });
    expect(analysis.exports.find((e) => e.name === 'useCopyToClipboard')?.class).toBe('nonvisual');
  });

  it('every standalone component has a plate, an exemption, or a backlog entry', () => {
    const unaccounted = analysis.byClass.component.filter((c) => !plated.has(c) && !(c in EXEMPT) && !(c in BACKLOG));
    expect(unaccounted, `New component(s) with no plate. Add a plate in compendium.registry.tsx, or (only if it truly cannot be shown) an EXEMPT entry with a reason: ${unaccounted.join(', ')}`).toEqual([]);
  });

  it('the backlog has not grown', () => {
    expect(Object.keys(BACKLOG).length).toBeLessThanOrEqual(BACKLOG_CEILING);
  });

  it('every plate names a standalone component, and the ledgers hold no stale names', () => {
    const components = new Set(analysis.byClass.component);
    expect([...plated].filter((p) => !components.has(p))).toEqual([]);
    expect(Object.keys(EXEMPT).filter((n) => !components.has(n))).toEqual([]);
    expect(Object.keys(BACKLOG).filter((n) => !components.has(n)), 'stale BACKLOG name (removed or reclassified)').toEqual([]);
    expect(Object.keys(BACKLOG).filter((n) => plated.has(n) || n in EXEMPT), 'BACKLOG entry now plated or exempt: delete it').toEqual([]);
  });

  it('every part of a plated parent is exercised inside that parent’s plate', () => {
    const missing: string[] = [];
    for (const plate of PLATES) {
      const all = exercised(plate);
      const parts = analysis.exports.filter((e) => e.class === 'part' && e.parent === plate.component);
      for (const part of parts) {
        if (!all.has((ds as Record<string, unknown>)[part.name])) missing.push(`${plate.component} -> ${part.name} (${part.basis})`);
      }
    }
    expect(missing, 'part not exercised in its parent plate; add it to a story or a custom state').toEqual([]);
  });

  it('every plate renders something', () => {
    for (const plate of PLATES) {
      for (const state of plate.states) {
        const html = renderToStaticMarkup(state.render() as never);
        expect(html.trim().length, `${plate.component}/${state.id} rendered empty`).toBeGreaterThan(0);
      }
    }
  });

  it('every forced state changes the markup, so none is invented', () => {
    const html = (n: unknown) => renderToStaticMarkup(n as never);
    for (const m of MATRICES) {
      const [resting, ...rest] = m.ids;
      const base = html(m.render(resting!));
      for (const id of rest) expect(html(m.render(id)), `${m.component} forced state "${id}" renders the same as "${resting}"`).not.toBe(base);
    }
  });

  it('every plated component, and every part of one, shows its data-slot in its plate', () => {
    const slotsOf = (html: string) => [...html.matchAll(/data-slot="([^"]+)"/g)].map((m) => m[1]!);
    const missing: string[] = [];
    for (const plate of PLATES) {
      const slots = plate.states.flatMap((s) => slotsOf(renderToStaticMarkup(s.render() as never)));
      const parts = analysis.exports.filter((e) => e.class === 'part' && e.parent === plate.component).map((e) => e.name);
      for (const name of [plate.component, ...parts]) if (!showsComponent(name, slots)) missing.push(`${plate.component}${name === plate.component ? '' : ` -> ${name}`}: no data-slot="${slotLabel(name)}" in the plate`);
    }
    expect(missing, 'The design system carries the slot (see scripts/slot-contract.mjs); a plate must show the component or part it claims').toEqual([]);
  });
});
