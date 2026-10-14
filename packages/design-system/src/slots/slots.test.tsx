/**
 * The `data-slot` contract, runtime half (see scripts/slot-contract.mjs for the rule and the source
 * half, `pnpm check:slots`).
 *
 * Enumeration is derived: `analyse()` classifies every export from the running module, so a new
 * standalone component or part is held to the contract the moment it exists. Each is rendered through
 * its stories (a part through its parent's) or a fixture, and the markup must carry the component's
 * slot. `api/slots.txt` is the committed inventory of every slot observed, so adding, renaming or
 * removing one is a reviewable diff; `pnpm slots:update` rewrites it.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';
import { ThemeProvider } from '../components/ThemeProvider';
import { ALIASES, KEBAB, expectedSlot, kebab } from '../../scripts/slot-contract.mjs';
import { analyse, type Analysis, type ExportInfo } from './exports';
import { FIXTURES } from './fixtures';
import { renderStory, slotsIn, storyNames } from './render';

const INVENTORY = path.resolve(__dirname, '../../api/slots.txt');

/**
 * Exports whose elements cannot be observed in a static render. A ratchet: each one is still covered
 * by `pnpm check:slots`, and an entry whose component now renders slots fails, so it comes off.
 */
const PORTAL = 'Renders through a Base UI Portal, which mounts on the client only: a static render emits the trigger and nothing else.';
const OPAQUE: Record<string, string> = {
  AlertDialog: PORTAL,
  Drawer: PORTAL,
  Modal: PORTAL,
  Popover: PORTAL,
  Tooltip: PORTAL,
  Menu: PORTAL,
  MenuItem: PORTAL,
  MenuRadioGroup: PORTAL,
  MenuRadioItem: PORTAL,
  MenuSeparator: PORTAL,
};

let analysis: Analysis;
/** name -> every slot its stories / fixture put in the markup. */
const observed = new Map<string, Set<string>>();
/** name -> markup rendered at all. */
const rendered = new Map<string, number>();
const subjects = (): ExportInfo[] => analysis.exports.filter((e) => e.class === 'component' || e.class === 'part');

beforeAll(async () => {
  analysis = await analyse();
  for (const e of subjects()) {
    const owner = e.class === 'part' ? e.parent! : e.name;
    const slots = new Set<string>();
    let count = 0;
    for (const mod of analysis.storyModules.get(owner) ?? []) {
      for (const name of storyNames(mod)) {
        const markup = renderStory(mod, name);
        if (markup) {
          count++;
          slotsIn(markup).forEach((s) => slots.add(s));
        }
      }
    }
    const fixture = FIXTURES[e.name] ?? (e.parent ? FIXTURES[e.parent] : undefined);
    if (fixture) {
      count++;
      slotsIn(renderToStaticMarkup(createElement(ThemeProvider, null, fixture()))).forEach((s) => slots.add(s));
    }
    observed.set(e.name, slots);
    rendered.set(e.name, count);
  }
});

const carries = (name: string, slots: Set<string>) => {
  const alias = ALIASES[name];
  if (alias?.family) return [...slots].some((s) => s === alias.family || s.startsWith(`${alias.family}-`));
  return slots.has(expectedSlot(name));
};

describe('data-slot contract (runtime)', () => {
  it('every standalone component and part is observable, or declared opaque', () => {
    const unseen = subjects().filter((e) => (rendered.get(e.name) ?? 0) === 0 || observed.get(e.name)!.size === 0).filter((e) => ALIASES[e.name]?.kind !== 'data-carrier' && !(e.name in OPAQUE));
    expect(unseen.map((e) => e.name), 'No story or fixture puts these in the markup. Add a story, or a fixture in src/slots/fixtures.tsx (or, only if it cannot render statically, OPAQUE in slots.test.tsx with a reason). Then pnpm check:slots still covers it.').toEqual([]);
  });

  it('every rendered component carries its slot', () => {
    const missing = subjects()
      .filter((e) => (observed.get(e.name)?.size ?? 0) > 0 && ALIASES[e.name]?.kind !== 'data-carrier' && !(e.name in OPAQUE) && !carries(e.name, observed.get(e.name)!))
      .map((e) => `${e.name}: expected data-slot="${ALIASES[e.name]?.family ?? expectedSlot(e.name)}" in its markup (saw: ${[...observed.get(e.name)!].slice(0, 6).join(', ')})`);
    expect(missing, 'Add data-slot to the element the component renders; see scripts/slot-contract.mjs').toEqual([]);
  });

  it('every slot observed is kebab-case', () => {
    const bad = new Set<string>();
    for (const slots of observed.values()) for (const s of slots) if (!KEBAB.test(s)) bad.add(s);
    expect([...bad]).toEqual([]);
  });

  it('two different components never share a slot of their own', () => {
    const owner = new Map<string, string[]>();
    for (const e of subjects()) {
      const alias = ALIASES[e.name];
      if (alias && alias.kind !== 'legacy-name') continue; // delegates and shared frames share by design
      const slot = expectedSlot(e.name);
      owner.set(slot, [...(owner.get(slot) ?? []), e.name]);
    }
    const clashes = [...owner].filter(([, names]) => names.length > 1).map(([slot, names]) => `${slot}: ${names.join(', ')}`);
    expect(clashes, 'Rename one, or give it a documented ALIASES entry').toEqual([]);
  });

  it('OPAQUE and ALIASES hold no stale entries', () => {
    const staleOpaque = Object.keys(OPAQUE).filter((n) => carries(n, observed.get(n) ?? new Set()));
    expect(staleOpaque, 'now observable: remove from OPAQUE').toEqual([]);
    const names = new Set(analysis.exports.map((e) => e.name));
    const unknown = Object.keys(ALIASES).filter((n) => !names.has(n));
    expect(unknown, 'ALIASES names no export').toEqual([]);
  });

  it('api/slots.txt is the current slot inventory', () => {
    const families = subjects().map((e) => [e.name, ALIASES[e.name]?.family ?? ALIASES[e.name]?.slot ?? kebab(e.name)] as const);
    /** The component whose slot family this slot belongs to; `(shared)` for frame internals no component owns (`field-label`, `ascii-frame-rule`). */
    const ownerOf = (slot: string) => {
      const hit = families.filter(([, f]) => slot === f || slot.startsWith(`${f}-`)).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))[0];
      return hit ? hit[0] : '(shared)';
    };
    const lines = new Set<string>();
    for (const slots of observed.values()) for (const s of slots) lines.add(`${s}\t${ownerOf(s)}`);
    const text = `${[...lines].sort().join('\n')}\n`;
    if (process.env.UPDATE_SLOTS) {
      writeFileSync(INVENTORY, text);
      return;
    }
    let committed = '';
    try {
      committed = readFileSync(INVENTORY, 'utf8');
    } catch {
      // handled below
    }
    const now = new Set(text.split('\n'));
    const was = new Set(committed.split('\n'));
    const diff = [...[...now].filter((l) => !was.has(l)).map((l) => `+ ${l}`), ...[...was].filter((l) => !now.has(l)).map((l) => `- ${l}`)].slice(0, 12);
    expect(committed === text, `api/slots.txt is stale. A slot was added, renamed or removed: run \`pnpm slots:update\` and commit the diff, which is the review of a contract change.\n${diff.join('\n')}`).toBe(true);
  });
});
