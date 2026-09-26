'use client';

import { Button } from '@rtkelly13/design-system';

export default function ButtonAsLink() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* `href` renders an <a>: middle-click, "open in new tab" and the
          status-bar preview all work, and a screen reader announces a link. */}
      <Button href="/docs/installation" variant="primary">
        GET STARTED
      </Button>
      {/* `target="_blank"` gets `rel="noopener noreferrer"` unless you set one. */}
      <Button href="https://design-system.ryankelly.dev" target="_blank" variant="inverse">
        OPEN STORYBOOK ↗
      </Button>
    </div>
  );
}
