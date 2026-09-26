import type { Meta, StoryObj } from '@storybook/react-vite';
import { ToastProvider } from '../components/Toast';
import { AccountSettingsPage } from './forms/AccountSettingsPage';
import { CreateAccountForm } from './forms/CreateAccountForm';
import { ResetPasswordFlow } from './forms/ResetPasswordFlow';
import { SignInForm } from './forms/SignInForm';

// Every sample on the docs page renders at once, and a summary taking focus
// there would scroll the page to whichever mounted last.
function inDocs(context: { viewMode?: string }): boolean {
  return context.viewMode === 'docs';
}

const meta: Meta = {
  title: 'SaaS/Account Flows',
  tags: ['autodocs', 'experimental'],
  parameters: {
    docs: {
      description: {
        component: [
          'Four account flows — sign in, create an account, reset a password, and account',
          'settings — composed from the form and application primitives with layout utilities',
          'only. They are the proof issue 252 asks for, not an authentication framework: there is no',
          'session, no provider and no password policy, and every rule and message is a fixture',
          'in `src/stories/forms/`.',
          '',
          'Each form reports a failed submit through `ErrorSummary`, which takes focus and links',
          'to the fields; the field errors say the same thing where the reader lands. A submit',
          'is `pending` while its request is in flight — it keeps focus and refuses a second',
          'submit — and is never disabled to hold an invalid form shut.',
          '`tests/a11y.spec.ts` completes every flow from the keyboard and runs axe at rest and',
          'in the error state, on both Levels and both viewports.',
        ].join('\n'),
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Sign in, at rest: email, password, a remember-me `Checkbox` and the links
 * to the neighbouring flows. Submit it empty to see the field errors; enter
 * any address with the password `analytical-engine` to complete it. Any other
 * password is rejected after a pause, during which the submit is `pending`:
 * focus stays on it, and a second Enter does not send the form again.
 */
export const SignIn: Story = {
  render: (_args, context) => <SignInForm focusOnAppear={!inDocs(context)} />,
};

/**
 * Sign in, just after the server refused the credentials. The failure belongs
 * to no one field, and saying which was wrong would tell an attacker the
 * account exists — so the summary carries it alone, under a title of its
 * own, linked to the email field. The password has been cleared.
 */
export const SignInRejected: Story = {
  render: (_args, context) => <SignInForm initiallyRejected focusOnAppear={!inDocs(context)} />,
};

/**
 * Create an account, at rest: three required fields with helper text, an
 * optional checkbox marked as such, and a required one. The submit is never
 * disabled to hold the form shut, and is `pending` while the request is in
 * flight. An
 * address of `taken@example.com` passes the client's checks and is refused
 * by the server, through the same summary.
 */
export const CreateAccount: Story = {
  render: (_args, context) => <CreateAccountForm focusOnAppear={!inDocs(context)} />,
};

/**
 * Create an account, after a failed submit with a problem in every required
 * field: empty, malformed, too short and unticked. Four links in the summary,
 * four field errors, each helper text replaced by its error.
 */
export const CreateAccountFailed: Story = {
  render: (_args, context) => <CreateAccountForm initiallyFailed focusOnAppear={!inDocs(context)} />,
};

/**
 * Reset a password, first step: ask for the address. Each later step is its
 * own heading, and focus moves to it when the step changes. The last step
 * reports the change with a `Toast` as well as on the page.
 */
export const ResetPassword: Story = {
  render: (_args, context) => (
    <ToastProvider>
      <ResetPasswordFlow focusOnAppear={!inDocs(context)} />
    </ToastProvider>
  ),
};

/**
 * The confirmation between the steps. It does not say whether an account
 * exists for the address, for the reason sign-in's rejection does not. The
 * button stands in for the link in the email.
 */
export const ResetPasswordSent: Story = {
  render: (_args, context) => (
    <ToastProvider>
      <ResetPasswordFlow initialStep="sent" focusOnAppear={!inDocs(context)} />
    </ToastProvider>
  ),
};

/**
 * Choosing the new password, after a failed submit: one too short, and a
 * confirmation that does not match it. A cross-field rule is reported on the
 * field the reader has to change — the second one.
 */
export const ResetPasswordMismatch: Story = {
  render: (_args, context) => (
    <ToastProvider>
      <ResetPasswordFlow initialStep="choose" initiallyFailed focusOnAppear={!inDocs(context)} />
    </ToastProvider>
  ),
};

/**
 * Account settings inside `AppShell`: issue 50's form — a `Select`, a
 * `RadioGroup`, a `Switch` and a disabled field among grouped `Fieldset`s —
 * and a delete behind `AlertDialog`. Confirming reports through `Toast` and
 * turns the button into the way to cancel, so focus returns to it.
 */
export const AccountSettings: Story = {
  parameters: { layout: 'fullscreen' },
  render: (_args, context) => (
    <ToastProvider>
      <AccountSettingsPage focusOnAppear={!inDocs(context)} />
    </ToastProvider>
  ),
};

/**
 * The same page after a failed save: five errors in the summary at the top
 * of the main region, and the page's navigation still around it.
 */
export const AccountSettingsFailed: Story = {
  parameters: { layout: 'fullscreen' },
  render: (_args, context) => (
    <ToastProvider>
      <AccountSettingsPage initiallyFailed focusOnAppear={!inDocs(context)} />
    </ToastProvider>
  ),
};

