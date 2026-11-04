/**
 * Filter expressions for log, span and event lists — `service=checkout`,
 * `status != 500`, `msg~timeout` — parsed, formatted and matched as data.
 *
 * Pure: no React, no clock. `FilterBar` is the editor; this module is what a
 * page uses to apply the result to its records.
 */

/** `=` equals, `!=` does not equal, `~` contains, `!~` does not contain. */
export type FilterOperator = '=' | '!=' | '~' | '!~';

/**
 * One condition. Free text — a search across every value — is
 * `{ key: '*', operator: '~', value }`.
 */
export interface Filter {
  /** The field name; dots address nested values. `*` means any field. */
  key: string;
  operator: FilterOperator;
  value: string;
}

/** The key a free-text filter carries. */
export const FREE_TEXT_KEY = '*';

/** What `tryParseFilter` returns for non-empty text: a filter, or why there is none. */
export type FilterParseResult = { ok: true; filter: Filter } | { ok: false; error: string };

/** Every operator, longest first so `!=` is never read as `!` then `=`. */
export const FILTER_OPERATORS: readonly FilterOperator[] = ['!=', '!~', '=', '~'];

/** A word for each operator, for an accessible name or a hint. */
export const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
  '=': 'equals',
  '!=': 'does not equal',
  '~': 'contains',
  '!~': 'does not contain',
};

const WHOLE_QUOTED = /^"((?:[^"\\]|\\.)*)"$/;

function unquote(text: string): string {
  const match = WHOLE_QUOTED.exec(text);
  return match ? match[1]!.replace(/\\(.)/g, '$1') : text;
}

function quote(text: string): string {
  return `"${text.replace(/(["\\])/g, '\\$1')}"`;
}

/** The first operator in `text` and where it starts, or null. */
function findOperator(text: string): { index: number; operator: FilterOperator } | null {
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    // A quote before any operator means the text is not `key op value`.
    if (char === '"') return null;
    if (char === '!' && (text[index + 1] === '=' || text[index + 1] === '~')) {
      return { index, operator: `!${text[index + 1]}` as FilterOperator };
    }
    if (char === '=' || char === '~') return { index, operator: char };
  }
  return null;
}

/**
 * Parse one expression, saying why when it cannot be one. Returns null for
 * empty or whitespace-only text.
 *
 * - `key op value`, whitespace around the operator ignored: `status != 500`.
 * - A value in double quotes keeps its spaces and may hold `"` as `\"`:
 *   `route="/v1/orders"`.
 * - Text with no operator, or text wholly in quotes, is free text.
 * - An operator with nothing before it, or nothing after it, is an error.
 */
export function tryParseFilter(text: string): FilterParseResult | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (WHOLE_QUOTED.test(trimmed)) {
    return { ok: true, filter: { key: FREE_TEXT_KEY, operator: '~', value: unquote(trimmed) } };
  }
  const found = findOperator(trimmed);
  if (!found) return { ok: true, filter: { key: FREE_TEXT_KEY, operator: '~', value: trimmed } };
  const key = trimmed.slice(0, found.index).trim();
  const rawValue = trimmed.slice(found.index + found.operator.length).trim();
  if (!key) return { ok: false, error: `Add a field name before ${found.operator}, as in service${found.operator}checkout.` };
  if (/[\s!]/.test(key)) return { ok: false, error: `“${key}” is not a field name. Field names have no spaces; put text in quotes to search for it.` };
  const value = unquote(rawValue);
  if (!rawValue || (!value && !WHOLE_QUOTED.test(rawValue))) {
    return { ok: false, error: `Add a value after ${key}${found.operator}.` };
  }
  return { ok: true, filter: { key, operator: found.operator, value } };
}

/**
 * Parse one expression into a filter: `service=checkout`, `status != 500`,
 * `msg~timeout`, `route="/v1/orders"`; plain text becomes free text. Null for
 * empty text and for text that is not a valid expression — `tryParseFilter`
 * says why.
 */
