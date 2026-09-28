'use client';

import { useState } from 'react';
import { Button, Modal } from '@rtkelly13/design-system';

export default function BasicModal() {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <Button variant="inverse" onClick={() => setOpen(true)}>
        WHAT CHANGED
      </Button>
      <Modal isOpen={isOpen} onClose={() => setOpen(false)} title="Release 2026.38">
        <ul className="m-0 flex list-none flex-col gap-2 p-0 font-mono text-sm">
          <li>&gt; edge-router: connection pool warmed during deploy</li>
          <li>&gt; billing-api: invoices retried on 409, not dropped</li>
          <li>&gt; docs-site: search index built at deploy time</li>
        </ul>
      </Modal>
    </>
  );
}
