import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { ErrorSummary } from '../../components/ErrorSummary';
import type { ErrorSummaryError } from '../../components/ErrorSummary';
import { Fieldset } from '../../components/Fieldset';
import { Input, TextArea } from '../../components/Input';
import { Select } from '../../components/Select';
import { Radio, RadioGroup } from '../../components/RadioGroup';
import { Switch } from '../../components/Switch';

// The account-settings form issue 50's "Done when" asks for, and the one
// issue 252's account flow builds on: every control the form layer has, in one
// form, composed from exports with layout utilities only.
//
// Every label, message and value below is a fixture. The components hold none
// of it; `ErrorSummary` in particular knows nothing but ids and messages.

interface AccountSettingsValues {
  displayName: string;
  email: string;
  bio: string;
  timezone: string;
  visibility: string;
  signInAlerts: boolean;
  terms: boolean;
}

type FieldName = 'displayName' | 'email' | 'bio' | 'visibility' | 'terms';

const FIELD_ORDER: FieldName[] = ['displayName', 'email', 'bio', 'visibility', 'terms'];

type FieldErrors = Partial<Record<FieldName, string>>;

const BIO_LIMIT = 160;

const TIMEZONES = [
  { value: 'Europe/London', label: 'London (GMT / BST)' },
  { value: 'America/New_York', label: 'New York (EST / EDT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'UTC', label: 'Coordinated Universal Time' },
];

/**
 * What the form starts with. In the failed state it holds five problems at
 * once — an empty required field, a malformed one, one over its limit, an
 * unanswered group and an unticked box — so every control's error appears.
 */
const FAILING_VALUES: AccountSettingsValues = {
  displayName: '',
  email: 'ada.lovelace@example',
  bio:
    'Analyst of engines, writer of notes longer than the machine they describe, and the first to ' +
    'see that the numbers could stand for something else entirely — music, perhaps.',
  timezone: 'Europe/London',
  visibility: '',
  signInAlerts: true,
  terms: false,
};

// Keyed by field rather than by id: the ids are per instance (`useId`), so
// the same form can render twice on one docs page without two controls
// answering to one label. The summary is built from this in `FIELD_ORDER`.
function validate(values: AccountSettingsValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.displayName.trim()) errors.displayName = 'Enter a display name';
  if (!values.email.trim()) {
    errors.email = 'Enter an email address';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = 'Enter an email address in the correct format, like name@example.com';
  }
  if (values.bio.length > BIO_LIMIT) errors.bio = `Bio must be ${BIO_LIMIT} characters or fewer`;
  if (!values.visibility) errors.visibility = 'Choose who can see your profile';
  if (!values.terms) errors.terms = 'Accept the updated terms to save your settings';
  return errors;
}

export interface AccountSettingsFormProps {
  /** Start as if the reader had just pressed save with every problem present. */
  initiallyFailed?: boolean;
  /**
   * Passed to the summary. Off on the docs page, where every sample renders at
   * once and a summary taking focus would scroll the page to itself.
   */
  focusOnAppear?: boolean;
}

/**
 * The form. Errors are the result of the last submit rather than of every
 * keystroke — the summary is a report on an attempt — and each submit bumps
 * `attempt`, the summary's `key`, so a repeat failure takes focus again.
 */
