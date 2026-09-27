import { createContext, forwardRef, useContext, useMemo } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { Toast as BaseToast } from '@base-ui/react/toast';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { recipe } from '../lib/recipe';
import { usePortalThemeAttribute } from './portalTheme';
import { Button } from './Button';
import { DEFAULT_TIMEOUT, resolveLifetime } from './toastLifetime';

/**
 * What a toast is about — the four intents, and nothing else.
 *
 * The same four `semanticTokens.intent` names every other component uses, so a
 * toast is never coloured by hue: `danger` is whatever `--ds-intent-danger`
 * resolves to on the current Level. There is no emphasis accent here on
 * purpose — a notification that is "the pink one" has told nobody anything.
 *
 * A plain string union rather than anything Base UI names, so the primitive
 * stays out of the published `.d.ts`.
 */
export type ToastIntent = 'info' | 'success' | 'warning' | 'danger';

/** The one follow-up a toast may offer — `UNDO`, `RETRY`, `VIEW`. */
export interface ToastActionOptions {
  /** The button's label, written in caps at the call site as `Button`'s is. */
  label: string;
  /**
   * What the action does. The toast closes itself after this runs: an action
   * that has been taken leaves nothing to decide, and a toast still offering
   * `UNDO` after the undo is a second chance to press it.
   */
  onClick: () => void;
}

/** One notification, as a caller describes it to {@link ToastApi.show}. */
export interface ToastOptions {
  /**
   * The headline, and the toast's accessible name — what a screen reader says
   * first. Required as text, because a toast with no title announces a
   * description with nothing to say what it is about.
   */
  title: string;
  /** The detail under the title. Optional; a short toast is a better toast. */
  description?: ReactNode;
  /**
   * Colour, icon and — for `danger` — how urgently it is announced. Defaults
   * to `info`. `info`, `success` and `warning` are polite; `danger` is
   * assertive and interrupts, which is why it is reserved for failures.
   */
  intent?: ToastIntent;
  /**
   * An optional follow-up. A toast with an action does not expire on its own
   * unless `timeout` says so: a control that can vanish before a keyboard or
   * screen-reader user reaches it is a control only a mouse user has.
   */
  action?: ToastActionOptions;
  /**
   * Milliseconds before the toast dismisses itself; `0` keeps it until it is
   * dismissed. Left unset, it is the provider's `timeout` — lengthened for
   * long text, so a toast is on screen for at least as long as it takes to
   * read — or `0` when there is an action.
   */
  timeout?: number;
  /**
   * A stable id. Showing a toast with an id that is already on screen updates
   * it in place and restarts its lifetime instead of stacking a duplicate —
   * the right behaviour for "Saving…" becoming "Saved".
   */
  id?: string;
  /** Called once when the toast closes, whatever closed it. */
  onClose?: () => void;
}

/** What {@link useToast} returns. */
export interface ToastApi {
  /** Show a toast. Returns its id, for `dismiss`. */
  show: (options: ToastOptions) => string;
  /** Dismiss one toast by id, or every toast when called with no id. */
  dismiss: (id?: string) => void;
}

export interface ToastProviderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'> {
  /** The application. Anything below may call {@link useToast}. */
  children?: ReactNode;
  /**
   * The default lifetime in milliseconds. Six seconds, rather than Base UI's
   * five, and a floor rather than a fixed value: longer text gets longer. `0`
   * makes every toast persist until it is dismissed.
   */
  timeout?: number;
  /**
   * How many toasts are visible at once. Past it the oldest are queued rather
   * than dropped — hidden and inert until one ahead of them closes. Three by
   * default: a fourth simultaneous notification is usually a sign that they
   * should have been one.
   */
  limit?: number;
  /**
   * The region's accessible name — what a screen reader calls the landmark,
   * and what a user pressing F6 lands on. Defaults to `Notifications`.
   */
  label?: string;
  /** Merged into the region's classes, so a caller can move the stack. */
  className?: string;
}

/**
 * The toast's own data, carried on Base UI's `data` field. Only the parts the
 * item needs to render that Base UI does not already model.
 */
