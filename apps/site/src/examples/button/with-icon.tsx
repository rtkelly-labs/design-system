'use client';

import { Download, GitBranch, Rocket } from 'lucide-react';
import { Button } from '@rtkelly13/design-system';

export default function ButtonWithIcon() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="primary">
        <Rocket size={18} aria-hidden="true" /> PROMOTE
      </Button>
      <Button variant="secondary">
        <GitBranch size={18} aria-hidden="true" /> NEW BRANCH
      </Button>
      {/* Icon-only: the label moves to aria-label, since there is no text. */}
      <Button variant="inverse" size="sm" aria-label="Download build log">
        <Download size={18} aria-hidden="true" />
      </Button>
    </div>
  );
}
