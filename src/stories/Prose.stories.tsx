import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Prose } from '../components/docs/Prose';

const meta: Meta<typeof Prose> = {
  title: 'Docs/Prose',
  component: Prose,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Prose>;

/**
 * Styles raw HTML by element, which is what MDX output is — so the story uses
 * bare tags deliberately rather than the component equivalents.
 */
export const Default: Story = {
  render: () => (
    <Prose>
      <h2>Composition</h2>
      <p>
        The host reads the composed Storybook&rsquo;s index in the browser, which is why the
        composed origin has to send CORS headers.
      </p>
      <ul>
        <li>Production aliases and custom domains serve publicly</li>
        <li>Per-deployment URLs redirect to SSO</li>
      </ul>
      <blockquote>A ref that cannot be reached renders as a permanently erroring entry.</blockquote>
      <p>
        Inline <code>index.json</code> and a <a href="#link">link</a> for contrast.
      </p>
    </Prose>
  ),
};