interface ToastData {
  intent: ToastIntent;
  action?: ToastActionOptions;
}

/**
 * The surface. A recipe in this file rather than a shared module because
 * nothing else wears it — and nothing exports it, so `tailwind-variants`' types
 * stay out of the `.d.ts`.
 *
 * The intent classes are the same `--ds-intent-*` custom properties
 * `semanticTokens.intent` names and `NoteBlock` paints inline: a toast and the
 * note block beside it cannot disagree about what `danger` looks like.
 */
const toast = recipe({
  slots: {
    /*
     * Bottom-right from `sm` up, full-width with a 16px gutter below it.
     * `z-top` from the `--ds-layer-*` scale — the layer the dialogs use, and
     * the top of the scale — never a literal `z-` value.
     *
     * The stack is a plain column, newest first, and it grows *upward* from
     * the bottom edge: a new toast appears above the ones already there, so
     * nothing a reader is part-way through moves when another arrives. DOM
     * order is visual order, so Tab walks them in the order they are seen.
     */
    viewport:
      'fixed right-4 bottom-4 left-4 z-top flex flex-col gap-3 sm:left-auto sm:w-full sm:max-w-sm',
    /*
     * Enter and exit are `data-starting-style` / `data-ending-style`, as the
     * dialogs' are: a short rise in, a short slide out, over `--duration-quick`
     * and `--ease-brutalist`. The `motion-reduce` clause drops both — the
     * toast appears and disappears in place, and is announced exactly the same,
     * because the announcement belongs to the live region and not to the
     * motion.
     *
     * `data-[limited]:hidden`: past the provider's `limit` Base UI marks the
     * oldest toasts limited and inert rather than removing them. Hidden is the
     * other half of that — they are queued, not visible, and come back as the
     * ones ahead of them close.
     */
    root:
      'flex items-start gap-3 border-2 bg-surface-base p-4 font-mono '
      + 'transition duration-quick ease-brutalist '
      + 'data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0 '
      + 'data-[ending-style]:translate-x-4 data-[ending-style]:opacity-0 '
      + 'data-[limited]:hidden motion-reduce:transition-none',
    icon: 'mt-0.5 h-4 w-4 shrink-0',
    content: 'flex min-w-0 flex-1 flex-col gap-1',
    title: 'font-display text-sm font-extrabold uppercase tracking-wider',
    description: 'font-mono text-sm leading-relaxed text-content-primary',
    actions: 'mt-2 flex',
    // The dialogs' close control, at the toast's scale.
    close:
      'shrink-0 border-2 border-edge-strong bg-surface-raised px-2 font-mono text-base font-bold '
      + 'text-content-primary transition-colors hover:bg-surface-base hover:text-accent-tertiary '
      + 'focus-visible:ring-2 focus-visible:ring-accent-primary',
  },
  variants: {
    intent: {
      info: { root: 'border-intent-info shadow-hard-intent-info', icon: 'text-intent-info', title: 'text-intent-info' },
      success: { root: 'border-intent-success shadow-hard-intent-success', icon: 'text-intent-success', title: 'text-intent-success' },
      warning: { root: 'border-intent-warning shadow-hard-intent-warning', icon: 'text-intent-warning', title: 'text-intent-warning' },
      danger: { root: 'border-intent-danger shadow-hard-intent-danger', icon: 'text-intent-danger', title: 'text-intent-danger' },
    },
  },
  defaultVariants: { intent: 'info' },
});

/**
 * The icon per intent, paired with colour exactly as `NoteBlock` pairs them —
 * so the same colour never wears two different icons across the two
 * components. The icon is what carries the intent for a reader who cannot
 * tell the colours apart.
 */
const ICON = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  danger: AlertTriangle,
} as const;

const ToastContext = createContext<ToastApi | null>(null);

let counter = 0;
function nextId(): string {
  counter += 1;
  return `ds-toast-${counter}`;
}

