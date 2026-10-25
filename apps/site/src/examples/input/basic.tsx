'use client';

import { Input } from '@rtkelly-labs/design-system';

export default function BasicInput() {
  return (
    <div className="w-full max-w-sm">
      <Input label="Project name" name="project" placeholder="billing-api" autoComplete="off" />
    </div>
  );
}
