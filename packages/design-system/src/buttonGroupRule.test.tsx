import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlertDialog } from './components/AlertDialog';
import { BUTTON_COLOUR_ROLE, findHueCollisions } from './components/buttonHues';
import type { ButtonColourRole } from './components/buttonHues';
import { Button } from './components/Button';
import { Modal } from './components/Modal';

/**
 * D3's rule — a danger button never sits beside a button of the same hue —
 * run over every place the repo writes a group of buttons.
 *
 * ## What this scan is, and what it cannot see
 *
 * It is a **static text scan**, not a render. It reads the story files and the
 * five application samples, finds three kinds of region, and runs
 * `findHueCollisions` over the `<Button>` elements inside each:
 *
 *  - a `<ButtonGroup>...</ButtonGroup>` element;
 *  - a `footer={...}` JSX attribute, because `Modal` and `AlertDialog` render
 *    their footer as a ButtonGroup;
 *  - a `footer: ...` property, which is how a story passes it as an arg.
 *
 * Limits, stated so nobody reads a pass as more than it is:
 *
 *  - a `variant={expr}` it cannot resolve is read as *every string literal in
 *    the expression*, which over-reports rather than misses, but a variant
 *    computed from a variable is invisible;
 *  - a Button hidden behind another component (`<CopyButton />`) is not seen;
 *  - a hue set through `className` is not seen — and is what `check:tokens`
 *    is for;
 *  - it checks the text of the files, not the rendered tree, so a group that
 *    only exists after state changes is read as written.
 *
 * The default footers of `Modal` and `AlertDialog` carry no `footer` text, so
 * they are rendered for real at the bottom of this file.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STORIES = path.join(HERE, 'stories');
const EXAMPLES = path.resolve(HERE, '../../../apps/site/src/examples');
const SAMPLES = ['kanban', 'inbox', 'settings', 'calendar', 'editor'] as const;

/** A story whose group collides on purpose, to show the dev warning. */
const COLLISION_EXAMPLE = 'Collision example';

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return /\.tsx$/.test(entry.name) ? [full] : [];
  });
}

/** The index just past the bracket that closes the one at `open`. */
function closing(src: string, open: number): number {
  const pairs: Record<string, string> = { '{': '}', '(': ')', '[': ']' };
  const stack: string[] = [];
  for (let i = open; i < src.length; i += 1) {
    const ch = src[i] as string;
    if (pairs[ch]) stack.push(pairs[ch] as string);
    else if (ch === stack[stack.length - 1]) {
      stack.pop();
      if (stack.length === 0) return i + 1;
    }
  }
  return src.length;
}

/** Each `<ButtonGroup ...>...</ButtonGroup>`, nesting-aware, as source text. */
function groupElements(src: string): string[] {
  const out: string[] = [];
  const open = /<ButtonGroup\b/g;
  let match: RegExpExecArray | null;
  while ((match = open.exec(src))) {
    let depth = 0;
    const tags = /<(\/?)ButtonGroup\b/g;
    tags.lastIndex = match.index;
    let tag: RegExpExecArray | null;
    while ((tag = tags.exec(src))) {
      depth += tag[1] ? -1 : 1;
      if (depth === 0) {
        const end = src.indexOf('>', tag.index) + 1;
        out.push(src.slice(match.index, end));
        break;
      }
    }
  }
  return out;
}

