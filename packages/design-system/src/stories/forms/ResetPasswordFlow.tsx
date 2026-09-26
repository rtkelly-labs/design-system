import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../components/Button';
import { ErrorSummary } from '../../components/ErrorSummary';
import type { ErrorSummaryError } from '../../components/ErrorSummary';
import { Input } from '../../components/Input';
import { useOptionalToast } from '../../components/Toast';
import { AuthFrame, TEXT_LINK, looksLikeEmail, respondAfter } from './AuthFrame';

// Forgotten / reset password (#252): multi-step state, a confirmation between
// the steps, and a success reported by `Toast` as well as on the page.
//
//   request → sent → choose → done
//
// Each step is its own heading, and focus moves to that heading when the step
// changes, so the reader hears where they are rather than being left on a
// button that has just been unmounted. The email link is simulated by a
// button on the `sent` step.

export type ResetStep = 'request' | 'sent' | 'choose' | 'done';

const MIN_PASSWORD = 12;

export interface ResetPasswordFlowProps {
  /** The step to open on. The flow moves on from there. */
  initialStep?: ResetStep;
  /**
   * Open the `choose` step as if its submit had just failed: a password too
   * short, and a confirmation that does not match.
   */
  initiallyFailed?: boolean;
  /**
   * Passed to the summary, and to the step heading's focus on mount. Off on
   * the docs page, where every sample renders at once.
   */
  focusOnAppear?: boolean;
  /** How long the pretend server takes to answer, in milliseconds. */
  latency?: number;
}

type Field = 'email' | 'password' | 'confirm';

/**
 * The whole reset flow in one component: ask for the address, confirm that a
 * link was sent without saying whether an account exists, take the new
 * password twice, and report the change.
 */
export function ResetPasswordFlow({
  initialStep = 'request',
  initiallyFailed = false,
  focusOnAppear = true,
  latency = 400,
}: ResetPasswordFlowProps) {
  const uid = useId();
  const ids: Record<Field, string> = {
    email: `${uid}email`,
    password: `${uid}password`,
    confirm: `${uid}confirm`,
  };
  const failing = initiallyFailed && initialStep === 'choose';

  const [step, setStep] = useState<ResetStep>(initialStep);
  const [email, setEmail] = useState(initialStep === 'request' ? '' : 'ada@example.com');
  const [password, setPassword] = useState(failing ? 'engine' : '');
  const [confirm, setConfirm] = useState(failing ? 'engines' : '');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>(() =>
    failing
      ? {
          password: `Password must be ${MIN_PASSWORD} characters or more`,
          confirm: 'Enter the same password in both fields',
        }
      : {},
  );
  const [attempt, setAttempt] = useState(failing ? 1 : 0);
  const [pending, setPending] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const shown = useRef(step);
  const toast = useOptionalToast();

  // Focus follows the step. Not on the first render — a page that opens on a
  // step has not *changed* step, and stealing focus on load is its own defect.
  useEffect(() => {
    if (shown.current === step) return;
    shown.current = step;
    heading.current?.focus();
  }, [step]);

  const summary: ErrorSummaryError[] = (Object.keys(ids) as Field[]).flatMap((field) => {
    const message = errors[field];
    return message ? [{ id: ids[field], message }] : [];
  });

  function go(next: ResetStep) {
    setErrors({});
    setStep(next);
  }

  function fail(found: Partial<Record<Field, string>>): boolean {
    setErrors(found);
    if (Object.keys(found).length === 0) return false;
    setAttempt((n) => n + 1);
    return true;
  }

  async function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Partial<Record<Field, string>> = {};
    if (!email.trim()) found.email = 'Enter your email address';
    else if (!looksLikeEmail(email)) {
      found.email = 'Enter an email address in the correct format, like name@example.com';
    }
    if (fail(found)) return;
    setPending(true);
    await respondAfter(latency, true);
    setPending(false);
    go('sent');
  }

  async function choosePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found: Partial<Record<Field, string>> = {};
    if (!password) found.password = 'Enter a new password';
    else if (password.length < MIN_PASSWORD) {
      found.password = `Password must be ${MIN_PASSWORD} characters or more`;
    }
    if (!confirm) found.confirm = 'Enter the new password again';
    else if (confirm !== password) found.confirm = 'Enter the same password in both fields';
    if (fail(found)) return;
    setPending(true);
    await respondAfter(latency, true);
    setPending(false);
    toast?.show({ intent: 'success', title: 'Password changed', description: 'Sign in with your new password.' });
    go('done');
  }

  if (step === 'sent') {
    return (
      <AuthFrame
        ref={heading}
        title="Check your email"
        lede={
          <>
            If an account exists for <strong className="text-content-primary">{email}</strong>, we
            have sent a link to reset its password. It works for 30 minutes.
          </>
        }
        footer={
          <>
            Wrong address?{' '}
            <a
              href="#reset-password"
              className={TEXT_LINK}
              onClick={(event) => {
                event.preventDefault();
                go('request');
              }}
            >
              Use a different email
            </a>
          </>
        }
      >
        <p className="font-sans text-sm text-content-secondary">
          The link in the email opens the next step. In this example, the button stands in for it.
        </p>
        <div>
          <Button type="button" variant="primary" bracketed onClick={() => go('choose')}>
            OPEN THE RESET LINK
          </Button>
        </div>
      </AuthFrame>
    );
  }

  if (step === 'done') {
    return (
      <AuthFrame ref={heading} title="Password changed" lede="Your other devices have been signed out.">
        <div>
          <Button href="#sign-in" variant="primary" bracketed>
            SIGN IN
          </Button>
        </div>
      </AuthFrame>
    );
  }

  if (step === 'choose') {
    return (
      <AuthFrame
        ref={heading}
        title="Choose a new password"
        lede={`For ${email}. Choosing one signs out your other devices.`}
      >
        <ErrorSummary key={attempt} errors={summary} focusOnAppear={focusOnAppear} />
        <form noValidate onSubmit={choosePassword} className="flex flex-col gap-6">
          <Input
            id={ids.password}
            name="password"
            type="password"
            label="New password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText={`At least ${MIN_PASSWORD} characters`}
            error={errors.password}
          />
          <Input
            id={ids.confirm}
            name="confirm"
            type="password"
            label="Confirm new password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={errors.confirm}
          />
          <div>
            <Button
              type="submit"
              variant="primary"
              bracketed
              pending={pending}
              pendingLabel="Saving your new password"
            >
              SAVE PASSWORD
            </Button>
          </div>
        </form>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      ref={heading}
      title="Reset your password"
      lede="Enter the email address you registered with, and we will send you a link."
      footer={
        <>
          Remembered it?{' '}
          <a href="#sign-in" className={TEXT_LINK}>
            Back to sign in
          </a>
        </>
      }
    >
      <ErrorSummary key={attempt} errors={summary} focusOnAppear={focusOnAppear} />
      <form noValidate onSubmit={requestLink} className="flex flex-col gap-6">
        <Input
          id={ids.email}
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <div>
          <Button
            type="submit"
            variant="primary"
            bracketed
            pending={pending}
            pendingLabel="Sending the reset link"
          >
            SEND RESET LINK
          </Button>
        </div>
      </form>
    </AuthFrame>
  );
}
