import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { userEvent, within } from 'storybook/test';
import { FilterBar } from '../components/FilterBar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { matchFilters } from '../lib/filters';
import type { Filter } from '../lib/filters';

const meta: Meta<typeof FilterBar> = {
  title: 'Components/Data/FilterBar',
  component: FilterBar,
  tags: ['autodocs', 'preview'],
  parameters: {
    docs: {
      description: {
        component:
          'A query bar for log, span and event lists. Each condition is a chip — `key op value` with `=`, `!=`, `~` (contains) or `!~` — and one input adds more: type `service=checkout` and press Enter, or plain text to search every field. Backspace in the empty input removes the last chip, Escape clears the input, and pressing a chip puts it back for editing. Suggestions are a native `<datalist>`. `parseFilter`, `formatFilter` and `matchFilters` from `lib/filters` are the same grammar as data.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof FilterBar>;

const threeFilters: Filter[] = [
  { key: 'service', operator: '=', value: 'checkout' },
  { key: 'status', operator: '!=', value: '200' },
  { key: 'msg', operator: '~', value: 'timeout' },
];

/** Three conditions and a count: the static baseline. */
export const Default: Story = {
  args: { defaultFilters: threeFilters, summary: '42 of 1,204 spans' },
  parameters: { docs: { description: { story: 'An equality, a negation and a substring match, ANDed. The summary sits at the right; `Clear all` appears once any filter exists.' } } },
};

/** Fields with known values become suggestions while typing. */
export const WithSuggestions: Story = {
  args: {
    fields: [
      { key: 'service', label: 'Service', values: ['checkout', 'cart', 'payments', 'postgres'] },
      { key: 'status', label: 'HTTP status', values: ['200', '404', '500', '503'] },
      { key: 'attributes.http.route', label: 'Route', values: ['/v1/orders', '/v1/cart'] },
    ],
    placeholder: 'Try service= …',
  },
  parameters: { docs: { description: { story: 'Focus the input and type: the browser offers `service=`, `status=` and every `key=value` pair from `fields`. The list is platform-owned, so its keyboard and announcements are the browser’s.' } } },
};

interface SeedSpan extends Record<string, unknown> {
  id: string;
  service: string;
  name: string;
  status: number;
  duration: number;
}

const spans: SeedSpan[] = [
  { id: 'a1', service: 'web', name: 'GET /checkout', status: 200, duration: 412 },
  { id: 'b2', service: 'cart', name: 'cart.load', status: 200, duration: 138 },
  { id: 'c3', service: 'postgres', name: 'SELECT cart_items', status: 200, duration: 96 },
  { id: 'd4', service: 'payments', name: 'payment.authorize timeout', status: 504, duration: 3002 },
  { id: 'e5', service: 'payments', name: 'payment.authorize retry', status: 200, duration: 230 },
  { id: 'f6', service: 'checkout', name: 'order.create', status: 500, duration: 61 },
  { id: 'g7', service: 'checkout', name: 'order.notify', status: 200, duration: 18 },
];

function FilteredSpans() {
  const [filters, setFilters] = useState<Filter[]>([{ key: 'service', operator: '=', value: 'payments' }]);
  const rows = spans.filter((span) => matchFilters(span, filters));
  return (
    <div className="flex flex-col gap-3">
      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        label="Filter spans"
        fields={[
          { key: 'service', values: Array.from(new Set(spans.map((span) => span.service))) },
          { key: 'status', values: ['200', '500', '504'] },
          { key: 'name' },
        ]}
        summary={`${rows.length} of ${spans.length} spans`}
      />
      <Table label="Spans" density="compact">
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Span</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((span) => (
            <TableRow key={span.id}>
              <TableCell>{span.service}</TableCell>
              <TableCell>{span.name}</TableCell>
              <TableCell>{span.status}</TableCell>
              <TableCell>{span.duration}ms</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Controlled, filtering a seeded span table with `matchFilters`. */
export const Interactive: Story = {
  render: () => <FilteredSpans />,
  parameters: { docs: { description: { story: 'Add `status!=200` or the free text `timeout` and the table narrows; remove a chip and it widens again. The count in the summary is computed from the same `matchFilters` call.' } } },
};

/** An expression with no field name stays in the input, with a message. */
export const Invalid: Story = {
  args: { defaultFilters: [threeFilters[0]!] },
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByLabelText('Filter');
    await userEvent.type(input, '=value{Enter}');
  },
  parameters: { docs: { description: { story: '`=value` has an operator and nothing before it. The bar turns to the danger role, the text stays for correcting, and the message is joined to the input’s `aria-describedby`. The story types `=value` and presses Enter on load.' } } },
};
