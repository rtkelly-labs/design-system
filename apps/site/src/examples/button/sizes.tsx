'use client';

import { Button } from '@rtkelly-labs/design-system';

export default function ButtonSizes() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <Button appearance="raised" size="sm" variant="primary">RETRY</Button>
      <Button appearance="raised" size="md" variant="primary">RETRY</Button>
      <Button appearance="raised" size="lg" variant="primary">RETRY</Button>
    </div>
  );
}
