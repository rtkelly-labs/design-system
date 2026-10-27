'use client';

import { useState } from 'react';
import { AlertDialog, Button, Input, useOptionalToast } from '@rtkelly-labs/design-system';
import { SectionHead } from './parts';

const REPO = 'rtk/media-transcoder';

type Action = 'archive' | 'transfer' | 'delete' | null;

const ROWS: { id: Exclude<Action, null>; title: string; body: string; label: string }[] = [
  { id: 'archive', title: 'Archive this repository', body: 'Mark it read-only. Issues, pull requests and pushes are refused until it is unarchived.', label: 'ARCHIVE' },
  { id: 'transfer', title: 'Transfer ownership', body: 'Move it to another account or organisation. Webhooks and deploy keys come with it.', label: 'TRANSFER' },
  { id: 'delete', title: 'Delete this repository', body: 'Removes 214 deployments, 3 domains and every environment variable. It cannot be undone.', label: 'DELETE' },
];

/**
 * A danger zone. Archive and transfer are one click to confirm; delete asks for
 * the repository name first, and the confirm button stays disabled until it is
 * typed. `AlertDialog` has no way to disable its own confirm button, so the
 * dialog's `footer` slot is used to supply a button that can be.
 */
export function DangerZone() {
  const [action, setAction] = useState<Action>(null);
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState<Exclude<Action, null>[]>([]);
  const toast = useOptionalToast();
  const row = ROWS.find((r) => r.id === action);
  const needsName = action === 'delete';
  const ready = !needsName || typed === REPO;

  function close() {
    setAction(null);
    setTyped('');
  }
  function confirm() {
    if (!action || !ready) return;
    setDone((d) => [...d, action]);
    toast?.show({
      intent: action === 'delete' ? 'danger' : 'warning',
      title: action === 'delete' ? 'Repository scheduled for deletion' : action === 'archive' ? 'Repository archived' : 'Transfer started',
      description: REPO,
    });
    close();
  }

  return (
    <section aria-labelledby="danger-heading" className="flex flex-col gap-4">
      <SectionHead title="Danger zone">Actions here are hard to reverse. Each asks before it runs.</SectionHead>
      <h3 id="danger-heading" className="sr-only">Destructive actions</h3>
      <ul className="m-0 flex list-none flex-col border-2 border-intent-danger p-0 shadow-hard-intent-danger">
        {ROWS.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-4 border-b-2 border-intent-danger p-4 last:border-b-0">
            <div className="min-w-0 flex-1 basis-64">
              <p className="m-0 font-mono text-sm font-bold text-content-primary">{r.title}</p>
              <p className="m-0 mt-1 font-sans text-sm text-content-secondary">{r.body}</p>
            </div>
            <Button
              type="button"
              variant="tertiary"
              bracketed
              disabled={done.includes(r.id)}
              onClick={() => setAction(r.id)}
            >
              {done.includes(r.id) ? 'DONE' : r.label}
            </Button>
          </li>
        ))}
      </ul>

      <AlertDialog
        isOpen={action !== null}
        onClose={close}
        onConfirm={confirm}
        title={row ? `${row.title}?` : ''}
        footer={
          <>
            <Button type="button" variant="inverse" onClick={close}>
              KEEP IT
            </Button>
            <Button type="button" variant="tertiary" bracketed disabled={!ready} onClick={confirm}>
              {row?.label ?? ''} {REPO.split('/')[1]}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="m-0">{row?.body}</p>
          {needsName ? (
            <Input
              label={`Type ${REPO} to confirm`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              helperText="Case sensitive"
            />
          ) : null}
        </div>
      </AlertDialog>
    </section>
  );
}

export default function DangerZoneExample() {
  return (
    <div className="w-full max-w-2xl">
      <DangerZone />
    </div>
  );
}