/** One toast. Unexported: toasts are created with `useToast().show`, not rendered. */
function ToastItem({ item }: { item: BaseToast.Root.ToastObject<ToastData> }) {
  const intent = item.data?.intent ?? 'info';
  const action = item.data?.action;
  const styles = toast({ intent });
  const Icon = ICON[intent];
  // A `danger` toast is announced by the `role="alert"` copy Base UI renders
  // beside the region, so its visible text must not *also* be read by the
  // polite region it sits in. Base UI solves that by hiding the whole root
  // until it is focused — which hides the action and the dismiss control
  // with it, and no `aria-hidden={false}` on a descendant can undo an
  // ancestor's. The result is tabbable buttons the tree says are not there.
  //
  // So the root stays exposed, and only the danger toast's text is hidden.
  // The buttons are reachable; the words are announced once, assertively;
  // and focusing the toast still reads its title and description, because
  // `aria-labelledby` and `aria-describedby` name from hidden content.
  const textHidden = intent === 'danger' ? true : undefined;

  return (
    <BaseToast.Root
      toast={item}
      aria-hidden={intent === 'danger' ? false : undefined}
      data-slot="toast"
      // What the toast *is*, on the element, for a test or a consumer's
      // selector — the classes are a rendering detail.
      data-intent={intent}
      className={styles.root()}
    >
      <Icon aria-hidden="true" data-slot="toast-icon" className={styles.icon()} />
      <div data-slot="toast-content" className={styles.content()}>
        {/*
          * `<p>`, not Base UI's default `<h2>`: a notification is not a section
          * of the page, and a heading here would drop into the document outline
          * wherever the toast happened to be read. The brackets are the
          * system's typographic cue and nothing a screen reader should spell.
          */}
        <BaseToast.Title
          data-slot="toast-title"
          aria-hidden={textHidden}
          className={styles.title()}
          render={<p />}
        >
          <span aria-hidden="true">[ </span>
          {item.title}
          <span aria-hidden="true"> ]</span>
        </BaseToast.Title>
        {item.description ? (
          <BaseToast.Description
            data-slot="toast-description"
            aria-hidden={textHidden}
            className={styles.description()}
          />
        ) : null}
        {/*
          * The action sits under the text rather than beside it: beside it, a
          * `Button` takes a third of a 384px toast and wraps the description
          * into a column of three words a line. Below it, it is also where Tab
          * lands next after the toast itself, before the dismiss control.
          */}
        {action ? (
          <div data-slot="toast-actions" className={styles.actions()}>
            <BaseToast.Action
              data-slot="toast-action"
              render={
                <Button size="sm" bracketed>
                  {action.label}
                </Button>
              }
            />
          </div>
        ) : null}
      </div>
      {/*
        * `aria-hidden={false}` overrides Base UI, which hides the close
        * control from assistive technology until the stack is hovered or
        * focused, to keep "Dismiss" out of the announcement. That leaves a
        * tabbable button hidden from the tree — axe's `aria-hidden-focus` —
        * and unreachable to a screen reader's virtual cursor, which is how
        * most screen-reader users would look for it. Four extra words in a
        * polite announcement is the cheaper of the two costs.
        */}
      <BaseToast.Close
        data-slot="toast-close"
        aria-hidden={false}
        aria-label="Dismiss notification"
        className={styles.close()}
      >
        &times;
      </BaseToast.Close>
    </BaseToast.Root>
  );
}

function ToastList() {
  const { toasts } = BaseToast.useToastManager<ToastData>();
  return toasts.map((item) => <ToastItem key={item.id} item={item} />);
}

