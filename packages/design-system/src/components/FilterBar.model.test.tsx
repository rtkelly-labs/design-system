import { fireEvent, render } from '@testing-library/react';
import fc from 'fast-check';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { FILTER_OPERATORS, FREE_TEXT_KEY, formatFilter, parseFilter, tryParseFilter } from '../lib/filters';
import type { Filter } from '../lib/filters';
import { FilterBar } from './FilterBar';

/**
 * FilterBar against a model of itself, driven by generated command sequences.
 *
 * The example tests in `FilterBar.test.tsx` each walk one path a person thought
 * of. This walks paths nobody chose: fast-check generates a sequence of user
 * actions (type, Enter, Escape, Backspace, edit a chip, remove a chip, clear),
 * applies each to the rendered component through Testing Library and to a
 * plain-data model, and after every step checks that the DOM says what the
 * model says. A failure shrinks to the shortest sequence that still fails and
 * prints it, so it reads as a reproduction rather than a seed.
 *
 * The model is the specification written once, small enough to read in one
 * screen: a list, the input text, the chip being edited, and the error. The
 * parser is its oracle (`tryParseFilter`), because the parser has its own
 * tests and the subject here is the state machine that calls it. Equality and
 * the chip label are restated here rather than imported: a model that borrows
 * `sameFilter` from the module under test agrees with any bug in it.
 *
 * Two command mixes run, both against the same model:
 *
 * - **uniform** — every command available at every step.
 * - **swarm** — each run draws a random subset of the commands and uses only
 *   those. A run without Escape or Clear builds the long lists and deep edit
 *   states that a uniform mix keeps resetting before they get interesting.
 *
 * Each mix runs uncontrolled, controlled by a parent that accepts every
 * change, and controlled by a parent that accepts none: the last is where
 * `commit` and the edit index can disagree with what is on screen.
 *
 * `FC_NUM_RUNS` sets the number of sequences per property; the default keeps
 * this file to a few seconds in the unit job, and the experiments workflow
 * runs it far longer.
 */

const NUM_RUNS = Number(process.env.FC_NUM_RUNS ?? 30);
// About 5ms per sequence on a CI runner; the floor is the vitest default.
const TIMEOUT = Math.max(5_000, NUM_RUNS * 25);

type Mode = 'uncontrolled' | 'controlled' | 'frozen';

interface Model {
  filters: Filter[];
  text: string;
  editing: number | null;
  error: string | null;
  commits: Filter[][];
  readonly mode: Mode;
}

interface Real {
  container: HTMLElement;
  onFiltersChange: Mock<(filters: Filter[]) => void>;
}

const same = (a: Filter, b: Filter) => a.key === b.key && a.operator === b.operator && a.value === b.value;
const label = (f: Filter) => (f.key === FREE_TEXT_KEY && f.operator === '~' ? `“${f.value}”` : `${f.key} ${f.operator} ${f.value}`);

// ---------------------------------------------------------------------------
// The model's transitions — what FilterBar should do, stated as data.
// ---------------------------------------------------------------------------

function commit(m: Model, next: Filter[]) {
  if (m.mode !== 'frozen') m.filters = next;
  m.commits.push(next);
}

function reset(m: Model) {
  m.text = '';
  m.error = null;
  m.editing = null;
}

function submit(m: Model) {
  const result = tryParseFilter(m.text);
  if (!result) return reset(m);
  if (!result.ok) {
    m.error = result.error;
    return;
  }
  const index = m.editing !== null && m.editing < m.filters.length ? m.editing : null;
  const rest = index === null ? m.filters : m.filters.filter((_, at) => at !== index);
  if (!rest.some((existing) => same(existing, result.filter))) {
    const next = [...m.filters];
    if (index === null) next.push(result.filter);
    else next[index] = result.filter;
    commit(m, next);
  } else if (index !== null) {
    commit(m, rest.slice());
  }
  reset(m);
}

// ---------------------------------------------------------------------------
// Reading the real component back.
// ---------------------------------------------------------------------------

const inputOf = (r: Real) => r.container.querySelector<HTMLInputElement>('[data-slot="filter-bar-input"]')!;
const chipsOf = (r: Real) => Array.from(r.container.querySelectorAll<HTMLLIElement>('[data-slot="filter-bar-chip"]'));
const editButton = (chip: HTMLLIElement) => chip.querySelectorAll('button')[0]!;
const removeButton = (chip: HTMLLIElement) => chip.querySelectorAll('button')[1]!;
const clearButton = (r: Real) =>
  Array.from(r.container.querySelectorAll('button')).find((button) => button.textContent === 'Clear all');

