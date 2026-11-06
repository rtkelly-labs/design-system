import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

const meta: Meta<typeof Card> = {
  title: 'Foundations/Card',
  component: Card,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof Card>;

/**
 * The **inferred** form: no `variant`, no `title`, so the component picks the
 * panel from the presence of children. This is what every call site predating
 * `variant` looks like, and the reason `variant` exists — adding a title here
 * would silently turn this into a floated blog card.
 */
export const Default: Story = {
  render: () => (
    <Card style={{ maxWidth: '400px' }}>
      <Badge accent="primary">v1.1.0 ACTIVE</Badge>
      <h3 style={{ fontFamily: 'var(--font-space-grotesk, "Space Grotesk"), sans-serif', fontSize: '1.25rem', margin: '0.75rem 0' }}>
        BRUTALIST CONTAINER
      </h3>
      <p style={{ fontFamily: 'var(--font-ibm-plex-mono, "IBM Plex Mono"), monospace', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
        Zero border-radius with 4px hard offset shadow.
      </p>
      <Button bracketed variant="primary">DETAILS</Button>
    </Card>
  ),
};

/**
 * `variant="panel"` — a bordered box with padding, an optional accent stripe on
 * the left edge and a badge. No filename bar, no width constraint, no opinion
 * about what goes inside.
 *
 * Note both of these carry a `title` and stay panels. Without the explicit
 * `variant` they would each render as a full blog card instead, which is
 * exactly the surprise the prop removes.
 */
export const Panel: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: '420px' }}>
      <Card variant="panel" accent="info" badge="DRAFT" title="Scoped themes" description="A panel is a box with a stripe." />
      <Card variant="panel" accent="success" badge="SHIPPED" title="Contrast gate" description="The stripe is the whole colour budget." />
    </div>
  ),
};

/**
 * `variant="card"` — a filename bar across the top, then title, description and
 * a trailing `[ Learn More → ]` when `href` is set. It carries its own width
 * and float classes, so it belongs in a card grid rather than standing alone in
 * a layout you control.
 */
export const FullCard: Story = {
  render: () => (
    <Card
      variant="card"
      title="Where a theme stops applying"
      description="A custom property substitutes where it is declared, not where it is used."
      href="#article"
      asciiArt="[///]"
      accent="primary"
    />
  ),
};

/**
 * The two forms from *identical content*, differing only in `variant`. Left is
 * a panel, right is a card, and both carry the same title and description.
 *
 * With `variant` omitted both of these would be the right-hand one — which is
 * the inference stated as plainly as it can be.
 */
export const SameContentBothForms: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ maxWidth: '320px' }}>
        <Card
          variant="panel"
          accent="primary"
          title="Scoped themes"
          description="A custom property substitutes where it is declared."
        />
      </div>
      <Card
        variant="card"
        accent="primary"
        title="Scoped themes"
        description="A custom property substitutes where it is declared."
      />
    </div>
  ),
};
