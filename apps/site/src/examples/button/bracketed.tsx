'use client';

import { Button } from '@rtkelly13/design-system';

export default function BracketedButtons() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* The one action this form exists for. */}
      <Button type="submit" variant="primary" bracketed>
        CREATE TOKEN
      </Button>
      {/* Destructive: the accent says which, the brackets say it acts. */}
      <Button variant="tertiary" bracketed>
        REVOKE ALL TOKENS
      </Button>
    </div>
  );
}
