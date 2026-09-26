'use client';

import { useState } from 'react';
import { Badge, Button, Modal, useToast } from '@rtkelly13/design-system';

export default function ConfirmDeploy() {
  const [isOpen, setOpen] = useState(false);
  const toast = useToast();

  const promote = () => {
    setOpen(false);
    toast.show({ title: 'Promoted', description: 'billing-api 3f9c2e1 is live in lhr1', intent: 'success' });
  };

  return (
    <>
      <Button variant="primary" bracketed onClick={() => setOpen(true)}>
        PROMOTE TO PRODUCTION
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        title="Promote billing-api"
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button size="sm" variant="inverse" onClick={() => setOpen(false)}>
              CANCEL
            </Button>
            <Button size="sm" variant="primary" bracketed onClick={promote}>
              PROMOTE
            </Button>
          </div>
        }
      >
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 font-mono text-sm">
          <dt className="text-content-muted">COMMIT</dt>
          <dd className="m-0">3f9c2e1 · fix: retry invoices on 409</dd>
          <dt className="text-content-muted">REGION</dt>
          <dd className="m-0">lhr1</dd>
          <dt className="text-content-muted">CHECKS</dt>
          <dd className="m-0">
            <Badge accent="success">14 / 14 PASSED</Badge>
          </dd>
        </dl>
      </Modal>
    </>
  );
}
