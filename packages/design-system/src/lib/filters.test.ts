import { describe, expect, it } from 'vitest';
import { describeFilter, formatFilter, lookupField, matchFilters, parseFilter, tryParseFilter } from './filters';
import type { Filter } from './filters';

describe('parseFilter', () => {
  it('reads each operator, tolerating whitespace', () => {
    expect(parseFilter('service=checkout')).toEqual({ key: 'service', operator: '=', value: 'checkout' });
    expect(parseFilter('  status != 500 ')).toEqual({ key: 'status', operator: '!=', value: '500' });
    expect(parseFilter('msg~timeout')).toEqual({ key: 'msg', operator: '~', value: 'timeout' });
    expect(parseFilter('msg !~ health')).toEqual({ key: 'msg', operator: '!~', value: 'health' });
  });

  it('unquotes values and keeps their spaces', () => {
    expect(parseFilter('route="/v1/orders"')).toEqual({ key: 'route', operator: '=', value: '/v1/orders' });
    expect(parseFilter('msg ~ " connection reset "')).toEqual({ key: 'msg', operator: '~', value: ' connection reset ' });
    expect(parseFilter('msg="say \\"hi\\""')).toEqual({ key: 'msg', operator: '=', value: 'say "hi"' });
    expect(parseFilter('attributes.http.route=/a=b')).toEqual({ key: 'attributes.http.route', operator: '=', value: '/a=b' });
  });

  it('treats plain or wholly quoted text as free text, and empty as nothing', () => {
    expect(parseFilter('connection reset')).toEqual({ key: '*', operator: '~', value: 'connection reset' });
    expect(parseFilter('"a=b"')).toEqual({ key: '*', operator: '~', value: 'a=b' });
    expect(parseFilter('   ')).toBeNull();
    expect(tryParseFilter('')).toBeNull();
  });

  it('rejects an operator with no key or no value, saying why', () => {
    expect(parseFilter('=value')).toBeNull();
    expect(tryParseFilter('=value')).toEqual({ ok: false, error: expect.stringContaining('field name before =') });
    expect(tryParseFilter('service=')).toEqual({ ok: false, error: expect.stringContaining('value after service=') });
    expect(tryParseFilter('http route = x')).toMatchObject({ ok: false });
  });
});

describe('formatFilter', () => {
  const cases: Filter[] = [
    { key: 'service', operator: '=', value: 'checkout' },
    { key: 'status', operator: '!=', value: '500' },
    { key: 'route', operator: '~', value: ' padded ' },
    { key: 'msg', operator: '!~', value: '"quoted"' },
    { key: 'msg', operator: '=', value: '' },
    { key: '*', operator: '~', value: 'timeout' },
    { key: '*', operator: '~', value: 'a=b' },
    { key: '*', operator: '!~', value: 'health' },
  ];

  it.each(cases)('round-trips %o', (filter) => {
    if (filter.value === '') {
      // An empty value formats, but is not something a person can type.
      expect(formatFilter(filter)).toBe('msg=""');
      return;
    }
    expect(parseFilter(formatFilter(filter))).toEqual(filter);
  });

  it('writes the compact form and the readable one', () => {
    expect(formatFilter({ key: 'service', operator: '=', value: 'checkout' })).toBe('service=checkout');
    expect(describeFilter({ key: 'service', operator: '=', value: 'checkout' })).toBe('service = checkout');
    expect(describeFilter({ key: '*', operator: '~', value: 'timeout' })).toBe('“timeout”');
  });
});

describe('matchFilters', () => {
  const span = {
    service: 'checkout',
    status: 500,
    msg: 'Upstream TIMEOUT after 3s',
    tags: ['retry', 'payments'],
    'attributes.http.route': '/v1/orders',
    attributes: { db: { system: 'postgres' } },
  };

  it('ANDs filters, and an empty list matches', () => {
    expect(matchFilters(span, [])).toBe(true);
    expect(matchFilters(span, [{ key: 'service', operator: '=', value: 'checkout' }, { key: 'status', operator: '=', value: '500' }])).toBe(true);
    expect(matchFilters(span, [{ key: 'service', operator: '=', value: 'checkout' }, { key: 'status', operator: '!=', value: '500' }])).toBe(false);
  });

  it('compares equality exactly and containment case-insensitively', () => {
    expect(matchFilters(span, [{ key: 'service', operator: '=', value: 'Checkout' }])).toBe(false);
    expect(matchFilters(span, [{ key: 'msg', operator: '~', value: 'timeout' }])).toBe(true);
    expect(matchFilters(span, [{ key: 'msg', operator: '!~', value: 'Timeout' }])).toBe(false);
  });

  it('treats a missing field as passing only the negative operators', () => {
    expect(matchFilters(span, [{ key: 'region', operator: '=', value: 'eu' }])).toBe(false);
    expect(matchFilters(span, [{ key: 'region', operator: '!=', value: 'eu' }])).toBe(true);
    expect(matchFilters(span, [{ key: 'region', operator: '!~', value: 'eu' }])).toBe(true);
  });

  it('matches array elements', () => {
    expect(matchFilters(span, [{ key: 'tags', operator: '=', value: 'retry' }])).toBe(true);
    expect(matchFilters(span, [{ key: 'tags', operator: '!=', value: 'retry' }])).toBe(false);
  });

  it('looks up a flat dotted key first, then a path', () => {
    expect(lookupField(span, 'attributes.http.route')).toBe('/v1/orders');
    expect(lookupField(span, 'attributes.db.system')).toBe('postgres');
    expect(lookupField({ attributes: { 'http.route': '/x' } }, 'attributes.http.route')).toBe('/x');
    expect(matchFilters(span, [{ key: 'attributes.db.system', operator: '=', value: 'postgres' }])).toBe(true);
  });

  it('searches every value, nested included, for free text', () => {
    expect(matchFilters(span, [{ key: '*', operator: '~', value: 'POSTGRES' }])).toBe(true);
    expect(matchFilters(span, [{ key: '*', operator: '~', value: '500' }])).toBe(true);
    expect(matchFilters(span, [{ key: '*', operator: '~', value: 'redis' }])).toBe(false);
    expect(matchFilters(span, [{ key: '*', operator: '!~', value: 'redis' }])).toBe(true);
  });
});