/**
 * Transient notifications — a queue, a live region and a lifetime.
 *
 * Mount one near the root of the application. Anything below it calls
 * {@link useToast} and `show()`s a toast; nothing renders a toast directly,
 * because a toast is not a place in the layout. It is not a `Card` with
 * `position: absolute` either, and the difference is the whole component:
 *
 * ## The live region exists before anything is in it
 *
 * The provider renders its region on mount, empty. A live region inserted at
 * the same moment as its content announces nothing, so a toast system that
 * creates its container when the first toast fires has a first toast nobody
 * hears. `info`, `success` and `warning` are announced politely from that
 * region. `danger` is assertive: it is copied into a `role="alert"` — the one
 * role defined to announce on insertion — so it interrupts, and it is marked
 * hidden in the polite region so it is not read twice.
 *
 * ## The lifetime yields to the reader
 *
 * Every timer pauses while the pointer is over the stack or focus is inside
 * it, and resumes when both leave — so a toast cannot expire while it is
 * being read, or out from under the pointer on its way to the action. The
 * default lifetime is a floor that long text raises, and a toast with an action
 * does not expire at all unless the caller says it should. F6 moves focus
 * into the stack from anywhere on the page, and Tab moves through the toasts
 * and their controls; Escape dismisses the focused one.
 *
 * ## The queue
 *
 * Several toasts at once stack newest first. Past `limit` the oldest are held
 * back — hidden and inert, not discarded — and return as the ones ahead of
 * them close.
 *
 * All of the above is `@base-ui/react/toast`, and this file is its only
 * wrapper: the surface, the intents and the lifetime policy are this
 * package's, the queue, timers and announcements are the primitive's.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * const toast = useToast();
 * toast.show({ intent: 'success', title: 'Saved', description: 'Draft saved 12:04.' });
 * ```
 */
export const ToastProvider = forwardRef<HTMLDivElement, ToastProviderProps>(function ToastProvider(
  { children, timeout = DEFAULT_TIMEOUT, limit = 3, label = 'Notifications', className, ...props },
  ref,
) {
  const styles = toast();

  const portalTheme = usePortalThemeAttribute();
  return (
    <BaseToast.Provider timeout={timeout} limit={limit}>
      <ToastBridge timeout={timeout}>{children}</ToastBridge>
      <BaseToast.Portal {...portalTheme}>
        <BaseToast.Viewport
          ref={ref}
          aria-label={label}
          data-slot="toast-viewport"
          className={styles.viewport({ class: className })}
          {...props}
        >
          <ToastList />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
});

/**
 * Publishes {@link ToastApi} to everything below the provider.
 *
 * The API talks to the provider's store directly, through Base UI's
 * `useToastManager`, rather than through a `createToastManager()` handed to
 * the provider. That manager is an event emitter the provider subscribes to in
 * an effect — and a child's effects run before its parent's, so a component
 * that shows a toast on mount ("Signed in", "Draft restored") would emit into
 * a manager nobody was listening to yet, and the toast would silently never
 * appear. The store exists from the provider's first render, so this path has
 * no such window.
 *
 * `add` and `close` are stable store methods, so the API object only changes
 * when the provider's `timeout` does.
 */
function ToastBridge({ timeout, children }: { timeout: number; children?: ReactNode }) {
  const { add, close } = BaseToast.useToastManager<ToastData>();

  const api = useMemo<ToastApi>(
    () => ({
      show(options) {
        const id = options.id ?? nextId();
        const intent = options.intent ?? 'info';
        const { action } = options;
        add({
          id,
          title: options.title,
          description: options.description,
          type: intent,
          // Base UI's two priorities are the two politeness levels.
          priority: intent === 'danger' ? 'high' : 'low',
          timeout: resolveLifetime(options, timeout),
          onClose: options.onClose,
          data: { intent, action },
          actionProps: action
            ? {
                onClick: () => {
                  action.onClick();
                  close(id);
                },
              }
            : undefined,
        });
        return id;
      },
      dismiss(id) {
        close(id);
      },
    }),
    [add, close, timeout],
  );

  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}

/**
 * Show and dismiss toasts. Throws outside a {@link ToastProvider}: a
 * notification with nowhere to be announced is a bug to find at the call site,
 * not a silent no-op to find in production.
 */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be called inside a <ToastProvider>.');
  return api;
}

/**
 * The same API, or `null` when there is no provider — for a component that
 * notifies when it can and renders regardless, like the finance console's
 * sync button in `SaaS/AdminDashboard`. Matches `useOptionalTheme`.
 */
export function useOptionalToast(): ToastApi | null {
  return useContext(ToastContext);
}