/** Each `footer={...}` attribute and `footer: ...` property, as source text. */
function footerRegions(src: string): string[] {
  const out: string[] = [];
  for (const match of src.matchAll(/\bfooter=\{/g)) {
    out.push(src.slice(match.index, closing(src, match.index + match[0].length - 1)));
  }
  for (const match of src.matchAll(/\bfooter:\s*(?=[(<{])/g)) {
    const start = match.index + match[0].length;
    out.push(src.slice(start, src[start] === '<' ? start + 4000 : closing(src, start)));
  }
  return out;
}

/** The colour roles of the `<Button>` elements in a region, in order. */
function rolesIn(region: string): ButtonColourRole[] {
  const roles: ButtonColourRole[] = [];
  const open = /<Button\b(?!Group)/g;
  let match: RegExpExecArray | null;
  while ((match = open.exec(region))) {
    // The opening tag ends at the first `>` outside braces.
    let depth = 0;
    let i = match.index + 7;
    for (; i < region.length; i += 1) {
      const ch = region[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') depth -= 1;
      else if (ch === '>' && depth === 0 && region[i - 1] !== '=') break;
    }
    const tag = region.slice(match.index, i + 1);
    const attr = /\bvariant=(?:"([^"]+)"|\{([^}]*)\})/.exec(tag);
    if (!attr) {
      roles.push(BUTTON_COLOUR_ROLE.quiet);
    } else if (attr[1]) {
      roles.push(roleOf(attr[1]));
    } else {
      // `variant={a ? 'x' : 'y'}`: every literal in it, since any might apply.
      for (const literal of (attr[2] ?? '').matchAll(/'([a-z]+)'/g)) roles.push(roleOf(literal[1] as string));
    }
  }
  return roles;
}

function roleOf(variant: string): ButtonColourRole {
  const role = (BUTTON_COLOUR_ROLE as Record<string, ButtonColourRole>)[variant];
  if (!role) throw new Error(`variant "${variant}" is not in BUTTON_COLOUR_ROLE`);
  return role;
}

interface Region {
  file: string;
  label: string;
  roles: ButtonColourRole[];
}

function regionsIn(file: string): Region[] {
  const src = readFileSync(file, 'utf8');
  const regions = [...groupElements(src), ...footerRegions(src)];
  return regions.map((text) => ({
    file: path.relative(HERE, file),
    label: /aria-label="([^"]*)"/.exec(text)?.[1] ?? '',
    roles: rolesIn(text),
  }));
}

describe('the danger hue rule over stories and samples', () => {
  const stories = walk(STORIES).flatMap(regionsIn);
  const samples = Object.fromEntries(
    SAMPLES.map((name) => [name, walk(path.join(EXAMPLES, name)).flatMap(regionsIn)]),
  );

  it('finds the button groups it is meant to scan', () => {
    // A scanner that finds nothing passes everything.
    expect(stories.length).toBeGreaterThanOrEqual(5);
    for (const name of SAMPLES) {
      expect(samples[name]?.length, `${name} sample has no ButtonGroup or footer`).toBeGreaterThanOrEqual(1);
    }
  });

  it('finds no collision in any story, except the deliberate example', () => {
    const bad = stories
      .filter((r) => r.label !== COLLISION_EXAMPLE)
      .filter((r) => findHueCollisions(r.roles).length > 0)
      .map((r) => `${r.file} ${r.label}`);
    expect(bad).toEqual([]);
  });

  it('keeps the deliberate collision example colliding, so its caption stays true', () => {
    const example = stories.find((r) => r.label === COLLISION_EXAMPLE);
    expect(example).toBeDefined();
    expect(findHueCollisions(example?.roles ?? []).length).toBe(2);
  });

  it.each(SAMPLES)('finds no collision in the %s sample', (name) => {
    const bad = (samples[name] ?? [])
      .filter((r) => findHueCollisions(r.roles).length > 0)
      .map((r) => `${r.file} ${r.label}`);
    expect(bad).toEqual([]);
  });
});

describe('the default footers', () => {
  afterEach(() => vi.restoreAllMocks());

  it('Modal and AlertDialog footers are groups and raise no warning by default', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <>
        <Modal isOpen onClose={() => {}} title="Modal">
          body
        </Modal>
        <AlertDialog isOpen onClose={() => {}} onConfirm={() => {}} title="Delete">
          body
        </AlertDialog>
      </>,
    );
    expect(document.querySelectorAll('[role="group"]').length).toBe(2);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns when a caller-supplied footer pairs danger with a same-hue button', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <Modal
        isOpen
        onClose={() => {}}
        title="Delete"
        footer={
          <>
            <Button variant="tertiary">KEEP</Button>
            <Button variant="danger">DELETE</Button>
          </>
        }
      >
        body
      </Modal>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
