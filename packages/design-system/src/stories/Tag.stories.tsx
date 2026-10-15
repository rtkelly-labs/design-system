import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from '../components/Tag';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';

const meta: Meta<typeof Tag> = {
  title: 'Components/Content/Tag',
  component: Tag,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: { text: 'typescript' },
};

/** With `href` the tag renders as an anchor rather than a span. */
export const AsLink: Story = {
  args: { text: 'design-systems', href: '#design-systems' },
};

export const CustomPrefix: Story = {
  args: { text: 'v0.1.3', prefix: '@', accent: 'info' },
};

export const Row: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Tag text="react" accent="primary" />
      <Tag text="storybook" accent="secondary" />
      <Tag text="tailwind" accent="tertiary" />
      <Tag text="archived" accent="quiet" />
    </div>
  ),
};

/**
 * `size="sm"` for a tag in a dense row, and `prefix` and `uppercase` as props:
 * `prefix=""` drops the `#`, `uppercase={false}` keeps the label's case. The
 * defaults are today's look. There is no `onRemove`: the sources disagree on
 * whether a tag may be interactive, so a removable chip is a separate component.
 */
export const SmallAndPlain: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Tag text="react" accent="primary" size="sm" />
      <Tag text="Needs review" accent="secondary" size="sm" prefix="" uppercase={false} />
      <Tag text="Needs review" accent="quiet" prefix="" uppercase={false} />
    </div>
  ),
};

/**
 * `appearance="hairline"` (D11): a 1px `border.subtle` outline, no fill,
 * `text.secondary`, the small size, the label as written and no `#`.
 */
export const Hairline: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Tag text="Needs review" appearance="hairline" />
      <Tag text="a11y" appearance="hairline" />
      <Tag text="Needs review" />
    </div>
  ),
};

/**
 * Tags in a `Table` are hairline by default; the same tags outside one, such as
 * on a card, keep today's look.
 */
export const InATableAndOutside: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Tag text="bug" accent="danger" size="sm" />
        <Tag text="a11y" accent="info" size="sm" />
      </div>
      <Table label="Issues" appearance="quiet" density="compact">
        <TableHeader>
          <TableRow>
            <TableHead>Issue</TableHead>
            <TableHead>Labels</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Focus ring clipped</TableCell>
            <TableCell>
              <Tag text="bug" accent="danger" />
              {' '}
              <Tag text="a11y" accent="info" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};
