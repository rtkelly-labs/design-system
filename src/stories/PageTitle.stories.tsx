import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PageTitle } from '../components/PageTitle';

const meta: Meta<typeof PageTitle> = {
  title: 'Foundations/PageTitle',
  component: PageTitle,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof PageTitle>;

export const Default: Story = {
  args: { children: 'Nested theme panels' },
};

export const WithSubtitle: Story = {
  args: {
    children: 'Nested theme panels',
    subtitle: 'Why var() substitution decides where a theme stops applying',
  },
};

export const Bracketed: Story = {
  args: { children: 'Release notes', bracketed: true },
};
