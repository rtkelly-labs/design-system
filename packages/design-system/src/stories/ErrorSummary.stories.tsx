import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../components/Button';
import { Checkbox } from '../components/Checkbox';
import { ErrorSummary } from '../components/ErrorSummary';
import type { ErrorSummaryError, ErrorSummaryProps } from '../components/ErrorSummary';
import { Input } from '../components/Input';
import { AccountSettingsForm } from './forms/AccountSettingsForm';

// Every sample on the docs page renders at once, and a summary taking focus
// there would scroll the page to whichever mounted last. Focus-on-appear is
// shown in the story view, and in `OnSubmit` on either.
function inDocs(context: { viewMode?: string }): boolean {
  return context.viewMode === 'docs';
}

const SAMPLE_ERRORS: ErrorSummaryError[] = [
  { id: 'sample-name', message: 'Enter your full name' },
  { id: 'sample-reference', message: 'Enter a reference in the format ABC-1234' },
  { id: 'sample-consent', message: 'Confirm that the details are correct' },
];

/** The fields `SAMPLE_ERRORS` point at, carrying the same messages as their own errors. */
function SampleFields() {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <Input id="sample-name" label="Full name" error="Enter your full name" />
      <Input
        id="sample-reference"
        label="Reference"
        defaultValue="abc1234"
        error="Enter a reference in the format ABC-1234"
      />
      <Checkbox
        id="sample-consent"
        label="The details are correct"
        error="Confirm that the details are correct"
      />
    </div>
  );
}

const meta: Meta<typeof ErrorSummary> = {
  title: 'Components/Actions & Forms/ErrorSummary',
  component: ErrorSummary,
  tags: ['autodocs', 'stable'],
  args: {
    errors: SAMPLE_ERRORS,
  },
  render: (args: ErrorSummaryProps, context) => (
    <div className="flex max-w-2xl flex-col gap-8">
      <ErrorSummary {...args} focusOnAppear={inDocs(context) ? false : args.focusOnAppear} />
      <SampleFields />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof ErrorSummary>;

/**
 * Three errors, each a link to its field. Following one moves focus to the
 * control — the visible checkbox, not the hidden input its id sits on — and
 * scrolls its label into view. Each message repeats the field's own `error`,
 * so the reader recognises where they have arrived.
 */
export const Default: Story = {};

/**
 * A heading of the form's own, and a sentence about the errors as a whole.
 * The title is the region's accessible name, so it should say that something
 * is wrong; the list says what.
 */
export const WithDescription: Story = {
  args: {
    title: 'Your details were not sent',
    children: (
      <p>Nothing has been submitted yet. Correct the answers below and send the form again.</p>
    ),
  },
};

function SubmitDemo() {
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<ErrorSummaryError[]>([]);
  const [attempt, setAttempt] = useState(0);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors(name.trim() ? [] : [{ id: 'demo-name', message: 'Enter your full name' }]);
    setAttempt((n) => n + 1);
  }

  return (
    <div className="flex max-w-md flex-col gap-6">
      <ErrorSummary key={attempt} errors={errors} />
      <form noValidate onSubmit={submit} className="flex flex-col gap-6">
        <Input
          id="demo-name"
          label="Full name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors[0]?.message}
        />
        <div>
          <Button type="submit" variant="primary" bracketed>
            SEND
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * Nothing until a submit fails. Press send with the field empty: the summary
 * appears and takes focus, which is how it is announced — there is no
 * `role="alert"` as well, which would read it twice. The field's own error is
 * not live either; it is read when the summary's link moves focus to the
 * field. Press send again and it
 * takes focus again, because the form gives it a new `key` per attempt.
 */
export const OnSubmit: Story = {
  render: () => <SubmitDemo />,
};

/**
 * The proof issue 50 asks for: one realistic account-settings form holding
 * every control the form layer has — a text field, a textarea, a single
 * select, a checkbox, a radio group and a switch — with a disabled control,
 * required controls, helper text, field-level errors and this summary, all at
 * once. It opens in the state after a failed save, five errors listed; fix
 * them and save again. Composed from exports with layout utilities only; the
 * copy is in `./forms/AccountSettingsForm`.
 */
export const AccountSettings: Story = {
  render: (_args, context) => (
    <AccountSettingsForm initiallyFailed focusOnAppear={!inDocs(context)} />
  ),
};
