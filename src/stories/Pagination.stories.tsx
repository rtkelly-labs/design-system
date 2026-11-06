import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from '../components/Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Foundations/Pagination',
  component: Pagination,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
  args: { totalPages: 5, currentPage: 1 },
};

export const MiddlePage: Story = {
  args: { totalPages: 5, currentPage: 3 },
};

export const LastPage: Story = {
  args: { totalPages: 5, currentPage: 5 },
};

/** `getPageHref` renders anchors instead of buttons, for crawlable pagination. */
export const AsLinks: Story = {
  args: {
    totalPages: 4,
    currentPage: 2,
    getPageHref: (page) => `?page=${page}`,
  },
};

export const Interactive: Story = {
  render: () => {
    const [page, setPage] = useState(1);
    return <Pagination totalPages={6} currentPage={page} onPageChange={setPage} />;
  },
};
