import { describe, expect, it } from 'vitest';
import { describeFilter, matchFilters, tryParseFilter } from './filters';
import type { Filter } from './filters';

/**
 * Tests written against the mutants the rest of the suite let survive.
 *
 * Each `it` names the behaviour, not the mutant: the mutant only pointed at a
 * line nobody had asserted. Where the behaviour turned out to be a contract a
 * consumer relies on, the test stands on its own; where it is incidental, the
 * comment says so, so a reviewer can drop it without reading Stryker output.
 */

const f = (key: string, operator: Filter['operator'], value: string): Filter => ({ key, operator, value });

describe('matchFilters, by value type', () => {
  it('compares numbers, booleans and bigints by their string form', () => {
    expect(matchFilters({ status: 500 }, [f('status', '=', '500')])).toBe(true);
    expect(matchFilters({ cached: true }, [f('cached', '=', 'true')])).toBe(true);
    expect(matchFilters({ bytes: BigInt(10) }, [f('bytes', '=', '10')])).toBe(true);
  });

  it('never matches an object field by its string form', () => {
    // `[object Object]` is not a value anyone typed.
    expect(matchFilters({ meta: { region: 'eu' } }, [f('meta', '~', 'object')])).toBe(false);
  });

  it('treats a null or missing field as having no value, not an empty one', () => {
    expect(matchFilters({ owner: null }, [f('owner', '~', '')])).toBe(false);
    expect(matchFilters({ owner: null }, [f('*', '~', '')])).toBe(false);
    expect(matchFilters({}, [f('owner', '!=', 'ann')])).toBe(true);
  });

  it('negates equality', () => {
    expect(matchFilters({ env: 'prod' }, [f('env', '!=', 'prod')])).toBe(false);
    expect(matchFilters({ env: 'prod' }, [f('env', '!=', 'dev')])).toBe(true);
  });
});

describe('matchFilters, by key', () => {
  it('reads only the named field, not the rest of the record', () => {
    expect(matchFilters({ env: 'prod', team: 'dev' }, [f('env', '=', 'dev')])).toBe(false);
  });

  it('searches free text through nested records inside arrays', () => {
    expect(matchFilters({ tags: [{ name: 'checkout' }] }, [f('*', '~', 'checkout')])).toBe(true);
  });

  it('walks a dotted key through records only, never into a string', () => {
    expect(matchFilters({ name: 'abc' }, [f('name.length', '=', '3')])).toBe(false);
  });

  it('keeps looking when a shorter prefix leads nowhere', () => {
    // `a` exists but has no `b.c`; the literal field `a.b` does have `c`.
    const record = { a: {}, 'a.b': { c: 'found' } };
    expect(matchFilters(record, [f('a.b.c', '=', 'found')])).toBe(true);
  });
});

describe('tryParseFilter, edges', () => {
  it('rejects a key with an operator and no value', () => {
    expect(tryParseFilter('status=')).toEqual({ ok: false, error: 'Add a value after status=.' });
  });

  it('reads an operator inside quotes as text, not as an operator', () => {
    expect(tryParseFilter('say "a=b"')).toEqual({ ok: true, filter: f('*', '~', 'say "a=b"') });
  });

  it('reads a ! that is not followed by = or ~ as text', () => {
    expect(tryParseFilter('wow!')).toEqual({ ok: true, filter: f('*', '~', 'wow!') });
    expect(tryParseFilter('a!b')).toEqual({ ok: true, filter: f('*', '~', 'a!b') });
  });
});

describe('describeFilter', () => {
  it('quotes free text and spells out a field comparison', () => {
    expect(describeFilter(f('*', '~', 'timeout'))).toBe('“timeout”');
    expect(describeFilter(f('*', '=', 'timeout'))).toBe('* = timeout');
    expect(describeFilter(f('env', '~', 'pro'))).toBe('env ~ pro');
  });
});
