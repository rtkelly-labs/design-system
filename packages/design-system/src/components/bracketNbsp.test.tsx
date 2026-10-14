// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BracketText } from './BracketText';
import { PageHeader } from './PageHeader';
import { PageTitle } from './PageTitle';
import { Pagination } from './Pagination';
import { StatCard } from './StatCard';

const NBSP = ' ';

/** No plain space may sit next to a bracket: that is where a line could break. */
const strandable = (text: string) => /\[ | \]/.test(text);

describe('bracketed labels use no-break spaces inside the brackets', () => {
  it('BracketText', () => {
    const { container } = render(<BracketText>HELLO WORLD</BracketText>);
    const text = container.textContent ?? '';
    expect(text).toBe(`[${NBSP}HELLO WORLD${NBSP}]`);
    expect(strandable(text)).toBe(false);
  });

  it('PageTitle (and so Hero) brackets through BracketText and balances its lines', () => {
    const { container } = render(<PageTitle>Title</PageTitle>);
    expect(container.querySelector('h1')?.textContent).toBe(`[${NBSP}Title${NBSP}]`);
    expect(container.querySelector('h1')?.className).toContain('text-balance');
  });

  it('PageHeader', () => {
    const { container } = render(<PageHeader title="Reports" />);
    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe(`[${NBSP}Reports${NBSP}]`);
    expect(h1?.className).toContain('text-balance');
  });

  it('StatCard title', () => {
    const { container } = render(<StatCard title="Users" value="1" />);
    expect(strandable(container.textContent ?? '')).toBe(false);
    expect(container.textContent).toContain(`[${NBSP}Users${NBSP}]`);
  });

  it('Pagination status', () => {
    const { container } = render(<Pagination currentPage={2} totalPages={9} onPageChange={() => {}} />);
    expect(container.textContent).toContain(`[${NBSP}2 / 9${NBSP}]`);
  });
});
