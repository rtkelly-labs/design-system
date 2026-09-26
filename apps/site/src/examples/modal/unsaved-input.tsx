'use client';

import { useState } from 'react';
import { Button, Input, Modal, TextArea } from '@rtkelly13/design-system';

export default function IncidentNote() {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        LOG INCIDENT NOTE
      </Button>
      {/* A stray click outside must not throw away what someone typed. */}
      <Modal
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        closeOnBackdropClick={false}
        title="Incident INC-2291"
        footer={
          <div className="flex justify-end gap-3">
            <Button size="sm" variant="inverse" onClick={() => setOpen(false)}>
              DISCARD
            </Button>
            <Button size="sm" variant="primary" onClick={() => setOpen(false)}>
              SAVE NOTE
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Summary" defaultValue="Elevated 5xx on auth-gateway in fra1" />
          <TextArea label="Timeline" rows={4} placeholder="14:02 latency rose…" />
        </div>
      </Modal>
    </>
  );
}
