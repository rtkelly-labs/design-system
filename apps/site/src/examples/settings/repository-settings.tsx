'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  AppMain,
  AppShell,
  AppSidebar,
  AppSidebarNav,
  AppTopbar,
  Badge,
  Checkbox,
  ErrorSummary,
  Fieldset,
  Input,
  NoteBlock,
  Radio,
  RadioGroup,
  Select,
  TextArea,
  useOptionalToast,
} from '@rtkelly-labs/design-system';
import type { AppNavItem, ErrorSummaryError } from '@rtkelly-labs/design-system';
import { ApiKeys } from './api-keys';
import { DangerZone } from './danger-zone';
import { SaveBar, SectionHead, SettingRow } from './parts';

interface Values {
  name: string;
  description: string;
  website: string;
  branch: string;
  visibility: string;
  issues: boolean;
  wiki: boolean;
  discussions: boolean;
  projects: boolean;
  squash: boolean;
  rebase: boolean;
  mergeCommit: boolean;
  autoDelete: boolean;
}

const SAVED: Values = {
  name: 'media-transcoder',
  description: 'Batch transcoding for the studio queue. Wraps ffmpeg, adds retries.',
  website: '',
  branch: 'main',
  visibility: 'private',
  issues: true,
  wiki: false,
  discussions: false,
  projects: true,
  squash: true,
  rebase: true,
  mergeCommit: false,
  autoDelete: true,
};

const NAV: AppNavItem[] = [
  { id: 'general', label: 'General' },
  { id: 'features', label: 'Features & merging' },
  { id: 'keys', label: 'Keys & webhooks' },
  { id: 'danger', label: 'Danger zone' },
];

const BRANCHES = ['main', 'develop', 'release/2026.10', 'legacy-ffmpeg-6'].map((b) => ({ value: b, label: b }));
const FEATURES: { key: 'issues' | 'wiki' | 'discussions' | 'projects'; label: string; help: string }[] = [
  { key: 'issues', label: 'Issues', help: 'Track bugs and tasks. Closed issues stay searchable.' },
  { key: 'wiki', label: 'Wiki', help: 'Long-form docs kept beside the code. Anyone with write access can edit.' },
  { key: 'discussions', label: 'Discussions', help: 'A forum for questions that are not bugs.' },
  { key: 'projects', label: 'Projects', help: 'Boards that read from issues and pull requests.' },
];

const countDirty = (a: Values, b: Values) =>
  (Object.keys(a) as (keyof Values)[]).filter((k) => a[k] !== b[k]).length;

/**
 * A repository settings page after GitHub's: a section rail, one long form cut
 * into fieldsets, a pinned save bar that appears while the form is dirty, an
 * error summary that takes focus on a failed save, and the destructive actions
 * at the foot. Developer keys (Stripe's shape) sit in their own section.
 */
