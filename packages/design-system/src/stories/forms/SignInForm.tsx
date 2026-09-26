import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { ErrorSummary } from '../../components/ErrorSummary';
import type { ErrorSummaryError } from '../../components/ErrorSummary';
import { Input } from '../../components/Input';
import { AuthFrame, TEXT_LINK, looksLikeEmail, respondAfter } from './AuthFrame';

// Sign in (#252): two text fields, a remember-me `Checkbox`, a submit that is
// `pending` while the request is in flight, and a form-level error for the
// failure no single field owns — the credentials were wrong.
//
// `pending` rather than `disabled`: the submit keeps focus while it waits, and
// it is the button, not this handler, that refuses a second submit.
//
// There is no authentication here. `DEMO_PASSWORD` is the only password the
// pretend server accepts, so the story can be completed; everything else is
// rejected after a short pause.

/** The one password the pretend server accepts; the story caption names it. */
const DEMO_PASSWORD = 'analytical-engine';

interface Values {
  email: string;
  password: string;
  remember: boolean;
}

type Field = 'email' | 'password';

export interface SignInFormProps {
  /**
   * Open as if a sign-in had just been rejected by the server: the email kept,
   * the password cleared, and the summary reporting the one thing it can.
   */
  initiallyRejected?: boolean;
  /**
   * Passed to the summary. Off on the docs page, where every sample renders at
   * once and a summary taking focus would scroll the page to itself.
   */
  focusOnAppear?: boolean;
  /** How long the pretend server takes to answer, in milliseconds. */
  latency?: number;
}

/**
 * A sign-in form. Field errors come from the last submit: what was left
 * empty, or an email that cannot be one. The server's rejection is reported
 * once, in the summary, against the email field, because it cannot say which
 * of the two was wrong — and saying which would tell an attacker whether the
 * account exists.
 */
export function SignInForm({
  initiallyRejected = false,
  focusOnAppear = true,
  latency = 400,
}: SignInFormProps) {
  const uid = useId();
  const ids: Record<Field, string> = { email: `${uid}email`, password: `${uid}password` };
  const rejection: ErrorSummaryError = {
    id: ids.email,
    message: 'Enter the email address and password for your account',
  };

  const [values, setValues] = useState<Values>({
    email: initiallyRejected ? 'ada@example.com' : '',
    password: '',
    remember: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [rejected, setRejected] = useState(initiallyRejected);
  const [attempt, setAttempt] = useState(initiallyRejected ? 1 : 0);
  const [pending, setPending] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  // The success state replaces the form, so focus goes to its heading rather
  // than being dropped with the button that held it.
  useEffect(() => {
    if (signedIn) heading.current?.focus();
  }, [signedIn]);

  const summary: ErrorSummaryError[] = rejected
    ? [rejection]
    : (Object.keys(ids) as Field[]).flatMap((field) => {
        const message = fieldErrors[field];
        return message ? [{ id: ids[field], message }] : [];
      });

  function validate(): Partial<Record<Field, string>> {
    const errors: Partial<Record<Field, string>> = {};
    if (!values.email.trim()) errors.email = 'Enter your email address';
    else if (!looksLikeEmail(values.email)) {
      errors.email = 'Enter an email address in the correct format, like name@example.com';
    }
    if (!values.password) errors.password = 'Enter your password';
    return errors;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    setRejected(false);
    if (Object.keys(errors).length > 0) {
      setAttempt((n) => n + 1);
      return;
    }
    setPending(true);
    const accepted = await respondAfter(latency, values.password === DEMO_PASSWORD);
    setPending(false);
    if (accepted) {
      setSignedIn(true);
      return;
    }
    setValues((current) => ({ ...current, password: '' }));
    setRejected(true);
    setAttempt((n) => n + 1);
  }

  if (signedIn) {
    return (
      <AuthFrame ref={heading} title="Signed in" lede={`Signed in as ${values.email}.`}>
        <p className="font-sans text-sm text-content-secondary">
          {values.remember
            ? 'This device will stay signed in for 30 days.'
            : 'You will be signed out when you close the browser.'}
        </p>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Sign in"
      lede="Use the email address you registered with."
      footer={
        <>
          No account yet?{' '}
          <a href="#create-account" className={TEXT_LINK}>
            Create one
          </a>
        </>
      }
    >
      <ErrorSummary
        key={attempt}
        errors={summary}
        title={rejected ? 'We could not sign you in' : undefined}
        focusOnAppear={focusOnAppear}
      />
      <form noValidate onSubmit={submit} className="flex flex-col gap-6">
        <Input
          id={ids.email}
          name="email"
          type="email"
          label="Email address"
          autoComplete="username"
          required
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
          error={fieldErrors.email}
        />
        <div className="flex flex-col gap-2">
          <Input
            id={ids.password}
            name="password"
            type="password"
            label="Password"
            autoComplete="current-password"
            required
            value={values.password}
            onChange={(e) => setValues({ ...values, password: e.target.value })}
            error={fieldErrors.password}
          />
          <p className="font-mono text-sm">
            <a href="#reset-password" className={TEXT_LINK}>
              Forgotten your password?
            </a>
          </p>
        </div>
        <Checkbox
          name="remember"
          label="Keep me signed in on this device"
          helperText="For 30 days. Not on a shared computer."
          checked={values.remember}
          onCheckedChange={(remember) => setValues({ ...values, remember })}
        />
        <div>
          <Button type="submit" variant="primary" bracketed pending={pending} pendingLabel="Signing in">
            SIGN IN
          </Button>
        </div>
      </form>
    </AuthFrame>
  );
}
