'use client';

import { Button } from '@rtkelly13/design-system';

export default function ButtonVariants() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="primary">DEPLOY</Button>
      <Button variant="secondary">PREVIEW</Button>
      <Button variant="tertiary">ROLL BACK</Button>
      <Button variant="inverse">VIEW LOGS</Button>
    </div>
  );
}
