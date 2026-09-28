import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

const meta: Meta<typeof EmptyState> = {
  title: 'Components/Feedback/EmptyState',
  component: EmptyState,
  tags: ['autodocs', 'stable'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/**
 * **An empty search result.** The state is *your query*, so the description
 * quotes it back and the action clears it.
 *
 * Note what is not here: no illustration, no apology, and no invitation to
 * create something. A reader who searched has a goal already, and the useful
 * next move is to widen the search rather than to start a new thing.
 */
export const EmptySearchResult: Story = {
  render: () => (
    <div className="w-full max-w-xl">
      <EmptyState
        icon={<span className="font-mono text-2xl">[ ? ]</span>}
        title="No matches"
        description={
          <>
            Nothing matched <span className="font-mono">“retention policy”</span>. Try a shorter
            query, or drop the status filter.
          </>
        }
        action={
          <>
            <Button variant="default" size="sm">
              CLEAR FILTERS
            </Button>
            <Button variant="primary" bracketed size="sm">
              EDIT QUERY
            </Button>
          </>
        }
      />
    </div>
  ),
};

/**
 * **A completely empty application.** First run: nothing has been created yet,
 * nothing is filtered, and nothing is wrong.
 *
 * Same component, and every word of it different. The description explains
 * what the thing *is* — a first-run reader does not know yet — and the single
 * primary action creates the first one, with the import as the secondary way
 * in for someone arriving with existing work.
 */
export const FirstRun: Story = {
  render: () => (
    <div className="w-full max-w-xl">
      <EmptyState
        icon={<span className="font-mono text-2xl">[ /// ]</span>}
        title="No rules yet"
        description="A rule matches incoming statements and files them against a contract. Create one to see it run against the last 30 days."
        action={
          <>
            <Button variant="primary" bracketed size="sm">
              NEW RULE
            </Button>
            <Button variant="tertiary" size="sm">
              IMPORT A SET
            </Button>
          </>
        }
      >
        <p className="font-mono text-xs uppercase tracking-wider text-content-muted">
          &gt; nothing has run yet
        </p>
      </EmptyState>
    </div>
  ),
};

/**
 * Title only — the form for an empty state inside something small: a table
 * body, a sidebar panel, a card that is one of twelve on a dashboard.
 *
 * Every slot but the title is optional precisely so that this is the same
 * component rather than a second one. A box that cannot afford a description
 * still gets the system's dashed well instead of a bare sentence.
 */
export const TitleOnly: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <EmptyState title="No activity today" />
    </div>
  ),
};

/**
 * In place, inside a table whose header has already rendered.
 *
 * The empty state replaces the rows and nothing else, so the columns stay
 * legible and the reader can see what would be listed. `className` is how it
 * loses its own edge here — the table already has one, and two nested boxes
 * read as a mistake.
 */
export const InATable: Story = {
  render: () => (
    <Card variant="panel" title="Statements" className="max-w-2xl">
      <div className="border-2 border-edge-strong">
        <div className="flex gap-4 border-b-2 border-edge-strong bg-surface-base px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-content-secondary">
          <span className="w-1/2">Statement</span>
          <span className="w-1/4">Period</span>
          <span className="w-1/4">Status</span>
        </div>
        <EmptyState
          className="border-0 bg-surface-raised py-8"
          title="No statements in this period"
          description="Change the period, or upload one."
          action={
            <Button variant="primary" bracketed size="sm">
              UPLOAD
            </Button>
          }
        />
      </div>
    </Card>
  ),
};