function agree(m: Model, r: Real) {
  const chips = chipsOf(r);
  expect(chips.map((chip) => editButton(chip).getAttribute('aria-label'))).toEqual(
    m.filters.map((filter) => `Edit filter ${label(filter)}`),
  );
  expect(chips.map((chip) => editButton(chip).getAttribute('aria-pressed'))).toEqual(
    m.filters.map((_, index) => String(m.editing === index)),
  );
  const input = inputOf(r);
  expect(input.value).toBe(m.text);
  expect(input.getAttribute('aria-invalid')).toBe(m.error ? 'true' : null);
  const message = r.container.querySelector('[data-slot="filter-bar-error"]');
  expect(message?.textContent ?? null).toBe(m.error);
  if (m.error) expect(input.getAttribute('aria-describedby')).toBe(message!.id);
  expect(Boolean(clearButton(r))).toBe(m.filters.length > 0);
  expect(r.onFiltersChange.mock.calls.map(([filters]) => filters)).toEqual(m.commits);
}

// ---------------------------------------------------------------------------
// Commands.
// ---------------------------------------------------------------------------

class Type implements fc.Command<Model, Real> {
  constructor(readonly text: string) {}
  check = () => true;
  run(m: Model, r: Real) {
    // React reports a change only when the value differs, so typing what is
    // already there neither updates the text nor clears an error.
    if (this.text !== m.text) {
      m.text = this.text;
      m.error = null;
    }
    fireEvent.change(inputOf(r), { target: { value: this.text } });
    agree(m, r);
  }
  toString = () => `type(${JSON.stringify(this.text)})`;
}

class Press implements fc.Command<Model, Real> {
  constructor(readonly key: 'Enter' | 'Escape' | 'Backspace') {}
  check = () => true;
  run(m: Model, r: Real) {
    if (this.key === 'Enter') submit(m);
    else if (this.key === 'Escape') {
      if (m.text || m.editing !== null || m.error) reset(m);
    } else if (m.text === '' && m.filters.length > 0 && m.editing === null) {
      commit(m, m.filters.slice(0, -1));
    }
    fireEvent.keyDown(inputOf(r), { key: this.key });
    agree(m, r);
  }
  toString = () => `press(${this.key})`;
}

class TypeAndSubmit implements fc.Command<Model, Real> {
  private readonly steps: [Type, Press];
  constructor(readonly text: string) {
    this.steps = [new Type(text), new Press('Enter')];
  }
  check = () => true;
  run(m: Model, r: Real) {
    for (const step of this.steps) step.run(m, r);
  }
  toString = () => `submit(${JSON.stringify(this.text)})`;
}

class EditChip implements fc.Command<Model, Real> {
  constructor(readonly pick: number) {}
  check = (m: Readonly<Model>) => m.filters.length > 0;
  run(m: Model, r: Real) {
    const index = this.pick % m.filters.length;
    m.text = formatFilter(m.filters[index]!);
    m.error = null;
    m.editing = index;
    fireEvent.click(editButton(chipsOf(r)[index]!));
    agree(m, r);
  }
  toString = () => `edit(${this.pick})`;
}

class RemoveChip implements fc.Command<Model, Real> {
  constructor(readonly pick: number) {}
  check = (m: Readonly<Model>) => m.filters.length > 0;
  run(m: Model, r: Real) {
    const index = this.pick % m.filters.length;
    const editing = m.editing;
    commit(m, m.filters.filter((_, at) => at !== index));
    if (editing !== null) {
      if (editing === index) reset(m);
      else if (editing > index) m.editing = editing - 1;
    }
    fireEvent.click(removeButton(chipsOf(r)[index]!));
    agree(m, r);
  }
  toString = () => `remove(${this.pick})`;
}

class ClearAll implements fc.Command<Model, Real> {
  check = (m: Readonly<Model>) => m.filters.length > 0;
  run(m: Model, r: Real) {
    commit(m, []);
    reset(m);
    fireEvent.click(clearButton(r)!);
    agree(m, r);
  }
  toString = () => 'clearAll()';
}

// ---------------------------------------------------------------------------
// Inputs. A small vocabulary on purpose: duplicates, collisions and edits of
// an existing chip into another existing chip are where the logic branches.
// ---------------------------------------------------------------------------

