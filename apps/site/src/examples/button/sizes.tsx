'use client';

import { Button } from '@rtkelly13/design-system';

export default function ButtonSizes() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <Button size="sm" variant="primary">RETRY</Button>
      <Button size="md" variant="primary">RETRY</Button>
      <Button size="lg" variant="primary">RETRY</Button>
    </div>
  );
}
