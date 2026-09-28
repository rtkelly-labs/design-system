'use client';

import { useState } from 'react';
import { TextArea } from '@rtkelly13/design-system';

const LIMIT = 280;

export default function ReleaseNotes() {
  const [notes, setNotes] = useState(
    'Cold starts on edge-router drop from 1.8s to 420ms. The connection pool is now warmed during the deploy instead of on the first request.',
  );
  const over = notes.length > LIMIT;

  return (
    <div className="w-full max-w-xl">
      <TextArea
        label="Release notes"
        rows={4}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        helperText={`${notes.length} / ${LIMIT} characters`}
        error={over ? `Keep it to ${LIMIT} characters. The changelog truncates the rest` : undefined}
      />
    </div>
  );
}
