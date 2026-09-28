import type { ComponentPageDef } from '../types';

export const dataTable: ComponentPageDef = {
  slug: 'data-table',
  name: 'DataTable',
  lede:
    'A data table built on `@tanstack/react-table`. It adds the semantics TanStack leaves out: `scope` on every header, `aria-sort` on the sorted column, a real button for each sortable header, a `<caption>`, and a true row count when the body is windowed.',
  props: ['DataTable'],
  keywords: 'table grid rows columns sort sorting pagination paging virtual virtualize tanstack caption',
  examples: [
    {
      id: 'basic',
      title: 'Basic usage',
      description:
        'Pass `data` and `columns`. An `accessor` can be a field name. `rowHeader` renders that column\'s cells as `<th scope="row">`, so a screen reader names each row by its service as it moves across. `caption` gives the table its accessible name.',
      file: 'data-table/basic.tsx',
      wide: true,
    },
    {
      id: 'rendered-cells',
      title: 'Rendered cells and sorting',
      description:
        'An `accessor` can also be a function that returns any node. Sorting is on by default, and `sortValue` makes a column sort on the underlying value instead of the rendered badge or formatted date. Set `enableSorting: false` to opt a column out. Click a header, or Tab to it and press Enter.',
      file: 'data-table/rendered-cells.tsx',
      wide: true,
    },
    {
      id: 'pagination',
      title: 'Pagination',
      description:
        '`pageSize` attaches a `Pagination` control under the table. The table still reports every row to assistive technology through `aria-rowcount` and `aria-rowindex`, so page 3 does not read as rows 1 to 8.',
      file: 'data-table/pagination.tsx',
      wide: true,
    },
    {
      id: 'virtualized',
      title: 'Virtualized rows',
      description:
        'For thousands of rows, `virtualize` renders only the rows that fit in a scroll box of fixed height. Row height is fixed rather than measured, so the render does not depend on font loading. The scroll box can be focused, so you can scroll it from the keyboard.',
      file: 'data-table/virtualized.tsx',
      wide: true,
    },
    {
      id: 'filtering',
      title: 'Filtering and the empty state',
      description:
        'Filtering belongs to the caller: filter `data` before passing it in. When nothing matches, `emptyText` fills the body. That keeps the header row, so a reader can still see which columns they searched.',
      file: 'data-table/filtering.tsx',
      wide: true,
    },
  ],
  accessibility: {
    notes: [
      'Each sortable header holds a native `<button>` named by the column. What a press will do ("Sort ascending") is its description, so that text is not read before every cell.',
      'Only one header has `aria-sort` at a time, as ARIA 1.2 requires. Under a multi-column sort it is the primary key.',
      'The sort icons are decorative. The state they show is exposed through `aria-sort`, not through the icon.',
      'Choose a `rowHeader` column. Without one, a screen reader moving across a row hears values with nothing saying which row they belong to.',
      'Virtualized cells are clipped to `rowHeight`. Keep multi-line content out of a virtualized table, or give it a taller fixed row.',
    ],
    keyboard: [
      ['Tab', 'Moves through the sort buttons in the header, then the pagination controls.'],
      ['Enter / Space', 'Cycles the focused column through ascending, descending and unsorted.'],
      ['↑ / ↓', 'Scrolls a focused virtualized body.'],
    ],
  },
};
