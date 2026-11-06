import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button';
import { ButtonGroup } from '../components/ButtonGroup';

const meta: Meta<typeof ButtonGroup> = {
  title: 'Components/Actions & Forms/Button Group',
  component: ButtonGroup,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

/**
 * A row of related actions, rendered `role="group"`. The usual pairing is a
 * `quiet` cancel beside the action it cancels. Beyond the layout, the group is
 * where the danger rule is enforced — the next two stories show it.
 */
export const Default: Story = {
  render: () => (
    <ButtonGroup aria-label="Draft actions">
      <Button>CANCEL</Button>
      <Button variant="secondary">SAVE DRAFT</Button>
      <Button variant="primary" bracketed>
        PUBLISH
      </Button>
    </ButtonGroup>
  ),
};

/**
 * Danger beside a neighbour that is neutral, so nothing but its own text and
 * outline says which action is destructive. This is the shape the rule asks
 * for: `quiet` or `secondary` beside `danger`. `Modal` and `AlertDialog`
 * footers are groups, so this is what a confirmation does by default.
 */
export const DangerBesideQuiet: Story = {
  render: () => (
    <ButtonGroup aria-label="Delete project">
      <Button>CANCEL</Button>
      <Button variant="danger" bracketed>
        DELETE PROJECT
      </Button>
    </ButtonGroup>
  ),
};

/**
 * A deliberate collision. `tertiary` and `danger` resolve to the same hue on
 * both Levels, pink on `midnight` and red on `sketch`, so colour alone would
 * be all that tells KEEP from DELETE (WCAG 1.4.1). In development the group
 * logs one `console.warn` naming both Levels; open the browser console on this
 * page to see it. Production builds run no check. The fix is to make the
 * neighbour `quiet` or `secondary`, as in the story above.
 */
export const HueCollision: Story = {
  render: () => (
    <ButtonGroup aria-label="Collision example">
      <Button variant="tertiary">KEEP</Button>
      <Button variant="danger">DELETE</Button>
    </ButtonGroup>
  ),
};
