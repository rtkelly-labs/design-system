import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../components/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';

const meta: Meta<typeof Badge> = {
  title: 'Components/Content/Badge',
  component: Badge,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Badge>;

/**
 * The badge at its default accent — the shape and weight before any role is
 * chosen.
 */
export const Default: Story = {
  args: { children: 'ACTIVE' },
};

/** Emphasis tokens: hierarchy, not meaning — which pill should catch the eye. */
export const Emphasis: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <Badge accent="primary">PRIMARY</Badge>
      <Badge accent="secondary">SECONDARY</Badge>
      <Badge accent="tertiary">TERTIARY</Badge>
      <Badge accent="quiet">QUIET</Badge>
    </div>
  ),
};

/** Intent tokens: communicated meaning. Reach for these when the state matters. */
export const Intent: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      <Badge accent="info">SYNCING</Badge>
      <Badge accent="success">HEALTHY</Badge>
      <Badge accent="warning">DEGRADED</Badge>
      <Badge accent="danger">FAILED</Badge>
    </div>
  ),
};

/**
 * `size="sm"` for a badge inside a dense row — a table cell or list item. A 1px
 * border, tighter padding and smaller type, beside the default for comparison.
 */
export const Small: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge accent="success" size="sm">OPEN</Badge>
      <Badge accent="quiet" size="sm">BUG</Badge>
      <Badge accent="success">OPEN</Badge>
    </div>
  ),
};

/**
 * `appearance="hairline"` (D11): a 1px `border.subtle` outline, no fill,
 * `text.secondary`, the small size, the label as written. Colour no longer
 * carries identity, the word does. An intent badge keeps its icon under the
 * `patterns` colour-vision preference, so danger and success still differ by
 * more than hue.
 */
export const Hairline: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge appearance="hairline" accent="success">Healthy</Badge>
      <Badge appearance="hairline" accent="warning">Degraded</Badge>
      <Badge appearance="hairline" accent="danger">Failed</Badge>
      <Badge appearance="hairline" accent="quiet">bug</Badge>
    </div>
  ),
};

/**
 * Inside a `Table` or `DataTable` a badge is hairline without being asked;
 * outside one it keeps the filled look. A single badge opts out with
 * `appearance="default"`, a whole table with `labelAppearance="default"`.
 */
export const InATableAndOutside: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Badge accent="success">Healthy</Badge>
        <Badge accent="danger">Failed</Badge>
      </div>
      <Table label="Clusters" appearance="quiet" density="compact">
        <TableHeader>
          <TableRow>
            <TableHead>Cluster</TableHead>
            <TableHead>Health</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>us-east-edge-1</TableCell>
            <TableCell><Badge accent="success">Healthy</Badge></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>eu-west-edge-2</TableCell>
            <TableCell><Badge accent="danger">Failed</Badge></TableCell>
          </TableRow>
          <TableRow>
            <TableCell>ap-south-edge-3</TableCell>
            <TableCell><Badge accent="danger" appearance="default">Failed</Badge></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  ),
};
