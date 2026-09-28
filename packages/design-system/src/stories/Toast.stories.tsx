import React, { useEffect } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToastProvider, useToast } from '../components/Toast';
import type { ToastOptions } from '../components/Toast';
import { Button } from '../components/Button';

const meta: Meta<typeof ToastProvider> = {
  title: 'Components/Feedback/Toast',
  component: ToastProvider,
  tags: ['autodocs', 'stable'],
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof ToastProvider>;

/**
 * Shows the given toasts once, on mount — so a story opens in the state it is
 * about. A toast asserted closed asserts nothing (rule 7), and there is no
 * `isOpen` to set: a toast exists because something called `show`.
 *
 * Every one carries an `id`, so a second mount (Storybook's strict mode, a hot
 * reload) updates the same toasts in place rather than stacking duplicates.
 */
function ShowOnMount({ toasts }: { toasts: ToastOptions[] }) {
  const toast = useToast();
  useEffect(() => {
    for (const options of toasts) toast.show(options);
  }, [toast, toasts]);
  return null;
}

/** The page behind the stack, so the screenshot shows what a toast sits over. */
function Page({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-base p-8 font-mono text-sm text-content-primary">
      <p className="max-w-prose">
        Toasts stack in the bottom-right corner, newest on top, over whatever the page is doing.
      </p>
      {children}
    </div>
  );
}

const ALL_INTENTS: ToastOptions[] = [
  { id: 'info', intent: 'info', title: 'Sync queued', description: 'Twelve records waiting.', timeout: 0 },
  {
    id: 'success',
    intent: 'success',
    title: 'Draft deleted',
    description: '“Notes on the ladder” moved to the bin.',
    action: { label: 'UNDO', onClick: () => {} },
  },
  { id: 'warning', intent: 'warning', title: 'Quota at 90%', description: 'Backups pause at 100%.', timeout: 0 },
  { id: 'danger', intent: 'danger', title: 'Deploy failed', description: 'Step 3 of 5: tokens:check.', timeout: 0 },
];

/**
 * All four intents at once, open on load — the story `tests/visual.spec.ts`
 * asserts. The order is the stack order: the last shown is on top. `success`
 * carries the action, and a toast with an action does not expire on its own;
 * the others are pinned with `timeout: 0` so the capture is not a race.
 *
 * `danger` is the one announced assertively. The colour is not what tells a
 * reader that — the icon is, and the politeness is.
 */
export const AllIntents: Story = {
  args: { limit: 4 },
  render: (args) => (
    <ToastProvider {...args}>
      <Page />
      <ShowOnMount toasts={ALL_INTENTS} />
    </ToastProvider>
  ),
};

/**
 * A toast with an action. `UNDO` fires its handler and closes the toast; the
 * toast never expires out from under it, and pausing on hover and on focus
 * keeps any toast in the stack still while it is being reached.
 */
export const WithAction: Story = {
  render: (args) => (
    <ToastProvider {...args}>
      <Page />
      <ShowOnMount
        toasts={[
          {
            id: 'undo',
            intent: 'info',
            title: 'Archived 3 items',
            action: { label: 'UNDO', onClick: () => {} },
          },
        ]}
      />
    </ToastProvider>
  ),
};

/**
 * The queue. Five toasts arrive at once against the default `limit` of three:
 * the newest three are shown, the oldest two are held — hidden and inert, not
 * discarded — and each returns as one ahead of it is dismissed.
 */
export const Queue: Story = {
  render: (args) => (
    <ToastProvider {...args}>
      <Page />
      <ShowOnMount
        toasts={[1, 2, 3, 4, 5].map((n) => ({
          id: `queued-${n}`,
          title: `Upload ${n} of 5 complete`,
          intent: 'success' as const,
          timeout: 0,
        }))}
      />
    </ToastProvider>
  ),
};

/**
 * Interactive, on the real lifetime. Each button shows a toast that expires on
 * its own; hover the stack or press F6 to move focus into it, and the clocks
 * stop until you leave.
 */
export const Interactive: Story = {
  render: (args) => (
    <ToastProvider {...args}>
      <Page>
        <Triggers />
      </Page>
    </ToastProvider>
  ),
};

/**
 * A named component rather than a hook called inside `render`: the lint rule
 * is right that a bare `render` arrow is not a component.
 */
function Triggers() {
  const toast = useToast();
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <Button
        size="sm"
        onClick={() => toast.show({ intent: 'info', title: 'Sync queued', description: 'Twelve records waiting.' })}
      >
        INFO
      </Button>
      <Button size="sm" onClick={() => toast.show({ intent: 'success', title: 'Saved' })}>
        SUCCESS
      </Button>
      <Button
        size="sm"
        onClick={() => toast.show({ intent: 'warning', title: 'Quota at 90%', description: 'Backups pause at 100%.' })}
      >
        WARNING
      </Button>
      <Button
        size="sm"
        onClick={() => toast.show({ intent: 'danger', title: 'Deploy failed', description: 'Step 3 of 5.' })}
      >
        DANGER
      </Button>
      <Button
        size="sm"
        bracketed
        onClick={() =>
          toast.show({ title: 'Draft deleted', action: { label: 'UNDO', onClick: () => toast.show({ intent: 'success', title: 'Restored' }) } })
        }
      >
        WITH ACTION
      </Button>
    </div>
  );
}
