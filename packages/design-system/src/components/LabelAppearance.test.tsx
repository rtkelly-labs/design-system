import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './Badge';
import { Tag } from './Tag';
import { Table, TableBody, TableCell, TableRow } from './Table';

/** D11: labels in a table are hairline, and a caller can still say otherwise. */
const InTable = ({ children, labelAppearance }: { children: React.ReactNode; labelAppearance?: 'default' | 'hairline' }) => (
  <Table labelAppearance={labelAppearance}>
    <TableBody>
      <TableRow>
        <TableCell>{children}</TableCell>
      </TableRow>
    </TableBody>
  </Table>
);

describe('hairline Badge', () => {
  it('is a subtle outline with no fill, secondary text, the small size and the label as written', () => {
    render(<Badge accent="danger" appearance="hairline">Failing</Badge>);
    const el = screen.getByText('Failing');
    expect(el.dataset.appearance).toBe('hairline');
    expect(el.className).toContain('border-edge-subtle');
    expect(el.className).toContain('bg-transparent');
    expect(el.className).toContain('text-content-secondary');
    expect(el.className).toContain('text-[0.65rem]');
    expect(el.className).not.toContain('font-bold');
    expect(el.style.color).toBe('');
  });

  it('keeps the intent icon, so meaning is not carried by colour alone', () => {
    const { container } = render(<Badge accent="danger" appearance="hairline">Failing</Badge>);
    expect(container.querySelector('[data-slot="intent-glyph"] svg')).not.toBeNull();
  });

  it('is the small size even when asked for md', () => {
    render(<Badge size="md" appearance="hairline">x</Badge>);
    expect(screen.getByText('x').className).not.toContain('border-2');
  });
});

describe('hairline Tag', () => {
  it('has no # and no forced uppercase', () => {
    render(<Tag text="Needs review" appearance="hairline" />);
    const el = screen.getByText('Needs review');
    expect(el.dataset.appearance).toBe('hairline');
    expect(el.className).not.toContain('uppercase');
    expect(el.className).toContain('border-edge-subtle');
    expect(el.className).toContain('bg-transparent');
  });

  it('lets an explicit prefix or uppercase through', () => {
    render(<Tag text="a" appearance="hairline" prefix="@" uppercase />);
    const el = screen.getByText('@a');
    expect(el.className).toContain('uppercase');
  });
});

describe('label appearance in a table', () => {
  it('defaults Badge and Tag to hairline inside a Table', () => {
    render(
      <InTable>
        <Badge>State</Badge>
        <Tag text="label" />
      </InTable>,
    );
    expect(screen.getByText('State').dataset.appearance).toBe('hairline');
    expect(screen.getByText('label').dataset.appearance).toBe('hairline');
  });

  it('leaves labels outside a table as they were', () => {
    render(
      <>
        <Badge>State</Badge>
        <Tag text="label" />
      </>,
    );
    expect(screen.getByText('State').dataset.appearance).toBeUndefined();
    expect(screen.getByText('#label')).toBeTruthy();
  });

  it('lets one label opt out, or the whole table', () => {
    render(
      <>
        <InTable>
          <Badge appearance="default">One</Badge>
        </InTable>
        <InTable labelAppearance="default">
          <Badge>Two</Badge>
        </InTable>
      </>,
    );
    expect(screen.getByText('One').dataset.appearance).toBeUndefined();
    expect(screen.getByText('Two').dataset.appearance).toBeUndefined();
  });
});
