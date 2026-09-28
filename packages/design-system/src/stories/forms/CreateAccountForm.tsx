import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/Button';
import { Checkbox } from '../../components/Checkbox';
import { ErrorSummary } from '../../components/ErrorSummary';
import type { ErrorSummaryError } from '../../components/ErrorSummary';
import { Input } from '../../components/Input';
import { AuthFrame, TEXT_LINK, looksLikeEmail, respondAfter } from './AuthFrame';

// Create account (#252): validation across four fields, required fields and
// helper text, an optional one marked as such, and a submit that is `pending`
// only while the request is in flight.
//
// Never disabled, and not held shut until the form is valid. A disabled button
// cannot say what is missing, cannot be focused to find out, and leaves a
// keyboard user pressing a control that does nothing; a submit that fails into
// the summary tells them. "Already sending" is `pending`, which keeps focus on
// the button and refuses the second submit itself.
//
// The length rule is a fixture, not a password policy — the system has none.

/** The address the pretend server says is already registered. */
const TAKEN_EMAIL = 'taken@example.com';

const MIN_PASSWORD = 12;

interface Values {
  name: string;
  email: string;
  password: string;
  updates: boolean;
  terms: boolean;
}

type Field = 'name' | 'email' | 'password' | 'terms';
const ORDER: Field[] = ['name', 'email', 'password', 'terms'];

const FAILING: Values = {
  name: '',
  email: 'ada.lovelace@example',
  password: 'engine',
  updates: false,
  terms: false,
};

const EMPTY: Values = { name: '', email: '', password: '', updates: false, terms: false };

function validate(values: Values): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (!values.name.trim()) errors.name = 'Enter your full name';
  if (!values.email.trim()) errors.email = 'Enter your email address';
  else if (!looksLikeEmail(values.email)) {
    errors.email = 'Enter an email address in the correct format, like name@example.com';
  }
  if (!values.password) errors.password = 'Enter a password';
  else if (values.password.length < MIN_PASSWORD) {
    errors.password = `Password must be ${MIN_PASSWORD} characters or more`;
  }
  if (!values.terms) errors.terms = 'Agree to the terms of service to create an account';
  return errors;
}

export interface CreateAccountFormProps {
  /** Open as if the reader had just pressed create with four problems present. */
  initiallyFailed?: boolean;
  /**
   * Passed to the summary. Off on the docs page, where every sample renders at
   * once and a summary taking focus would scroll the page to itself.
   */
  focusOnAppear?: boolean;
  /** How long the pretend server takes to answer, in milliseconds. */
  latency?: number;
}

/**
 * A registration form. The client checks what it can; the server can still
 * refuse, and its refusal — the address is taken — arrives as one more field
 * error through the same summary, so the reader meets one pattern for both.
 */
export function CreateAccountForm({
  initiallyFailed = false,
  focusOnAppear = true,
  latency = 400,
}: CreateAccountFormProps) {
  const uid = useId();
  const ids: Record<Field, string> = {
    name: `${uid}name`,
    email: `${uid}email`,
    password: `${uid}password`,
    terms: `${uid}terms`,
  };

  const [values, setValues] = useState<Values>(initiallyFailed ? FAILING : EMPTY);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>(() =>
    initiallyFailed ? validate(FAILING) : {},
  );
  const [attempt, setAttempt] = useState(initiallyFailed ? 1 : 0);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (created) heading.current?.focus();
  }, [created]);

  const summary: ErrorSummaryError[] = ORDER.flatMap((field) => {
    const message = errors[field];
    return message ? [{ id: ids[field], message }] : [];
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setAttempt((n) => n + 1);
      return;
    }
    setPending(true);
    const taken = await respondAfter(latency, values.email.trim().toLowerCase() === TAKEN_EMAIL);
    setPending(false);
    if (taken) {
      setErrors({ email: 'An account already exists for this email address. Sign in instead' });
      setAttempt((n) => n + 1);
      return;
    }
    setCreated(true);
  }

  if (created) {
    return (
      <AuthFrame
        ref={heading}
        title="Account created"
        lede={`We have sent a confirmation link to ${values.email}.`}
      >
        <Button href="#sign-in" variant="primary" bracketed>
          CONTINUE TO SIGN IN
        </Button>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      title="Create an account"
      lede="All fields are required unless marked optional."
      footer={
        <>
          Already registered?{' '}
          <a href="#sign-in" className={TEXT_LINK}>
            Sign in
          </a>
        </>
      }
    >
      <ErrorSummary key={attempt} errors={summary} focusOnAppear={focusOnAppear} />
      <form noValidate onSubmit={submit} className="flex flex-col gap-6">
        <Input
          id={ids.name}
          name="name"
          label="Full name"
          autoComplete="name"
          required
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          error={errors.name}
        />
        <Input
          id={ids.email}
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          required
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
          helperText="We will send a link to confirm it"
          error={errors.email}
        />
        <Input
          id={ids.password}
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          required
          value={values.password}
          onChange={(e) => setValues({ ...values, password: e.target.value })}
          helperText={`At least ${MIN_PASSWORD} characters. A short phrase is easier to remember`}
          error={errors.password}
        />
        <Checkbox
          name="updates"
          label="Email me about new features (optional)"
          checked={values.updates}
          onCheckedChange={(updates) => setValues({ ...values, updates })}
        />
        <Checkbox
          id={ids.terms}
          name="terms"
          label="I agree to the terms of service"
          required
          checked={values.terms}
          onCheckedChange={(terms) => setValues({ ...values, terms })}
          error={errors.terms}
        />
        <div className="flex">
          <Button
            type="submit"
            variant="primary"
            bracketed
            pending={pending}
            pendingLabel="Creating your account"
          >
            CREATE ACCOUNT
          </Button>
        </div>
      </form>
    </AuthFrame>
  );
}