export function AccountSettingsForm({
  initiallyFailed = false,
  focusOnAppear = true,
}: AccountSettingsFormProps) {
  const uid = useId();
  /** One id per field: the control's `id`, and the summary's link target. */
  const ids: Record<FieldName, string> = {
    displayName: `${uid}display-name`,
    email: `${uid}email`,
    bio: `${uid}bio`,
    visibility: `${uid}visibility`,
    terms: `${uid}terms`,
  };
  const [values, setValues] = useState<AccountSettingsValues>(FAILING_VALUES);
  const [errors, setErrors] = useState<FieldErrors>(() =>
    initiallyFailed ? validate(FAILING_VALUES) : {},
  );
  const [attempt, setAttempt] = useState(initiallyFailed ? 1 : 0);
  const [saved, setSaved] = useState(false);

  const errorFor = (field: FieldName) => errors[field];
  // In the order the fields appear, which is the order the summary lists them.
  const summary: ErrorSummaryError[] = FIELD_ORDER.flatMap((field) => {
    const message = errors[field];
    return message ? [{ id: ids[field], message }] : [];
  });

  function update<K extends keyof AccountSettingsValues>(key: K, value: AccountSettingsValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function discard() {
    setValues(FAILING_VALUES);
    setErrors({});
    setSaved(false);
  }

  // The form is `noValidate`: the browser's own required-field bubbles would
  // stop the submit before the summary could report on it.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate(values);
    setErrors(next);
    setAttempt((n) => n + 1);
    setSaved(Object.keys(next).length === 0);
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold uppercase text-content-primary">
          Account settings
        </h1>
        <p className="font-sans text-sm text-content-secondary">
          Changes to your profile are saved when you press save. Fields are required unless marked
          optional.
        </p>
      </div>

      <ErrorSummary key={attempt} errors={summary} focusOnAppear={focusOnAppear} />

      <form noValidate onSubmit={submit} className="flex flex-col gap-8">
        <Fieldset legend="Profile">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              id={ids.displayName}
              name="displayName"
              label="Display name"
              autoComplete="nickname"
              required
              value={values.displayName}
              onChange={(e) => update('displayName', e.target.value)}
              error={errorFor('displayName')}
            />
            <Input
              id={`${uid}username`}
              name="username"
              label="Username"
              defaultValue="ada.lovelace"
              disabled
              helperText="Usernames cannot be changed"
            />
          </div>
          <Input
            id={ids.email}
            name="email"
            type="email"
            label="Email address"
            autoComplete="email"
            required
            value={values.email}
            onChange={(e) => update('email', e.target.value)}
            helperText="Where receipts and sign-in alerts are sent"
            error={errorFor('email')}
          />
          <TextArea
            id={ids.bio}
            name="bio"
            label="Bio (optional)"
            rows={4}
            value={values.bio}
            onChange={(e) => update('bio', e.target.value)}
            helperText={`Up to ${BIO_LIMIT} characters`}
            error={errorFor('bio')}
          />
        </Fieldset>

        <Fieldset legend="Preferences">
          <Select
            id={`${uid}timezone`}
            name="timezone"
            label="Time zone"
            options={TIMEZONES}
            value={values.timezone}
            onValueChange={(next) => update('timezone', next)}
            helperText="Used for the dates in notifications"
          />
          <RadioGroup
            id={ids.visibility}
            name="visibility"
            legend="Profile visibility"
            required
            value={values.visibility}
            onValueChange={(next) => update('visibility', next)}
            error={errorFor('visibility')}
          >
            <Radio value="public" label="Public" helperText="Anyone with the link" />
            <Radio value="members" label="Members only" />
            <Radio value="private" label="Private" />
          </RadioGroup>
          <Switch
            id={`${uid}sign-in-alerts`}
            name="signInAlerts"
            label="Email me about new sign-ins"
            checked={values.signInAlerts}
            onCheckedChange={(next) => update('signInAlerts', next)}
            helperText="Takes effect straight away, without saving"
          />
        </Fieldset>

        <Checkbox
          id={ids.terms}
          name="terms"
          label="I accept the updated terms of service"
          required
          checked={values.terms}
          onCheckedChange={(next) => update('terms', next)}
          error={errorFor('terms')}
        />

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" variant="primary" bracketed>
            SAVE CHANGES
          </Button>
          <Button type="button" variant="inverse" onClick={discard}>
            DISCARD CHANGES
          </Button>
          <p role="status" className="font-mono text-sm font-bold text-intent-success">
            {saved ? '> Settings saved' : ''}
          </p>
        </div>
      </form>
    </div>
  );
}
