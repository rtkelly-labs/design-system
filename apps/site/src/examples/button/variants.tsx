'use client';

import { Button } from '@rtkelly-labs/design-system';

export default function ButtonVariants() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button appearance="raised" variant="primary">DEPLOY</Button>
      <Button appearance="raised" variant="secondary">PREVIEW</Button>
      <Button appearance="raised" variant="tertiary">ROLL BACK</Button>
      <Button appearance="raised" variant="inverse">VIEW LOGS</Button>
    </div>
  );
}
