import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from '../components/Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Components/Navigation/Pagination',
  component: Pagination,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

/**
 * The first page. PREV has nowhere to go, so it is dimmed and announced with
 * `aria-disabled` — still in place and still in the tab order, rather than a
 * gap or a control the keyboard skips.
 */
export const Default: Story = {
  args: { totalPages: 5, currentPage: 1 },
};

/**
 * Both ends live, and every page listed: at seven pages or fewer there is no
 * ellipsis, because the whole run is shorter to read than any abbreviation of
 * it. The current page is bracketed and pressed in, not just recoloured.
 */
export const MiddlePage: Story = {
  args: { totalPages: 5, currentPage: 3 },
};

/** The last page — the mirror of `Default`, with NEXT the unavailable end. */
export const LastPage: Story = {
  args: { totalPages: 5, currentPage: 5 },
};

/**
 * Twenty pages, on page 7: first, last, the current page with a neighbour
 * either side, and an ellipsis for each run in between. Seven slots wherever the
 * current page is, so the strip does not change width as a reader clicks along
 * it. Below the `md` breakpoint the list gives way to the `[ 7 / 20 ]` status
 * instead of wrapping onto a second line.
 */
export const ManyPages: Story = {
  args: { totalPages: 20, currentPage: 7 },
};

/**
 * Navigation mode. `getPageHref` renders anchors instead of buttons, for
 * crawlable pagination that survives middle-click; PREV and NEXT carry
 * `rel="prev"` and `rel="next"`, which only mean something on a link.
 */
export const AsLinks: Story = {
  args: {
    totalPages: 4,
    currentPage: 2,
    getPageHref: (page) => `?page=${page}`,
  },
};

/** Navigation mode across enough pages to need both ellipses. */
export const AsLinksManyPages: Story = {
  args: {
    totalPages: 100,
    currentPage: 50,
    getPageHref: (page) => `?page=${page}`,
  },
};

/**
 * Callback mode, wired to state. Every control is a `<button type="button">`,
 * so dropping this inside a `<form>` never submits it.
 */
export const Interactive: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    return <Pagination totalPages={20} currentPage={page} onPageChange={setPage} />;
  },
};