const key = fc.constantFrom('service', 'status', 'env');
const value = fc.constantFrom('checkout', '500', 'prod', 'a b', '', ' x');
const filter: fc.Arbitrary<Filter> = fc.oneof(
  fc.record({ key, operator: fc.constantFrom(...FILTER_OPERATORS), value }),
  fc.record({ key: fc.constant(FREE_TEXT_KEY), operator: fc.constant('~' as const), value }),
);
const text = fc.oneof(
  { weight: 5, arbitrary: filter.map(formatFilter) },
  { weight: 2, arbitrary: fc.constantFrom('', '   ', '=x', 'a b=c', 'k=', 'k!=""', '"quoted"', 'timeout') },
  { weight: 2, arbitrary: fc.string({ maxLength: 8, unit: fc.constantFrom('k', 'v', ' ', '=', '!', '~', '"') }) },
);

const commands: fc.Arbitrary<fc.Command<Model, Real>>[] = [
  text.map((t) => new Type(t)),
  fc.constant(new Press('Enter')),
  fc.constant(new Press('Escape')),
  fc.constant(new Press('Backspace')),
  fc.nat(7).map((n) => new EditChip(n)),
  fc.nat(7).map((n) => new RemoveChip(n)),
  fc.constant(new ClearAll()),
];

// Typing then Enter is how anything gets added. As separate draws they rarely
// land in that order, so a paired command keeps the list long enough to edit.
commands.push(text.map((t) => new TypeAndSubmit(t)));

const uniform = fc.commands(commands, { maxCommands: 30 });
const swarm = fc
  .subarray(commands, { minLength: 1 })
  .chain((subset) => fc.commands(subset, { maxCommands: 30 }));

// ---------------------------------------------------------------------------
// Harness.
// ---------------------------------------------------------------------------

function Controlled({
  initial,
  frozen,
  onFiltersChange,
}: {
  initial: Filter[];
  frozen: boolean;
  onFiltersChange: (filters: Filter[]) => void;
}) {
  const [filters, setFilters] = useState(initial);
  return (
    <FilterBar
      filters={filters}
      onFiltersChange={(next) => {
        onFiltersChange(next);
        if (!frozen) setFilters(next);
      }}
    />
  );
}

function setup(mode: Mode, initial: Filter[]) {
  const onFiltersChange = vi.fn<(filters: Filter[]) => void>();
  const view =
    mode === 'uncontrolled' ? (
      <FilterBar defaultFilters={initial} onFiltersChange={onFiltersChange} />
    ) : (
      <Controlled initial={initial} frozen={mode === 'frozen'} onFiltersChange={onFiltersChange} />
    );
  const { container, unmount } = render(view);
  const model: Model = { filters: [...initial], text: '', editing: null, error: null, commits: [], mode };
  return { model, real: { container, onFiltersChange }, unmount };
}

// Initial lists are unique: the component never creates a duplicate, and a
// seeded one would only test the seed.
const initialFilters = fc.uniqueArray(filter, { maxLength: 4, comparator: same });

describe.each(['uncontrolled', 'controlled', 'frozen'] as const)('FilterBar model (%s)', (mode) => {
  it.each([
    ['uniform', uniform],
    ['swarm', swarm],
  ] as const)('agrees with the model under %s command mixes', (_, sequence) => {
    fc.assert(
      fc.property(initialFilters, sequence, (initial, cmds) => {
        const { model, real, unmount } = setup(mode, initial);
        try {
          fc.modelRun(() => ({ model, real }), cmds);
        } finally {
          unmount();
        }
      }),
      { numRuns: NUM_RUNS, verbose: true },
    );
  }, TIMEOUT);
});

describe('filter grammar', () => {
  // The law `filters.ts` states: whatever the formatter writes, the parser
  // reads back as the same filter — for any key the parser can produce.
  const parserKey = fc.string({
    minLength: 1,
    maxLength: 12,
    unit: fc.oneof(fc.constantFrom('a', 'z', '.', '_', '-', '9', '*', '\\'), fc.constantFrom('é', 'ß', '中')),
  });
  const anyValue = fc.oneof(
    fc.string({ maxLength: 12 }),
    fc.string({ maxLength: 12, unit: fc.constantFrom('a', ' ', '"', '\\', '=', '~', '!', '\t', '\n') }),
    fc.string({ maxLength: 8, unit: 'binary' }),
  );
  const anyFilter: fc.Arbitrary<Filter> = fc.oneof(
    fc.record({ key: parserKey, operator: fc.constantFrom(...FILTER_OPERATORS), value: anyValue }),
    fc.record({ key: fc.constant(FREE_TEXT_KEY), operator: fc.constant('~' as const), value: anyValue }),
  );

  it('parses what it formats', () => {
    fc.assert(
      fc.property(anyFilter, (f) => {
        expect(parseFilter(formatFilter(f))).toEqual(f);
      }),
      { numRuns: NUM_RUNS * 20 },
    );
  });
});
