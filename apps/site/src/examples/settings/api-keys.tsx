'use client';

import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AlertDialog,
  Badge,
  Button,
  ButtonGroup,
  ErrorSummary,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsPanel,
  TabsTab,
  useOptionalToast,
} from '@rtkelly13/design-system';
import type { ErrorSummaryError } from '@rtkelly13/design-system';
import { CopyButton, SectionHead } from './parts';

interface Key {
  id: string;
  name: string;
  /** Publishable keys are safe to show; secret keys are masked until revealed. */
  kind: 'publishable' | 'secret' | 'restricted';
  value: string;
  created: string;
  lastUsed: string;
}

const SEED: Key[] = [
  { id: 'k1', name: 'Web checkout', kind: 'publishable', value: 'pk_live_51Nq0aXk8Tz3Rv9Lm', created: '12 Mar 2026', lastUsed: 'today' },
  { id: 'k2', name: 'Billing worker', kind: 'secret', value: 'sk_live_51Nq0aVd2Wy7Hb4Qe', created: '12 Mar 2026', lastUsed: '2 hours ago' },
  { id: 'k3', name: 'Reporting export', kind: 'restricted', value: 'rk_live_51Nq0aJc6Pf1Ux8Zs', created: '02 Jun 2026', lastUsed: '11 days ago' },
];

const HOOKS = [
  { id: 'w1', url: 'https://api.example.test/hooks/billing', events: 'invoice.paid, invoice.failed', status: 'enabled' },
  { id: 'w2', url: 'https://api.example.test/hooks/disputes', events: 'charge.dispute.created', status: 'disabled' },
];

const KINDS = [
  { value: 'restricted', label: 'Restricted: only the permissions you pick' },
  { value: 'secret', label: 'Secret: full access to the account' },
];

const mask = (v: string) => `${v.slice(0, 8)}${'•'.repeat(14)}${v.slice(-4)}`;
const NAME_ID = 'key-name';
const KIND_ID = 'key-kind';

/**
 * Stripe-shaped developer settings: keys with a masked value, reveal and copy
 * per row, roll behind a confirm, a create form with an error summary, and the
 * webhook endpoints on a second tab. Fixture data, literal dates.
 */
export function ApiKeys() {
  const [keys, setKeys] = useState(SEED);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [rolling, setRolling] = useState<Key | null>(null);
  const [errors, setErrors] = useState<ErrorSummaryError[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState('keys');
  const toast = useOptionalToast();
  const formId = useId();
  const errorFor = (id: string) => errors.find((e) => e.id === id)?.message;

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const kind = String(form.get('kind') ?? '');
    const next: ErrorSummaryError[] = [];
    if (!name) next.push({ id: NAME_ID, message: 'Enter a name so you can tell this key apart later' });
    if (!kind) next.push({ id: KIND_ID, message: 'Choose what the key can do' });
    setErrors(next);
    setAttempt((n) => n + 1);
    if (next.length) return;
    setKeys((k) => [
      ...k,
      { id: `k${k.length + 1}`, name, kind: kind as Key['kind'], value: `${kind === 'secret' ? 'sk' : 'rk'}_live_51Nq0aNw${k.length}Mt5Ke2`, created: '14 Oct 2026', lastUsed: 'never' },
    ]);
    event.currentTarget.reset();
    toast?.show({ intent: 'success', title: 'Key created', description: name });
  }

  function roll() {
    if (!rolling) return;
    setKeys((k) => k.map((x) => (x.id === rolling.id ? { ...x, value: `${x.value.slice(0, 8)}RolledKey${x.value.slice(-4)}`, created: '14 Oct 2026', lastUsed: 'never' } : x)));
    toast?.show({ intent: 'warning', title: 'Key rolled', description: 'The old value works for 24 hours.' });
    setRolling(null);
  }

  const toggle = (id: string) => setRevealed((r) => (r.includes(id) ? r.filter((x) => x !== id) : [...r, id]));

  return (
    <section aria-label="Developer settings" className="flex w-full flex-col gap-6">
      <SectionHead title="Developers">Keys authenticate your server; webhooks tell it what happened.</SectionHead>
      <Tabs value={tab} onValueChange={setTab} variant="underline">
        <TabsList label="Developer settings">
          <TabsTab value="keys">API keys</TabsTab>
          <TabsTab value="hooks">Webhooks</TabsTab>
        </TabsList>
        <TabsPanel value="keys">
          <div className="flex flex-col gap-8 pt-6">
            <Table label="API keys" density="compact" containerClassName="max-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last used</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k) => {
                  const shown = k.kind === 'publishable' || revealed.includes(k.id);
                  return (
                    <TableRow key={k.id}>
                      <TableCell>
                        <span className="font-bold">{k.name}</span>{' '}
                        <Badge accent={k.kind === 'secret' ? 'tertiary' : k.kind === 'publishable' ? 'secondary' : 'primary'}>{k.kind}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="font-mono text-xs break-all" aria-label={shown ? `${k.name} key value` : `${k.name} key, hidden`}>
                          {shown ? k.value : mask(k.value)}
                        </code>
                      </TableCell>
                      <TableCell>{k.created}</TableCell>
                      <TableCell>{k.lastUsed}</TableCell>
                      <TableCell>
                        <ButtonGroup aria-label={`${k.name} key actions`} className="justify-end gap-2">
                          {k.kind !== 'publishable' ? (
                            <Button type="button" size="xs" aria-label={`Reveal ${k.name} key`} aria-pressed={shown} onClick={() => toggle(k.id)}>
                              {shown ? 'HIDE' : 'REVEAL'}
                            </Button>
                          ) : null}
                          <CopyButton value={k.value} label={`${k.name} key`} />
                          <Button type="button" size="xs" variant="danger" onClick={() => setRolling(k)} aria-label={`Roll ${k.name}`}>
                            ROLL
                          </Button>
                        </ButtonGroup>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <form noValidate onSubmit={create} aria-labelledby={`${formId}-h`} className="flex max-w-xl flex-col gap-5">
              <h3 id={`${formId}-h`} className="m-0 font-display text-lg font-bold uppercase text-content-primary">
                Create a key
              </h3>
              <ErrorSummary key={attempt} errors={errors} />
              <Input id={NAME_ID} name="name" label="Name" placeholder="Nightly export" error={errorFor(NAME_ID)} helperText="Shown in the key list and in audit logs" />
              <Select id={KIND_ID} name="kind" label="Access" placeholder="Choose access" options={KINDS} error={errorFor(KIND_ID)} />
              <div>
                <Button type="submit" variant="primary" bracketed>
                  CREATE KEY
                </Button>
              </div>
            </form>
          </div>
        </TabsPanel>
        <TabsPanel value="hooks">
          <div className="pt-6">
            <Table label="Webhook endpoints" density="compact">
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {HOOKS.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      <code className="font-mono text-xs break-all">{h.url}</code>
                    </TableCell>
                    <TableCell>{h.events}</TableCell>
                    <TableCell>
                      <Badge accent={h.status === 'enabled' ? 'secondary' : 'quiet'}>{h.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsPanel>
      </Tabs>

      <AlertDialog
        isOpen={rolling !== null}
        onClose={() => setRolling(null)}
        onConfirm={roll}
        title={`Roll ${rolling?.name ?? 'key'}?`}
        confirmLabel="ROLL KEY"
        cancelLabel="KEEP KEY"
      >
        A new value is issued now. The old one keeps working for 24 hours, then every request using it fails.
      </AlertDialog>
    </section>
  );
}

export default function ApiKeysExample() {
  return (
    <div className="w-full max-w-4xl">
      <ApiKeys />
    </div>
  );
}
