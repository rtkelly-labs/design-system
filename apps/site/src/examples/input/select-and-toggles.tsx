'use client';

import { useState } from 'react';
import { Checkbox, Radio, RadioGroup, Select, Switch } from '@rtkelly13/design-system';

const REGIONS = [
  { value: 'lhr1', label: 'London (lhr1)' },
  { value: 'fra1', label: 'Frankfurt (fra1)' },
  { value: 'iad1', label: 'Washington, D.C. (iad1)' },
  { value: 'hnd1', label: 'Tokyo (hnd1)' },
];

export default function SelectAndToggles() {
  const [region, setRegion] = useState('lhr1');
  const [strategy, setStrategy] = useState('rolling');

  return (
    <div className="grid w-full max-w-2xl gap-8 sm:grid-cols-2">
      <div className="flex flex-col gap-6">
        <Select label="Primary region" options={REGIONS} value={region} onValueChange={setRegion} />
        <Switch label="Preview deployments" helperText="Build every pull request" defaultChecked />
        <Checkbox label="Notify #deploys on failure" defaultChecked />
      </div>
      <RadioGroup legend="Rollout strategy" value={strategy} onValueChange={setStrategy}>
        <Radio value="rolling" label="Rolling" helperText="Replace instances in batches of 25%" />
        <Radio value="blue-green" label="Blue-green" helperText="Switch traffic once the new set is healthy" />
        <Radio value="canary" label="Canary" helperText="Send 5% of traffic first, then promote" />
      </RadioGroup>
    </div>
  );
}
