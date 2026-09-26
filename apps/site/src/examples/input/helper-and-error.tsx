'use client';

import { useState } from 'react';
import { Input } from '@rtkelly13/design-system';

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export default function HelperAndError() {
  const [value, setValue] = useState('Billing API');
  const error = SLUG.test(value) ? undefined : 'Use lowercase letters, numbers and single hyphens';

  return (
    <div className="grid w-full max-w-2xl gap-6 sm:grid-cols-2">
      <Input
        label="Subdomain"
        helperText="Your project is served at <subdomain>.rtk.sh"
        defaultValue="billing-api"
      />
      <Input
        label="Subdomain"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        error={error}
        helperText="Fix the value and the error clears"
      />
    </div>
  );
}