export function parseFilter(text: string): Filter | null {
  const result = tryParseFilter(text);
  return result?.ok ? result.filter : null;
}

/** Whether a free-text value must be quoted to survive a round trip. */
function freeTextNeedsQuotes(value: string): boolean {
  return value === '' || value !== value.trim() || value.startsWith('"') || /[=~]/.test(value);
}

function valueNeedsQuotes(value: string): boolean {
  return value === '' || value !== value.trim() || value.startsWith('"');
}

/**
 * The expression a filter was written as — `service=checkout`, or the bare
 * text for free text. `parseFilter(formatFilter(f))` gives `f` back.
 */
export function formatFilter(filter: Filter): string {
  if (filter.key === FREE_TEXT_KEY && filter.operator === '~') {
    return freeTextNeedsQuotes(filter.value) ? quote(filter.value) : filter.value;
  }
  const value = valueNeedsQuotes(filter.value) ? quote(filter.value) : filter.value;
  return `${filter.key}${filter.operator}${value}`;
}

/**
 * A filter as a reader sees it: `service = checkout`, or `“timeout”` for
 * free text. Used for chip text and accessible names.
 */
export function describeFilter(filter: Filter): string {
  if (filter.key === FREE_TEXT_KEY && filter.operator === '~') return `“${filter.value}”`;
  return `${filter.key} ${filter.operator} ${filter.value}`;
}

/** Whether two filters say the same thing. */
export function sameFilter(a: Filter, b: Filter): boolean {
  return a.key === b.key && a.operator === b.operator && a.value === b.value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The value at `key`: the flat key first (`record['attributes.http.route']`),
 * then the dotted path (`record.attributes.http.route`). A segment may itself
 * contain dots, so each remainder is tried flat before descending.
 */
export function lookupField(record: Record<string, unknown>, key: string): unknown {
  if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
  const parts = key.split('.');
  for (let cut = 1; cut < parts.length; cut += 1) {
    const head = parts.slice(0, cut).join('.');
    const next = Object.prototype.hasOwnProperty.call(record, head) ? record[head] : undefined;
    if (isRecord(next)) {
      const found = lookupField(next, parts.slice(cut).join('.'));
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** The comparable strings a value holds: itself, or each element of an array. */
function scalars(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap(scalars);
  if (typeof value === 'string') return [value];
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return [String(value)];
  return [];
}

/** Every string, number and boolean anywhere inside a value. */
function everyScalar(value: unknown): string[] {
  if (isRecord(value)) return Object.values(value).flatMap(everyScalar);
  if (Array.isArray(value)) return value.flatMap(everyScalar);
  return scalars(value);
}

function matchOne(candidates: string[], filter: Filter): boolean {
  const needle = filter.value.toLowerCase();
  switch (filter.operator) {
    case '=':
      return candidates.some((candidate) => candidate === filter.value);
    case '!=':
      return !candidates.some((candidate) => candidate === filter.value);
    case '~':
      return candidates.some((candidate) => candidate.toLowerCase().includes(needle));
    case '!~':
      return !candidates.some((candidate) => candidate.toLowerCase().includes(needle));
  }
}

/**
 * Whether a record satisfies every filter (AND; no filters matches all).
 *
 * - `=` and `!=` compare exactly; `~` and `!~` are case-insensitive substring tests.
 * - Numbers and booleans compare by their string form, so `status=500` works.
 * - An array matches `=`/`~` when any element does; `!=`/`!~` when none does.
 * - A missing field never equals or contains anything, so it passes `!=` and `!~`.
 * - Key `*` searches every string, number and boolean in the record, nested included.
 */
export function matchFilters(record: Record<string, unknown>, filters: readonly Filter[]): boolean {
  return filters.every((filter) => {
    const candidates = filter.key === FREE_TEXT_KEY ? everyScalar(record) : scalars(lookupField(record, filter.key));
    return matchOne(candidates, filter);
  });
}
