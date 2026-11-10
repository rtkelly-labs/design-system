import { useRef } from 'react';
import type { MouseEvent } from 'react';
import { assertType, describe, expectTypeOf, it } from 'vitest';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  DataTable,
  LinkProvider,
  Modal,
  Pagination,
  Tabs,
  TabsTab,
  isThemeLevel,
  useTheme,
  useToast,
  type AccentToken,
  type ButtonVariant,
  type Column,
  type DataTableProps,
  type ThemeLevel,
} from '@rtkelly-labs/design-system';

/**
 * The public type surface as a consumer compiles it: through the package's own
 * name, so `exports` → `dist/index.d.ts` is what is checked, not `src/`.
 *
 * `src/public-api.types.test.tsx` asserts the same kind of promise against the
 * source, inside `pnpm typecheck`. This file exists because the two can differ:
 * tsup's declaration bundler rewrites types on the way out (it distributes
 * `ButtonProps` into four `Omit<…, "ref">` members, for one), and a promise
 * that holds in `src/` and not in `dist/` is broken for every consumer.
 *
 * Run by `pnpm test:types` (Vitest typecheck mode, `vitest.types.config.mts`)
 * after `pnpm build`. Nothing here runs: every assertion is a compile-time one,
 * and each `@ts-expect-error` is code that must keep failing to compile — an
 * unused one is itself an error.
 */

interface Host {
  name: string;
  region: 'eu' | 'us';
  p99: number;
}
const hosts: Host[] = [{ name: 'web-1', region: 'eu', p99: 120 }];

describe('variant props are closed unions', () => {
  it('names Button looks by job, and rejects anything else', () => {
    expectTypeOf<ButtonVariant>().toEqualTypeOf<
      'quiet' | 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'danger' | 'default'
    >();
    // @ts-expect-error — not a variant; a closed union is what makes a typo a compile error.
    assertType(<Button variant="ghost">Go</Button>);
  });

  it('addresses accents by role, never by hue (rule 3)', () => {
    expectTypeOf<'primary'>().toExtend<AccentToken>();
    // @ts-expect-error — a hue name is not a role.
    assertType(<Badge accent="cyan">x</Badge>);
  });
});

describe('required and optional props', () => {
  it('requires an accessible name on an icon-only Button, and only there', () => {
    assertType(<Button size="sm">Save</Button>);
    assertType(<Button size="icon" aria-label="Close">x</Button>);
    // @ts-expect-error — an icon button has no text for a screen reader to read.
    assertType(<Button size="icon">x</Button>);
  });

  it('requires what a Modal and a Pagination cannot work without', () => {
    // @ts-expect-error — no `onClose`: a modal nobody can dismiss.
    assertType(<Modal isOpen title="Delete">body</Modal>);
    // @ts-expect-error — no `currentPage`.
    assertType(<Pagination totalPages={3} />);
  });
});

describe('polymorphism: href picks the element', () => {
  it('types Button click events by the element it renders', () => {
    assertType(<Button onClick={(event) => expectTypeOf(event).toEqualTypeOf<MouseEvent<HTMLButtonElement>>()}>Go</Button>);
    assertType(
      <Button href="/docs" onClick={(event) => expectTypeOf(event).toEqualTypeOf<MouseEvent<HTMLAnchorElement>>()}>
        Docs
      </Button>,
    );
    // @ts-expect-error — `disabled` is a button attribute; an anchor has none to set.
    assertType(<Button href="/docs" disabled>Docs</Button>);
  });

  it('takes a router link whose props are a superset of an anchor, and rejects one that is not', () => {
    const RouterLink = (props: { href: string; prefetch?: boolean }) => <a {...props} />;
    assertType(<LinkProvider component={RouterLink}>{null}</LinkProvider>);
    const ToLink = (props: { to: string }) => <a href={props.to} />;
    // @ts-expect-error — `to` is not `href`; the provider passes `href`.
    assertType(<LinkProvider component={ToLink}>{null}</LinkProvider>);
  });
});

describe('refs land on the element rendered', () => {
  // The negative is a div ref on a button, not the other way round: DOM types
  // are structural, and HTMLInputElement satisfies HTMLDivElement (both have
  // `align`), so `<Card ref={inputRef}>` compiles. Only a ref whose element
  // lacks members the rendered one has can be rejected.
  it('types each forwarded ref, and rejects the wrong element', () => {
    function Refs() {
      const div = useRef<HTMLDivElement>(null);
      const button = useRef<HTMLButtonElement>(null);
      const span = useRef<HTMLSpanElement>(null);
      return (
        <>
          <Card ref={div} />
          <TabsTab ref={button} value="a">A</TabsTab>
          <Checkbox ref={span} label="Agree" />
          {/* @ts-expect-error — TabsTab renders a button; a div ref cannot hold one. */}
          <TabsTab ref={div} value="b">B</TabsTab>
        </>
      );
    }
    assertType(<Refs />);
  });
});

describe('event handlers carry values, not DOM events', () => {
  it('hands each control the value it changed to', () => {
    assertType(<Checkbox onCheckedChange={(checked) => expectTypeOf(checked).toBeBoolean()} />);
    assertType(<Tabs onValueChange={(value) => expectTypeOf(value).toBeString()}>{null}</Tabs>);
    assertType(<Pagination totalPages={3} currentPage={1} onPageChange={(page) => expectTypeOf(page).toBeNumber()} />);
    // @ts-expect-error — Checkbox has no DOM `onChange`; `onCheckedChange` is the one that fires.
    assertType(<Checkbox onChange={() => {}} />);
  });

  it('types the toast API and the theme context', () => {
    const toast = useToast();
    expectTypeOf(toast.show).parameter(0).toHaveProperty('intent').toEqualTypeOf<
      'info' | 'success' | 'warning' | 'danger' | undefined
    >();
    expectTypeOf(toast.show).returns.toBeString();
    expectTypeOf<ThemeLevel>().toEqualTypeOf<'midnight' | 'sketch'>();
    // @ts-expect-error — `dark` is a polarity, not a level.
    useTheme().setLevel('dark');
    const stored: unknown = 'sketch';
    if (isThemeLevel(stored)) expectTypeOf(stored).toEqualTypeOf<ThemeLevel>();
  });
});

describe('DataTable carries its row type through', () => {
  it('infers the row from `data` into every callback', () => {
    assertType(
      <DataTable
        data={hosts}
        columns={[{ header: 'Host', accessor: 'name', rowHeader: true }, { header: 'p99', accessor: (row) => row.p99 }]}
        keyExtractor={(row) => {
          expectTypeOf(row).toEqualTypeOf<Host>();
          return row.name;
        }}
        isRowSelectable={(row) => row.region === 'eu'}
        onSelectionChange={(keys) => expectTypeOf(keys).toEqualTypeOf<Set<string>>()}
      />,
    );
  });

  it('rejects a column that names no field of the row', () => {
    const columns: Column<Host>[] = [{ header: 'Host', accessor: 'name' }];
    assertType(<DataTable data={hosts} columns={columns} />);
    // @ts-expect-error — `hostname` is not a key of Host.
    assertType(<DataTable data={hosts} columns={[{ header: 'Host', accessor: 'hostname' }]} />);
  });

  it('types the declared props by the row, and keeps columns and data together', () => {
    expectTypeOf<NonNullable<DataTableProps<Host>['keyExtractor']>>().parameter(0).toEqualTypeOf<Host>();
    // @ts-expect-error — columns without data is half a table.
    assertType(<DataTable columns={columns()} />);
  });
});

function columns(): Column<Host>[] {
  return [];
}
