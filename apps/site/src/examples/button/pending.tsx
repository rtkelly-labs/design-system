'use client';

import { useEffect, useState } from 'react';
import { Button, Spinner } from '@rtkelly13/design-system';

type Phase = 'idle' | 'publishing' | 'published';

export default function PendingButton() {
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    if (phase !== 'publishing') return;
    const timer = setTimeout(() => setPhase('published'), 1400);
    return () => clearTimeout(timer);
  }, [phase]);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button
        variant="primary"
        bracketed
        disabled={phase === 'publishing'}
        aria-live="polite"
        onClick={() => setPhase(phase === 'published' ? 'idle' : 'publishing')}
      >
        {phase === 'publishing' ? (
          <>
            <Spinner size="sm" label="Publishing" /> PUBLISHING
          </>
        ) : phase === 'published' ? (
          'PUBLISHED'
        ) : (
          'PUBLISH'
        )}
      </Button>
      <span className="font-mono text-xs uppercase text-content-muted">
        {phase === 'published' ? '> press again to reset' : '> a control says exactly what happens'}
      </span>
    </div>
  );
}