export default function RepositorySettings() {
  const uid = useId();
  const [section, setSection] = useState('general');
  const [saved, setSaved] = useState<Values>(SAVED);
  const [values, setValues] = useState<Values>(SAVED);
  const [errors, setErrors] = useState<ErrorSummaryError[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useOptionalToast();
  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);

  const id = (k: string) => `${uid}${k}`;
  const dirty = countDirty(values, saved);
  const errorFor = (k: string) => errors.find((e) => e.id === id(k))?.message;
  const set = <K extends keyof Values>(k: K, v: Values[K]) => setValues((c) => ({ ...c, [k]: v }));

  function validate(): ErrorSummaryError[] {
    const out: ErrorSummaryError[] = [];
    if (!values.name.trim()) out.push({ id: id('name'), message: 'Enter a repository name' });
    else if (!/^[A-Za-z0-9._-]+$/.test(values.name)) out.push({ id: id('name'), message: 'Use letters, numbers, dots, dashes and underscores only' });
    if (values.description.length > 120) out.push({ id: id('description'), message: 'Keep the description to 120 characters or fewer' });
    if (values.website && !/^https?:\/\/[^\s/]+\.[^\s/]+/.test(values.website)) out.push({ id: id('website'), message: 'Enter a full address starting with https://' });
    if (!values.squash && !values.rebase && !values.mergeCommit) out.push({ id: id('merge'), message: 'Allow at least one way to merge a pull request' });
    return out;
  }

  function save(event?: FormEvent) {
    event?.preventDefault();
    if (saving) return;
    const next = validate();
    setErrors(next);
    setAttempt((n) => n + 1);
    if (next.length) {
      setSection(next.some((e) => e.id === id('merge')) && next.length === 1 ? 'features' : 'general');
      return;
    }
    setSaving(true);
    timer.current = setTimeout(() => {
      setSaved(values);
      setSaving(false);
      toast?.show({ intent: 'success', title: 'Settings saved', description: `${values.name}` });
    }, 400);
  }

  function discard() {
    setValues(saved);
    setErrors([]);
  }

  return (
    <div className="min-h-[640px] w-full overflow-hidden border-2 border-edge-strong">
      <AppShell
        sidebar={
          <AppSidebar label="Repository" header={<Badge accent="secondary">{saved.visibility.toUpperCase()}</Badge>}>
            <AppSidebarNav label="Settings sections" items={NAV} activeId={section} onNavigate={setSection} heading="Settings" />
          </AppSidebar>
        }
        topbar={
          <AppTopbar>
            <span className="font-mono text-sm text-content-secondary">rtk / </span>
            <span className="font-mono text-sm font-bold text-content-primary">{saved.name}</span>
          </AppTopbar>
        }
      >
        <AppMain label="Repository settings">
          <div className="flex max-w-3xl flex-col gap-8">
            {section === 'keys' ? <ApiKeys /> : null}
            {section === 'danger' ? <DangerZone /> : null}
            {section === 'general' || section === 'features' ? (
              <form noValidate onSubmit={save} className="flex flex-col gap-8">
                <ErrorSummary key={attempt} errors={errors} />
                {section === 'general' ? (
                  <>
                    <SectionHead title="General">Name, description and the branch pull requests target.</SectionHead>
                    <Fieldset legend="Repository">
                      <Input id={id('name')} name="name" label="Repository name" required value={values.name} onChange={(e) => set('name', e.target.value)} error={errorFor('name')} helperText="Renaming redirects old links, but not clones" />
                      <TextArea id={id('description')} name="description" label="Description (optional)" rows={3} value={values.description} onChange={(e) => set('description', e.target.value)} error={errorFor('description')} helperText={`${values.description.length} of 120 characters`} />
                      <Input id={id('website')} name="website" type="url" label="Website (optional)" placeholder="https://" value={values.website} onChange={(e) => set('website', e.target.value)} error={errorFor('website')} />
                      <Select id={id('branch')} name="branch" label="Default branch" options={BRANCHES} value={values.branch} onValueChange={(v) => set('branch', v)} helperText="Pull requests and clones start here" />
                    </Fieldset>
                    <RadioGroup legend="Visibility" name="visibility" value={values.visibility} onValueChange={(v) => set('visibility', v)} helperText="Changing this is audited and notifies collaborators">
                      <Radio value="public" label="Public" helperText="Anyone can read it. Only collaborators can push." />
                      <Radio value="internal" label="Internal" helperText="Everyone in the organisation can read it." />
                      <Radio value="private" label="Private" helperText="Only people you invite can see it." />
                    </RadioGroup>
                    <NoteBlock type="important" title="Large repositories">
                      Repositories over 5 GB cannot change visibility without support. Archive the history first.
                    </NoteBlock>
                  </>
                ) : (
                  <>
                    <SectionHead title="Features & merging">Switch off what the team does not use.</SectionHead>
                    <Fieldset legend="Features">
                      <div className="flex flex-col">
                        {FEATURES.map((f) => (
                          <SettingRow key={f.key} id={id(f.key)} label={f.label} helperText={f.help} checked={values[f.key]} onCheckedChange={(v) => set(f.key, v)} />
                        ))}
                      </div>
                    </Fieldset>
                    <Fieldset legend="Pull request merging" error={errorFor('merge')} helperText="At least one method must stay on">
                      <div id={id('merge')} tabIndex={-1} className="flex flex-col gap-4">
                        <Checkbox label="Allow squash merging" helperText="Combine all commits into one" checked={values.squash} onCheckedChange={(v) => set('squash', v)} />
                        <Checkbox label="Allow rebase merging" helperText="Replay commits onto the base branch" checked={values.rebase} onCheckedChange={(v) => set('rebase', v)} />
                        <Checkbox label="Allow merge commits" helperText="Keep every commit and add a merge" checked={values.mergeCommit} onCheckedChange={(v) => set('mergeCommit', v)} />
                        <Checkbox label="Delete head branches after merge" checked={values.autoDelete} onCheckedChange={(v) => set('autoDelete', v)} />
                      </div>
                    </Fieldset>
                  </>
                )}
                <SaveBar dirtyCount={dirty} onDiscard={discard} saving={saving} />
              </form>
            ) : null}
          </div>
        </AppMain>
      </AppShell>
    </div>
  );
}

