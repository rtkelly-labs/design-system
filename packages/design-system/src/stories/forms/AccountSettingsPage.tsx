import { useState } from 'react';
import { Bell, CreditCard, KeyRound, UserRound } from 'lucide-react';
import { AlertDialog } from '../../components/AlertDialog';
import { AppMain, AppShell, AppSidebar, AppSidebarNav, AppTopbar } from '../../components/AppShell';
import type { AppNavItem } from '../../components/AppShell';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { useOptionalToast } from '../../components/Toast';
import { AccountSettingsForm } from './AccountSettingsForm';

// Account settings (#252), in place: issue 50's form — every control, grouped,
// with its summary — inside `AppShell`, and the one action on the page that
// cannot be undone behind `AlertDialog`.
//
// The form is `AccountSettingsForm`, reused rather than copied; this file adds
// only the application around it and the danger zone under it.

const NAV: AppNavItem[] = [
  { id: 'profile', label: 'Profile', href: '#profile', icon: UserRound },
  { id: 'security', label: 'Sign-in & security', href: '#security', icon: KeyRound },
  { id: 'notifications', label: 'Notifications', href: '#notifications', icon: Bell },
  { id: 'billing', label: 'Billing', href: '#billing', icon: CreditCard },
];

export interface AccountSettingsPageProps {
  /** Open the form in the state after a failed save — see `AccountSettingsForm`. */
  initiallyFailed?: boolean;
  /**
   * Passed to the form's summary. Off on the docs page, where every sample
   * renders at once and a summary taking focus would scroll the page to itself.
   */
  focusOnAppear?: boolean;
}

/**
 * The settings page of a signed-in application. Deleting the account asks
 * first, in an `AlertDialog` that a stray click cannot dismiss; confirming
 * closes it, reports through `Toast` when a provider is mounted, and turns the
 * button into the way to cancel.
 */
export function AccountSettingsPage({
  initiallyFailed = false,
  focusOnAppear = true,
}: AccountSettingsPageProps) {
  const [confirming, setConfirming] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const toast = useOptionalToast();

  function confirmDelete() {
    setConfirming(false);
    setScheduled(true);
    toast?.show({
      intent: 'warning',
      title: 'Account scheduled for deletion',
      description: 'It is deleted in 14 days. Sign in before then to cancel.',
    });
  }

  function cancelDelete() {
    setScheduled(false);
    toast?.show({ intent: 'info', title: 'Deletion cancelled' });
  }

  return (
    <AppShell
      sidebar={
        <AppSidebar label="Account" header={<Badge accent="secondary">YOUR ACCOUNT</Badge>}>
          <AppSidebarNav label="Account sections" items={NAV} activeId="profile" />
        </AppSidebar>
      }
      topbar={
        <AppTopbar
          actions={
            <Button size="sm" variant="inverse">
              SIGN OUT
            </Button>
          }
        >
          <Badge accent="success">SIGNED IN AS ADA</Badge>
        </AppTopbar>
      }
    >
      <AppMain label="Account settings">
        <AccountSettingsForm initiallyFailed={initiallyFailed} focusOnAppear={focusOnAppear} />

        <section aria-labelledby="delete-account-heading" className="flex max-w-2xl flex-col gap-3">
          <h2
            id="delete-account-heading"
            className="font-display text-lg font-bold uppercase text-content-primary"
          >
            Delete account
          </h2>
          <p className="font-sans text-sm text-content-secondary">
            Your profile, posts and billing history are removed after 14 days. Until then, signing
            in cancels the deletion.
          </p>
          <p role="status" className="font-mono text-sm font-bold text-intent-warning">
            {scheduled ? '> Deletion scheduled for 14 days from now.' : ''}
          </p>
          {/*
            One button, relabelled, rather than one swapped for another. The
            dialog returns focus to the control that opened it when it closes;
            unmount that control on confirm and focus falls to the document.
          */}
          <div>
            {scheduled ? (
              <Button type="button" variant="inverse" onClick={cancelDelete}>
                CANCEL DELETION
              </Button>
            ) : (
              <Button type="button" variant="tertiary" bracketed onClick={() => setConfirming(true)}>
                DELETE ACCOUNT
              </Button>
            )}
          </div>
        </section>

        <AlertDialog
          isOpen={confirming}
          onClose={() => setConfirming(false)}
          onConfirm={confirmDelete}
          title="Delete account"
          confirmLabel="DELETE ACCOUNT"
          cancelLabel="KEEP ACCOUNT"
        >
          Everything on this account is deleted in 14 days. After that it cannot be recovered.
        </AlertDialog>
      </AppMain>
    </AppShell>
  );
}
