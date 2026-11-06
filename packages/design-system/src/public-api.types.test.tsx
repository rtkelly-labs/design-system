import type { ComponentProps, ForwardRefExoticComponent, ReactElement, RefAttributes } from 'react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  Button,
  FILTER_OPERATORS,
  FilterBar,
  Menu,
  MenuItem,
  Select,
  formatFilter,
  parseFilter,
  tryParseFilter,
  type Filter,
  type FilterBarProps,
  type FilterOperator,
  type FilterParseResult,
  type MenuProps,
} from './index';

/**
 * The public type surface, asserted where a consumer meets it: the root entry.
 *
 * `api/index.d.ts` records what the surface *is*; these say what it must keep
 * *meaning*. A diff to the report can be read and approved; an assertion here
 * fails until someone decides the contract changed. Each one is a promise a
 * consumer could build on — a required prop, a closed union, a ref type — and
 * the `@ts-expect-error` lines are the half a text diff cannot express: code
 * that must keep failing to compile.
 *
 * They are checked by `pnpm typecheck`, which already covers `src/**`, not by
 * Vitest: `expectTypeOf` is a no-op at run time. The one `it` below exists so
 * the file is a valid test file and the runtime values stay honest too.
 */

describe('public type surface', () => {
  it('keeps the filter grammar a closed set of four operators', () => {
    expectTypeOf<FilterOperator>().toEqualTypeOf<'=' | '!=' | '~' | '!~'>();
    expectTypeOf(FILTER_OPERATORS).toEqualTypeOf<readonly FilterOperator[]>();
    expectTypeOf<Filter>().toEqualTypeOf<{ key: string; operator: FilterOperator; value: string }>();
    expect([...FILTER_OPERATORS].sort()).toEqual(['!=', '!~', '=', '~']);
  });

  it('types the parser as fallible, and the formatter as total', () => {
    expectTypeOf(tryParseFilter).returns.toEqualTypeOf<FilterParseResult | null>();
    expectTypeOf(parseFilter).returns.toEqualTypeOf<Filter | null>();
    expectTypeOf(formatFilter).parameter(0).toEqualTypeOf<Filter>();
    expectTypeOf(formatFilter).returns.toBeString();

    // The discriminant narrows: a consumer can reach `filter` only after `ok`.
    const result = tryParseFilter('status=open');
    if (result?.ok) expectTypeOf(result.filter).toEqualTypeOf<Filter>();
    if (result && !result.ok) expectTypeOf(result.error).toBeString();
  });

  it('hands FilterBar change handlers a mutable copy and accepts readonly input', () => {
    expectTypeOf<FilterBarProps['onFiltersChange']>().toEqualTypeOf<((filters: Filter[]) => void) | undefined>();
    expectTypeOf<readonly Filter[]>().toExtend<NonNullable<FilterBarProps['filters']>>();
    expectTypeOf(FilterBar).toEqualTypeOf<ForwardRefExoticComponent<FilterBarProps & RefAttributes<HTMLDivElement>>>();
  });

  it('requires a Menu trigger and closes MenuItem intent to one value', () => {
    expectTypeOf<MenuProps['trigger']>().toEqualTypeOf<ReactElement>();
    expectTypeOf<ComponentProps<typeof MenuItem>['intent']>().toEqualTypeOf<'danger' | undefined>();

    // @ts-expect-error — a menu with nothing to open it is not a menu.
    void (<Menu>{null}</Menu>);
    // @ts-expect-error — intent is a closed union; 'warning' is not in it.
    void (<MenuItem intent="warning">x</MenuItem>);
  });

  it('keeps Button a link or a button, never both', () => {
    void (<Button href="/docs">Docs</Button>);
    void (<Button pending>Save</Button>);
    // @ts-expect-error — `pending` is a button state; a link cannot be pending.
    void (<Button href="/docs" pending>Docs</Button>);
  });

  it('types Select values as strings end to end', () => {
    expectTypeOf<ComponentProps<typeof Select>['onValueChange']>().toEqualTypeOf<((value: string) => void) | undefined>();
    // @ts-expect-error — options are required; a select with none cannot be built.
    void (<Select label="Region" />);
  });
});
