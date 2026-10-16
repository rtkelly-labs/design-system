'use client';

import { Button, NerdIcon } from '@rtkelly13/design-system';

export default function ButtonSizes() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <Button size="xs" variant="primary">RETRY</Button>
      <Button size="sm" variant="primary">RETRY</Button>
      <Button size="md" variant="primary">RETRY</Button>
      <Button size="lg" variant="primary">RETRY</Button>
      <Button size="icon" aria-label="Retry">
        <NerdIcon name="refresh" />
      </Button>
      <Button size="icon-touch" aria-label="Retry">
        <NerdIcon name="refresh" />
      </Button>
    </div>
  );
}
