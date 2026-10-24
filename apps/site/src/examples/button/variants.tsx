'use client';

import { Button } from '@rtkelly13/design-system';

export default function ButtonVariants() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button>VIEW LOGS</Button>
      <Button variant="secondary">PREVIEW</Button>
      <Button variant="primary">DEPLOY</Button>
      <Button variant="tertiary">TAG RELEASE</Button>
      <Button variant="inverse">PIN</Button>
      <Button variant="danger">ROLL BACK</Button>
    </div>
  );
}
