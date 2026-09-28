'use client';

import { useState } from 'react';
import { AlertDialog, Button } from '@rtkelly13/design-system';

export default function DeleteProject() {
  const [isOpen, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="tertiary" bracketed disabled={deleted} onClick={() => setOpen(true)}>
        {deleted ? 'DELETED' : 'DELETE PROJECT'}
      </Button>
      {deleted ? (
        <Button size="sm" variant="inverse" onClick={() => setDeleted(false)}>
          RESET
        </Button>
      ) : null}
      <AlertDialog
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setDeleted(true);
          setOpen(false);
        }}
        title="Delete media-transcoder?"
        confirmLabel="DELETE PROJECT"
        cancelLabel="KEEP IT"
      >
        This removes 214 deployments, 3 domains and every environment variable. It cannot be undone.
      </AlertDialog>
    </div>
  );
}
