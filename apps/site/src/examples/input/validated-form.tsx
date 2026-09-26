'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  Button,
  Checkbox,
  ErrorSummary,
  Fieldset,
  Input,
  Select,
  type ErrorSummaryError,
} from '@rtkelly13/design-system';

const IDS = { name: 'token-name', scope: 'token-scope', expiry: 'token-expiry', ack: 'token-ack' };

const SCOPES = [
  { value: 'read', label: 'Read: deployments and logs' },
  { value: 'deploy', label: 'Deploy: trigger and roll back' },
  { value: 'admin', label: 'Admin: everything, including billing' },
];

function validate(form: FormData): ErrorSummaryError[] {
  const errors: ErrorSummaryError[] = [];
  const name = String(form.get('name') ?? '').trim();
  const expiry = Number(form.get('expiry'));
  if (!name) errors.push({ id: IDS.name, message: 'Enter a name for the token' });
  else if (name.length > 40) errors.push({ id: IDS.name, message: 'Keep the name to 40 characters or fewer' });
  if (!form.get('scope')) errors.push({ id: IDS.scope, message: 'Choose what the token can do' });
  if (!Number.isInteger(expiry) || expiry < 1 || expiry > 90)
    errors.push({ id: IDS.expiry, message: 'Expiry must be a whole number of days from 1 to 90' });
  if (!form.get('ack')) errors.push({ id: IDS.ack, message: 'Confirm you will store the token securely' });
  return errors;
}

export default function CreateTokenForm() {
  const [errors, setErrors] = useState<ErrorSummaryError[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [created, setCreated] = useState<string | null>(null);
  const errorFor = (id: string) => errors.find((e) => e.id === id)?.message;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = validate(form);
    setErrors(next);
    setAttempt((n) => n + 1);
    setCreated(next.length ? null : String(form.get('name')));
  }

  return (
    <form noValidate onSubmit={submit} className="flex w-full max-w-xl flex-col gap-6">
      {/* Keyed by attempt, so a second failed submit takes focus again. */}
      <ErrorSummary key={attempt} errors={errors} />
      <Fieldset legend="New API token">
        <div className="flex flex-col gap-5">
          <Input id={IDS.name} name="name" label="Token name" placeholder="ci-deployer" error={errorFor(IDS.name)} />
          <Select id={IDS.scope} name="scope" label="Scope" placeholder="Choose a scope" options={SCOPES} error={errorFor(IDS.scope)} />
          <Input
            id={IDS.expiry}
            name="expiry"
            label="Expires after (days)"
            inputMode="numeric"
            defaultValue="30"
            error={errorFor(IDS.expiry)}
          />
          <Checkbox id={IDS.ack} name="ack" label="I will store this token in a secret manager" error={errorFor(IDS.ack)} />
        </div>
      </Fieldset>
      <div className="flex items-center gap-4">
        <Button type="submit" variant="primary" bracketed>
          CREATE TOKEN
        </Button>
        {created ? (
          <p role="status" className="m-0 font-mono text-sm text-intent-success">
            &gt; created “{created}”
          </p>
        ) : null}
      </div>
    </form>
  );
}
