import type { Meta, StoryObj } from '@storybook/react-vite';
import { IdChip } from '../components/IdChip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';

const traceId = '4bf92f3577b34da6a3ce929d0e0e4736';

const meta: Meta<typeof IdChip> = {
  title: 'Components/Data/IdChip',
  component: IdChip,
  tags: ['autodocs', 'preview'],
  parameters: {
    docs: {
      description: {
        component:
          'A compact monospace identifier — trace, span or request id — for table cells and log rows. It shows the first eight characters and `…`; the full value is the accessible name and the tooltip, and the copy button copies it with `Copied` feedback. With `href` the id links to its page while the copy button stays a separate control.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof IdChip>;

/** A trace id with its kind label and copy button. */
export const Trace: Story = {
  args: { value: traceId, label: 'trace' },
  parameters: { docs: { description: { story: 'The default eight characters. Hover for the full id; the copy button copies all 32 characters, not the eight shown.' } } },
};

/** The id links to its trace page; copying does not navigate. */
export const Linked: Story = {
  args: { value: traceId, label: 'trace', href: `/traces/${traceId}` },
  parameters: { docs: { description: { story: 'With `href` the id is a link through `LinkProvider`, so an app’s router handles it. The copy button sits beside it, never inside it.' } } },
};

const rows = [
  { trace: '4bf92f3577b34da6a3ce929d0e0e4736', span: '00f067aa0ba902b7', request: 'req_8f2c1d9e7a', name: 'GET /checkout' },
  { trace: '7a3d0e1c55f24b8e9c61a0b2d3e4f5a6', span: '53995c3f42cd8ad8', request: 'req_1b7e44c0f2', name: 'cart.load' },
  { trace: 'e2c91f04b8d7463aa1f0c3d5e6b7a890', span: 'a8d1f0e3c2b4d5e6', request: 'req_c0ffee1234', name: 'payment.authorize' },
];

/** Several ids in a compact table: the shape it is sized for. */
export const InTable: Story = {
  render: () => (
    <Table label="Recent spans" density="compact">
      <TableHeader>
        <TableRow>
          <TableHead>Span</TableHead>
          <TableHead>Trace</TableHead>
          <TableHead>Span ID</TableHead>
          <TableHead>Request</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.span}>
            <TableCell>{row.name}</TableCell>
            <TableCell><IdChip value={row.trace} label="trace" href={`/traces/${row.trace}`} /></TableCell>
            <TableCell><IdChip value={row.span} label="span" truncate={6} /></TableCell>
            <TableCell><IdChip value={row.request} truncate={0} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
  parameters: { docs: { description: { story: 'Linked trace ids, span ids cut to six characters, and request ids shown whole with `truncate={0}`. Static: the baseline for the component.' } } },
};
